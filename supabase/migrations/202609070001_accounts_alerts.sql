create extension if not exists pgcrypto;

create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  server_id text not null,
  server_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, server_id)
);

create table public.discord_destinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  guild_id text,
  channel_id text not null,
  name text not null default 'RustRadar alerts',
  created_at timestamptz not null default now(),
  unique (user_id, channel_id)
);

create table public.discord_webhook_secrets (
  destination_id uuid primary key references public.discord_destinations(id) on delete cascade,
  webhook_id text not null,
  webhook_token text not null,
  updated_at timestamptz not null default now()
);

create table public.discord_oauth_states (
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  return_to text not null,
  expires_at timestamptz not null
);

create table public.alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  destination_id uuid not null references public.discord_destinations(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  enabled boolean not null default true,
  feed text not null check (feed in ('fresh', 'upcoming')),
  hours integer not null default 6 check (hours between 1 and 24),
  name_query text not null default '' check (char_length(name_query) <= 80),
  region text not null default '',
  country text not null default '',
  team text not null default '',
  server_type text not null default '',
  rate text not null default '',
  schedule_source text not null default '' check (schedule_source in ('', 'user', 'detected')),
  wipe_kind text not null default '',
  min_players integer not null default 5 check (min_players between 0 and 2000),
  created_at timestamptz not null default now()
);

create table public.notification_deliveries (
  subscription_id uuid not null references public.alert_subscriptions(id) on delete cascade,
  server_id text not null,
  wipe_at timestamptz not null,
  delivered_at timestamptz not null default now(),
  primary key (subscription_id, server_id, wipe_at)
);

create index alert_subscriptions_enabled_idx on public.alert_subscriptions(enabled) where enabled;

create function public.limit_alert_subscriptions() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.alert_subscriptions where user_id = new.user_id) >= 10 then
    raise exception 'A maximum of 10 alert rules is allowed per account';
  end if;
  return new;
end;
$$;

create trigger enforce_alert_subscription_limit before insert on public.alert_subscriptions
for each row execute function public.limit_alert_subscriptions();

alter table public.favorites enable row level security;
alter table public.discord_destinations enable row level security;
alter table public.discord_webhook_secrets enable row level security;
alter table public.discord_oauth_states enable row level security;
alter table public.alert_subscriptions enable row level security;
alter table public.notification_deliveries enable row level security;

create policy "Users manage their favorites" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read their Discord destinations" on public.discord_destinations for select using (auth.uid() = user_id);
create policy "Users read their alerts" on public.alert_subscriptions for select using (auth.uid() = user_id);
create policy "Users add their alerts" on public.alert_subscriptions for insert with check (auth.uid() = user_id and exists (select 1 from public.discord_destinations d where d.id = destination_id and d.user_id = auth.uid()));
create policy "Users update their alerts" on public.alert_subscriptions for update using (auth.uid() = user_id) with check (auth.uid() = user_id and exists (select 1 from public.discord_destinations d where d.id = destination_id and d.user_id = auth.uid()));
create policy "Users delete their alerts" on public.alert_subscriptions for delete using (auth.uid() = user_id);

revoke all on public.discord_webhook_secrets from anon, authenticated;
revoke all on public.discord_oauth_states from anon, authenticated;
revoke all on public.notification_deliveries from anon, authenticated;

grant select, insert, update, delete on public.favorites to authenticated;
grant select on public.discord_destinations to authenticated;
grant select, insert, update, delete on public.alert_subscriptions to authenticated;
revoke execute on function public.limit_alert_subscriptions() from public, anon, authenticated;
