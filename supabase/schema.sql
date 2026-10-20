-- Weiri Borges — transmissão ao vivo em destaque.
-- Executar uma vez no Supabase: SQL Editor → New query → colar → Run.
-- Pode ser executado novamente com segurança (idempotente).

-- 1. Administradores autorizados -------------------------------------------
-- Somente contas listadas aqui podem editar a transmissão. Ter login não basta.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
-- Nenhuma política: a tabela não é acessível pela API (anon/authenticated).
revoke all on table public.admin_users from anon, authenticated;

-- security definer: consulta admin_users sem expor a tabela.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Primeiro acesso: o painel pergunta se já existe administradora para decidir
-- entre a tela "Criar cadastro" e a tela "Entrar". Só devolve verdadeiro/falso.
create or replace function public.admin_exists()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users);
$$;
revoke execute on function public.admin_exists() from public;
grant execute on function public.admin_exists() to anon, authenticated;

-- O primeiro cadastro vira administradora; depois disso, novos cadastros são
-- recusados pelo próprio banco (vale para o site e para o painel do Supabase).
-- Para trocar de administradora: excluir a conta atual em Authentication → Users;
-- a tela de primeiro acesso volta a aparecer.
create or replace function public.claim_first_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  lock table public.admin_users in exclusive mode;
  if exists (select 1 from public.admin_users) then
    raise exception 'Cadastro encerrado: já existe uma administradora.'
      using errcode = 'P0001';
  end if;
  insert into public.admin_users (user_id) values (new.id);
  return new;
end;
$$;
revoke execute on function public.claim_first_admin() from public, anon, authenticated;

drop trigger if exists claim_first_admin on auth.users;
create trigger claim_first_admin
  after insert on auth.users
  for each row execute function public.claim_first_admin();

-- 2. Transmissão em destaque (registro único, id = 1) -----------------------
create table if not exists public.live_transmissions (
  id smallint primary key default 1,
  title text not null default '',
  description text not null default '',
  url text not null default '',
  button_text text not null default 'Assistir à transmissão',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint live_transmissions_single_row check (id = 1),
  constraint live_transmissions_title_len check (char_length(title) <= 80),
  constraint live_transmissions_description_len check (char_length(description) <= 200),
  constraint live_transmissions_button_len check (char_length(button_text) between 1 and 40),
  -- Somente HTTPS, sem espaços: bloqueia javascript:, data:, http: e afins.
  constraint live_transmissions_url_https check (
    url = '' or (url ~ '^https://[^[:space:]]+$' and char_length(url) <= 500)
  ),
  -- Só pode ficar ativa com título e link preenchidos.
  constraint live_transmissions_active_complete check (
    not is_active or (url <> '' and char_length(btrim(title)) > 0)
  )
);

create or replace function public.live_transmissions_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists live_transmissions_touch on public.live_transmissions;
create trigger live_transmissions_touch
  before insert or update on public.live_transmissions
  for each row execute function public.live_transmissions_touch();

insert into public.live_transmissions (id) values (1) on conflict (id) do nothing;

-- 3. Permissões e Row Level Security ---------------------------------------
alter table public.live_transmissions enable row level security;

revoke all on table public.live_transmissions from anon, authenticated;
grant select on table public.live_transmissions to anon, authenticated;
grant insert, update on table public.live_transmissions to authenticated;
-- Sem DELETE para ninguém pela API.

drop policy if exists "Visitantes leem a transmissão ativa" on public.live_transmissions;
create policy "Visitantes leem a transmissão ativa"
  on public.live_transmissions for select
  to anon, authenticated
  using (is_active);

drop policy if exists "Administradores leem tudo" on public.live_transmissions;
create policy "Administradores leem tudo"
  on public.live_transmissions for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Administradores inserem" on public.live_transmissions;
create policy "Administradores inserem"
  on public.live_transmissions for insert
  to authenticated
  with check ((select public.is_admin()));

drop policy if exists "Administradores atualizam" on public.live_transmissions;
create policy "Administradores atualizam"
  on public.live_transmissions for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- 4. Administradora --------------------------------------------------------
-- Não é preciso criar a conta manualmente: no primeiro acesso a /admin/, o
-- painel mostra "Criar cadastro" e a primeira conta criada vira administradora.
-- Conferir: select u.email from public.admin_users a join auth.users u on u.id = a.user_id;
