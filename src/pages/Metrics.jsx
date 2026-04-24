import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { getProfile, todayISO } from '../db/database';
import { computeProfileMetrics, calculateBMRMifflin, calculateAge, calculateHRMaxTanaka, calculateHRZones } from '../utils/calculations';
import { analyzeAdaptation } from '../utils/adaptiveMetrics';
import { analyzeZoneDistribution, ZONE_INFO } from '../utils/hrZones';
import HRZoneBar from '../components/training/HRZoneBar';
import { supabase } from '../lib/supabase';
import { formatNumber, formatDateLong } from '../utils/format';
import Header from '../components/layout/Header';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

function MetricRow({ label, value, unit, description, tone = 'default', tooltip }) {
  const toneClass =
    tone === 'success' ? 'text-success' :
    tone === 'warning' ? 'text-heat-amber' :
    tone === 'danger'  ? 'text-danger' :
    tone === 'heat'    ? 'text-heat-gradient' :
                         'text-text-primary';
  return (
    <div className="py-2 border-t border-subtle first:border-t-0">
      <div className="flex justify-between items-baseline">
        <span className="font-body text-sm text-text-secondary">{label}</span>
        <span className={`font-display font-bold text-base ${toneClass}`}>
          {value} <span className="font-mono text-xs text-text-tertiary">{unit}</span>
        </span>
      </div>
      {description && (
        <div className="font-mono text-[9px] tracking-wider uppercase text-text-tertiary mt-0.5">
          {description}
        </div>
      )}
    </div>
  );
}

function ZoneBar({ zone, hrRange, pct, active }) {
  const info = ZONE_INFO[zone];
  return (
    <div className={`flex items-center gap-2 py-1.5 ${active ? 'opacity-100' : 'opacity-60'}`}>
      <span className="text-base flex-shrink-0">{info.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display font-bold text-xs uppercase tracking-wider text-text-primary">
            {info.label}
          </span>
          <span className="font-mono text-[10px] text-text-tertiary">
            {hrRange.min}-{hrRange.max} bpm
          </span>
        </div>
        {pct != null && (
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-bg-surface2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.min(100, pct)}%`, backgroundColor: info.color }}
              />
            </div>
            <span className="font-mono text-[10px] font-bold" style={{ color: info.color }}>
              {pct}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Metrics() {
  const navigate = useNavigate();
  const profile = useLiveQuery(getProfile);

  const [adaptation, setAdaptation] = useState(null);
  const [loadingAdapt, setLoadingAdapt] = useState(true);

  const [zoneAnalysis, setZoneAnalysis] = useState(null);
  const [loadingZones, setLoadingZones] = useState(true);

  // Adaptive metrics
  useEffect(() => {
    if (!profile) return;
    setLoadingAdapt(true);
    analyzeAdaptation(profile, 28)
      .then(setAdaptation)
      .catch(() => setAdaptation({ ready: false, reason: 'erreur' }))
      .finally(() => setLoadingAdapt(false));
  }, [profile?.id, profile?.poids_actuel_kg]);

  // HR zone analysis sur les activités Strava des 14 derniers jours
  useEffect(() => {
    if (!profile) return;
    setLoadingZones(true);
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) return;
        const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
        const { data } = await supabase
          .from('strava_activities')
          .select('*')
          .eq('profile_id', userData.user.id)
          .gte('start_date', since)
          .not('average_heartrate', 'is', null);
        if (data && data.length > 0) {
          setZoneAnalysis(analyzeZoneDistribution(data, profile));
        } else {
          setZoneAnalysis(null);
        }
      } catch {}
      finally {
        setLoadingZones(false);
      }
    })();
  }, [profile?.id]);

  if (!profile) return null;

  const age = calculateAge(profile.date_naissance);
  const metricsToday = computeProfileMetrics(profile, {
    extraKcalBurned: 0,
    adaptationPct: adaptation?.adaptation?.adaptation_pct || 0,
  });

  // BMR sur poids initial vs actuel (pour montrer le bug du modèle classique)
  const bmrInitial = calculateBMRMifflin({
    sexe: profile.sexe,
    poids_kg: profile.poids_initial_kg,
    taille_cm: profile.taille_cm,
    age,
  });
  const bmrActuel = calculateBMRMifflin({
    sexe: profile.sexe,
    poids_kg: profile.poids_actuel_kg || profile.poids_initial_kg,
    taille_cm: profile.taille_cm,
    age,
  });
  const bmrDelta = bmrInitial && bmrActuel ? bmrInitial - bmrActuel : 0;

  const hrMax = calculateHRMaxTanaka(age);
  const hrZones = calculateHRZones(hrMax);

  return (
    <div>
      <Header variant="title" title="Métriques" onBack={() => navigate(-1)} />

      <div className="px-6 py-4 flex flex-col gap-4 pb-8">
        {/* Énergétique */}
        <Card>
          <div className="flex items-baseline justify-between mb-3">
            <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary">
              Énergétique
            </div>
            <div className="font-mono text-[9px] text-text-tertiary tracking-wider uppercase">
              Mifflin-St Jeor
            </div>
          </div>
          <MetricRow
            label="BMR (poids actuel)"
            value={formatNumber(bmrActuel)}
            unit="kcal"
            description="Métabolisme de base au repos"
            tone="heat"
          />
          {bmrDelta > 0 && (
            <MetricRow
              label="BMR initial"
              value={formatNumber(bmrInitial)}
              unit="kcal"
              description={`Baisse mécanique : -${bmrDelta} kcal/j avec la perte de poids`}
              tone="warning"
            />
          )}
          <MetricRow
            label="TDEE théorique"
            value={formatNumber(metricsToday.tdee_theoretical)}
            unit="kcal"
            description={`BMR × ${({ sedentaire: '1.20', leger: '1.375', modere: '1.55', intense: '1.725' })[profile.niveau_activite] || '?'} (PAL sans exercice)`}
          />
          {adaptation?.adaptation?.detected && (
            <MetricRow
              label="TDEE ajusté (observé)"
              value={formatNumber(adaptation.tdee.tdeeEstimatedReal)}
              unit="kcal"
              description={`Adaptation métabolique : ${Math.round(adaptation.adaptation.adaptation_pct * 100)}%`}
              tone="warning"
            />
          )}
          <MetricRow
            label="Cible kcal"
            value={formatNumber(metricsToday.target_kcal)}
            unit="kcal"
            description={`Déficit ${metricsToday.deficit_pct}% (${metricsToday.deficit_kcal} kcal/j)`}
            tone="heat"
          />
        </Card>

        {/* Macros */}
        <Card>
          <div className="flex items-baseline justify-between mb-3">
            <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary">
              Macros cibles
            </div>
            <div className="font-mono text-[9px] text-text-tertiary tracking-wider uppercase">
              Poids actuel
            </div>
          </div>
          <MetricRow
            label="Protéines"
            value={formatNumber(metricsToday.proteines_g)}
            unit="g"
            description={`${metricsToday.proteines_g_par_kg} g/kg · ${metricsToday.proteines_pct}% des kcal`}
          />
          <MetricRow
            label="Lipides"
            value={formatNumber(metricsToday.lipides_g)}
            unit="g"
            description={`${metricsToday.lipides_pct}% des kcal (min 0.8 g/kg)`}
          />
          <MetricRow
            label="Glucides"
            value={formatNumber(metricsToday.glucides_g)}
            unit="g"
            description={`${metricsToday.glucides_pct}% des kcal (reste après prot+lip)`}
          />
          <MetricRow
            label="Fibres"
            value={formatNumber(metricsToday.fibres_g)}
            unit="g"
            description="14 g / 1000 kcal (OMS)"
            tone="success"
          />
        </Card>

        {/* Adaptation métabolique */}
        <Card>
          <div className="flex items-baseline justify-between mb-3">
            <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary">
              Adaptation métabolique
            </div>
            <div className="font-mono text-[9px] text-text-tertiary tracking-wider uppercase">
              28 jours
            </div>
          </div>
          {loadingAdapt ? (
            <div className="text-text-tertiary text-sm">Analyse en cours...</div>
          ) : !adaptation?.ready ? (
            <div className="text-text-secondary text-sm">
              <div className="mb-2">📊 Pas encore assez de données.</div>
              <div className="font-mono text-[10px] text-text-tertiary tracking-wider uppercase">
                {adaptation?.reason || ''}
              </div>
              <div className="font-mono text-[10px] text-text-tertiary mt-2">
                Requis : 3+ pesées et 10+ entrées alimentaires sur 28 jours.
              </div>
            </div>
          ) : (
            <>
              <MetricRow
                label="Apport moyen"
                value={formatNumber(adaptation.intake.avgKcalPerDay)}
                unit="kcal/j"
                description={`Sur ${adaptation.period.loggedDays} jours loggés / ${adaptation.period.days}`}
              />
              <MetricRow
                label="Perte observée"
                value={adaptation.weight.lost >= 0 ? `-${adaptation.weight.lost}` : `+${Math.abs(adaptation.weight.lost)}`}
                unit="kg"
                description={`${adaptation.weight.start} → ${adaptation.weight.end} kg`}
                tone={adaptation.weight.lost > 0 ? 'success' : 'warning'}
              />
              {adaptation.adaptation?.detected ? (
                <>
                  <MetricRow
                    label="TDEE réel estimé"
                    value={formatNumber(adaptation.tdee.tdeeEstimatedReal)}
                    unit="kcal"
                    description={`vs ${formatNumber(adaptation.tdee.tdeeTheoretical)} théorique`}
                    tone="warning"
                  />
                  <MetricRow
                    label="Adaptation"
                    value={`${Math.round(adaptation.adaptation.adaptation_pct * 100)}`}
                    unit="%"
                    description="Down-regulation hormonale + NEAT compensatoire (Trexler 2014)"
                    tone="warning"
                  />
                </>
              ) : (
                <div className="py-2 border-t border-subtle">
                  <div className="font-body text-sm text-success">
                    ✓ Pas d'adaptation significative détectée
                  </div>
                  <div className="font-mono text-[10px] text-text-tertiary mt-1">
                    Ton métabolisme répond au déficit comme prévu.
                  </div>
                </div>
              )}

              {adaptation.dietBreak?.shouldBreak && (
                <div className="mt-3 p-3 rounded-xl border border-heat-orange bg-[rgba(255,170,51,0.05)]">
                  <div className="font-display font-bold text-xs uppercase tracking-[0.1em] text-heat-amber mb-1">
                    💡 Diet break recommandé
                  </div>
                  <div className="text-sm text-text-secondary">
                    {adaptation.dietBreak.message}
                  </div>
                  <div className="font-mono text-[10px] text-text-tertiary mt-2 tracking-wider uppercase">
                    {adaptation.dietBreak.recommendedWeeks} semaine(s) à maintenance
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        {/* FC Zones */}
        <Card>
          <div className="flex items-baseline justify-between mb-3">
            <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary">
              Zones cardiaques
            </div>
            <div className="font-mono text-[9px] text-text-tertiary tracking-wider uppercase">
              Tanaka
            </div>
          </div>
          <MetricRow
            label="FC Max"
            value={hrMax}
            unit="bpm"
            description={`208 - 0.7 × ${age} ans`}
            tone="heat"
          />

          {loadingZones ? (
            <div className="text-text-tertiary text-sm mt-3">Analyse Strava en cours...</div>
          ) : zoneAnalysis ? (
            <>
              {/* Nouvelle barre globale visuelle */}
              <div className="mt-4 mb-4 p-4 rounded-xl surface-card">
                <div className="flex items-baseline justify-between mb-3">
                  <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary font-bold">
                    Répartition 14 jours
                  </div>
                  <div className="font-mono text-[10px] text-text-tertiary tracking-wider tabular">
                    {zoneAnalysis.totalTimeMinutes} min
                  </div>
                </div>
                <HRZoneBar
                  distribution={zoneAnalysis.pctByZone}
                  times={zoneAnalysis.timeByZone}
                  showLabels={true}
                  height={36}
                />
              </div>

              {/* Détail par zone */}
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary mb-2 font-bold">
                Détail par zone
              </div>
              {Object.entries(hrZones).map(([z, range]) => (
                <ZoneBar
                  key={z}
                  zone={z}
                  hrRange={range}
                  pct={zoneAnalysis.pctByZone[z]}
                  active={zoneAnalysis.pctByZone[z] > 0}
                />
              ))}

              {zoneAnalysis.polarizationMessage && (
                <div className="mt-4 p-3.5 rounded-xl animate-fade-up"
                  style={{
                    background:
                      zoneAnalysis.polarizationStatus === 'polarized' ? 'rgba(0,230,118,0.05)' :
                      zoneAnalysis.polarizationStatus === 'balanced' ? 'rgba(255,255,255,0.04)' :
                      'rgba(255,170,51,0.06)',
                    border:
                      zoneAnalysis.polarizationStatus === 'polarized' ? '0.5px solid rgba(0,230,118,0.3)' :
                      zoneAnalysis.polarizationStatus === 'balanced' ? '0.5px solid rgba(255,255,255,0.08)' :
                      '0.5px solid rgba(255,170,51,0.3)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">
                      {zoneAnalysis.polarizationStatus === 'polarized' ? '✓' :
                       zoneAnalysis.polarizationStatus === 'balanced' ? '·' : '⚠'}
                    </span>
                    <span className="font-display font-bold text-[12px] uppercase tracking-[0.08em]"
                      style={{
                        color:
                          zoneAnalysis.polarizationStatus === 'polarized' ? '#00E676' :
                          zoneAnalysis.polarizationStatus === 'balanced' ? 'rgba(255,255,255,0.8)' :
                          '#FFAA33',
                      }}
                    >
                      {zoneAnalysis.polarizationStatus === 'polarized' ? 'Polarisation idéale' :
                       zoneAnalysis.polarizationStatus === 'balanced' ? 'Distribution équilibrée' :
                       'À corriger'}
                    </span>
                  </div>
                  <div className="text-[13px] text-text-secondary leading-relaxed">
                    {zoneAnalysis.polarizationMessage}
                  </div>
                  <div className="font-mono text-[10px] text-text-tertiary mt-2 tracking-wide">
                    Seiler 2010 · 75-85% Z1+Z2, 15-20% Z4+Z5
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary mt-3 mb-2 font-bold">
                Zones de référence
              </div>
              {Object.entries(hrZones).map(([z, range]) => (
                <ZoneBar
                  key={z}
                  zone={z}
                  hrRange={range}
                  pct={null}
                  active={true}
                />
              ))}
              <div className="font-mono text-[10px] text-text-tertiary mt-2">
                Connecte Strava et fais quelques séances avec FC pour voir ta répartition réelle.
              </div>
            </>
          )}
        </Card>

        {/* Références scientifiques */}
        <Card>
          <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary mb-3">
            Références scientifiques
          </div>
          <div className="flex flex-col gap-2 text-xs text-text-secondary">
            <div className="font-mono text-[10px] leading-relaxed">
              <span className="text-heat-amber">BMR :</span> Mifflin-St Jeor 1990, validation Frankenfield 2005 (±10%)
            </div>
            <div className="font-mono text-[10px] leading-relaxed">
              <span className="text-heat-amber">TDEE/PAL :</span> FAO/OMS 2001 (coefficients activité standardisés)
            </div>
            <div className="font-mono text-[10px] leading-relaxed">
              <span className="text-heat-amber">Protéines :</span> Morton 2018 (méta-analyse), Helms 2014 (2.3-3.1 g/kg FFM en déficit)
            </div>
            <div className="font-mono text-[10px] leading-relaxed">
              <span className="text-heat-amber">Fibres :</span> OMS, Dietary Guidelines 2020-2025 (14 g / 1000 kcal)
            </div>
            <div className="font-mono text-[10px] leading-relaxed">
              <span className="text-heat-amber">Adaptation :</span> Hall 2015, Trexler 2014, Müller 2016, MATADOR Byrne 2018
            </div>
            <div className="font-mono text-[10px] leading-relaxed">
              <span className="text-heat-amber">FC Max :</span> Tanaka 2001 (208 - 0.7 × age, ±5 bpm, 18 712 sujets)
            </div>
            <div className="font-mono text-[10px] leading-relaxed">
              <span className="text-heat-amber">Zones FC :</span> Coggan 2010, Seiler 2010 (polarized 80/20)
            </div>
            <div className="font-mono text-[10px] leading-relaxed">
              <span className="text-heat-amber">NEAT vs EAT :</span> Levine 2006 (thermogenèse non-exercise)
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
