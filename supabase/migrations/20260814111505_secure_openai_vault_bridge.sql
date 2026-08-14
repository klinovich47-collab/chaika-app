create or replace function public.chaika_openai_api_key()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'OPENAI_API_KEY'
  limit 1;
$$;

revoke all on function public.chaika_openai_api_key() from public;
revoke all on function public.chaika_openai_api_key() from anon;
revoke all on function public.chaika_openai_api_key() from authenticated;
grant execute on function public.chaika_openai_api_key() to service_role;

-- The secret value itself is intentionally not stored in Git.
-- Production value is stored in Supabase Vault under the name OPENAI_API_KEY.
