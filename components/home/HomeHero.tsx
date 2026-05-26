'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

function slideIndicesToRender(active: number, fadingFrom: number | null): number[] {
  const set = new Set<number>([active]);
  if (fadingFrom !== null && fadingFrom !== active) set.add(fadingFrom);
  return [...set];
}

export default function HomeHero() {
  const [active, setActive] = useState(0);
  const [fadingFrom, setFadingFrom] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const next = useCallback(() => {
    setActive((i) => {
      const nextIndex = (i + 1) % SLIDE_COUNT;
      setFadingFrom(i);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = setTimeout(() => setFadingFrom(null), FADE_MS);
      return nextIndex;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
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

  // Preload next slide after first paint
  useEffect(() => {
    const nextIndex = (active + 1) % SLIDE_COUNT;
    const mobileSrc = `${HERO_SLIDES_MOBILE[nextIndex].src}?v=${HERO_IMAGE_VERSION}`;
    const desktopSrc = `${HERO_SLIDES[nextIndex].src}?v=${HERO_IMAGE_VERSION}`;

    const preload = (href: string) => {
      const img = new window.Image();
      img.src = href;
    };

    const run = () => {
      if (window.matchMedia('(max-width: 1023px)').matches) {
        preload(mobileSrc);
      } else {
        preload(desktopSrc);
      }
    };

    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(run, { timeout: 2000 });
    } else {
      timerId = setTimeout(run, 400);
    }

    return () => {
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timerId !== undefined) clearTimeout(timerId);
    };
  }, [active]);

  const visibleIndices = slideIndicesToRender(active, fadingFrom);

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
          if (!visibleIndices.includes(index)) return null;

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
              <div className="absolute inset-0 lg:hidden">
                <Image
                  src={`${mobileSlide.src}?v=${HERO_IMAGE_VERSION}`}
                  alt=""
                  fill
                  priority={index === 0}
                  fetchPriority={index === 0 ? 'high' : 'low'}
                  sizes="100vw"
                  quality={index === 0 ? 82 : 72}
                  className="hero-slide-image hero-slide-image--mobile"
                />
              </div>

              <div className="absolute inset-0 hidden lg:block">
                <Image
                  src={`${slide.src}?v=${HERO_IMAGE_VERSION}`}
                  alt=""
                  fill
                  priority={index === 0}
                  fetchPriority={index === 0 ? 'high' : 'low'}
                  sizes="100vw"
                  quality={index === 0 ? 85 : 75}
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

        <div
          className="absolute inset-0 z-[2] pointer-events-none bg-brand-berry/10"
          aria-hidden
        />
      </div>

      <p className="sr-only">{HERO_SLIDES_MOBILE[active].alt}</p>

      <div className="relative z-10 flex min-h-[100svh] lg:min-h-[min(100svh,880px)] items-start lg:items-center pointer-events-none">
        <div className="w-full max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 xl:px-20 pt-[5.25rem] pb-10 sm:pt-28 sm:pb-12 lg:py-32 pointer-events-auto">
          <div className="w-full max-w-[540px] sm:max-w-[580px] lg:max-w-[620px] xl:max-w-[640px] lg:ml-[4%] xl:ml-[6%]">
            <span className="inline-flex w-fit items-center gap-2 py-2 px-4 mb-5 sm:mb-8 text-xs sm:text-sm font-medium text-white bg-black/30 backdrop-blur-md border border-white/40 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.15)] lg:text-brand-berry lg:bg-white/55 lg:border-white/60 lg:shadow-[0_4px_24px_rgba(201,93,123,0.08)]">
              <span className="w-1.5 h-1.5 rounded-full bg-white lg:bg-brand-berry shrink-0" aria-hidden />
              Feminine wellness · Accra, Ghana
            </span>

            <h1 className="font-display font-semibold text-white lg:text-brand-cocoa leading-[1.08] tracking-tight mb-4 sm:mb-6 [text-shadow:0_2px_16px_rgba(0,0,0,0.35)] lg:[text-shadow:none]">
              <span className="block text-[2.15rem] sm:text-[3.25rem] lg:text-[3.75rem] xl:text-[4rem]">
                Care that feels
              </span>
              <span className="relative inline-block mt-1 text-[2.35rem] sm:text-[3.5rem] lg:text-[4rem] xl:text-[4.35rem] italic text-white lg:text-brand-berry font-medium">
                understood
                <span
                  className="absolute -bottom-1 left-0 right-0 h-2.5 sm:h-4 bg-white/25 lg:bg-brand-blush/70 -z-10 rounded-sm skew-x-[-2deg]"
                  aria-hidden
                />
              </span>
            </h1>

            <p className="font-sans text-base sm:text-xl text-white font-medium leading-snug mb-3 sm:mb-4 max-w-md [text-shadow:0_1px_12px_rgba(0,0,0,0.4)] lg:text-brand-cocoa/90 lg:[text-shadow:none]">
              {TAGLINE}
            </p>
            <p className="font-sans text-sm sm:text-base text-white/95 leading-relaxed mb-6 sm:mb-10 max-w-md [text-shadow:0_1px_10px_rgba(0,0,0,0.35)] lg:text-brand-cocoa/75 lg:[text-shadow:none]">
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
                className="inline-flex items-center justify-center px-7 sm:px-8 py-3 sm:py-3.5 rounded-full text-sm font-semibold text-white bg-white/15 backdrop-blur-sm border-2 border-white/70 hover:bg-white/25 hover:border-white transition-all duration-300 lg:text-brand-berry lg:bg-white/40 lg:border-brand-rose/80 lg:hover:bg-white/60 lg:hover:border-brand-berry"
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
