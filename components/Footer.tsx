"use client";

import Link from 'next/link';
import Logo from '@/components/Logo';
import {
  APP_TITLE,
  FOOTER_TAGLINE,
  CONTACT_ADDRESS,
  CONTACT_PHONE_DISPLAY,
  WHATSAPP_LINK,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  TIKTOK_URL,
  SNAPCHAT_URL,
} from '@/lib/brand';
import { useCMS } from '@/context/CMSContext';

const SHOP_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Categories', href: '/categories' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
];

const HELP_LINKS = [
  { label: 'Contact', href: '/contact' },
  { label: 'Track Order', href: '/order-tracking' },
  { label: 'Affiliate Program', href: '/affiliate' },
  { label: 'Shipping', href: '/shipping' },
  { label: 'Returns & refunds', href: '/returns' },
  { label: 'FAQs', href: '/faqs' },
];

const LEGAL_LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

export default function Footer() {
  const { getSetting } = useCMS();

  const siteName = getSetting('site_name') || APP_TITLE;
  const contactPhone = getSetting('contact_phone') || CONTACT_PHONE_DISPLAY;
  const contactAddress = getSetting('contact_address') || CONTACT_ADDRESS;
  const socialInstagram = getSetting('social_instagram') || INSTAGRAM_URL;
  const socialTiktok = getSetting('social_tiktok') || TIKTOK_URL;
  const socialSnapchat = getSetting('social_snapchat') || SNAPCHAT_URL;
  const phoneHref = `tel:${contactPhone.replace(/\s/g, '')}`;

  return (
    <footer className="mt-10 border-t border-brand-nude/40 glass-panel pb-24 lg:pb-8 rounded-t-[3rem] mx-2 sm:mx-4 lg:mx-8 mb-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Brand row */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="shrink-0" aria-label={`${siteName} — home`}>
              <Logo className="h-9 sm:h-10 w-auto max-w-[160px]" />
            </Link>
            <p className="text-sm sm:text-base text-brand-cocoa/80 font-medium leading-snug line-clamp-3 sm:max-w-sm">
              {FOOTER_TAGLINE}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={socialInstagram}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl glass flex items-center justify-center text-brand-espresso hover:bg-brand-espresso hover:text-white transition-all shadow-glass hover:shadow-glass-hover hover:-translate-y-1"
              aria-label="Instagram"
            >
              <i className="ri-instagram-line text-lg" />
            </a>
            <a
              href={socialTiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl glass flex items-center justify-center text-brand-espresso hover:bg-brand-espresso hover:text-white transition-all shadow-glass hover:shadow-glass-hover hover:-translate-y-1"
              aria-label="TikTok"
            >
              <i className="ri-tiktok-line text-lg" />
            </a>
            <a
              href={socialSnapchat}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl glass flex items-center justify-center text-brand-espresso hover:bg-brand-espresso hover:text-white transition-all shadow-glass hover:shadow-glass-hover hover:-translate-y-1"
              aria-label="Snapchat"
            >
              <i className="ri-snapchat-line text-lg" />
            </a>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-xl glass flex items-center justify-center text-brand-espresso hover:bg-brand-espresso hover:text-white transition-all shadow-glass hover:shadow-glass-hover hover:-translate-y-1"
              aria-label="WhatsApp"
            >
              <i className="ri-whatsapp-line text-lg" />
            </a>
            <a
              href={phoneHref}
              className="w-10 h-10 rounded-xl glass flex items-center justify-center text-brand-espresso hover:bg-brand-espresso hover:text-white transition-all shadow-glass hover:shadow-glass-hover hover:-translate-y-1"
              aria-label="Call us"
            >
              <i className="ri-phone-line text-lg" />
            </a>
            <Link
              href="/admin/login"
              className="w-10 h-10 rounded-xl glass flex items-center justify-center text-brand-espresso hover:bg-brand-espresso hover:text-white transition-all shadow-glass hover:shadow-glass-hover hover:-translate-y-1"
              aria-label="Admin login"
              title="Admin"
            >
              <i className="ri-shield-user-line text-lg" />
            </Link>
          </div>
        </div>

        {/* Links — 3 compact columns on mobile */}
        <nav
          className="mt-6 grid grid-cols-3 gap-x-4 gap-y-5 sm:mt-8 sm:gap-x-8"
          aria-label="Footer navigation"
        >
          <div>
            <p className="text-xs font-semibold text-brand-mauve mb-2.5">Shop</p>
            <ul className="space-y-1.5">
              {SHOP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-brand-cocoa/80 hover:text-brand-espresso transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-mauve mb-2.5">Help</p>
            <ul className="space-y-1.5">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-brand-cocoa/80 hover:text-brand-espresso transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-mauve mb-2.5">Legal</p>
            <ul className="space-y-1.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-brand-cocoa/80 hover:text-brand-espresso transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Contact — single compact row */}
        <div className="mt-6 pt-5 border-t border-brand-nude/50 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-1 text-xs text-brand-cocoa/70">
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <i className="ri-map-pin-line text-brand-espresso shrink-0" />
            <span className="truncate">{contactAddress}</span>
          </span>
          <a href={phoneHref} className="inline-flex items-center gap-1.5 hover:text-brand-espresso transition-colors">
            <i className="ri-phone-line text-brand-espresso shrink-0" />
            {contactPhone}
          </a>
          <a
            href={socialInstagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 hover:text-brand-espresso transition-colors"
          >
            <i className="ri-instagram-line text-brand-espresso shrink-0" />
            {INSTAGRAM_HANDLE}
          </a>
        </div>

        {/* Copyright */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-[11px] text-brand-cocoa/55">
          <p>&copy; {new Date().getFullYear()} {siteName}</p>
          <p className="font-display font-medium italic text-brand-espresso/80 text-sm">Trending lifestyle. Import plug.</p>
        </div>
      </div>
    </footer>
  );
}
