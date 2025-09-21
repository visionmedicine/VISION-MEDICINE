-- Buat schema table reminders
create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- kalau pakai Supabase Auth
  medicine text not null,
  date date not null,
  hour int not null check (hour >= 0 and hour <= 23),
  minute int not null check (minute >= 0 and minute <= 59),
  is_set boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Trigger untuk update otomatis kolom updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_timestamp
before update on reminders
for each row
execute function update_updated_at_column();

-- Optional: index biar cepat query
create index if not exists idx_reminders_date
on reminders(date);

create index if not exists idx_reminders_user
on reminders(user_id);
