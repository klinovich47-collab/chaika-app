alter table public.telegram_users
  add column if not exists is_moderator boolean not null default false;

comment on column public.telegram_users.is_moderator is
  'Can review, approve, reject, and delete events without receiving administrator-only configuration access.';
