create table if not exists public.support_forum_topic (
  id text primary key,
  chat_id bigint not null,
  chat_username text not null,
  message_thread_id bigint not null,
  topic_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_forum_topic enable row level security;
revoke all on table public.support_forum_topic from anon, authenticated;
