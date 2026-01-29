-- Debate state table for real-time sync
create table if not exists debate_state (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null,
  phase text not null, -- e.g. 'opening1', 'opening2', etc.
  time_left int not null, -- seconds
  running boolean not null default false,
  updated_at timestamp with time zone default timezone('utc', now())
);

-- Enable RLS
alter table debate_state enable row level security;

-- Allow users to select/insert/update their own debate state (match_id must match a match_queue row they are in)
create policy "Users can view debate state for their match" on debate_state for select using (
  match_id in (select match_id from match_queue where user_id = auth.uid())
);
create policy "Users can insert debate state for their match" on debate_state for insert with check (
  match_id in (select match_id from match_queue where user_id = auth.uid())
);
create policy "Users can update debate state for their match" on debate_state for update using (
  match_id in (select match_id from match_queue where user_id = auth.uid())
);
