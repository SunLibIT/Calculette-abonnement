interface KpiTileProps {
  /** Élément rendu : icône Lucide ou pictogramme animé maison. */
  icon: React.ReactNode;
  label: string;
  value: string;
  /** Micro-légende de contexte sous le chiffre (charte §4). */
  sub?: string;
  /** Encre du chiffre. Par défaut l'encre principale. */
  valueColor?: string;
}

/**
 * Tuile de KPI compacte, pensée pour une rangée en tête de colonne.
 *
 * Un chiffre par tuile, une micro-légende dessous. Volontairement sans carte
 * complète : la rangée entière tient sur une bande, là où une carte par
 * valeur consommait toute la largeur pour une seule donnée.
 */
export function KpiTile({ icon, label, value, sub, valueColor }: KpiTileProps) {
  return (
    <div className="min-w-0 rounded-control border border-line bg-canvas px-3.5 py-3">
      <div className="flex items-center gap-1.5">
        <span aria-hidden="true" className="flex h-4 w-4 flex-none items-center justify-center text-muted">
          {icon}
        </span>
        <h3 className="truncate text-[11px] font-bold uppercase tracking-[0.05em] text-muted">{label}</h3>
      </div>
      <p
        className="mt-1.5 truncate text-xl font-extrabold tracking-[-0.02em]"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 truncate text-[11px] text-muted">{sub}</p>}
    </div>
  );
}
