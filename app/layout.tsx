import type { Viewport } from "next";
import Script from "next/script";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import DeferredRemixIcon from "@/components/DeferredRemixIcon";
import { SHORT_NAME } from "@/lib/brand";
import { fontDisplay, fontSans } from "@/lib/fonts";
import {
  buildRootMetadata,
  organizationJsonLd,
  websiteJsonLd,
  localBusinessJsonLd,
  SEO_ASSETS,
} from "@/lib/seo";
import "./globals.css";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#E88BA8',
};

export const metadata = buildRootMetadata();

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

const structuredData = [organizationJsonLd(), websiteJsonLd(), localBusinessJsonLd()];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GH">
      <head>
        <meta name="theme-color" content="#E88BA8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={SHORT_NAME} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#E88BA8" />
        <meta name="msapplication-TileImage" content={SEO_ASSETS.icon192} />
        <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
        <meta name="msapplication-tap-highlight" content="no" />

        <link rel="icon" href={SEO_ASSETS.faviconIco} sizes="any" />
        <link rel="icon" type="image/png" sizes="16x16" href={SEO_ASSETS.favicon16} />
        <link rel="icon" type="image/png" sizes="32x32" href={SEO_ASSETS.favicon32} />
        <link rel="apple-touch-icon" sizes="180x180" href={SEO_ASSETS.appleTouchIcon} />
        <link rel="manifest" href="/favicon/site.webmanifest" />

        {structuredData.map((schema) => (
          <script
            key={schema['@type'] as string}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>

      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {RECAPTCHA_SITE_KEY && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
          strategy="afterInteractive"
        />
      )}

      <body
        className={`${fontSans.variable} ${fontDisplay.variable} antialiased font-sans overflow-x-hidden pwa-body`}
      >
        <DeferredRemixIcon />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[10000] focus:px-6 focus:py-3 focus:bg-brand-espresso focus:text-brand-cream focus:rounded-lg focus:font-semibold focus:shadow-lg"
        >
          Skip to main content
        </a>
        <CartProvider>
          <WishlistProvider>
            <div id="main-content">
              {children}
            </div>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
