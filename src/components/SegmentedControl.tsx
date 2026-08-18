import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface SegmentedOption<T extends string | number> {
  label: string;
  value: T;
  /** Compteur optionnel, rendu en pastille. */
  count?: number;
}

interface SegmentedControlProps<T extends string | number> {
  /** Intitulé du groupe — obligatoire, lu par les lecteurs d'écran. */
  ariaLabel: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Filtre / bascule à choix unique (charte §2 « Segmented control »).
 *
 * Rail gris en pilule, thumb blanc qui glisse sous l'option active, libellé
 * actif en teal gras. Aucune bordure ni liseré ne marque l'actif : la charte
 * l'interdit explicitement.
 *
 * À réserver au choix unique sur 2 à 5 entrées. Pour du multi-sélection,
 * utiliser les chips (`FilterChip`).
 */
export function SegmentedControl<T extends string | number>({
  ariaLabel,
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  const railRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [thumb, setThumb] = useState({ left: 0, width: 0, ready: false });

  const activeIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );

  const measure = useCallback(() => {
    const el = btnRefs.current[activeIndex];
    if (!el) return;
    setThumb({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
  }, [activeIndex]);

  // useLayoutEffect : le thumb est positionné avant la peinture, sinon il
  // « saute » depuis la gauche au premier rendu.
  useLayoutEffect(measure, [measure, options.length]);

  /**
   * On observe le rail ET chaque segment.
   *
   * Observer le seul rail ne suffit pas : Plus Jakarta Sans est chargée de
   * façon asynchrone, si bien que la première mesure se fait avec les
   * métriques de la police de repli. Quand la webfont arrive, la largeur des
   * segments change mais celle du rail (en `w-full`) ne bouge pas — le thumb
   * restait donc calé sur des mesures périmées. L'erreur se cumule avec le
   * nombre d'options : un contrôle à 4 segments se décalait visiblement plus
   * qu'un contrôle à 2, au point de ne plus ressembler au même composant.
   */
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    if (railRef.current) ro.observe(railRef.current);
    for (const btn of btnRefs.current) if (btn) ro.observe(btn);
    return () => ro.disconnect();
  }, [measure, options.length]);

  // Filet supplémentaire : certains navigateurs ne redimensionnent pas le
  // bouton de façon observable au swap de police.
  useEffect(() => {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (!fonts) return;
    let cancelled = false;
    fonts.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
    };
  }, [measure]);

  const focusAt = (index: number) => {
    const next = (index + options.length) % options.length;
    btnRefs.current[next]?.focus();
    onChange(options[next].value);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        focusAt(index + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        focusAt(index - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusAt(0);
        break;
      case 'End':
        e.preventDefault();
        focusAt(options.length - 1);
        break;
    }
  };

  return (
    <div
      ref={railRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`relative inline-flex w-full rounded-full border border-line bg-rail p-1 ${className}`}
    >
      {/* Thumb blanc coulissant — plat, sans ombre (charte). */}
      <span
        aria-hidden="true"
        className="absolute bottom-1 top-1 rounded-full bg-surface motion-safe:transition-[transform,width] motion-safe:duration-[280ms] motion-safe:ease-[cubic-bezier(.4,0,.2,1)]"
        style={{
          width: thumb.width,
          transform: `translateX(${thumb.left - 4}px)`,
          opacity: thumb.ready ? 1 : 0,
        }}
      />
      {options.map((option, i) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] transition-colors ${
              active ? 'font-bold text-teal-ink' : 'font-semibold text-muted hover:text-ink'
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span
                className={`rounded-full px-1.5 text-[11px] font-semibold leading-tight ${
                  active ? 'bg-teal-soft text-teal-ink' : 'border border-line text-muted'
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
