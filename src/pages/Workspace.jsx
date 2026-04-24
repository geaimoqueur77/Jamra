import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getMyWorkspace,
  getMyPendingInvitations,
  getWorkspaceInvitations,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  inviteMember,
  revokeInvitation,
  acceptInvitation,
  declineInvitation,
  leaveWorkspace,
  removeMember,
} from '../lib/workspace';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

function Section({ title, count, children }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="font-display font-bold text-[11px] uppercase tracking-[0.12em] text-text-tertiary">
          {title}
        </div>
        {count != null && (
          <div className="font-mono text-[10px] text-text-tertiary tracking-wider">
            {count}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function MemberRow({ member, myUserId, isOwner, onRemove }) {
  const isMe = member.user_id === myUserId;
  const isMemberOwner = member.role === 'owner';
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg surface-card mb-1.5">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-heat-amber to-heat-orange flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0">
          {(member.profiles?.nom || '?').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-body font-semibold text-sm text-text-primary flex items-center gap-2">
            {member.profiles?.nom || 'Membre'}
            {isMe && <span className="font-mono text-[9px] tracking-wider uppercase text-heat-amber">moi</span>}
          </div>
          <div className="font-mono text-[10px] text-text-tertiary tracking-wider uppercase">
            {isMemberOwner ? '👑 Propriétaire' : 'Membre'}
            {member.joined_at && ` · ${new Date(member.joined_at).toLocaleDateString('fr-FR')}`}
          </div>
        </div>
      </div>
      {isOwner && !isMe && !isMemberOwner && (
        !confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="text-text-tertiary hover:text-danger text-xs font-mono tracking-wider uppercase"
          >
            retirer
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={() => setConfirming(false)}
              className="px-2 py-1 text-[10px] font-mono text-text-tertiary"
            >
              annuler
            </button>
            <button
              onClick={() => { onRemove(member.user_id); setConfirming(false); }}
              className="px-2 py-1 text-[10px] font-display font-bold uppercase tracking-wider text-white bg-danger rounded"
            >
              retirer
            </button>
          </div>
        )
      )}
    </div>
  );
}

function InvitationRow({ invitation, onRevoke }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg surface-card border-dashed mb-1.5">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-full bg-bg-surface2 flex items-center justify-center text-text-tertiary">
          ✉️
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-body text-sm text-text-primary truncate">
            {invitation.invited_email}
          </div>
          <div className="font-mono text-[10px] text-text-tertiary tracking-wider uppercase">
            Invitation envoyée · {new Date(invitation.created_at).toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="text-text-tertiary hover:text-danger text-xs font-mono tracking-wider uppercase"
        >
          révoquer
        </button>
      ) : (
        <div className="flex gap-1">
          <button
            onClick={() => setConfirming(false)}
            className="px-2 py-1 text-[10px] font-mono text-text-tertiary"
          >
            annuler
          </button>
          <button
            onClick={() => { onRevoke(invitation.id); setConfirming(false); }}
            className="px-2 py-1 text-[10px] font-display font-bold uppercase tracking-wider text-white bg-danger rounded"
          >
            révoquer
          </button>
        </div>
      )}
    </div>
  );
}

function PendingInvitationsPanel({ invitations, onAccept, onDecline }) {
  return (
    <div className="mb-5">
      <div className="font-display font-bold text-[11px] uppercase tracking-[0.12em] text-heat-amber mb-2 px-1">
        Invitations reçues ({invitations.length})
      </div>
      {invitations.map(inv => (
        <div key={inv.id} className="p-4 rounded-2xl border border-heat-orange bg-gradient-to-br from-[rgba(255,170,51,0.04)] to-[rgba(255,23,68,0.04)] mb-2">
          <div className="flex items-start gap-3 mb-3">
            <div className="text-2xl">👋</div>
            <div className="flex-1">
              <div className="font-display font-bold text-sm uppercase tracking-[0.04em] text-text-primary mb-1">
                {inv.workspaces?.nom || 'Un foyer'}
              </div>
              <div className="font-body text-sm text-text-secondary">
                Tu es invité à rejoindre ce foyer. Tu partageras certains aliments et recettes, mais tes repas et pesées resteront privés.
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" fullWidth onClick={() => onDecline(inv.id)}>
              Refuser
            </Button>
            <Button size="sm" fullWidth onClick={() => onAccept(inv.id)}>
              Rejoindre
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// =====================================================================
// PAGE PRINCIPALE
// =====================================================================

export default function Workspace() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workspace, setWorkspace] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creating, setCreating] = useState(false);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // Edit workspace name
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Leave/Delete confirmations
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ws, pending] = await Promise.all([
        getMyWorkspace(),
        getMyPendingInvitations(),
      ]);
      setWorkspace(ws);
      setPendingInvitations(pending);
      if (ws && ws.my_role === 'owner') {
        const invites = await getWorkspaceInvitations(ws.id);
        setInvitations(invites);
      } else {
        setInvitations([]);
      }
    } catch (err) {
      setError(err?.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ----------------------- Handlers ---------------------------

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      await createWorkspace(newWorkspaceName);
      setShowCreate(false);
      setNewWorkspaceName('');
      await refresh();
    } catch (err) {
      setError(err?.message || 'Erreur création');
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async () => {
    if (inviting || !inviteEmail.trim()) return;
    setInviting(true);
    setError(null);
    try {
      await inviteMember(workspace.id, inviteEmail);
      setInviteEmail('');
      await refresh();
    } catch (err) {
      setError(err?.message || 'Erreur invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async (id) => {
    try {
      await revokeInvitation(id);
      await refresh();
    } catch (err) {
      setError(err?.message);
    }
  };

  const handleAccept = async (id) => {
    try {
      await acceptInvitation(id);
      await refresh();
    } catch (err) {
      setError(err?.message);
    }
  };

  const handleDecline = async (id) => {
    try {
      await declineInvitation(id);
      await refresh();
    } catch (err) {
      setError(err?.message);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveWorkspace(workspace.id);
      setConfirmLeave(false);
      await refresh();
    } catch (err) {
      setError(err?.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteWorkspace(workspace.id);
      setConfirmDelete(false);
      await refresh();
    } catch (err) {
      setError(err?.message);
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await removeMember(workspace.id, userId);
      await refresh();
    } catch (err) {
      setError(err?.message);
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) return;
    try {
      await updateWorkspace(workspace.id, { nom: editedName.trim() });
      setEditingName(false);
      await refresh();
    } catch (err) {
      setError(err?.message);
    }
  };

  // ----------------------- Render ---------------------------

  if (loading) {
    return (
      <div>
        <Header variant="title" title="Mon foyer" onBack={() => navigate(-1)} />
        <div className="min-h-[40vh] flex items-center justify-center text-text-tertiary font-mono text-sm">
          Chargement...
        </div>
      </div>
    );
  }

  const isOwner = workspace?.my_role === 'owner';
  const hasPending = pendingInvitations.length > 0;

  return (
    <div>
      <Header variant="title" title="Mon foyer" onBack={() => navigate(-1)} />

      <div className="px-6 py-4 flex flex-col gap-1">
        {/* Invitations reçues (priorité haute) */}
        {hasPending && (
          <PendingInvitationsPanel
            invitations={pendingInvitations}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        )}

        {/* Pas de workspace + pas d'invitation : onboarding */}
        {!workspace && !hasPending && !showCreate && (
          <Card>
            <div className="text-center py-4">
              <div className="text-4xl mb-2">🏠</div>
              <div className="font-display font-bold text-lg uppercase tracking-[0.02em] text-text-primary mb-2">
                Tu n'as pas encore de foyer
              </div>
              <p className="text-text-secondary text-sm mb-4">
                Crée un foyer pour inviter ta famille à partager des aliments personnalisés et des recettes.
              </p>
              <Button fullWidth onClick={() => setShowCreate(true)}>
                Créer mon foyer
              </Button>
            </div>
          </Card>
        )}

        {/* Formulaire de création */}
        {!workspace && showCreate && (
          <Card>
            <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary mb-3">
              Nouveau foyer
            </div>
            <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary mb-1.5 block">
              Nom du foyer
            </label>
            <input
              type="text"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="Ex : Famille El Alami"
              autoFocus
              className="w-full px-4 py-3 mb-3 bg-bg-surface2 border border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:border-heat-orange transition-colors"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="md" fullWidth onClick={() => setShowCreate(false)}>
                Annuler
              </Button>
              <Button size="md" fullWidth onClick={handleCreate} disabled={creating}>
                {creating ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </Card>
        )}

        {/* Workspace existant */}
        {workspace && (
          <>
            {/* Infos du foyer */}
            <Card>
              {editingName ? (
                <>
                  <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary mb-2">
                    Renommer le foyer
                  </div>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    autoFocus
                    className="w-full px-4 py-3 mb-3 bg-bg-surface2 border border-subtle rounded-xl text-sm text-text-primary focus:outline-none focus:border-heat-orange"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" fullWidth onClick={() => setEditingName(false)}>
                      Annuler
                    </Button>
                    <Button size="sm" fullWidth onClick={handleSaveName}>
                      Enregistrer
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-text-tertiary mb-1">
                      {isOwner ? '👑 Tu es propriétaire' : 'Tu es membre'}
                    </div>
                    <div className="font-display font-bold text-xl uppercase tracking-[0.02em] text-text-primary break-words">
                      {workspace.nom}
                    </div>
                    <div className="font-mono text-[10px] text-text-tertiary tracking-wider uppercase mt-1">
                      Créé le {new Date(workspace.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => { setEditingName(true); setEditedName(workspace.nom); }}
                      className="text-text-tertiary hover:text-heat-amber"
                      aria-label="Renommer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </Card>

            {/* Membres */}
            <Card>
              <Section title="Membres" count={workspace.members.length}>
                {workspace.members.map(member => (
                  <MemberRow
                    key={member.user_id}
                    member={member}
                    myUserId={user?.id}
                    isOwner={isOwner}
                    onRemove={handleRemoveMember}
                  />
                ))}
              </Section>

              {/* Invitations envoyées (owner only) */}
              {isOwner && invitations.length > 0 && (
                <Section title="Invitations en attente" count={invitations.length}>
                  {invitations.map(inv => (
                    <InvitationRow key={inv.id} invitation={inv} onRevoke={handleRevoke} />
                  ))}
                </Section>
              )}

              {/* Inviter (owner only) */}
              {isOwner && (
                <div className="pt-2 border-t border-subtle">
                  <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-text-tertiary mb-2">
                    Inviter une personne
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="email@exemple.com"
                      className="flex-1 px-3 py-2 bg-bg-surface2 border border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-heat-orange"
                    />
                    <Button size="md" onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                      {inviting ? '...' : 'Inviter'}
                    </Button>
                  </div>
                  <div className="font-mono text-[10px] text-text-tertiary tracking-wider uppercase mt-2">
                    La personne doit avoir un compte Jamra avec cet email pour voir l'invitation.
                  </div>
                </div>
              )}
            </Card>

            {/* Zone danger */}
            <Card>
              <div className="font-display font-bold text-xs uppercase tracking-[0.12em] text-text-tertiary mb-3">
                {isOwner ? 'Zone propriétaire' : 'Zone membre'}
              </div>
              {isOwner ? (
                !confirmDelete ? (
                  <>
                    <p className="text-text-secondary text-xs mb-3">
                      Supprimer le foyer retire tous les membres et révoque les invitations en attente. Action irréversible.
                    </p>
                    <Button variant="outline" size="md" fullWidth onClick={() => setConfirmDelete(true)}>
                      Supprimer le foyer
                    </Button>
                  </>
                ) : (
                  <div className="p-3 rounded-xl border border-danger bg-[rgba(255,23,68,0.05)]">
                    <p className="text-text-primary text-sm mb-3">
                      Confirmer la suppression du foyer <strong>{workspace.nom}</strong> ?
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" fullWidth onClick={() => setConfirmDelete(false)}>
                        Annuler
                      </Button>
                      <button onClick={handleDelete} className="flex-1 py-2 rounded-xl bg-danger text-white font-display font-bold text-xs uppercase tracking-[0.1em]">
                        Supprimer
                      </button>
                    </div>
                  </div>
                )
              ) : (
                !confirmLeave ? (
                  <>
                    <p className="text-text-secondary text-xs mb-3">
                      Quitter le foyer te fait perdre l'accès aux aliments partagés et recettes partagées de ce foyer. Tes repas et pesées personnels restent intacts.
                    </p>
                    <Button variant="outline" size="md" fullWidth onClick={() => setConfirmLeave(true)}>
                      Quitter le foyer
                    </Button>
                  </>
                ) : (
                  <div className="p-3 rounded-xl border border-danger bg-[rgba(255,23,68,0.05)]">
                    <p className="text-text-primary text-sm mb-3">
                      Confirmer la sortie de <strong>{workspace.nom}</strong> ?
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" fullWidth onClick={() => setConfirmLeave(false)}>
                        Annuler
                      </Button>
                      <button onClick={handleLeave} className="flex-1 py-2 rounded-xl bg-danger text-white font-display font-bold text-xs uppercase tracking-[0.1em]">
                        Quitter
                      </button>
                    </div>
                  </div>
                )
              )}
            </Card>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl border border-danger bg-[rgba(255,23,68,0.05)] text-danger text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
