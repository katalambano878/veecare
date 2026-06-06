/** True when both URL and anon key are set in .env.local */
export function isSupabaseConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    return Boolean(url && anonKey);
}

export function getPublicSupabaseCredentials(): { url: string; anonKey: string } {
    return {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '',
    };
}

const DEV_PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const DEV_PLACEHOLDER_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

/**
 * Resolves credentials for the Supabase client.
 * When .env keys are missing, uses placeholders so the UI can load (no live data).
 */
export function resolvePublicSupabaseCredentials(): {
    url: string;
    anonKey: string;
    configured: boolean;
} {
    const { url, anonKey } = getPublicSupabaseCredentials();
    if (url && anonKey) {
        return { url, anonKey, configured: true };
    }
    return {
        url: DEV_PLACEHOLDER_URL,
        anonKey: DEV_PLACEHOLDER_ANON_KEY,
        configured: false,
    };
}
