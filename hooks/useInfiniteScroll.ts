import { useEffect, useRef } from 'react';

/** Observe a sentinel element and call onLoadMore when it enters the viewport. */
export function useInfiniteScroll({
  onLoadMore,
  enabled,
  rootMargin = '240px',
}: {
  onLoadMore: () => void;
  enabled: boolean;
  rootMargin?: string;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [onLoadMore, enabled, rootMargin]);

  return sentinelRef;
}
