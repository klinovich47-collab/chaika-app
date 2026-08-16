create or replace function public.chaika_require_review_on_user_event_insert()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.source is null and new.telegram_owner_id is not null then
    new.moderation_status := 'review';
    if coalesce(new.moderation_reason, '') in ('', 'local_rules_clean', 'ai_clean') then
      new.moderation_reason := 'manual_review_required';
    end if;
    new.moderated_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists chaika_require_review_on_user_event_insert_trg on public.events;
create trigger chaika_require_review_on_user_event_insert_trg
before insert on public.events
for each row execute function public.chaika_require_review_on_user_event_insert();

comment on function public.chaika_require_review_on_user_event_insert() is
  'Defense in depth: Telegram user events stay private until a moderator approves them.';
