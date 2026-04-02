# Supabase Notes

This folder now has two purposes:

- `migrations/` contains the actual remote migration history that has already been pushed.
- `schema.current.sql` is the clean current-state snapshot of the provider/client schema.

## Recommended workflow

1. Make schema changes by adding a new file in `migrations/`.
2. Run `supabase migration list` to confirm what is pending.
3. Run `supabase db push` to apply the new migration to the linked project.
4. Regenerate `lib/database.types.ts` from the linked project once the CLI is authenticated.

## Why both `migrations/` and `schema.current.sql` exist

The project needed several follow-up migrations while the provider/client model was being stabilized.
Those patch migrations should stay in place because the remote project has already recorded them.

For day-to-day development, `schema.current.sql` is the easiest file to read because it shows the
current intended schema in one place instead of making you mentally replay every patch file.

## Type generation

If the CLI is authenticated, regenerate the database types with:

```bash
supabase gen types typescript --linked --schema public > lib/database.types.ts
```

If that command fails with an access-token error, run:

```bash
supabase login
```

and then rerun the type generation command.

## Folder guide

- `archive/20260327_initial_schema.sql`: the retired college-tracker schema snapshot
- `migrations/202603270001_provider_model.sql`: base provider/client schema reset
- `migrations/20260327000*.sql`: remote patch history applied during stabilization
- `schema.current.sql`: clean current-state schema snapshot
