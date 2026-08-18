import { Check } from 'lucide-react';

interface FilterChipProps {
  label: string;
  /** Couleur d'aplat de la série représentée (puce de gauche). */
  color: string;
  active: boolean;
  onToggle: () => void;
}

/**
 * Chip de multi-sélection (charte §2) : plusieurs séries peuvent être
 * affichées en même temps, donc chips et non segmented control.
 *
 * Double codage (§3) : l'état sélectionné se lit à la coche ET à la couleur —
 * une chip désactivée n'est pas seulement pâlie.
 */
export function FilterChip({ label, color, active, onToggle }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
        active
          ? 'border-line bg-surface text-ink'
          : 'border-line bg-canvas text-muted hover:text-ink'
      }`}
    >
      <span
        aria-hidden="true"
        className="grid h-4 w-4 flex-none place-items-center rounded-full text-white"
        style={{ backgroundColor: active ? color : 'transparent', boxShadow: active ? 'none' : `inset 0 0 0 1.5px ${color}` }}
      >
        {active && <Check size={11} strokeWidth={3} />}
      </span>
      {label}
    </button>
  );
}
