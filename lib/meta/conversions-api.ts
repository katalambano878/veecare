import 'server-only';
import { getMetaServerConfig } from './config';
import { buildUserData, type RawUserData } from './user-data';
import type { MetaStandardEvent } from '@/lib/analytics/types';

const CAPI_TIMEOUT_MS = 4000;

export type CapiCustomData = {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  contents?: Array<{ id: string; quantity: number; item_price: number }>;
  num_items?: number;
  order_id?: string;
  quantity?: number;
};

export type CapiEventInput = {
  eventName: MetaStandardEvent;
  eventId: string;
  eventSourceUrl?: string | null;
  eventTime?: number;
  user: RawUserData;
  customData?: CapiCustomData;
  actionSource?: 'website';
};

export type CapiSendResult = {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  eventName: string;
  eventId: string;
};

function toUnix(eventTime?: number): number {
  if (eventTime && eventTime > 1_000_000_000 && eventTime < 10_000_000_000) {
    return Math.floor(eventTime);
  }
  return Math.floor(Date.now() / 1000);
}

export async function sendCapiEvent(input: CapiEventInput): Promise<CapiSendResult> {
  const config = getMetaServerConfig();
  if (!config) {
    return { ok: false, skipped: true, eventName: input.eventName, eventId: input.eventId };
  }

  const userData = buildUserData(input.user);
  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: toUnix(input.eventTime),
        event_id: input.eventId,
        action_source: input.actionSource || 'website',
        ...(input.eventSourceUrl ? { event_source_url: input.eventSourceUrl } : {}),
        user_data: userData,
        ...(input.customData && Object.keys(input.customData).length > 0
          ? { custom_data: input.customData }
          : {}),
      },
    ],
  };

  if (config.testEventCode) {
    payload.test_event_code = config.testEventCode;
  }

  const url = `https://graph.facebook.com/${config.graphVersion}/${encodeURIComponent(config.datasetId)}/events`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CAPI_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.accessToken}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const status = response.status;
    if (!response.ok) {
      let code: string | number | undefined;
      try {
        const body = (await response.json()) as { error?: { code?: number; message?: string } };
        code = body.error?.code;
      } catch {
        /* ignore parse */
      }
      console.error('[META_EVENT_FAILED]', {
        event: input.eventName,
        eventId: input.eventId,
        status,
        code,
      });
      return { ok: false, status, eventName: input.eventName, eventId: input.eventId };
    }

    console.info('[META_EVENT_SENT]', {
      event: input.eventName,
      eventId: input.eventId,
      status,
      channel: 'capi',
    });
    return { ok: true, status, eventName: input.eventName, eventId: input.eventId };
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    console.error('[META_EVENT_FAILED]', {
      event: input.eventName,
      eventId: input.eventId,
      status: aborted ? 408 : 0,
    });
    return { ok: false, status: aborted ? 408 : 0, eventName: input.eventName, eventId: input.eventId };
  } finally {
    clearTimeout(timer);
  }
}
