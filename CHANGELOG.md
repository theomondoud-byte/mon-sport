# Journal des versions — Mon Sport

Les versions les plus récentes sont en haut. Le fonctionnement actuel de l'application est décrit dans le [README](README.md).

---

# Mon Sport V17.2 — résultats repensés, tweets des articles FFL, 2 articles par rencontre

- **Résultats** : grande photo de la rencontre en tête de carte (photo du compte rendu ou de l'article, sinon vignette du résumé vidéo) ; toucher la photo lance la vidéo à sa place. Le cadre entier passe en **vert, rouge ou ambre** selon victoire, défaite ou nul. Textes génériques retirés (« Résumé du résultat », « La rencontre … est terminée », « Articles sur cette rencontre », avertissements) : la partie dépliée ne contient plus que les statistiques détaillées et les liens.
- **Articles FFL** : les tweets intégrés s'affichent en cartes (auteur, texte, photos et vidéos). La version complète fournie par le relais est désormais prioritaire : auparavant, une copie de secours récupérée par le téléphone (sans image ni médias) pouvait la remplacer — d'où les images et tweets manquants.
- **Images** : si une image ne charge pas directement, un second essai passe par le relais (`/api/image`, hôtes connus uniquement).
- **Articles des autres médias** : 2 articles au plus par rencontre d'un favori (les meilleurs : compte rendu citant l'adversaire, record, extrait fourni) ; Spurs et Wembanyama comptent pour une seule rencontre.
- **Vrais logos** pour FFL, Jeu, set et maths, Franceinfo et TrashTalk (embarqués dans l'appli).

---

# Mon Sport V17.1 — thème clair, l'essentiel de chaque match, médias des articles FFL

- **Thème clair** par défaut (fonds clairs, textes foncés, mêmes couleurs d'accent). Le thème sombre reste disponible dans Réglages → Apparence. `style-light.css` est généré depuis `style.css` par `scripts/build-light-theme.mjs`.
- **Résultats — l'essentiel en français**, directement dans la carte : buteurs et minutes, cartons rouges, possession/tirs/corners (football) ; ligne de Wembanyama, meilleurs marqueurs et score par quart-temps (NBA) ; vainqueur, têtes de série, pays et lieu (tennis) ; stade et affluence.
- **Compte rendu complet** du match lisible dans la carte (ESPN, en anglais), en plus de l'article français quand il existe.
- **Rapprochement article ↔ match fiabilisé** : le favori ET l'adversaire doivent figurer dans le titre (un extrait peut citer le prochain adversaire) ; les mots-dièse de fin de titre (« #Andreeva #Shnaider ») sont ignorés et retirés de l'affichage ; le compte rendu ESPN doit porter l'identifiant du match ; les tribunes « Nom: … » sont écartées.
- **Articles FFL** : les photos et vidéos des tweets intégrés s'affichent dans l'article (chargées à l'ouverture, via le relais) ; liens `t.co` retirés.
- L'écran n'est plus recréé pendant la lecture d'un article ou d'une vidéo.

---

# Mon Sport V17.0 — articles « À lire » / « Lus » et rugby international en direct

- **Articles à lire / lus** : deux onglets avec compteurs. Un article ouvert (« Lire dans Mon Sport » ou lien source) passe dans « Lus » ; il reste visible pendant la lecture et rejoint « Lus » au prochain passage dans l'onglet. Glisser un article vers la gauche (ou toucher ✓) le range dans « Lus » ; dans « Lus », le même geste le remet dans « À lire ». « Tout marquer comme lu » vide la liste en une fois. État mémorisé sur l'appareil (21 jours).
- **Rugby en direct** : le Championnat des Nations n'est pas couvert par ESPN. Les matchs du XV de France viennent désormais de l'API publique de World Rugby (score et statut en direct) et remplacent la fiche de calendrier du même match.
- **Actualisation automatique** toutes les 60 s tant qu'un match d'un favori est en cours (et au retour dans l'appli).
- **Résumés vidéo** : les chaînes régionales dont les vidéos sont bloquées hors de leur pays (beIN SPORTS USA…) et les vidéos non intégrables sont écartées ; lien « Ouvrir sur YouTube » en secours.

---

# Mon Sport V16.9 — résumés vidéo pour la plupart des matchs

- ESPN ne publie pas de vidéo pour la Ligue des nations, la Ligue 1 ou le tennis (droits). Quand ESPN n'a pas de vidéo, le relais cherche le résumé sur YouTube (publié cette semaine) et ne garde qu'une vidéo dont le titre cite les deux camps et annonce un résumé (« résumé », « highlights », « temps forts »…), de moins de 25 min, sur une chaîne certifiée — en privilégiant les chaînes officielles (diffuseurs, ligues, fédérations, clubs). Une chaîne non officielle est signalée comme telle.
- La vidéo se lit directement dans la carte du match (lecteur YouTube sans cookies) ; la chaîne et la durée sont indiquées.
- Sur les 17 matchs de la semaine : 13 résumés vidéo (dont Italie–France, France–Fidji, Alcaraz, Andreeva), contre 6 avant.

---

# Mon Sport V16.8 — icônes des sources et vraies images FFL

- **Icônes des sources** : pastille ronde aux couleurs de chaque média (FFL, Jeu, set et maths, ESPN, Tennis Actu, Franceinfo, Basket USA, TrashTalk, Cyclism'Actu ; monogramme automatique pour les autres), dans les filtres, les cartes d'articles, les posts Jeu, set et maths et les résumés de résultats. Intégrées à l'appli : aucune image distante, disponibles hors connexion.
- **Images FFL** : la vignette était la première image du flux RSS, presque toujours une émoticône WordPress de 72 px agrandie. Le relais prend maintenant l'image à la une de la page (og:image, 1920×1080). Les émoticônes sont remises dans le texte sous forme d'emoji.

---

# Mon Sport V16.7 — vérifié sur les vraies données

- **Articles** : le relais met en cache sa réponse 10 min et limite à 5 s la recherche d'images ; l'appli attend jusqu'à 25 s. Au démarrage à froid, le délai de 12 s pouvait faire perdre tous les articles (FFL compris).
- Les 20 appels Google Actualités par actualisation sont supprimés : Google refuse le relais Cloudflare (HTTP 503).
- **Résultats** : un article n'est associé à un match que s'il cite le favori ET l'adversaire (Italy/Italie reconnus). Le compte rendu ESPN n'utilise plus les articles génériques de la ligue ; les comptes rendus NBA (liens http) sont acceptés. Sur les vrais matchs de la semaine : 10 résumés, tous corrects, et 6 vidéos.
- Avant-matchs anglais écartés (« visit », « host », « slate »…), et les bilans de saison « (8-4) » ne comptent plus comme un score.
- Vidéo illisible sur l'appareil : lien de repli vers la vidéo sur ESPN.

---

# Mon Sport V16.6 — texte FFL réellement complet (vérifié sur le vrai flux)

- Le site FFL bloque son API WordPress (401) : le Worker lit le flux RSS complet, qui contient tout l'article.
- L'encart « À lire aussi : … » placé en tête des articles FFL arrêtait l'extraction : il est désormais simplement ignoré. Seule une rubrique « À lire aussi » de fin d'article (titre seul sur sa ligne) coupe le texte. Résultat : 1 000 à 5 000 caractères par article FFL au lieu de 150 à 290.
- Résumés vidéo : les « highlights » du match sont choisis en priorité parmi les vidéos ESPN.
- Espace conservée après « dans les citations.

---

# Mon Sport V16.5 — résultats avec résumé et vidéo, articles illustrés, FFL complet

- **Résultats** : chaque match terminé affiche, sans ouvrir la carte, le résumé d'un article de presse (article français du fil en priorité, sinon compte rendu ESPN) avec un lien vers l'article, et un bouton **▶ Voir le résumé vidéo** qui lit la vidéo ESPN dans la carte quand elle existe. Sinon, lien de recherche du résumé vidéo. La vidéo apparaît aussi dans le détail du match.
- **FFL** : articles récupérés par le Worker (sans blocage CORS), texte complet conservé avec les tweets et citations intégrés, et images de l'article. Repli sur le flux RSS complet.
- **Images** : le Worker complète chaque article sans image avec l'image de partage de la page (og:image) ; à défaut, portrait du favori ou illustration colorée du sport.
- **Favoris** : un article d'un média (hors FFL et Jeu, set et maths) n'est lié à un favori que si son nom figure dans le titre.
- Lecture intégrée : texte et images de l'article, extraction WordPress par slug en repli.

---

# Mon Sport V16.4 — articles pertinents, texte FFL complet et vignettes nettes

- **Pertinence** (hors FFL et Jeu, set et maths) : seuls les comptes rendus de matchs joués et les records de tes favoris sont gardés. Avant-matchs, programmes TV, pronostics, interviews, blessures et transferts sont écartés ; le favori doit être le sujet de l'article (cité dans le titre). Un bandeau indique combien d'articles ont été écartés, avec « Afficher quand même ».
- **Accents** : réparation des codes dont le flux a supprimé le « & » (« apporteacute; » → « apporté »), côté appli et côté Worker.
- **FFL** : texte complet récupéré via l'API WordPress du site, lisible dans l'appli sans passer par le Worker. Le Worker lit aussi les sites WordPress via leur API et les données schema.org, au lieu de couper le texte au premier bloc imbriqué.
- **Vignettes** : taille fixe (carré à gauche sur ordinateur, bandeau 16:9 sur mobile) au lieu d'une colonne étirée sur toute la hauteur de l'article déplié ; bande fine avec le pictogramme du sport sans image.
- Plus d'espace parasite avant les virgules et les points du texte intégral.

---

# Mon Sport V16.3 — articles lisibles, favoris liés visibles et cartes redessinées

- **Accents et apostrophes** : les titres, extraits et textes intégraux décodent toutes les entités HTML, y compris lorsqu'un flux les encode deux fois (`&amp;eacute;`). Le Worker Cloudflare applique le même décodage ; la mention « … lire la suite » des extraits est retirée.
- **Texte intégral** : affiché en paragraphes, sans défilement interne ; la rubrique « À lire aussi » de fin d'article est écartée. Le bouton devient « Masquer le texte » une fois le contenu chargé.
- **Rapprochement avec les favoris** : un article n'est lié à un favori que si le sport correspond (un article de Coupe Davis n'est plus rattaché à l'équipe de France de football). FFL et Jeu, set et maths restent toujours affichés ; les autres médias n'apparaissent que s'ils citent un favori.
- **Favori lié visible** : chaque carte affiche un badge « ⭐ Nom du favori » et une bordure verte.
- **Cartes** : vignette sur toute la colonne (pictogramme du sport en attendant l'image), métadonnées regroupées (source, favori), actions alignées.
- Correction d'une expression régulière doublement échappée dans le filtrage des actualités ESPN.

---

# Documentation (application inchangée, toujours en V16.2)

- Le README décrit désormais l'application, son architecture, le développement et le déploiement.
- L'historique détaillé des versions est déplacé dans ce fichier.

---

# Mon Sport V16.2 — ouverture instantanée avec les dernières données

- Les résultats et actualités sont mémorisés après chaque actualisation réussie (3 jours maximum) et affichés immédiatement à l'ouverture suivante ; l'actualisation continue en arrière-plan.
- Premier lancement : l'écran de chargement attend 4 s au plus (au lieu de 22 s), puis l'interface se complète au fil des réponses.
- L'en-tête indique « Actualisation… » puis « Mis à jour il y a X min ».
- Les rafraîchissements en arrière-plan ne recréent plus l'écran pendant une saisie : le texte tapé dans un formulaire est conservé.
- Mesure sur téléphone émulé : deuxième ouverture en 0,1 s au lieu d'environ 13 s.

---

# Mon Sport V16.1 — versions alignées et cache hors connexion fiable

- Une seule version pour toute l'application (`version.js`) et un script `scripts/bump-version.mjs` qui met à jour `index.html`, `sw.js`, `package.json` et les imports.
- Les fichiers demandés par la page correspondent de nouveau au précache du service worker (hors connexion fiable).
- Les modules `sports-articles.js` et `agenda-model.js` ne sont plus chargés deux fois.
- Les extraits d'articles décodent correctement les entités numériques (`&#39;`…) et compactent les espaces.
- Les publications Jeu, set et maths restent dans le fil même au-delà de 100 actualités ; le filtre par média est strict.
- Nouveau test de cohérence des versions et du précache.

---

# Mon Sport V15.8 — sources éditoriales RSS ciblées par sport et favoris

## Sources RSS dans Articles

Le relais Cloudflare propose désormais `GET /api/sports-news`, qui agrège les flux RSS publics Tennis Actu, Franceinfo (tennis, football, rugby, cyclisme, natation et tennis de table), Basket USA, TrashTalk et Cyclism'Actu. Les flux sont récupérés côté serveur pour éviter CORS, limités aux sept derniers jours, dédoublonnés par URL et identifiés par média et discipline. Les articles sont associés à un favori seulement si son nom est réellement présent dans le titre ou l'extrait ; les autres restent classés par sport. Les états de chaque flux sont renvoyés par le relais pour faciliter le diagnostic.

Le flux RSS sert à afficher les métadonnées, l'extrait fourni par l'éditeur et le lien original. Mon Sport ne copie pas automatiquement les corps complets des articles. La lecture intégrale reste chez le média, sauf autorisation explicite. Les flux non confirmés ou les sites officiels sans RSS exploitable (FFN, FFTT) ne sont pas activés comme sources d'articles. L'agrégation est facultative tant que le Worker Cloudflare n'a pas été mis à jour avec `worker/index.js`.

## Médias activés dans le collecteur

- Tennis : Tennis Actu, Franceinfo.
- Football : Franceinfo.
- Basket : Basket USA, TrashTalk.
- Rugby : Franceinfo.
- Cyclisme : Cyclism'Actu, Franceinfo.
- Natation : Franceinfo.
- Tennis de table : Franceinfo.

Les flux sont interrogés individuellement : l'échec d'un éditeur ne bloque pas les autres. Les articles sont limités à sept jours, dédoublonnés et ajoutés au même fil que FFL, Jeu, set et maths et ESPN.

## Déploiement du relais

Après publication GitHub Pages, mettre également à jour le Cloudflare Worker avec le fichier `worker/index.js` pour activer `/api/sports-news`. Tant que cette étape n'est pas faite dans le compte Cloudflare, le fil existant continue de fonctionner sans les nouveaux flux RSS.

---

# Mon Sport V15.7 — vidéos X lisibles et actualités filtrables par média

## Lecture vidéo X

Les vidéos natives du compte « Jeu, set et maths » sont servies par `video.twimg.com`. Le CDN X peut renvoyer HTTP 403 aux lecteurs externes lorsqu'un en-tête `Referer` indique le site qui intègre la vidéo. V15.7 pose donc une politique de référence `no-referrer` dès le document HTML, sans désactiver les contrôles vidéo. Le lecteur garde le MP4 original et essaie aussi une variante sans le paramètre `tag` lorsque le CDN refuse la première URL. Les vidéos restent lues dans le lecteur natif du navigateur, avec les contrôles tactiles et un lien de secours vers la publication originale.

## Fil Articles

Le fil reste **Tous les médias** par défaut. Trois filtres indépendants permettent de réduire le flux :
- **Média** : tous les éditeurs ensemble ou un seul éditeur.
- **Sport** : tennis, football, basket, rugby, cyclisme, natation, tennis de table, etc.
- **Favori** : uniquement les articles associés à un sportif ou une équipe suivis.

Les trois dernières publications Jeu, set et maths restent épinglées en tête quand elles font partie du filtre. Les cartes conservent leur source. Le filtrage ne déclenche pas de rechargement des résultats sportifs.

Le dédoublonnage retire les URL canoniquement identiques et les titres très proches publiés à moins de 36 heures d'intervalle ; pour un même favori, la version au résumé le plus complet est conservée. Il reste volontairement conservateur pour ne pas fusionner deux actualités différentes sur le même joueur.

## Médias candidats (non activés dans le flux à ce stade)

La liste de départ proposée est volontairement courte : une source spécialisée et, lorsque cela apporte quelque chose, une source généraliste gratuite. Les flux RSS sont récupérés côté serveur lors de leur future intégration, pas directement depuis le navigateur (évite les erreurs CORS). Les titres et liens peuvent être affichés dans Mon Sport ; le texte intégral reste consulté chez l'éditeur, sauf autorisation explicite de republication.

- **Tennis** : Tennis Actu (`https://www.tennisactu.net/rss_social.xml`) et Franceinfo Tennis (`https://www.franceinfo.fr/sports/tennis.rss`).
- **Football** : Foot Mercato (flux RSS officiel annoncé par l'éditeur) et Franceinfo Foot (`https://www.franceinfo.fr/sports/foot.rss`).
- **Basket / NBA / Spurs / Wembanyama** : Basket USA (`https://www.basketusa.com/feed/`) ; TrashTalk (`https://trashtalk.co/feed/`) en complément plus éditorial.
- **Rugby** : Rugby365 (`https://www.rugby365.fr/feed`) et Franceinfo Rugby (`https://www.franceinfo.fr/sports/rugby.rss`).
- **Cyclisme** : Cyclism'Actu (`https://www.cyclismactu.net/rss_social.xml`) et Franceinfo Cyclisme (`https://www.franceinfo.fr/sports/cyclisme.rss`).
- **Natation** : FFN (`https://www.ffnatation.fr/actualites/actu-grand-public`) et Franceinfo Natation (`https://www.franceinfo.fr/sports/natation.rss`).
- **Tennis de table** : FFTT (`https://www.fftt.com/actualites/`) et Franceinfo Tennis de table (`https://www.franceinfo.fr/sports/tennis-de-table.rss`).

Les sources payantes ou dont l'accès intégral est incertain ne sont pas retenues dans cette proposition. Les flux de Franceinfo par sport sont recensés comme actifs en novembre 2026 ; les flux Tennis Actu, Basket USA, TrashTalk, Rugby365 et Cyclism'Actu ont également été signalés comme actifs lors des vérifications publiques récentes. Chaque flux sera contrôlé avant activation, puis les articles seront associés aux favoris à partir du nom, de ses alias et du sport. Un filtre anti-doublon inter-médias évitera les reprises quasi identiques.

---

# Mon Sport V15.6 — publications « Jeu, set et maths » intégrées au téléphone

## Correction du problème persistant sur Android

Les publications de « Jeu, set et maths » sont désormais **directement incluses dans un module JavaScript de Mon Sport**, produit à partir du dernier relevé de source validée. Ce n'est plus seulement une requête réseau sur `data/jeu-set-et-maths.json` : **le module fournit les publications immédiatement**, même si la connexion mobile, le service worker ou le stockage local bloquent la requête au JSON.

- Un relevé vérifié de **20 publications du 7 au 12 novembre 2026**, incluant texte complet et médias, est livré avec V15.6. Les posts de plus de sept jours sont filtrés automatiquement, sans les présenter comme de l'actualité.
- Le JSON continuera d'être récupéré lorsque le réseau le permet. L'application fusionne les posts, sans doublons et en privilégiant le texte le plus complet.
- Le workflow GitHub Actions reconstruit `data/jeu-set-et-maths-bundle.js` après chaque collecte programmée et publie les deux ressources. Le nouveau module est préchargé par le service worker et suit le cache PWA.
- Dans **Articles**, un compteur indique explicitement combien de posts « Jeu, set et maths » sont chargés, avec un bouton `↻ Posts` permettant de retenter seulement leur actualisation.
- Les **trois posts les plus récents apparaissent en tête** du fil sur téléphone et PC, suivis des autres actualités. Cela évite de les chercher sous des dizaines de titres ESPN ou de favoris.

L'application conserve les retours à la ligne des statistiques, le texte entier lorsqu'il est disponible, les images et les vidéos, sans fenêtre X ni bouton « Voir plus ». Le cache et les imports passent à **V15.6**.

## Vérifications

Les tests doivent vérifier le rendu mobile sans aucune requête réseau ni accès au stockage local, le nombre de posts réellement fournis par le module, leur priorité en tête de fil, la compatibilité avec la collecte et l'absence de publications obsolètes. Le build Python teste la vérification de provenance et la régénération du module.

---

# Mon Sport V15.5 — fil « Jeu, set et maths » fiable sur téléphone et vrais retours à la ligne

## Publications manquantes sur mobile

L’application ne dépend plus du chargement simultané des scores ESPN pour afficher les posts de **« Jeu, set et maths »** : les publications sont récupérées **indépendamment, dès l’ouverture**, y compris si une autre API est lente ou si le navigateur se considère hors connexion. La copie des derniers posts vérifiés est également enregistrée en mémoire locale et conservée pendant leur période de pertinence (sept jours).

- Le fichier `data/jeu-set-et-maths.json` est désormais inclus dans le **précache PWA**, pour rester lisible lors d’une connexion mobile instable.
- Sur Safari iOS et d'anciens navigateurs Android, le chargement évite désormais l’API `AbortSignal.timeout()`, dont le support peut être incomplet.
- Si le flux de favoris contient beaucoup d’articles, jusqu’à **vingt-cinq publications « Jeu, set et maths »** sont préservées dans le fil pour éviter qu’elles ne soient évincées de la sélection.
- Une mise à jour automatique **n'interrompt jamais un écran déjà ouvert** ; sur une PWA mobile déjà installée, une action volontaire **Réglages → Vérifier et recharger** est nécessaire une fois pour récupérer V15.5.

## Texte et mise en page

Le collecteur reprenait jusque-là le texte publié sur X en transformant tous les retours à la ligne en espaces. La source fournit pourtant des paragraphes, listes d'années, scores et autres éléments sur plusieurs lignes. **Ces ruptures de ligne originales sont maintenant conservées** ; seul le petit titre utilisé pour l'index est ramené à une seule ligne.

Les cartes natives utilisent une typographie mobile adaptée : retour à la ligne sur les mots, paragraphes et listes préservés, images pleine largeur sous le texte, sans fenêtre X ni bouton « Voir plus ». Si le contenu publié est temporairement indisponible, un dernier relevé récent peut être affiché ; les relevés de plus de sept jours ne sont jamais présentés comme récents.

## Validation

Les tests Node vérifient la conservation des posts hors ligne, la compatibilité du chargement, l'inclusion dans le flux même avec 90 autres articles et la présence du précache. Les tests Python vérifient les paragraphes originaux et la conservation des galeries et vidéos. Aucune source de contenu n'est inventée.

---

# Mon Sport V15.4 — publications lisibles directement, sans « Voir plus » de X

Les publications du compte **Jeu, set et maths** apparaissent désormais comme des **articles natifs de Mon Sport** dans le flux d’actualités. L’application n’intègre plus de fenêtre/iframe X, ni son bouton interne « Voir plus » (qui redirigeait vers X). Le bouton « Voir plus » de Mon Sport a également été supprimé : **le texte du post est visible d’emblée, sans limitation de hauteur ni clic nécessaire**.

- Le collecteur `scripts/refresh_jeu_set_maths.py` conserve maintenant, séparément du titre abrégé, **tout le texte disponible dans le relevé public**, jusqu’à 30 000 caractères ; les relevés précédents qui n’ont qu’un titre sont identifiés comme tels jusqu’à leur actualisation.
- Les **photos d’origine** apparaissent directement sous le texte (jusqu’à quatre visuels par post, en qualité `orig` lorsque la source les donne). Les vidéos MP4 fournies par la source utilisent le **lecteur vidéo natif** du téléphone, sans widget X.
- Tous les médias sont chargés à la demande, uniquement lorsqu’ils sont visibles. En cas d’échec, l’application affiche un message plutôt qu’un visuel cassé.
- Le lien vers la publication originale reste disponible en bas de chaque article pour attribution et vérification, mais ne s’ouvre jamais automatiquement.
- Une **source tierce** (miroir public de X) fournit le contenu collecté et peut ne pas exposer tous les médias ou l’ensemble d’une conversation ; aucun média ni texte absent n’est inventé.
- Le filtrage du flux conserve toutes les publications d’un compte consacré aux statistiques sportives, même si elles ne contiennent pas explicitement le mot « tennis ».
- Les autres actualités ESPN et FFL ne changent pas. Versions CSS, JS et cache Android **V15.4**.

## Contrôles

Les tests de régression vérifient l’absence de widget X et de « Voir plus », le rendu du texte, des galeries de plusieurs photos, des vidéos et des relevés anciens ; les tests Python valident les URLs des médias et la récupération du texte complet. La publication est réalisée par GitHub Pages.

---

# Mon Sport V15.3 — publications X directement dans le flux d'actualité

Les posts **Jeu, set et maths** sont maintenant **intégrés directement entre les autres articles** dans l'onglet Articles : il n'est plus nécessaire de cliquer sur chaque carte pour lancer le lecteur officiel X.

- Les publications X sont chargées automatiquement **lorsque leur carte entre dans la zone visible** (ou à proximité). Le chargement progressif évite de ralentir l'arrivée du flux et les autres onglets.
- Un bouton **« Voir plus »** de Mon Sport agrandit la publication **sur la même page**, et **« Voir moins »** la replie, sans quitter le fil. Le lecteur officiel X affiche le contenu et les médias qu'il autorise à intégrer.
- Le bouton Mon Sport ne contrôle pas les liens internes de l'iframe X : certaines actions propres au widget X peuvent continuer à ouvrir la plateforme.
- En cas de blocage de l'intégration par X ou le navigateur, l'application explique la limitation et conserve un extrait et un lien vers la publication originale.
- Les articles FFL/ESPN gardent leur fonctionnement. La PWA est versionnée V15.3 pour activer l'affichage sur Android.

---

# Mon Sport V15.2 — publications complètes de « Jeu, set et maths » intégrées

En ouvrant une publication du compte **@JeuSetMaths** dans l'onglet **Articles**, Mon Sport essaie désormais de charger directement **le post original complet, avec son texte, ses images et ses vidéos**, via l'[intégration officielle de X](https://help.x.com/fr/using-x/how-to-embed-a-post).

- Le lecteur X ne se charge **qu'au clic sur le post** : aucune requête à X n'est faite en naviguant simplement dans la liste des articles.
- L'intégration reste **dans Mon Sport**, adaptée à la largeur du téléphone. La publication n'est pas copiée ni réhébergée par le tableau de bord.
- Lorsque X ou un bloqueur empêche l'intégration, un message le précise, un extrait déjà disponible reste affiché et un lien vers la source demeure accessible.
- L'ouverture du lecteur charge des éléments fournis par X et peut transmettre des données techniques à X ; cette possibilité est annoncée dans l'interface.
- Le système de collecte des publications récentes et les articles des autres médias ne sont pas modifiés.
- La PWA utilise le cache versionné **V15.2**. Le lecteur officiel n'est pas garanti en mode hors connexion.

---

# Mon Sport V15.1 — consulter « Jeu, set et maths » dans l’application

Les publications publiques récentes de **Jeu, set et maths** s'ouvrent maintenant directement dans le fil **Articles**, sans renvoi automatique vers X. Il suffit de toucher leur carte pour déplier un lecteur intégré comprenant le court extrait de la publication, sa date et **son visuel de statistiques agrandi** lorsque le compte en a publié un.

- Les cartes conservent les autres articles FFL et ESPN avec leur fonctionnement classique.
- Les visuels chargent uniquement à l'ouverture du lecteur ; un message est affiché lorsqu'un média X ne répond pas.
- Les posts s'ouvrent sans iframe, sans connexion obligatoire à X, et le lien **« Voir la publication originale sur X »** reste accessible mais facultatif.
- L'application conserve la publication source et son attribution ; les posts longs n'y sont pas copiés intégralement, seuls les courts extraits et les visuels disponibles sont présentés.
- La collecte existante des publications des sept derniers jours demeure inchangée, avec mises à jour planifiées et filtrage de provenance.
- La PWA est versionnée **V15.1** pour que le nouveau lecteur arrive dans le cache Android.

---

# Mon Sport V15.0 — stabilité des écrans, Jeu Set et Maths et match NBA unique

## Plus jamais d'écran de démarrage forcé pendant la consultation d'un joueur

Le rechargement automatique à l'événement `controllerchange` du service worker a été supprimé. Quand une nouvelle version est installée en arrière-plan, le navigateur conserve **l'écran et la navigation de l'utilisateur**, sans appeler `location.reload()`. Le nouveau service worker n'utilise plus `clients.claim()` pour remplacer le contrôleur d'une page déjà ouverte. Une mise à jour volontaire reste possible via **Réglages → Vérifier et recharger**. Le chargement initial unique de V14.9 et le cache de session sont conservés.

## Articles : derniers posts « Jeu, set et maths »

Mon Sport propose désormais les publications de statistiques tennis du compte X [@JeuSetMaths](https://x.com/JeuSetMaths) dans le fil **Articles**, au milieu des liens FFL et ESPN, avec le pictogramme 🎾. Les posts sont affichés sous forme de **courts extraits** avec leur date, l'auteur et **un lien direct vers la publication originale**. Les médias restent facultatifs.

Un collecteur Python lit périodiquement les publications publiques rendues sur [teapawt.org/JeuSetMaths](https://teapawt.org/JeuSetMaths), vérifie l'identifiant, l'auteur, la date encodée dans l'identifiant X et la période de **sept jours**, puis publie `data/jeu-set-et-maths.json`. Si cette source tierce est indisponible, l'application n'invente pas de nouveaux posts ; le lien vers le compte X reste disponible. La mise à jour est incluse dans le workflow prévu toutes les six heures.

## Un seul match NBA, statistiques de l'équipe et du joueur au même endroit

Les rencontres des **San Antonio Spurs** et les statistiques confirmées de **Victor Wembanyama** sont regroupées **par identifiant de rencontre ESPN**. L'onglet Résultats n'affiche plus une deuxième carte individuelle du même match. La rencontre unique est visible depuis les deux favoris et conserve le score des Spurs, le contexte du match et les statistiques publiées de Wembanyama (points, rebonds, passes, contres).

Au clic sur **Résumé / Détail du match**, la fiche affiche les statistiques d'équipe et du joueur lorsqu'elles sont disponibles. Aucune participation de Wembanyama n'est supposée à partir du seul calendrier des Spurs : les matchs sans donnée individuelle affichent une information explicite. Les chiffres d'autres joueurs ne sont jamais attribués à Wembanyama par défaut.

## Tests

Les contrôles JavaScript vérifient le partage d'une rencontre NBA, sa présence chez les deux favoris, le rendu de la fiche détaillée, l'absence de rechargement spontané et le filtrage des posts. Les tests Python vérifient également l'auteur des posts, la fraîcheur, la date et les liens d'origine. Les tests existants des classements et du cache sont maintenus.

---

# Mon Sport V14.9 — chargement unique et Stats sans redondances

## Au démarrage : un chargement, puis navigation fluide

- Une page de chargement initiale présente une progression simple pendant que **résultats, actualités, historique, classements et premier calendrier de favori** sont récupérés en parallèle.
- Le chargement initial ne bloque plus indéfiniment sur une source lente : au bout de 22 secondes maximum, l'interface devient accessible avec les données déjà reçues ; les derniers résultats peuvent arriver ensuite.
- **Tous les classements sont mis en mémoire une seule fois pour la session** (chargements simultanés regroupés). Passer de « Résultats » à « Classements », puis à « Favoris → Stats » ne relance pas les requêtes sportives pour ces tableaux.
- Les calendriers détaillés sont conservés en mémoire **pendant toute la session**, sans expiration automatique à chaque navigation. Le premier calendrier sélectionné est préchargé dès l'ouverture ; ceux des autres favoris sont récupérés lors de leur première consultation. Une fois consultés, on peut y revenir sans nouveau chargement.
- Le bouton **↻** permet de demander une actualisation explicite, notamment sur l'onglet Classements ou Stats. Les résultats, la recherche historique et les photos continuent de pouvoir être actualisés lorsqu'on le demande.
- La PWA charge les scripts, styles et icônes versionnés **directement depuis son précache** après installation. Le document et les données sportives restent prioritairement récupérés depuis le réseau à la nouvelle ouverture ; les ressources disposent du repli hors connexion.
- Les photos sont appliquées progressivement aux images sans reconstruire les cartes ni interrompre la navigation.

## Stats des favoris : informations regroupées

- **Profil commun** : l'âge et le pays n'apparaissent qu'une fois, y compris lorsque le favori figure simultanément dans ATP, Race ATP et Next Gen.
- **Tournois dédoublonnés** : si « Tournoi en cours » ou « Tournoi précédent » est identique dans plusieurs tableaux, l'information n'est affichée qu'une fois. Les points, classements et projections restent distincts pour chaque classement, car ils n'ont pas nécessairement la même signification.
- **Valeurs absentes** : plutôt que d'empiler des cases « — », les données non communiquées n'engendrent pas de tuile.
- **Favoris hors top 150** : plusieurs classements indisponibles ne provoquent plus autant de cartes d'erreur identiques. Une explication unique est affichée si aucun classement associé ne possède de données.
- **Football et NBA** : suppression des tuiles « Équipe » répétant l'intitulé ; les statistiques utiles de chaque compétition demeurent visibles. Sources et dates conservées.

## Vérifications

Tests Node couvrant le cache de session, l'actualisation forcée, la non-répétition du profil et des tournois, les classements football et les favoris. Les 10 tests Python continuent de vérifier les collecteurs de tennis et de tennis de table. Mise à jour PWA et cache versionnés en V14.9.

---

# Mon Sport V14.8 — colonnes alignées et statistiques complètes des favoris

## Affichage des classements

- Les **classements ATP et WTA** présentent à nouveau le **meilleur classement (MC)** dans une colonne séparée du **joueur**. Les classements Race ATP/WTA et Next Gen ne créent pas de MC fictif lorsque la source ne le donne pas.
- **Un joueur par ligne** : noms affichés sans retour à la ligne, avec points de suspension si l'écran est trop étroit. Le nom complet reste accessible par l'infobulle et le libellé accessible.
- **Colonnes centrées** : les en-têtes et données sont alignés au centre, y compris les rangs, points, variations, tournois, buts, statistiques NBA et WTT. Le rang, le MC (lorsqu'il existe) et le nom restent visibles lors du défilement horizontal.
- Les tableaux conservent leur format compact pour téléphone et le défilement horizontal plutôt que de masquer des chiffres importants.

## Onglet Favoris → Stats

Chaque favori reprend **les statistiques détaillées des classements auxquels il est lié**, directement depuis la même donnée chargée que l'onglet Classements :

- **ATP, WTA, Race, Next Gen** : rang, MC lorsque disponible, âge, nationalité, points live, évolution de rang et de points, tournois en cours/précédent, statut de tournoi et projections « prochain / maximum » uniquement lorsqu'elles sont transmises.
- **Football (Ligue 1, Liga, Champions League)** : rang, points, matchs joués, victoires/nuls/défaites, buts marqués/encaissés, différence de buts et variation du rang.
- **NBA Ouest** : rang, victoires/défaites, pourcentage, retard au leader, série, dix derniers matchs, bilans domicile/extérieur et moyennes de points.
- **Tennis de table ITTF** : rang, pays, points, évolution hebdomadaire et semaine du relevé.
- La **source**, la **date de récupération** et les éventuels problèmes d'actualisation sont visibles pour chaque classement, avec un lien vers son tableau complet.
- Les classements de **Real Madrid associés à Mbappé**, et ceux des **San Antonio Spurs associés à Wembanyama**, sont clairement indiqués comme **classements d'équipe**, pas comme statistiques individuelles.
- Les favoris personnalisés sont aussi reconnus lorsqu'ils apparaissent dans un classement déjà chargé, y compris WTT femmes. En l'absence de données, un message explicite remplace tout chiffre inventé.

## Déploiement et vérifications

Le module Stats et le module Agenda utilisent les importations actualisées, avec renouvellement du cache PWA V14.8. Les tests Node couvrent les correspondances, les tableaux centrés dans le DOM et les relevés des classements par sport ; les tests Python de collecte restent conservés. Les vérifications de syntaxe et les tests GitHub Actions passent avant la fusion.

---

# Mon Sport V14.7 — tableaux multi-sports et densité mobile

## Tennis : davantage de colonnes visibles sur téléphone

Les cinq tableaux ATP, WTA, Race ATP, Race WTA et Next Gen conservent leurs 150 rangs et leurs sources live. Sur smartphone, **MC** (lorsque disponible) est maintenant intégré au nom du joueur, et le pays apparaît en **drapeau dans la même cellule** : deux colonnes distinctes disparaissent, sans perte d’information. Les autres colonnes sont rétrécies avec des polices, espacements et marges plus compacts. Le rang et le nom restent fixes pendant le défilement horizontal ; le tableau est accessible au clavier.

## Football et NBA : statistiques ESPN en colonnes

- **Ligue 1, Liga, Ligue des champions** : rang, équipe, rencontres jouées (J), victoires (V), matchs nuls (N), défaites (D), buts marqués (BP), encaissés (BC), différence de buts (Diff.), points (Pts), et changement de rang (Δ rang) si ESPN le transmet. Les classements de l'UEFA conservent le groupe ou la phase ESPN si plusieurs groupes sont présents.
- **NBA Ouest** : rang, franchise, victoires, défaites, pourcentage, matchs de retard sur le leader (Écart), série en cours (V/D), bilan des dix derniers matchs, matchs domicile/extérieur, moyenne de points marqués, encaissés et différence moyenne par match. Seules les quinze franchises de la conférence Ouest remontent dans le tableau.
- Les logos des équipes sont montrés lorsque le flux ESPN fournit une URL HTTPS. Une valeur absente s'affiche **« — »**, jamais une valeur reconstruite à partir de l'ordre du tableau. Les tableaux restent défilables horizontalement sur téléphone avec rang et équipe visibles à gauche.

## Tennis de table : deux classements hebdomadaires ITTF top 150

- **WTT hommes et WTT femmes** remplacent l'ancienne liste partielle pour les internautes connectés : 150 athlètes chacun, avec rang, pays, points, et places gagnées/perdues depuis la publication précédente.
- Les valeurs sont reprises du classement **hebdomadaire ITTF** consulté par [Eleven Table Tennis](https://www.eleventabletennis.com/rankings), et peuvent être comparées à [l'ITTF](https://www.ittf.com/rankings/).
- Ce classement n'est **pas live** : il est publié par semaine, puis collecté avec date, semaine et source. Le collecteur valide les 150 entrées, noms uniques, points et ordre des rangs avant de publier les fichiers `data/wtt-men.json` et `data/wtt-women.json`. Un relevé vieux de plus de quatorze jours n'est pas présenté comme récent.
- En cas d'indisponibilité temporaire, un cache récent est identifié comme tel. Pour les hommes uniquement, l'ancien relevé partiel reste un repli explicite, daté du 9 novembre 2026.

## Validation et publication

`npm test` vérifie notamment les statistiques NBA et football, les tableaux WTT et le regroupement MC/drapeau sur mobile. Les tests Python valident les tableaux hebdomadaires ITTF. Les diagnostics réseau temporaires ont été retirés des tests ordinaires. Le workflow de collecte actualise les cinq fichiers tennis live et les deux classements ITTF, puis republie GitHub Pages à chaque actualisation validée sur `main`.

---

# Mon Sport V14.6 — classements tennis plus lisibles sur smartphone

**Résultats intégrés aux tournois.** Pour ATP, WTA, Race ATP, Race WTA et Next Gen, la colonne « Résultat » est supprimée. Un indicateur **« En lice / prévu »** figure directement sous le « Tournoi en cours » lorsque la source l'indique ; la **défaite** est signalée et mise en évidence dans « Tournoi précédent ». Si le libellé source contient déjà « Défaite », l'interface n'ajoute pas une deuxième mention textuelle identique. Aucune victoire, défaite ou présence certaine en compétition n'est déduite d'une variation de points.

**Affichage mobile resserré.** Police et interlignes légèrement diminués, cellules et marges compactées, largeur des colonnes réduite, alignement des nombres préservé. Le nom du joueur et son rang restent visibles pendant le défilement horizontal ; les colonnes « Suiv. » et « Max » restent accessibles sur la droite. Les cinq tableaux tennis bénéficient de la même présentation compacte, y compris les Race et Next Gen sans colonne MC.

**Fiabilité.** Les sources live, les vrais rangs, les 150 premières positions, les filtres d'âge et de nationalité restent inchangés. Les états vides restent marqués par un tiret et la provenance des tournois « Observé récemment » est conservée. Tests de non-régression du placement des résultats et du rendu des cinq classements.

---

# Mon Sport V14.5 — cinq classements de tennis live, même présentation

**Depuis la V14.5, les cinq classements de tennis simple utilisent des relevés live français, chacun limité aux 150 premiers joueurs :**
- ATP live : https://live-tennis.eu/fr/classement-atp-live
- WTA live : https://live-tennis.eu/fr/classement-wta-live
- Race ATP live : https://live-tennis.eu/fr/classement-atp-race
- Race WTA live : https://live-tennis.eu/fr/classement-wta-race
- Next Gen live : https://live-tennis.eu/fr/classement-atp-race-next-gen

**Deux colonnes de tournois** : « Tournoi en cours » affiche la compétition indiquée comme actuelle par la source ; « Tournoi précédent » reprend le relevé explicite du fournisseur. Si cette dernière information est absente, Mon Sport peut afficher un tournoi vu dans ses précédents relevés (fenêtre de 14 jours), en le signalant par « Observé récemment ». Les observations ne sont pas des dates officielles de matchs. Les colonnes « Résultat », « Suiv. » et « Max » continuent à ne jamais inventer de résultats ou de projections.

**Même ergonomie** pour les cinq classements : rang live, joueur, âge, pays, points, variation de places et de points, résultat du tournoi, projections et filtres « moins de X ans » et nationalité (🇫🇷 France en premier). Les classements Race et Next Gen ne montrent pas de colonne « MC » fictive, car cette donnée n'est pas fournie par leur source. Les tableaux défilent horizontalement sur mobile.

**Collecte** : le workflow GitHub Actions récupère les cinq relevés depuis les sites publics toutes les six heures ; chaque tableau doit contenir 150 rangs vérifiés. Les derniers fichiers valides sont conservés lorsqu'une source échoue. Après 36 heures sans mise à jour, un tableau ne doit plus être présenté comme frais. Les fichiers sont publiés sur GitHub Pages avec le site.

Le classement **WTT/ITTF** concerne le tennis de table, une autre discipline ; il reste sur ses données datées, sans chiffres live de tennis artificiellement appliqués.

---

# Mon Sport V14.4 — filtres tennis et tournois observés sur 14 jours

- **Filtres au-dessus des classements ATP et WTA** : âge strictement inférieur à une limite choisie (de 16 à 51 ans), nationalité, ou les deux ensemble. La France figure toujours en tête des pays disponibles, les autres sont triés par leur nom français. Le tableau conserve les vrais rangs et précise le nombre de joueurs affichés. Le bouton **Effacer** rétablit tous les joueurs.
- **Classement ATP live, colonne « Tournois · 14 j »** : affiche le tournoi actuellement indiqué et les tournois précédemment observés dans les relevés ATP live de Mon Sport sur une fenêtre glissante de 14 jours. Les observations anciennes restent distinctes, avec le libellé « Observé ». Les informations ne sont ni datées fictivement ni présentées comme des résultats confirmés : le flux source ne fournit pas de date explicite par tournoi.
- **Historique progressif** : le collecteur GitHub Actions toutes les 6 heures conserve les tournois présents dans les relevés successifs, avec leur date de dernière observation, et supprime ceux qui ne sont plus vus depuis 14 jours. Le premier relevé ne peut pas reconstituer les événements absents des données précédentes ; l'historique se complète lors des actualisations.
- **Android/PWA** : versionnement des ressources V14.4 et renouvellement du cache pour rendre visibles les nouveaux filtres.
- **Tests** : Node vérifie les filtres, la combinaison âge + France, le respect du vrai rang, l'absence de résultats et les tournois expirés ; Python valide la conservation sur 14 jours, les doublons et la suppression des données périmées.

---

# V14.3 — Classement ATP 100 % live (13 novembre 2026)

L'onglet **ATP live** affiche maintenant **uniquement le top 150 du relevé [live-tennis.eu en français](https://live-tennis.eu/fr/classement-atp-live)**. Le classement ATP hebdomadaire ESPN n'est plus utilisé pour remplir ce tableau et n'est pas affiché en colonne.

Colonnes : rang live, meilleur classement (MC), joueur, âge, pays, points live, **variation de places**, **variation nette des points**, tournoi en cours, tournois précédents, **statut du résultat**, points après le prochain match gagné et maximum possible. Le tableau défile horizontalement sur mobile, avec les principales informations du joueur accessibles sur la gauche.

Le statut **Défaite** est extrait d'une mention explicite de la colonne « Tournois précédents », jamais de la variation des points. **En lice / prévu** signifie qu'un tournoi en cours est cité, pas que la victoire ou la présence sur le court a été confirmée. **Non indiqué** signifie que la source ne permet pas de conclure. Les cas où les qualifications puis la défaite du tableau principal concernent la même compétition sont pris en compte. Il n'existe pas de date individuelle de match garantie dans ce flux : ne pas présenter les défaites comme datées exactement de cette semaine.

Le relevé est contrôlé (150 rangs distincts, points cohérents) puis publié automatiquement toutes les six heures. Le tableau affiche l'horodatage de la copie ; après 36 heures sans données nouvelles, les informations ne sont plus qualifiées de live. En cas de panne réseau, seule une copie locale récente et explicitement marquée peut être proposée.

Les classements WTA et des autres disciplines conservent leurs sources et leur comportement précédents. Tests Node et Python couvrent le classement, les variations, le statut des défaites, les projections et l'intégrité du top 150.

---

## V14.2 — Tableau ATP live en colonnes

- Navigation : `Semaine` devient **Résultats** ; `Un favori` devient **Favoris** ; l'ancien onglet de gestion `Favoris` devient **Gérer mes suivis**.
- ATP et WTA : présentation en **8 colonnes** (rang, joueur, points officiels, points live, variation nette de points, tournoi, prochain match, maximum) dans un tableau à défilement horizontal sur téléphone, sans fiche de détail à ouvrir.
- ATP : les colonnes live, tournoi, prochain et maximum sont alimentées depuis un relevé public de **live-tennis.eu**, validé pour les 150 premières places, puis rapproché des joueurs du classement hebdomadaire ESPN. Si une valeur n'est pas fournie, un tiret est affiché (pas un calcul fictif).
- La colonne **Δ pts** est la variation **nette** entre le classement officiel et le relevé live, comprenant potentiellement les retraits de points de la semaine : ce n'est **pas** le seul nombre de points gagnés dans le tournoi.
- WTA : top 150 officiel conservé, données live supplémentaires non alimentées.
- Actualisation automatique via GitHub Actions toutes les six heures, avec contrôle strict de la structure et de la cohérence du top 150. Dernier relevé disponible dans `data/atp-live.json`, horodaté. Si la source devient inaccessible, on garde les valeurs officielles, sans afficher de projections périmées.
- Le collecteur utilise des données publiques, avec un lien vers la source visible dans l'application. Toute modification de structure ou d'accès du site peut nécessiter une adaptation du collecteur.

# Mon Sport V14 — fiabilité, hors connexion et tests

> Version en préparation sur la branche `feat/v14-fiabilite-tests-ergonomie`. La version publique reste inchangée jusqu'à validation de la pull request.

## Nouveautés V14
- Validation et nettoyage des favoris enregistrés lors du chargement : champs essentiels vérifiés, maximum 200 favoris, identifiants manquants recréés, noms limités. En cas de stockage local indisponible, un avertissement apparaît lors de la sauvegarde.
- Classements ESPN : aucun rang reconstruit à partir de l'ordre des lignes si la source ne fournit pas de rang. Les bilans NBA incomplets ne sont pas affichés comme complets.
- Agenda : les compétitions passées sans résultat confirmé sont triées selon leur date de fin lorsqu'elle est connue.
- Interface : indicateur hors connexion, conservation des informations consultables depuis le cache, actualisation réseau suspendue hors ligne.
- Vérification : `npm test` exécute des tests de non-régression sans dépendance. `npm run check` vérifie la syntaxe. Workflow GitHub Actions sur les branches et pull requests.

## Classements et visuels (extension V14 du 13 novembre 2026)
- **ATP et WTA, simple : top 150** chargé depuis les classements ESPN, sans conserver le top 10 incomplet en repli. Les derniers tableaux chargés avec succès sont enregistrés dans le navigateur avec l'heure de consultation ; s'ils sont montrés hors ligne, l'interface les signale comme des copies possiblement périmées.
- **Progression hebdomadaire** : l'évolution du rang est calculée à partir des champs `current` et `previous` transmis par ESPN (une hausse de rang affiche ▲, une baisse ▼).
- **Fiches ATP/WTA dépliables** : âge, pays, rang précédent, points officiels, détail des champs de tournoi. Les points en cours, points défendus, points au prochain tour et maximum possible restent marqués « Non disponible » car ESPN ne les fournit pas. Une source ATP live existe mais n'est pas intégrée sans flux vérifiable et accessible. Aucun chiffre fictif n'est projeté.
- **Race ATP/WTA, Next Gen, WTT** : les relevés antérieurs restent partiels, identifiés comme non exhaustifs. Le top 150 n'est donc garanti que sur les classements simples ATP/WTA si ESPN renvoie ses 150 entrées.
- **Football** : rang, points, matchs joués (J), victoires (V), nuls (N), défaites (D), buts marqués/encaissés (BP/BC) et différence de buts si ces statistiques sont envoyées par ESPN.
- **Articles** : miniatures ESPN ou WordPress/FFL, miniatures RSS lorsqu'elles sont fournies par le flux, et portrait du favori en secours si disponible. Sinon, pictogramme sportif lisible.
- **Résultats** : dans les badges, portraits/logo et pictogramme du sport remplacent le nom du favori (accessible en info-bulle et pour les lecteurs d'écran). Le titre du match et les verdicts sont conservés.
- **PWA** : le module `sports-media.js` est préchargé, cache version `mon-sport-v14-1`.

## Points à vérifier avant fusion
1. Sur Android, lancer l'application en ligne puis hors connexion, et vérifier l'apparition du bandeau.
2. Contrôler la présence des 20 favoris existants, ainsi que l'import/export et la persistance locale.
3. Vérifier le chargement des 150 premiers ATP/WTA, le mouvement hebdomadaire, les statistiques V/N/D et les classements Race marqués non exhaustifs.
4. Vérifier les miniatures d'articles depuis le téléphone (CORS, Cloudflare, ESPN, FFL), le repli sur icône et l'installation PWA.
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
