# Activer les comptes et alertes Discord de RustRadar

Le code est prêt. Cette procédure crée les services externes et branche la version GitHub Pages. Ne place jamais le Client Secret Discord, la Service Role Key Supabase, un jeton de webhook ou `CRON_SECRET` dans GitHub ou dans un fichier `VITE_*` : les variables Vite sont publiques dans le navigateur.

## 1. Créer les deux projets

1. Crée un projet sur https://supabase.com/dashboard et note son **Project ref**, son **Project URL** et sa **Publishable key**.
2. Crée une application **RustRadar** sur https://discord.com/developers/applications.
3. Dans Discord, ouvre **OAuth2**, puis ajoute exactement ces deux redirections en remplaçant `<project-ref>` :
   - `https://<project-ref>.supabase.co/auth/v1/callback`
   - `https://<project-ref>.supabase.co/functions/v1/discord-connect`
4. Copie le **Client ID**. Génère aussi un **Client Secret**, mais garde-le privé.

RustRadar utilise l'autorisation Discord `webhook.incoming` pour les messages. Il n'est pas nécessaire d'activer un bot connecté en permanence ni de lui donner accès à tous les salons.

## 2. Configurer Supabase Auth

1. Dans Supabase, ouvre **Authentication → Providers → Discord**.
2. Active Discord et renseigne le Client ID et le Client Secret.
3. Dans **Authentication → URL Configuration** :
   - Site URL : `https://la-dosette.github.io/RustRadar/`
   - Redirect URLs : `https://la-dosette.github.io/RustRadar/**` et `http://localhost:5173/**`

## 3. Créer la base et déployer les fonctions

Depuis le dossier du projet :

```powershell
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
npx supabase functions deploy discord-connect
npx supabase functions deploy check-wipes
```

Dans **Supabase → Edge Functions → Secrets**, crée :

| Nom | Valeur |
|---|---|
| `DISCORD_CLIENT_ID` | Client ID de l'application Discord |
| `DISCORD_CLIENT_SECRET` | Client Secret Discord privé |
| `SITE_URL` | `https://la-dosette.github.io/RustRadar/` |
| `CRON_SECRET` | Une chaîne aléatoire longue, par exemple 64 caractères hexadécimaux |

Supabase fournit automatiquement `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` aux Edge Functions.

## 4. Activer le contrôle toutes les cinq minutes

1. Ouvre [supabase/cron.sql](supabase/cron.sql).
2. Remplace `https://YOUR_PROJECT.supabase.co` par le Project URL.
3. Remplace `YOUR_CRON_SECRET` par exactement la même valeur que le secret Edge Function.
4. Exécute le fichier dans **Supabase → SQL Editor**.
5. Dans **Integrations → Cron**, vérifie que `rustradar-check-wipes` apparaît.

## 5. Configurer le site

Pour travailler en local, copie `.env.example` vers `.env.local` :

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Dans GitHub, ouvre **RustRadar → Settings → Secrets and variables → Actions → Variables**, puis crée les deux mêmes variables :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

La Publishable key est conçue pour le navigateur. N'ajoute jamais la Service Role Key aux variables GitHub Pages.

## 6. Contrôle final

1. Lance `npm run dev` et vérifie que **Connect Discord** apparaît.
2. Connecte-toi : un favori local doit être copié dans le compte.
3. Ajoute ou enlève un favori, recharge la page et vérifie qu'il reste synchronisé.
4. Ouvre **Alerts → Connect Discord channel** et choisis un salon que tu administres.
5. Crée une règle simple : Fresh wipes, fenêtre 6 h, au moins 5 joueurs.
6. Attends au maximum cinq minutes. RustRadar peut envoyer jusqu'à cinq résultats lors du premier passage, puis ne renverra pas le même wipe pour cette règle.

Si **Connect Discord** n'apparaît pas, les variables Vite manquent au moment de la compilation. Si la connexion revient avec `discord=error`, contrôle les deux redirections Discord et les secrets de la fonction. Si aucune alerte n'arrive, vérifie l'historique du job Cron et les logs de `check-wipes` dans Supabase.
