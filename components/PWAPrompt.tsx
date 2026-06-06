'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePWAInstall } from './PWAInstaller';
import { APP_TITLE, BRAND_NAME, LOGO_PATH } from '@/lib/brand';

const SESSION_KEY = 'pwaPromptDismissed';

function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export default function PWAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { canInstall, isInstalled, install } = usePWAInstall();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isInstalled) return;
    if (sessionStorage.getItem(SESSION_KEY) === '1') return;

    const isIOS = isIOSDevice();
    if (!canInstall && !isIOS) return;

    const timer = setTimeout(() => setShowPrompt(true), 1200);
    return () => clearTimeout(timer);
  }, [canInstall, isInstalled]);

  const handleInstall = async () => {
    if (canInstall) {
      const accepted = await install();
      if (accepted) setShowPrompt(false);
    }
    sessionStorage.setItem(SESSION_KEY, '1');
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem(SESSION_KEY, '1');
  };

  if (!mounted || !showPrompt || isInstalled) return null;

  const siteHost =
    typeof window !== 'undefined'
      ? window.location.hostname.replace(/^www\./, '')
      : 'veecare.shop';

  const isIOS = isIOSDevice();

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99998] pwa-prompt-backdrop"
        onClick={handleDismiss}
        aria-hidden
      />

      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-prompt-title"
      >
        <div className="pointer-events-auto w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden pwa-prompt-modal">
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors z-10"
            aria-label="Close"
          >
            <i className="ri-close-line text-lg" aria-hidden />
          </button>

          <div className="px-6 pt-8 pb-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-luxury bg-brand-cream flex items-center justify-center p-2 border border-brand-nude mb-4">
                <img src={LOGO_PATH} alt={BRAND_NAME} className="w-full h-full object-contain" />
              </div>
              <h3 id="pwa-prompt-title" className="font-bold text-gray-900 text-xl">
                Install {APP_TITLE}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{siteHost}</p>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <i key={star} className="ri-star-fill text-amber-400 text-xs" aria-hidden />
                ))}
                <span className="text-xs text-gray-400 ml-1">Shopping</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: 'ri-flashlight-line', label: 'Lightning Fast' },
                { icon: 'ri-wifi-off-line', label: 'Works Offline' },
                { icon: 'ri-notification-3-line', label: 'Get Notified' },
              ].map((feature) => (
                <div key={feature.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="w-10 h-10 bg-brand-nude/50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <i className={`${feature.icon} text-brand-espresso text-lg`} aria-hidden />
                  </div>
                  <span className="text-xs font-medium text-gray-600">{feature.label}</span>
                </div>
              ))}
            </div>

            {isIOS && !canInstall ? (
              <div className="bg-brand-nude/30 rounded-xl p-4 mb-4 text-left text-sm text-gray-700 space-y-2">
                <p className="font-semibold text-gray-900">To install on iPhone/iPad:</p>
                <p className="flex items-start gap-2">
                  <i className="ri-share-forward-line text-brand-espresso mt-0.5 shrink-0" aria-hidden />
                  Tap Share in Safari, then &quot;Add to Home Screen&quot;
                </p>
              </div>
            ) : null}

            {canInstall ? (
              <button
                type="button"
                onClick={handleInstall}
                className="w-full bg-brand-espresso hover:bg-brand-cocoa text-white py-4 px-6 rounded-2xl font-semibold text-base transition-all active:scale-[0.98] shadow-lg shadow-brand-espresso/20 flex items-center justify-center gap-2"
              >
                <i className="ri-download-2-line text-xl" aria-hidden />
                Add to Home Screen
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full bg-brand-espresso hover:bg-brand-cocoa text-white py-4 px-6 rounded-2xl font-semibold text-base transition-all active:scale-[0.98] shadow-lg shadow-brand-espresso/20 flex items-center justify-center gap-2"
              >
                <i className="ri-check-line text-xl" aria-hidden />
                Got it
              </button>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full mt-3 py-3 text-gray-500 font-medium text-sm hover:text-gray-700 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
