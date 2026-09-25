const jsonHeaders = {
  "Content-Type": "application/json; charset=UTF-8",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: jsonHeaders });
    if (url.pathname === "/api/health" && request.method === "GET") return resposta({ ok: true, service: "aurea-perfumes", timestamp: new Date().toISOString() });
    if (url.pathname === "/api/frete" && request.method === "POST") return calcularFrete(request, env);
    if (url.pathname === "/api/pagamento" && request.method === "POST") return criarPagamentoPix(request, env);
    if (url.pathname.startsWith("/api/pagamento/") && request.method === "GET") return consultarPagamento(url.pathname.slice("/api/pagamento/".length).trim(), env);
    if (env.ASSETS) return servirAssets(request, env);
    return new Response("AURÉA", { status: 404, headers: { "Content-Type": "text/plain; charset=UTF-8" } });
  }
};
async function servirAssets(request, env) {
  const response = await env.ASSETS.fetch(request);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html") || new URL(request.url).pathname !== "/") return response;
  const html = await response.text();
  const injected = html.replace(/<\/body>/i, '<script src="/catalog.js" defer></script><script src="/aurea-v2.js" defer></script><script src="/aurea-v2-fix.js" defer></script></body>');
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store, max-age=0");
  return new Response(injected, { status: response.status, statusText: response.statusText, headers });
}
async function calcularFrete(request, env) {
  try {
    const dados = await request.json(); const cep = String(dados.cep || "").replace(/\D/g, "");
    if (!/^\d{8}$/.test(cep)) return resposta({ ok: false, error: "CEP inválido." }, 400);
    if (!env.MELHOR_ENVIO_TOKEN || !env.AUREA_ORIGIN_CEP) return resposta({ ok: false, error: "Serviço de frete temporariamente indisponível." }, 503);
    const produtos = Array.isArray(dados.produtos) && dados.produtos.length ? dados.produtos : [dados.produto || {}];
    const itens = produtos.map((p, index) => ({ id: String(p.id || `aurea-${index + 1}`), width: saneDim(p.largura || p.width, 12), height: saneDim(p.altura || p.height, 12), length: saneDim(p.comprimento || p.length, 20), weight: saneDim(p.peso || p.weight, 0.6), insurance_value: Math.max(0, Number(p.valor ?? p.price ?? 0)), quantity: Math.max(1, Math.floor(Number(p.quantidade ?? p.qty ?? 1))) }));
    const upstream = await fetch("https://melhorenvio.com.br/api/v2/me/shipment/calculate", { method: "POST", headers: { Authorization: `Bearer ${env.MELHOR_ENVIO_TOKEN}`, Accept: "application/json", "Content-Type": "application/json", "User-Agent": "AUREA Perfumes/1.0" }, body: JSON.stringify({ from: { postal_code: String(env.AUREA_ORIGIN_CEP).replace(/\D/g, "") }, to: { postal_code: cep }, products: itens }) });
    const raw = await upstream.text(); let data; try { data = JSON.parse(raw); } catch { data = null; }
    if (!upstream.ok) return resposta({ ok: false, error: "Não foi possível calcular o frete agora." }, upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502);
    const fretes = Array.isArray(data) ? data.filter(x => x && (x.price != null || x.custom_price != null)).map(x => ({ id: x.id ?? null, company: x.company?.name || x.company || "Transportadora", name: x.name || "Frete", price: Number(x.custom_price ?? x.price ?? 0), delivery_time: Number(x.custom_delivery_time ?? x.delivery_time ?? 0) })).filter(x => Number.isFinite(x.price) && x.price >= 0) : [];
    return resposta({ ok: true, fretes });
  } catch (e) { console.error("Frete:", e); return resposta({ ok: false, error: "Erro interno ao calcular o frete." }, 500); }
}
function saneDim(value, fallback) { const n = Number(value); return Number.isFinite(n) && n > 0 ? n : fallback; }
async function criarPagamentoPix(request, env) {
  try {
    if (!env.MERCADOPAGO_ACCESS_TOKEN) return resposta({ ok: false, error: "Pagamento temporariamente indisponível." }, 503);
    const dados = await request.json(); const nome = String(dados.name || "").trim(); const email = String(dados.email || "").trim().toLowerCase(); const cpf = String(dados.cpf || "").replace(/\D/g, ""); const telefone = String(dados.phone || "").replace(/\D/g, ""); const total = Number(dados.total);
    if (String(dados.paymentMethod || "").toLowerCase() !== "pix") return resposta({ ok: false, error: "Método de pagamento não disponível." }, 400);
    if (nome.length < 3) return resposta({ ok: false, error: "Informe seu nome completo." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return resposta({ ok: false, error: "Informe um e-mail válido." }, 400);
    if (!cpfValido(cpf)) return resposta({ ok: false, error: "Informe um CPF válido." }, 400);
    if (!Number.isFinite(total) || total <= 0 || total > 100000) return resposta({ ok: false, error: "Valor do pedido inválido." }, 400);
    const partes = nome.split(/\s+/).filter(Boolean); const referencia = `AUREA-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
    const payload = { transaction_amount: Number(total.toFixed(2)), description: `Pedido AURÉA Perfumes - ${referencia}`, payment_method_id: "pix", external_reference: referencia, payer: { email, first_name: partes[0], last_name: partes.slice(1).join(" ") || "AUREA", identification: { type: "CPF", number: cpf } } };
    if (telefone.length >= 10) payload.payer.phone = { area_code: telefone.slice(0, 2), number: telefone.slice(2) };
    const mp = await fetch("https://api.mercadopago.com/v1/payments", { method: "POST", headers: { Authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`, "Content-Type": "application/json", Accept: "application/json", "X-Idempotency-Key": referencia }, body: JSON.stringify(payload) });
    const raw = await mp.text(); let result; try { result = JSON.parse(raw); } catch { result = {}; }
    if (!mp.ok) { console.error("Mercado Pago:", JSON.stringify(result)); return resposta({ ok: false, error: "O Mercado Pago não autorizou a criação do pagamento." }, mp.status >= 400 && mp.status < 600 ? mp.status : 502); }
    const qr = result?.point_of_interaction?.transaction_data || {};
    return resposta({ ok: true, orderId: result.id ?? null, paymentId: result.id ?? null, status: result.status ?? "pending", statusDetail: result.status_detail ?? null, amount: total.toFixed(2), qrCode: qr.qr_code || "", qrCodeBase64: qr.qr_code_base64 || "", ticketUrl: qr.ticket_url || "", externalReference: referencia });
  } catch (e) { console.error("Pagamento:", e); return resposta({ ok: false, error: "Erro interno ao criar o pagamento." }, 500); }
}
async function consultarPagamento(orderId, env) {
  if (!orderId || !/^\d+$/.test(orderId)) return resposta({ ok: false, error: "ID de pagamento inválido." }, 400);
  if (!env.MERCADOPAGO_ACCESS_TOKEN) return resposta({ ok: false, error: "Pagamento temporariamente indisponível." }, 503);
  try { const mp = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(orderId)}`, { headers: { Authorization: `Bearer ${env.MERCADOPAGO_ACCESS_TOKEN}`, Accept: "application/json" } }); const raw = await mp.text(); let result; try { result = JSON.parse(raw); } catch { result = {}; } if (!mp.ok) return resposta({ ok: false, error: "Não foi possível consultar o pagamento." }, mp.status >= 400 && mp.status < 600 ? mp.status : 502); return resposta({ ok: true, orderId: result.id ?? orderId, status: result.status ?? null, statusDetail: result.status_detail ?? null, paymentId: result.id ?? null }); } catch (e) { return resposta({ ok: false, error: "Erro ao consultar pagamento." }, 500); }
}
function cpfValido(cpf) { if (!/^\d{11}$/.test(cpf) || /^([0-9])\1+$/.test(cpf)) return false; let sum = 0; for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i); let d1 = (sum * 10) % 11; if (d1 === 10) d1 = 0; if (d1 !== Number(cpf[9])) return false; sum = 0; for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i); let d2 = (sum * 10) % 11; if (d2 === 10) d2 = 0; return d2 === Number(cpf[10]); }
function resposta(dados, status = 200) { return new Response(JSON.stringify(dados), { status, headers: jsonHeaders }); }
