import type { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/** Carte légère : fond blanc, filet, arrondi 14px (charte §2 « Cartes »). */
export function Card({ children, className = '' }: CardProps) {
  return <section className={`card ${className}`}>{children}</section>;
}

interface CardHeadProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Rend l'en-tête cliquable pour replier la carte (divulgation progressive). */
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
  /** Contrôle secondaire aligné à droite. Jamais imbriqué dans le bouton de repli. */
  right?: React.ReactNode;
}

export function CardHead({
  icon: Icon,
  title,
  subtitle,
  collapsible = false,
  open = true,
  onToggle,
  right,
}: CardHeadProps) {
  const identity = (
    <>
      {/* Pastille d'icône : carré arrondi, fond teal doux, trait teal foncé. */}
      <span
        aria-hidden="true"
        className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-teal-soft text-teal-ink"
      >
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <h2 className="text-[15px] font-bold leading-tight tracking-[-0.01em] text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs font-medium leading-tight text-muted">{subtitle}</p>}
      </div>
    </>
  );

  if (!collapsible) {
    return (
      <div className="card-head flex-wrap">
        {identity}
        {right}
      </div>
    );
  }

  // `right` reste HORS du bouton de repli : imbriquer un contrôle interactif
  // dans un <button> produit du HTML invalide et casse la navigation clavier.
  return (
    <div className="flex items-center border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="card-head min-w-0 flex-1 rounded-t-card border-b-0 transition-colors hover:bg-canvas"
      >
        {identity}
        <ChevronDown
          size={18}
          strokeWidth={2}
          aria-hidden="true"
          className={`flex-none text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {right && <div className="flex-none pr-5">{right}</div>}
    </div>
  );
}
