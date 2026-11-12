# ⚡ Mon Sport — V5.3 (Android PWA)

Application personnelle gratuite hébergée sur GitHub Pages. Tous les favoris restent sur l'appareil (localStorage). Aucune clé API n'est nécessaire pour les scores ESPN.

## Résultats pris en charge
- **Équipes** : PSG (Ligue 1), Real Madrid (LaLiga), San Antonio Spurs (NBA) via les tableaux ESPN non officiels.
- **Individuels** : scores ATP/WTA pour les joueurs suivis dans les tournois qu'ESPN couvre; statistiques de Victor Wembanyama des derniers matchs NBA visibles.
- **Nouveau V5 : historique 2026** de tes joueurs ATP et WTA, y compris Moïse Kouamé, pour les données disponibles en tour principal, Challenger, qualifications et ITF.
- **Moïse Kouamé** : un relevé limité de 62 matchs recensés sur la saison 2026, arrêté au 12 novembre 2026, vient compléter les archives historiques. Ce relevé n'est PAS mis à jour automatiquement. Les liens vers la fiche du joueur permettent de suivre les matchs ultérieurs.
- **V5.1** : dernier match vérifié de Moïse Kouamé (Forejtek, 11 novembre) mis en évidence en haut de l’accueil et de Résultats ; 13 rencontres ajoutées (juillet–octobre). Données manuelles figées au 12 novembre 2026. Le lien externe ouvre un suivi actualisé, mais aucun flux gratuit automatique Challenger/ITF n'est intégré sans clé API.
- **V5.2** : 39 résultats supplémentaires vérifiés pour Moïse Kouamé sur 2026 (dont ses titres ITF de janvier, Roland-Garros, Miami, Lille et Thionville). Une sélection **2025/2026** charge les archives ATP/Challenger/ITF et WTA des joueurs suivis. Les scores ESPN essaient aussi d'intégrer Ligue des champions, coupes nationales, équipe de France de football et XV de France aux Six Nations : disponibilité variable, pas de garantie d'exhaustivité. Pas de modification du Worker.
- **V5.3 — Jannik Sinner** : 7 matchs de Wimbledon 2026 vérifiés (29 juin–12 juillet) ont été ajoutés à son historique : avec les 40 matchs déjà présents dans les archives ATP, le joueur compte désormais **47 rencontres en 2026** lorsque l'archive est accessible. Le dernier match est affiché sur l'accueil et dans Résultats. Sinner a arrêté sa saison après Wimbledon pour une blessure au genou. Sources : [TennisDB](https://tennis-db.com/players/2/jannik-sinner/matches), [Wimbledon officiel](https://www.wimbledon.com/en_GB/news/wimbledon_2026_sinner_zverev_final) et [Reuters via CNA](https://www.channelnewsasia.com/sport/sinner-miss-rest-2026-recover-knee-injury-6435866). Les 7 scores ajoutés sont fixes et ne constituent pas un flux automatique.
- **Autres sports** (tennis de table, cyclisme, natation, rugby) : actualités et liens de recherche; aucun score individuel automatique n'est garanti à ce stade.

### Sources historiques tennis et licences
- Archives de **Jeff Sackmann** via [Aneeshers/tennis-sackmann-archive](https://github.com/Aneeshers/tennis-sackmann-archive), utilisées via CSV publics. Licence des **données** : **CC BY-NC-SA 4.0** (attribution, non commercial, partage dans les mêmes conditions pour les adaptations de données). Le miroir ATP et WTA a été mis à jour le **25 juin 2026**. **La date affichée pour ces matches correspond à la semaine de tournoi, pas forcément au jour exact.**
- [TennisExplorer — résultats de Moïse Kouamé](https://www.tennisexplorer.com/player/kouame-d4969/) et [TennisTemple](https://fr.tennistemple.com/player/moise-kouame/results) : vérification MANUELLE d'un petit nombre de résultats récents, aucun scraping automatique ni récupération des bases de ces sites.
- ESPN : endpoints publics non officiels, sans garantie de couverture ni de disponibilité.

**Important :** le titre « historique » ne signifie pas « carrière complète ». La saison 2026 est couverte partiellement par le miroir, avec un relevé de novembre pour Moïse. Les résultats de fin juin à octobre ne sont pas exhaustifs. Le service affiche les échecs de téléchargement et n'invente aucune rencontre.

## Installation et mise à jour
1. Le dépôt public `theomondoud-byte/mon-sport` est déployé automatiquement par `.github/workflows/deploy.yml` sur GitHub Pages à chaque mise à jour de `main`.
2. URL : https://theomondoud-byte.github.io/mon-sport/
3. Sur Android, ouvrir Chrome puis `⋮` → **Installer l'application** ou **Ajouter à l'écran d'accueil**.
4. Ouvrir **Réglages → Vérifier et recharger** si une ancienne version apparaît.
5. Pour les articles, conserver l'adresse du Cloudflare Worker existant dans Réglages. **La V5 ne nécessite aucune modification Cloudflare**.

## Limites du modèle gratuit
- Les résultats de tennis archivés chargent des CSV publics à la première ouverture (plusieurs mégaoctets), puis un petit cache local valable 24 h.
- Si un fournisseur gratuit ne répond pas, l'interface indique la couverture réduite.
- Aucun paiement ni compte supplémentaire. Les favoris ne se synchronisent pas automatiquement entre téléphones.
- Le service worker conserve la possibilité d'ouvrir le site hors connexion après une première visite. Les scores récents demandent Internet.
- Les liens d'actualités ne garantissent pas que chaque article est sans abonnement.

## Développement
- Interface et récupération ESPN : `src.js`
- Archive tennis, résultats vérifiés Moïse Kouamé, limites des sources : `tennis-history.js`
- Cache PWA : `sw.js`, `manifest.webmanifest`
- Déploiement automatique : `.github/workflows/deploy.yml`
- Relais d'actualités déployé séparément : `worker/index.js`

Licence du code du projet : MIT (`LICENSE`). Les données de Jeff Sackmann conservent leur licence CC BY-NC-SA 4.0.
