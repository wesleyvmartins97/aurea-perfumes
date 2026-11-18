import {SCENARIOS,interpretHuman} from './valenza-context-human-lab.mjs';
/**
 * Valenza IA Ultra laboratory - read-only event planning, no Meta outbound calls.
 * ESM; Cloudflare Worker compatible. All identifiers in this file are synthetic.
 */
export const LAB_VERSION = '2026-11-18.2';
export const DEMO_ACCOUNT = '17841400000000123';
export const DEMO_MEDIA = '17900000000000001';
export const DEMO_PROFILE = '17841400000000200';
export const DEMO_PRODUCT = Object.freeze({
  name: 'Sabah Al Ward Pearl',
  url: 'https://www.valenzaparfums.com.br/perfume/sabah-al-ward-pearl/'
});

const FIELDS = new Set(['comments']);
const KEYWORDS = new Set(['quero', 'preco', 'valor', 'link', 'comprar']);
const NEGATIVE = /\b(?:nao|nunca|jamais|nem)\s+(?:\w+\s+){0,2}(?:quero|comprar)\b/u;
const MAX_EVENTS = 30;

function normalize(text) {
  return String(text ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
export function keywordIntent(text) {
  if (typeof text !== 'string' || text.length > 500) return null;
  const normalized = normalize(text);
  if (NEGATIVE.test(normalized)) return null;
  const words = normalized.match(/[a-z0-9]+/g) || [];
  const match = words.find(word => KEYWORDS.has(word));
  return match || null;
}

function numericId(value) { return typeof value === 'string' && /^\d{8,30}$/.test(value); }
function isReel(value) {
  return ['REELS', 'REEL'].includes(String(value || '').toUpperCase());
}
function isRecent(timestampSeconds, nowMs) {
  const seconds = Number(timestampSeconds);
  return Number.isFinite(seconds) && seconds > 0 &&
    nowMs - seconds * 1000 >= -300_000 && nowMs - seconds * 1000 <= 7 * 86_400_000;
}
function urlInOfficialStore(product) {
  try {
    const url = new URL(product.url);
    return url.protocol === 'https:' && url.hostname === 'www.valenzaparfums.com.br';
  } catch { return false; }
}

/** Only identifies opportunities. Never sends DMs, reposts, or modifies the existing AI. */
export function planInstagramEvents(webhook, config) {
  const nowMs = config?.nowMs ?? Date.now();
  const mediaMap = config?.mediaMap || {};
  const accountId = config?.accountId;
  if (!numericId(accountId)) throw new Error('Account id missing');
  if (webhook?.object !== 'instagram' || !Array.isArray(webhook.entry)) return [];
  const plans = [];
  for (const entry of webhook.entry.slice(0, MAX_EVENTS)) {
    if (String(entry?.id) !== accountId || !isRecent(entry?.time, nowMs)) continue;
    for (const change of (Array.isArray(entry?.changes) ? entry.changes : []).slice(0, MAX_EVENTS)) {
      if (!FIELDS.has(change?.field)) continue;
      const c = change?.value || {};
      const commentId = String(c.id ?? '');
      const mediaId = String(c.media?.id ?? '');
      const senderId = String(c.from?.id ?? '');
      const product = mediaMap[mediaId];
      if (!numericId(commentId) || !numericId(mediaId) || !numericId(senderId) || senderId === accountId) continue;
      if (!product || !urlInOfficialStore(product) || !isReel(c.media?.media_product_type)) continue;
      if (c.parent_id) continue;  // avoid reacting to threads and bot replies
      const intent = keywordIntent(c.text);
      if (!intent) continue;
      plans.push({
        kind: 'comment_private_reply_candidate',
        status: 'SIMULATED_ONLY',
        idempotency_key: accountId + ':' + mediaId + ':' + commentId,
        account_id: accountId,
        media_id: mediaId,
        comment_id: commentId,
        sender_id: senderId,
        keyword: intent,
        product: product.name,
        product_url: product.url,
        preview: 'Oi! 💖 Vi seu interesse no ' + product.name + '. Aqui está o link oficial: ' + product.url,
        handoff: 'EXISTING_VALENZA_DIRECT_AI_ONLY_AFTER_USER_REPLIES'
      });
    }
  }
  return plans;
}

export function demoWebhook(commentId = '18000000000000123', text = 'QUERO') {
  return {
    object: 'instagram',
    entry: [{id: DEMO_ACCOUNT, time: Math.floor(Date.now() / 1000), changes: [{
      field: 'comments', value: {
        id: commentId, text,
        from: {id: DEMO_PROFILE, username: 'cliente_ficticio'},
        media: {id: DEMO_MEDIA, media_product_type: 'REELS'}
      }
    }]}]
  };
}

const headers = {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'access-control-allow-origin': 'none'};
function json(body, status = 200) { return new Response(JSON.stringify(body, null, 2), {status, headers}); }
const sampleConfig = () => ({accountId: DEMO_ACCOUNT, mediaMap: {[DEMO_MEDIA]: DEMO_PRODUCT}});

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (request.method === 'GET' && path === '/humanized/cases') return json({scenarios:Object.entries(SCENARIOS).map(([id,comment])=>({id,comment})),dry_run:true,real_dm_sending:false});
    if (request.method === 'GET' && path === '/humanized') {
      const type=new URL(request.url).searchParams.get('case')||'calor';
      if (!Object.hasOwn(SCENARIOS,type)) return json({error:'UNKNOWN_SCENARIO',allowed:Object.keys(SCENARIOS)},400);
      const decision=await interpretHuman(SCENARIOS[type],env.AI,type==='memoria'?{priorDM:true}:{});
      return json({contextual:true,dry_run:true,scenario:type,comment:SCENARIOS[type],decision,live_instagram_connected:false,real_dm_sending:false,production_modified:false});
    }
    if (request.method === 'GET' && path === '/health') return json({
      system: 'Valenza IA Ultra LAB', version: LAB_VERSION, status: 'ready', environment: 'isolated', contextual_ai_available: !!env.AI,
      live_instagram_connected: false, real_dm_sending: false, production_modified: false,
      next: 'Confirm Meta comment webhook entitlement and connect to existing AI only after safety review'
    });
    if (request.method === 'GET' && path === '/demo') {
      const one = planInstagramEvents(demoWebhook(), sampleConfig());
      const neg = planInstagramEvents(demoWebhook('18000000000000999', 'não quero'), sampleConfig());
      return json({dry_run: true, example: 'Reel comment QUERO', candidates: one, ignore_negative: neg.length === 0,
        sample_only: 'No customer message sent and no real Instagram account accessed'});
    }
    if (request.method === 'POST' && path === '/webhooks/valenza-direct') {
      return json({error: 'LAB_WEBHOOK_DISABLED', why: 'Only existing production webhook receives real Meta events'}, 403);
    }
    return json({error: 'Not found', endpoints: ['/health', '/demo']}, 404);
  }
};
