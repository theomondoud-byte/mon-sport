# Mon Sport V9 — actualités de la semaine et fiches sportives

Application PWA Android : https://theomondoud-byte.github.io/mon-sport/

## Actualités : les 7 derniers jours, du plus récent au plus ancien
- Le fil est limité aux 168 dernières heures à partir de l'heure du téléphone ; date obligatoire, dédoublonnage des URLs/titres et tri décroissant.
- Les liens sont maintenant des **cartes déroulantes** dans l'onglet Actus. On y lit le titre, la date, le favori et l'extrait disponible ; un bouton permet de charger l'article dans une fenêtre `iframe` **à l'intérieur de Mon Sport** si le site l'autorise.
- Certains éditeurs interdisent l'intégration par `X-Frame-Options`, `CSP frame-ancestors` ou un abonnement. L'application garde alors l'extrait RSS/ESPN et un lien vers le site source. **Elle ne copie pas le texte intégral sous droits d'auteur** et n'invente pas de résumé.
- Les contenus viennent du relais Cloudflare existant lorsqu'il est configuré, complétés par des actualités publiques ESPN filtrées sur les noms des favoris.
- Le dossier `worker/index.js` propose un Worker Cloudflare amélioré qui demande explicitement des nouvelles Google RSS sur 7 jours et renvoie un extrait nettoyé. **IMPORTANT : modifier ce fichier sur GitHub ne publie pas automatiquement le Worker Cloudflare existant**. Tant que celui-ci n'est pas redéployé, l'interface V9 continuera de filtrer les dates et d'utiliser les descriptions ESPN disponibles, mais les anciens retours Google RSS ne contiendront pas forcément d'extrait.

## Un favori : âge, classement et faits marquants
- **Profil** : âge calculé depuis la date de naissance vérifiée lorsqu'elle est connue, pays, rôle, classement ATP/WTA/ITTF **daté au 9 novembre 2026**, faits de carrière et palmarès sourcés.
- **Forme et résultats sur 12 mois** : nombre d'événements trouvés, bilan V/D/N lorsqu'il est identifiable, taux de victoire sur les rencontres avec verdict, principales compétitions, dernier résultat.
- **Football** : pour les équipes, buts pour/contre, différence de buts et bilan ; mention qu'un match du club ne prouve pas la participation de Mbappé.
- **NBA** : points marqués/encaissés par match pour les équipes ; pour Wembanyama, moyennes PTS/REB/AST/BLK **sur les feuilles individuelles effectivement reçues**, sans les extrapoler à toute la saison.
- **Tennis** : classement officiel daté, bilan par matchs recensés, puis aces, premières balles, doubles fautes et balles de break sur les feuilles de match disponibles.
- **Tennis de table** : classement ITTF semaine 46, bilan et résultats de sets publiés ; les points de set détaillés sont souvent absents des sources libres.
- **Rugby** : points pour/contre et, sur les rencontres documentées, essais, transformations, pénalités et plaquages.
- **Natation** : âge, palmarès, records et chronos recensés ; une course ne se résume pas automatiquement à V/D.
- **Cyclisme** : âge, équipe, victoires, podiums et faits marquants ; on ne confond pas étapes, courses et classements généraux.

Les rangs et faits sont des **instantanés vérifiés au 12 novembre 2026**, pas des données en direct. Chaque bloc possède des liens vers les sources.

## Plus de détails au clic sur un match
- Une carte de match conserve son résumé factuel local et essaie **au premier clic seulement** de charger `/summary?event=...` depuis ESPN quand l'identifiant et la compétition sont connus.
- **Football** : tirs, tirs cadrés, possession, corners, fautes, hors-jeu, cartons et actions de but ; seuls les champs présents dans le résumé ESPN sont affichés.
- **Basket-ball** : points, rebonds, passes, adresse, interceptions, contres, turnovers et joueurs si les feuilles de match les exposent.
- **Tennis** : aces, doubles fautes, premières balles, points sur service et balles de break (l'API ESPN ne fournit pas ces chiffres sur tous les tournois, en particulier Challenger/ITF).
- **Rugby** : essais, transformations, pénalités, plaquages, possession si disponibles.
- **Tennis de table** : nombre de manches, score et compétition lorsqu'ils sont indiqués.
- **Natation** : distance, temps et classement disponibles dans les résultats sources.
- **Cyclisme** : épreuve, étape, classement et écart lorsqu'ils figurent dans la fiche.

**Aucune statistique n'est inventée**. Si la source ne propose pas de feuille détaillée, le match affiche son résultat et un message explicite.

## Photos : correction V8
- Six portraits ont un fichier libre Commons identifié et un lien direct `Special:FilePath` : Sinner, Alcaraz, Fils, Marchand, Félix Lebrun, Mbappé.
- Les autres sportifs sont recherchés via l'API REST Wikipédia, en vérifiant le titre de la page. Sans photo reconnue, les initiales restent visibles.
- Un échec réseau n'est plus mémorisé comme une photo inexistante pendant 7 jours ; le cache négatif dure 30 minutes maximum. Les images cassées sont remplacées par les initiales sur Android.
- Les liens vers Wikimedia Commons / Wikipédia permettent de retrouver les auteurs et licences. Aucun fichier de police ni photo non libre n'est copié dans le dépôt.

## Configuration et déploiement
- Branches et publication gérées sur GitHub Pages. Service Worker en `mon-sport-v9-0`, ressources versionnées `?v=9.0.0`.
- Dans l'application : **Réglages → Vérifier et recharger**. Le pied de page doit indiquer V9.
- Favoris sauvegardés sous `monsport-favorites-v1` ; relais sous `monsport-worker-url-v1` — **inchangés**.
- Le Worker Cloudflare ne se met pas à jour automatiquement à partir de GitHub ; son redéploiement reste facultatif pour bénéficier de descriptions Google RSS plus riches.

## Modules
- `news-view.js` : période 7 jours, classement, lecteur intégré et actualités ESPN complémentaires.
- `sports-profiles.js` : âges, classements datés, palmarès et indicateurs par sport.
- `stats-view.js` : affichage profil + forme, statistiques par discipline.
- `event-details.js` : téléchargement à la demande et analyse des feuilles ESPN.
- `photos.js` : images Commons directes, repli REST, crédits et cache corrigé.
- `agenda-ui.js`, `agenda-fetch.js`, `src.js` : interface / source ID pour les rencontres.
- `worker/index.js` : exemple du Worker Google RSS enrichi, **sans déploiement automatique**.
