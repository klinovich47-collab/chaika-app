create table if not exists public.chaika_app_config (
  id text primary key,
  forum_chat_id bigint,
  forum_username text,
  forum_title text,
  configured_by bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chaika_app_config_singleton check (id = 'telegram_forum'),
  constraint chaika_forum_username_format check (forum_username is null or forum_username ~ '^[A-Za-z0-9_]{5,32}$')
);

alter table public.chaika_app_config enable row level security;
revoke all on table public.chaika_app_config from anon, authenticated;
grant all on table public.chaika_app_config to service_role;

create table if not exists public.event_forum_topics (
  event_id uuid primary key references public.events(id) on delete cascade,
  chat_id bigint not null,
  message_thread_id integer,
  chat_username text,
  topic_url text,
  status text not null default 'creating',
  lease_until timestamptz,
  attempt_count integer not null default 0,
  created_by bigint,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_forum_topics_status check (status in ('creating','ready','error')),
  constraint event_forum_topics_ready_fields check (
    status <> 'ready' or (message_thread_id is not null and topic_url is not null)
  )
);

alter table public.event_forum_topics enable row level security;
revoke all on table public.event_forum_topics from anon, authenticated;
grant all on table public.event_forum_topics to service_role;

create index if not exists event_forum_topics_status_idx on public.event_forum_topics(status, updated_at);
create index if not exists event_forum_topics_chat_idx on public.event_forum_topics(chat_id);
