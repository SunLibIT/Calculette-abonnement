import { Printer } from 'lucide-react';

interface PrintButtonProps {
  onClick: () => void;
}

/**
 * Bouton SECONDAIRE : plat, contour, encre neutre (charte §2).
 *
 * Imprimer n'est pas l'action principale de l'outil — l'action principale est
 * de régler les paramètres et de lire le résultat. Le dégradé de marque, qui
 * est réservé à l'action principale, n'a donc pas sa place ici : en plein vert
 * il devenait l'élément le plus saturé de l'écran pour une action de service.
 */
export function PrintButton({ onClick }: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-control border border-line bg-surface px-3.5 py-2 text-[13px] font-semibold text-muted transition-colors hover:border-teal-ink hover:text-teal-ink"
    >
      <Printer size={16} strokeWidth={2} aria-hidden="true" />
      Imprimer
    </button>
  );
}
