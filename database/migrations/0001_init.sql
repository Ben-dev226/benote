-- myNotebook — migration 0001 : schéma initial + RLS
create extension if not exists pgcrypto;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- Utilisateurs (profil lié à auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text, avatar_url text, created_at timestamptz not null default now()
);
create table public.user_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  theme text not null default 'dark' check (theme in ('dark','light')),
  locale text not null default 'fr',
  ai_enabled boolean not null default false,
  settings jsonb not null default '{}'
);
-- Jetons Google : AUCUNE policy => accessible uniquement avec la clé service_role (serveur)
create table public.google_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  google_email text, refresh_token_enc text, scopes text[],
  drive_folder_id text, connected_at timestamptz not null default now(), revoked_at timestamptz
);

create table public.learning_spaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text, icon text, category text,
  status text not null default 'active' check (status in ('active','archived')),
  position int not null default 0,
  progress int not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.learning_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  space_id uuid not null references public.learning_spaces(id) on delete cascade,
  title text not null, target_date date, done boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  space_id uuid references public.learning_spaces(id) on delete set null,
  title text not null default '', content text not null default '',
  folder text, favorite boolean not null default false,
  search tsvector generated always as (to_tsvector('french', coalesce(title,'') || ' ' || coalesce(content,''))) stored,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.note_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  title text, content text, created_at timestamptz not null default now()
);
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  space_id uuid references public.learning_spaces(id) on delete set null,
  kind text not null check (kind in ('document','image','video','audio','link','other')),
  name text not null, description text,
  drive_file_id text, mime_type text, size_bytes bigint, url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.resource_progress (
  user_id uuid not null references public.users(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  last_page int, last_seconds numeric, percent int check (percent between 0 and 100),
  seconds_spent int not null default 0, updated_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);
create table public.annotations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  note_id uuid references public.notes(id) on delete set null,
  page int, timestamp_s numeric, content text, data jsonb,
  created_at timestamptz not null default now()
);
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null, unique (user_id, name)
);
create table public.note_tags (  -- table de liaison (ajout nécessaire aux étiquettes)
  user_id uuid not null references public.users(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (note_id, tag_id)
);
create table public.note_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  from_note_id uuid not null references public.notes(id) on delete cascade,
  to_note_id uuid not null references public.notes(id) on delete cascade,
  label text, unique (from_note_id, to_note_id)
);
create table public.resource_links (  -- note <-> ressource (page PDF, timestamp vidéo)
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  page int, timestamp_s numeric
);
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  space_id uuid references public.learning_spaces(id) on delete set null,
  title text not null, remind_at timestamptz not null,
  recurrence text check (recurrence in ('daily','weekly','monthly')),
  done boolean not null default false, created_at timestamptz not null default now()
);
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  space_id uuid references public.learning_spaces(id) on delete set null,
  action text not null, entity_type text, entity_id uuid, meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- IA (Phase 4) : catalogue global en lecture seule, tâches par utilisateur
create table public.ai_providers (id uuid primary key default gen_random_uuid(), name text not null unique, enabled boolean not null default true, free_tier boolean not null default true);
create table public.ai_models (id uuid primary key default gen_random_uuid(), provider_id uuid not null references public.ai_providers(id) on delete cascade, name text not null, enabled boolean not null default true, unique (provider_id, name));
create table public.ai_agents (id uuid primary key default gen_random_uuid(), slug text not null unique, label text not null, role text not null);
create table public.ai_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  agent_id uuid references public.ai_agents(id), model_id uuid references public.ai_models(id),
  status text not null default 'pending' check (status in ('pending','done','failed')),
  input jsonb, output jsonb, created_at timestamptz not null default now()
);
insert into public.ai_agents (slug,label,role) values
 ('professeur','Professeur','Expliquer les notions'),('documentaliste','Documentaliste','Analyser les ressources'),
 ('synthese','Synthèse','Produire des résumés'),('revision','Révision','Générer des questions et fiches'),
 ('recherche','Recherche','Retrouver des informations'),('organisateur','Organisateur','Aider à organiser les notes');

-- Index
create index on public.learning_spaces (user_id, status, position);
create index on public.notes (user_id, space_id);
create index on public.notes using gin (search);
create index on public.resources (user_id, space_id);
create index on public.reminders (user_id, remind_at);
create index on public.activity_logs (user_id, created_at desc);

-- updated_at
create trigger t_upd before update on public.learning_spaces for each row execute function public.set_updated_at();
create trigger t_upd before update on public.notes for each row execute function public.set_updated_at();
create trigger t_upd before update on public.resources for each row execute function public.set_updated_at();

-- Création du profil à l'inscription
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  insert into public.user_settings (user_id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- RLS : chaque utilisateur ne voit et ne modifie que ses lignes
do $$ declare t text; begin
  foreach t in array array['user_settings','learning_spaces','learning_goals','notes','note_versions','resources','resource_progress','annotations','tags','note_tags','note_links','resource_links','reminders','activity_logs','ai_tasks'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy owner_all on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
  foreach t in array array['ai_providers','ai_models','ai_agents'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy read_all on public.%I for select to authenticated using (true)', t);
  end loop;
end $$;
alter table public.users enable row level security;
create policy own_profile on public.users for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
alter table public.google_connections enable row level security; -- sans policy : serveur uniquement
