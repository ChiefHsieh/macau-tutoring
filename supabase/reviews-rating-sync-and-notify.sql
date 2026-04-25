-- Keep tutor profile rating stats in sync with reviews
-- and notify tutor when a new student review arrives.
-- Run once in Supabase SQL Editor.

create or replace function public.refresh_tutor_rating_stats(p_tutor_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.tutor_profiles tp
  set
    average_rating = stats.avg_rating,
    total_reviews = stats.total_reviews
  from (
    select
      coalesce(round(avg(r.rating)::numeric, 2), 0)::numeric(3,2) as avg_rating,
      count(*)::int as total_reviews
    from public.reviews r
    where r.tutor_id = p_tutor_id
  ) as stats
  where tp.id = p_tutor_id;
$$;

create or replace function public.on_review_change_sync_tutor_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.refresh_tutor_rating_stats(new.tutor_id);
    return new;
  elsif tg_op = 'UPDATE' then
    perform public.refresh_tutor_rating_stats(new.tutor_id);
    if old.tutor_id is distinct from new.tutor_id then
      perform public.refresh_tutor_rating_stats(old.tutor_id);
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    perform public.refresh_tutor_rating_stats(old.tutor_id);
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_reviews_sync_tutor_rating on public.reviews;
create trigger trg_reviews_sync_tutor_rating
after insert or update or delete on public.reviews
for each row
execute function public.on_review_change_sync_tutor_profile();

create or replace function public.notify_tutor_on_new_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_name text;
  v_comment_preview text;
begin
  select coalesce(nullif(trim(full_name), ''), 'Student')
  into v_student_name
  from public.users
  where id = new.student_id;

  v_comment_preview := coalesce(left(trim(new.comment), 180), '');
  if v_comment_preview <> '' and length(v_comment_preview) < length(coalesce(trim(new.comment), '')) then
    v_comment_preview := v_comment_preview || '…';
  end if;

  begin
    insert into public.notifications (user_id, type, title, content, related_id)
    values (
      new.tutor_id,
      'system',
      'New student review',
      v_student_name
        || ' left a '
        || new.rating::text
        || '-star review.'
        || case when v_comment_preview <> '' then ' "' || v_comment_preview || '"' else '' end,
      new.id
    );
  exception
    when others then
      raise warning 'notify_tutor_on_new_review: %', sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists trg_reviews_notify_tutor on public.reviews;
create trigger trg_reviews_notify_tutor
after insert on public.reviews
for each row
execute function public.notify_tutor_on_new_review();

