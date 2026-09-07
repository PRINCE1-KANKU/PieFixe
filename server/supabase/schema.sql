-- Run this once in your Supabase project's SQL editor
-- (Dashboard → SQL Editor → New query → paste → Run).

create extension if not exists "pgcrypto";

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  type text not null default 'Repair tip',
  topic text not null,
  reading_time text not null default '03 min',
  summary text not null,
  body text not null,
  status text not null default 'published' check (status in ('draft', 'published')),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  appliance text,
  message text,
  source text default 'Website',
  created_at timestamptz not null default now()
);

-- Row Level Security: lock both tables down by default. The server talks to
-- Supabase using the SERVICE ROLE key, which bypasses RLS entirely, so the
-- app keeps working — this just stops anyone else querying your tables
-- directly with the public anon key.
alter table posts enable row level security;
alter table enquiries enable row level security;

-- Storage bucket for blog cover images, publicly readable.
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;
