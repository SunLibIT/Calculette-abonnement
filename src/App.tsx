import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  Euro,
  Layers,
  Receipt,
  Settings,
  Sun,
  User,
} from 'lucide-react';
import type {
  ClientType,
  ContractType,
  Duration,
  BatteryDuration,
  ChartMode,
  SimulatorParams,
} from './types/simulator';
import { calculateResults, formatCurrency, formatNumber } from './utils/calculations';
import { findLevers } from './utils/levers';
import { SERIES, REFERENCE, type SeriesKey } from './theme';
import { Card, CardHead } from './components/Card';
import { KpiTile } from './components/KpiTile';
import { SpinningSun, ChargingBattery } from './components/AnimatedPictos';
import { Callout } from './components/Callout';
import { SegmentedControl } from './components/SegmentedControl';
import { FilterChip } from './components/FilterChip';
import { Slider } from './components/Slider';
import { MetricCard } from './components/MetricCard';
import { ChartComponent } from './components/Chart';
import { DecompositionCard } from './components/DecompositionCard';
import { PrintButton } from './components/PrintButton';
import { PrintReport } from './components/PrintReport';

function App() {
  const [clientType, setClientType] = useState<ClientType>('Particulier');
  const [contractType, setContractType] = useState<ContractType>('Variable');
  const [duration, setDuration] = useState<Duration>(25);
  const [batteryDuration, setBatteryDuration] = useState<BatteryDuration>(10);
  const [installPrice, setInstallPrice] = useState(6290);
  const [batteryPrice, setBatteryPrice] = useState(0);
  const [batteryCapacity, setBatteryCapacity] = useState(5);
  const [peakPower, setPeakPower] = useState(3);
  const [initialPayment, setInitialPayment] = useState(0);
  const [annualConsumption, setAnnualConsumption] = useState(10000);
  const [pvgisProduction, setPvgisProduction] = useState(1033);
  const [avgKwhPrice, setAvgKwhPrice] = useState(0.194);
  const [autoConsoRate, setAutoConsoRate] = useState(0.4);
  const [batteryAutoConsoBoost, setBatteryAutoConsoBoost] = useState(0.1);
  // La comparaison est la vue par défaut : c'est celle qui répond à la
  // question du client (« par rapport à quoi ? »).
  const [chartMode, setChartMode] = useState<ChartMode>('comparaison');
  const [visibleDatasets, setVisibleDatasets] = useState({ bv: false, pv: true, bp: true });
  const [isPvSectionOpen, setIsPvSectionOpen] = useState(true);
  const [isProfitSectionOpen, setIsProfitSectionOpen] = useState(true);
  // Date figée au montage : le document imprimé porte une date d'établissement
  // stable, elle ne doit pas changer à chaque rendu.
  const [generatedAt] = useState(() => new Date());

  useEffect(() => {
    const minPayment = clientType === 'Particulier' ? 500 : 5000;
    if (initialPayment > 0 && initialPayment < minPayment) {
      setInitialPayment(minPayment);
    }
  }, [clientType, initialPayment]);

  const toggleDataset = (dataset: 'bv' | 'pv' | 'bp') => {
    setVisibleDatasets((prev) => ({ ...prev, [dataset]: !prev[dataset] }));
  };

  // Les paramètres sont mémoïsés sur leurs primitives : un objet recréé à
  // chaque rendu invaliderait toutes les mémoïsations en aval.
  const params = useMemo<SimulatorParams>(
    () => ({
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
    }),
    [
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
    ]
  );

  const results = useMemo(() => calculateResults(params), [params]);

  const hasBattery = batteryPrice > 0;
  const tvaLabel = clientType === 'Particulier' ? 'TTC' : 'HT';
  const showHT = clientType === 'Particulier';
  const showVirtualBattery = results.isVirtualBatteryEligible;

  const tarifRevente = peakPower < 9 ? 0.04 : peakPower <= 100 ? 0.0536 : 0.04;
  const tarifReventeDisplay = tarifRevente.toFixed(4).replace('.', ',');

  const showBV = showVirtualBattery && visibleDatasets.bv;
  const showPV = visibleDatasets.pv;
  const showBP = hasBattery && visibleDatasets.bp;
  const anySeriesVisible = showBV || showPV || showBP;
  const visibleCount = Number(showBV) + Number(showPV) + Number(showBP);

  // Grilles de résultats : 1 à 3 colonnes selon le nombre de séries affichées.
  const resultGrid =
    visibleCount >= 3 ? 'md:grid-cols-3' : visibleCount === 2 ? 'md:grid-cols-2' : '';

  const autoConsoLabel = `Autoconso directe (${Math.round(autoConsoRate * 100)} %)`;
  const reventeLabel = `Revente surplus (${tarifReventeDisplay} €/kWh)`;

  // Scénario de tête : celui dont les KPI de synthèse parlent. On prend le
  // premier affiché, dans l'ordre de lecture des chips.
  const primaryKey: SeriesKey | null = showPV ? 'pv' : showBV ? 'bv' : showBP ? 'bp' : null;
  const primaryScenario =
    primaryKey === 'pv'
      ? results.scenarioPV
      : primaryKey === 'bv'
        ? results.scenarioBV
        : primaryKey === 'bp'
          ? results.scenarioBP
          : null;

  // Leviers : uniquement quand aucun scénario affiché ne bascule — inutile de
  // rejouer des simulations si le client y gagne déjà.
  const noneSwitches =
    !results.outOfRange &&
    primaryKey !== null &&
    [showPV && results.scenarioPV, showBV && results.scenarioBV, showBP && results.scenarioBP]
      .filter(Boolean)
      .every((s) => (s as typeof results.scenarioPV).switchYear === null);

  const levers = useMemo(
    () => (noneSwitches && primaryKey ? findLevers(params, primaryKey) : []),
    [noneSwitches, primaryKey, params]
  );

  return (
    <>
    <div className="screen-only min-h-screen bg-canvas">
      {/* En-tête écran */}
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/sunlib_full_couleur.svg" alt="SunLib" className="h-8 w-auto flex-none" />
            <span aria-hidden="true" className="h-7 w-px flex-none bg-line" />
            <h1 className="truncate text-base font-bold tracking-[-0.01em] text-ink">
              Calculatrice d'abonnement
            </h1>
          </div>
          <PrintButton onClick={() => window.print()} />
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row">
        {/* ---------------- RAIL — paramètres ---------------- */}
        <aside className="w-full flex-none lg:w-[380px]">
          <div className="rail-scroll flex flex-col gap-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pb-2">
            <Card>
              <CardHead icon={User} title="Profil client & contrat" />
              <div className="card-body flex flex-col gap-4">
                <div>
                  <p className="field-label mb-2">Type de client</p>
                  <SegmentedControl
                    ariaLabel="Type de client"
                    value={clientType}
                    onChange={setClientType}
                    options={[
                      { label: 'Particulier', value: 'Particulier' },
                      { label: 'Entreprise', value: 'Pro' },
                    ]}
                  />
                  {/* Le régime de TVA n'est plus rappelé ici : il est porté
                      une seule fois, par le sous-titre de la carte Synthèse,
                      là où se trouvent les montants concernés. */}
                </div>
                <div>
                  <p className="field-label mb-2">Type de contrat</p>
                  <SegmentedControl
                    ariaLabel="Type de contrat"
                    value={contractType}
                    onChange={setContractType}
                    options={[
                      { label: 'Fixe', value: 'Fixe' },
                      { label: 'Variable', value: 'Variable' },
                    ]}
                  />
                </div>
              </div>
            </Card>

            <Card>
              <CardHead
                icon={Sun}
                title="Installation photovoltaïque"
                collapsible
                open={isPvSectionOpen}
                onToggle={() => setIsPvSectionOpen((v) => !v)}
              />
              {isPvSectionOpen && (
                <div className="card-body flex flex-col gap-4">
                  <Slider
                    label="Prix installation PV (HT)"
                    value={installPrice}
                    displayValue={formatNumber(installPrice)}
                    min={3000}
                    sliderMax={50000}
                    step={100}
                    onChange={setInstallPrice}
                    suffix="€"
                  />
                  <Slider
                    label="Puissance crête"
                    value={peakPower}
                    displayValue={String(peakPower)}
                    min={1}
                    sliderMax={100}
                    step={1}
                    onChange={setPeakPower}
                    suffix="kWc"
                  />
                  <Slider
                    label="Prix batterie physique (HT)"
                    value={batteryPrice}
                    displayValue={batteryPrice === 0 ? 'Aucune' : formatNumber(batteryPrice)}
                    min={0}
                    sliderMax={30000}
                    step={100}
                    onChange={setBatteryPrice}
                    suffix="€"
                    hint={batteryPrice === 0 ? 'Laisser à 0 pour simuler sans batterie physique.' : undefined}
                  />
                  {hasBattery && (
                    <Slider
                      label="Capacité batterie"
                      value={batteryCapacity}
                      // formatNumber arrondit à l'entier : 5,5 kWh s'afficherait « 6 ».
                      displayValue={batteryCapacity.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}
                      min={1}
                      sliderMax={30}
                      step={0.5}
                      onChange={setBatteryCapacity}
                      suffix="kWh"
                    />
                  )}
                  <Slider
                    label={`Versement initial (${tvaLabel})`}
                    value={initialPayment}
                    displayValue={formatNumber(initialPayment)}
                    min={0}
                    max={clientType === 'Particulier' ? 10000 : 50000}
                    step={100}
                    onChange={setInitialPayment}
                    suffix="€"
                    hint={`Minimum ${clientType === 'Particulier' ? '500' : '5 000'} € s'il est non nul.`}
                  />
                </div>
              )}
            </Card>

            <Card>
              <CardHead icon={CalendarDays} title="Durées d'abonnement" />
              <div className="card-body flex flex-col gap-4">
                <div>
                  <p className="field-label mb-2">Abonnement photovoltaïque</p>
                  <SegmentedControl
                    ariaLabel="Durée de l'abonnement photovoltaïque"
                    value={duration}
                    onChange={(v) => setDuration(v as Duration)}
                    options={[10, 15, 20, 25].map((d) => ({ label: `${d} ans`, value: d }))}
                  />
                </div>
                {hasBattery && (
                  <div>
                    <p className="field-label mb-2">Abonnement batterie</p>
                    <SegmentedControl
                      ariaLabel="Durée de l'abonnement batterie"
                      value={batteryDuration}
                      onChange={(v) => setBatteryDuration(v as BatteryDuration)}
                      options={[10, 15].map((d) => ({ label: `${d} ans`, value: d }))}
                    />
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <CardHead
                icon={Settings}
                title="Hypothèses de rentabilité"
                subtitle="Profil de consommation du client"
                collapsible
                open={isProfitSectionOpen}
                onToggle={() => setIsProfitSectionOpen((v) => !v)}
              />
              {isProfitSectionOpen && (
                <div className="card-body flex flex-col gap-4">
                  <Slider
                    label="Consommation annuelle"
                    value={annualConsumption}
                    displayValue={formatNumber(annualConsumption)}
                    min={2000}
                    max={200000}
                    step={1000}
                    onChange={setAnnualConsumption}
                    suffix="kWh"
                  />
                  <Slider
                    label="Productible PVGIS par kWc"
                    value={pvgisProduction}
                    displayValue={formatNumber(pvgisProduction)}
                    min={700}
                    max={1600}
                    step={10}
                    onChange={setPvgisProduction}
                    suffix="kWh"
                  />
                  <Slider
                    label="Prix moyen du kWh client"
                    value={avgKwhPrice}
                    displayValue={avgKwhPrice.toFixed(3).replace('.', ',')}
                    min={0.1}
                    max={0.4}
                    step={0.005}
                    onChange={setAvgKwhPrice}
                    suffix="€"
                  />
                  <Slider
                    label="Taux d'autoconsommation directe"
                    value={autoConsoRate}
                    displayValue={String(Math.round(autoConsoRate * 100))}
                    min={0.1}
                    max={1}
                    step={0.05}
                    onChange={setAutoConsoRate}
                    suffix="%"
                  />
                  {hasBattery && (
                    <Slider
                      label="Gain d'autoconso apporté par la batterie"
                      value={batteryAutoConsoBoost}
                      displayValue={`+${Math.round(batteryAutoConsoBoost * 100)}`}
                      min={0}
                      max={0.2}
                      step={0.01}
                      onChange={setBatteryAutoConsoBoost}
                      suffix="%"
                    />
                  )}
                </div>
              )}
            </Card>
          </div>
        </aside>

        {/* ---------------- COLONNE PRINCIPALE — résultats ---------------- */}
        <main className="flex min-w-0 flex-1 flex-col gap-4">
          {results.outOfRange && (
            <Callout tone="warning">
              Le prix HT dépasse le plafond autorisé pour cette puissance — hors tarif SunLib.
            </Callout>
          )}

          {/* Bande de synthèse : les chiffres qu'on cite au client, sur une
              seule bande plutôt qu'une carte pleine largeur par valeur. */}
          <Card>
            <CardHead
              icon={Euro}
              title="Synthèse"
              subtitle={`Montants ${tvaLabel}${showHT ? ' — TVA 20 % incluse' : ''}`}
            />
            <div
              className={`card-body grid grid-cols-2 gap-3 ${
                hasBattery ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
              }`}
            >
              <KpiTile
                icon={<SpinningSun size={16} />}
                label="Abonnement PV"
                value={
                  results.outOfRange
                    ? 'Hors tarif'
                    : results.subscriptionPV
                      ? `${formatCurrency(results.subscriptionPV.monthly)}/mois`
                      : '—'
                }
                sub={
                  showHT && results.subscriptionPV && !results.outOfRange
                    ? `${formatCurrency(results.subscriptionPV.monthlyHT)} HT`
                    : undefined
                }
              />
              {hasBattery && (
                <KpiTile
                  icon={<ChargingBattery size={16} />}
                  label="Abonnement batterie"
                  value={
                    results.subscriptionBattery
                      ? `${formatCurrency(results.subscriptionBattery.monthly)}/mois`
                      : '—'
                  }
                  sub={
                    showHT && results.subscriptionBattery
                      ? `${formatCurrency(results.subscriptionBattery.monthlyHT)} HT`
                      : undefined
                  }
                />
              )}
              <KpiTile
                icon={<Receipt size={14} strokeWidth={2} />}
                label="Coût total du contrat"
                value={`${formatNumber(results.totalContractCost)} €`}
                sub={`Abonnements versés sur ${duration} ans`}
              />
              <KpiTile
                icon={<CalendarClock size={14} strokeWidth={2} />}
                label="Année de bascule"
                value={
                  primaryScenario?.switchYear ? `Année ${primaryScenario.switchYear}` : 'Au-delà de 25 ans'
                }
                // Le cumul n'est plus repris ici : les cartes par scénario,
                // rétablies juste en dessous, le portent déjà.
                sub={primaryKey ? SERIES[primaryKey].label : 'Aucun scénario affiché'}
              />
            </div>
          </Card>

          <Card>
            <CardHead
              icon={BarChart3}
              title="Rentabilité client"
              subtitle={`Contrat de ${duration} ans · ${
                chartMode === 'comparaison'
                  ? 'coût cumulé avec et sans PV'
                  : chartMode === 'cumul'
                    ? 'économies cumulées'
                    : 'économies annuelles'
              } sur 25 ans`}
            />
            <div className="card-body flex flex-col gap-4">
              {visibleCount > 0 && (
                <div className={`grid grid-cols-1 gap-3 ${resultGrid}`}>
                  {showPV && (
                    <MetricCard
                      seriesKey="pv"
                      totalSavings={results.scenarioPV.totalSavings}
                      switchYear={results.scenarioPV.switchYear}
                      duration={duration}
                    />
                  )}
                  {showBV && (
                    <MetricCard
                      seriesKey="bv"
                      totalSavings={results.scenarioBV.totalSavings}
                      switchYear={results.scenarioBV.switchYear}
                      duration={duration}
                    />
                  )}
                  {showBP && (
                    <MetricCard
                      seriesKey="bp"
                      totalSavings={results.scenarioBP.totalSavings}
                      switchYear={results.scenarioBP.switchYear}
                      duration={duration}
                    />
                  )}
                </div>
              )}

              {/* Barre d'outils du graphique.
                  Les deux groupes font des choses différentes — choisir les
                  scénarios (multi-sélection → chips) et choisir la
                  représentation (choix unique → segmented control, charte §2).
                  Ils sont donc nommés et séparés, au lieu de flotter aux deux
                  extrémités d'une même ligne sans rien qui les distingue. */}
              <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 rounded-control border border-line bg-canvas p-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <FilterChip
                      label={SERIES.pv.label}
                      color={SERIES.pv.fill}
                      active={visibleDatasets.pv}
                      onToggle={() => toggleDataset('pv')}
                    />
                    {showVirtualBattery && (
                      <FilterChip
                        label={SERIES.bv.label}
                        color={SERIES.bv.fill}
                        active={visibleDatasets.bv}
                        onToggle={() => toggleDataset('bv')}
                      />
                    )}
                    {hasBattery && (
                      <FilterChip
                        label={SERIES.bp.label}
                        color={SERIES.bp.fill}
                        active={visibleDatasets.bp}
                        onToggle={() => toggleDataset('bp')}
                      />
                    )}

                    {/* La référence est tracée mais n'était identifiée nulle
                        part à l'écran : une courbe grise pointillée sans
                        légende. Elle n'est pas une chip — on ne la masque
                        pas, c'est le point de comparaison. */}
                    {chartMode === 'comparaison' && (
                      <span className="inline-flex items-center gap-2 pl-1 text-[13px] text-muted">
                        <span
                          aria-hidden="true"
                          className="h-0 w-5 flex-none border-t-2 border-dashed"
                          style={{ borderColor: REFERENCE.line }}
                        />
                        {REFERENCE.label}
                      </span>
                    )}

                    {/* La teinte atténuée n'existe que sur les barres du mode
                        annuel : en lignes, la mention ne décrirait rien. */}
                    {chartMode === 'annuel' && duration < 25 && (
                      <span className="inline-flex items-center gap-2 pl-1 text-[13px] text-muted">
                        <span aria-hidden="true" className="h-3 w-3 flex-none rounded-sm bg-line" />
                        Teinte pâle : après la fin du contrat
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full flex-none sm:w-auto">
                  {/* Largeur dictée par le contenu : une largeur fixe débordait
                      dès qu'on est passé de deux à trois options, les libellés
                      étant en `whitespace-nowrap`. */}
                  <SegmentedControl
                    className="sm:w-auto"
                    ariaLabel="Mode d'affichage du graphique"
                    value={chartMode}
                    onChange={setChartMode}
                    options={[
                      { label: 'Comparaison', value: 'comparaison' },
                      { label: 'Cumulées', value: 'cumul' },
                      { label: 'Annuelles', value: 'annuel' },
                    ]}
                  />
                </div>
              </div>

              {results.outOfRange ? (
                <p className="rounded-control border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
                  Aucun abonnement ne peut être calculé pour cette configuration : la projection
                  n'est pas disponible tant que le prix reste hors tarif.
                </p>
              ) : anySeriesVisible ? (
                <ChartComponent
                  mode={chartMode}
                  duration={duration}
                  scenarioBV={results.scenarioBV}
                  scenarioPV={results.scenarioPV}
                  scenarioBP={results.scenarioBP}
                  referenceCumulative={results.referenceCumulative}
                  hasBattery={hasBattery}
                  visibleDatasets={{ ...visibleDatasets, bv: showBV }}
                />
              ) : (
                <p className="rounded-control border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
                  Sélectionnez au moins un scénario ci-dessus pour afficher la projection.
                </p>
              )}

              {/* Avertissement actionnable : on propose un levier chiffré
                  plutôt que de constater l'absence de bascule. */}
              {levers.length > 0 && (
                <Callout>
                  <span className="font-semibold">
                    Ce scénario ne bascule pas sur 25 ans.
                  </span>{' '}
                  Leviers possibles :{' '}
                  {levers.map((lever, i) => (
                    <span key={lever.action}>
                      {i > 0 && ', ou '}
                      {lever.action} <span className="whitespace-nowrap">({lever.outcome})</span>
                    </span>
                  ))}
                  .
                </Callout>
              )}
              {noneSwitches && levers.length === 0 && (
                <Callout tone="warning">
                  Ce scénario ne bascule pas sur 25 ans, et ni la durée du contrat ni le taux
                  d'autoconsommation ne suffisent à l'inverser avec ces paramètres.
                </Callout>
              )}

              {duration < 25 && (
                <Callout>
                  Contrat de {duration} ans — au-delà de l'an {duration}, l'abonnement tombe à zéro :
                  autoconsommation pure, les économies s'accélèrent.
                </Callout>
              )}
            </div>
          </Card>

          {anySeriesVisible && (
            <Card>
              <CardHead icon={Layers} title="Décomposition des économies" subtitle="Première année" />
              <div className={`card-body grid grid-cols-1 gap-3 ${resultGrid}`}>
                {showPV && (
                  <DecompositionCard
                    seriesKey="pv"
                    breakdown={results.breakdownPV}
                    labels={{ direct: autoConsoLabel, secondary: reventeLabel }}
                  />
                )}
                {showBV && (
                  <DecompositionCard
                    seriesKey="bv"
                    breakdown={results.breakdownBV}
                    labels={{ direct: autoConsoLabel, secondary: 'Énergie BV à 0,10 €/kWh' }}
                  />
                )}
                {showBP && (
                  <DecompositionCard
                    seriesKey="bp"
                    breakdown={results.breakdownBP}
                    labels={{
                      direct: autoConsoLabel,
                      secondary: reventeLabel,
                      battery: true,
                      batteryBoostPercent: `+${Math.round(batteryAutoConsoBoost * 100)} %`,
                    }}
                  />
                )}
              </div>
            </Card>
          )}

          <p className="px-1 text-center text-xs leading-relaxed text-muted">
            Abonnement +1,5 %/an · revente du surplus à {tarifReventeDisplay} €/kWh
            {showBV && ' · batterie virtuelle : énergie stockée rachetée à 0,10 €/kWh hors frais annexes'}
            {(showPV || showBP) && " · prime à l'autoconsommation intégrée en année 2"}
          </p>
        </main>
      </div>
    </div>

    {/* Document imprimé — monté en permanence, hors écran (voir PrintReport). */}
    <PrintReport
      params={params}
      results={results}
      chartMode={chartMode}
      visible={visibleDatasets}
      tarifReventeDisplay={tarifReventeDisplay}
      generatedAt={generatedAt}
    />
    </>
  );
}

export default App;
