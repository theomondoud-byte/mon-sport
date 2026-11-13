# Mon Sport V14 — fiabilité, hors connexion et tests

> Version en préparation sur la branche `feat/v14-fiabilite-tests-ergonomie`. La version publique reste inchangée jusqu'à validation de la pull request.

## Nouveautés V14
- Validation et nettoyage des favoris enregistrés lors du chargement : champs essentiels vérifiés, maximum 200 favoris, identifiants manquants recréés, noms limités. En cas de stockage local indisponible, un avertissement apparaît lors de la sauvegarde.
- Classements ESPN : aucun rang reconstruit à partir de l'ordre des lignes si la source ne fournit pas de rang. Les bilans NBA incomplets ne sont pas affichés comme complets.
- Agenda : les compétitions passées sans résultat confirmé sont triées selon leur date de fin lorsqu'elle est connue.
- Interface : indicateur hors connexion, conservation des informations consultables depuis le cache, actualisation réseau suspendue hors ligne.
- Vérification : `npm test` exécute des tests de non-régression sans dépendance. `npm run check` vérifie la syntaxe. Workflow GitHub Actions sur les branches et pull requests.

## Points à vérifier avant fusion
1. Sur Android, lancer l'application en ligne puis hors connexion, et vérifier l'apparition du bandeau.
2. Contrôler la présence des 20 favoris existants, ainsi que l'import/export et la persistance locale.
3. Parcourir les dix classements, vérifier l'absence de rang fictif si ESPN ne répond pas.
4. Vérifier les flux d'articles depuis le téléphone (CORS, Cloudflare, ESPN, FFL) et l'installation PWA.
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
