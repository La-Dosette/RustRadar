# RustRadar

[Ouvrir RustRadar](https://la-dosette.github.io/RustRadar/)

Recherche de serveurs Rust autour du wipe, sur les vraies données Wipe Board : ce qui vient de wipe, ce qui va wiper, filtres serveur, recherche parmi les résultats, favoris locaux et copie de la commande de connexion F1. Interface entièrement en anglais.

La barre de recherche interroge l'annuaire complet de Wipe Board à partir de deux caractères et affiche jusqu'à 25 correspondances, indépendamment des 100 serveurs du feed courant. Cliquer sur le nom d'un serveur ouvre sa fiche RustRadar : population, file d'attente, taille de carte, rang, région, équipe, type, taux de récolte, adresse, dernier wipe, calendrier futur, source du planning, site/Discord et historique des wipes observés quand la page publique Wipe Board le fournit.

Trois onglets : **Fresh wipes** (serveurs wipés dans les dernières heures), **Upcoming** (serveurs qui wipent dans les prochaines heures, avec le type de wipe et la population attendue), **Favorites** (serveurs mis de côté, gardés sur l’appareil). La barre du haut affiche en permanence la date du prochain force wipe.

La clé localStorage des favoris reste `freshwipe-favorites`, nom d’origine du projet, pour ne pas perdre les favoris déjà enregistrés.

## Lancer

Node.js 22 ou supérieur. Installer avec `npm install`, puis `npm run dev`. Ouvrir http://localhost:5173.

Pour la production avec serveur : `npm run build`, puis `npm start`. Le serveur Node sert les fichiers et relaie l’API avec un cache de 60 secondes. Configurer `HOST=0.0.0.0` et `PORT` sur l’hébergeur.

Sans serveur (hébergement statique, GitHub Pages), le contenu de `dist/` suffit : l’application interroge d’abord `/api/servers`, et si cette route est absente elle appelle directement l’API Wipe Board depuis le navigateur. La bascule est automatique et testée dans les deux sens ; en mode statique le cache serveur de 60 s disparaît, mais la source renvoie `Cache-Control: public, max-age=60`.

## Publier sur GitHub Pages

`vite.config.js` fixe `base: './'`, donc la même compilation fonctionne à la racine d’un domaine comme sous `/<depot>/`. `.github/workflows/pages.yml` compile avec `npm ci` et déploie à chaque poussée sur `main` ; il faut activer Pages avec la source « GitHub Actions » dans les réglages du dépôt.

Adresse obtenue : `https://<compte>.github.io/<depot>/` pour un dépôt projet, ou la racine `https://<compte>.github.io/` si le dépôt s’appelle `<compte>.github.io`.

## Données et limites

Source : https://wipeboard.net/api — CC BY 4.0, attribution affichée dans la barre d’état. L’API renvoie `access-control-allow-origin: *`, ce qui autorise l’appel direct depuis le navigateur. Aucune clé nécessaire.

Trois points d’entrée utilisés : `/api/v1/just-wiped` (wipes récents), `/api/v1/wipes` (wipes à venir), `/api/v1/force-wipe` (prochain force wipe). Filtres transmis à la source : fenêtre en heures, région, taille d’équipe, type, cycle de wipe, joueurs minimum, tri.

Le taux de récolte fait exception : le paramètre `rate` de la source renvoie zéro résultat pour chacune de ses valeurs documentées (`1x-2x`, `5x-10x`, `50x`), vérifié sur les deux points d’entrée. Le filtre porte donc sur les serveurs déjà chargés, comme la recherche par nom, et l’interface le dit sous le compteur de résultats. Les valeurs proposées sont celles que la source produit réellement : 1x, 2x, 5x, 10x, 50x. Ce sont des paliers, pas des taux exacts — un serveur annoncé en 3x dans son nom est classé `5x` par Wipe Board.

Maximum 100 résultats par feed filtré et 25 résultats par recherche globale. Les heures de wipe à venir sont soit déclarées par le propriétaire du serveur, soit déduites des wipes passés : chaque ligne l’indique, et l’application reprend l’avertissement de la source (un horaire déduit sur un serveur vide est souvent un serveur mort). Un wipe récent ne garantit pas un wipe de blueprints ; les lignes à venir affichent le type de wipe annoncé. Les favoris sont stockés dans localStorage avec leur dernier relevé, sans surveillance en arrière-plan. Une erreur source est affichée sans inventer de résultats.

L'API documentée ne livre que le dernier wipe et le calendrier futur. En mode serveur, RustRadar complète la fiche en lisant le tableau « Observed wipes » de la page publique du serveur, mis en cache pendant 15 minutes. Sur un hébergement purement statique, la fiche conserve toutes les données API et propose le lien vers l'historique complet Wipe Board, mais le tableau des anciens wipes n'est pas reproduit localement.

## Design

Direction artistique reprise du Rust Server Control Center v12 (`C:\Users\quent\RustRPGServer\tool`) et appliquée au web.

Structure : barre supérieure sombre avec pastille de logo orange, logotype, sous-titre en capitales, date du prochain force wipe et indicateur d’état à droite (vert Wipe Board actif, ambre en chargement, rouge si la source tombe) ; barre latérale sombre avec sections CONTROL et FILTERS, élément actif marqué d’un liseré orange à gauche ; contenu avec titre de page, bouton primaire orange, sélecteur segmenté de fenêtre de wipe, panneau de résultats à lignes zébrées ; barre d’état en pied de page.

Palette du Control Center : fond #171614, panneaux #1e1813, creux #11100e, filets #2f2922 et #3a342d, orange #d65332 (plein foncé #b8401f), ambre #e7a84d, vert #72d79b, texte #f0e8de, sable #c8b9a8, gris chauds #9b9288 et #80776e. Rayons de 3 px, jamais plus.

Typographie : une seule écriture partout, Bahnschrift SemiCondensed, celle du titre du Control Center. Elle n’existe que sur Windows, donc le dépôt embarque Barlow Semi Condensed en repli (`src/fonts/`, six sous-ensembles woff2 latin et latin étendu, 120 Ko au total, licence OFL dans `src/fonts/OFL.txt`) : les visiteurs sur Mac, Linux ou téléphone voient une police quasi identique plutôt qu’un repli quelconque. Capitales espacées pour les titres, la navigation, les boutons, les libellés de filtres et les en-têtes de tableau ; casse normale pour les phrases et les champs. Seule exception, reprise du Control Center : l’adresse `client.connect` est en Consolas.

Code couleur des délais, calqué sur les statuts OK et ATTENTION du Control Center : vert pour un wipe de moins d’une heure ou un wipe imminent, ambre au-delà.

Repli mobile : la barre latérale passe au-dessus du contenu à 900 px (navigation horizontale, filtres sur deux colonnes), le tableau se replie à 760 px. Captures : `desktop.png` (1440 × 950) et `mobile.png` (500 × 900). Chrome refuse une fenêtre plus étroite que 500 px en mode headless sur Windows ; le rendu à 390 × 844 a été vérifié dans le navigateur, pas enregistré en fichier.

`concept.png` est la première maquette Imagegen, en charbon et vert citron : elle correspond à une version abandonnée et n’est plus la référence visuelle.
