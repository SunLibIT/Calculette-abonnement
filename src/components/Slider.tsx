import { useId, useState } from 'react';

interface SliderProps {
  label: string;
  value: number;
  /**
   * Valeur formatée affichée au repos, SANS unité (ex. « 6 290 ») — l'unité
   * est rendue par `suffix`. Peut être un texte d'état (« Aucune ») : le
   * suffixe est alors masqué automatiquement.
   */
  displayValue: string;
  min: number;
  /** Plafond réel : borne le curseur ET la saisie. */
  max?: number;
  /**
   * Butée d'affichage du curseur, sans plafonner la saisie au clavier.
   * Sans elle, une butée dérivée de la valeur courante « fuit » sous le pouce :
   * on tire vers la droite, le maximum grandit, la poignée ne progresse jamais.
   */
  sliderMax?: number;
  step: number;
  onChange: (value: number) => void;
  /** Unité saisie dans le champ. « % » signifie que `value` est une fraction 0–1. */
  suffix?: string;
  /** Note d'aide sous le curseur, en gris lisible. */
  hint?: string;
}

/**
 * Curseur + saisie numérique.
 *
 * Accessibilité (charte §3) : un seul `label` associé par `htmlFor`/`id`, qui
 * pilote les deux contrôles via `aria-labelledby` ; la valeur reste saisissable
 * au clavier ; le focus est visible sur la poignée comme sur le champ.
 */
export function Slider({
  label,
  value,
  displayValue,
  min,
  max,
  sliderMax,
  step,
  onChange,
  suffix = '',
  hint,
}: SliderProps) {
  const id = useId();
  const rangeId = `${id}-range`;
  const numberId = `${id}-number`;
  const labelId = `${id}-label`;

  const [draft, setDraft] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const isPercent = suffix === '%';
  // Une valeur saisie au-delà de la butée d'affichage étend la piste plutôt
  // que d'y coincer la poignée.
  const effectiveMax =
    max ?? (sliderMax !== undefined ? Math.max(sliderMax, value) : Math.max(value * 2, min * 2 + step * 10));
  // « Aucune », « — »… : pas de nombre affiché, donc pas d'unité à coller.
  const showSuffix = Boolean(suffix) && (isFocused || /\d\s*$/.test(displayValue));

  const commit = () => {
    setIsFocused(false);
    let next = parseFloat(draft.replace(',', '.'));
    if (Number.isNaN(next)) {
      next = value;
    } else {
      if (isPercent) next /= 100;
      next = Math.max(min, max !== undefined ? Math.min(max, next) : next);
    }
    onChange(next);
  };

  const startEditing = () => {
    setIsFocused(true);
    setDraft(String(isPercent ? Math.round(value * 100) : value));
  };

  return (
    <div className="flex flex-col gap-2">
      <label id={labelId} htmlFor={numberId} className="field-label">
        {label}
      </label>

      <div className="flex items-center gap-3">
        <input
          id={rangeId}
          type="range"
          aria-labelledby={labelId}
          min={min}
          max={effectiveMax}
          step={step}
          value={Math.min(value, effectiveMax)}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="min-w-0 flex-1"
        />

        {/* Groupe de saisie en flex : l'unité occupe une vraie colonne, elle
            ne peut donc pas passer sous les chiffres. En position absolue avec
            un padding-right fixe, « 37 » et « kWc » se chevauchaient dès que
            la valeur dépassait deux caractères.
            `size={1}` est indispensable : sans lui l'input garde sa largeur
            intrinsèque de 20 caractères comme base flex, et c'est l'unité qui
            se fait comprimer. */}
        <div className="flex w-[124px] flex-none items-center gap-1 rounded-control border border-line bg-surface pr-2.5 transition-shadow focus-within:border-teal focus-within:shadow-focus">
          <input
            id={numberId}
            type="text"
            size={1}
            inputMode="decimal"
            aria-labelledby={labelId}
            value={isFocused ? draft : displayValue}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={startEditing}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            className="num w-full min-w-0 flex-1 shrink rounded-control bg-transparent py-1.5 pl-2.5 text-[13px] font-bold text-ink outline-none"
          />
          {showSuffix && (
            <span
              aria-hidden="true"
              className="flex-none whitespace-nowrap text-[13px] font-semibold text-muted"
            >
              {suffix}
            </span>
          )}
        </div>
      </div>

      {hint && <p className="text-xs leading-snug text-muted">{hint}</p>}
    </div>
  );
}
