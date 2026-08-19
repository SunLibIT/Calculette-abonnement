# Calculatrice d'abonnement SunLib

Simulateur d'abonnement photovoltaïque et batterie : mensualités, économies et
rentabilité client. Application autonome déployée sur Vercel — ce n'est **pas**
un bloc in-page Softr, contrairement aux autres projets `*-inpage` de
l'organisation.

## Démarrer

```bash
npm ci
npm run dev        # http://localhost:5173
```

| Script | Rôle |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` | build de production |
| `npm run preview` | sert le build |
| `npm run typecheck` | `tsc --noEmit` — `vite build` ne vérifie **pas** les types |
| `npm run lint` | ESLint |

Les trois derniers doivent passer avant chaque push.

## Stack

Vite · React 18 · TypeScript · Tailwind 3 · Chart.js · lucide-react.

## Ce qui vit où

```
src/
  App.tsx                    coque écran : rail de paramètres + colonne résultats
  theme.ts                   couleurs des séries — SOURCE UNIQUE
  types/simulator.ts         contrats de données
  utils/
    calculations.ts          modèle métier (aucune dépendance à l'UI)
    levers.ts                recherche des réglages qui font basculer un scénario
  components/
    PrintReport.tsx          document imprimé, écrit à part de l'interface
    Chart.tsx                graphique (3 modes)
    SegmentedControl.tsx     choix unique  ·  FilterChip.tsx  multi-sélection
    Card.tsx  Callout.tsx  KpiTile.tsx  Slider.tsx  MetricCard.tsx
    DecompositionCard.tsx  AnimatedPictos.tsx  PrintButton.tsx
```

## Design

L'interface suit la **Charte UI/UX & Couleurs - IT** et le **référentiel
d'icônes Lucide** de l'espace Notion « Standards & Références ». Les tokens
sont dans `tailwind.config.js` et en variables CSS dans `src/index.css`.

Quelques règles qui se sont déjà fait oublier :

- **Le dégradé de marque est réservé à l'action principale.** Il n'est
  actuellement porté par aucun élément : « Imprimer » est une action de
  service, donc un bouton secondaire.
- **Choix unique → `SegmentedControl` ; multi-sélection → `FilterChip`.** La
  charte interdit de détourner les chips pour un choix unique.
- **Le rouge ne sert qu'à un vrai problème.** La fin de contrat est une borne,
  pas une anomalie ; un cumul négatif est un résultat, pas une alerte.
- **Une même notion = une même couleur.** Les couleurs de série vivent
  uniquement dans `src/theme.ts`.
- **Contraste AA non négociable.** Deux tokens ont déjà dû être corrigés pour
  ça ; vérifier avant d'introduire une couleur de texte.

## Le modèle de calcul

`calculateResults()` produit, pour chaque scénario, un **différentiel annuel
« avec photovoltaïque » vs « sans »** :

```
net = facture évitée par l'autoconso + revente du surplus − abonnement
```

Trois conséquences qui expliquent l'interface :

- **La ligne zéro EST la référence client.** Un cumul négatif signifie que le
  client aurait payé moins en ne faisant rien.
- `referenceCumulative` (facture fournisseur cumulée sans PV) permet de tracer
  les deux courbes absolues : `coût SunLib = référence − cumul`.
- **`switchYear` ≠ `breakEvenYear`.** `switchYear` est l'année où le *cumul*
  repasse au-dessus de zéro — c'est la « bascule » montrée au client.
  `breakEvenYear` est l'année où le *flux annuel* devient positif ; il est
  calculé mais plus affiché.

## L'impression

Le PDF n'est pas l'interface reformatée : `PrintReport.tsx` est un document
distinct. Imprimer l'application revenait à imprimer ses **commandes**
(curseurs, boutons, chips), qui ne veulent rien dire sur papier.

Deux contraintes à ne pas casser :

- Le rapport est monté en permanence mais **rejeté hors écran**
  (`position:absolute; left:-20000px`), jamais en `display:none` — Chart.js ne
  sait pas se dimensionner dans un conteneur masqué et imprimerait un
  graphique vide.
- Sa largeur reste **figée à 704 px, y compris en média print**. La laisser
  libre faisait passer le canvas de 682 à 1418 px au moment d'imprimer, et un
  canvas redimensionné juste avant la capture est la cause classique du
  graphique blanc dans le PDF.

L'URL et la date en bas de page viennent du navigateur, pas du code : les
retirer se fait en décochant « En-têtes et pieds de page » dans la boîte
d'impression.

## Vérifier le rendu, pas seulement la compilation

Typecheck, lint et build verts ne disent rien de ce qui s'affiche. Plusieurs
défauts visibles en deux secondes ont survécu à ces trois contrôles :
superposition d'un suffixe d'unité, contrôle débordant de sa carte, séparateur
de milliers invisible, courbe absente du PDF.

Pour regarder réellement, piloter le Chrome installé via `puppeteer-core` :

```js
const page = await browser.newPage();
await page.goto('http://localhost:5173/');
await page.evaluate(() => document.fonts.ready);   // sinon on mesure la police de repli
await page.emulateMediaType('print');              // pour le document imprimé
await (await page.$('.pr')).screenshot({ path: 'out.png' });
```

Deux pièges rencontrés :

- Mesurer le débordement contre le **viewport** ne détecte pas un élément qui
  sort de sa **carte** en restant dans l'écran. Comparer à la boîte de contenu
  de l'ancêtre `.card`.
- Ne pas changer le `deviceScaleFactor` en cours de session : le canvas est
  réalloué sans être repeint, et le graphique paraît vide alors qu'il ne l'est
  pas en usage réel.

## Points ouverts

- **Défauts par défaut trop pessimistes.** 3 kWc / 10 000 kWh/an / **40 %**
  d'autoconso : l'offre perd 9 678 € sur 25 ans face à ne rien faire, et aucune
  année n'a de flux positif. Or la production (3 099 kWh) est trois fois
  inférieure à la consommation — la quasi-totalité serait autoconsommée. À
  90 %, la bascule tombe en année 14. Hypothèse métier à trancher.
- **`PERTE = 0,00459`** (dégradation annuelle des panneaux) était déclarée mais
  jamais appliquée ; retirée au commit `a331338`, à réintroduire si le calcul
  la réclame.
- **`green-bright #60B830`** en aplat sur blanc donne 2,50:1, sous le seuil 3:1
  des objets graphiques. C'est un token de la charte, non modifié ici.

## Workflow Git

Une seule branche : `main`. Commit et push directs, jamais de branche annexe ni
de PR — convention commune aux projets SunLib. Avant chaque push :
`npm run typecheck && npm run lint && npm run build`.
