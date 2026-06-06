# Vee Care — brand assets

## Hero image (priority)

Add an editorial wellness photograph:

**Path:** `/public/hero/hero-main.jpg`

**Direction:**
- Ghanaian/African woman, soft natural light
- Warm beige and blush tones
- Feminine wellness products, soft fabrics, subtle florals
- Calm, modern, emotionally safe — not hospital, pharmacy, or glam salon
- Leave space on the left for text (desktop layout)

## Logo

**Path:** `/public/logo.png` (transparent PNG)

Source: `public/logo-source.png` — regenerate transparency with:

```bash
node scripts/prepare-logo.mjs
```

## Regenerate favicons & OG

```bash
npm run generate:seo
```

Requires `public/logo.png`.

## Palette reference

| Role | Hex |
|------|-----|
| Soft Rose Pink | `#E88BA8` |
| Warm Blush Nude | `#F6E6E8` |
| Muted Berry Pink | `#C95D7B` |
| Soft Lavender Nude | `#DCC9D6` |
| Warm Ivory | `#FFF9F7` |
| Soft Cocoa Brown | `#5B4B4B` |
