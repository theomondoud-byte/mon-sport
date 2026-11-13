# Mon Sport V14.6 — classements tennis plus lisibles sur smartphone

**Résultats intégrés aux tournois.** Pour ATP, WTA, Race ATP, Race WTA et Next Gen, la colonne « Résultat » est supprimée. Un indicateur **« En lice / prévu »** figure directement sous le « Tournoi en cours » lorsque la source l'indique ; la **défaite** est signalée et mise en évidence dans « Tournoi précédent ». Si le libellé source contient déjà « Défaite », l'interface n'ajoute pas une deuxième mention textuelle identique. Aucune victoire, défaite ou présence certaine en compétition n'est déduite d'une variation de points.

**Affichage mobile resserré.** Police et interlignes légèrement diminués, cellules et marges compactées, largeur des colonnes réduite, alignement des nombres préservé. Le nom du joueur et son rang restent visibles pendant le défilement horizontal ; les colonnes « Suiv. » et « Max » restent accessibles sur la droite. Les cinq tableaux tennis bénéficient de la même présentation compacte, y compris les Race et Next Gen sans colonne MC.

**Fiabilité.** Les sources live, les vrais rangs, les 150 premières positions, les filtres d'âge et de nationalité restent inchangés. Les états vides restent marqués par un tiret et la provenance des tournois « Observé récemment » est conservée. Tests de non-régression du placement des résultats et du rendu des cinq classements.

---

# Mon Sport V14.5 — cinq classements de tennis live, même présentation

**Depuis la V14.5, les cinq classements de tennis simple utilisent des relevés live français, chacun limité aux 150 premiers joueurs :**
- ATP live : https://live-tennis.eu/fr/classement-atp-live
- WTA live : https://live-tennis.eu/fr/classement-wta-live
- Race ATP live : https://live-tennis.eu/fr/classement-atp-race
- Race WTA live : https://live-tennis.eu/fr/classement-wta-race
- Next Gen live : https://live-tennis.eu/fr/classement-atp-race-next-gen

**Deux colonnes de tournois** : « Tournoi en cours » affiche la compétition indiquée comme actuelle par la source ; « Tournoi précédent » reprend le relevé explicite du fournisseur. Si cette dernière information est absente, Mon Sport peut afficher un tournoi vu dans ses précédents relevés (fenêtre de 14 jours), en le signalant par « Observé récemment ». Les observations ne sont pas des dates officielles de matchs. Les colonnes « Résultat », « Suiv. » et « Max » continuent à ne jamais inventer de résultats ou de projections.

**Même ergonomie** pour les cinq classements : rang live, joueur, âge, pays, points, variation de places et de points, résultat du tournoi, projections et filtres « moins de X ans » et nationalité (🇫🇷 France en premier). Les classements Race et Next Gen ne montrent pas de colonne « MC » fictive, car cette donnée n'est pas fournie par leur source. Les tableaux défilent horizontalement sur mobile.

**Collecte** : le workflow GitHub Actions récupère les cinq relevés depuis les sites publics toutes les six heures ; chaque tableau doit contenir 150 rangs vérifiés. Les derniers fichiers valides sont conservés lorsqu'une source échoue. Après 36 heures sans mise à jour, un tableau ne doit plus être présenté comme frais. Les fichiers sont publiés sur GitHub Pages avec le site.

Le classement **WTT/ITTF** concerne le tennis de table, une autre discipline ; il reste sur ses données datées, sans chiffres live de tennis artificiellement appliqués.

---

# Mon Sport V14.4 — filtres tennis et tournois observés sur 14 jours

- **Filtres au-dessus des classements ATP et WTA** : âge strictement inférieur à une limite choisie (de 16 à 51 ans), nationalité, ou les deux ensemble. La France figure toujours en tête des pays disponibles, les autres sont triés par leur nom français. Le tableau conserve les vrais rangs et précise le nombre de joueurs affichés. Le bouton **Effacer** rétablit tous les joueurs.
- **Classement ATP live, colonne « Tournois · 14 j »** : affiche le tournoi actuellement indiqué et les tournois précédemment observés dans les relevés ATP live de Mon Sport sur une fenêtre glissante de 14 jours. Les observations anciennes restent distinctes, avec le libellé « Observé ». Les informations ne sont ni datées fictivement ni présentées comme des résultats confirmés : le flux source ne fournit pas de date explicite par tournoi.
- **Historique progressif** : le collecteur GitHub Actions toutes les 6 heures conserve les tournois présents dans les relevés successifs, avec leur date de dernière observation, et supprime ceux qui ne sont plus vus depuis 14 jours. Le premier relevé ne peut pas reconstituer les événements absents des données précédentes ; l'historique se complète lors des actualisations.
- **Android/PWA** : versionnement des ressources V14.4 et renouvellement du cache pour rendre visibles les nouveaux filtres.
- **Tests** : Node vérifie les filtres, la combinaison âge + France, le respect du vrai rang, l'absence de résultats et les tournois expirés ; Python valide la conservation sur 14 jours, les doublons et la suppression des données périmées.

---

# V14.3 — Classement ATP 100 % live (13 novembre 2026)

L'onglet **ATP live** affiche maintenant **uniquement le top 150 du relevé [live-tennis.eu en français](https://live-tennis.eu/fr/classement-atp-live)**. Le classement ATP hebdomadaire ESPN n'est plus utilisé pour remplir ce tableau et n'est pas affiché en colonne.

Colonnes : rang live, meilleur classement (MC), joueur, âge, pays, points live, **variation de places**, **variation nette des points**, tournoi en cours, tournois précédents, **statut du résultat**, points après le prochain match gagné et maximum possible. Le tableau défile horizontalement sur mobile, avec les principales informations du joueur accessibles sur la gauche.

Le statut **Défaite** est extrait d'une mention explicite de la colonne « Tournois précédents », jamais de la variation des points. **En lice / prévu** signifie qu'un tournoi en cours est cité, pas que la victoire ou la présence sur le court a été confirmée. **Non indiqué** signifie que la source ne permet pas de conclure. Les cas où les qualifications puis la défaite du tableau principal concernent la même compétition sont pris en compte. Il n'existe pas de date individuelle de match garantie dans ce flux : ne pas présenter les défaites comme datées exactement de cette semaine.

Le relevé est contrôlé (150 rangs distincts, points cohérents) puis publié automatiquement toutes les six heures. Le tableau affiche l'horodatage de la copie ; après 36 heures sans données nouvelles, les informations ne sont plus qualifiées de live. En cas de panne réseau, seule une copie locale récente et explicitement marquée peut être proposée.

Les classements WTA et des autres disciplines conservent leurs sources et leur comportement précédents. Tests Node et Python couvrent le classement, les variations, le statut des défaites, les projections et l'intégrité du top 150.

---

## V14.2 — Tableau ATP live en colonnes

- Navigation : `Semaine` devient **Résultats** ; `Un favori` devient **Favoris** ; l'ancien onglet de gestion `Favoris` devient **Gérer mes suivis**.
- ATP et WTA : présentation en **8 colonnes** (rang, joueur, points officiels, points live, variation nette de points, tournoi, prochain match, maximum) dans un tableau à défilement horizontal sur téléphone, sans fiche de détail à ouvrir.
- ATP : les colonnes live, tournoi, prochain et maximum sont alimentées depuis un relevé public de **live-tennis.eu**, validé pour les 150 premières places, puis rapproché des joueurs du classement hebdomadaire ESPN. Si une valeur n'est pas fournie, un tiret est affiché (pas un calcul fictif).
- La colonne **Δ pts** est la variation **nette** entre le classement officiel et le relevé live, comprenant potentiellement les retraits de points de la semaine : ce n'est **pas** le seul nombre de points gagnés dans le tournoi.
- WTA : top 150 officiel conservé, données live supplémentaires non alimentées.
- Actualisation automatique via GitHub Actions toutes les six heures, avec contrôle strict de la structure et de la cohérence du top 150. Dernier relevé disponible dans `data/atp-live.json`, horodaté. Si la source devient inaccessible, on garde les valeurs officielles, sans afficher de projections périmées.
- Le collecteur utilise des données publiques, avec un lien vers la source visible dans l'application. Toute modification de structure ou d'accès du site peut nécessiter une adaptation du collecteur.

# Mon Sport V14 — fiabilité, hors connexion et tests

> Version en préparation sur la branche `feat/v14-fiabilite-tests-ergonomie`. La version publique reste inchangée jusqu'à validation de la pull request.

## Nouveautés V14
- Validation et nettoyage des favoris enregistrés lors du chargement : champs essentiels vérifiés, maximum 200 favoris, identifiants manquants recréés, noms limités. En cas de stockage local indisponible, un avertissement apparaît lors de la sauvegarde.
- Classements ESPN : aucun rang reconstruit à partir de l'ordre des lignes si la source ne fournit pas de rang. Les bilans NBA incomplets ne sont pas affichés comme complets.
- Agenda : les compétitions passées sans résultat confirmé sont triées selon leur date de fin lorsqu'elle est connue.
- Interface : indicateur hors connexion, conservation des informations consultables depuis le cache, actualisation réseau suspendue hors ligne.
- Vérification : `npm test` exécute des tests de non-régression sans dépendance. `npm run check` vérifie la syntaxe. Workflow GitHub Actions sur les branches et pull requests.

## Classements et visuels (extension V14 du 13 novembre 2026)
- **ATP et WTA, simple : top 150** chargé depuis les classements ESPN, sans conserver le top 10 incomplet en repli. Les derniers tableaux chargés avec succès sont enregistrés dans le navigateur avec l'heure de consultation ; s'ils sont montrés hors ligne, l'interface les signale comme des copies possiblement périmées.
- **Progression hebdomadaire** : l'évolution du rang est calculée à partir des champs `current` et `previous` transmis par ESPN (une hausse de rang affiche ▲, une baisse ▼).
- **Fiches ATP/WTA dépliables** : âge, pays, rang précédent, points officiels, détail des champs de tournoi. Les points en cours, points défendus, points au prochain tour et maximum possible restent marqués « Non disponible » car ESPN ne les fournit pas. Une source ATP live existe mais n'est pas intégrée sans flux vérifiable et accessible. Aucun chiffre fictif n'est projeté.
- **Race ATP/WTA, Next Gen, WTT** : les relevés antérieurs restent partiels, identifiés comme non exhaustifs. Le top 150 n'est donc garanti que sur les classements simples ATP/WTA si ESPN renvoie ses 150 entrées.
- **Football** : rang, points, matchs joués (J), victoires (V), nuls (N), défaites (D), buts marqués/encaissés (BP/BC) et différence de buts si ces statistiques sont envoyées par ESPN.
- **Articles** : miniatures ESPN ou WordPress/FFL, miniatures RSS lorsqu'elles sont fournies par le flux, et portrait du favori en secours si disponible. Sinon, pictogramme sportif lisible.
- **Résultats** : dans les badges, portraits/logo et pictogramme du sport remplacent le nom du favori (accessible en info-bulle et pour les lecteurs d'écran). Le titre du match et les verdicts sont conservés.
- **PWA** : le module `sports-media.js` est préchargé, cache version `mon-sport-v14-1`.

## Points à vérifier avant fusion
1. Sur Android, lancer l'application en ligne puis hors connexion, et vérifier l'apparition du bandeau.
2. Contrôler la présence des 20 favoris existants, ainsi que l'import/export et la persistance locale.
3. Vérifier le chargement des 150 premiers ATP/WTA, le mouvement hebdomadaire, les statistiques V/N/D et les classements Race marqués non exhaustifs.
4. Vérifier les miniatures d'articles depuis le téléphone (CORS, Cloudflare, ESPN, FFL), le repli sur icône et l'installation PWA.
5. Attendre les résultats verts du workflow `Tests Mon Sport` avant publication.

---

# Mon Sport V13 — Classements et articles sportifs

Application : https://theomondoud-byte.github.io/mon-sport/

## Dix classements
Nouvel onglet **🏆 Classements** :
- **ATP, WTA, Race ATP vers Turin, Race WTA vers les Finals, Next Gen ATP, WTT/ITTF** : relevés directement issus des classements des organismes sportifs et publiés au **9 novembre 2026**, étiquetés **non temps réel**. Les classements sont donc des instantanés ; les liens renvoient aux listes complètes des organismes.
- **Ligue 1, Liga, Ligue des champions, NBA conférence Ouest** : chargés depuis les classements ESPN, au moment de la consultation, via `/apis/v2/sports/…/standings`. Les données sont reprises telles que renvoyées, jamais recalculées. Si ESPN ne répond pas, le classement reste vide et un lien vers la source est affiché, plutôt que des points inventés.
- Les joueurs/équipes **déjà suivis** sont mis en évidence ; toucher leur nom ouvre `Un favori → Statistiques` sur ce favori. Les rangs des autres personnes ne sont pas des liens internes.
- Depuis `Un favori → Statistiques`, chaque lien **Voir le classement** ouvre directement le tableau correspondant.

Références : https://www.atptour.com/en/rankings/singles , https://www.atptour.com/en/rankings/singles-race-to-turin , https://www.atptour.com/en/rankings/next-gen-race , https://www.wtatennis.com/rankings/singles , https://www.wtatennis.com/rankings/race-singles , https://www.ittf.com/ittf-table-tennis-world-ranking/ , https://tennis-db.com/seasons-and-rankings .

**Race dans les fiches de tennis** : affichage des points et de la position ATP/WTA Race, et, pour Rafael Jódar et Moïse Kouamé, de la Next Gen. Les données datées du 9 novembre n'apparaissent pas comme des valeurs en direct.

## Statistiques issues des sources
Les statistiques de l'onglet favori ne recalculent plus les totaux ou moyennes sur les résultats incomplets enregistrés dans Mon Sport.

Elles affichent : profil sourcé, âge/pays, positions et points de classement, faits marquants issus de la fédération, chiffres de saison uniquement si un fournisseur a publié un relevé daté, puis **liens directs aux fiches officielles**. Exemples : Mirra Andreeva (WTA), Jannik Sinner (TennisDB), Victor Wembanyama (NBA/ESPN). Pour les sports sans API gratuite ou classement comparable, les statistiques officielles sont accessibles via le lien source, sans valeurs inventées.

Les chiffres de NBA de Wembanyama sont un relevé de saison 2026-27 arrêté au **12 novembre 2026**, pas une moyenne calculée par l'application.

## Articles
- Onglet renommé **📰 Articles**.
- Affiche les articles sportifs des **7 derniers jours**, du plus récent au plus ancien.
- Ajout du site humoristique sportif **Fédération Française de la Lose (FFL)** via son API WordPress publique, avec tentative de repli WordPress.com et via le relais Google News si configuré.
- Filtre des titres et extraits **people / vie privée** ; les sports et résultats sont prioritaires.
- Chaque carte conserve uniquement le titre, la date, la source et le lien vers l'éditeur, sans aperçu ni iframe bloquée.
- Si le site FFL refuse l'accès à son API, il reste un **lien FFL** ; aucun article fictif n'est généré. Le code source du Cloudflare Worker n'est pas automatiquement redéployé.

## Compte rendu d'une rencontre
- Une carte de match ou de course se développe au clic. Elle contient son **compte rendu factuel** et les métriques spécifiques au sport effectivement trouvées.
- Si le résumé ESPN renvoie un lien vers un **article de match**, celui-ci apparaît avec son titre et un lien de lecture.
- L'application affiche les articles sportifs récents associés à la rencontre lorsqu'un rapprochement précis est possible ; sinon elle permet de retrouver un article dans Google Actualités et de consulter la source sportive originale.
- Elle **n'invente pas** de déroulé de course, de buteur, de statistiques de break ou d'article de presse, et ne reproduit pas les articles sous droit d'auteur.

## Conservé
20 favoris, photos et logos, résultats passés sur un an, programmes à venir, badges V/D, navigation « Passés » par défaut, configuration Cloudflare et données du téléphone.

## Installation
Sur Android : Réglages → Vérifier et recharger. Nouvelle version du Service Worker `mon-sport-v13-0`, CSS et JS `?v=13.0.0`.

## Modules
- `rankings-view.js` : tableaux, sources ESPN et instantanés tennis/WTT, navigation favorite.
- `sports-articles.js` : flux FFL, filtre sportif / anti-people et articles associés.
- `stats-view.js` : indicateurs copiés des fournisseurs + liens vers tableaux.
- `src.js` et `agenda-ui.js` : onglet Classements, liens et compte rendus.
- `event-details.js` : découverte des articles ESPN d'une rencontre.
