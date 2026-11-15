-- myNotebook — migration 0002 : cohérence des propriétaires, versions de notes, statut Drive
alter table public.resources add column if not exists drive_status text not null default 'ok' check (drive_status in ('ok','missing'));

-- Une ligne ne peut référencer que des lignes du même utilisateur
create or replace function public.assert_same_owner() returns trigger language plpgsql as $$
declare ref uuid; ok boolean;
begin
  ref := (to_jsonb(new) ->> TG_ARGV[0])::uuid;
  if ref is null then return new; end if;
  execute format('select exists(select 1 from public.%I where id = $1 and user_id = $2)', TG_ARGV[1]) into ok using ref, new.user_id;
  if not ok then raise exception 'Référence invalide (%.%)', TG_TABLE_NAME, TG_ARGV[0]; end if;
  return new;
end $$;

create trigger chk_notes_space before insert or update on public.notes for each row execute function public.assert_same_owner('space_id','learning_spaces');
create trigger chk_resources_space before insert or update on public.resources for each row execute function public.assert_same_owner('space_id','learning_spaces');
create trigger chk_reminders_space before insert or update on public.reminders for each row execute function public.assert_same_owner('space_id','learning_spaces');
create trigger chk_goals_space before insert or update on public.learning_goals for each row execute function public.assert_same_owner('space_id','learning_spaces');
create trigger chk_ann_res before insert or update on public.annotations for each row execute function public.assert_same_owner('resource_id','resources');
create trigger chk_ann_note before insert or update on public.annotations for each row execute function public.assert_same_owner('note_id','notes');
create trigger chk_rl_note before insert or update on public.resource_links for each row execute function public.assert_same_owner('note_id','notes');
create trigger chk_rl_res before insert or update on public.resource_links for each row execute function public.assert_same_owner('resource_id','resources');
create trigger chk_nl_from before insert or update on public.note_links for each row execute function public.assert_same_owner('from_note_id','notes');
create trigger chk_nl_to before insert or update on public.note_links for each row execute function public.assert_same_owner('to_note_id','notes');
create trigger chk_nt_note before insert or update on public.note_tags for each row execute function public.assert_same_owner('note_id','notes');
create trigger chk_nt_tag before insert or update on public.note_tags for each row execute function public.assert_same_owner('tag_id','tags');
create trigger chk_rp_res before insert or update on public.resource_progress for each row execute function public.assert_same_owner('resource_id','resources');
create trigger chk_nv_note before insert or update on public.note_versions for each row execute function public.assert_same_owner('note_id','notes');

-- Historique : un instantané de l'ancienne version, au plus toutes les 10 minutes
create or replace function public.snapshot_note() returns trigger language plpgsql as $$
begin
  if (old.title is distinct from new.title or old.content is distinct from new.content)
     and not exists (select 1 from public.note_versions v where v.note_id = old.id and v.created_at > now() - interval '10 minutes') then
    insert into public.note_versions (user_id, note_id, title, content) values (old.user_id, old.id, old.title, old.content);
  end if;
  return new;
end $$;
create trigger note_snapshot before update on public.notes for each row execute function public.snapshot_note();
