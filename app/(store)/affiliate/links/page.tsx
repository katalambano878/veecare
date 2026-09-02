'use client';

import { useEffect, useState } from 'react';
import PortalShell from '@/components/affiliate/PortalShell';
import { usePageTitle } from '@/hooks/usePageTitle';

type LinkRow = {
  id: string;
  url: string;
  pretty_url: string | null;
  product_name: string;
  status: string;
  click_count: number;
  orders: number;
  conversion_rate: number;
  revenue: number;
  earnings: number;
  created_at: string;
  selling_price: number | null;
};

function shareWhatsApp(url: string, name: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(`${name} ${url}`)}`, '_blank', 'noopener,noreferrer');
}

function shareFacebook(url: string) {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer');
}

export default function AffiliateLinksPage() {
  usePageTitle('My selling links');
  const [links, setLinks] = useState<LinkRow[]>([]);

  const load = () => {
    fetch('/api/affiliate/links')
      .then((res) => res.json())
      .then((data) => setLinks(data.links || []))
      .catch(() => undefined);
  };

  useEffect(() => {
    load();
  }, []);

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url);
  };

  const disable = async (id: string) => {
    await fetch('/api/affiliate/links', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    load();
  };

  return (
    <PortalShell>
      {links.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-nude/60 p-8 text-center text-brand-cocoa/70">
          Choose a product and generate your first selling link.
        </div>
      ) : (
        <div className="space-y-4">
          {links.map((link) => (
            <article key={link.id} className="bg-white rounded-xl border border-brand-nude/60 p-4 text-sm">
              <div className="flex justify-between gap-3 mb-2">
                <h2 className="font-semibold text-brand-espresso">{link.product_name}</h2>
                <span className="capitalize text-brand-cocoa/70">{link.status}</span>
              </div>
              <p className="break-all text-brand-cocoa/80">{link.url}</p>
              <p className="mt-2">Clicks {link.click_count} · Orders {link.orders} · Conv {link.conversion_rate}%</p>
              <p>Revenue GH₵{link.revenue.toFixed(2)} · Earnings GH₵{link.earnings.toFixed(2)}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <button type="button" className="px-3 py-2 rounded-lg bg-brand-nude/50" onClick={() => copy(link.url)}>
                  Copy
                </button>
                <button type="button" className="px-3 py-2 rounded-lg bg-brand-nude/50" onClick={() => shareWhatsApp(link.url, link.product_name)}>
                  WhatsApp
                </button>
                <button type="button" className="px-3 py-2 rounded-lg bg-brand-nude/50" onClick={() => shareFacebook(link.url)}>
                  Facebook
                </button>
                {typeof navigator !== 'undefined' && navigator.share && (
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg bg-brand-nude/50"
                    onClick={() => navigator.share({ title: link.product_name, url: link.url })}
                  >
                    Share
                  </button>
                )}
                {link.status === 'active' && (
                  <button type="button" className="px-3 py-2 rounded-lg text-red-700" onClick={() => disable(link.id)}>
                    Disable
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
