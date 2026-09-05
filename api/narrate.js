/**
 * Vercel Edge Function — /api/narrate
 *
 * Acts as a server-side proxy to the Anthropic API so that:
 *   1. The API key is never exposed in browser network tabs.
 *   2. CORS is handled cleanly (Anthropic blocks direct browser calls).
 *
 * The client POSTs:  { prompt: string, apiKey: string }
 * This function forwards to Anthropic and streams the text back.
 *
 * Deploy: `vercel deploy` — this file is auto-detected as a serverless function.
 */

export const config = { runtime: 'edge' };

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL         = 'claude-sonnet-4-5';
const MAX_TOKENS    = 400;

export default async function handler(req) {
  // ── CORS preflight ──────────────────────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { prompt, apiKey } = body;

  if (!prompt || typeof prompt !== 'string') {
    return json({ error: 'Missing or invalid "prompt" field' }, 400);
  }

  // Resolve API key: body > env var (prefer env var in production)
  const key = process.env.ANTHROPIC_API_KEY || apiKey;
  if (!key || !key.startsWith('sk-ant')) {
    return json({ error: 'No valid Anthropic API key provided' }, 401);
  }

  // ── Call Anthropic ──────────────────────────────────────────────────────────
  let anthropicRes;
  try {
    anthropicRes = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: MAX_TOKENS,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });
  } catch (err) {
    return json({ error: `Failed to reach Anthropic: ${err.message}` }, 502);
  }

  // ── Forward response ────────────────────────────────────────────────────────
  const data = await anthropicRes.json();

  if (!anthropicRes.ok) {
    return json(
      { error: data?.error?.message || 'Anthropic returned an error' },
      anthropicRes.status
    );
  }

  return json(data, 200);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}
