-- Replace the three placeholder values, then run this once in the Supabase SQL editor.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret('https://YOUR_PROJECT.supabase.co', 'project_url');
select vault.create_secret('YOUR_CRON_SECRET', 'rustradar_cron_secret');

select cron.schedule(
  'rustradar-check-wipes',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/check-wipes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'rustradar_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
