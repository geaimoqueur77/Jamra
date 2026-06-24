import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Web Push via VAPID — send raw push using fetch + JWT
async function sendWebPush(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }, payload: string, vapidPublicKey: string, vapidPrivateKey: string, vapidSubject: string) {
  // Build VAPID JWT
  const audienceUrl = new URL(subscription.endpoint);
  const audience = `${audienceUrl.protocol}//${audienceUrl.host}`;
  const now = Math.floor(Date.now() / 1000);
  const claims = { aud: audience, exp: now + 12 * 3600, sub: vapidSubject };

  const header = btoa(JSON.stringify({ typ: 'JWT', alg: 'ES256' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const body = btoa(JSON.stringify(claims)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signingInput = `${header}.${body}`;

  // Import VAPID private key
  const rawKey = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: { name: 'SHA-256' } }, cryptoKey, new TextEncoder().encode(signingInput));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = `${signingInput}.${sigB64}`;

  // Encrypt payload (simplified: send as plain text with content-encoding identity for now)
  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `vapid t=${jwt},k=${vapidPublicKey}`,
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aesgcm',
      'TTL': '86400',
    },
    body: new TextEncoder().encode(payload),
  });

  return res.status;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:contact@jamra.app';

    const body = await req.json();
    const { user_id, notification } = body;

    // Récupère les subscriptions du user (ou tous si pas de user_id)
    let query = supabase.from('push_subscriptions').select('subscription, user_id');
    if (user_id) query = query.eq('user_id', user_id);
    const { data: subs, error } = await query;

    if (error) throw error;
    if (!subs || subs.length === 0) return new Response(JSON.stringify({ sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const payload = JSON.stringify({
      title: notification.title || 'Jamra',
      body: notification.body || '💪 Ton coach t\'a envoyé un message',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: notification.tag || 'jamra-push',
      url: notification.url || '/',
    });

    let sent = 0, failed = 0;
    await Promise.all(subs.map(async (row: { subscription: { endpoint: string; keys: { p256dh: string; auth: string } }; user_id: string }) => {
      try {
        const status = await sendWebPush(row.subscription, payload, vapidPublicKey, vapidPrivateKey, vapidSubject);
        if (status >= 200 && status < 300) sent++;
        else if (status === 410 || status === 404) {
          // Subscription expirée — on la supprime
          await supabase.from('push_subscriptions').delete().eq('user_id', row.user_id);
          failed++;
        } else {
          failed++;
        }
      } catch { failed++; }
    }));

    return new Response(JSON.stringify({ sent, failed }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
