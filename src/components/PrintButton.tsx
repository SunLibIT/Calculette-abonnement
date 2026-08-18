import { Printer } from 'lucide-react';

interface PrintButtonProps {
  onClick: () => void;
}

/**
 * Action principale de la page → seul élément portant le dégradé de marque
 * (charte : « réservé au bouton primaire, jamais en décoration »).
 *
 * Pas de flèche « → » : l'icône imprimante porte déjà le sens de l'action, la
 * micro-interaction flèche est une convention de CTA de navigation.
 */
export function PrintButton({ onClick }: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-primary inline-flex items-center gap-2 rounded-control bg-brand px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
    >
      <Printer size={18} strokeWidth={2} aria-hidden="true" />
      Imprimer
    </button>
  );
}
