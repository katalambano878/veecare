import 'server-only';

/**
 * Server-side Meta configuration. Access token never leaves this module's callers
 * except as an Authorization header to graph.facebook.com.
 */

export type MetaServerConfig = {
  pixelId: string;
  accessToken: string;
  datasetId: string;
  graphVersion: string;
  testEventCode: string | null;
};

function trimEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

export function getMetaServerConfig(): MetaServerConfig | null {
  const pixelId = trimEnv('META_PIXEL_ID') || trimEnv('NEXT_PUBLIC_META_PIXEL_ID');
  const accessToken = trimEnv('META_ACCESS_TOKEN');
  if (!pixelId || !accessToken) return null;

  const allowTest =
    process.env.NODE_ENV !== 'production' || process.env.META_ALLOW_TEST_EVENTS === 'true';
  const testCode = allowTest ? trimEnv('META_TEST_EVENT_CODE') : null;

  return {
    pixelId,
    accessToken,
    datasetId: trimEnv('META_DATASET_ID') || pixelId,
    graphVersion: trimEnv('META_GRAPH_API_VERSION') || 'v21.0',
    testEventCode: testCode,
  };
}

export function isMetaCapiConfigured(): boolean {
  return getMetaServerConfig() !== null;
}
