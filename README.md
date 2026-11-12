# Mon Sport V12 — photos stables et matchs à vérifier

Application Android : https://theomondoud-byte.github.io/mon-sport/

## Photos : correctifs Android
- Les images arrivent une par une SANS reconstruire la page entière. Cela évite de recommencer le téléchargement des autres portraits.
- Blasons ESPN en accès direct : Barça, Real Madrid, PSG, Spurs. Les deux sélections françaises sont recherchées dans les métadonnées ESPN et les images libres Wikipédia.
- Wikimedia Commons : portrait confirmé de Paul Seixas aux Mondiaux 2026 ; photo de Moïse Kouamé à Roland-Garros 2026. Les autres noms sont testés contre Commons, puis Wikipédia libre.
- Réglages → Rechercher les photos manquantes : efface seulement le cache des portraits et relance leur recherche.
- En cas d'échec : essayer l'adresse d'image de secours, puis afficher les initiales. L'attribution est accessible via le lien de crédit.
- Une image individuelle authentique et libre n'est pas garantie pour tous, notamment pour certains jeunes sportifs. Aucune photo d'un homonyme n'est utilisée.

## Résultats officiels sans score
- Les rencontres issues des calendriers V10/V11 restent dans « Passés » après leur date même si ESPN ou la fédération n'a pas publié de score.
- Dans ce cas, la carte affiche « À vérifier » et « Résultat non disponible ». Aucun résultat n'est inventé.
- Lorsqu'un résultat ESPN correspondant arrive, il prend le dessus sur cette entrée.
- Pour un tournoi de plusieurs jours, la date de fin est retenue pour savoir quand le classer dans les résultats récents.
- Les statistiques V/D/N et les moyennes n'incluent QUE les matchs effectivement terminés avec un score connu.
- Les calendriers manuels sont des instantanés consultés le 12 novembre 2026, pas des flux directs.

## Conservé
- 20 favoris avec FC Barcelone et Sauveur Cristofini et leur migration sûre.
- Semaine 7 jours et Un favori 12 mois, portraits, statistiques adaptées, détails des rencontres et actualités de la semaine.
- Calendriers et archives ATP, WTA, FFTT, NBA, rugby, cyclisme et natation déjà disponibles.
- Les favoris, l'URL du Worker Cloudflare et les données locales restent inchangés.

## Android et développement
Réglages → Vérifier et recharger. La version doit afficher V12.

Service Worker : mon-sport-v12-0, fichiers JavaScript et CSS version 12.0.0.

Modules modifiés : src.js, photos.js, agenda-model.js, agenda-ui.js, match-details.js, stats-view.js, verified-program.js, verified-extra-v11.js, style.css, sw.js, index.html.

La disponibilité de photos et de résultats complets pour chacun des 20 favoris reste dépendante des éditeurs sportifs.
