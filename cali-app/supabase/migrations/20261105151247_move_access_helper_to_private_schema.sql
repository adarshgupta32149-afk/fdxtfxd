-- Keep the internal access check out of the public API. Policies reference the
-- function by identity, so they keep working after the schema change.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
alter function public.has_logging_access() set schema private;
revoke execute on function private.has_logging_access() from public, anon;
grant execute on function private.has_logging_access() to authenticated;
