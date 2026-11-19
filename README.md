# Kitchen v2 — photo-first household kitchen manager

This is the **updated source code**, not an automatic update to your existing Vercel site. It is a Next.js 15 mobile-first web application. It retains browser-local data from the original starter (`kitchen-mvp-v1`) and migrates it to `kitchen-mvp-v2` when opened in the same browser on the same site origin.

## New workflows

1. **Inventory → Groceries**: Select up to five photos (product front, nutrition label, printed date). AI extracts items, weights, dates and available nutrition data. Review and confirm. Packaged goods have a remaining-percentage selector: 20/40/60/80/100% (unopened = 100%). You can exit without saving.
2. **Inventory → Receipt / order**: Upload grocery receipt or order screenshots. Import immediately adds estimated quantities to stock, even before delivery. Variable-weight ranges use the midpoint, and the original range is retained. Possible duplicates prompt the user to replace an existing entry (default), keep it, or add both. If multiple candidates match, choose which to replace.
3. **Inventory → Section recount**: Recount one of six sections with photos. Review detected quantities and confirm. Unseen products are **not** deleted. Suggested schedules: produce 7d, meat/seafood 14d, other frozen 30d, pantry 60d, condiments 90d, refrigerated essentials 14d.
4. **AI Planner**: Conversational menu creation and adjustments using inventory and preferences. AI returns a draft plan and recipes; only approval saves it.
5. **Planner**: Only approved meals appear. Tap a meal to open its recipe. Mark as cooked to deduct matching gram-based ingredients, with portion adjustment and one-step undo.
6. **Shopping**: Calculate estimated missing ingredients from approved meals, copy list.

## Deploy to the existing GitHub/Vercel project

1. **Back up first**: Open the existing Kitchen site in the browser where your inventory is saved → Settings → Export data backup. The new build reads the previous local-storage data on the same domain/browser, but backups are recommended.
2. Unzip this folder. Upload its **contents** (not the outer `kitchen-app` directory) to the root of the existing `kunsitu2012/kitchen-app` GitHub repository, replacing matching files and adding `app/api/ai/route.ts`. GitHub's web uploader may not reliably overwrite existing paths; use GitHub's file editor or GitHub Desktop for updating existing files.
3. In Vercel, open the existing Kitchen project → Settings → Environment Variables → add `OPENAI_API_KEY` (secret OpenAI API key), target Production, Preview, Development as needed. Optionally add `OPENAI_MODEL=gpt-4o-mini`. **Never add `.env` or the API key to GitHub or to client-side code.**
4. Redeploy after setting variables. Vercel typically deploys automatically on a push to the connected GitHub branch. Test `/api/ai` through the app (AI Planner and photo scan).
5. Keep OpenAI API billing on a low prepaid budget with auto-recharge disabled; ChatGPT Plus does not include API credits.

## Important limitations of this version

- **No shared household database, authentication or cross-device synchronization yet**. Data remains in browser localStorage; different browsers/devices have different inventories. Back up before clearing browser data or changing domain.
- **The deployed AI endpoint is not protected by login**. There is a basic in-memory per-IP rate limit (20 calls/hour per running instance), but this is **not a reliable cost cap or security control** on serverless deployments. Before making the app broadly accessible, add authentication, durable rate limiting and server-enforced spending controls. Avoid posting the deployment URL publicly while API billing is enabled.
- AI photo recognition and nutrition extraction are probabilistic; review all quantities and printed dates. Estimated macros are not verified nutrition facts unless extracted correctly from a readable label. A receipt/order cannot guarantee delivery.
- Cooked-recipe deduction matches exact normalized ingredient names and gram units; unmatched items are flagged. It does not automatically reconcile synonyms, eggs in pieces vs grams, or unit conversions. The shopping calculator is similarly approximate.
- A section recount updates recognized items only; it never assumes unseen food is absent. This is intentionally conservative.
- The app does not currently fetch retailer prices or provide automatic purchase links.
- AI planning is designed for up to ten recipes in one response; some long weekly plans may need follow-up prompts if the model truncates output. Draft edits are only saved when you approve.
- Browser localStorage is not a production-grade inventory database. Supabase shared auth/storage is the next infrastructure milestone.

## Local development

Requires Node.js 20+. Run `npm install`, copy `.env.example` to `.env.local` and enter your OpenAI API key (never commit `.env.local`), then `npm run dev`. Open http://localhost:3000.

## Files

- `app/page.tsx` — inventory, chat, planner, recipes, cooking, shopping, persistence
- `app/api/ai/route.ts` — server-side OpenAI image and chat requests
- `app/style.css` — mobile-first styling
- `.env.example` — example server-only environment configuration
