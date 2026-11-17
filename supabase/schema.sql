-- I am local mock-up schema. Read-only for the public (anon) role: the app keeps
-- each visitor's likes, follows and posts in their own browser, so nothing here is
-- written by visitors. All data is SAMPLE data; venue names are real.

create table if not exists people (
  id text primary key, name text not null, level text not null, bio text,
  avatar text not null, sharing boolean not null default false,
  at_venue text, recent text[] not null default '{}',
  photos text[] not null default '{}'
);
create table if not exists venues (
  address text, website text, instagram text,
  logo text, gallery text[] not null default '{}',
  id text primary key, name text not null, kind text not null,
  cat text not null check (cat in ('eat','drink','do')),
  x int not null, y int not null,             -- stylised map position, approximate
  score numeric(2,1) not null, trust int not null, img text not null,
  blurb text, deal text
);
create table if not exists events (
  id text primary key, venue_id text not null references venues(id),
  title text not null, when_text text not null,
  going text[] not null default '{}', going_more int not null default 0, chip text
);
create table if not exists posts (
  id text primary key, author_kind text not null check (author_kind in ('person','venue')),
  author_id text not null, venue_id text references venues(id),
  body text not null, photo text, chip text,
  likes int not null default 0, reps int not null default 0, at_text text, rating int
);
create table if not exists reviews (
  id text primary key, venue_id text not null references venues(id),
  person_id text not null references people(id),
  rating int not null check (rating between 1 and 5), body text not null
);

-- Row level security: anyone may read, nobody may write through the public API.
alter table people enable row level security;
alter table venues enable row level security;
alter table events enable row level security;
alter table posts enable row level security;
alter table reviews enable row level security;
do $$ declare t text; begin
  foreach t in array array['people','venues','events','posts','reviews'] loop
    execute format('drop policy if exists "public read" on %I', t);
    execute format('create policy "public read" on %I for select to anon, authenticated using (true)', t);
  end loop;
end $$;
