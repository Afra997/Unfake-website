-- Supabase schema for UNFAKE
-- Apply this in the Supabase SQL editor or via supabase CLI

-- PROFILES: extends auth.users with role and ban state
create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    full_name text,
    role text not null default 'user' check (role in ('user','admin')),
    banned_at timestamptz,
    created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

create policy if not exists "Public profiles are viewable by everyone"
on public.profiles for select using (true);

create policy if not exists "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy if not exists "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy if not exists "Admins manage all profiles"
on public.profiles for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- POSTS: user-submitted content, moderated by admins
create table if not exists public.posts (
    id bigserial primary key,
    title text not null,
    source text,
    description text,
    status text not null default 'pending' check (status in ('pending','true','false','deleted')),
    admin_reason text,
    user_id uuid references auth.users (id) on delete set null,
    flagged_by uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

-- Select policies
create policy if not exists "Anyone can view non-deleted posts"
on public.posts for select
using (status <> 'deleted');

create policy if not exists "Owners and admins can view all posts"
on public.posts for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- Insert policy
create policy if not exists "Authenticated users can insert posts"
on public.posts for insert
with check (
  auth.uid() = user_id
  and not exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.banned_at is not null
  )
);

-- Update policies
create policy if not exists "Owners can update own pending posts"
on public.posts for update
using (auth.uid() = user_id and status = 'pending')
with check (auth.uid() = user_id);

create policy if not exists "Admins can moderate posts"
on public.posts for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Delete policy
create policy if not exists "Admins can delete posts"
on public.posts for delete
using (public.is_admin(auth.uid()));

-- VOTES: user votes per post
create table if not exists public.votes (
    post_id bigint not null references public.posts (id) on delete cascade,
    user_id uuid not null references auth.users (id) on delete cascade,
    vote boolean not null,
    created_at timestamptz not null default now(),
    primary key (post_id, user_id)
);

alter table public.votes enable row level security;

create policy if not exists "Anyone can view votes"
on public.votes for select using (true);

create policy if not exists "Users can insert own vote"
on public.votes for insert
with check (
  auth.uid() = user_id
  and not exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.banned_at is not null
  )
);

create policy if not exists "Users can update own vote"
on public.votes for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "Users can delete own vote"
on public.votes for delete
using (auth.uid() = user_id);

