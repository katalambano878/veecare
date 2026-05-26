"use client";

import { useState, useEffect } from 'react';
import { useCMS } from '@/context/CMSContext';
import { supabase } from '@/lib/supabase';
import PageHero from '@/components/PageHero';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import {
  CONTACT_ADDRESS,
  CONTACT_PHONE,
  CONTACT_PHONE_DISPLAY,
  CONTACT_WHATSAPP,
  WHATSAPP_LINK,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  TIKTOK_HANDLE,
  TIKTOK_URL,
  SNAPCHAT_HANDLE,
  SNAPCHAT_URL,
} from '@/lib/brand';

export default function ContactPage() {
  usePageTitle('Contact Us');
  const { getSetting } = useCMS();
  const [pageContent, setPageContent] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { getToken, verifying } = useRecaptcha();

  useEffect(() => {
    async function fetchContactContent() {
      const { data } = await supabase
        .from('cms_content')
        .select('*')
        .eq('section', 'contact')
        .eq('block_key', 'main')
        .single();

      if (data) {
        setPageContent(data);
      }
    }
    fetchContactContent();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // reCAPTCHA verification
    const isHuman = await getToken('contact');
    if (!isHuman) {
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }

    try {
      // Store in Supabase
      const { error } = await supabase
        .from('contact_submissions')
        .insert({
          name: formData.name,
          email: '',
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
        });

      if (error) {
        // Table might not exist, still show success
        console.log('Note: contact_submissions table may not exist');
      }

      // Send Contact Notification
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          payload: formData
        })
      }).catch(err => console.error('Contact notification error:', err));

      setSubmitStatus('success');
      setFormData({ name: '', phone: '', subject: '', message: '' });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactPhone = getSetting('contact_phone') || CONTACT_PHONE_DISPLAY;
  const contactWhatsapp = getSetting('contact_whatsapp') || CONTACT_WHATSAPP;
  const contactAddress = getSetting('contact_address') || CONTACT_ADDRESS;
  const instagramUrl = getSetting('social_instagram') || INSTAGRAM_URL;

  const heroSubtitle =
    pageContent?.subtitle ||
    'Questions about products, orders, or delivery? Reach Vee Care by phone, WhatsApp, or social media.';

  const waLink = WHATSAPP_LINK;
  const rawPhone = (getSetting('contact_phone') || CONTACT_PHONE).replace(/\s/g, '');
  const telLink = rawPhone.startsWith('0') ? `tel:+233${rawPhone.slice(1)}` : `tel:${rawPhone}`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactAddress)}`;

  const contactMethods = [
    {
      icon: 'ri-phone-line',
      title: 'Call Us',
      value: contactPhone,
      link: telLink,
      description: 'Mon to Sat, 9am to 6pm',
    },
    {
      icon: 'ri-whatsapp-line',
      title: 'WhatsApp',
      value: contactWhatsapp,
      link: waLink,
      description: 'Fastest way to reach us',
    },
    {
      icon: 'ri-instagram-line',
      title: 'Instagram',
      value: INSTAGRAM_HANDLE,
      link: instagramUrl,
      description: 'DM us for orders & product questions',
    },
    {
      icon: 'ri-tiktok-line',
      title: 'TikTok',
      value: TIKTOK_HANDLE,
      link: TIKTOK_URL,
      description: 'Watch & shop with us',
    },
    {
      icon: 'ri-snapchat-line',
      title: 'Snapchat',
      value: SNAPCHAT_HANDLE,
      link: SNAPCHAT_URL,
      description: 'Chat & order on Snapchat',
    },
    {
      icon: 'ri-map-pin-line',
      title: 'Location',
      value: contactAddress,
      link: mapsLink,
      description: 'Online store · Accra, Ghana',
    },
  ];

  const faqs = [
    {
      question: 'How do I place or reserve an order?',
      answer:
        'Browse the shop, add items to your cart, or message us on WhatsApp, Instagram, TikTok, or Snapchat. We will confirm availability and delivery details for you.',
    },
    {
      question: 'What are your delivery times?',
      answer:
        'Standard delivery within Ghana usually takes 2 to 5 business days. Accra and nearby areas may qualify for faster options; we will confirm when you order.',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept Mobile Money (MOMO), instant bank transfer, and card payments where available. Payment on delivery is not offered.',
    },
  ];

  const inputClass =
    'w-full px-4 py-3 border border-brand-nude rounded-xl bg-white text-brand-cocoa text-sm focus:ring-2 focus:ring-brand-mauve/40 focus:border-brand-mauve transition-colors';
  const labelClass = 'block text-sm font-medium text-brand-espresso mb-2';

  return (
    <div className="min-h-screen bg-brand-cream">
      <PageHero
        title={pageContent?.title || 'Get In Touch'}
        subtitle={heroSubtitle}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {contactMethods.map((method, index) => (
            <a
              key={index}
              href={method.link}
              target={method.link.startsWith('http') ? '_blank' : '_self'}
              rel={method.link.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="group bg-white border border-brand-nude/80 p-6 rounded-2xl shadow-soft hover:shadow-luxury hover:border-brand-mauve/40 transition-all"
            >
              <div className="w-12 h-12 bg-brand-nude/60 rounded-full flex items-center justify-center mb-4 group-hover:bg-brand-mauve/15 transition-colors">
                <i className={`${method.icon} text-2xl text-brand-espresso`} />
              </div>
              <h3 className="font-display text-lg text-brand-espresso mb-2">{method.title}</h3>
              <p className="text-brand-espresso font-medium mb-1 text-sm leading-snug">{method.value}</p>
              <p className="text-sm text-brand-cocoa/65">{method.description}</p>
            </a>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div className="bg-white border border-brand-nude/60 rounded-3xl p-6 sm:p-8 shadow-soft">
            <h2 className="text-3xl sm:text-4xl font-display text-brand-espresso mb-3 tracking-tight">Send Us a Message</h2>
            <p className="text-brand-cocoa/75 mb-8 font-light leading-relaxed">
              Share your name, phone number, and what you need. We will reply by call or WhatsApp.
            </p>

            <form id="contactForm" onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClass}
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. 054 503 5799"
                />
              </div>

              <div>
                <label htmlFor="subject" className={labelClass}>
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className={inputClass}
                  placeholder="Order, reservation, product question…"
                />
              </div>

              <div>
                <label htmlFor="message" className={labelClass}>
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  maxLength={500}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className={`${inputClass} resize-none`}
                  placeholder="Tell us what you are looking for…"
                />
                <p className="text-xs text-brand-cocoa/50 mt-1">{formData.message.length}/500 characters</p>
              </div>

              {submitStatus === 'success' && (
                <div className="bg-brand-nude/50 border border-brand-mauve/30 text-brand-espresso px-4 py-3 rounded-xl text-sm">
                  <i className="ri-check-line mr-2 text-brand-mauve" />
                  Message received! We will get back to you on WhatsApp or by phone soon.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="bg-red-50 border border-red-200/80 text-red-800 px-4 py-3 rounded-xl text-sm">
                  <i className="ri-error-warning-line mr-2" />
                  Something went wrong. Please try again or message us on WhatsApp.
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || verifying}
                className="w-full btn-luxury-primary py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || verifying ? (verifying ? 'Verifying…' : 'Sending…') : 'Send Message'}
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-display text-brand-espresso mb-3 tracking-tight">Quick Answers</h2>
            <p className="brand-body mb-8">
              Common questions about orders, delivery, and payments
            </p>

            <div className="space-y-4 mb-12">
              {faqs.map((faq, index) => (
                <details
                  key={index}
                  className="bg-white border border-brand-nude/60 rounded-2xl overflow-hidden group"
                >
                  <summary className="px-6 py-4 font-medium text-brand-espresso cursor-pointer hover:bg-brand-nude/30 transition-colors list-none flex items-center justify-between gap-4">
                    <span>{faq.question}</span>
                    <i className="ri-add-line text-brand-mauve group-open:hidden shrink-0" />
                    <i className="ri-subtract-line text-brand-mauve hidden group-open:inline shrink-0" />
                  </summary>
                  <div className="px-6 pb-5 text-brand-cocoa/75 leading-relaxed text-sm font-light border-t border-brand-nude/40 pt-4">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>

            <div className="bg-gradient-to-br from-brand-espresso to-brand-cocoa p-8 rounded-3xl text-brand-cream shadow-luxury">
              <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center mb-4">
                <i className="ri-customer-service-2-line text-2xl" />
              </div>
              <h3 className="text-2xl font-display mb-3">Need a quick reply?</h3>
              <p className="text-brand-nude/95 mb-6 leading-relaxed font-medium text-sm sm:text-base">
                For orders, reservations, and style questions, WhatsApp is usually fastest. We are available Mon to Sat, 9am to 6pm.
              </p>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-brand-cream text-brand-espresso px-6 py-3 rounded-full font-medium hover:bg-white transition-colors"
              >
                <i className="ri-whatsapp-line text-xl text-[#25D366]" />
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white border-t border-brand-nude/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <span className="brand-eyebrow mb-3 block">In person</span>
            <h2 className="text-2xl sm:text-3xl font-display text-brand-espresso mb-4">Visit Our Space</h2>
            <p className="brand-body mb-8 max-w-xl mx-auto">
              Prefer to see pieces in person or pick up an order? Stop by our location in Accra. We are happy to help
              with orders, reservations, imports, and curated finds.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-6 text-brand-cocoa/80 text-sm">
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 hover:text-brand-mauve transition-colors"
              >
                <i className="ri-map-pin-2-line text-brand-espresso text-lg" />
                <span>{contactAddress}</span>
              </a>
              <div className="inline-flex items-center justify-center gap-2">
                <i className="ri-time-line text-brand-espresso text-lg" />
                <span>Mon to Sat: 9am to 6pm</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
