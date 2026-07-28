/* ── LE SOL · une seule source, deux émissions ────────────────────────────────
 * Le site et le banc doivent dessiner le MÊME sol. Deux fichiers CSS qui se
 * ressemblent ne sont pas le même sol : ils sont deux sols qui divergeront le
 * jour où quelqu'un touche l'un et pas l'autre. C'est exactement la dette que
 * cet arc passe son temps à payer.
 *
 * Donc ce module est la seule source. Il exporte deux fonctions pures des
 * quantités projetées (NIKA_MATERIAL.ground) :
 *
 *   groundCss(MAT)  le CSS des quatre couches
 *   groundJs()      le comportement (le spot suit le pointeur)
 *
 * design/build-ground.mjs les écrit dans src/styles/ground.css pour le site.
 * design/bench.mjs les inline dans la page hors-ligne.
 * src/test/ground-parity.test.ts refuse que les deux divergent d'un octet.
 *
 * TOUT EST LU, RIEN N'EST INVENTÉ. Les quatre couches, la croix, la vignette
 * qui se resserre pendant un run, le spot bleu de 680px et le langage de
 * curseurs viennent de nika-vscode src/webview/dag.css, via
 * nika-spec design/tokens.yaml. Le seul choix pris ici est comment le WEB les
 * lie — la même séparation que roles: et material: tiennent déjà. */

/** la croix de la trame, construite depuis ses quantités · jamais une data-URI
 *  recopiée à la main, parce qu'une chaîne encodée dérive sans que personne
 *  ne le voie */
export const crossImg = (cell, arm, stroke, ink = '#ffffff') => {
  const c = cell / 2
  const d = `M${c} ${c - arm}v${arm * 2}M${c - arm} ${c}h${arm * 2}`
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${cell}' height='${cell}'>` +
    `<g stroke='${ink}' stroke-opacity='${stroke}'><path d='${d}'/></g></svg>`
  return `url("data:image/svg+xml,${svg
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/#/g, '%23')}")`
}

const vignette = (v) =>
  `radial-gradient(${v.reach_x * 100}% ${v.reach_y * 100}% at 50% ${v.at_y * 100}%,` +
  ` transparent ${v.clear * 100}%, rgb(0 0 0 / ${v.edge}) 100%)`

/** LE LANGAGE DE CURSEURS DU CANVAS. Il n'a AUCUN curseur dessiné — il a un
 *  vocabulaire natif où chaque forme dit ce que le geste fera. Le recenser
 *  était le travail ; en inventer un aurait été refaire l'erreur de la lampe
 *  blanche. */
export const CURSORS = [
  ['grab', 'la nappe · on peut la saisir', '.nk-ground'],
  ['grabbing', 'la nappe · on la tient', '.nk-ground:active'],
  ['pointer', 'ça ouvre quelque chose', '42 usages dans le canvas'],
  ['crosshair', 'on va relier deux points', '3 usages'],
  ['help', 'ça s’explique au survol', '2 usages'],
  ['zoom-in', 'ça grandit au clic', '1 usage'],
]

export function groundCss(MAT) {
  const g = MAT.ground
  return `/* ── le sol du canvas · quatre couches ───────────────────────────────
   Généré par design/ground.mjs depuis NIKA_MATERIAL.ground. NE PAS ÉDITER.
   Le site et le banc reçoivent ce même bloc ; ground-parity.test.ts refuse
   qu'ils divergent. */
.nk-ground {
  position: relative;
  isolation: isolate;
  cursor: grab;
  /* le nom du canvas d'abord, celui de la surface hôte ensuite · jamais un
     hex : un repli codé en dur est une seconde opinion sur la couleur */
  background-color: var(--nk-page, var(--nk-bg));
  background-image: ${crossImg(g.grid.cell_px, g.grid.arm_px, g.grid.stroke)};
  background-size: ${g.grid.cell_px}px ${g.grid.cell_px}px;
}
.nk-ground:active { cursor: grabbing; }
/* le zoom arrière prend une maille plus large et un trait un peu plus ferme :
   à distance, une trame trop fine devient du bruit */
.nk-ground[data-lod='far'] {
  background-image: ${crossImg(g.grid.far_cell_px, g.grid.far_arm_px, g.grid.far_stroke)};
  background-size: ${g.grid.far_cell_px}px ${g.grid.far_cell_px}px;
}
.nk-ground[data-grid='off'] { background-image: none; }

/* la vignette · la mare tombe sur ses bords, ET ELLE CONNAÎT LE RUN.
   Pendant l'exécution la chute se resserre et le bord noircit : c'est le seul
   signal ambiant qui dit qu'un run est en vol. */
.nk-ground::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  border-radius: inherit;
  background: ${vignette(g.vignette)};
  transition: background var(--dur-drawer) var(--ease-ui);
}
.nk-ground[data-running]::before { background: ${vignette(g.vignette_running)}; }
.nk-ground[data-vignette='off']::before { background: none; }

/* le spot · une lampe bleue qui suit le pointeur. Elle existait dans le canvas
   avant que le web n'en invente une blanche ; celle-ci est l'originale. Les
   coordonnées sont en PIXELS, comme le canvas les écrit. */
.nk-ground::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  border-radius: inherit;
  opacity: var(--spot-on, 0);
  transition: opacity var(--dur-spot) ease-out;
  background: radial-gradient(
    ${g.spot.radius_px}px circle at var(--spot-x, 50%) var(--spot-y, 40%),
    rgb(${g.spot.hue} / ${g.spot.alpha}),
    transparent ${g.spot.fade * 100}%
  );
}
.nk-ground[data-spot='off']::after { opacity: 0; }

/* ce qu'il devient quand on lui en demande moins */
@media (prefers-reduced-motion: reduce) {
  .nk-ground::before,
  .nk-ground::after { transition: none; }
}
@media (forced-colors: active) {
  /* la trame et la vignette sont de la profondeur, pas de l'information :
     en contraste forcé elles disparaissent plutôt que de manger le contraste */
  .nk-ground { background-image: none; }
  .nk-ground::before,
  .nk-ground::after { display: none; }
}
`
}

/** le comportement · une lampe pour toute la nappe, un rAF, deux écritures.
 *  Aucun écouteur par nœud, aucune mesure par carte : les coordonnées du
 *  pointeur vont directement en pixels relatifs à la nappe. */
export function groundJs() {
  return `/* généré par design/ground.mjs · ne pas éditer */
(function () {
  var lite = false;
  try {
    var c = navigator.connection;
    lite = !!(c && c.saveData) || matchMedia('(prefers-reduced-data: reduce)').matches;
  } catch (e) { /* un navigateur sans l'API n'est pas un navigateur économe */ }
  document.querySelectorAll('.nk-ground').forEach(function (el) {
    if (lite) return; /* Save-Data · le sol garde sa trame, la lampe ne s'allume pas */
    var raf = 0, at = null;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      at = { x: e.clientX - r.left, y: e.clientY - r.top };
      el.style.setProperty('--spot-on', '1');
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        if (!at) return;
        el.style.setProperty('--spot-x', at.x.toFixed(1) + 'px');
        el.style.setProperty('--spot-y', at.y.toFixed(1) + 'px');
      });
    });
    el.addEventListener('pointerleave', function () {
      el.style.setProperty('--spot-on', '0');
    });
  });
})();
`
}
