# Consignes de travail — Calculatrice d'abonnement SunLib

Contexte produit, architecture et points métier ouverts : voir `README.md`.
Ce fichier ne répète pas le README ; il fixe ce qui s'est déjà cassé une fois.

## Avant chaque push

```bash
npm run typecheck && npm run lint && npm run build
```

`vite build` n'effectue **aucune** vérification de types (esbuild les retire) —
`tsc --noEmit` n'est pas optionnel.

Une seule branche : `main`. Commit et push directs, jamais de branche annexe ni
de PR — convention commune aux projets SunLib. Ne pas créer ni basculer de
branche sans demande explicite.

---

## 🔒 Invariants

Chacun correspond à un défaut réellement livré. Les citer par leur code en cas
de violation.

**V1 — Les trois contrôles verts ne prouvent rien sur le rendu.**
Typecheck, lint et build sont passés au vert sur : un suffixe d'unité
superposé aux chiffres, un contrôle débordant de sa carte, un séparateur de
milliers invisible, une courbe absente du PDF. Tout changement visuel se
vérifie en **regardant** (voir « Regarder le rendu »).

**V2 — Le suffixe d'unité ne se superpose jamais à la valeur.**
`Slider.tsx` : groupe flex, unité en élément frère, et `size={1}` sur l'input.
Sans `size={1}`, la largeur intrinsèque de 20 caractères de l'input sert de
base flex et c'est l'unité qui se fait comprimer. Jamais de suffixe en
`position:absolute` par-dessus un `padding-right` fixe.

**V3 — Le rapport imprimé est monté hors écran, à largeur figée.**
`.pr` est en `position:absolute; left:-20000px; width:704px`, y compris en
média print où seule la position change. Deux raisons distinctes :
`display:none` empêche Chart.js de se dimensionner (graphique vide au PDF), et
une largeur libre faisait passer le canvas de 682 à 1418 px au moment
d'imprimer — un canvas redimensionné juste avant la capture est la cause
classique du graphique blanc.

**V4 — Le document imprimé montre des VALEURS, jamais des commandes.**
`PrintReport.tsx` est écrit à part de l'interface. Ne jamais revenir à
« masquer des morceaux de l'app en CSS print » : on imprimait alors les rails
de curseurs, les poignées et les chips, soit plus de la moitié de la page
avant le premier résultat.

**V5 — Aucune largeur fixe sur un `SegmentedControl`.**
Les libellés sont en `whitespace-nowrap` : une largeur figée déborde dès qu'on
ajoute une option. Largeur dictée par le contenu.

**V6 — Le thumb du segmented control se remesure au chargement de la police.**
Plus Jakarta Sans arrive après le premier rendu. Observer le rail seul ne
suffit pas : sa largeur ne change pas, celle des segments si. `SegmentedControl`
observe **chaque segment** et remesure sur `document.fonts.ready`. Sans ça,
l'erreur croît avec le nombre d'options et deux instances du même composant
paraissent différentes côte à côte.

**V7 — Les couleurs de série vivent uniquement dans `src/theme.ts`.**
Graphique, chips, cartes de métrique et de décomposition y puisent. Aucune
couleur de série en dur ailleurs. `calculations.ts` ne connaît aucune couleur.

**V8 — Le rouge est réservé à un vrai problème.**
Une fin de contrat est une borne, pas une anomalie. Un cumul négatif est un
résultat attendu, pas une alerte. Ne jamais empiler plusieurs signaux d'alarme
sur un même fait.

**V9 — Choix unique → `SegmentedControl` ; multi-sélection → `FilterChip`.**
La charte interdit de détourner les chips pour un choix unique. Ne pas
fusionner les deux composants.

**V10 — Contraste AA vérifié avant d'introduire une couleur de texte.**
Deux tokens ont déjà dû être corrigés (`#D97706` à 3,19:1, pied de page
imprimé à 3,14:1). Seuils : 4,5:1 pour du texte, 3:1 pour un objet graphique.

**V11 — Toute série tracée est identifiée.**
La courbe de référence a longtemps été un pointillé gris sans légende à
l'écran. Écran et PDF doivent nommer ce qu'ils dessinent.

---

## Regarder le rendu

Chrome est installé ; `puppeteer-core` suffit (l'installer dans le scratchpad,
pas dans le projet).

```js
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready); // sinon on mesure la police de repli
await page.emulateMediaType('print');            // pour le document imprimé
await (await page.$('.pr')).screenshot({ path: 'out.png' });
```

Puis lire le PNG. Trois règles apprises à la dure :

- **Mesurer le débordement contre la carte, pas le viewport.** Un élément peut
  sortir de sa section en restant dans l'écran : comparer à la boîte de contenu
  de l'ancêtre `.card`. La sonde « viewport » a laissé passer exactement ça.
- **Ne pas changer le `deviceScaleFactor` en cours de session.** Le canvas est
  réalloué sans être repeint : le graphique paraît vide alors qu'il ne l'est
  pas en usage réel. Un faux positif coûteux.
- **Piloter l'interface réellement** (saisir un prix de batterie dans le champ)
  plutôt que de tester le seul cas par défaut. `useId()` produit des `:` dans
  les identifiants : `getElementById` fonctionne, `querySelector` non.

---

## Pièges d'outillage déjà payés

- **`perl -pi` mange les antislashs.** Il a transformé
  `.replace(/\u202f/g, …)` en `.replace(/202f/g, …)` : lint vert, correctif
  silencieusement désactivé. Pour tout ce qui touche à des caractères
  invisibles, écrire `String.fromCharCode(0x202f)` — source ASCII pur — et
  vérifier le **résultat** de la fonction, pas la compilation.
- **ESLint refuse les espaces insécables littérales** (`no-irregular-whitespace`).
  Même conclusion : `fromCharCode`.
- **Décalage de déploiement Vercel.** Plusieurs « bugs » signalés étaient des
  correctifs poussés mais pas encore redéployés. Avant de diagnostiquer un
  défaut visuel, comparer `origin/main` au code local, et le dire si l'écart
  explique le symptôme.

---

## Ce que le code ne dit pas

`calculateResults()` renvoie, par scénario, un **différentiel annuel « avec PV »
vs « sans »**. Conséquences :

- **La ligne zéro EST la référence client.** Un cumul négatif signifie que le
  client aurait payé moins en ne faisant rien.
- `referenceCumulative` permet de tracer les deux courbes absolues :
  `coût SunLib = référence − cumul`.
- **`switchYear` ≠ `breakEvenYear`.** `switchYear` = année où le *cumul*
  repasse au-dessus de zéro, c'est la « bascule » montrée au client.
  `breakEvenYear` = année où le *flux annuel* devient positif ; calculé, plus
  affiché. Les confondre produit un libellé faux — c'est déjà arrivé.

---

## Périmètre

- **Ne pas retirer d'élément de l'interface pour une raison esthétique
  personnelle.** Les cartes par scénario ont été masquées quand une seule série
  était affichée, au motif qu'elles répétaient une tuile KPI. Personne ne
  l'avait demandé, et le bloc disparaissait avec les réglages par défaut.
  Signaler la redondance, laisser l'arbitrage au client.
- **Les hypothèses métier ne se changent pas en silence** : taux d'autoconso
  par défaut, butées de curseurs, tarifs, constante de dégradation. Les points
  ouverts sont listés en fin de `README.md` — les rappeler plutôt que les
  trancher.
