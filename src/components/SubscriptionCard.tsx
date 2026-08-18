import type { LucideIcon } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';
import type { Subscription } from '../types/simulator';
import { formatCurrency } from '../utils/calculations';

interface SubscriptionCardProps {
  icon: LucideIcon;
  title: string;
  subscription: Subscription | null;
  /** « TTC » pour un particulier, « HT » pour un professionnel. */
  tvaLabel: string;
  /** Afficher la contrepartie HT sous le montant (cas particulier). */
  showHT: boolean;
  outOfRange?: boolean;
}

/**
 * Mensualité d'un abonnement : une métrique d'ancrage, le régime de TVA en
 * pastille, et le HT en ligne secondaire. Le cas « hors tarif » est un vrai
 * problème → ambre + icône (le rouge reste pour l'erreur bloquante).
 */
export function SubscriptionCard({
  icon: Icon,
  title,
  subscription,
  tvaLabel,
  showHT,
  outOfRange = false,
}: SubscriptionCardProps) {
  return (
    <div className="rounded-control border border-line bg-canvas p-4">
      <div className="flex items-center gap-2">
        <Icon size={16} strokeWidth={2} aria-hidden="true" className="flex-none text-teal-ink" />
        <h3 className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-[0.05em] text-muted">
          {title}
        </h3>
        <span className="flex-none rounded-full bg-teal-soft px-2 py-0.5 text-[11px] font-bold text-teal-ink">
          {tvaLabel}
        </span>
      </div>

      {outOfRange ? (
        <p className="mt-2 flex items-center gap-1.5 text-lg font-extrabold text-amber">
          <AlertTriangle size={18} strokeWidth={2} aria-hidden="true" />
          Hors tarif
        </p>
      ) : subscription ? (
        <>
          <p className="mt-2 text-2xl font-extrabold tracking-[-0.02em] text-ink">
            {formatCurrency(subscription.monthly)}
            <span className="text-base font-bold text-muted"> /mois</span>
          </p>
          {showHT && (
            <p className="mt-0.5 text-xs text-muted">{formatCurrency(subscription.monthlyHT)} HT par mois</p>
          )}
        </>
      ) : (
        <p className="mt-2 text-2xl font-extrabold text-muted">—</p>
      )}
    </div>
  );
}
