'use client';

import { useState } from 'react';
import Link from 'next/link';
import LazyImage from './LazyImage';
import { useCart } from '@/context/CartContext';

// Map common color names to hex values for swatches
const COLOR_MAP: Record<string, string> = {
  black: '#000000', white: '#FFFFFF', red: '#EF4444', blue: '#3B82F6',
  navy: '#1E3A5F', green: '#22C55E', yellow: '#EAB308', orange: '#F97316',
  pink: '#EC4899', purple: '#A855F7', brown: '#92400E', beige: '#D4C5A9',
  grey: '#6B7280', gray: '#6B7280', cream: '#FFFDD0', teal: '#14B8A6',
  maroon: '#800000', coral: '#FF7F50', burgundy: '#800020', olive: '#808000',
  tan: '#D2B48C', khaki: '#C3B091', charcoal: '#36454F', ivory: '#FFFFF0',
  gold: '#FFD700', silver: '#C0C0C0', rose: '#FF007F', lavender: '#E6E6FA',
  mint: '#98FB98', peach: '#FFDAB9', wine: '#722F37', denim: '#1560BD',
  nude: '#E3BC9A', camel: '#C19A6B', sage: '#BCB88A', rust: '#B7410E',
  mustard: '#FFDB58', plum: '#8E4585', lilac: '#C8A2C8', stone: '#928E85',
  sand: '#C2B280', taupe: '#483C32', mauve: '#E0B0FF', sky: '#87CEEB',
  forest: '#228B22', cobalt: '#0047AB', emerald: '#50C878', scarlet: '#FF2400',
  aqua: '#00FFFF', turquoise: '#40E0D0', indigo: '#4B0082', crimson: '#DC143C',
  magenta: '#FF00FF', cyan: '#00FFFF', chocolate: '#7B3F00', coffee: '#6F4E37',
};

export function getColorHex(colorName: string): string | null {
  const lower = colorName.toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  // Try partial match (e.g. "Light Blue" -> "blue")
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

export interface ColorVariant {
  name: string;
  hex: string;
}

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  inStock?: boolean;
  maxStock?: number;
  moq?: number;
  hasVariants?: boolean;
  minVariantPrice?: number;
  colorVariants?: ColorVariant[];
}

export default function ProductCard({
  id,
  slug,
  name,
  price,
  originalPrice,
  image,
  rating = 5,
  reviewCount = 0,
  badge,
  inStock = true,
  maxStock = 50,
  moq = 1,
  hasVariants = false,
  minVariantPrice,
  colorVariants = []
}: ProductCardProps) {
  const { addToCart } = useCart();
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const displayPrice = hasVariants && minVariantPrice ? minVariantPrice : price;
  const discount = originalPrice ? Math.round((1 - displayPrice / originalPrice) * 100) : 0;
  const MAX_SWATCHES = 5;

  const formatPrice = (val: number) => `GH\u20B5${val.toFixed(2)}`;

  return (
    <div className="group glass-card rounded-[1.5rem] sm:rounded-[2rem] h-full flex flex-col hover-lift border border-white/60 shadow-glass hover:shadow-glass-strong bg-white/40">
      <Link href={`/product/${slug}`} className="relative block aspect-[3/4] overflow-hidden rounded-t-[1.5rem] sm:rounded-t-[2rem] rounded-b-xl bg-brand-nude/20 mb-2 sm:mb-4">
        <LazyImage
          src={image}
          alt={name}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-[1200ms] ease-out"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-brand-espresso/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden lg:block pointer-events-none mix-blend-multiply" />

        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col gap-1.5 sm:gap-2 z-10">
          {badge && (
            <span className="glass text-brand-espresso border border-white/60 text-[9px] sm:text-xs font-semibold tracking-wider uppercase px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full shadow-glass backdrop-blur-md">
              {badge}
            </span>
          )}
          {discount > 0 && (
            <span className="glass text-brand-rose border border-brand-rose/20 text-[9px] sm:text-xs font-bold tracking-wider px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full shadow-glass backdrop-blur-md bg-white/70">
              -{discount}%
            </span>
          )}
        </div>

        {!inStock && (
          <div className="absolute inset-0 glass flex items-center justify-center z-20">
            <span className="glass-dark text-white px-6 py-3 rounded-full text-xs font-semibold tracking-wider uppercase shadow-glass-strong border border-white/20">Out of stock</span>
          </div>
        )}

        {inStock && (
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out hidden lg:block z-20">
            {hasVariants ? (
              <span className="w-full glass-panel text-brand-espresso hover:text-brand-berry py-3.5 rounded-2xl font-semibold tracking-wide shadow-glass-strong hover:shadow-glass-hover transition-all flex items-center justify-center space-x-2 text-sm border border-white/80 hover:-translate-y-0.5">
                <i className="ri-list-check text-lg"></i>
                <span>Select Options</span>
              </span>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  addToCart({ id, name, price, image, quantity: moq, slug, maxStock, moq });
                }}
                className="w-full glass-panel text-brand-espresso hover:text-brand-berry py-3.5 rounded-2xl font-semibold tracking-wide shadow-glass-strong hover:shadow-glass-hover transition-all flex items-center justify-center space-x-2 text-sm border border-white/80 hover:-translate-y-0.5"
              >
                <i className="ri-shopping-cart-2-line text-lg"></i>
                <span>{moq > 1 ? `Add ${moq} to Cart` : 'Quick Add'}</span>
              </button>
            )}
          </div>
        )}
      </Link>

      <div className="flex flex-col flex-grow px-3 sm:px-5 pb-4 sm:pb-5">
        <Link href={`/product/${slug}`}>
          <h3 className="font-display text-[0.95rem] sm:text-lg md:text-xl font-medium leading-snug text-brand-cocoa mb-1 group-hover:text-brand-espresso transition-colors duration-300 line-clamp-2">
            {name}
          </h3>
        </Link>

        {colorVariants.length > 0 && (
          <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-2">
            {colorVariants.slice(0, MAX_SWATCHES).map((color) => (
              <button
                key={color.name}
                title={color.name}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveColor(activeColor === color.name ? null : color.name);
                }}
                className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border transition-all duration-200 flex-shrink-0 ${
                  activeColor === color.name
                    ? 'ring-2 ring-offset-1 ring-brand-champagne scale-110'
                    : 'hover:scale-110'
                } ${color.hex === '#FFFFFF' ? 'border-gray-300' : 'border-transparent'}`}
                style={{ backgroundColor: color.hex }}
              />
            ))}
            {colorVariants.length > MAX_SWATCHES && (
              <span className="text-xs text-gray-400 ml-0.5">+{colorVariants.length - MAX_SWATCHES}</span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 mb-1 sm:mb-2">
          {hasVariants && minVariantPrice ? (
            <span className="text-sm sm:text-base text-brand-espresso font-medium tracking-wide">From {formatPrice(minVariantPrice)}</span>
          ) : (
            <span className="text-sm sm:text-base text-brand-espresso font-medium tracking-wide">{formatPrice(price)}</span>
          )}
          {originalPrice && (
            <span className="text-[10px] sm:text-sm text-brand-cocoa/40 line-through font-light tracking-wide">{formatPrice(originalPrice)}</span>
          )}
        </div>

        <div className="mt-auto pt-2.5 sm:pt-4 lg:hidden">
          {hasVariants ? (
            <Link
              href={`/product/${slug}`}
              className="w-full glass text-brand-espresso py-2 sm:py-3 rounded-xl text-[11px] sm:text-sm font-semibold tracking-wide hover:shadow-glass-hover active:bg-brand-nude/50 transition-all flex items-center justify-center gap-1.5 border border-white/60 shadow-glass"
            >
              <i className="ri-list-check text-[13px] sm:text-base"></i>
              <span className="truncate">Options</span>
            </Link>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                addToCart({ id, name, price, image, quantity: moq, slug, maxStock, moq });
              }}
              disabled={!inStock}
              className="w-full glass text-brand-espresso py-2 sm:py-3 rounded-xl text-[11px] sm:text-sm font-semibold tracking-wide hover:shadow-glass-hover active:bg-brand-nude/50 transition-all flex items-center justify-center gap-1.5 border border-white/60 shadow-glass disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="ri-shopping-cart-2-line text-[13px] sm:text-base"></i>
              {moq > 1 ? `Add ${moq}` : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
