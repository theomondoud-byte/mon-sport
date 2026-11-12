# ⚡ Mon Sport — application Android gratuite

Une PWA installable sur Android, qui centralise **18 favoris sportifs préchargés**, les liens d'actualités, des articles récupérés via Google Actualités et les quelques événements accessibles dans la formule gratuite de TheSportsDB.

**Sans serveur payant, sans compte obligatoire et sans clés API privées.** Les favoris sont sauvegardés dans le navigateur de chaque appareil.

## 1. Créer le dépôt GitHub

1. Sur https://github.com/new, créer un dépôt **public** nommé `mon-sport` (ou autre nom).
2. Décompresser cette archive, puis envoyer **le contenu du dossier** `mon-sport-github` à la **racine** du dépôt (bouton **Add file > Upload files** sur GitHub). Bien inclure le dossier caché `.github` : il contient le workflow de publication. Pour bien conserver tous les fichiers, l'option `git` ci-dessous est plus fiable.
3. Dans **Settings > Pages > Build and deployment > Source**, sélectionner **GitHub Actions**.
4. Dans **Actions**, vérifier que « Publier Mon Sport » est terminé avec succès ; sinon relancer le workflow.
5. Ouvrir `https://VOTRE-PSEUDO.github.io/mon-sport/`. Remplacer `mon-sport` par le nom réel du dépôt. La publication peut nécessiter quelques instants.

### Alternative avec Git (ordinateur)

```bash
git init
git add .
git commit -m "Première version Mon Sport"
git branch -M main
git remote add origin https://github.com/VOTRE-PSEUDO/mon-sport.git
git push -u origin main
```

## 2. Installer sur Android

1. Ouvrir l'adresse GitHub Pages dans **Chrome** sur Android.
2. Toucher **⋮** puis **Ajouter à l'écran d'accueil** ou **Installer l'application**.
3. Ouvrir l'icône **Mon Sport** créée sur l'écran d'accueil.

L'interface et les favoris déjà sauvegardés peuvent fonctionner hors connexion ; les nouveaux scores et articles nécessitent Internet.

## 3. Activer les scores et les titres des articles dans l'app (Cloudflare Worker)

L'application fonctionne sans Worker pour gérer les favoris et ouvrir les recherches d'actualités. Pour **afficher les actualités et les scores intégrés** il faut déployer le relais gratuit :

1. Créer un compte gratuit sur https://dash.cloudflare.com/.
2. Ouvrir **Workers & Pages** > **Create** > **Worker** > **Start with Hello World** (intitulés susceptibles d'évoluer).
3. Nommer le Worker `mon-sport-api`, puis le publier.
4. Ouvrir **Edit code**, remplacer le contenu du fichier principal par **l'intégralité de `worker/index.js`**, puis choisir **Deploy**.
5. Copier son URL `https://mon-sport-api.VOTRE-SOUS-DOMAINE.workers.dev`.
6. Dans l'application **Mon Sport**, ouvrir **Réglages**, coller cette URL (sans `/api/`), enregistrer et actualiser.

Si vous utilisez Node.js sur un ordinateur, alternative :

```bash
cd worker
npx wrangler login
npx wrangler deploy
```

Puis renseigner l'URL affichée par Wrangler dans les Réglages de l'application.

### Vérifier que le Worker fonctionne

Dans le navigateur, visiter :

- `https://VOTRE-WORKER.workers.dev/api/news?q=PSG`
- `https://VOTRE-WORKER.workers.dev/api/team?name=Real%20Madrid`

Un objet JSON devrait apparaître. Les articles proviennent d'un flux RSS Google News (titre, date, source, lien), pas du contenu complet. Certains liens peuvent mener à des articles payants : nous ne pouvons pas le certifier avant ouverture.

## 4. Personnalisation

Les 18 favoris initiaux sont déclarés dans `src.js`, variable `DEFAULTS`. L'application permet ensuite d'ajouter, supprimer, filtrer, exporter et importer les favoris depuis son interface.

**Important :** un favori de type `équipe` peut interroger TheSportsDB. Un favori de type `sportif` fournit actuellement les actualités et un lien de recherche des résultats, **pas de scores automatiques vérifiés**. Les équipes ambiguës, notamment « France » dans différents sports, peuvent ne pas être correctement reconnues : vérifier le nom API depuis le formulaire d'ajout ou dans la configuration initiale.

## 5. Limites de cette V1

- **Résultats partiels**, pas de promesse de direct : TheSportsDB est limité à certains événements à domicile en gratuit ; certains sports ne sont pas couverts.
- **API de recherche d'équipes limitée** : une équipe peut être introuvable ou inexacte. L'application n'invente aucun résultat.
- **Articles : gratuité non garantie**. Les résultats Google Actualités peuvent inclure des liens soumis à abonnement. L'application affiche les liens, pas les articles intégraux.
- **Limites de requêtes** : TheSportsDB 30/minute ; Cloudflare Worker gratuit soumis à ses propres plafonds. Le relais met les réponses en cache 15 min ; ne pas actualiser en boucle.
- **Stockage local** : les favoris ne se synchronisent pas d'un appareil à l'autre ; utiliser Exporter/Importer.
- **Sécurité / confidentialité** : le Worker accepte des requêtes publiques et ne stocke pas les favoris, mais reçoit les termes recherchés. Le Worker autorise CORS public pour faciliter l'intégration ; pour un usage privé plus strict, limiter l'origine à l'URL GitHub Pages.
- La mise en cache hors ligne ne remplace pas le téléchargement des articles ou scores.

## Architecture

- `index.html`, `style.css`, `src.js` : PWA HTML/CSS/JS, sans compilation ni coût de dépendances.
- `manifest.webmanifest`, `icons/`, `sw.js` : installation Android et cache des ressources locales.
- `.github/workflows/deploy.yml` : déploiement automatique GitHub Pages.
- `worker/` : relais Cloudflare Workers des flux Google News RSS et de TheSportsDB.

## Sources et API

- https://www.thesportsdb.com/docs/api
- https://news.google.com/
- https://developers.cloudflare.com/workers/
- https://docs.github.com/en/pages

**Licence** : MIT (voir `LICENSE`).
