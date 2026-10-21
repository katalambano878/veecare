import Link from 'next/link';
import type { ReactNode } from 'react';
import { cedis } from '@/lib/admin-fetch';

export function Stat({ label, value, hint }: { label: string; value: string; hint?: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-2 text-2xl font-bold text-brand-cocoa tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function Channel({
  label,
  icon,
  revenue,
  orders,
  tone,
}: {
  label: string;
  icon: string;
  revenue: number;
  orders: number;
  tone: 'dark' | 'light';
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone === 'dark' ? 'bg-brand-berry text-white' : 'bg-brand-blush text-brand-cocoa'}`}
      >
        <i className={icon} />
      </span>
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="font-bold text-brand-cocoa tabular-nums">{cedis(revenue)}</p>
        <p className="text-xs text-gray-500">
          {orders} paid order{orders === 1 ? '' : 's'}
        </p>
      </div>
    </div>
  );
}

export function Todo({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const content = (
    <span className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <span className="font-semibold text-brand-cocoa tabular-nums">{value}</span>
    </span>
  );
  return (
    <li>
      {href ? (
        <Link href={href} className="block hover:text-brand-berry">
          {content}
        </Link>
      ) : (
        content
      )}
    </li>
  );
}

export function Card({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const hasContent = Array.isArray(children) ? children.some(Boolean) : Boolean(children);
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm break-inside-avoid">
      <h2 className="font-semibold text-brand-cocoa mb-3">{title}</h2>
      {hasContent ? children : <p className="py-6 text-center text-sm text-gray-500">{empty}</p>}
    </div>
  );
}
