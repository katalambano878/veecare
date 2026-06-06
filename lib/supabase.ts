import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, resolvePublicSupabaseCredentials } from './supabase-config';

export { isSupabaseConfigured };

const { url, anonKey, configured } = resolvePublicSupabaseCredentials();

if (!configured && typeof window !== 'undefined') {
    console.warn(
        '[Supabase] No credentials in .env.local — UI only. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY for live data.'
    );
}

export const supabase = createClient(url, anonKey);
