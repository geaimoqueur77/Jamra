/**
 * Vercel Serverless Function — Callback OAuth Strava
 *
 * Reçoit le `code` renvoyé par Strava après autorisation, l'échange
 * contre un access_token + refresh_token via l'API Strava, puis renvoie
 * les données au client qui les persistera en base (via Supabase avec RLS).
 *
 * Pourquoi on persiste côté client et pas serveur :
 *   - Éviter de passer la service_role key au serverless
 *   - La RLS Supabase garantit que chaque user ne peut toucher que ses tokens
 *   - Le client est déjà authentifié, il a son JWT pour taper Supabase
 *
 * Route : POST /api/strava/callback
 * Body : { code: string }
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Missing code' });

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Strava credentials not configured on server' });
  }

  try {
    const resp = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: 'Strava token exchange failed', details: text });
    }

    const data = await resp.json();

    // On renvoie un payload propre au client qui le stockera
    return res.status(200).json({
      athlete_id: data.athlete?.id,
      firstname: data.athlete?.firstname || null,
      lastname: data.athlete?.lastname || null,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: new Date(data.expires_at * 1000).toISOString(),
      scope: data.scope || null,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Unexpected error', details: err.message });
  }
}
