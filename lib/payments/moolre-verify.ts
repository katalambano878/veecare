/**
 * Server-side Moolre status check (never trust browser redirects alone).
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

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    const checkResponse = await fetch('https://api.moolre.com/embed/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-USER': process.env.MOOLRE_API_USER,
        'X-API-PUBKEY': process.env.MOOLRE_API_PUBKEY,
      },
      body: JSON.stringify({ externalref: externalRef }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const checkResult = await checkResponse.json();
    const statusStr = String(checkResult.data?.status || '').toLowerCase();
    let verified =
      checkResult.status === 1 &&
      !!checkResult.data &&
      (statusStr === 'success' ||
        statusStr === 'successful' ||
        statusStr === 'completed' ||
        statusStr === 'paid');

    const amount =
      checkResult.data?.amount != null ? parseFloat(String(checkResult.data.amount)) : null;

    if (verified && amount != null && Math.abs(amount - expectedAmount) > 0.01) {
      verified = false;
      return {
        verified: false,
        amount,
        rawStatus: statusStr,
        error: 'amount_mismatch',
      };
    }

    return { verified, amount, rawStatus: statusStr || null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'moolre_status_failed';
    return { verified: false, amount: null, rawStatus: null, error: message };
  }
}
