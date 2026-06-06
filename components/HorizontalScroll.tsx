'use client';

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  Children,
  type ReactNode,
  type MouseEvent,
} from 'react';

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
  /** Pixels per second — lower = slower */
  autoScrollSpeed?: number;
}

const DEFAULT_SPEED = 22;
const MANUAL_SCROLL_GRACE_MS = 400;

export default function HorizontalScroll({
  children,
  className = '',
  'aria-label': ariaLabel = 'Scroll horizontally',
  autoScrollSpeed = DEFAULT_SPEED,
}: HorizontalScrollProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const isHovered = useRef(false);
  const activePointers = useRef(new Set<number>());
  const manualUntil = useRef(0);
  const isAutoDriving = useRef(false);
  const canHover = useRef(true);
  const direction = useRef<1 | -1>(1);
  const scrollPos = useRef(0);
  const rafRef = useRef<number | undefined>(undefined);
  const lastFrameTime = useRef<number | null>(null);
  const maxScrollRef = useRef(0);
  const reducedMotion = useRef(false);

  const childArray = Children.toArray(children);

  const isPointerActive = () => activePointers.current.size > 0;

  const isManualControl = useCallback(() => {
    return (
      isHovered.current ||
      isPointerActive() ||
      drag.current.active ||
      Date.now() < manualUntil.current
    );
  }, []);

  const syncScrollState = useCallback(() => {
    if (!scrollerRef.current) return;
    scrollPos.current = scrollerRef.current.scrollLeft;
    const max = Math.max(
      0,
      scrollerRef.current.scrollWidth - scrollerRef.current.clientWidth
    );
    maxScrollRef.current = max;
    if (scrollPos.current >= max - 2) direction.current = -1;
    else if (scrollPos.current <= 2) direction.current = 1;
  }, []);

  const pauseManual = useCallback(() => {
    manualUntil.current = Date.now() + MANUAL_SCROLL_GRACE_MS;
    lastFrameTime.current = null;
    syncScrollState();
  }, [syncScrollState]);

  const resumeAutoScroll = useCallback(() => {
    manualUntil.current = 0;
    lastFrameTime.current = null;
    syncScrollState();
  }, [syncScrollState]);

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    maxScrollRef.current = maxScroll;
    scrollPos.current = Math.min(scrollPos.current, maxScroll);

    if (!isManualControl()) {
      el.scrollLeft = scrollPos.current;
    }
  }, [isManualControl]);

  // Pointer + scroll listeners (capture) — works on real mobile & DevTools emulation
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const pointers = activePointers.current;

    const hoverMq = window.matchMedia('(hover: hover) and (pointer: fine)');
    canHover.current = hoverMq.matches;
    const onHoverMqChange = (e: MediaQueryListEvent) => {
      canHover.current = e.matches;
      if (!e.matches) isHovered.current = false;
    };
    hoverMq.addEventListener('change', onHoverMqChange);

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      pointers.add(e.pointerId);
      isHovered.current = false;
      pauseManual();
    };

    const onPointerUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (!isPointerActive()) {
        syncScrollState();
        if (!isHovered.current && !drag.current.active) {
          resumeAutoScroll();
        }
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        pointers.add(e.changedTouches[i].identifier);
      }
      pauseManual();
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        pointers.delete(e.changedTouches[i].identifier);
      }
      if (!isPointerActive()) {
        syncScrollState();
        if (!isHovered.current && !drag.current.active) {
          resumeAutoScroll();
        }
      }
    };

    const onScroll = () => {
      if (isAutoDriving.current) return;
      const el = scrollerRef.current;
      if (!el) return;

      const drift = Math.abs(el.scrollLeft - scrollPos.current);
      if (drift > 1) {
        manualUntil.current = Date.now() + MANUAL_SCROLL_GRACE_MS;
        scrollPos.current = el.scrollLeft;
      }
    };

    el.addEventListener('pointerdown', onPointerDown, { capture: true });
    el.addEventListener('pointerup', onPointerUp, { capture: true });
    el.addEventListener('pointercancel', onPointerUp, { capture: true });
    el.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true, capture: true });
    el.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      hoverMq.removeEventListener('change', onHoverMqChange);
      el.removeEventListener('pointerdown', onPointerDown, { capture: true });
      el.removeEventListener('pointerup', onPointerUp, { capture: true });
      el.removeEventListener('pointercancel', onPointerUp, { capture: true });
      el.removeEventListener('touchstart', onTouchStart, { capture: true });
      el.removeEventListener('touchend', onTouchEnd, { capture: true });
      el.removeEventListener('touchcancel', onTouchEnd, { capture: true });
      el.removeEventListener('scroll', onScroll);
      pointers.clear();
    };
  }, [pauseManual, resumeAutoScroll, syncScrollState, childArray.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    measure();

    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.current = motionMq.matches;
    const onMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion.current = e.matches;
    };
    motionMq.addEventListener('change', onMotionChange);

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(measure);
    });
    ro.observe(el);

    const onVisibility = () => {
      if (document.hidden) lastFrameTime.current = null;
    };
    document.addEventListener('visibilitychange', onVisibility);

    const tick = (time: number) => {
      if (lastFrameTime.current === null) lastFrameTime.current = time;
      const deltaMs = time - lastFrameTime.current;
      lastFrameTime.current = time;

      const maxScroll = maxScrollRef.current;
      const manual = isManualControl();

      if (
        maxScroll > 4 &&
        !manual &&
        !document.hidden &&
        !reducedMotion.current
      ) {
        const deltaPx = (autoScrollSpeed * deltaMs) / 1000;
        scrollPos.current += deltaPx * direction.current;

        if (scrollPos.current >= maxScroll) {
          scrollPos.current = maxScroll;
          direction.current = -1;
        } else if (scrollPos.current <= 0) {
          scrollPos.current = 0;
          direction.current = 1;
        }

        isAutoDriving.current = true;
        el.scrollLeft = scrollPos.current;
        isAutoDriving.current = false;
      } else if (manual) {
        scrollPos.current = el.scrollLeft;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    const startId = window.setTimeout(() => {
      measure();
      rafRef.current = requestAnimationFrame(tick);
    }, 400);

    return () => {
      window.clearTimeout(startId);
      ro.disconnect();
      motionMq.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibility);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [autoScrollSpeed, measure, childArray.length, isManualControl]);

  const onMouseEnter = () => {
    if (!canHover.current) return;
    isHovered.current = true;
    pauseManual();
  };

  const onMouseLeave = () => {
    if (!canHover.current) return;
    isHovered.current = false;
    if (drag.current.active) endDrag();
    else if (!isPointerActive()) resumeAutoScroll();
  };

  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    pauseManual();
    drag.current = { active: true, startX: e.clientX, scrollLeft: el.scrollLeft, moved: false };
    setIsDragging(true);
  };

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!drag.current.active || !scrollerRef.current) return;
    e.preventDefault();
    const delta = e.clientX - drag.current.startX;
    if (Math.abs(delta) > 4) drag.current.moved = true;
    scrollerRef.current.scrollLeft = drag.current.scrollLeft - delta;
    scrollPos.current = scrollerRef.current.scrollLeft;
    manualUntil.current = Date.now() + MANUAL_SCROLL_GRACE_MS;
  };

  const endDrag = () => {
    drag.current.active = false;
    setIsDragging(false);
    syncScrollState();
    if (!isHovered.current && !isPointerActive()) resumeAutoScroll();
  };

  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  return (
    <div
      ref={scrollerRef}
      role="region"
      aria-label={ariaLabel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseUp={endDrag}
      onClickCapture={onClickCapture}
      style={{ scrollBehavior: 'auto', touchAction: 'pan-x' }}
      className={[
        'flex gap-5 md:gap-6 overflow-x-auto overscroll-x-contain',
        'scrollbar-hide [&_a]:touch-pan-x',
        'pb-2',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        className,
      ].join(' ')}
    >
      {childArray.map((child, index) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement, { key: `hscroll-${index}` })
          : <React.Fragment key={`hscroll-${index}`}>{child}</React.Fragment>
      )}
    </div>
  );
}
