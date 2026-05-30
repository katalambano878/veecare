'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import PageHero from '@/components/PageHero';
import AboutBrandSection from '@/components/home/AboutBrandSection';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  APP_TITLE,
  BRAND_MISSION,
  BRAND_MOTTO,
  BRAND_VALUES,
  BRAND_VISION,
  CONTACT_PHONE_DISPLAY,
  DELIVERY_DAYS_DISPLAY,
  FOUNDER_STORY,
  NO_PICKUP_NOTICE,
  PRODUCT_FOCUS_AREAS,
  WHATSAPP_LINK,
} from '@/lib/brand';

export default function AboutPage() {
  usePageTitle('Our Story');
  const [activeTab, setActiveTab] = useState('story');

  const values = BRAND_VALUES.map((name) => ({
    title: name,
    description:
      name === 'Empowerment'
        ? 'Encouraging women to embrace their feminine energy with confidence and knowledge.'
        : name === 'Wellness'
          ? 'Holistic yoni health through safe, plant-based herbal care.'
          : name === 'Education'
            ? 'Honest information about feminine hygiene and overall health.'
            : name === 'Community'
              ? 'A strong, supportive space where women are uplifted and heard.'
              : 'Herbal products crafted with care, consistency, and respect for your body.',
  }));

  const tabActive = 'text-brand-cocoa border-b-4 border-brand-berry font-bold';
  const tabIdle = 'text-brand-cocoa/60 hover:text-brand-cocoa';

  return (
    <div className="min-h-screen bg-brand-ivory">
      <PageHero title="More Than A Brand" subtitle={BRAND_MOTTO} />

      <AboutBrandSection onAboutPage />

      <div id="our-story" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-brand-ivory">
        <div className="flex border-b border-brand-blush mb-12 justify-center">
          <button
            type="button"
            onClick={() => setActiveTab('story')}
            className={`px-4 py-2 sm:px-8 sm:py-4 font-medium transition-colors text-lg cursor-pointer ${
              activeTab === 'story' ? tabActive : tabIdle
            }`}
          >
            Founder&apos;s Story
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mission')}
            className={`px-4 py-2 sm:px-8 sm:py-4 font-medium transition-colors text-lg cursor-pointer ${
              activeTab === 'mission' ? tabActive : tabIdle
            }`}
          >
            Mission & Vision
          </button>
        </div>

        {activeTab === 'story' && (
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-start animate-fade-in-up">
            <div className="relative rounded-3xl overflow-hidden border border-brand-blush shadow-wellness bg-white">
              <Image
                src={FOUNDER_STORY.image}
                alt={FOUNDER_STORY.imageAlt}
                width={800}
                height={1000}
                className="w-full h-auto object-cover"
                priority
              />
            </div>
            <div>
              <span className="brand-eyebrow mb-4 inline-block">Founded 2024</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-brand-cocoa mb-6 tracking-tight">
                The {APP_TITLE} story
              </h2>
              <div className="space-y-6 brand-body">
                {FOUNDER_STORY.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
                <p className="font-display text-xl italic text-brand-berry/90 border-l-4 border-brand-rose pl-5">
                  {FOUNDER_STORY.journeyNote}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mission' && (
          <div className="space-y-10 animate-fade-in-up max-w-4xl mx-auto">
            <div className="bg-white p-8 sm:p-10 rounded-3xl border border-brand-blush shadow-wellness">
              <h3 className="text-2xl sm:text-3xl font-display text-brand-cocoa mb-4">Our Mission</h3>
              <p className="brand-body text-lg">{BRAND_MISSION}</p>
            </div>
            <div className="bg-brand-blush/40 p-8 sm:p-10 rounded-3xl border border-brand-blush">
              <h3 className="text-2xl sm:text-3xl font-display text-brand-cocoa mb-4">Our Vision</h3>
              <p className="brand-body text-lg">{BRAND_VISION}</p>
            </div>
            <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-white/60 text-center">
              <p className="brand-eyebrow mb-3">Our Motto</p>
              <p className="font-display text-2xl sm:text-3xl text-brand-cocoa italic leading-snug">
                &ldquo;{BRAND_MOTTO}&rdquo;
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-display text-brand-cocoa mb-6 text-center">Products & focus areas</h3>
              <ul className="grid sm:grid-cols-2 gap-4">
                {PRODUCT_FOCUS_AREAS.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-brand-blush/80"
                  >
                    <span className="w-2 h-2 rounded-full bg-brand-berry shrink-0" aria-hidden />
                    <span className="brand-body font-medium text-brand-cocoa">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="bg-brand-blush/30 border-y border-brand-blush py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-display text-brand-cocoa mb-4">Delivery & ordering</h2>
          <p className="brand-body mb-3">{NO_PICKUP_NOTICE}</p>
          <p className="brand-body-lg font-semibold text-brand-berry">
            Delivery days: {DELIVERY_DAYS_DISPLAY}
          </p>
          <p className="brand-body mt-4">
            Questions? Call <strong>{CONTACT_PHONE_DISPLAY}</strong> or{' '}
            <a href={WHATSAPP_LINK} className="text-brand-berry hover:underline font-medium">
              WhatsApp us
            </a>
            .
          </p>
        </div>
      </div>

      <div className="bg-white py-24 border-b border-brand-blush">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display text-brand-cocoa mb-4">Our Values</h2>
            <p className="brand-body-lg max-w-2xl mx-auto text-center">
              Empower · Guide · Quality — in every product and every conversation.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-brand-ivory p-6 rounded-2xl border border-brand-blush hover:shadow-wellness transition-all duration-300 hover:-translate-y-1 text-center"
              >
                <h3 className="text-lg font-display text-brand-cocoa mb-2">{value.title}</h3>
                <p className="brand-body text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-brand-berry py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-brand-ivory">
          <h2 className="text-4xl md:text-5xl font-display mb-8">Ready to explore?</h2>
          <p className="text-lg text-brand-ivory/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Discover plant-based feminine care curated for your comfort, confidence, and yoni wellness.
          </p>
          <Link
            href="/shop"
            className="btn-wellness-primary text-base px-10 py-4 inline-flex items-center bg-brand-ivory text-brand-berry hover:bg-white"
          >
            Shop collection
          </Link>
        </div>
      </div>
    </div>
  );
}
