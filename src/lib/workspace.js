/**
 * Jamra — Gestion des workspaces (foyers famille) et invitations.
 *
 * Contrairement aux données nutritionnelles qui sont offline-first, les workspaces
 * sont purement online : les appels passent directement à Supabase. La RLS garantit
 * que chacun ne voit que ses propres workspaces et invitations.
 */

import { supabase } from './supabase';
import { db } from '../db/database';

// ==========================================================================
// LECTURE
// ==========================================================================

/**
 * Retourne le workspace de l'utilisateur courant (le 1er si plusieurs) + ses membres.
 */
export async function getMyWorkspace() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return null;

  // Récupérer les memberships de l'user
  const { data: memberships, error: memErr } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', userData.user.id);

  if (memErr) throw memErr;
  if (!memberships || memberships.length === 0) return null;

  const workspaceId = memberships[0].workspace_id;
  const myRole = memberships[0].role;

  // Récupérer le workspace
  const { data: workspace, error: wsErr } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single();

  if (wsErr) throw wsErr;

  // Récupérer tous les membres du workspace (avec leur profil pour afficher le nom)
  const { data: members, error: membersErr } = await supabase
    .from('workspace_members')
    .select('user_id, role, joined_at, profiles:user_id(nom)')
    .eq('workspace_id', workspaceId);

  if (membersErr) throw membersErr;

  // Enrichir avec les emails via auth.admin n'est pas dispo côté client (nécessite service_role).
  // On affiche donc juste le nom + date. L'email de l'owner/self on le récupère via auth.user.

  return {
    ...workspace,
    my_role: myRole,
    members: members || [],
  };
}

/**
 * Retourne les invitations en attente adressées à l'email de l'user courant.
 */
export async function getMyPendingInvitations() {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.email) return [];

  const { data, error } = await supabase
    .from('workspace_invitations')
    .select('id, workspace_id, invited_email, invited_by, status, created_at, workspaces:workspace_id(nom, owner_id)')
    .eq('invited_email', userData.user.email.toLowerCase())
    .eq('status', 'pending');

  if (error) throw error;
  return data || [];
}

/**
 * Liste les invitations pending envoyées pour un workspace donné.
 */
export async function getWorkspaceInvitations(workspaceId) {
  const { data, error } = await supabase
    .from('workspace_invitations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ==========================================================================
// CRÉATION / MODIFICATION WORKSPACE
// ==========================================================================

export async function createWorkspace(nom) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Non connecté');

  const userId = userData.user.id;

  // 1. Créer le workspace
  const { data: workspace, error: wsErr } = await supabase
    .from('workspaces')
    .insert({ nom: (nom || '').trim() || 'Mon foyer', owner_id: userId })
    .select()
    .single();

  if (wsErr) throw wsErr;

  // 2. Ajouter l'user comme owner
  const { error: memErr } = await supabase
    .from('workspace_members')
    .insert({ workspace_id: workspace.id, user_id: userId, role: 'owner' });

  if (memErr) throw memErr;

  // 3. Lier le profile au workspace
  await supabase
    .from('profiles')
    .update({ workspace_id: workspace.id })
    .eq('id', userId);

  // 4. Synchroniser le workspace_id en local (le pull va le récupérer aussi, mais on anticipe)
  const localProfile = await db.profil.get(1);
  if (localProfile) {
    await db.profil.update(1, { workspace_id: workspace.id, __from_remote: true });
  }

  return workspace;
}

export async function updateWorkspace(workspaceId, updates) {
  const { data, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', workspaceId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWorkspace(workspaceId) {
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId);

  if (error) throw error;
}

// ==========================================================================
// INVITATIONS
// ==========================================================================

export async function inviteMember(workspaceId, email) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Non connecté');

  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Email invalide');
  }

  // Refuser l'auto-invitation
  if (cleanEmail === userData.user.email?.toLowerCase()) {
    throw new Error('Tu ne peux pas t\'inviter toi-même');
  }

  const { data, error } = await supabase
    .from('workspace_invitations')
    .insert({
      workspace_id: workspaceId,
      invited_email: cleanEmail,
      invited_by: userData.user.id,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('Cet email a déjà été invité');
    throw error;
  }

  return data;
}

export async function revokeInvitation(invitationId) {
  const { error } = await supabase
    .from('workspace_invitations')
    .delete()
    .eq('id', invitationId);

  if (error) throw error;
}

export async function acceptInvitation(invitationId) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Non connecté');

  // 1. Récupérer l'invitation pour connaître le workspace
  const { data: invitation, error: invErr } = await supabase
    .from('workspace_invitations')
    .select('*')
    .eq('id', invitationId)
    .single();

  if (invErr) throw invErr;
  if (!invitation || invitation.status !== 'pending') {
    throw new Error('Invitation introuvable ou déjà traitée');
  }

  // 2. Créer le membership
  const { error: memErr } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: invitation.workspace_id,
      user_id: userData.user.id,
      role: 'member',
      invited_by: invitation.invited_by,
    });

  if (memErr) throw memErr;

  // 3. Marquer l'invitation comme acceptée
  await supabase
    .from('workspace_invitations')
    .update({ status: 'accepted' })
    .eq('id', invitationId);

  // 4. Lier le profile au workspace
  await supabase
    .from('profiles')
    .update({ workspace_id: invitation.workspace_id })
    .eq('id', userData.user.id);

  // 5. Synchro locale
  const localProfile = await db.profil.get(1);
  if (localProfile) {
    await db.profil.update(1, { workspace_id: invitation.workspace_id, __from_remote: true });
  }

  return { workspace_id: invitation.workspace_id };
}

export async function declineInvitation(invitationId) {
  const { error } = await supabase
    .from('workspace_invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId);

  if (error) throw error;
}

// ==========================================================================
// MEMBRES
// ==========================================================================

export async function leaveWorkspace(workspaceId) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Non connecté');

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userData.user.id);

  if (error) throw error;

  // Désolidariser le profile
  await supabase
    .from('profiles')
    .update({ workspace_id: null })
    .eq('id', userData.user.id);

  const localProfile = await db.profil.get(1);
  if (localProfile) {
    await db.profil.update(1, { workspace_id: null, __from_remote: true });
  }
}

export async function removeMember(workspaceId, userId) {
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId);

  if (error) throw error;

  // Désolidariser le profile du membre retiré
  await supabase
    .from('profiles')
    .update({ workspace_id: null })
    .eq('id', userId);
}
