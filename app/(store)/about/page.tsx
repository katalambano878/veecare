'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCMS } from '@/context/CMSContext';
import PageHero from '@/components/PageHero';
import AboutBrandSection from '@/components/home/AboutBrandSection';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  APP_TITLE,
  CONTACT_ADDRESS,
  CONTACT_PHONE_DISPLAY,
  WHATSAPP_LINK,
  TAGLINE,
} from '@/lib/brand';

export default function AboutPage() {
  usePageTitle('Our Story');
  const { getSetting } = useCMS();
  const [activeTab, setActiveTab] = useState('story');

  const siteName = getSetting('site_name') || APP_TITLE;

  const values = [
    {
      title: 'Feminine Wellness',
      description:
        'Products and guidance chosen to support comfort, hygiene, and emotional wellbeing for everyday women.',
    },
    {
      title: 'Personal Care',
      description:
        'Gentle essentials for daily routines — thoughtful, discreet, and made with care.',
    },
    {
      title: 'Self-Care',
      description:
        'Moments to pause, restore, and feel confident — because wellness is part of how you live.',
    },
    {
      title: 'Delivered With Care',
      description: `Based in ${CONTACT_ADDRESS}, we serve women across Ghana with friendly, reliable service.`,
    },
  ];

  const tabActive = 'text-brand-cocoa border-b-4 border-brand-berry font-bold';
  const tabIdle = 'text-brand-cocoa/60 hover:text-brand-cocoa';

  return (
    <div className="min-h-screen bg-brand-ivory">
      <PageHero title="More Than A Brand" subtitle={TAGLINE} />

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
            Our Story
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mission')}
            className={`px-4 py-2 sm:px-8 sm:py-4 font-medium transition-colors text-lg cursor-pointer ${
              activeTab === 'mission' ? tabActive : tabIdle
            }`}
          >
            Our Mission
          </button>
        </div>

        {activeTab === 'story' && (
          <div className="grid md:grid-cols-2 gap-16 items-start animate-fade-in-up">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-brand-cocoa mb-6 tracking-tight">
                How It All Started
              </h2>
              <div className="space-y-6 brand-body">
                <p>
                  <strong className="font-semibold text-brand-cocoa">{siteName}</strong> began with a simple
                  idea: make feminine care and wellness feel accessible, calm, and personal for women in
                  Ghana — online and on social media.
                </p>
                <p>
                  From hygiene essentials to self-care rituals, we build collections around what supports
                  comfort, confidence, and everyday wellbeing.
                </p>
                <p>
                  Reach us on <strong>{CONTACT_PHONE_DISPLAY}</strong> or{' '}
                  <a href={WHATSAPP_LINK} className="text-brand-berry hover:underline font-medium">
                    WhatsApp
                  </a>
                  . We are here for product questions, orders, and gentle guidance.
                </p>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden border border-brand-blush bg-brand-blush/40 p-10 md:p-12 shadow-wellness">
              <p className="brand-eyebrow mb-4">Our promise</p>
              <p className="font-display text-2xl md:text-3xl text-brand-cocoa leading-snug mb-4">
                Designed to support your comfort, confidence, and everyday wellness.
              </p>
              <p className="brand-body text-base">
                A modern feminine wellness brand — emotionally safe, never clinical, always caring.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'mission' && (
          <div className="grid md:grid-cols-2 gap-12 animate-fade-in-up">
            <div className="bg-white p-10 rounded-3xl border border-brand-blush shadow-wellness">
              <h3 className="text-3xl font-display text-brand-cocoa mb-4">Curated For You</h3>
              <p className="brand-body">
                We bring together personal care, hygiene, wellness, and self-care in one calm shopping
                experience — thoughtful picks for the woman who puts herself first.
              </p>
            </div>
            <div className="bg-brand-blush/50 p-10 rounded-3xl border border-brand-blush">
              <h3 className="text-3xl font-display text-brand-cocoa mb-4">Community First</h3>
              <p className="brand-body">
                We grow with our community on Instagram, TikTok, and Snapchat — sharing care, updates, and
                support that feels warm and human.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white py-24 border-y border-brand-blush">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display text-brand-cocoa mb-4">Why Shop With Us?</h2>
            <p className="brand-body-lg max-w-2xl mx-auto text-center">
              Feminine care and wellness, delivered with warmth and respect.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-brand-ivory p-8 rounded-2xl border border-brand-blush hover:shadow-wellness transition-all duration-300 hover:-translate-y-1"
              >
                <h3 className="text-xl font-display text-brand-cocoa mb-3">{value.title}</h3>
                <p className="brand-body text-base">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-brand-berry py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-brand-ivory">
          <h2 className="text-4xl md:text-5xl font-display mb-8">Ready to explore?</h2>
          <p className="text-lg text-brand-ivory/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Discover feminine care, hygiene, and wellness essentials curated for you.
          </p>
          <Link href="/shop" className="btn-wellness-primary text-base px-10 py-4 inline-flex items-center bg-brand-ivory text-brand-berry hover:bg-white">
            Shop collection
          </Link>
        </div>
      </div>
    </div>
  );
}
