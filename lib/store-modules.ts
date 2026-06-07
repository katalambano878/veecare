import { createClient } from '@supabase/supabase-js';
import { getPublicSupabaseCredentials, isSupabaseConfigured } from '@/lib/supabase-config';

export async function getEnabledModuleIds(): Promise<string[]> {
    if (!isSupabaseConfigured()) return [];

    const { url, anonKey } = getPublicSupabaseCredentials();
    const supabase = createClient(url, anonKey);

    const { data, error } = await supabase
        .from('store_modules')
        .select('id')
        .eq('enabled', true);

    if (error) {
        console.error('[store-modules] fetch failed:', error.message);
        return [];
    }

    return (data ?? []).map((row) => row.id);
}

export async function isStoreModuleEnabled(moduleId: string): Promise<boolean> {
    const enabled = await getEnabledModuleIds();
    return enabled.includes(moduleId);
}
