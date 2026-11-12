# ⚡ Mon Sport V6 — bilan des 18 favoris en 2026

Application personnelle PWA Android hébergée sur GitHub Pages. Données locales, favoris et relais Cloudflare conservés. Cette version se limite à l'année civile 2026 : les archives 2025 ne sont plus proposées.

## Nouvel onglet 📊 Bilan 2026

Pour chacun des 18 favoris : nature du sport, nombre de résultats effectivement recensés lorsque disponible, unité de comptage, date de référence et lien vers une source indépendante. Un tiret signifie **total non vérifiable**, jamais « zéro match ». Les nombres affichés ne constituent pas systématiquement une saison complète.

### Sources selon les sports

- Tennis : ATP et WTA via une source CSV hebdomadaire Min Maxxxer / Hugging Face (données mises à jour au 9 novembre 2026 lors du contrôle, licence CC BY 4.0), avec repli vers les archives Jeff Sackmann de juin 2026 (CC BY-NC-SA 4.0). Challenger, ITF et qualifications restent partiels, surtout après juin ; les relevés datés de Moïse Kouamé et Wimbledon 2026 de Jannik Sinner restent disponibles. Les noms inversés/abrégés sont pris en compte.
- Real Madrid, PSG et San Antonio Spurs : ESPN, recherche annuelle *sur demande*, organisée par compétition et par mois. Cela peut prendre du temps (plusieurs dizaines de requêtes). Le résultat est mis en cache 24 heures. Une réponse ESPN ne garantit pas l'exhaustivité des compétitions.
- Équipe de France de football : 8 matchs de Coupe du monde 2026 vérifiés par la FIFA, mais pas toutes les rencontres internationales de 2026.
- XV de France : 9 rencontres terminées vérifiées jusqu'au 12 novembre 2026 sur L'Équipe et FFR, y compris France–Fidji (54–17) le 7 novembre.
- Félix Lebrun, Alexis Lebrun et Flavien Coton : sélection de scores recoupés via FFTT (championnats d'Europe et WTT de Yokohama). La page Table Tennis API de Flavien indique 44 matchs officiels en 2026 au 12 novembre, dont 31 simples et 13 doubles. Les exemples de l'application ne couvrent pas les 44 lignes.
- Paul Seixas : selon CyclingDB, 12 épreuves en 2026 ; les étapes et les classements généraux ne sont pas additionnés aux épreuves comme s'il s'agissait de nouveaux départs. Liens vers ProCyclingStats.
- Léon Marchand : sélection de courses confirmées dans World Aquatics ; le total des départs n'est pas établi.
- Kylian Mbappé et Victor Wembanyama : une rencontre de leur équipe ne suffit pas pour compter une **apparition** du joueur. Pas de nombre inventé sans feuilles de match nominatives couvrant l'année.

## Limites et contrôle qualité

- Un nombre « recensé » n'est pas nécessairement un total officiel. Se référer au statut et à la source de chaque ligne.
- Pour le tennis, les tournois des sources archivées sont parfois datés par semaine et non au jour précis ; cette approximation est indiquée.
- Les CSV hebdomadaires récents n'ont pas encore été testés dans le navigateur Android : si le téléchargement échoue, l'ancienne archive est conservée comme secours et la couverture plus limitée est signalée.
- L'exhaustivité ne peut pas être certifiée sans source officielle complète pour chaque discipline.
- Les chiffres des sports avec des unités différentes (match, course, étape, départ, simple, double) ne sont **pas comparables**.
- Contrôle des sources effectué le 12 novembre 2026 ; ces références statiques ne sont pas actualisées automatiquement.

## Utilisation

Site : https://theomondoud-byte.github.io/mon-sport/

Dans l'application, ouvrir Réglages → Vérifier et recharger, puis 📊 Bilan 2026. Pour les clubs, le bouton « Calculer les matchs 2026 (ESPN) » est facultatif et peut être long. Les favoris et le Cloudflare Worker déjà configurés sont conservés.

## Architecture

- src.js : interface, équipes ESPN et résultats récents.
- tennis-history.js : historiques 2026, chargement hebdomadaire ou repli et reconnaissance des joueurs.
- audit-2026.js : registre des sources et rencontres 2026 vérifiées manuellement.
- audit-espn-2026.js : décompte annuel ESPN des équipes, sur demande.
- audit-ui.js : affichage du bilan.
- sw.js et index.html : cache PWA et ressources versionnées.

Licence du code : MIT (LICENSE). Les données tierces conservent leurs licences et leurs attributions respectives.
