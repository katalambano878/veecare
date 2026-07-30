import { isSupabaseConfigured } from '@/lib/supabase-config';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function getEnabledModuleIds(): Promise<string[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabaseAdmin
        .from('store_modules')
        .select('id')
        .eq('enabled', true);

    if (error) {
        console.error('[store-modules] fetch failed:', error.message);
        return [];
    }

    return ((data ?? []) as { id: string }[]).map((row) => row.id);
}

export async function isStoreModuleEnabled(moduleId: string): Promise<boolean> {
    const enabled = await getEnabledModuleIds();
    return enabled.includes(moduleId);
}
