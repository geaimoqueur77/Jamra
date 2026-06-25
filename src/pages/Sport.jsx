import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/layout/Header';
import { useAchievements } from '../hooks/useAchievements';
import { AchievementToastLayer } from '../components/AchievementToast';
import SessionWorkout from './sport/SessionWorkout';
import ExerciseProgressModal from './sport/ExerciseProgressModal';
import ExpressWorkout, { syncOfflineSessions, getOfflineSessions } from './sport/ExpressWorkout';
import { exportWorkoutSummary } from '../utils/exportWorkout';

const TYPE_LABELS = { push: 'Push', pull: 'Pull', legs: 'Legs' };
const TYPE_COLORS = { push: 'text-heat-orange', pull: 'text-heat-amber', legs: 'text-success' };
const TYPE_BG    = { push: 'bg-heat-orange/10 border-heat-orange/30', pull: 'bg-heat-amber/10 border-heat-amber/30', legs: 'bg-success/10 border-success/30' };

function relativeDate(dateStr) {
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  if (diff < 7) return `Il y a ${diff} jours`;
  if (diff < 14) return 'La semaine dernière';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ─── Section rival ─────────────────────────────────────────────────────────

function RivalSection({ sessions }) {
  const now = new Date();
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay() + 1); startOfWeek.setHours(0,0,0,0);
  const startOfLastWeek = new Date(startOfWeek); startOfLastWeek.setDate(startOfWeek.getDate() - 7);

  const thisWeek = (sessions || []).filter(s => new Date(s.date + 'T12:00:00') >= startOfWeek).length;
  const lastWeek = (sessions || []).filter(s => {
    const d = new Date(s.date + 'T12:00:00');
    return d >= startOfLastWeek && d < startOfWeek;
  }).length;
  const rivalCount = Math.ceil(lastWeek * 1.1) || 1;
  const ratio = Math.min(1, thisWeek / rivalCount);
  const ahead = thisWeek >= rivalCount;

  return (
    <div className="px-4 pb-4">
      <div className="rounded-[20px] border border-white/5 bg-bg-surface1 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-text-tertiary">
            Contre ton Rival
          </div>
          <span className={`font-mono text-[10px] font-bold ${ahead ? 'text-success' : 'text-heat-orange'}`}>
            {ahead ? '↑ Devant' : '↓ Derrière'}
          </span>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <div className="text-center w-10">
            <div className="font-display font-bold text-xl text-heat-orange">{thisWeek}</div>
            <div className="font-mono text-[8px] uppercase text-text-tertiary">Toi</div>
          </div>
          <div className="flex-1 h-2 rounded-full bg-bg-surface2 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.round(ratio * 100)}%`, background: ahead ? '#10b981' : '#FF4D00' }} />
          </div>
          <div className="text-center w-10">
            <div className="font-display font-bold text-xl text-text-secondary">{rivalCount}</div>
            <div className="font-mono text-[8px] uppercase text-text-tertiary">Rival</div>
          </div>
        </div>
        <div className="font-mono text-[9px] text-text-tertiary text-center">
          {lastWeek === 0 ? 'Log ta première séance pour créer un rival' : `Objectif : battre ta semaine dernière +10%`}
        </div>
      </div>
    </div>
  );
}

// ─── Strava activity card ──────────────────────────────────────────────────

function StravaActivityCard({ activity, onRemove }) {
  const [confirming, setConfirming] = useState(false);

  const distKm = activity.distance_m ? (activity.distance_m / 1000).toFixed(1) : null;
  const movingSec = activity.moving_time_s || 0;
  const paceMin = distKm && movingSec
    ? Math.floor(movingSec / 60 / parseFloat(distKm))
    : null;
  const paceSec = distKm && movingSec
    ? Math.round((movingSec / 60 / parseFloat(distKm) - Math.floor(movingSec / 60 / parseFloat(distKm))) * 60)
    : null;

  const handleRemove = async () => {
    if (!confirming) { setConfirming(true); return; }
    await supabase.from('strava_activities').delete().eq('id', activity.id);
    onRemove(activity.id);
  };

  return (
    <div className="rounded-[20px] border border-white/5 bg-bg-surface1 p-4 mb-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#FC4C02]/10 flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#FC4C02">
              <path d="M10 17.5L14.5 8.5L17 13H20L14.5 3L9 13H12L10 17.5Z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="font-display font-bold text-[13px] text-text-primary truncate">
              {activity.name || 'Activité Strava'}
            </div>
            <div className="font-mono text-[9px] text-text-tertiary mt-0.5">
              {relativeDate(activity.start_date)}
            </div>
          </div>
        </div>
        <button
          onClick={handleRemove}
          className={`shrink-0 text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all active:scale-95 ${
            confirming
              ? 'bg-danger/15 border-danger/40 text-danger'
              : 'border-white/10 text-text-muted hover:border-white/20'
          }`}
        >
          {confirming ? 'Confirmer ?' : 'Retirer'}
        </button>
      </div>

      <div className="flex gap-4 mt-3 pt-3 border-t border-white/5">
        {distKm && (
          <div>
            <div className="font-display font-bold text-base text-heat-amber">{distKm} km</div>
            <div className="font-mono text-[8px] uppercase text-text-tertiary">Distance</div>
          </div>
        )}
        {paceMin != null && (
          <div>
            <div className="font-display font-bold text-base text-text-primary">
              {paceMin}:{String(paceSec).padStart(2, '0')} /km
            </div>
            <div className="font-mono text-[8px] uppercase text-text-tertiary">Allure</div>
          </div>
        )}
        {activity.calories > 0 && (
          <div>
            <div className="font-display font-bold text-base text-heat-orange">{activity.calories} kcal</div>
            <div className="font-mono text-[8px] uppercase text-text-tertiary">Calories</div>
          </div>
        )}
        {activity.z2_pct != null && (
          <div>
            <div className="font-display font-bold text-base text-success">{Math.round(activity.z2_pct)}%</div>
            <div className="font-mono text-[8px] uppercase text-text-tertiary">Zone 2</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Delete confirmation bottom sheet ──────────────────────────────────────

function DeleteConfirmSheet({ session, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await supabase.from('workout_sets').delete().eq('session_id', session.id);
    await supabase.from('workout_sessions').delete().eq('id', session.id);
    setDeleting(false);
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div
        className="w-full max-w-2xl mx-auto rounded-t-3xl border-t border-white/10 pb-10 pt-6 px-6"
        style={{ background: '#0A0908', transform: 'translateY(0)', transition: 'transform 300ms cubic-bezier(0.32,0.72,0,1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-6" />
        <div className="text-center mb-6">
          <div className="font-display font-bold text-lg text-text-primary mb-2">
            Supprimer cette séance ?
          </div>
          <div className="font-mono text-[11px] text-text-tertiary">
            {TYPE_LABELS[session.type]} · {relativeDate(session.date)}
            {session.duration_min ? ` · ${session.duration_min} min` : ''}
          </div>
          <div className="font-mono text-[10px] text-danger mt-2">
            Cette action est irréversible.
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl border border-white/10 font-display font-bold text-[13px] uppercase tracking-wide text-text-secondary hover:border-white/20 active:scale-95 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-3.5 rounded-2xl bg-danger font-display font-bold text-[13px] uppercase tracking-wide text-white disabled:opacity-50 active:scale-95 transition-all"
          >
            {deleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit session bottom sheet ─────────────────────────────────────────────

function EditSessionSheet({ session, onSaved, onClose }) {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('workout_sets')
      .select('*')
      .eq('session_id', session.id)
      .order('exercise_name, set_number')
      .then(({ data }) => { setSets(data || []); setLoading(false); });
  }, [session.id]);

  const updateSet = (setId, field, value) =>
    setSets(prev => prev.map(s => s.id === setId ? { ...s, [field]: value } : s));

  const handleSave = async () => {
    setSaving(true);
    const updates = sets.map(s => ({
      id: s.id,
      weight_kg: parseFloat(s.weight_kg) || 0,
      reps: parseInt(s.reps) || 0,
    }));
    for (const u of updates) {
      await supabase.from('workout_sets').update({ weight_kg: u.weight_kg, reps: u.reps }).eq('id', u.id);
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  const grouped = sets.reduce((acc, s) => {
    if (!acc[s.exercise_name]) acc[s.exercise_name] = [];
    acc[s.exercise_name].push(s);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div
        className="w-full max-w-2xl mx-auto rounded-t-3xl border-t border-white/10 pb-10 pt-6"
        style={{ background: '#0A0908', maxHeight: '85dvh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
        <div className="px-6 pb-3 border-b border-white/5">
          <div className="font-display font-bold text-lg text-text-primary">
            Modifier · {TYPE_LABELS[session.type]}
          </div>
          <div className="font-mono text-[10px] text-text-tertiary mt-0.5">{relativeDate(session.date)}</div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="py-8 text-center font-mono text-[10px] text-text-tertiary">Chargement…</div>
          ) : (
            Object.entries(grouped).map(([name, exSets]) => (
              <div key={name} className="mb-4">
                <div className="font-display font-bold text-[11px] uppercase tracking-wider text-text-tertiary mb-2">{name}</div>
                {exSets.map(set => (
                  <div key={set.id} className="flex items-center gap-3 mb-2.5">
                    <span className="font-mono text-[10px] text-text-muted w-5 text-right">S{set.set_number}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={set.weight_kg}
                      onChange={e => updateSet(set.id, 'weight_kg', e.target.value)}
                      className="w-16 bg-bg-surface2 border border-white/10 rounded-lg px-2 py-1.5 font-mono text-[13px] text-right text-text-primary focus:border-heat-orange/60 focus:outline-none"
                    />
                    <span className="font-mono text-[10px] text-text-muted">kg</span>
                    <span className="font-mono text-[10px] text-text-muted">×</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={set.reps}
                      onChange={e => updateSet(set.id, 'reps', e.target.value)}
                      className="w-12 bg-bg-surface2 border border-white/10 rounded-lg px-2 py-1.5 font-mono text-[13px] text-center text-text-primary focus:border-heat-orange/60 focus:outline-none"
                    />
                    <span className="font-mono text-[10px] text-text-muted">reps</span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="px-6 pt-3 border-t border-white/5">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full py-4 rounded-2xl bg-heat-orange font-display font-bold text-[14px] uppercase tracking-wider text-white disabled:opacity-50 active:scale-95 transition-all"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Session card avec menu contextuel ─────────────────────────────────────

function SessionCard({ session, onPress, onEdit, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const longPressRef = useRef(null);
  const menuRef = useRef(null);

  const handleTouchStart = () => {
    longPressRef.current = setTimeout(() => {
      try { navigator.vibrate?.(50); } catch {}
      setShowMenu(true);
    }, 500);
  };
  const handleTouchEnd = () => {
    if (longPressRef.current) clearTimeout(longPressRef.current);
  };

  useEffect(() => {
    if (!showMenu) return;
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => { document.removeEventListener('mousedown', handleOutside); document.removeEventListener('touchstart', handleOutside); };
  }, [showMenu]);

  const typeKey = session.type || 'push';
  const totalSets = session._setsCount || null;

  return (
    <div
      className="group relative rounded-[20px] border border-white/5 bg-bg-surface1 p-4 mb-3 hover:border-heat-orange/20 transition-colors"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
    >
      <div className="flex items-center justify-between" onClick={() => onPress(session)}>
        <div className="flex items-center gap-3">
          <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold uppercase ${TYPE_BG[typeKey]}`}>
            <span className={TYPE_COLORS[typeKey]}>{TYPE_LABELS[typeKey] || typeKey}</span>
          </div>
          <div>
            <div className="font-display font-bold text-[14px] text-text-primary">
              {relativeDate(session.date)}
            </div>
            <div className="font-mono text-[9px] text-text-tertiary mt-0.5">
              {session.duration_min ? `${session.duration_min} min` : 'Durée inconnue'}
              {totalSets ? ` · ${totalSets} séries` : ''}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* ⋮ menu button — visible au hover desktop */}
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-text-tertiary"
            onMouseDown={e => { e.stopPropagation(); setShowMenu(v => !v); }}
            onClick={e => e.stopPropagation()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-tertiary">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {session.notes && (
        <p className="font-body text-[12px] text-text-secondary mt-2 line-clamp-1 opacity-70">{session.notes}</p>
      )}

      {/* Dropdown menu contextuel */}
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute right-4 top-12 z-20 min-w-[160px] rounded-2xl border border-white/10 bg-[#0d0b0a] shadow-2xl overflow-hidden"
        >
          <button
            onClick={() => { setShowMenu(false); onEdit(session); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-heat-amber">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span className="font-display font-bold text-[12px] uppercase tracking-wide text-text-primary">Modifier</span>
          </button>
          <div className="h-px bg-white/5" />
          <button
            onClick={() => { setShowMenu(false); onDelete(session); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-danger/5 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-danger">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
            <span className="font-display font-bold text-[12px] uppercase tracking-wide text-danger">Supprimer</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Session detail picker ──────────────────────────────────────────────────

function SessionExercisePicker({ session, userId, onSelectExercise, onClose }) {
  const [exercises, setExercises] = useState([]);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

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

  const handleCopy = async () => {
    if (copying) return;
    setCopying(true);
    try {
      const summary = await exportWorkoutSummary(session.id);
      await navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
    setCopying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div
        className="w-full max-w-2xl mx-auto rounded-t-3xl border-t border-white/10 pb-8 pt-5"
        style={{ background: '#0A0908' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
        <div className="flex items-center justify-between px-6 mb-4">
          <div>
            <div className="font-display font-bold text-[15px] text-text-primary">
              {TYPE_LABELS[session.type]} · {relativeDate(session.date)}
            </div>
            <div className="font-mono text-[10px] text-text-tertiary mt-0.5">Voir la progression d'un exercice</div>
          </div>
          <button onClick={onClose} className="text-text-tertiary active:scale-95 transition-transform">
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
              className="w-full text-left py-3 px-4 rounded-xl border border-white/5 bg-bg-surface1 font-body text-[14px] text-text-primary hover:border-heat-orange/30 active:scale-[0.98] transition-all"
            >
              {name}
            </button>
          ))}
        </div>

        <div className="px-6 mt-4">
          <button
            onClick={handleCopy}
            disabled={copying}
            className={`w-full py-3 rounded-xl border font-display font-bold text-[11px] uppercase tracking-wider transition-all disabled:opacity-40 active:scale-[0.98] ${
              copied
                ? 'bg-success/10 border-success/30 text-success'
                : 'border-white/10 bg-bg-surface1 text-text-secondary hover:border-heat-orange/30'
            }`}
          >
            {copied ? '✓ Bilan copié' : copying ? 'Export...' : '📋 JSON'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page Sport ─────────────────────────────────────────────────────────────

export default function Sport() {
  const [sessions, setSessions] = useState([]);
  const [stravaActivities, setStravaActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWorkout, setShowWorkout] = useState(false);
  const [showExpress, setShowExpress] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);
  const [selectedSession, setSelectedSession] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [deleteSession, setDeleteSession] = useState(null);
  const [progressModal, setProgressModal] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const { recentUnlocks, checkFirstSession, checkFirstPR } = useAchievements();

  const fetchSessions = useCallback(async () => {
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
  }, []);

  const fetchStrava = useCallback(async (uid) => {
    const { data } = await supabase
      .from('strava_activities')
      .select('*')
      .eq('profile_id', uid)
      .order('start_date', { ascending: false })
      .limit(8);
    setStravaActivities(data || []);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setCurrentUserId(user.id);
      const unsynced = getOfflineSessions().filter(s => !s.synced);
      setPendingSync(unsynced.length);
      if (unsynced.length > 0 && navigator.onLine) {
        const synced = await syncOfflineSessions(user.id);
        if (synced > 0) { setPendingSync(0); fetchSessions(); }
      }
      fetchStrava(user.id);
    });
  }, [fetchStrava]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

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

  const handleDeleteConfirmed = () => {
    setDeleteSession(null);
    fetchSessions();
  };

  const handleEditSaved = () => {
    setEditingSession(null);
    fetchSessions();
  };

  const handleRemoveStrava = (id) => {
    setStravaActivities(prev => prev.filter(a => a.id !== id));
  };

  return (
    <>
      <div>
        <Header variant="greeting" eyebrow="SÉANCES" title="Sport" />

        {/* ── Résumé semaine PPL */}
        <div className="px-4 pt-2 pb-4">
          <div className="rounded-[20px] border border-white/5 bg-bg-surface1 p-4">
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

        {/* ── Section Rival */}
        <RivalSection sessions={sessions} />

        {/* ── Feed Strava */}
        {stravaActivities.length > 0 && (
          <div className="px-4 pb-4">
            <div className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-text-tertiary mb-3">
              Strava
            </div>
            {stravaActivities.map(a => (
              <StravaActivityCard key={a.id} activity={a} onRemove={handleRemoveStrava} />
            ))}
          </div>
        )}

        {/* ── Historique séances */}
        <div className="px-4 pb-32">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-bold text-[11px] uppercase tracking-[0.14em] text-text-tertiary">
              Historique
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowExpress(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 font-display font-bold text-[11px] uppercase tracking-wider text-sky-400 hover:bg-sky-500/20 active:scale-95 transition-all"
              >
                ⚡ Express
                {pendingSync > 0 && (
                  <span className="w-4 h-4 rounded-full bg-heat-amber text-[9px] text-black font-bold flex items-center justify-center">{pendingSync}</span>
                )}
              </button>
            </div>
          </div>

          {loading && (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="rounded-[20px] border border-white/5 bg-bg-surface1 p-4 animate-pulse">
                  <div className="h-4 bg-white/5 rounded w-24 mb-2" />
                  <div className="h-3 bg-white/5 rounded w-16" />
                </div>
              ))}
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
                className="px-6 py-3 rounded-xl bg-heat-orange font-display font-bold text-[13px] uppercase tracking-wide text-white active:scale-95 transition-transform"
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
              onEdit={(s) => setEditingSession(s)}
              onDelete={(s) => setDeleteSession(s)}
            />
          ))}

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

      {/* ── FAB Nouvelle séance */}
      <button
        onClick={() => setShowWorkout(true)}
        className="fixed bottom-24 right-4 z-30 w-14 h-14 rounded-full bg-heat-orange flex items-center justify-center shadow-[0_4px_20px_rgba(255,77,0,0.45)] active:scale-95 transition-transform md:right-[calc(50%-672px/2+16px)]"
        aria-label="Nouvelle séance"
        style={{ maxWidth: 'calc(50% + 336px - 16px)' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* ── Modals ── */}

      {deleteSession && (
        <DeleteConfirmSheet
          session={deleteSession}
          onConfirm={handleDeleteConfirmed}
          onClose={() => setDeleteSession(null)}
        />
      )}

      {editingSession && (
        <EditSessionSheet
          session={editingSession}
          onSaved={handleEditSaved}
          onClose={() => setEditingSession(null)}
        />
      )}

      {progressModal && (
        <ExerciseProgressModal
          exerciseName={progressModal.exerciseName}
          userId={progressModal.userId}
          onClose={() => { setProgressModal(null); setSelectedSession(null); }}
        />
      )}

      {showWorkout && (
        <SessionWorkout
          onClose={() => setShowWorkout(false)}
          onCreated={handleSessionCreated}
        />
      )}

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
