import type { ChartMode, Results, SimulatorParams } from '../types/simulator';
import { formatCurrency, formatNumber, formatSavings } from '../utils/calculations';
import { REFERENCE, SERIES, type SeriesKey } from '../theme';
import { ChartComponent } from './Chart';

interface PrintReportProps {
  params: SimulatorParams;
  results: Results;
  chartMode: ChartMode;
  visible: { pv: boolean; bv: boolean; bp: boolean };
  tarifReventeDisplay: string;
  generatedAt: Date;
}

/**
 * Document imprimé — écrit à part de l'interface, et non dérivé d'elle.
 *
 * Imprimer l'application revenait à imprimer ses COMMANDES : rails de
 * curseurs, poignées, boutons de sélection, chips cliquables. Sur papier ces
 * objets ne veulent rien dire et mangeaient la moitié de la page avant le
 * premier résultat. Un rapport a besoin de l'inverse : les valeurs retenues,
 * en tableau, puis la synthèse, puis la projection.
 *
 * Il est monté en permanence mais hors écran (et non en `display:none`) :
 * Chart.js ne sait pas se dimensionner dans un conteneur masqué, et le
 * graphique sortirait vide ou à une taille périmée.
 */
export function PrintReport({
  params,
  results,
  chartMode,
  visible,
  tarifReventeDisplay,
  generatedAt,
}: PrintReportProps) {
  const {
    clientType,
    contractType,
    duration,
    batteryDuration,
    installPrice,
    batteryPrice,
    batteryCapacity,
    peakPower,
    initialPayment,
    annualConsumption,
    pvgisProduction,
    avgKwhPrice,
    autoConsoRate,
    batteryAutoConsoBoost,
  } = params;

  const hasBattery = batteryPrice > 0;
  const isParticulier = clientType === 'Particulier';
  const tvaLabel = isParticulier ? 'TTC' : 'HT';

  const showPV = visible.pv;
  const showBV = results.isVirtualBatteryEligible && visible.bv;
  const showBP = hasBattery && visible.bp;

  const plotted: SeriesKey[] = [
    ...(showPV ? (['pv'] as const) : []),
    ...(showBV ? (['bv'] as const) : []),
    ...(showBP ? (['bp'] as const) : []),
  ];

  const scenarioOf = (key: SeriesKey) =>
    key === 'pv' ? results.scenarioPV : key === 'bv' ? results.scenarioBV : results.scenarioBP;
  const breakdownOf = (key: SeriesKey) =>
    key === 'pv' ? results.breakdownPV : key === 'bv' ? results.breakdownBV : results.breakdownBP;

  const primary = plotted[0] ?? null;
  const primaryScenario = primary ? scenarioOf(primary) : null;

  const modeLabel =
    chartMode === 'comparaison'
      ? 'coût cumulé, avec et sans photovoltaïque'
      : chartMode === 'cumul'
        ? 'économies cumulées'
        : 'économies annuelles';

  const date = generatedAt.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="pr-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );

  return (
    <div className="pr" aria-hidden="true">
      <header className="pr-head">
        <img src="/sunlib_full_couleur.svg" alt="" />
        <div>
          <div className="pr-title">Simulation d'abonnement</div>
          <div className="pr-sub">
            {isParticulier ? 'Particulier' : 'Professionnel'} · contrat {contractType.toLowerCase()} ·{' '}
            {duration} ans
          </div>
        </div>
        <div className="pr-date">
          Établie le {date}
          <br />
          Montants en {tvaLabel}
        </div>
      </header>

      {results.outOfRange && (
        <p className="pr-alert">
          Prix hors tarif SunLib pour cette puissance : aucun abonnement ne peut être calculé.
        </p>
      )}

      <section className="pr-section">
        <h2 className="pr-h2">Synthèse</h2>
        <div className="pr-kpis">
          <div className="pr-kpi">
            <div className="pr-kpi-l">Abonnement PV</div>
            <div className="pr-kpi-v">
              {results.outOfRange || !results.subscriptionPV
                ? '—'
                : `${formatCurrency(results.subscriptionPV.monthly)}/mois`}
            </div>
            {isParticulier && results.subscriptionPV && !results.outOfRange && (
              <div className="pr-kpi-s">{formatCurrency(results.subscriptionPV.monthlyHT)} HT</div>
            )}
          </div>

          {hasBattery && (
            <div className="pr-kpi">
              <div className="pr-kpi-l">Abonnement batterie</div>
              <div className="pr-kpi-v">
                {results.subscriptionBattery
                  ? `${formatCurrency(results.subscriptionBattery.monthly)}/mois`
                  : '—'}
              </div>
              {isParticulier && results.subscriptionBattery && (
                <div className="pr-kpi-s">
                  {formatCurrency(results.subscriptionBattery.monthlyHT)} HT
                </div>
              )}
            </div>
          )}

          <div className="pr-kpi">
            <div className="pr-kpi-l">Coût total du contrat</div>
            <div className="pr-kpi-v">{formatNumber(results.totalContractCost)} €</div>
            <div className="pr-kpi-s">Abonnements versés sur {duration} ans</div>
          </div>

          <div className="pr-kpi">
            <div className="pr-kpi-l">Année de bascule</div>
            <div className="pr-kpi-v">
              {primaryScenario?.switchYear ? `Année ${primaryScenario.switchYear}` : 'Au-delà de 25 ans'}
            </div>
            <div className="pr-kpi-s">{primary ? SERIES[primary].label : 'Aucun scénario retenu'}</div>
          </div>
        </div>
      </section>

      <section className="pr-section">
        <h2 className="pr-h2">Paramètres de la simulation</h2>
        <dl className="pr-grid2">
          <Row label="Type de client" value={isParticulier ? 'Particulier' : 'Entreprise'} />
          <Row label="Type de contrat" value={contractType} />
          <Row label="Prix installation PV (HT)" value={`${formatNumber(installPrice)} €`} />
          <Row label="Puissance crête" value={`${peakPower} kWc`} />
          <Row
            label="Versement initial"
            value={initialPayment > 0 ? `${formatNumber(initialPayment)} € ${tvaLabel}` : 'Aucun'}
          />
          <Row label="Durée abonnement PV" value={`${duration} ans`} />
          {hasBattery && (
            <>
              <Row label="Prix batterie physique (HT)" value={`${formatNumber(batteryPrice)} €`} />
              <Row
                label="Capacité batterie"
                value={`${batteryCapacity.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} kWh`}
              />
              <Row label="Durée abonnement batterie" value={`${batteryDuration} ans`} />
            </>
          )}
          <Row label="Consommation annuelle" value={`${formatNumber(annualConsumption)} kWh`} />
          <Row label="Productible PVGIS par kWc" value={`${formatNumber(pvgisProduction)} kWh`} />
          <Row
            label="Prix moyen du kWh client"
            value={`${avgKwhPrice.toFixed(3).replace('.', ',')} €`}
          />
          <Row label="Autoconsommation directe" value={`${Math.round(autoConsoRate * 100)} %`} />
          {hasBattery && (
            <Row
              label="Gain autoconso batterie"
              value={`+${Math.round(batteryAutoConsoBoost * 100)} %`}
            />
          )}
        </dl>
      </section>

      {!results.outOfRange && plotted.length > 0 && (
        <section className="pr-section">
          <h2 className="pr-h2">Projection sur 25 ans — {modeLabel}</h2>
          <ChartComponent
            mode={chartMode}
            duration={duration}
            scenarioBV={results.scenarioBV}
            scenarioPV={results.scenarioPV}
            scenarioBP={results.scenarioBP}
            referenceCumulative={results.referenceCumulative}
            hasBattery={hasBattery}
            visibleDatasets={{ pv: showPV, bv: showBV, bp: showBP }}
            heightClass="h-[250px]"
          />
          {/* Légende imprimée : à l'écran ce rôle est tenu par des chips
              cliquables, qui n'ont aucun sens une fois sur le papier. */}
          <div className="pr-legend">
            {chartMode === 'comparaison' && (
              <span>
                <i className="pr-key pr-key-dash" style={{ borderColor: REFERENCE.line }} />
                {REFERENCE.label}
              </span>
            )}
            {plotted.map((key) => (
              <span key={key}>
                <i className="pr-key" style={{ borderColor: SERIES[key].fill }} />
                {chartMode === 'comparaison' ? `Avec SunLib — ${SERIES[key].label}` : SERIES[key].label}
              </span>
            ))}
          </div>
        </section>
      )}

      {!results.outOfRange && plotted.length > 0 && (
        <section className="pr-section">
          <h2 className="pr-h2">Décomposition de la première année</h2>
          <div className="pr-cols" style={{ gridTemplateColumns: `repeat(${plotted.length}, 1fr)` }}>
            {plotted.map((key) => {
              const b = breakdownOf(key);
              const isBP = key === 'bp';
              return (
                <div key={key} className="pr-block">
                  <div className="pr-block-t" style={{ color: SERIES[key].ink }}>
                    {SERIES[key].label}
                  </div>
                  <dl>
                    <Row
                      label={`Autoconso directe (${Math.round(autoConsoRate * 100)} %)`}
                      value={formatSavings(b.directConsumption)}
                    />
                    {isBP && b.batteryBoostConsumption !== undefined && b.batteryBoostConsumption > 0 && (
                      <Row
                        label={`Gain batterie (+${Math.round(batteryAutoConsoBoost * 100)} %)`}
                        value={formatSavings(b.batteryBoostConsumption)}
                      />
                    )}
                    <Row
                      label={
                        key === 'bv'
                          ? 'Énergie BV à 0,10 €/kWh'
                          : `Revente surplus (${tarifReventeDisplay} €/kWh)`
                      }
                      value={formatSavings(b.virtualBatteryOrResale)}
                    />
                    {isBP && <Row label="Abonnement batterie" value={formatSavings(b.batteryCost)} />}
                    <Row label="Abonnement PV" value={formatSavings(b.subscriptionCost)} />
                  </dl>
                  <div className="pr-total">
                    <span>Net année 1</span>
                    <span>{formatSavings(b.netSavings)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <footer className="pr-foot">
        Simulation indicative, sans valeur contractuelle. Abonnement revalorisé de 1,5 % par an ·
        revente du surplus à {tarifReventeDisplay} €/kWh
        {showBV && ' · batterie virtuelle : énergie stockée rachetée à 0,10 €/kWh hors frais annexes'}.
      </footer>
    </div>
  );
}
