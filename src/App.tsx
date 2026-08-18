import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BatteryCharging,
  CalendarDays,
  Euro,
  Layers,
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
import { calculateResults, formatNumber } from './utils/calculations';
import { SERIES } from './theme';
import { Card, CardHead } from './components/Card';
import { Callout } from './components/Callout';
import { SegmentedControl } from './components/SegmentedControl';
import { FilterChip } from './components/FilterChip';
import { Slider } from './components/Slider';
import { SubscriptionCard } from './components/SubscriptionCard';
import { MetricCard } from './components/MetricCard';
import { ChartComponent } from './components/Chart';
import { DecompositionCard } from './components/DecompositionCard';
import { PrintButton } from './components/PrintButton';

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
  const [chartMode, setChartMode] = useState<ChartMode>('cumul');
  const [visibleDatasets, setVisibleDatasets] = useState({ bv: false, pv: true, bp: true });
  const [isPvSectionOpen, setIsPvSectionOpen] = useState(true);
  const [isProfitSectionOpen, setIsProfitSectionOpen] = useState(true);

  useEffect(() => {
    const minPayment = clientType === 'Particulier' ? 500 : 5000;
    if (initialPayment > 0 && initialPayment < minPayment) {
      setInitialPayment(minPayment);
    }
  }, [clientType, initialPayment]);

  const toggleDataset = (dataset: 'bv' | 'pv' | 'bp') => {
    setVisibleDatasets((prev) => ({ ...prev, [dataset]: !prev[dataset] }));
  };

  // Les paramètres sont construits DANS le useMemo : un objet recréé à chaque
  // rendu invaliderait la mémoïsation à chaque fois.
  const results = useMemo(() => {
    const params: SimulatorParams = {
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
    };
    return calculateResults(params);
  }, [
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
  ]);

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
    visibleCount >= 3 ? 'md:grid-cols-3 print-grid-3' : visibleCount === 2 ? 'md:grid-cols-2 print-grid-2' : '';

  const autoConsoLabel = `Autoconso directe (${Math.round(autoConsoRate * 100)} %)`;
  const reventeLabel = `Revente surplus (${tarifReventeDisplay} €/kWh)`;

  return (
    <div className="min-h-screen bg-canvas">
      {/* En-tête écran */}
      <header className="no-print border-b border-line bg-surface">
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

      {/* En-tête imprimé (masqué à l'écran) */}
      <div className="print-header hidden">
        <img src="/sunlib_full_couleur.svg" alt="SunLib" />
        <div>
          <strong>Calculatrice d'abonnement</strong>
          <div style={{ fontSize: '8pt', color: '#5B6472' }}>
            Simulation {clientType === 'Particulier' ? 'particulier' : 'professionnel'} · contrat{' '}
            {contractType.toLowerCase()} · {duration} ans
          </div>
        </div>
      </div>

      <div className="app-shell mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row">
        {/* ---------------- RAIL — paramètres ---------------- */}
        <aside className="app-rail w-full flex-none lg:w-[380px]">
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
                  <p className="mt-2 text-xs text-muted">
                    {clientType === 'Particulier' ? 'Prix affichés TTC (TVA 20 %)' : 'Prix affichés HT'}
                  </p>
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
        <main className="app-main flex min-w-0 flex-1 flex-col gap-4">
          {results.outOfRange && (
            <Callout tone="warning">
              Le prix HT dépasse le plafond autorisé pour cette puissance — hors tarif SunLib.
            </Callout>
          )}

          <Card>
            <CardHead icon={Euro} title="Abonnements calculés" subtitle={`Mensualités ${tvaLabel}`} />
            <div className={`card-body grid grid-cols-1 gap-3 ${hasBattery ? 'md:grid-cols-2 print-grid-2' : ''}`}>
              <SubscriptionCard
                icon={Sun}
                title="Abonnement PV"
                subscription={results.subscriptionPV}
                tvaLabel={tvaLabel}
                showHT={showHT}
                outOfRange={results.outOfRange}
              />
              {hasBattery && (
                <SubscriptionCard
                  icon={BatteryCharging}
                  title="Abonnement batterie physique"
                  subscription={results.subscriptionBattery}
                  tvaLabel={tvaLabel}
                  showHT={showHT}
                />
              )}
            </div>
          </Card>

          <Card>
            <CardHead
              icon={BarChart3}
              title="Rentabilité client"
              // Le mode est rappelé ici car la bascule est masquée à l'impression.
              subtitle={`Contrat de ${duration} ans · économies ${
                chartMode === 'cumul' ? 'cumulées' : 'annuelles'
              } sur 25 ans`}
            />
            <div className="card-body flex flex-col gap-4">
              {visibleCount > 0 && (
                <div className={`grid grid-cols-1 gap-3 ${resultGrid}`}>
                  {showPV && (
                    <MetricCard
                      seriesKey="pv"
                      totalSavings={results.scenarioPV.totalSavings}
                      breakEvenYear={results.scenarioPV.breakEvenYear}
                      duration={duration}
                    />
                  )}
                  {showBV && (
                    <MetricCard
                      seriesKey="bv"
                      totalSavings={results.scenarioBV.totalSavings}
                      breakEvenYear={results.scenarioBV.breakEvenYear}
                      duration={duration}
                    />
                  )}
                  {showBP && (
                    <MetricCard
                      seriesKey="bp"
                      totalSavings={results.scenarioBP.totalSavings}
                      breakEvenYear={results.scenarioBP.breakEvenYear}
                      duration={duration}
                    />
                  )}
                </div>
              )}

              {/* Scénarios = multi-sélection → chips ; mode d'affichage = choix
                  unique → segmented control. Les deux pilotent le graphique,
                  donc ils vivent juste au-dessus de lui (charte §2). */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
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
                <span className="ml-1 inline-flex items-center gap-2 text-xs text-muted">
                  <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-line" />
                  Teinte pâle : années après la fin du contrat
                </span>

                <div className="no-print ml-auto w-full sm:w-[230px]">
                  <SegmentedControl
                    ariaLabel="Mode d'affichage des économies"
                    value={chartMode}
                    onChange={setChartMode}
                    options={[
                      { label: 'Cumulées', value: 'cumul' },
                      { label: 'Annuelles', value: 'annuel' },
                    ]}
                  />
                </div>
              </div>

              {anySeriesVisible ? (
                <ChartComponent
                  mode={chartMode}
                  duration={duration}
                  scenarioBV={results.scenarioBV}
                  scenarioPV={results.scenarioPV}
                  scenarioBP={results.scenarioBP}
                  hasBattery={hasBattery}
                  visibleDatasets={{ ...visibleDatasets, bv: showBV }}
                />
              ) : (
                <p className="rounded-control border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
                  Sélectionnez au moins un scénario ci-dessus pour afficher la projection.
                </p>
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
            <Card className="print-break-before">
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

          <p className="print-footer px-1 text-center text-xs leading-relaxed text-muted">
            Abonnement +1,5 %/an · revente du surplus à {tarifReventeDisplay} €/kWh
            {showBV && ' · batterie virtuelle : énergie stockée rachetée à 0,10 €/kWh hors frais annexes'}
            {(showPV || showBP) && " · prime à l'autoconsommation intégrée en année 2"}
          </p>
        </main>
      </div>
    </div>
  );
}

export default App;
