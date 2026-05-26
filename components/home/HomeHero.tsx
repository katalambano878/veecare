'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  HERO_SLIDES,
  HERO_SLIDES_MOBILE,
  HERO_IMAGE_VERSION,
  HERO_SLIDE_DURATION_MS,
  TAGLINE,
} from '@/lib/brand';

const FADE_MS = 900;
const SLIDE_COUNT = HERO_SLIDES.length;

export default function HomeHero() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    setActive(index % SLIDE_COUNT);
  }, []);

  const next = useCallback(() => {
    setActive((i) => (i + 1) % SLIDE_COUNT);
  }, []);

  const prev = useCallback(() => {
    setActive((i) => (i - 1 + SLIDE_COUNT) % SLIDE_COUNT);
  }, []);

  useEffect(() => {
    if (paused || SLIDE_COUNT <= 1) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const id = window.setInterval(next, HERO_SLIDE_DURATION_MS);
    return () => window.clearInterval(id);
  }, [paused, next]);

  return (
    <section
      className="relative w-full min-h-[100svh] lg:min-h-[min(100svh,880px)] overflow-hidden bg-[#F5E8E6]"
      aria-roledescription="carousel"
      aria-label="Hero highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      <div className="absolute inset-0 z-0" aria-hidden>
        {HERO_SLIDES.map((slide, index) => {
          const mobileSlide = HERO_SLIDES_MOBILE[index];
          const isActive = index === active;
          const fadeClass = `absolute inset-0 transition-opacity ease-in-out ${
            isActive ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
          }`;

          return (
            <div
              key={`hero-slide-${index}`}
              className={fadeClass}
              style={{ transitionDuration: `${FADE_MS}ms` }}
            >
              {/* Mobile-only 9:16 backgrounds */}
              <div className="absolute inset-0 lg:hidden">
                <Image
                  src={`${mobileSlide.src}?v=${HERO_IMAGE_VERSION}`}
                  alt=""
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  quality={90}
                  className="hero-slide-image hero-slide-image--mobile"
                />
              </div>

              {/* Desktop-only 16:9 backgrounds */}
              <div className="absolute inset-0 hidden lg:block">
                <Image
                  src={`${slide.src}?v=${HERO_IMAGE_VERSION}`}
                  alt=""
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  quality={92}
                  className={`hero-slide-image hero-slide-image--desktop transition-transform ease-out duration-700 ${
                    isActive
                      ? 'hero-slide-image--active'
                      : 'hero-slide-image--inactive'
                  }`}
                />
              </div>
            </div>
          );
        })}

        {/* 10% pink tint over slider backgrounds */}
        <div
          className="absolute inset-0 z-[2] pointer-events-none bg-brand-berry/10"
          aria-hidden
        />
      </div>

      {/* Accessible label for active slide (visible copy is separate) */}
      <p className="sr-only">
        {HERO_SLIDES_MOBILE[active].alt}
      </p>

      <div className="relative z-10 flex min-h-[100svh] lg:min-h-[min(100svh,880px)] items-start lg:items-center pointer-events-none">
        <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 xl:px-20 pt-[5.25rem] pb-10 sm:pt-28 sm:pb-12 lg:py-32 pointer-events-auto">
          <div className="w-full max-w-[540px] sm:max-w-[580px] lg:max-w-[620px] xl:max-w-[640px] lg:ml-[4%] xl:ml-[6%]">
            <span className="inline-flex w-fit items-center gap-2 py-2 px-4 mb-5 sm:mb-8 text-xs sm:text-sm font-medium text-brand-berry bg-white/55 backdrop-blur-md border border-white/60 rounded-full shadow-[0_4px_24px_rgba(201,93,123,0.08)]">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-berry shrink-0" aria-hidden />
              Feminine wellness · Accra, Ghana
            </span>

            <h1 className="font-display font-semibold text-brand-cocoa leading-[1.08] tracking-tight mb-4 sm:mb-6">
              <span className="block text-[2.15rem] sm:text-[3.25rem] lg:text-[3.75rem] xl:text-[4rem]">
                Care that feels
              </span>
              <span className="relative inline-block mt-1 text-[2.35rem] sm:text-[3.5rem] lg:text-[4rem] xl:text-[4.35rem] italic text-brand-berry font-medium">
                understood
                <span
                  className="absolute -bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-brand-blush/70 -z-10 rounded-sm skew-x-[-2deg]"
                  aria-hidden
                />
              </span>
            </h1>

            <p className="font-sans text-base sm:text-xl text-brand-cocoa/90 font-medium leading-snug mb-3 sm:mb-4 max-w-md drop-shadow-sm">
              {TAGLINE}
            </p>
            <p className="font-sans text-sm sm:text-base text-brand-cocoa/75 leading-relaxed mb-6 sm:mb-10 max-w-md">
              Designed to support your comfort, confidence, and everyday wellness.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-2 sm:mb-0">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center px-7 sm:px-8 py-3 sm:py-3.5 rounded-full text-sm font-semibold text-white bg-brand-berry hover:bg-[#B24D6A] transition-all duration-300 shadow-[0_8px_28px_rgba(201,93,123,0.35)] hover:shadow-[0_12px_32px_rgba(201,93,123,0.4)] hover:-translate-y-0.5 group"
              >
                Explore the shop
                <i className="ri-arrow-right-line ml-2 text-lg transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-7 sm:px-8 py-3 sm:py-3.5 rounded-full text-sm font-semibold text-brand-berry bg-white/40 backdrop-blur-sm border-2 border-brand-rose/80 hover:bg-white/60 hover:border-brand-berry transition-all duration-300"
              >
                Our story
              </Link>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
