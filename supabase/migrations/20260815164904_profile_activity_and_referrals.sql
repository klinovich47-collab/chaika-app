alter table public.telegram_users add column if not exists avatar_url text;

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  inviter_telegram_user_id bigint not null references public.telegram_users(telegram_user_id) on delete cascade,
  invited_telegram_user_id bigint not null references public.telegram_users(telegram_user_id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint referrals_no_self check (inviter_telegram_user_id <> invited_telegram_user_id),
  constraint referrals_one_inviter_per_user unique (invited_telegram_user_id)
);

create index if not exists referrals_inviter_idx on public.referrals(inviter_telegram_user_id, created_at desc);
alter table public.referrals enable row level security;
revoke all on table public.referrals from anon, authenticated;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('avatars','avatars',true,3145728,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=3145728,allowed_mime_types=array['image/jpeg','image/png','image/webp'];