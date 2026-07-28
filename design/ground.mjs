/* ── LE SOL · ce qui reste côté web ───────────────────────────────────────────
 * Le CSS des quatre couches N'EST PLUS PRODUIT ICI. Il est projeté par
 * nika-spec (design-projector · render_ground_css) vers src/styles/
 * ground.generated.css ET vers le canvas VS Code, à l'octet près.
 *
 * La raison du déménagement : un générateur qui vit dans le repo du site ne
 * peut pas atteindre un dépôt voisin. Une source qui n'atteint pas une surface
 * n'est pas la source de vérité de cette surface — c'est la source des
 * surfaces qui parlent par hasard le même langage.
 *
 * Reste ici ce qui est vraiment propre au web : le comportement du pointeur
 * (le canvas a le sien, en TS) et le recensement du vocabulaire de curseurs. */

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
