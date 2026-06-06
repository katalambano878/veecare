# Customization Checklist

Complete these steps to make this project fully yours.

## Identity

- [ ] Replace `YOUR_PROJECT_NAME` everywhere
- [ ] Replace `YOUR_BRAND_NAME` everywhere
- [ ] Replace `YOUR_APP_TITLE` and `YOUR_SHORT_NAME` everywhere
- [ ] Replace `yourdomain.com` everywhere
- [ ] Replace `YOUR_NAME` and `your@email.com` everywhere
- [ ] Update `lib/brand.ts` — contact, social handles, taglines, hero paths, categories
- [ ] Update `package.json` — name, description, author, homepage, repository

## Assets (see `/public/ASSETS_GUIDE.md`)

- [ ] Add `/public/favicon/favicon.ico` and PNG sizes (or run `npm run generate:seo` after adding `logo.png`)
- [ ] Add `/public/favicon/apple-touch-icon.png`
- [ ] Add `/public/favicon/android-chrome-192x192.png` and `512x512`
- [ ] Add `/public/logo.png`
- [ ] Add `/public/og-image.png` (1200×630px)
- [ ] Add `/public/twitter-card.png` (optional)
- [ ] Add `/public/hero/hero-1.jpg` … `hero-3.jpg` (homepage carousel)
- [ ] Add `/public/about-mockup-1.png` … `3.png` (optional)
- [ ] Replace or customize `components/Logo.tsx`

## Configuration

- [ ] Fill in all values in `.env.local` (copy from `.env.example`)
- [ ] Update `public/manifest.json` with your app name and colors
- [ ] Set up your Supabase project (`YOUR_PROJECT_ID`) and update connection strings
- [ ] Set up your payment provider (Moolre / Paystack / etc.) and API keys
- [ ] Set up Resend (or email provider) + `EMAIL_FROM` / `ADMIN_EMAIL`
- [ ] Connect analytics: `NEXT_PUBLIC_GA_MEASUREMENT_ID` in `.env.local`

## Legal

- [ ] Replace `/LICENSE` with your chosen license
- [ ] Update `app/(store)/privacy/page.tsx` with your privacy policy
- [ ] Update `app/(store)/terms/page.tsx` with your terms of service

## SEO

- [ ] Update `public/robots.txt` with your domain
- [ ] Confirm `app/robots.ts` and `app/sitemap.ts` use `NEXT_PUBLIC_APP_URL`
- [ ] Update `lib/seo.ts` keywords and page copy
- [ ] Set `YOUR_OG_IMAGE_ALT_TEXT` in Open Graph metadata (`lib/seo.ts`)
- [ ] Add Google Search Console verification if needed

## Deployment

- [ ] Update `vercel.json` or hosting config if needed
- [ ] Configure custom domain on Vercel/Netlify
- [ ] Set all environment variables on your deployment platform
- [ ] Remove any `.vercel` folder linked to a previous project before first deploy
- [ ] Point git `origin` to your repository (not the template source)

## Repository

- [ ] `git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git`
- [ ] Run `npm install` and `npm run build` locally before deploying

## Placeholder quick reference

| Placeholder | Typical location |
|-------------|------------------|
| `YOUR_APP_TITLE` | `lib/brand.ts`, manifests, layouts |
| `YOUR_BRAND_NAME` | `lib/brand.ts`, SEO, emails |
| `YOUR_SHORT_NAME` | PWA title, manifest short_name |
| `YOUR_PROJECT_ID` | `.env.local`, `package.json` scripts |
| `yourdomain.com` | `.env.local`, `robots.txt`, defaults in `lib/brand.ts` |
| `YOUR_OG_IMAGE_ALT_TEXT` | `lib/seo.ts` Open Graph `alt` |
| `YOUR_GA4_MEASUREMENT_ID` | `.env.local` — analytics via env only |
