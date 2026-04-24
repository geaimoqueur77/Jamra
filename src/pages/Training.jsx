import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  getActiveTrainingPlan,
  getSessionsRange,
  getProfile,
  regenerateWeekSessions,
  toggleSessionCompleted,
  todayISO,
} from '../db/database';
import {
  generateWeeklySchedule,
  getMondayOfWeek,
  getWeekDates,
  estimateSessionKcal,
} from '../utils/trainingPlanner';
import {
  addDaysISO,
  dateFromISO,
  formatDayAbbrev,
  formatNumber,
} from '../utils/format';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';

const TYPE_CONFIG = {
  course:   { emoji: '🏃', color: 'text-heat-orange', bg: 'bg-[rgba(255,77,0,0.08)]', border: 'border-heat-orange' },
  muscu:    { emoji: '💪', color: 'text-heat-amber', bg: 'bg-[rgba(255,170,51,0.08)]', border: 'border-heat-amber' },
  repos:    { emoji: '🛌', color: 'text-text-tertiary', bg: 'bg-bg-surface2', border: 'border-subtle' },
  autre:    { emoji: '⚡', color: 'text-success', bg: 'bg-[rgba(0,230,118,0.08)]', border: 'border-success' },
};

const INTENSITE_LABELS = {
  faible: 'Faible',
  moderee: 'Modérée',
  soutenue: 'Soutenue',
  intense: 'Intense',
};

// =====================================================================
// SESSION CARD
// =====================================================================

function SessionCard({ session, poidsKg, onToggle, onClick }) {
  const config = TYPE_CONFIG[session.type] || TYPE_CONFIG.autre;
  const dt = dateFromISO(session.date);
  const isPast = session.date < todayISO();
  const isToday = session.date === todayISO();
  const kcalEstimees = estimateSessionKcal({
    type: session.type,
    sous_type: session.sous_type,
    duree_min: session.duree_reelle_min || session.duree_prevue_min,
    poids_kg: poidsKg,
  });

  return (
    <div
      className={`
        rounded-2xl border p-4 transition-all
        ${session.completed ? 'bg-[rgba(0,230,118,0.05)] border-success/40' : `${config.bg} ${config.border}`}
        ${isToday && !session.completed ? 'ring-2 ring-heat-orange ring-offset-2 ring-offset-bg-base' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="font-mono text-[9px] tracking-[0.15em] uppercase text-text-tertiary">
            {formatDayAbbrev(dt)}
          </div>
          <div className={`font-display font-bold text-xl ${isToday ? 'text-heat-amber' : 'text-text-primary'}`}>
            {dt.getDate()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg flex-shrink-0">{config.emoji}</span>
              <span className="font-display font-bold text-sm uppercase tracking-[0.04em] text-text-primary truncate">
                {session.titre}
              </span>
            </div>
            {session.type !== 'repos' && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggle(session.id); }}
                className={`
                  w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                  ${session.completed
                    ? 'bg-success border-success text-white'
                    : 'border-text-tertiary hover:border-heat-orange'
                  }
                `}
                aria-label={session.completed ? 'Marquer comme non fait' : 'Marquer comme fait'}
              >
                {session.completed && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            )}
          </div>
          {session.description && (
            <p className="text-xs text-text-secondary mb-2">{session.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {session.duree_prevue_min && (
              <span className="font-mono text-[10px] tracking-wider uppercase text-text-tertiary">
                ⏱ {session.duree_prevue_min} min
              </span>
            )}
            {session.intensite && (
              <span className="font-mono text-[10px] tracking-wider uppercase text-text-tertiary">
                🔥 {INTENSITE_LABELS[session.intensite] || session.intensite}
              </span>
            )}
            {kcalEstimees > 0 && (
              <span className="font-mono text-[10px] tracking-wider uppercase text-heat-amber">
                ~{formatNumber(kcalEstimees)} kcal
              </span>
            )}
            {session.strava_activity_id && (
              <span className="font-mono text-[10px] tracking-wider uppercase text-[#FC4C02] font-semibold">
                ⚡ Strava
              </span>
            )}
          </div>
          <button
            onClick={onClick}
            className="mt-2 font-mono text-[10px] tracking-wider uppercase text-text-tertiary hover:text-heat-orange"
          >
            Détails &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// PAGE PRINCIPALE
// =====================================================================

export default function Training() {
  const navigate = useNavigate();
  const today = todayISO();
  const [weekRef, setWeekRef] = useState(today); // date pivot de la semaine affichée

  const monday = useMemo(() => getMondayOfWeek(weekRef), [weekRef]);
  const sunday = useMemo(() => addDaysISO(monday, 6), [monday]);

  const profile = useLiveQuery(getProfile);
  const plan = useLiveQuery(getActiveTrainingPlan);
  const sessions = useLiveQuery(() => getSessionsRange(monday, sunday), [monday, sunday]) || [];

  const isThisWeek = monday === getMondayOfWeek(today);

  if (profile === undefined || plan === undefined) return null;

  // Pas de plan : onboarding
  if (!plan) {
    return (
      <div>
        <Header variant="centered" title="Mon entraînement" />
        <div className="px-6 py-8 flex flex-col items-center text-center">
          <div className="text-5xl mb-4">🏃‍♂️</div>
          <div className="font-display font-bold text-2xl uppercase tracking-[0.02em] text-text-primary mb-3">
            Tu n'as pas encore de programme
          </div>
          <p className="text-text-secondary text-sm mb-6 max-w-sm">
            Configure ta fréquence d'entraînement course et muscu par semaine. L'app génèrera automatiquement un planning intelligent.
          </p>
          <Button fullWidth size="lg" onClick={() => navigate('/entrainement/config')}>
            Créer mon programme
          </Button>
        </div>
      </div>
    );
  }

  // Séances existantes pour la semaine affichée
  const byDate = sessions.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  // Stats semaine
  const totalSessions = sessions.filter(s => s.type !== 'repos').length;
  const completedSessions = sessions.filter(s => s.completed).length;
  const weekCourses = sessions.filter(s => s.type === 'course').length;
  const weekMuscu = sessions.filter(s => s.type === 'muscu').length;

  const handleGenerate = async () => {
    const newSessions = generateWeeklySchedule({
      course_freq: plan.course_freq,
      muscu_freq: plan.muscu_freq,
      objectif_course: plan.objectif_course,
      objectif_muscu: plan.objectif_muscu,
      startMonday: monday,
    }).map(s => ({ ...s, plan_id: plan.id }));

    await regenerateWeekSessions(monday, sunday, newSessions);
  };

  const hasSessionsThisWeek = sessions.length > 0;

  return (
    <div>
      <Header variant="centered" title="Mon entraînement" />

      {/* Plan actif */}
      <div className="px-6 pt-2 pb-4 animate-fade-up">
        <div className="p-4 rounded-2xl surface-featured">
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-heat-amber font-bold">
              Plan actif
            </div>
            <button
              onClick={() => navigate('/entrainement/config')}
              className="font-mono text-[10px] tracking-wider uppercase text-text-tertiary press-down font-bold"
            >
              Modifier →
            </button>
          </div>
          <div className="font-display font-bold text-lg text-text-primary mb-3" style={{ letterSpacing: '-0.01em' }}>
            {plan.nom}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 surface-card rounded-xl">
              <div className="flex items-baseline gap-2">
                <span className="text-xl">🏃</span>
                <span className="font-display font-bold text-2xl text-heat-orange leading-none tabular" style={{ letterSpacing: '-0.02em' }}>{plan.course_freq}</span>
                <span className="font-mono text-[9px] text-text-tertiary tracking-[0.12em] uppercase font-bold">/ sem</span>
              </div>
              <div className="font-mono text-[10px] text-text-tertiary tracking-wider uppercase mt-2 font-bold">
                Course
              </div>
            </div>
            <div className="p-3 surface-card rounded-xl">
              <div className="flex items-baseline gap-2">
                <span className="text-xl">💪</span>
                <span className="font-display font-bold text-2xl text-heat-amber leading-none tabular" style={{ letterSpacing: '-0.02em' }}>{plan.muscu_freq}</span>
                <span className="font-mono text-[9px] text-text-tertiary tracking-[0.12em] uppercase font-bold">/ sem</span>
              </div>
              <div className="font-mono text-[10px] text-text-tertiary tracking-wider uppercase mt-2 font-bold">
                Muscu
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation semaine */}
      <div className="px-6 pb-3 flex items-center justify-between animate-fade-up" style={{ animationDelay: '60ms', animationFillMode: 'backwards' }}>
        <button
          onClick={() => setWeekRef(addDaysISO(weekRef, -7))}
          className="w-10 h-10 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary press-down transition-colors surface-card"
          aria-label="Semaine précédente"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="text-center">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-heat-amber font-bold">
            {isThisWeek ? "Cette semaine" : "Semaine"}
          </div>
          <div className="font-display font-bold text-base text-text-primary mt-0.5" style={{ letterSpacing: '-0.01em' }}>
            {dateFromISO(monday).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            {' — '}
            {dateFromISO(sunday).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </div>
        </div>
        <button
          onClick={() => setWeekRef(addDaysISO(weekRef, 7))}
          className="w-9 h-9 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary border border-subtle"
          aria-label="Semaine suivante"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Stats semaine */}
      {hasSessionsThisWeek && (
        <div className="px-6 pb-4">
          <div className="p-3 bg-bg-surface1 border border-subtle rounded-xl flex items-center justify-around">
            <div className="text-center">
              <div className="font-display font-bold text-lg text-heat-amber">
                {completedSessions}<span className="text-text-tertiary text-sm">/{totalSessions}</span>
              </div>
              <div className="font-mono text-[9px] tracking-wider uppercase text-text-tertiary">Faites</div>
            </div>
            <div className="w-px h-8 bg-subtle" />
            <div className="text-center">
              <div className="font-display font-bold text-lg">
                {weekCourses}
              </div>
              <div className="font-mono text-[9px] tracking-wider uppercase text-text-tertiary">Course</div>
            </div>
            <div className="w-px h-8 bg-subtle" />
            <div className="text-center">
              <div className="font-display font-bold text-lg">
                {weekMuscu}
              </div>
              <div className="font-mono text-[9px] tracking-wider uppercase text-text-tertiary">Muscu</div>
            </div>
          </div>
        </div>
      )}

      {/* Planning de la semaine */}
      <div className="px-6 pb-6 flex flex-col gap-3">
        {!hasSessionsThisWeek ? (
          <div className="p-6 rounded-2xl border border-dashed border-strong text-center">
            <div className="text-3xl mb-2">📅</div>
            <div className="font-display font-bold text-sm uppercase tracking-[0.04em] text-text-primary mb-2">
              Planning non généré
            </div>
            <p className="text-text-secondary text-xs mb-4">
              Génère le planning pour cette semaine selon ta fréquence ({plan.course_freq} course / {plan.muscu_freq} muscu).
            </p>
            <Button fullWidth size="md" onClick={handleGenerate}>
              Générer le planning
            </Button>
          </div>
        ) : (
          <>
            {getWeekDates(monday).map((dateISO) => {
              const daySessions = byDate[dateISO] || [];
              if (daySessions.length === 0) {
                return null;
              }
              return (
                <div key={dateISO} className="flex flex-col gap-2">
                  {daySessions.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      poidsKg={profile?.poids_actuel_kg}
                      onToggle={toggleSessionCompleted}
                      onClick={() => navigate(`/entrainement/seance/${s.id}`)}
                    />
                  ))}
                </div>
              );
            })}
            <button
              onClick={handleGenerate}
              className="mt-2 py-2 text-xs font-mono tracking-wider uppercase text-text-tertiary hover:text-heat-orange border border-dashed border-subtle rounded-xl"
            >
              Régénérer cette semaine (les séances faites sont conservées)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
