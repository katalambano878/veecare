/** Shared ecommerce analytics types. Meta and future pixels consume these. */

export const STORE_CURRENCY = 'GHS' as const;

export type AnalyticsCurrency = typeof STORE_CURRENCY | string;

export type MetaStandardEvent =
  | 'PageView'
  | 'ViewContent'
  | 'AddToCart'
  | 'InitiateCheckout'
  | 'Purchase';

export type CapiClientEvent = 'ViewContent' | 'AddToCart' | 'InitiateCheckout';

export type AnalyticsContent = {
  id: string;
  quantity: number;
  item_price: number;
};

export type ProductViewPayload = {
  content_ids: string[];
  content_name: string;
  content_type: 'product';
  value: number;
  currency: AnalyticsCurrency;
};

export type AddToCartPayload = ProductViewPayload & {
  quantity: number;
  contents: AnalyticsContent[];
};

export type CheckoutPayload = {
  content_ids: string[];
  contents: AnalyticsContent[];
  num_items: number;
  value: number;
  currency: AnalyticsCurrency;
};

export type PurchasePayload = CheckoutPayload & {
  order_id: string;
};

export type AttributionSnapshot = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
  landing_page: string | null;
  referrer: string | null;
  user_agent: string | null;
  captured_at: string | null;
};

export type OrderAttributionMeta = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
  landing_page?: string;
  referrer?: string;
  user_agent?: string;
  marketing_consent?: boolean;
};
