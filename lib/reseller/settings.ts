import 'server-only';
import { supabaseAdmin } from '@/lib/supabase-admin';
import type { MarkupType } from './pricing';

export type ResellerSettings = {
  defaultMarkupRate: number;
  defaultMarkupType: MarkupType;
  attributionWindowDays: number;
  customPricingEnabled: boolean;
  affiliateSellingEnabled: boolean;
  minimumPayoutGhs: number;
  attributionPolicy: 'last_click';
};

export const DEFAULT_RESELLER_SETTINGS: ResellerSettings = {
  defaultMarkupRate: 10,
  defaultMarkupType: 'percentage',
  attributionWindowDays: 30,
  customPricingEnabled: false,
  affiliateSellingEnabled: true,
  minimumPayoutGhs: 50,
  attributionPolicy: 'last_click',
};

function asSettings(raw: unknown): ResellerSettings {
  const value = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    defaultMarkupRate:
      Number(value.defaultMarkupRate) > 0 ? Number(value.defaultMarkupRate) : DEFAULT_RESELLER_SETTINGS.defaultMarkupRate,
    defaultMarkupType: value.defaultMarkupType === 'fixed' ? 'fixed' : 'percentage',
    attributionWindowDays:
      Number(value.attributionWindowDays) > 0
        ? Math.min(365, Number(value.attributionWindowDays))
        : DEFAULT_RESELLER_SETTINGS.attributionWindowDays,
    customPricingEnabled: value.customPricingEnabled === true,
    affiliateSellingEnabled: value.affiliateSellingEnabled !== false,
    minimumPayoutGhs:
      Number(value.minimumPayoutGhs) >= 0 ? Number(value.minimumPayoutGhs) : DEFAULT_RESELLER_SETTINGS.minimumPayoutGhs,
    attributionPolicy: 'last_click',
  };
}

export async function getResellerSettings(): Promise<ResellerSettings> {
  const { data } = await supabaseAdmin
    .from('store_settings')
    .select('value')
    .eq('key', 'affiliate_reseller')
    .maybeSingle();
  return asSettings(data?.value);
}

export async function saveResellerSettings(incoming: Partial<ResellerSettings>): Promise<ResellerSettings> {
  const current = await getResellerSettings();
  const next = asSettings({ ...current, ...incoming });
  const { error } = await supabaseAdmin.from('store_settings').upsert(
    {
      key: 'affiliate_reseller',
      value: next,
      description: 'Affiliate reseller markup defaults',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );
  if (error) throw error;
  return next;
}
