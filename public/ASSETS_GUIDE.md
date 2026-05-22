# Brand assets — Upscale Vintage

## Regenerate OG + favicons from logo

```bash
npm run generate:seo
```

Requires `public/logo.png` (your Upscale Vintage logo). This creates:

| Path | Use |
|------|-----|
| `/public/og-image.png` | Facebook, LinkedIn, WhatsApp link preview (1200×630) |
| `/public/twitter-card.png` | Twitter/X large card |
| `/public/og-image-square.png` | Square social fallback |
| `/public/favicon/` | Full favicon pack (see below) |
| `/app/favicon.ico` | Next.js browser tab icon |
| `/app/icon.png` | Next.js metadata icon |
| `/app/apple-icon.png` | iOS home screen |

### Favicon folder (`/public/favicon/`)

| File | Size |
|------|------|
| `favicon.ico` | Multi-size ICO |
| `favicon-16x16.png` | Browser tab |
| `favicon-32x32.png` | Browser tab HD |
| `favicon-48x48.png` | Windows |
| `apple-touch-icon.png` | 180×180 iOS |
| `android-chrome-192x192.png` | PWA |
| `android-chrome-512x512.png` | PWA splash |
| `site.webmanifest` | PWA manifest fragment |

## SEO

All titles, meta descriptions, Open Graph, and JSON-LD are defined in **`lib/seo.ts`** (not CMS). Update copy there, then redeploy.

Set production URL in `.env.local`:

```
NEXT_PUBLIC_APP_URL=https://upscalevintage.com
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-google-code
```

## Hero & about images

| `/public/hero/lifestyle-hero-1.png` … `lifestyle-hero-3.png` | Homepage hero carousel |
| `/public/about-mockup-1.png` … `3.png` | Who We Are slider |
