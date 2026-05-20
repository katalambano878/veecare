'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '@/context/CartContext';

interface MiniCartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MiniCart({ isOpen, onClose }: MiniCartProps) {
  const { cart, removeFromCart, updateQuantity, subtotal } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const itemCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-brand-cocoa/60 z-[200] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="fixed inset-y-0 right-0 z-[201] flex w-full max-w-md flex-col bg-brand-cream shadow-2xl border-l border-brand-nude/60 animate-in slide-in-from-right duration-300"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-brand-nude/60 bg-brand-cream px-5 py-4 sm:px-6">
          <h2 className="font-display text-xl font-semibold text-brand-espresso">
            Your Cart ({itemCount})
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-nude/70 bg-white text-brand-cocoa transition-colors hover:bg-brand-nude/40 hover:text-brand-espresso"
            aria-label="Close cart"
          >
            <i className="ri-close-line text-2xl" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-brand-nude/50">
              <i className="ri-shopping-cart-line text-5xl text-brand-cocoa/40" />
            </div>
            <h3 className="font-display text-xl font-semibold text-brand-espresso mb-2">
              Your cart is empty
            </h3>
            <p className="text-brand-cocoa/70 mb-8 max-w-xs">
              Browse the shop and add pieces you love.
            </p>
            <Link href="/shop" onClick={onClose} className="btn-luxury-primary px-8 py-3">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
              <ul className="space-y-4">
                {cart.map((item) => (
                  <li
                    key={`${item.id}-${item.variant || ''}`}
                    className="flex gap-3 rounded-2xl border border-brand-nude/60 bg-white p-4 shadow-sm"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-brand-nude/50 bg-brand-nude/20">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-brand-espresso line-clamp-2 text-sm leading-snug pr-1">
                          {item.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id, item.variant)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-cocoa/50 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove ${item.name}`}
                        >
                          <i className="ri-delete-bin-line text-lg" />
                        </button>
                      </div>

                      {item.variant && (
                        <p className="mt-1 text-xs text-brand-cocoa/70">Variant: {item.variant}</p>
                      )}

                      <p className="mt-2 font-display text-lg font-semibold text-brand-espresso">
                        GH₵{item.price.toFixed(2)}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="inline-flex items-center rounded-xl border border-brand-nude/70 bg-brand-cream overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.variant)}
                            className="flex h-9 w-9 items-center justify-center text-brand-cocoa transition-colors hover:bg-brand-nude/40"
                            aria-label="Decrease quantity"
                          >
                            {item.quantity <= (item.moq || 1) ? (
                              <i className="ri-delete-bin-line text-red-500" />
                            ) : (
                              <i className="ri-subtract-line" />
                            )}
                          </button>
                          <span className="min-w-[2.5rem] px-1 text-center text-sm font-semibold text-brand-espresso">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.variant)}
                            className="flex h-9 w-9 items-center justify-center text-brand-cocoa transition-colors hover:bg-brand-nude/40 disabled:opacity-40"
                            disabled={item.quantity >= item.maxStock}
                            aria-label="Increase quantity"
                          >
                            <i className="ri-add-line" />
                          </button>
                        </div>
                        <span className="text-xs font-medium text-brand-cocoa/60 whitespace-nowrap">
                          GH₵{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      {(item.moq || 1) > 1 && (
                        <p className="mt-1 text-xs text-brand-mauve">Min. order: {item.moq} units</p>
                      )}
                      {item.quantity >= item.maxStock && (
                        <p className="mt-1 text-xs text-amber-700">Max stock reached</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="shrink-0 border-t border-brand-nude/60 bg-white px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-brand-cocoa/80">Subtotal</span>
                <span className="font-display text-2xl font-semibold text-brand-espresso">
                  GH₵{subtotal.toFixed(2)}
                </span>
              </div>
              <p className="mb-4 text-center text-xs text-brand-cocoa/60">
                Shipping &amp; taxes calculated at checkout
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="btn-luxury-primary w-full py-3.5 text-center"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="btn-luxury-outline w-full py-3.5 text-center"
                >
                  View Full Cart
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </>,
    document.body
  );
}
