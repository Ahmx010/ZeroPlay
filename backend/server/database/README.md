# Database Design Notes

The public repository keeps database architecture visible at a high level without publishing full production migration details.

ZeroPlay uses Supabase/PostgreSQL patterns built around:

- Auth-linked user profile data.
- Authenticated favorites scoped to the current user.
- Team records synced from public soccer data sources.
- Ownership checks enforced in the API layer and expected at the database policy layer.
- Indexing and uniqueness rules for account and team lookup paths.
- Trigger-backed profile initialization after successful signup.

Exact production SQL, policy definitions, and migration internals belong in private deployment documentation or a private migrations repository.
