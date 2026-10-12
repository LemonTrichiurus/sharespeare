# Sharespeare — notes for AI coding agents

Bilingual student community (Next.js 15 App Router + Supabase). See README.md for the product and architecture.

## Commands
- `npm run dev` — local server on :3000 (needs `.env.local`, see `.env.example`)
- `npm test` · `npm run typecheck` · `npm run lint` — all must pass; the build does not ignore type or lint errors
- RLS tests: run `supabase/tests/rls_test.sql` against the database; success is the error `ALL RLS TESTS PASSED (rolled back)`

## How the code is organized
- Reads: Server Components call `src/lib/data/*`, which query with `createSupabaseServer()` (the visitor's session) and map rows to camelCase view models.
- Writes: Server Actions in `src/actions/*`, validated with zod, returning `ActionState` whose `error`/`message`/`fieldErrors` values are **i18n keys**.
- Auth: `getViewer()` / `requireViewer()` / `requireMod()` in `src/lib/auth.ts`.
- There is no service-role key in the app. Permissions are enforced by Postgres RLS and column grants; app-side role checks exist only for UX. Never add an admin client to work around a policy — change the policy in a migration.
- All user content is rendered through `RichText` / `toSafeHtml()` (`src/lib/html.ts`). Never use `dangerouslySetInnerHTML` on raw content.
- UI strings live in `src/lib/i18n/dictionaries.ts`; add every key to both `zh` and `en`. Server: `getT()`; client: `useI18n()`.

## Database
- The live Supabase project is the source of truth. Schema changes go in a new file under `supabase/migrations/` (timestamp prefix) and should be dry-run before applying.
- `20261011000000_baseline_from_production.sql` documents the schema as it was before the rebuild; it is not in the remote migration history, so don't push it.
- After changing tables, update `src/lib/supabase/database.types.ts` and extend `supabase/tests/rls_test.sql` for any new policy.
