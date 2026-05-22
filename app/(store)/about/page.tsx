'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCMS } from '@/context/CMSContext';
import PageHero from '@/components/PageHero';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  APP_TITLE,
  BRAND_INTRO,
  BRAND_INTRO_SECONDARY,
  CONTACT_ADDRESS,
  CONTACT_PHONE_DISPLAY,
  WHATSAPP_LINK,
  LOGO_PATH,
  TAGLINE,
} from '@/lib/brand';

export default function AboutPage() {
  usePageTitle('Our Story');
  const { getSetting } = useCMS();
  const [activeTab, setActiveTab] = useState('story');

  const siteName = getSetting('site_name') || APP_TITLE;

  const values = [
    {
      title: 'Trending Lifestyle',
      description:
        'We track what is hot: fashion, bags, accessories, beauty, and everyday picks, so your cart always feels current.',
    },
    {
      title: 'Import Plug',
      description:
        'Sourced arrivals and special imports you will not find on every corner. Fresh drops, bold energy, real curation.',
    },
    {
      title: 'Home & Living',
      description:
        'Home appliances and lifestyle essentials alongside style: one destination for how you dress and how you live.',
    },
    {
      title: 'Delivered With Care',
      description: `Based in ${CONTACT_ADDRESS}, we serve shoppers across Ghana with friendly, reliable service, with no gatekeeping.`,
    },
  ];

  const tabActive = 'text-brand-espresso border-b-4 border-brand-mauve font-bold';
  const tabIdle = 'text-brand-cocoa/60 hover:text-brand-espresso';

  return (
    <div className="min-h-screen bg-brand-cream">
      <PageHero
        title="More Than A Brand"
        subtitle={TAGLINE}
      />

      <section className="py-20 bg-brand-cream overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display text-brand-espresso mb-6 tracking-tight">Who We Are</h2>
              <div className="space-y-5 brand-body">
                <p>{BRAND_INTRO.replace('Upscale Vintage', siteName)}</p>
                <p>{BRAND_INTRO_SECONDARY}</p>
                <div className="pt-4">
                  <Link
                    href="#our-story"
                    className="inline-flex items-center text-brand-espresso font-medium hover:text-brand-mauve transition-colors group"
                  >
                    <span className="border-b border-transparent group-hover:border-brand-mauve transition-colors">
                      Read our full story
                    </span>
                  </Link>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-soft relative bg-brand-nude/40 border border-brand-nude">
                <img src={LOGO_PATH} alt={siteName} className="w-full h-full object-contain p-8" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-luxury max-w-xs border border-brand-nude">
                <p className="font-display text-brand-espresso">Trending style</p>
                <p className="text-sm text-brand-cocoa/80 font-medium mt-1">Lifestyle · Imports · Appliances</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div id="our-story" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex border-b border-brand-nude mb-12 justify-center">
          <button
            onClick={() => setActiveTab('story')}
            className={`px-4 py-2 sm:px-8 sm:py-4 font-medium transition-colors text-lg cursor-pointer ${
              activeTab === 'story' ? tabActive : tabIdle
            }`}
          >
            Our Story
          </button>
          <button
            onClick={() => setActiveTab('mission')}
            className={`px-4 py-2 sm:px-8 sm:py-4 font-medium transition-colors text-lg cursor-pointer ${
              activeTab === 'mission' ? tabActive : tabIdle
            }`}
          >
            Our Mission
          </button>
        </div>

        {activeTab === 'story' && (
          <div className="grid md:grid-cols-2 gap-16 items-center animate-fade-in-up">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-brand-espresso mb-6 tracking-tight">
                How It All Started
              </h2>
              <div className="space-y-6 brand-body">
                <p>
                  <strong className="font-semibold text-brand-espresso">{siteName}</strong> began with a simple idea:
                  make trending lifestyle and import-ready products feel accessible, exciting, and personal, like
                  shopping your favorite creator&apos;s picks, open to everyone.
                </p>
                <p>
                  From fashion and bags to home appliances, accessories, and special imports, we build collections
                  around what is trending and what our community asks for next.
                </p>
                <p>
                  Reach us on <strong>{CONTACT_PHONE_DISPLAY}</strong> or{' '}
                  <a href={WHATSAPP_LINK} className="text-brand-mauve hover:underline font-medium">
                    WhatsApp
                  </a>
                  . We&apos;re here for orders, styling questions, and updates on new drops.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-luxury-lg bg-brand-nude/30 relative flex items-center justify-center border border-brand-nude">
                <img src={LOGO_PATH} alt={siteName} className="w-2/3 h-auto object-contain" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-brand-espresso/85 to-transparent p-8">
                  <p className="text-brand-cream font-display text-xl">{siteName}</p>
                  <p className="text-brand-nude/90 text-sm font-medium tracking-wide">
                    Trending lifestyle · Import plug · Home appliances
                  </p>
                </div>
              </div>
              <div className="absolute -z-10 top-10 -right-10 w-full h-full border-2 border-brand-mauve/20 rounded-3xl hidden md:block" />
            </div>
          </div>
        )}

        {activeTab === 'mission' && (
          <div className="grid md:grid-cols-2 gap-12 animate-fade-in-up">
            <div className="bg-white p-10 rounded-3xl border border-brand-nude shadow-sm">
              <h3 className="text-3xl font-display text-brand-espresso mb-4">Curated For You</h3>
              <p className="brand-body">
                We bring together trending lifestyle picks, import-ready arrivals, home appliances, fashion, and
                accessories in one bold shopping experience. Always fresh, always curated.
              </p>
            </div>
            <div className="bg-brand-nude/30 p-10 rounded-3xl border border-brand-nude">
              <h3 className="text-3xl font-display text-brand-espresso mb-4">Community First</h3>
              <p className="brand-body">
                We grow with our community, sharing drops, exclusive updates, and lifestyle favorites that feel
                social, modern, and genuinely exciting for every shopper.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white py-24 border-y border-brand-nude">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display text-brand-espresso mb-4">Why Shop With Us?</h2>
            <p className="brand-body-lg max-w-2xl mx-auto text-center">
              Two jobs, one brand: trending lifestyle curation and your import plug, plus home appliances when you
              need them.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-brand-cream p-8 rounded-2xl border border-brand-nude hover:shadow-soft transition-all duration-300 hover:-translate-y-1"
              >
                <h3 className="text-xl font-display text-brand-espresso mb-3">{value.title}</h3>
                <p className="brand-body text-base">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-brand-espresso py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-brand-cream">
          <h2 className="text-4xl md:text-5xl font-display mb-8">Ready to explore?</h2>
          <p className="brand-body-lg text-brand-nude/95 mb-10 max-w-2xl mx-auto text-center">
            Discover trending lifestyle, import-ready picks, home appliances, fashion, and accessories, curated for
            you.
          </p>
          <Link href="/shop" className="btn-luxury-primary text-base px-10 py-4 inline-flex items-center">
            Shop Collection
          </Link>
        </div>
      </div>
    </div>
  );
}
