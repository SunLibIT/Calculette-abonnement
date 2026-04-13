import { useState, useMemo, useEffect } from 'react';
import type { ClientType, ContractType, Duration, BatteryDuration, ChartMode, SimulatorParams } from './types/simulator';
import { calculateResults, formatNumber, formatCurrency } from './utils/calculations';
import { Slider } from './components/Slider';
import { ToggleButton } from './components/ToggleButton';
import { DurationButton } from './components/DurationButton';
import { SubscriptionCard } from './components/SubscriptionCard';
import { MetricCard } from './components/MetricCard';
import { ChartComponent } from './components/Chart';
import { DecompositionCard } from './components/DecompositionCard';
import { PrintButton } from './components/PrintButton';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [autoConsoRate, setAutoConsoRate] = useState(0.40);
  const [batteryAutoConsoBoost, setBatteryAutoConsoBoost] = useState(0.10);
  const [chartMode, setChartMode] = useState<ChartMode>('cumul');
  const [visibleDatasets, setVisibleDatasets] = useState({
    bv: false,
    pv: true,
    bp: true
  });
  const [isPvSectionOpen, setIsPvSectionOpen] = useState(true);

  useEffect(() => {
    const minPayment = clientType === 'Particulier' ? 500 : 5000;
    if (initialPayment > 0 && initialPayment < minPayment) {
      setInitialPayment(minPayment);
    }
  }, [clientType, initialPayment]);

  const toggleDataset = (dataset: 'bv' | 'pv' | 'bp') => {
    setVisibleDatasets(prev => ({
      ...prev,
      [dataset]: !prev[dataset]
    }));
  };

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
    batteryAutoConsoBoost
  };

  const results = useMemo(() => calculateResults(params), [params]);
  const hasBattery = batteryPrice > 0;
  const tvaLabel = clientType === 'Particulier' ? 'TTC' : 'HT';
  const showHT = clientType === 'Particulier';
  const showVirtualBattery = results.isVirtualBatteryEligible;

  const tarifRevente = peakPower < 9 ? 0.0400 : peakPower <= 100 ? 0.0536 : 0.0400;
  const tarifReventeDisplay = tarifRevente.toFixed(4).replace('.', ',');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#13A3AC] to-[#3CAE68] py-6 px-4">
      <div className="max-w-[960px] mx-auto bg-white rounded-2xl p-8 shadow-lg print-container">
        <div className="flex items-center justify-between gap-4 mb-6 print-header">
          <div className="flex items-center gap-4">
            <img src="/03.jpg" alt="Sunlib Logo" className="w-16 h-16 object-contain" />
            <div>
              <h1 className="text-xl font-semibold mb-1 text-[#13A3AC]">
                Calculatrice SunLib
              </h1>
            </div>
          </div>
          <div className="print-hide">
            <PrintButton onClick={handlePrint} />
          </div>
        </div>

        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-2.5 print-section-title">
          Profil client & contrat
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4 print-section">
          <div>
            <div className="text-xs text-gray-500 mb-1.5">Type de client</div>
            <div className="flex gap-1.5">
              <ToggleButton label="Particulier" active={clientType === 'Particulier'} onClick={() => setClientType('Particulier')} />
              <ToggleButton label="Entreprise" active={clientType === 'Pro'} onClick={() => setClientType('Pro')} />
            </div>
            <div className="text-[11px] text-gray-400 mt-1.5">
              {clientType === 'Particulier' ? 'Prix affichés TTC (TVA 20%)' : 'Prix affichés HT'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1.5">Type de contrat</div>
            <div className="flex gap-1.5">
              <ToggleButton label="Fixe" active={contractType === 'Fixe'} onClick={() => setContractType('Fixe')} />
              <ToggleButton label="Variable" active={contractType === 'Variable'} onClick={() => setContractType('Variable')} />
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsPvSectionOpen(!isPvSectionOpen)}
          className="w-full flex items-center justify-between text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-2.5 print-section-title hover:text-gray-700 transition-colors"
        >
          <span>Installation photovoltaïque</span>
          {isPvSectionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {isPvSectionOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4 print-section">
          <Slider
            label="Prix installation PV (HT)"
            value={installPrice}
            displayValue={formatNumber(installPrice) + ' €'}
            min={3000}
            step={100}
            onChange={setInstallPrice}
            suffix="€"
          />
          <Slider
            label="Puissance crête"
            value={peakPower}
            displayValue={peakPower + ' kWc'}
            min={1}
            step={1}
            onChange={setPeakPower}
            suffix="kWc"
          />
          <Slider
            label="Prix batterie physique (HT)"
            value={batteryPrice}
            displayValue={batteryPrice === 0 ? 'Aucune' : formatNumber(batteryPrice) + ' €'}
            min={0}
            step={100}
            onChange={setBatteryPrice}
            suffix="€"
          />
          {hasBattery && (
            <Slider
              label="Capacité batterie (kWh)"
              value={batteryCapacity}
              displayValue={formatNumber(batteryCapacity) + ' kWh'}
              min={1}
              step={0.5}
              onChange={setBatteryCapacity}
              suffix="kWh"
            />
          )}
          <Slider
            label={`Versement initial (${tvaLabel})`}
            value={initialPayment}
            displayValue={formatNumber(initialPayment) + ' €'}
            min={0}
            max={clientType === 'Particulier' ? 10000 : 50000}
            step={100}
            onChange={setInitialPayment}
            suffix="€"
          />
        </div>
        )}

        <div className="mb-4">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-2.5">
            Durée abonnement PV
          </div>
          <div className="grid grid-cols-4 gap-2 max-w-[380px]">
            {[10, 15, 20, 25].map((d) => (
              <DurationButton
                key={d}
                years={d}
                active={duration === d}
                onClick={() => setDuration(d as Duration)}
              />
            ))}
          </div>
        </div>

        {hasBattery && (
          <div className="mb-4">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-0 mb-2.5">
              Durée abonnement Batterie
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-[190px]">
              {[10, 15].map((d) => (
                <DurationButton
                  key={d}
                  years={d}
                  active={batteryDuration === d}
                  onClick={() => setBatteryDuration(d as BatteryDuration)}
                />
              ))}
            </div>
          </div>
        )}

        {results.outOfRange && (
          <div className="bg-[#fdf0ec] border border-[#f5c9b8] text-[#c04a20] rounded-xl px-3.5 py-2.5 text-xs mb-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Prix HT dépasse le plafond autorisé pour cette puissance — Hors tarif SunLib</span>
          </div>
        )}


        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-2.5 print-section-title">
          Abonnements calculés
        </div>
        <div className={`grid grid-cols-1 ${hasBattery ? 'md:grid-cols-2' : ''} gap-4 mb-4 print-section`}>
          <SubscriptionCard
            title="Abonnement PV mensuel"
            subscription={results.subscriptionPV}
            tvaLabel={tvaLabel}
            showHT={showHT}
            outOfRange={results.outOfRange}
          />
          {hasBattery && (
            <SubscriptionCard
              title="Batt. Physique mensuel"
              subscription={results.subscriptionBattery}
              tvaLabel={tvaLabel}
              showHT={showHT}
            />
          )}
        </div>


        <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-2.5 print-section-title">
          Paramètres rentabilité client
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4 print-section">
          <Slider
            label="Consommation annuelle"
            value={annualConsumption}
            displayValue={formatNumber(annualConsumption) + ' kWh'}
            min={2000}
            max={200000}
            step={1000}
            onChange={setAnnualConsumption}
            suffix="kWh"
          />
          <Slider
            label="Productible PVGIS / kWc"
            value={pvgisProduction}
            displayValue={formatNumber(pvgisProduction) + ' kWh'}
            min={700}
            max={1600}
            step={10}
            onChange={setPvgisProduction}
            suffix="kWh"
          />
          <Slider
            label="Prix moyen kWh client"
            value={avgKwhPrice}
            displayValue={avgKwhPrice.toFixed(3).replace('.', ',') + ' €'}
            min={0.10}
            max={0.40}
            step={0.005}
            onChange={setAvgKwhPrice}
            suffix="€"
          />
          <Slider
            label="Taux autoconso directe"
            value={autoConsoRate}
            displayValue={Math.round(autoConsoRate * 100) + ' %'}
            min={0.10}
            max={1.00}
            step={0.05}
            onChange={setAutoConsoRate}
            suffix="%"
          />
          {hasBattery && (
            <Slider
              label="Gain autoconso batterie"
              value={batteryAutoConsoBoost}
              displayValue={'+' + Math.round(batteryAutoConsoBoost * 100) + ' %'}
              min={0.00}
              max={0.20}
              step={0.01}
              onChange={setBatteryAutoConsoBoost}
              suffix="%"
            />
          )}
        </div>

        <div className={`grid grid-cols-1 ${hasBattery && showVirtualBattery ? 'md:grid-cols-3' : hasBattery || showVirtualBattery ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-2.5 mb-5 print-section`}>
          {showVirtualBattery && visibleDatasets.bv && (
            <MetricCard
              title="PV + Batt. Virtuelle"
              totalSavings={results.scenarioBV.totalSavings}
              breakEvenYear={results.scenarioBV.breakEvenYear}
              duration={duration}
            />
          )}
          {visibleDatasets.pv && (
            <MetricCard
              title="PV Seul"
              totalSavings={results.scenarioPV.totalSavings}
              breakEvenYear={results.scenarioPV.breakEvenYear}
              duration={duration}
            />
          )}
          {hasBattery && visibleDatasets.bp && (
            <MetricCard
              title="PV + Batt. Physique"
              totalSavings={results.scenarioBP.totalSavings}
              breakEvenYear={results.scenarioBP.breakEvenYear}
              duration={duration}
            />
          )}
        </div>

        {duration < 25 && (
          <div className="bg-[#eef5fd] border border-[#c5ddf7] rounded-xl px-3.5 py-2 text-xs text-[#185FA5] mb-2.5">
            ℹ️ Contrat {duration} ans — après l'an {duration}, l'abonnement tombe à zéro : autoconso pure, les économies s'accélèrent.
          </div>
        )}

        <div className="flex gap-1.5 mb-2.5 print-hide">
          <button
            onClick={() => setChartMode('cumul')}
            className={`px-3 py-1 text-xs border rounded-lg transition-all ${
              chartMode === 'cumul'
                ? 'bg-gradient-to-r from-[#13A3AC] to-[#3CAE68] text-white border-[#13A3AC] font-semibold'
                : 'bg-transparent text-gray-500 border-gray-300 hover:border-[#13A3AC]'
            }`}
          >
            Économies cumulées
          </button>
          <button
            onClick={() => setChartMode('annuel')}
            className={`px-3 py-1 text-xs border rounded-lg transition-all ${
              chartMode === 'annuel'
                ? 'bg-gradient-to-r from-[#13A3AC] to-[#3CAE68] text-white border-[#13A3AC] font-semibold'
                : 'bg-transparent text-gray-500 border-gray-300 hover:border-[#13A3AC]'
            }`}
          >
            Économies annuelles
          </button>
        </div>

        <div className="flex flex-wrap gap-3.5 text-xs text-gray-500 mb-2.5 print-section">
          <button
            onClick={() => toggleDataset('pv')}
            className={`flex items-center gap-1.5 cursor-pointer hover:opacity-75 transition-opacity ${!visibleDatasets.pv ? 'opacity-35' : ''}`}
          >
            <span className="w-3 h-3 rounded bg-[#60B830] flex-shrink-0"></span>
            PV Seul
          </button>
          {showVirtualBattery && (
            <button
              onClick={() => toggleDataset('bv')}
              className={`flex items-center gap-1.5 cursor-pointer hover:opacity-75 transition-opacity ${!visibleDatasets.bv ? 'opacity-35' : ''}`}
            >
              <span className="w-3 h-3 rounded bg-[#13A3AC] flex-shrink-0"></span>
              PV + Batt. Virtuelle
            </button>
          )}
          {hasBattery && (
            <button
              onClick={() => toggleDataset('bp')}
              className={`flex items-center gap-1.5 cursor-pointer hover:opacity-75 transition-opacity ${!visibleDatasets.bp ? 'opacity-35' : ''}`}
            >
              <span className="w-3 h-3 rounded bg-[#FF9800] flex-shrink-0"></span>
              PV + Batt. Physique
            </button>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gray-300 flex-shrink-0"></span>
            Après fin contrat
          </span>
        </div>

        <div className="print-chart">
          <ChartComponent
            mode={chartMode}
            duration={duration}
            scenarioBV={results.scenarioBV}
            scenarioPV={results.scenarioPV}
            scenarioBP={results.scenarioBP}
            hasBattery={hasBattery}
            visibleDatasets={{
              ...visibleDatasets,
              bv: visibleDatasets.bv && showVirtualBattery
            }}
          />
        </div>

        {(visibleDatasets.bv && showVirtualBattery) || visibleDatasets.pv || (visibleDatasets.bp && hasBattery) ? (
          <>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mt-4 mb-2.5 print-section-title print-page-break">
              Décomposition des économies — année 1
            </div>
            <div className={`grid grid-cols-1 ${(hasBattery && visibleDatasets.bp) && (showVirtualBattery && visibleDatasets.bv) ? 'md:grid-cols-3' : (hasBattery && visibleDatasets.bp) || (showVirtualBattery && visibleDatasets.bv) ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-2.5 print-section`}>
              {visibleDatasets.pv && (
                <DecompositionCard
                  title="PV Seul"
                  color="#60B830"
                  breakdown={results.breakdownPV}
                  labels={{
                    direct: `Autoconso directe (${Math.round(autoConsoRate * 100)}%)`,
                    secondary: `Revente surplus (${tarifReventeDisplay} €/kWh)`
                  }}
                />
              )}
              {showVirtualBattery && visibleDatasets.bv && (
                <DecompositionCard
                  title="PV + Batt. Virtuelle"
                  color="#13A3AC"
                  breakdown={results.breakdownBV}
                  labels={{
                    direct: `Autoconso directe (${Math.round(autoConsoRate * 100)}%)`,
                    secondary: 'Énergie BV à 0,10 €/kWh'
                  }}
                />
              )}
              {hasBattery && visibleDatasets.bp && (
                <DecompositionCard
                  title="PV + Batt. Physique"
                  color="#FF9800"
                  breakdown={results.breakdownBP}
                  labels={{
                    direct: `Autoconso directe (${Math.round(autoConsoRate * 100)}%)`,
                    secondary: `Revente surplus (${tarifReventeDisplay} €/kWh)`,
                    battery: true,
                    batteryBoostPercent: `+${Math.round(batteryAutoConsoBoost * 100)}%`
                  }}
                />
              )}
            </div>
          </>
        ) : null}

        <p className="text-[11px] text-gray-400 text-center mt-4 print-footer">
          Abonnement +1,5 %/an · Revente surplus {tarifReventeDisplay} €/kWh{showVirtualBattery && visibleDatasets.bv ? ' · Batterie virtuelle : énergie stockée rachetée à 0,10 €/kWh hors frais annexe' : ''}{(visibleDatasets.pv || (visibleDatasets.bp && hasBattery)) && !(visibleDatasets.bv && showVirtualBattery && !visibleDatasets.pv && !visibleDatasets.bp) ? " · Prime à l'autoconsommation intégrée en année 2" : ''}
        </p>
      </div>
    </div>
  );
}

export default App;
