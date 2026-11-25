# Set up Discord accounts and wipe alerts

Discord sign-in, synced favorites, and channel alerts require a Supabase project and a Discord application. Keep the Discord client secret, Supabase service role key, webhook tokens, and `CRON_SECRET` on the server. Vite exposes `VITE_*` values to the browser.

## Create the projects

1. Create a [Supabase project](https://supabase.com/dashboard) and note its project reference, project URL, and publishable key.
2. Create a [Discord application](https://discord.com/developers/applications).
3. In **OAuth2**, add the following redirect URLs. Replace `<project-ref>` with your Supabase project reference.
   - `https://<project-ref>.supabase.co/auth/v1/callback`
   - `https://<project-ref>.supabase.co/functions/v1/discord-connect`
4. Copy the Discord client ID and generate a client secret.

RustRadar uses Discord's `webhook.incoming` permission. A channel administrator selects the destination when connecting Discord.

## Configure Supabase Auth

1. Open **Authentication → Providers → Discord** and enable Discord with the client ID and client secret.
2. In **Authentication → URL Configuration**, set **Site URL** to `https://la-dosette.github.io/RustRadar/` for the original deployment, or use your deployment URL.
3. Allow redirects to `https://la-dosette.github.io/RustRadar/**` (or your deployment path) and `http://localhost:5173/**` for local development.

## Deploy the database and Edge Functions

Run these commands from the repository.

```sh
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
npx supabase functions deploy discord-connect
npx supabase functions deploy check-wipes
```

In **Supabase → Edge Functions → Secrets**, add the following values.

| Name | Value |
| --- | --- |
| `DISCORD_CLIENT_ID` | Discord application client ID |
| `DISCORD_CLIENT_SECRET` | Discord application client secret |
| `SITE_URL` | URL of the deployed RustRadar site |
| `CRON_SECRET` | A long random value, such as 64 hexadecimal characters |

Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions automatically.

## Schedule wipe checks

1. Open [supabase/cron.sql](supabase/cron.sql).
2. Replace `https://YOUR_PROJECT.supabase.co` with your project URL and `YOUR_CRON_SECRET` with the value configured for the Edge Functions.
3. Run the SQL in **Supabase → SQL Editor**. In **Integrations → Cron**, check that `rustradar-check-wipes` is scheduled every five minutes.

## Configure the site

For local development, copy `.env.example` to `.env.local` and set the following values.

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

For GitHub Pages, add the same values under **Settings → Secrets and variables → Actions → Variables**. The deployment workflow reads them at build time.

## Verify the setup

1. Start RustRadar and select **Connect Discord**.
2. Sign in, add a favorite, and reload the page to check synchronization.
3. In **Alerts → Connect Discord channel**, select a channel you administer and create a fresh-wipe rule for the last six hours with at least five players.
4. Check for messages after the next scheduled run. The job sends up to five matches in a batch and deduplicates repeat deliveries for the same rule and wipe.

If **Connect Discord** is missing, check the Vite variables and rebuild. If the redirect returns `discord=error`, verify the two OAuth redirect URLs and the Edge Function secrets. For missing alerts, check the Cron history and `check-wipes` logs.
