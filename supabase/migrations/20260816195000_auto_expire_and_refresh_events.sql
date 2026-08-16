create or replace function public.chaika_delete_stale_events()
returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  deleted_count bigint;
begin
  delete from public.events
  where (expires_at is not null and expires_at <= now())
     or (expires_at is null and starts_at <= now() - interval '1 hour');

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.chaika_delete_stale_events() from public, anon, authenticated;

do $$
declare
  stale_job record;
begin
  for stale_job in
    select jobid
    from cron.job
    where jobname in (
      'chaika-cleanup-stale-events',
      'chaika-import-public-events-hourly',
      'chaika-import-public-events-every-30-minutes'
    )
  loop
    perform cron.unschedule(stale_job.jobid);
  end loop;
end;
$$;

select cron.schedule(
  'chaika-cleanup-stale-events',
  '*/5 * * * *',
  $command$select public.chaika_delete_stale_events();$command$
);

select cron.schedule(
  'chaika-import-public-events-every-30-minutes',
  '7,37 * * * *',
  $command$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='project_url' limit 1) || '/functions/v1/import-public-events',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey',(select decrypted_secret from vault.decrypted_secrets where name='publishable_key' limit 1),
      'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='edge_anon_jwt' limit 1)
    ),
    body := jsonb_build_object('scheduled_at', now()),
    timeout_milliseconds := 30000
  ) as request_id;
  $command$
);

do $$
begin
  perform public.chaika_delete_stale_events();
end;
$$;
