# Mon Sport V7 — agendas des favoris

Application PWA Android hébergée sur GitHub Pages, avec une **navigation entièrement repensée autour des matchs**.

## Deux vues principales

### 🗓️ Semaine · tous mes favoris
Deux sous-onglets distincts :
- **À venir · 7 jours** : les rencontres programmées entre l'instant présent et les 7 prochains jours.
- **Passés · 7 jours** : les résultats terminés au cours des 7 derniers jours.

Les événements sont regroupés par journée et triés chronologiquement ; chaque carte indique le favori, l'adversaire, le score s'il existe, la compétition et l'origine des données. Un événement entre deux favoris suivis est dédoublonné.

### 👤 Un favori · deux mois
- Sélecteur parmi les favoris présents sur le téléphone.
- **À venir · 2 mois** : recherche depuis maintenant jusqu'à deux mois calendaires plus tard.
- **Passés · 2 mois** : résultats terminés des deux derniers mois calendaires.
- Recherche ESPN élargie **sur demande** par compétition/mois pour le favori choisi, mise en cache pendant 15 minutes. Les matchs de tennis ATP/WTA sont cherchés via ESPN ; les résultats passés des archives 2026 et les résultats recoupés restent consultables.
- La vue permet également de sélectionner Mbappé ou Wembanyama : certains **matchs futurs du club** peuvent être affichés comme calendriers indicatifs, avec mention obligatoire **« présence du sportif non confirmée »**. Une équipe jouant n'est pas une preuve que le sportif est titulaire ou même présent.

## Données conservées et limites
- Les sources existantes restent : ESPN (équipes et ATP/WTA), ATP/WTA hebdomadaire 2026, archives Challenger/ITF 2026, résultats vérifiés de la FFTT, FIFA, FFR, World Aquatics et cyclisme.
- Le Bilan 2026 et les archives tennis restent dans la navigation via **📚 Archives** et **📊 Bilan 2026**.
- Les calendriers futurs d'ITF/Challenger, natation, tennis de table, cyclisme et certaines rencontres internationales sont **partiels ou indisponibles** chez les fournisseurs gratuits. Un écran vide ne signifie pas qu'il n'y a pas de match. L'application affiche la liste des favoris sans événement et les liens de vérification.
- Les résultats datés uniquement du début de semaine dans les archives sont présentés comme **dates approximatives**. Les résultats ajoutés manuellement ne prétendent pas avoir une heure de match exacte.
- Les délais sont des fenêtres **glissantes**, pas seulement la semaine du lundi au dimanche. Les deux mois futurs peuvent traverser le 1er janvier 2027 (moins de douze mois de données).
- L'application ne demande ni mot de passe ni API payante ; les appels ESPN sont publics mais non officiels et n'offrent pas de garantie de disponibilité. Les résultats, périodes et participants sont seulement ceux renvoyés par les sources.

## Mise à jour sur Android
- URL : https://theomondoud-byte.github.io/mon-sport/
- **Réglages → Vérifier et recharger**, puis vérifier que le pied de page affiche **V7**.
- Favoris et URL Cloudflare Worker sont conservés dans le stockage local du téléphone ; le Worker n'a pas été modifié.

## Code
- `src.js` : navigation, chargement des données existantes et connexion des vues.
- `agenda-model.js` : fenêtres glissantes, normalisation et déduplication.
- `agenda-ui.js` : présentation des deux vues et sous-onglets.
- `agenda-fetch.js` : recherche étendue à deux mois pour un favori sur ESPN.
- `tennis-history.js`, `audit-2026.js`, `audit-ui.js`, `audit-espn-2026.js` : historiques et contrôles existants.
- `sw.js`, `style.css`, `index.html` : PWA et design.
