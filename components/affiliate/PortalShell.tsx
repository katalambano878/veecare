'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

const NAV = [
  { href: '/affiliate/dashboard', label: 'Dashboard', icon: 'ri-dashboard-line' },
  { href: '/affiliate/products', label: 'Products', icon: 'ri-store-2-line' },
  { href: '/affiliate/links', label: 'My Links', icon: 'ri-links-line' },
  { href: '/affiliate/orders', label: 'Orders', icon: 'ri-shopping-bag-3-line' },
  { href: '/affiliate/earnings', label: 'Earnings', icon: 'ri-wallet-3-line' },
  { href: '/affiliate/payouts', label: 'Payouts', icon: 'ri-bank-card-line' },
  { href: '/affiliate/profile', label: 'Profile', icon: 'ri-user-3-line' },
];

export default function PortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/affiliate/me')
      .then((res) => {
        if (res.status === 401) {
          router.replace('/affiliate');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.affiliate) {
          setName(data.affiliate.name);
          setStatus(data.affiliate.status);
          setReady(true);
        }
      })
      .catch(() => router.replace('/affiliate'));
  }, [router]);

  const logout = async () => {
    await fetch('/api/affiliate/auth/logout', { method: 'POST' });
    router.replace('/affiliate');
  };

  if (!ready) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-brand-cocoa/70">
        Loading portal…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-cocoa/60">Reseller portal</p>
            <h1 className="text-xl font-semibold text-brand-espresso">{name}</h1>
            <p className="text-xs text-brand-cocoa/70 capitalize">{status}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-sm font-medium text-brand-mauve hover:text-brand-espresso"
          >
            Sign out
          </button>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 mb-6">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium ${
                  active
                    ? 'bg-brand-espresso text-white'
                    : 'bg-white text-brand-cocoa border border-brand-nude/70'
                }`}
              >
                <i className={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
    </div>
  );
}
