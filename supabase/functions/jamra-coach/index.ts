// Supabase Edge Function — Jamra Coach (Anthropic claude-sonnet-4-6)
// Reçoit : { type: 'workout' | 'weekly' | 'freeform', payload, userContext }
// Renvoie : { message: string }
// Si ANTHROPIC_API_KEY absent : retourne un mock contextuel.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Tu es le coach personnel de Ghali, 24 ans, 1m95.
Objectif : passer de 100kg/30%MG à 82-84kg/12%MG pour le Marathon de Paris le 11 avril 2027.
Plan actuel : PPL (Push/Pull/Legs) 3x/semaine + course 30km/semaine en zone 2 (130-145 bpm).
Tu as accès à ses données réelles (séances, poids, activités Strava, mensurations).
Ton rôle : analyser, encourager avec justesse, corriger sans condescendance, proposer des ajustements précis.
Réponse courte et directe — max 150 mots sauf si demande détaillée. Pas de markdown.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'unauthenticated' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) return json({ error: 'invalid token' }, 401);

    const { type, payload, userContext } = await req.json();
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

    // ── Mode mock si pas de clé ────────────────────────────────────────────
    if (!apiKey) {
      return json({ message: getMockResponse(type, payload), mock: true });
    }

    // ── Build message utilisateur ──────────────────────────────────────────
    const userMessage = buildUserMessage(type, payload, userContext);

    // ── Appel Anthropic ────────────────────────────────────────────────────
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Anthropic error:', err);
      return json({ error: 'anthropic_error', detail: err }, 502);
    }

    const data = await res.json();
    const message = data.content?.[0]?.text ?? '';
    return json({ message });

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

function buildUserMessage(
  type: string,
  // deno-lint-ignore no-explicit-any
  payload: Record<string, any>,
  // deno-lint-ignore no-explicit-any
  ctx: Record<string, any>,
): string {
  const ctxLine = ctx
    ? `Contexte actuel : poids ${ctx.last_weight?.value ?? '?'}kg, ` +
      `semaine: ${ctx.week_sessions ?? 0} séances / ${ctx.week_km ?? 0}km, ` +
      `streak: ${ctx.streak ?? 0}j, ` +
      `total graisse perdue: ${ctx.fat_burned_total_g ?? 0}g.`
    : '';

  if (type === 'workout') {
    const ex = (payload.exercises ?? [])
      .map((e: Record<string, string | number>) => `${e.name} ${e.volume_kg}kg vol (best: ${e.best_set})`)
      .join(', ');
    const prs = payload.prs?.length ? `PRs: ${payload.prs.join(', ')}. ` : '';
    return (
      `${ctxLine}\n\n` +
      `Analyse ma séance ${payload.type?.toUpperCase()} du ${payload.date} ` +
      `(${payload.duration_min} min, volume total ${payload.total_volume_kg}kg): ` +
      `${ex}. ${prs}Que retiens-tu ? Points forts, axes d'amélioration ?`
    );
  }

  if (type === 'weekly') {
    return (
      `${ctxLine}\n\n` +
      `Voici mon bilan de la semaine ${payload.week ?? ''}: ` +
      `${payload.sessions?.length ?? 0} séances muscu, ` +
      `${payload.week_km ?? 0}km de course, ` +
      `poids moyen ${payload.avg_weight ?? '?'}kg, ` +
      `déficit moyen ${payload.avg_deficit_kcal ?? '?'}kcal/j, ` +
      `${payload.fat_burned_g ?? 0}g de graisse estimée, ` +
      `streak ${payload.streak ?? 0}j. ` +
      `Analyse et donne-moi 2-3 axes concrets pour la semaine prochaine.`
    );
  }

  // freeform
  return `${ctxLine}\n\n${payload.message ?? ''}`;
}

function getMockResponse(type: string, payload: Record<string, unknown>): string {
  if (type === 'workout') {
    return `Bonne séance ${(payload.type as string)?.toUpperCase() ?? ''}. Volume solide, continue à progresser progressivement sur les charges. Clé API Anthropic non configurée — active-la dans les secrets Supabase pour obtenir une vraie analyse.`;
  }
  if (type === 'weekly') {
    return `Bilan de semaine reçu. La constance est là, c'est la base. Clé API Anthropic non configurée — active-la pour ton coaching personnalisé.`;
  }
  return `Question reçue. Clé API Anthropic non configurée — active-la dans les secrets Supabase (ANTHROPIC_API_KEY) pour obtenir des réponses de coaching.`;
}
