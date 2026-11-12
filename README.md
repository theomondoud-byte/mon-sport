# Mon Sport V8 — portraits, statistiques et résumés

Application PWA Android gratuite : https://theomondoud-byte.github.io/mon-sport/

## Navigation

Cinq onglets : Semaine, Un favori, Actus, Favoris et Réglages. Les onglets Archives et Bilan 2026 sont supprimés de la barre de navigation, sans supprimer les résultats sous-jacents ni les favoris existants.

**Semaine** : prochains matchs et matchs passés de tous les favoris, sur des fenêtres glissantes de sept jours.

**Un favori** : choix d'un sportif ou d'une équipe, puis trois sous-onglets :
- À venir : deux mois calendaires.
- Passés : douze mois glissants, y compris fin 2025 et 2026 à la date de lancement.
- Statistiques : nombre de résultats recensés sur ces douze mois, V/D/N si les données le permettent, pourcentage de victoire sur les matchs au verdict connu, principales compétitions, dernier résultat et moyennes individuelles NBA pour Wembanyama lorsque des feuilles de match sont disponibles.

## Portraits et licences

L'application tente de récupérer pour les sportifs des photographies libres depuis l'API PageImages de Wikipédia français/anglais, uniquement sur un article correspondant au sportif, avec limitation aux licences libres. Elle affiche un portrait sur la fiche et une petite photo dans les cartes des matchs. Un lien vers Wikimedia Commons est fourni pour retrouver la licence de chaque photo. Sans photo correspondante, les initiales du nom sont affichées. Les URLs sont conservées en cache local sept jours ; aucune photo non libre n'est copiée dans le dépôt.

## Pastilles de résultats et résumés cliquables

Les badges V verts et D rouges apparaissent seulement lorsqu'un score ou le résultat de la rencontre établit la victoire ou la défaite du favori. N désigne un match nul. Aucun V/D n'est inventé à partir d'une simple participation en natation ou en cyclisme.

Toucher une carte de match développe un résumé factuel : rencontre, compétition, tour, score, verdict connu, données statistiques disponibles, source et limites de précision. Ce résumé ne prétend pas raconter des faits de jeu, actions ou points qui ne sont pas fournis par la source. Les matchs futurs ont une présentation de programme, sans score inventé.

## Couverture des douze mois

Les équipes sont recherchées dans les calendriers mensuels ESPN des douze derniers mois, à la demande (plusieurs dizaines d'appels possibles, cache local quinze minutes). Les sportifs de tennis utilisent les résultats récents de 2026 et, pour fin 2025, les fichiers ATP/WTA, Challenger et ITF disponibles en archives. Certaines dates d'archive correspondent à la semaine du tournoi et restent indiquées comme approximatives.

Des calendriers et résultats complets pour les sports autres que le football, le basket ou le tennis ne sont pas tous disponibles gratuitement. Les statistiques ne sont donc pas présentées comme des totaux de saison officiels. Un match du Real Madrid ou des Spurs n'est pas une apparition confirmée de Mbappé ou Wembanyama.

## Installation et mise à jour

Ouvrir Réglages → Vérifier et recharger, puis contrôler la mention V8 au pied de l'application. Les favoris et l'adresse du relais d'actualités Cloudflare restent enregistrés localement. Aucun changement de Cloudflare n'est nécessaire.

## Code

Les modules de la refonte sont : agenda-model.js (périodes), agenda-fetch.js (données), agenda-ui.js (cartes et vues), stats-view.js (statistiques), match-details.js (résumés et V/D), photos.js (vignettes et crédits). Le reste du projet reste opérationnel avec le service worker mis à jour.
