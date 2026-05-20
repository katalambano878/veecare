'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCMS } from '@/context/CMSContext';
import PageHero from '@/components/PageHero';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  APP_TITLE,
  CONTACT_ADDRESS,
  CONTACT_PHONE_DISPLAY,
  WHATSAPP_LINK,
  LOGO_PATH,
} from '@/lib/brand';

export default function AboutPage() {
  usePageTitle('Our Story');
  const { getSetting } = useCMS();
  const [activeTab, setActiveTab] = useState('story');

  const siteName = getSetting('site_name') || APP_TITLE;

  const values = [
    {
      title: 'Curated Finds',
      description:
        'Every piece is handpicked for modern style: fashion, bags, accessories, and lifestyle favorites chosen with a trendy eye.',
    },
    {
      title: 'Imported Picks',
      description:
        'Access stylish imports and trending arrivals you will not see everywhere. Fresh drops for everyday glam.',
    },
    {
      title: 'Modern Femininity',
      description:
        'A brand built for women who love soft glam, confidence, and aspirational lifestyle culture.',
    },
    {
      title: 'Delivered With Care',
      description: `Based in ${CONTACT_ADDRESS}, we serve fashion and lifestyle lovers across Ghana with friendly, reliable service.`,
    },
  ];

  const tabActive = 'text-brand-espresso border-b-4 border-brand-mauve font-bold';
  const tabIdle = 'text-brand-cocoa/60 hover:text-brand-espresso';

  return (
    <div className="min-h-screen bg-brand-cream">
      <PageHero
        title="More Than A Brand"
        subtitle="A trendy lifestyle import destination. Feminine, modern, and curated for stylish everyday living."
      />

      <section className="py-20 bg-brand-cream overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-display text-brand-espresso mb-6 tracking-tight">Who We Are</h2>
              <div className="space-y-4 text-lg text-brand-cocoa/80 leading-relaxed font-light">
                <p>
                  <strong className="text-brand-espresso">{siteName}</strong> is your fashion and lifestyle import
                  plug. A modern social commerce brand for trendy women who want stylish finds, accessories, and
                  aspirational everyday glam.
                </p>
                <p>
                  We are not a generic marketplace or thrift vibe. Every collection feels curated, fresh, and
                  designed to make you feel like you always have access to the best imported lifestyle products.
                </p>
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
                <p className="text-sm text-brand-cocoa/60 font-light mt-1">Fashion &amp; lifestyle finds</p>
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
              <div className="space-y-6 text-lg text-brand-cocoa/80 leading-relaxed font-light">
                <p>
                  <strong className="text-brand-espresso">{siteName}</strong> began with a simple idea: make stylish
                  imported fashion and lifestyle products feel accessible, exciting, and personal, like shopping your
                  favorite creator&apos;s picks.
                </p>
                <p>
                  From statement accessories and bags to lifestyle favorites and special imported arrivals, we build
                  collections around what&apos;s trending and what our community loves.
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
                  <p className="text-brand-nude/90 text-sm tracking-wide">
                    Fashion · Lifestyle · Imported finds
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
              <p className="text-brand-cocoa/80 text-lg leading-relaxed font-light">
                We bring together fashion picks, accessories, lifestyle products, and imported finds in one stylish
                shopping experience. Always fresh, always curated.
              </p>
            </div>
            <div className="bg-brand-nude/30 p-10 rounded-3xl border border-brand-nude">
              <h3 className="text-3xl font-display text-brand-espresso mb-4">Community First</h3>
              <p className="text-brand-cocoa/80 text-lg leading-relaxed font-light">
                We grow with our customers, sharing trending arrivals, exclusive updates, and lifestyle favorites
                that feel social, modern, and genuinely exciting.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white py-24 border-y border-brand-nude">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display text-brand-espresso mb-4">Why Shop With Us?</h2>
            <p className="text-xl text-brand-cocoa/70 max-w-2xl mx-auto font-light">
              Stylish finds, imported energy, and a shopping experience built for modern everyday glam.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-brand-cream p-8 rounded-2xl border border-brand-nude hover:shadow-soft transition-all duration-300 hover:-translate-y-1"
              >
                <h3 className="text-xl font-display text-brand-espresso mb-3">{value.title}</h3>
                <p className="text-brand-cocoa/75 leading-relaxed font-light">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-brand-espresso py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-brand-cream">
          <h2 className="text-4xl md:text-5xl font-display mb-8">Ready to explore?</h2>
          <p className="text-xl text-brand-nude/90 mb-10 leading-relaxed max-w-2xl mx-auto font-light">
            Discover trending fashion, accessories, and imported lifestyle picks curated for you.
          </p>
          <Link href="/shop" className="btn-luxury-primary text-base px-10 py-4 inline-flex items-center">
            Shop Collection
          </Link>
        </div>
      </div>
    </div>
  );
}
