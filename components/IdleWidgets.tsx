'use client';

import { useEffect, useState, type ReactNode } from 'react';

/** Mount non-critical UI after the browser is idle (faster first paint on mobile). */
export default function IdleWidgets({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const run = () => setReady(true);

    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(run, { timeout: 2500 });
    } else {
      timerId = setTimeout(run, 1200);
    }

    return () => {
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timerId !== undefined) clearTimeout(timerId);
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
