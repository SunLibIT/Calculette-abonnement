import { Info, AlertTriangle } from 'lucide-react';

type CalloutTone = 'info' | 'warning';

interface CalloutProps {
  tone?: CalloutTone;
  children: React.ReactNode;
  className?: string;
}

/**
 * Encadré d'aide (bleu) ou bannière d'alerte (ambre) — charte §2 « Cartes &
 * encadrés ». Toujours doublé d'une icône : le sens n'est jamais porté par la
 * couleur seule (§3).
 */
export function Callout({ tone = 'info', children, className = '' }: CalloutProps) {
  const Icon = tone === 'warning' ? AlertTriangle : Info;
  const tones: Record<CalloutTone, string> = {
    info: 'bg-info-soft border-info-line text-info',
    warning: 'bg-amber-soft border-amber-line text-amber',
  };

  return (
    <div
      role={tone === 'warning' ? 'alert' : undefined}
      className={`flex items-start gap-2.5 rounded-control border px-3.5 py-2.5 text-[13px] leading-snug ${tones[tone]} ${className}`}
    >
      <Icon size={16} strokeWidth={2} aria-hidden="true" className="mt-0.5 flex-none" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
