# Vérification du 6 septembre 2026

## Session du matin (thème initial, interface française)

Compilation de production Vite réussie (23 modules). API réelle accessible via le serveur Node local. Tests dans le navigateur intégré Codex : chargement réel, filtre Europe et duo (54 résultats à l’heure du test), recherche Bestrust (4 résultats), copie de commande Rust avec message de succès, ajout de favori, persistance après rechargement, suppression du favori de test, recherche sans résultat et retour à la liste.

Référence visuelle de cette étape : concept.png (Imagegen, thème charbon et citron). Cette maquette n’est plus la référence : voir ci-dessous.

## Session suivante — renommage, anglais, DA Control Center

Trois changements demandés : nom RustRadar, interface en anglais uniquement, direction artistique reprise du Rust Server Control Center.

Génération Imagegen : les deux lancements évoqués (maquette et paysage) n’ont laissé aucun fichier sur le disque, et aucun outil de génération d’images n’était disponible dans la session. Le thème a donc été écrit à la main en CSS, sans nouvel asset raster ; la seule ressource ajoutée est la police Barlow Condensed Bold déjà présente dans `public/`.

Source de la DA : `C:\Users\quent\RustRPGServer\tool\RustRPG-Manager.xaml` et la capture `capture-v42-network-live.png`. Couleurs, familles de police et rayons relevés directement dans le XAML (occurrences comptées), structure relevée sur la capture : bandeau rouille, barre latérale à liseré actif, cartes bordées, tableau zébré, barre d’état.

Interface entièrement traduite : navigation, filtres et leurs options, en-têtes de tableau, ligne de résultats, états vides, messages de copie, modale des sources, pied de page, libellés ARIA, titre du document et `lang="en"`. Heures affichées en `en-GB`.

Vérifications dans le navigateur intégré (1440 × 950 puis 390 × 844) : chargement réel de la liste, bascule Servers/Favorites, ajout et retrait de favoris avec compteur et persistance après rechargement, copie de commande avec repli « Copy manually » quand le presse-papiers est refusé par le bac à sable, recherche texte (8 résultats sur « bestrust »), recherche vide affichant l’état « No servers found », modale Sources, barre d’état visible avec l’attribution Wipe Board et CC BY 4.0. Police Barlow Condensed chargée (`document.fonts.check` vrai), aucun débordement horizontal à 390 px (`scrollWidth - innerWidth` égal à 0). Compilation de production refaite après chaque modification, dernier build réussi.

Âge du wipe coloré comme les statuts du Control Center : vert sous une heure, ambre au-delà. Contrastes vérifiés au calcul sur le fond #171614 : ambre 8,8:1, orange sur creux 4,7:1, bouton primaire #b8401f avec texte #f0e8de 4,6:1, gris chauds au-dessus de 5:1.

## Session suivante — écriture unifiée et préparation GitHub Pages

Capture de la v12 du Control Center fournie : l’en-tête réel est sombre avec une pastille de logo, et toute l’interface utilise une seule police. La barre rouille dégradée, reprise de la capture v4.2, a donc été remplacée par une barre sombre avec pastille orange, et les trois familles (Barlow Condensed, Consolas, Segoe UI) ont été réduites à une seule, Segoe UI. Consolas ne subsiste que pour l’adresse `client.connect`, comme dans le Control Center. Le fichier de police embarqué et sa licence ont été supprimés du dépôt, faute d’usage.

Hébergement statique : l’API Wipe Board renvoie `access-control-allow-origin: *` (vérifié par requête avec en-tête `Origin`), donc le navigateur peut l’appeler directement. L’application tente `/api/servers` puis bascule sur l’API publique si cette route est absente. `vite.config.js` fixe `base: './'`.

Test de bout en bout du scénario GitHub Pages : `dist/` servi par un serveur statique sous `/rustradar/`, sans route `/api`. Relevé dans la page : ressources chargées depuis `/rustradar/assets/`, un appel à `/api/servers` en 404 puis un appel direct à `https://wipeboard.net/api/v1/just-wiped?limit=100&hours=24&min_players=0&sort=time`, 100 lignes affichées. Rechargement sur le serveur local ensuite : un appel au relais, aucun appel direct, 100 lignes. Les deux modes fonctionnent sans changement de code.

`.github/workflows/pages.yml` ajouté (compilation Node 22 et déploiement Pages sur poussée vers `main`). Aucun dépôt créé et rien publié à ce stade.

Choix de la police : cinq candidates comparées sur le même bloc d’interface (Segoe UI, Bahnschrift SemiCondensed, Consolas, Barlow Semi Condensed, Saira Condensed), capture envoyée pour arbitrage. Bahnschrift SemiCondensed retenue. Comme elle n’existe que sur Windows, Barlow Semi Condensed est embarquée en repli pour la version en ligne. Vérifié dans la page : `getComputedStyle(document.body).fontFamily` commence par Bahnschrift SemiCondensed et `document.fonts.check` la trouve ; la fonte embarquée n’est pas téléchargée tant qu’elle ne sert pas. Tailles relevées d’un pixel là où le condensé rendait le texte trop menu.

Passe de finition avant publication : favicon SVG en ligne (pastille orange et mire radar, chargement vérifié dans la page), méta description, état de chargement explicite « Loading servers… » à la place d’un panneau vide, message d’erreur réseau lisible au lieu de « Failed to fetch », carte CONNECT ancrée en bas de la barre latérale, `role="group"` sur le sélecteur de fenêtre de wipe, info-bulle de date protégée quand la source ne donne pas d’heure de wipe, sous-titre du logotype masqué sous 520 px pour éviter un retour à la ligne. États relus dans le navigateur : chargement, liste, résultat vide, erreur, modale, favoris, 1440 px et 390 px.

## Session suivante — wipes à venir, force wipe, filtres taux et cycle

Relevé de ce que la source expose réellement avant de coder : quatre autres points d’entrée (`/wipes`, `/force-wipe`, `/server`, `/stats`), trois filtres non branchés (`rate`, `cycle`, `country`) et une quinzaine de champs ignorés dans chaque serveur. Trois ajouts retenus.

Onglet Upcoming sur `/api/v1/wipes` : la réponse porte la liste sous la clé `wipes` et non `servers`, le client normalise les deux. Colonne « Wipes in » avec le compte à rebours et le type de wipe annoncé (`full` ou `map`), population attendue au wipe (`expected_at_wipe`), origine de l’horaire (déclaré par le propriétaire ou déduit) dans la ligne, avertissement de la source affiché sous le compteur de résultats. Vert sous une heure, ambre au-delà, dans les deux sens de lecture. Les onglets de fenêtre deviennent « Next 3 h » au lieu de « Under 3 h », et le tri « Soonest wipe » au lieu de « Recent wipe ».

Bandeau force wipe sur `/api/v1/force-wipe` : date et heure locales du prochain force wipe dans la barre du haut, règle complète en info-bulle, lien vers la page source.

Filtres taux de récolte et cycle de wipe ajoutés côté interface, relais et repli statique ; cycle de wipe et site officiel du serveur (souvent un Discord) affichés dans chaque ligne.

Vérifications : `server.mjs` a dû être redémarré, l’ancien processus servait encore le code précédent et ignorait le paramètre `feed`. Après redémarrage, `/api/force-wipe` renvoie bien la date, et `/api/servers?feed=upcoming` renvoie la clé `wipes` avec 45 entrées sur 6 h. Dans le navigateur : onglet Upcoming peuplé et trié du plus proche au plus lointain (premières lignes à 12 minutes), bascule entre les trois onglets sans perte de favoris, filtres taux et cycle transmis, aucune erreur en console, en-tête tenant sur une ligne à 1440 px et repliée proprement à 500 px après passage de la barre d’outils en `flex-wrap`.

Paquet renommé `rustradar`, `package-lock.json` généré et workflow passé à `npm ci` pour une compilation reproductible.

Correction du filtre de taux de récolte : chaque valeur documentée par la source a été testée séparément, `rate=1x-2x`, `rate=5x-10x` et `rate=50x` renvoient toutes zéro résultat sur `/just-wiped` comme sur `/wipes`. Le filtre a donc été retiré de la requête et refait dans le navigateur sur le champ `gather_rate`, dont l’échantillonnage de 100 serveurs ne donne que cinq valeurs : 1x, 2x, 5x, 10x, 50x. Les paliers groupés de l’interface ont été remplacés par ces cinq valeurs, une pastille de taux a été sortie de la ligne de métadonnées pour être lisible d’un coup d’œil, et une note sous le compteur indique que ce filtre porte sur les résultats chargés. Les valeurs du filtre de cycle ont été testées de la même façon : `few`, `weekly`, `biweekly` et `monthly` répondent, `daily` ne rend rien sur les wipes récents mais deux résultats sur les wipes à venir, l’option est donc conservée. Vérifié dans le navigateur : filtre 5x, 20 lignes sur 100 chargées, toutes marquées 5x.

Limites : dépendance à une seule API externe, 100 résultats maximum par feed, recherche globale limitée aux 25 meilleures correspondances, favoris conservant leur dernier relevé. Le fait que la barre latérale n’affiche pas la carte « Connect » sous 900 px est volontaire ; le message de copie répète l’instruction console F1. Les captures d’écran défilées ne sont pas rendues par le navigateur intégré (page blanche même sans CSS) : la vérification du bas de page s’est faite en réduisant la liste, pas en faisant défiler. `mobile.png` est enregistré à 500 px faute de fenêtre headless plus étroite sous Windows. Pas de publication publique effectuée ni de vérification de connexion au jeu Rust lui-même.

## Recherche globale et fiche serveur

Ajout vérifié le 6 septembre 2026 : recherche globale `Rustafied` donnant 40 correspondances et affichant les 25 premières ; ouverture de `Rustafied.com - EU Friday` ; rafraîchissement de la fiche par identifiant ; population 304/425, carte 4500, rang #40, adresse, planning hebdomadaire, cinq wipes futurs et trois wipes observés. Le proxy refuse les recherches de moins de deux caractères et valide les identifiants. En mode statique, l'appel direct à l'API reste disponible.

Captures : `server-detail.png` et `server-detail-mobile.png`. Contrôle dans le navigateur intégré aux formats ordinateur et 390 × 844 ; largeur du document mobile 380 px pour une fenêtre de 390 px, donc aucun débordement horizontal. La fiche réutilise la palette, les filets, la typographie condensée, les boutons et les rayons du Control Center existant. Le contenu principal, la navigation et les filtres restent inchangés ; les noms de serveurs sont désormais des boutons ouvrant la fiche. Compilation Vite et validation syntaxique Node réussies.
