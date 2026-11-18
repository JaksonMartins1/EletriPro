-- Execute no SQL Editor do Supabase. Não exponha a service_role no navegador.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 plan text not null default 'free' check(plan in ('free','pro')),
 pro_expires_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.clients (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 name text not null check(length(trim(name)) between 1 and 200),
 email text, phone text,
 edit_count integer not null default 0 check(edit_count>=0),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create or replace function public.create_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.profiles(id) values(new.id) on conflict(id) do nothing; return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile();
insert into public.profiles(id) select id from auth.users on conflict do nothing;
create or replace function public.enforce_client_limits() returns trigger language plpgsql security definer set search_path='' as $$
declare paid boolean; n integer;
begin
 -- Lock the profile row to serialize client inserts for this owner.
 perform 1 from public.profiles where id=new.owner_id for update;
 select (plan='pro' and pro_expires_at>now()) into paid from public.profiles where id=new.owner_id;
 if tg_op='INSERT' then
   if new.owner_id<>auth.uid() then raise exception 'Proprietário inválido'; end if;
   if not coalesce(paid,false) then
     select count(*) into n from public.clients where owner_id=new.owner_id;
     if n>=1 then raise exception 'Plano Free: permitido apenas 1 cliente'; end if;
   end if;
   new.edit_count:=0;
 else
   if new.owner_id<>old.owner_id or new.id<>old.id or new.created_at<>old.created_at then raise exception 'Campos protegidos'; end if;
   if not coalesce(paid,false) and old.edit_count>=1 then raise exception 'Plano Free: edição já utilizada'; end if;
   new.edit_count:=old.edit_count+1;
 end if;
 new.updated_at:=now(); return new;
end $$;
drop trigger if exists trg_client_limits on public.clients;
create trigger trg_client_limits before insert or update on public.clients for each row execute function public.enforce_client_limits();
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
create policy "read own profile" on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy "read own clients" on public.clients for select to authenticated using(owner_id=(select auth.uid()));
create policy "insert own clients" on public.clients for insert to authenticated with check(owner_id=(select auth.uid()));
create policy "update own clients" on public.clients for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
-- Não conceder UPDATE de profiles ao cliente. Pro é ativado somente pelo backend após webhook validado.
revoke update, insert, delete on public.profiles from anon,authenticated;
-- Restringir campos modificáveis, impedindo adulteração de edit_count no payload.
revoke update on public.clients from authenticated;
grant update(name,email,phone) on public.clients to authenticated;
