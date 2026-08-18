import { useEffect, useId, useState } from 'react';

/**
 * Pictogrammes maison animés, repris à l'identique du bloc CRM
 * `SunLibIT/Abo-detail-inpage` (`Block.tsx`, SpinningSun / ChargingBattery).
 *
 * Géométrie, tracés et durées d'animation sont ceux de la source. Les
 * animations sont en SMIL, dans le SVG, et non en CSS : c'est le choix
 * d'origine, motivé par le CSP de Softr qui peut bloquer la feuille injectée.
 * On le conserve — un même picto doit s'animer pareil d'un outil à l'autre.
 *
 * Deux écarts assumés, tous deux invisibles à l'œil :
 *  - l'identifiant de `clipPath` vient de `useId()` plutôt que d'un compteur
 *    de module, pour rester correct en rendu serveur et en StrictMode ;
 *  - l'animation est retirée sous `prefers-reduced-motion`, que SMIL n'honore
 *    pas tout seul (charte §2 : « amélioration progressive uniquement »).
 */

/** Couleurs d'origine du bloc CRM (`T.solar600`, `T.brand`, `T.brand600`). */
const SUN_STROKE = '#D97706';
const BATTERY_FILL = '#0E9384';
const BATTERY_STROKE = '#0B7A6E';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

interface PictoProps {
  size?: number;
  /** Permet de recolorer le picto sans toucher au tracé. */
  color?: string;
}

/** Soleil en rotation lente (un tour en 28 s). */
export function SpinningSun({ size = 18, color = SUN_STROKE }: PictoProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <g>
        {!reduced && (
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="28s"
            repeatCount="indefinite"
          />
        )}
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </g>
    </svg>
  );
}

interface BatteryProps extends PictoProps {
  /** Couleur du liquide interne. */
  fill?: string;
}

/**
 * Batterie « en charge » : contour fixe, liquide interne qui oscille sous
 * gravité (7 s) pendant que la surface ondule horizontalement (9 s).
 */
export function ChargingBattery({
  size = 18,
  color = BATTERY_STROKE,
  fill = BATTERY_FILL,
}: BatteryProps) {
  const reduced = usePrefersReducedMotion();
  // useId() produit des « : » que url(#…) tolère mal — on les retire.
  const clip = `slb-bat-${useId().replace(/:/g, '')}`;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <rect x="3" y="8" width="14" height="8" rx="1.5" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        {/* Slosh vertical : le niveau oscille sous gravité. */}
        <g>
          {!reduced && (
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0 1.2;0 -1.2;0 1.2"
              dur="7s"
              repeatCount="indefinite"
            />
          )}
          {/* Ondulation horizontale de la surface. */}
          <path d="M-8 11.5 q3.5 -1.6 7 0 t7 0 t7 0 t7 0 t7 0 t7 0 L37 18 L-8 18 Z" fill={fill}>
            {!reduced && (
              <animateTransform
                attributeName="transform"
                type="translate"
                from="0 0"
                to="-14 0"
                dur="9s"
                repeatCount="indefinite"
              />
            )}
          </path>
        </g>
      </g>
      <rect x="2" y="7" width="16" height="10" rx="2" ry="2" fill="none" stroke={color} strokeWidth="2" />
      <line x1="22" y1="11" x2="22" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
