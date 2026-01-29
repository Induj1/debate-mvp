-- =============================================================================
-- Match queue + automatic pairing (run in Supabase SQL Editor)
-- After running: enable Realtime for table "match_queue" in Database → Replication
-- =============================================================================

-- Match queue table (create if not exists)
create table if not exists match_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'waiting',
  match_id uuid,
  topic text,
  side text,
  created_at timestamptz default timezone('utc', now())
);

-- Add columns if they don't exist (for existing tables)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'match_queue' and column_name = 'match_id') then
    alter table match_queue add column match_id uuid;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'match_queue' and column_name = 'topic') then
    alter table match_queue add column topic text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'match_queue' and column_name = 'side') then
    alter table match_queue add column side text;
  end if;
end $$;

-- Enable RLS
alter table match_queue enable row level security;

-- Users can read their own rows
drop policy if exists "Users can read own match_queue" on match_queue;
create policy "Users can read own match_queue" on match_queue for select using (auth.uid() = user_id);

-- Users can insert their own row (for waiting)
drop policy if exists "Users can insert own match_queue" on match_queue;
create policy "Users can insert own match_queue" on match_queue for insert with check (auth.uid() = user_id);

-- Users can update their own row (for realtime we need update from RPC; RPC uses definer)
drop policy if exists "Users can update own match_queue" on match_queue;
create policy "Users can update own match_queue" on match_queue for update using (auth.uid() = user_id);

-- Enable realtime for match_queue so listeners get updates (run once; skip if already added)
-- alter publication supabase_realtime add table match_queue;

-- RPC: pair current user with one waiting user, or add current user to queue
create or replace function public.match_with_waiting_user()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  my_uid uuid := auth.uid();
  other_id uuid;
  new_match_id uuid := gen_random_uuid();
  topics text[] := array[
    'Technology does more harm than good',
    'Social media improves society',
    'Remote work is better than office work',
    'Universal basic income should be implemented',
    'Climate change is the most urgent global issue'
  ];
  chosen_topic text;
begin
  if my_uid is null then
    return jsonb_build_object('error', 'not authenticated');
  end if;

  chosen_topic := topics[1 + floor(random() * array_length(topics, 1))::int];

  -- Find one waiting row from another user and lock it
  select id into other_id
  from match_queue
  where status = 'waiting' and user_id != my_uid
  order by created_at asc
  limit 1
  for update skip locked;

  if other_id is not null then
    -- Pair: update opponent's row and insert our row with same match_id and topic
    update match_queue
    set status = 'matched', match_id = new_match_id, topic = chosen_topic
    where id = other_id;

    insert into match_queue (user_id, status, match_id, topic)
    values (my_uid, 'matched', new_match_id, chosen_topic);

    return jsonb_build_object('match_id', new_match_id, 'topic', chosen_topic);
  else
    -- No opponent: add ourselves to queue
    insert into match_queue (user_id, status)
    values (my_uid, 'waiting');

    return jsonb_build_object('match_id', null, 'topic', null);
  end if;
end;
$$;

-- Allow authenticated users to call the RPC
grant execute on function public.match_with_waiting_user() to authenticated;
grant execute on function public.match_with_waiting_user() to service_role;
