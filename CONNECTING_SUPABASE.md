# Kitchen shared-storage setup

1. **Before deploying**, open Kitchen on the ORIGINAL browser and go to Settings > Export backup. Keep the JSON file safe.
2. In Supabase SQL Editor, run `SUPABASE_SYNC_SETUP.sql` once. This adds a separate RLS-protected `kitchen_snapshots` table; existing 11 tables are unchanged.
3. In Vercel Production environment variables, confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are present. Never put `sb_secret_` in NEXT_PUBLIC.
4. Upload the updated project files to GitHub and wait for Vercel Ready.
5. On the ORIGINAL browser, go to Settings > Shared Kitchen, sign in as the owner. The household should say it is empty. Click **Back up & migrate browser data**. The app downloads another JSON backup before writing the snapshot.
6. Reload the app, sign in again if needed, and check your inventory. On Winnie's device, sign in with her own account and verify the same inventory and meal plan.
7. Do not clear browser data until migration and both-device checks are successful.

## Scope and caveats

- This integration stores one versioned JSON snapshot of inventory, recipes, planner, shopping, history, and preferences per household. It does not yet normalize records into the 11 previously created tables. This is intentional to preserve the existing app state with minimal disruption.
- The snapshot uses optimistic revision checks to prevent silent overwrites. If two devices change data at the same time, the later save fails and syncing pauses. Export the browser backup and reload; merge conflicting edits manually if needed. It is not yet a real-time collaboration engine.
- The existing `/api/ai` endpoint still uses its original OpenAI key and IP-based throttling. It does NOT yet require Supabase authentication; protect the deployed app or add server-side auth before broader public use.
- Google Drive backups are not implemented. Use Settings > Export backup and upload the JSON to Drive manually until automation is built.
- The migration is insert-only: it refuses to overwrite an existing shared household snapshot. Do not migrate from a fresh browser with no groceries.
