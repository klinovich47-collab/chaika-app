-- Latest CHAIKA production schema additions.
-- Assumes the base events/concerts/telegram_users tables already exist.

alter table public.events
  add column if not exists source text,
  add column if not exists source_event_id text,
  add column if not exists source_url text,
  add column if not exists imported_at timestamptz,
  add column if not exists moderation_reason text,
  add column if not exists moderation_metadata jsonb,
  add column if not exists moderated_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'events_source_external_unique'
      and conrelid = 'public.events'::regclass
  ) then
    alter table public.events
      add constraint events_source_external_unique unique (source, source_event_id);
  end if;
end $$;

create index if not exists events_source_starts_idx on public.events(source, starts_at);
create index if not exists events_imported_at_idx on public.events(imported_at desc) where source is not null;
create index if not exists events_moderation_queue_idx on public.events(moderation_status, created_at desc);

alter table public.concerts
  add column if not exists source text,
  add column if not exists source_event_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='concerts_source_external_unique'
      and conrelid='public.concerts'::regclass
  ) then
    alter table public.concerts
      add constraint concerts_source_external_unique unique(source, source_event_id);
  end if;
end $$;

create or replace function public.sync_external_event_concert()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  ev record;
  inferred_genre text;
begin
  if tg_op='DELETE' then
    if old.source is not null then
      delete from public.concerts
      where source=old.source and source_event_id=old.source_event_id;
    end if;
    return old;
  end if;

  ev := new;
  if ev.source is null then return new; end if;

  if ev.category <> 'music' or ev.moderation_status <> 'published' then
    update public.concerts set active=false, updated_at=now()
    where source=ev.source and source_event_id=ev.source_event_id;
    return new;
  end if;

  inferred_genre := case
    when lower(coalesce(ev.title,'') || ' ' || coalesce(ev.description,'')) ~ '(техно|электрон|electro|techno|house|хаус|drum|dnb|ambient)' then 'electronic'
    when lower(coalesce(ev.title,'') || ' ' || coalesce(ev.description,'')) ~ '(рок|rock|metal|панк|punk|indie|инди)' then 'rock'
    when lower(coalesce(ev.title,'') || ' ' || coalesce(ev.description,'')) ~ '(поп|pop|эстрад)' then 'pop'
    else 'other'
  end;

  insert into public.concerts(
    artist,title,starts_at,venue,genre,price_label,ticket_url,image_url,
    source_name,verified,active,source,source_event_id,updated_at
  ) values (
    ev.title,ev.title,ev.starts_at,ev.venue,inferred_genre,
    case when coalesce(ev.price_rub,0)=0 then 'Бесплатно' else 'от '||ev.price_rub||' ₽' end,
    coalesce(ev.ticket_url,ev.source_url,'https://chaika-app.vercel.app/'),ev.image_url,
    case when ev.source='kudago' then 'KudaGo' else ev.source end,
    true,true,ev.source,ev.source_event_id,now()
  )
  on conflict(source,source_event_id) do update set
    artist=excluded.artist,title=excluded.title,starts_at=excluded.starts_at,
    venue=excluded.venue,genre=excluded.genre,price_label=excluded.price_label,
    ticket_url=excluded.ticket_url,image_url=excluded.image_url,
    source_name=excluded.source_name,verified=true,active=true,updated_at=now();

  return new;
end;
$$;

drop trigger if exists trg_sync_external_event_concert on public.events;
create trigger trg_sync_external_event_concert
after insert or update or delete on public.events
for each row execute function public.sync_external_event_concert();
