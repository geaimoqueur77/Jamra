// Supabase Edge Function — Strava OAuth + sync manuel
// Mode 1 : { code } → échange OAuth, stocke tokens, sync initial 30 activités
// Mode 2 : { action: 'sync' } → refresh token si expiré, sync 50 dernières activités

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STRAVA_CLIENT_ID = Deno.env.get('STRAVA_CLIENT_ID')!;
const STRAVA_CLIENT_SECRET = Deno.env.get('STRAVA_CLIENT_SECRET')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'unauthenticated' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) return json({ error: 'invalid token' }, 401);

    // ── Mode 1 : OAuth initial ─────────────────────────────────────────────
    if (body.code) {
      const tokenData = await stravaTokenExchange('authorization_code', { code: body.code });
      if (!tokenData) return json({ error: 'strava_token_failed' }, 400);

      const { access_token, refresh_token, expires_at, athlete } = tokenData;

      await supabase.from('strava_connections').upsert({
        profile_id: user.id,
        strava_athlete_id: athlete.id,
        access_token,
        refresh_token,
        expires_at: new Date(expires_at * 1000).toISOString(),
        scope: body.scope || 'activity:read',
        firstname: athlete.firstname,
        lastname: athlete.lastname,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' });

      await supabase.from('profiles').update({ strava_connected: true }).eq('id', user.id);

      const count = await syncActivities(supabase, user.id, access_token, 30);

      return json({ success: true, athlete_name: `${athlete.firstname} ${athlete.lastname}`, synced: count });
    }

    // ── Mode 2 : sync manuel ───────────────────────────────────────────────
    if (body.action === 'sync') {
      const { data: conn } = await supabase
        .from('strava_connections')
        .select('access_token, refresh_token, expires_at')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (!conn) return json({ error: 'not_connected' }, 400);

      let access_token = conn.access_token;

      // Refresh token si expiré (avec 60s de marge)
      if (new Date(conn.expires_at).getTime() < Date.now() + 60_000) {
        const refreshed = await stravaTokenExchange('refresh_token', { refresh_token: conn.refresh_token });
        if (refreshed) {
          access_token = refreshed.access_token;
          await supabase.from('strava_connections').update({
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token,
            expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('profile_id', user.id);
        }
      }

      const count = await syncActivities(supabase, user.id, access_token, 50);

      await supabase.from('strava_connections').update({
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('profile_id', user.id);

      return json({ success: true, synced: count });
    }

    return json({ error: 'unknown action' }, 400);

  } catch (err) {
    console.error(err);
    return json({ error: String(err?.message ?? err) }, 500);
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function stravaTokenExchange(grantType: string, params: Record<string, string>) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: STRAVA_CLIENT_ID, client_secret: STRAVA_CLIENT_SECRET, grant_type: grantType, ...params }),
  });
  if (!res.ok) { console.error('Strava token error:', await res.text()); return null; }
  return await res.json();
}

// deno-lint-ignore no-explicit-any
async function syncActivities(supabase: any, profileId: string, accessToken: string, perPage = 30): Promise<number> {
  const res = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return 0;
  const activities = await res.json();
  if (!Array.isArray(activities) || activities.length === 0) return 0;

  // deno-lint-ignore no-explicit-any
  const rows = activities.map((a: Record<string, any>) => ({
    id: a.id,
    profile_id: profileId,
    start_date: a.start_date,
    type: a.type,
    sport_type: a.sport_type,
    name: a.name,
    distance_m: a.distance,
    moving_time_s: a.moving_time,
    elapsed_time_s: a.elapsed_time,
    total_elevation_gain_m: a.total_elevation_gain,
    average_heartrate: a.average_heartrate,
    max_heartrate: a.max_heartrate,
    average_speed_mps: a.average_speed,
    kilojoules: a.kilojoules,
    calories: a.calories,
    has_heartrate: a.has_heartrate,
    avg_pace_sec_per_km:
      a.average_speed > 0 && (a.type === 'Run' || a.sport_type === 'Run')
        ? Math.round(1000 / a.average_speed)
        : null,
    raw: a,
    updated_at: new Date().toISOString(),
  }));

  await supabase.from('strava_activities').upsert(rows, { onConflict: 'id' });
  return rows.length;
}
