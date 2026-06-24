import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/layout/Header';
import { useAchievements } from '../hooks/useAchievements';
import { AchievementToastLayer } from '../components/AchievementToast';
import SessionWorkout from './sport/SessionWorkout';
import ExerciseProgressModal from './sport/ExerciseProgressModal';
import ExpressWorkout, { syncOfflineSessions, getOfflineSessions } from './sport/ExpressWorkout';

const TYPE_LABELS = { push: 'Push', pull: 'Pull', legs: 'Legs' };
const TYPE_COLORS = {
  push: 'text-heat-orange',
  pull: 'text-heat-amber',
  legs: 'text-success',
};

function SessionCard({ session, onPress }) {
  const d = new Date(session.date + 'T12:00:00');
  const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <button
      onClick={() => onPress(session)}
      className="w-full text-left rounded-2xl border border-subtle bg-bg-surface1 p-4 mb-3 hover:border-heat-orange/40 transition-colors"
    >
      <div className="flex justify-between items-center">
        <div>
          <span className={`font-display font-bold text-lg uppercase tracking-wide ${TYPE_COLORS[session.type] || 'text-text-primary'}`}>
            {TYPE_LABELS[session.type] || session.type}
          </span>
          <div className="font-mono text-[10px] text-text-tertiary mt-0.5 tracking-wider">
            {dateStr}{session.duration_min ? ` · ${session.duration_min} min` : ''}
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
      {session.notes && (
        <p className="font-body text-[12px] text-text-secondary mt-2 line-clamp-1">{session.notes}</p>
      )}
    </button>
  );
}

function SessionExercisePicker({ session, userId, onSelectExercise, onClose }) {
  const [exercises, setExercises] = useState([]);
  useEffect(() => {
    supabase
      .from('workout_sets')
      .select('exercise_name')
      .eq('session_id', session.id)
      .then(({ data }) => {
        const unique = [...new Set((data || []).map(s => s.exercise_name))];
        setExercises(unique);
      });
  }, [session.id]);

  const d = new Date(session.date + 'T12:00:00');
  const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div
        className="w-full rounded-t-3xl border-t border-subtle pb-8 pt-5"
        style={{ background: '#0A0908' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 mb-4">
          <div>
            <div className="font-display font-bold text-[15px] text-text-primary">
              {TYPE_LABELS[session.type]} · {dateStr}
            </div>
            <div className="font-mono text-[10px] text-text-tertiary mt-0.5">Voir la progression d'un exercice</div>
          </div>
          <button onClick={onClose} className="text-text-tertiary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-6 flex flex-col gap-2">
          {exercises.map(name => (
            <button
              key={name}
              onClick={() => onSelectExercise(name)}
              className="w-full text-left py-3 px-4 rounded-xl border border-subtle bg-bg-surface1 font-body text-[14px] text-text-primary hover:border-heat-orange/40 transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Sport() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWorkout, setShowWorkout] = useState(false);
  const [showExpress, setShowExpress] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);
  const [selectedSession, setSelectedSession] = useState(null);
  const [progressModal, setProgressModal] = useState(null); // { exerciseName, userId }
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setCurrentUserId(user.id);
      // Auto-sync sessions express offline si connecté
      const unsynced = getOfflineSessions().filter(s => !s.synced);
      setPendingSync(unsynced.length);
      if (unsynced.length > 0 && navigator.onLine) {
        const synced = await syncOfflineSessions(user.id);
        if (synced > 0) { setPendingSync(0); fetchSessions(); }
      }
    });
  }, []);
  const { recentUnlocks, checkFirstSession, checkFirstPR } = useAchievements();

  const fetchSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30);
    setSessions(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchSessions(); }, []);

  const weekSessions = sessions.filter(s => {
    const d = new Date(s.date + 'T12:00:00');
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  });

  const countByType = weekSessions.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1; return acc;
  }, {});

  const handleSessionCreated = async (userId) => {
    fetchSessions();
    if (userId) {
      await checkFirstSession(userId);
      await checkFirstPR(userId);
    }
  };

  return (
    <>
      <div>
        <Header variant="greeting" eyebrow="SÉANCES" title="Sport" />

        {/* Résumé semaine */}
        <div className="px-6 pt-2 pb-5">
          <div className="rounded-2xl border border-subtle bg-bg-surface1 p-4">
            <div className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-text-tertiary mb-3">
              Cette semaine
            </div>
            <div className="flex gap-3">
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <div key={key} className="flex-1 text-center">
                  <div className={`font-display font-bold text-2xl ${countByType[key] ? TYPE_COLORS[key] : 'text-text-muted'}`}>
                    {countByType[key] || 0}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-text-tertiary mt-0.5">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Liste des séances */}
        <div className="px-6 pb-32">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-bold text-[13px] uppercase tracking-[0.12em] text-text-secondary">
              Historique
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowExpress(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 font-display font-bold text-[11px] uppercase tracking-wider text-sky-400 hover:bg-sky-500/20 transition-colors"
              >
                ⚡ Express
                {pendingSync > 0 && (
                  <span className="w-4 h-4 rounded-full bg-heat-amber text-[9px] text-black font-bold flex items-center justify-center">{pendingSync}</span>
                )}
              </button>
              <button
                onClick={() => setShowWorkout(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-heat-orange/10 border border-heat-orange/30 font-display font-bold text-[11px] uppercase tracking-wider text-heat-orange hover:bg-heat-orange/20 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Séance
              </button>
            </div>
          </div>

          {loading && (
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-text-tertiary text-center py-10">
              Chargement...
            </div>
          )}

          {!loading && sessions.length === 0 && (
            <div className="text-center py-14">
              <div className="font-display font-bold text-[15px] uppercase tracking-wide text-text-secondary mb-2">
                Première séance
              </div>
              <div className="font-body text-[13px] text-text-tertiary mb-6">
                Aucune séance loggée pour l'instant.
              </div>
              <button
                onClick={() => setShowWorkout(true)}
                className="px-6 py-3 rounded-xl bg-heat-orange font-display font-bold text-[13px] uppercase tracking-wide text-white"
              >
                Commencer maintenant
              </button>
            </div>
          )}

          {sessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onPress={(s) => setSelectedSession(s)}
            />
          ))}

          {/* Modal sélection exercice pour voir la progression */}
          {selectedSession && !progressModal && (
            <SessionExercisePicker
              session={selectedSession}
              userId={currentUserId}
              onSelectExercise={(name) => setProgressModal({ exerciseName: name, userId: currentUserId })}
              onClose={() => setSelectedSession(null)}
            />
          )}
        </div>
      </div>

      {/* Exercise progress modal */}
      {progressModal && (
        <ExerciseProgressModal
          exerciseName={progressModal.exerciseName}
          userId={progressModal.userId}
          onClose={() => { setProgressModal(null); setSelectedSession(null); }}
        />
      )}

      {/* Workout modal */}
      {showWorkout && (
        <SessionWorkout
          onClose={() => setShowWorkout(false)}
          onCreated={handleSessionCreated}
        />
      )}

      {/* Express workout modal */}
      {showExpress && (
        <ExpressWorkout
          onClose={() => setShowExpress(false)}
          onSaved={() => { setPendingSync(0); fetchSessions(); }}
        />
      )}

      <AchievementToastLayer unlocks={recentUnlocks} onDismiss={() => {}} />
    </>
  );
}
