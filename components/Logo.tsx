'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BRAND_NAME, LOGO_PATH, LOGO_CLASS_HEADER } from '@/lib/brand';

type LogoProps = {
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-display font-semibold tracking-tight text-brand-berry ${className}`}
    >
      Vee Care
    </span>
  );
}

export default function Logo({
  className = LOGO_CLASS_HEADER,
  width = 220,
  height = 100,
  priority = false,
}: LogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={className} title={BRAND_NAME}>
        <LogoMark />
      </span>
    );
  }

  return (
    <Image
      src={LOGO_PATH}
      alt={BRAND_NAME}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={() => setFailed(true)}
      style={{
        width: 'auto',
        height: '100%',
        maxHeight: '3.25rem',
        objectFit: 'contain',
      }}
    />
  );
}
