# RustRadar

[Ouvrir RustRadar](https://la-dosette.github.io/RustRadar/)

Recherche de serveurs Rust autour du wipe, sur les vraies données Wipe Board : ce qui vient de wipe, ce qui va wiper, filtres serveur, recherche parmi les résultats, favoris locaux ou synchronisés et copie de la commande de connexion F1. Une connexion Discord facultative permet de retrouver ses favoris et de créer des alertes de wipe dans un salon choisi. Interface entièrement en anglais.

RustRadar charge l'annuaire complet de Wipe Board, applique la recherche et les filtres à plus de 12 000 serveurs, puis affiche 50 résultats par page. Cliquer sur le nom d'un serveur ouvre sa fiche : population et occupation, file d'attente, taille et seed de carte, rang, région et pays, équipe, type, taux de récolte, cycle, adresse, description, calendrier futur, fiabilité du planning, site/Discord et historique des wipes observés quand la page publique Wipe Board le fournit.

Trois onglets : **Fresh wipes** (serveurs wipés dans les dernières heures), **Upcoming** (serveurs qui wipent dans les prochaines heures, avec le type de wipe et la population attendue), **Favorites** (serveurs mis de côté, gardés sur l’appareil). La barre du haut affiche en permanence la date du prochain force wipe.

La clé localStorage des favoris reste `freshwipe-favorites`, nom d’origine du projet, pour ne pas perdre les favoris déjà enregistrés. Sans compte, ils restent sur l'appareil. Après connexion Discord, RustRadar fusionne les favoris locaux avec ceux de Supabase et synchronise chaque ajout ou suppression.

## Lancer

Node.js 22 ou supérieur. Installer avec `npm install`, puis `npm run dev`. Ouvrir http://localhost:5173.

Pour la production avec serveur : `npm run build`, puis `npm start`. Le serveur Node sert les fichiers et relaie l’API avec un cache de 60 secondes. Configurer `HOST=0.0.0.0` et `PORT` sur l’hébergeur.

Sans serveur (hébergement statique, GitHub Pages), le contenu de `dist/` suffit : l’application tente les relais locaux `/api/directory` et `/api/servers`, puis appelle directement les points d’entrée Wipe Board quand ils sont absents. La bascule est automatique ; en mode statique le cache du serveur Node disparaît, mais la source fournit ses propres en-têtes de cache.

## Comptes Discord, favoris synchronisés et alertes

L'intégration est facultative : sans variables Supabase, RustRadar conserve exactement son fonctionnement local. Pour l'activer :

1. Créer un projet Supabase et une application dans le Discord Developer Portal.
2. Dans Discord, ajouter deux URL de redirection : `https://<project-ref>.supabase.co/auth/v1/callback` pour la connexion au compte et `https://<project-ref>.supabase.co/functions/v1/discord-connect` pour autoriser un salon d'alertes.
3. Activer le fournisseur Discord dans Supabase Auth avec le Client ID et le Client Secret. Définir l'URL du site sur `https://la-dosette.github.io/RustRadar/` et autoriser aussi `http://localhost:5173/` pendant le développement.
4. Lier le dépôt avec `npx supabase link`, appliquer la migration avec `npx supabase db push`, puis déployer les fonctions avec `npx supabase functions deploy discord-connect` et `npx supabase functions deploy check-wipes`. Leur validation JWT est désactivée dans `supabase/config.toml` car chaque fonction effectue son propre contrôle adapté au flux OAuth ou à la tâche planifiée.
5. Ajouter aux secrets des Edge Functions : `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `SITE_URL` et une valeur aléatoire `CRON_SECRET`.
6. Remplacer les valeurs dans `supabase/cron.sql`, puis l'exécuter dans l'éditeur SQL. Le contrôle des wipes sera lancé toutes les cinq minutes.
7. Copier `.env.example` vers `.env.local` pour le développement. Dans GitHub, créer les variables Actions `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` ; le workflow Pages les injecte pendant la compilation.

La connexion d'un salon utilise le flux OAuth `webhook.incoming` de Discord : l'utilisateur choisit un salon qu'il administre. Le jeton du webhook est enregistré dans une table privée inaccessible au navigateur. Les règles d'alerte peuvent viser les fresh wipes ou les wipes à venir et filtrer par fenêtre, région, pays, équipe, type, taux, type de wipe et population minimale. Une clé d'idempotence empêche le même wipe d'être envoyé deux fois pour une règle.

## Publier sur GitHub Pages

`vite.config.js` fixe `base: './'`, donc la même compilation fonctionne à la racine d’un domaine comme sous `/<depot>/`. `.github/workflows/pages.yml` compile avec `npm ci` et déploie à chaque poussée sur `main` ; il faut activer Pages avec la source « GitHub Actions » dans les réglages du dépôt.

Adresse obtenue : `https://<compte>.github.io/<depot>/` pour un dépôt projet, ou la racine `https://<compte>.github.io/` si le dépôt s’appelle `<compte>.github.io`.

## Données et limites

Source : https://wipeboard.net/api — CC BY 4.0, attribution affichée dans la barre d’état. L’API renvoie `access-control-allow-origin: *`, ce qui autorise l’appel direct depuis le navigateur. Aucune clé nécessaire.

Quatre points d'entrée utilisés : `/api/servers` (annuaire complet), `/api/v1/just-wiped` (wipes récents enrichis), `/api/v1/wipes` (wipes à venir enrichis), `/api/v1/force-wipe` (prochain force wipe). RustRadar fusionne les données utiles, puis applique localement la pagination, la recherche, le tri et les filtres afin qu'ils portent sur l'annuaire entier.

Les taux de récolte de l'annuaire sont normalisés en cinq groupes lisibles : 1x, 2x, 3x–5x, 6x–10x et 11x+. Les autres filtres couvrent la région, le pays, la taille d'équipe, le type, le cycle, la fiabilité du planning, la taille de carte, le type de wipe à venir et la population minimale. Les tris couvrent l'heure du wipe, la population, la file d'attente, le rang Wipe Board et la taille de carte.

Les heures de wipe à venir sont soit déclarées par le propriétaire du serveur, soit déduites des wipes passés : chaque ligne et chaque fiche l'indiquent. Un wipe récent ne garantit pas un wipe de blueprints ; les lignes à venir affichent le type de wipe annoncé. Les favoris gardent toujours une copie locale et sont également synchronisés dans Supabase lorsque l'utilisateur est connecté. Les alertes sont évaluées toutes les cinq minutes, sans garantie à la seconde près. L'application dépend de Wipe Board pour les données serveur et affiche une erreur source sans inventer de résultats. L'annuaire complet pèse environ 1 Mo compressé au premier chargement ; la pagination limite ensuite le rendu à 50 lignes.

L'API documentée ne livre que le dernier wipe et le calendrier futur. En mode serveur, RustRadar complète la fiche en lisant le tableau « Observed wipes » de la page publique du serveur, mis en cache pendant 15 minutes. Sur un hébergement purement statique, la fiche conserve toutes les données API et propose le lien vers l'historique complet Wipe Board, mais le tableau des anciens wipes n'est pas reproduit localement.

## Design

Direction artistique reprise du Rust Server Control Center v12 (`C:\Users\quent\RustRPGServer\tool`) et appliquée au web.

Structure : barre supérieure sombre avec pastille de logo orange, logotype, sous-titre en capitales, date du prochain force wipe et indicateur d’état à droite (vert Wipe Board actif, ambre en chargement, rouge si la source tombe) ; barre latérale sombre avec sections CONTROL et FILTERS, élément actif marqué d’un liseré orange à gauche ; contenu avec titre de page, bouton primaire orange, sélecteur segmenté de fenêtre de wipe, panneau de résultats à lignes zébrées ; barre d’état en pied de page.

Palette du Control Center : fond #171614, panneaux #1e1813, creux #11100e, filets #2f2922 et #3a342d, orange #d65332 (plein foncé #b8401f), ambre #e7a84d, vert #72d79b, texte #f0e8de, sable #c8b9a8, gris chauds #9b9288 et #80776e. Rayons de 3 px, jamais plus.

Typographie : une seule écriture partout, Bahnschrift SemiCondensed, celle du titre du Control Center. Elle n’existe que sur Windows, donc le dépôt embarque Barlow Semi Condensed en repli (`src/fonts/`, six sous-ensembles woff2 latin et latin étendu, 120 Ko au total, licence OFL dans `src/fonts/OFL.txt`) : les visiteurs sur Mac, Linux ou téléphone voient une police quasi identique plutôt qu’un repli quelconque. Capitales espacées pour les titres, la navigation, les boutons, les libellés de filtres et les en-têtes de tableau ; casse normale pour les phrases et les champs. Seule exception, reprise du Control Center : l’adresse `client.connect` est en Consolas.

Code couleur des délais, calqué sur les statuts OK et ATTENTION du Control Center : vert pour un wipe de moins d’une heure ou un wipe imminent, ambre au-delà.

Repli mobile : la barre latérale passe au-dessus du contenu à 900 px (navigation horizontale, filtres sur deux colonnes), le tableau se replie à 760 px. Captures : `desktop.png` (1440 × 950) et `mobile.png` (500 × 900). Chrome refuse une fenêtre plus étroite que 500 px en mode headless sur Windows ; le rendu à 390 × 844 a été vérifié dans le navigateur, pas enregistré en fichier.

`concept.png` est la première maquette Imagegen, en charbon et vert citron : elle correspond à une version abandonnée et n’est plus la référence visuelle.
