import React from 'react';
import Image from 'next/image';

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
        <span className="inline-block py-1 px-4 mb-5 text-brand-mauve text-[10px] tracking-widest-xl uppercase font-semibold border border-brand-mauve/30 rounded-full bg-white/70">
          Upscale Vintage
        </span>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-display text-brand-espresso mb-6 leading-[1.1] tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-base md:text-lg text-brand-cocoa/80 max-w-2xl mx-auto leading-relaxed font-light">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
