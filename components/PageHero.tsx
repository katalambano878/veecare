import React from 'react';
import Image from 'next/image';
import { BRAND_NAME } from '@/lib/brand';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
}

export default function PageHero({ title, subtitle, backgroundImage }: PageHeroProps) {
  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center min-h-[65vh] md:min-h-[55vh] ${
        !backgroundImage ? 'bg-brand-cream' : ''
      }`}
    >
      {backgroundImage ? (
        <>
          <Image
            src={backgroundImage}
            alt={title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={80}
          />
          <div className="absolute inset-0 bg-brand-espresso/40" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-hero-slide-2" />
          <div className="hero-orb w-80 h-80 -top-20 right-0 bg-brand-mauve/20" />
          <div className="hero-orb w-64 h-64 bottom-0 left-0 bg-brand-champagne/25" />
        </>
      )}

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24 text-center z-10 flex flex-col items-center">
        <span className="glass inline-flex items-center py-2 px-5 mb-6 text-brand-berry text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-full shadow-glass border border-white/60">
          {BRAND_NAME}
        </span>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-semibold text-brand-cocoa mb-6 leading-[1.05] tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="glass-panel max-w-2xl mx-auto text-center text-base sm:text-lg text-brand-cocoa/80 leading-relaxed px-8 py-5 rounded-2xl shadow-glass border border-white/50">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
