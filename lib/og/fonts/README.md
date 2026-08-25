# Geist (vendored for OG image generation)

These TTFs are used by `next/og` (Satori) to render Open Graph images.

They are vendored rather than fetched at build time for two reasons:
- Satori cannot read woff2, which is what `next/font` ships to the browser.
- A build-time fetch to Google Fonts would make image generation fail whenever
  that request fails.

Source: Google Fonts (`https://fonts.googleapis.com/css2?family=Geist`).
Licence: SIL Open Font License 1.1 — redistribution is permitted.

Geist for the *site* still comes from `next/font/google` in `app/layout.tsx`.
These files are only for image rendering.
