create or replace function public.chaika_classify_museum_event()
returns trigger
language plpgsql
as $$
begin
  if new.source = 'kudago'
     and lower(coalesce(new.venue,'')) ~ '(музей|эрмитаж|русский музей|эрарта|манеж|росфото|артмуза|галере)' then
    new.category := 'museum';
  end if;
  return new;
end;
$$;

drop trigger if exists chaika_classify_museum_event_trg on public.events;
create trigger chaika_classify_museum_event_trg
before insert or update on public.events
for each row execute function public.chaika_classify_museum_event();

update public.events
set category = 'art'
where source='kudago'
  and category='museum'
  and lower(coalesce(venue,'')) !~ '(музей|эрмитаж|русский музей|эрарта|манеж|росфото|артмуза|галере)';

select cron.schedule(
  'chaika-import-museum-exhibitions',
  '17 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name='project_url' limit 1) || '/functions/v1/import-museum-exhibitions',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey',(select decrypted_secret from vault.decrypted_secrets where name='publishable_key' limit 1),
      'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='edge_anon_jwt' limit 1)
    ),
    body := jsonb_build_object('scheduled_at', now()),
    timeout_milliseconds := 30000
  ) as request_id;
  $$
);