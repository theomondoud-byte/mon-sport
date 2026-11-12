# Mon Sport V11 — 20 favoris

PWA Android : https://theomondoud-byte.github.io/mon-sport/

## Favoris ajoutés
- **FC Barcelone** : équipe de football masculine, LaLiga et Ligue des champions.
- **Sauveur Cristofini** : nageur français, nom correct sans « h ».

Ils sont ajoutés **une fois** aux listes déjà enregistrées sur Android. Les anciens favoris et le Worker Cloudflare restent inchangés ; une suppression manuelle ultérieure n'est pas annulée.

## Contrôle 2026 des 20 favoris
Le module coverage-v11.js référence une source et un périmètre par favori. La recherche ESPN par mois couvre jusqu'à 12 mois passés pour les équipes et le tennis selon disponibilité. Les sources spécialisées couvrent FFTT, natation FFN, cyclisme, rugby et ATP/WTA/Challenger.

**Les sources gratuites sont incomplètes : il n'est pas possible d'assurer que chaque match ou course des 20 favoris est présent.** L'onglet « Un favori » propose les liens officiels pour vérifier les écarts.

Nouveaux relevés vérifiés :
- FC Barcelone : 18 résultats officiels du 16 août au 8 novembre 2026 et 10 rencontres programmées entre le 22 novembre 2026 et le 10 janvier 2027. Source : https://www.fcbarcelona.com/en/football/first-team/results
- Sauveur Cristofini : 14 performances depuis le 2 décembre 2025, dont ses titres nationaux en 200 et 400 m libre, l'argent européen en relais, ses records personnels européens et le 200 m quatre nages du 1er novembre 2026. Sources : https://www.lequipe.fr/fiche/sauveur-cristofini/97076 ; https://ffn.extranat.fr/webffn/resultats.php?go=res&idact=&idban=43306&idcpt=92037&idres=23738113
- Félix Lebrun, Alexis Lebrun et Flavien Coton : 16 rencontres de simple vérifiées des Championnats d'Europe 2026 et du WTT Champions Montpellier. Sources : https://www.fftt.com/actualites/equipe-de-france/championnats-deurope-2026-programme-resultats/ et https://www.fftt.com/actualites/wtt/suivre-le-wtt-champions-de-montpellier-2026/

Restent conservés : calendrier XV de France, sélection FFTT à Chengdu, Challenger de Metz, ATP Finals, 12 courses et 40 étapes de Paul Seixas, statistiques sportives et actualités des sept derniers jours.

## Photos
Portraits Wikimedia Commons / Wikipédia des sportifs. Logos ESPN des équipes lorsque disponibles, avec photo libre du blason du Barça en secours. Un portrait libre de Rafael Jódar est ajouté : https://commons.wikimedia.org/wiki/File:Rafael_J%C3%B3dar_Roland_Garros_2026_(cropped).jpg

Le chargement est progressif et les images sont validées si l'API répond. Une photo absente ou non libre n'est pas inventée : les initiales sont le repli. Les licences et auteurs restent consultables depuis le lien « Image · crédit ».

## Interface compacte
- Premier onglet « Passés » conservé par défaut, semaine 7 jours et favori 12 mois.
- Bandeau d'introduction retiré, cartes réduites, jours affichés une seule fois.
- Sources et état de couverture accessibles en ouvrant la section repliée sous chaque favori.
- Photos et logos affichés dans la liste Favoris et sur les cartes.

## Mise à jour Android
Réglages → Vérifier et recharger ; vérifier « Mon Sport V11 » en pied de page. Les clés de favoris et du Worker Cloudflare ne changent pas. Service Worker version mon-sport-v11-0 ; scripts et CSS version 11.0.0.

## Code
- src.js : migration sûre, favoris et calendriers.
- verified-extra-v11.js : résultats additionnels 2025/2026 et Barça futur.
- coverage-v11.js : 20 sources de référence.
- photos.js : images et logos, contrôle et repli.
- agenda-ui.js / agenda-model.js : navigation et affichage compact.
