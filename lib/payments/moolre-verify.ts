/**
 * Server-side Moolre status check (never trust browser redirects alone).
 * Docs: POST https://api.moolre.com/open/transact/status
 */

export type MoolreStatusResult = {
  verified: boolean;
  amount: number | null;
  rawStatus: string | null;
  error?: string;
};

export async function verifyMoolreExternalRef(
  externalRef: string,
  expectedAmount: number
): Promise<MoolreStatusResult> {
  if (!process.env.MOOLRE_API_USER || !process.env.MOOLRE_API_PUBKEY) {
    return { verified: false, amount: null, rawStatus: null, error: 'missing_credentials' };
  }
  if (!process.env.MOOLRE_ACCOUNT_NUMBER) {
    return { verified: false, amount: null, rawStatus: null, error: 'missing_account' };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    const checkResponse = await fetch('https://api.moolre.com/open/transact/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-USER': process.env.MOOLRE_API_USER,
        'X-API-PUBKEY': process.env.MOOLRE_API_PUBKEY,
      },
      body: JSON.stringify({
        type: 1,
        idtype: '1',
        id: externalRef,
        accountnumber: process.env.MOOLRE_ACCOUNT_NUMBER,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const contentType = checkResponse.headers.get('content-type') || '';
    const rawText = await checkResponse.text();
    if (!contentType.includes('application/json')) {
      return {
        verified: false,
        amount: null,
        rawStatus: null,
        error: `non_json_status_http_${checkResponse.status}`,
      };
    }

    let checkResult: any;
    try {
      checkResult = JSON.parse(rawText);
    } catch {
      return { verified: false, amount: null, rawStatus: null, error: 'invalid_json_status' };
    }

    // Success: status=1 and data.txstatus=1 (also accept legacy data.status strings)
    const txStatus = checkResult.data?.txstatus ?? checkResult.data?.txtstatus;
    const statusStr = String(checkResult.data?.status || '').toLowerCase();
    let verified =
      checkResult.status === 1 &&
      !!checkResult.data &&
      (txStatus === 1 ||
        txStatus === '1' ||
        statusStr === 'success' ||
        statusStr === 'successful' ||
        statusStr === 'completed' ||
        statusStr === 'paid');

    const amount =
      checkResult.data?.amount != null ? parseFloat(String(checkResult.data.amount)) : null;

    if (verified && amount != null && Math.abs(amount - expectedAmount) > 0.01) {
      return {
        verified: false,
        amount,
        rawStatus: String(txStatus ?? statusStr || ''),
        error: 'amount_mismatch',
      };
    }

    return {
      verified,
      amount,
      rawStatus: String(txStatus ?? statusStr || checkResult.message || '') || null,
      error: verified ? undefined : String(checkResult.message || checkResult.code || 'not_paid'),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'moolre_status_failed';
    return { verified: false, amount: null, rawStatus: null, error: message };
  }
}
