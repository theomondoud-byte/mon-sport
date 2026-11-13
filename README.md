# ⚡ Mon Sport

Application web installable (PWA) pour suivre ses sportifs et équipes favoris : résultats, programme, classements et actualités, sur téléphone comme sur ordinateur.

**Application :** https://theomondoud-byte.github.io/mon-sport/

Aucune inscription, aucune clé d'API : les favoris sont enregistrés dans le navigateur, les données viennent de sources publiques. Rien n'est inventé : quand une source ne répond pas, l'application l'indique au lieu d'afficher des chiffres approximatifs.

## Fonctionnalités

| Onglet | Contenu |
| --- | --- |
| 📅 **Résultats** | Matchs passés et à venir de tous les favoris (7 jours), scores, verdicts V/D, comptes rendus dépliables. |
| 👤 **Favoris** | Fiche d'un favori : historique sur un an, programme, statistiques sourcées, lien vers son classement. |
| 🏆 **Classements** | ATP, WTA, Race, Next Gen, ITTF/WTT, Ligue 1, Liga, Ligue des champions, NBA. Favoris mis en évidence. |
| 📰 **Articles** | Fil des 7 derniers jours : FFL, ESPN, Jeu, set et maths et médias RSS (avec le relais), filtrable par média. |
| ⭐ **Gérer mes suivis** | Ajout, suppression, recherche, import/export JSON des favoris. |
| ⚙️ **Réglages** | URL du relais Cloudflare, photos, mise à jour de l'application. |

L'application s'ouvre instantanément avec les dernières données mémorisées, puis s'actualise en arrière-plan. Elle reste consultable hors connexion.

## Sources de données

- **ESPN** (API publique non officielle) : scores football, NBA, rugby, classements ESPN, tennis.
- **Relevés tennis et tennis de table** (`data/*.json`) : classements ATP/WTA live, Race, Next Gen, ITTF, collectés toutes les 6 heures par GitHub Actions (`scripts/refresh_*.py`).
- **Jeu, set et maths** : publications collectées par `scripts/refresh_jeu_set_maths.py`, embarquées dans `data/jeu-set-et-maths-bundle.js` pour fonctionner même sans réseau.
- **FFL** : API WordPress publique.
- **Relais Cloudflare** (facultatif, `worker/index.js`) : flux RSS (Tennis Actu, Franceinfo, Basket USA, TrashTalk, Cyclism'Actu), recherche d'actualités et lecture des articles, sans problème de CORS.

## Architecture

Application statique en JavaScript natif (modules ES), sans framework ni étape de build.

| Fichier | Rôle |
| --- | --- |
| `index.html`, `style.css` | Page unique et styles. |
| `src.js` | État, navigation, chargements et rendu principal. |
| `version.js` | Version unique de l'application. |
| `sw.js` | Service worker : précache versionné, hors connexion. |
| `agenda-*.js`, `event-details.js`, `match-details.js` | Résultats, programme et comptes rendus. |
| `rankings-view.js`, `stats-view.js`, `sports-profiles.js` | Classements et statistiques. |
| `news-view.js`, `sports-articles.js`, `sports-media.js` | Fil d'actualités. |
| `tennis-history.js`, `audit-*.js`, `verified-*.js`, `coverage-v11.js` | Historiques et données vérifiées. |
| `photos.js` | Portraits et logos des favoris. |
| `worker/` | Relais Cloudflare facultatif. |
| `scripts/` | Collecteurs Python et outil de version. |
| `tests/` | Tests Node (`*.test.js`) et Python (`*_py_test.py`). |

## Développement

```bash
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000.

```bash
npm run check && npm test
```

```bash
python3 -m unittest discover -s tests -p '*_py_test.py'
```

### Publier une nouvelle version

Toute modification d'un fichier JS ou CSS doit changer la version, sinon les téléphones garderont l'ancien fichier en cache :

```bash
node scripts/bump-version.mjs 16.4.0
```

Le script met à jour `version.js`, `package.json`, `index.html`, le cache de `sw.js` et tous les imports. Un test vérifie que tout est cohérent. Ajouter ensuite une entrée dans [CHANGELOG.md](CHANGELOG.md).

## Déploiement

- **GitHub Pages** : publication automatique depuis `main` (`.github/workflows/deploy.yml`), et après chaque collecte (toutes les 6 heures, `atp-live.yml`).
- **Relais Cloudflare** (facultatif) : déployer `worker/` avec `wrangler deploy`, puis saisir son URL dans **Réglages**.
- Sur une PWA déjà installée : **Réglages → Vérifier et recharger** pour récupérer immédiatement une nouvelle version.

## Historique

Le détail de chaque version se trouve dans [CHANGELOG.md](CHANGELOG.md).

## Licence

Voir [LICENSE](LICENSE).
