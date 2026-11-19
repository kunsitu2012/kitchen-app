# Kitchen — personal household food manager (working starter)

A mobile-first Next.js App Router prototype for two-person meal planning, inventory, expiration alerts, recipes and shopping lists.

## Run locally

1. Install Node.js 20.9+.
2. In this folder run `npm install` then `npm run dev`.
3. Open `http://localhost:3000` on your computer. To test on a phone on the same Wi-Fi, start with `npm run dev -- --hostname 0.0.0.0` and use your computer's LAN IP and port 3000. For camera permissions and Home Screen installation, deploy over HTTPS.
4. For deployment, push this folder to a private GitHub repository and import it into Vercel. No secrets are required for this starter.

## What works now

- Mobile navigation, local browser persistence, manual fridge/freezer/pantry inventory, printed date types and expiration watch based on device date.
- Photo selection and preview (no image processing or photo persistence yet).
- Editable recipe ingredient list, scaling and deterministic macros from entered per-100g values.
- Confirmed cooking deducts matching gram-based inventory; names must match exactly.
- Weekly lunch/dinner selections; inventory-shortage shopping list; copy list; feedback notes; JSON export.
- The example recipe is a demonstration and its nutrition values are approximations.

## Not implemented yet — do not mistake for live capabilities

- No AI photo recognition, label OCR, automated expiration extraction, online retailer research, nutrition lookup, user authentication, multi-device sync, push alerts or online database.
- No deployment has been performed. The starter uses browser localStorage; clearing browser storage loses data unless exported.
- Photo previews are temporary and are not saved. This build has no server-side AI calls or API charges.
- Shopping shortages only compare exact-ish item names in grams; units and recipe reservations need a production inventory engine.

## Next milestone

1. Add Supabase authentication and household-level row-level security, inventory batch schema, recipes, plans, and transactions.
2. Add server-side AI extraction of package labels/photos with user review and date-type confidence. Keep API keys server-side.
3. Integrate USDA FoodData Central and exact product-label nutrition data; record source and assumptions.
4. Add search-enabled retailer research only on request, distinguishing verified products from suggested search terms.
5. Add server-enforced spending controls, logging, idempotency and rate limits; use a small prepaid API balance with auto-recharge off.
6. Test on both iPhones and deploy via HTTPS. Add icons and service worker for improved PWA support.

## Safety

Printed best-before dates are often quality indicators, not definitive food-safety cutoffs. The app must not automatically label food safe or unsafe based only on a date.
