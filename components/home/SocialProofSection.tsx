'use client';

import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  TIKTOK_HANDLE,
  TIKTOK_URL,
  SNAPCHAT_HANDLE,
  SNAPCHAT_URL,
} from '@/lib/brand';

const SOCIALS = [
  {
    platform: 'Instagram',
    handle: INSTAGRAM_HANDLE,
    href: INSTAGRAM_URL,
    icon: 'ri-instagram-line',
    description: 'Daily wellness tips, new arrivals, and gentle reminders to care for yourself.',
  },
  {
    platform: 'TikTok',
    handle: TIKTOK_HANDLE,
    href: TIKTOK_URL,
    icon: 'ri-tiktok-line',
    description: 'Soft, real moments — self-care rituals and community warmth.',
  },
  {
    platform: 'Snapchat',
    handle: SNAPCHAT_HANDLE,
    href: SNAPCHAT_URL,
    icon: 'ri-snapchat-line',
    description: 'Quick questions, discreet orders, and friendly support.',
  },
] as const;

export default function SocialProofSection() {
  return (
    <section className="py-20 sm:py-24 md:py-24 bg-brand-blush/10 relative overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatedSection className="text-center max-w-xl mx-auto mb-10 sm:mb-16">
          <span className="glass inline-flex items-center px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-wider text-brand-espresso mb-4 sm:mb-6 shadow-glass">
            STAY CONNECTED
          </span>
          <h2 className="font-display text-[2rem] sm:text-4xl lg:text-5xl text-brand-cocoa tracking-tight leading-[1.12] mb-4 sm:mb-6">
            Join our wellness <span className="italic text-brand-berry font-medium">community</span>
          </h2>
          <p className="text-[0.95rem] sm:text-lg text-brand-cocoa/70 leading-relaxed">
            Follow along for product drops, caring guidance, and a space that feels emotionally safe
            — like a modern wellness editorial.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {SOCIALS.map((social, i) => (
            <AnimatedSection key={social.platform} delay={i * 60}>
              <Link
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group block h-full p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] glass-card shadow-glass hover:shadow-glass-strong transition-all duration-500 hover:-translate-y-2 border border-white/60"
              >
                <span className="inline-flex w-11 h-11 sm:w-14 sm:h-14 items-center justify-center rounded-xl sm:rounded-2xl glass text-brand-espresso group-hover:bg-brand-espresso group-hover:text-white transition-colors duration-300 mb-4 sm:mb-6 shadow-glass">
                  <i className={`${social.icon} text-xl sm:text-2xl`} />
                </span>
                <h3 className="font-display text-lg sm:text-2xl font-semibold text-brand-cocoa mb-1 transition-colors group-hover:text-brand-espresso">{social.platform}</h3>
                <p className="text-[11px] sm:text-sm font-medium tracking-wide uppercase text-brand-berry/80 mb-2.5 sm:mb-4 transition-colors group-hover:text-brand-rose">{social.handle}</p>
                <p className="text-[0.95rem] sm:text-base text-brand-cocoa/70 leading-relaxed transition-colors group-hover:text-brand-cocoa/90 line-clamp-3 sm:line-clamp-none">{social.description}</p>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
