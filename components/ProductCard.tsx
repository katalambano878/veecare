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
    <div className="group bg-transparent rounded-lg h-full flex flex-col hover-lift">
      <Link href={`/product/${slug}`} className="relative block aspect-[3/4] overflow-hidden rounded-xl sm:rounded-2xl bg-brand-nude/20 mb-2 sm:mb-4 shadow-sm group-hover:shadow-luxury-lg transition-all duration-500 border border-brand-nude/30">
        <LazyImage
          src={image}
          alt={name}
          className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-[1200ms] ease-out"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-brand-espresso/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden lg:block" />

        <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex flex-col gap-1 sm:gap-2 z-10">
          {badge && (
            <span className="glass text-brand-espresso border border-white/50 text-[8px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest font-bold px-2 py-0.5 sm:px-3.5 sm:py-1.5 rounded-full shadow-sm">
              {badge}
            </span>
          )}
          {discount > 0 && (
            <span className="bg-red-50/90 backdrop-blur-md text-red-700 border border-red-200/50 text-[8px] sm:text-[10px] uppercase tracking-wider sm:tracking-widest font-bold px-2 py-0.5 sm:px-3.5 sm:py-1.5 rounded-full shadow-sm">
              -{discount}%
            </span>
          )}
        </div>

        {!inStock && (
          <div className="absolute inset-0 glass flex items-center justify-center z-20">
            <span className="glass-dark text-white px-5 py-2.5 rounded-full text-xs tracking-widest uppercase font-medium">Out of Stock</span>
          </div>
        )}

        {inStock && (
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out hidden lg:block z-20">
            {hasVariants ? (
              <span className="w-full glass text-brand-espresso hover:bg-white/90 py-3.5 rounded-xl font-medium shadow-lg transition-all flex items-center justify-center space-x-2 text-sm border border-white/60">
                <i className="ri-list-check"></i>
                <span>Select Options</span>
              </span>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  addToCart({ id, name, price, image, quantity: moq, slug, maxStock, moq });
                }}
                className="w-full glass text-brand-espresso hover:bg-white/90 py-3.5 rounded-xl font-medium shadow-lg transition-all flex items-center justify-center space-x-2 text-sm border border-white/60"
              >
                <i className="ri-shopping-cart-2-line"></i>
                <span>{moq > 1 ? `Add ${moq} to Cart` : 'Quick Add'}</span>
              </button>
            )}
          </div>
        )}
      </Link>

      <div className="flex flex-col flex-grow px-0.5 sm:px-0">
        <Link href={`/product/${slug}`}>
          <h3 className="font-display text-sm sm:text-lg md:text-xl leading-snug sm:leading-tight text-brand-espresso mb-1 sm:mb-1.5 group-hover:text-brand-mauve transition-colors duration-300 line-clamp-2 tracking-tight">
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
            <span className="text-xs sm:text-base text-brand-espresso font-medium tracking-wide">From {formatPrice(minVariantPrice)}</span>
          ) : (
            <span className="text-xs sm:text-base text-brand-espresso font-medium tracking-wide">{formatPrice(price)}</span>
          )}
          {originalPrice && (
            <span className="text-[10px] sm:text-sm text-brand-cocoa/40 line-through font-light tracking-wide">{formatPrice(originalPrice)}</span>
          )}
        </div>

        <div className="mt-auto pt-1 sm:pt-2 lg:hidden">
          {hasVariants ? (
            <Link
              href={`/product/${slug}`}
              className="w-full border border-brand-nude/80 text-brand-espresso py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-medium hover:bg-brand-nude/30 active:bg-brand-nude/50 transition-colors flex items-center justify-center gap-1"
            >
              <i className="ri-list-check text-xs sm:text-sm"></i>
              <span className="truncate">Options</span>
            </Link>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                addToCart({ id, name, price, image, quantity: moq, slug, maxStock, moq });
              }}
              disabled={!inStock}
              className="w-full border border-brand-nude/80 text-brand-espresso py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-medium hover:bg-brand-nude/30 active:bg-brand-nude/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {moq > 1 ? `Add ${moq}` : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
