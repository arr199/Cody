-- Run once in the Neon SQL editor for production; Docker applies it locally.
create table if not exists snippets (
  id text primary key check (id ~ '^[0-9A-Za-z]{8}$'),
  hash text not null unique,
  html text not null,
  css text not null,
  js text not null,
  created_at timestamptz not null default now()
);
