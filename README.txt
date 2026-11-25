VIBECONNECT — PROFESSIONAL MEDIA KIT UPGRADE

REPLACE ONLY THESE FILES:
1. frontend/src/pages/MediaKit.tsx
2. frontend/src/pages/MediaKit.css

No route, type, backend, or package dependency changes are required. An optional one-function API service patch is included for demo-mode portfolio links.

FEATURES
- Premium creator profile header using the signed-in user's existing profile data.
- Displays available creator name, handle, avatar, bio, location, niche, social links, followers and engagement rate.
- Rate card view and edit mode, add/remove deliverables, price validation, save/cancel, and error handling.
- Portfolio cards with brand, thumbnail, performance metric and optional content link.
- Add portfolio form supports title, brand/client, performance result, public thumbnail URL and content URL.
- Loading skeleton and retryable error state.
- Responsive tablet/mobile layout.
- Download / Print Kit uses the browser print dialog. Select “Save as PDF” to save a PDF copy.

DATA / BACKEND NOTES
- Uses existing getRateCard, saveRateCard, getPortfolio and addPortfolioItem functions.
- Profile details are read from the existing authenticated user object; edit those in the existing Profile page/settings.
- Social links are shown only when the user has saved values.
- No public share URL, analytics platform verification, media upload, portfolio delete API or PDF-generation backend is added.
- The thumbnail field accepts a public image URL; it does not upload local files.
- Optional MEDIAKIT-SERVICE-PATCH.txt preserves the portfolio content link in demo-mode fallback. Apply only the named addPortfolioItem function if needed; do not replace all of services.ts.
- Portfolio metrics are user-entered labels and are not independently verified.

INSTALL
1. Back up your current MediaKit.tsx and MediaKit.css.
2. Extract this ZIP.
3. Replace the two files at the exact paths above.
4. In the frontend terminal run:
   npm run build
   npm run dev
5. Open Media Kit and test rate editing, adding portfolio work and Download / Print kit.
