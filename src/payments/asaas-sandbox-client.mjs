// Sandbox-only Asaas adapter. Never import this module into the public Worker routes.
// The secret ASAAS_SANDBOX_API_KEY is for the sandbox, not production.
const BASE = 'https://api-sandbox.asaas.com/v3';
const safeId = x => typeof x === 'string' && /^[A-Za-z0-9_-]{6,160}$/.test(x);

export function createAsaasSandboxCardClient(env, fetcher = fetch) {
  const key = env?.ASAAS_SANDBOX_API_KEY;
  if (typeof key !== 'string' || key.length < 15) {
    throw new Error('Sandbox Asaas sem credencial de testes.');
  }
  async function request(method, path, body) {
    if (!['GET', 'POST'].includes(method) || !/^\/(customers|payments)(\/|\?|$)/.test(path)) {
      throw new TypeError('Operação Sandbox não autorizada.');
    }
    const response = await fetcher(BASE + path, {
      method,
      headers: {
        access_token: key,
        accept: 'application/json',
        'content-type': 'application/json',
        'user-agent': 'ValenzaParfums-Sandbox/1.0'
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error('Asaas Sandbox rejeitou a operação.');
      error.status = response.status;
      throw error;
    }
    return data;
  }
  return Object.freeze({
    // Safe first connectivity check: does not create customers or payments.
    async checkConnection() {
      const data = await request('GET', '/customers?limit=1');
      if (!data || !Array.isArray(data.data)) throw new Error('Resposta Sandbox inesperada.');
      return { ok: true, environment: 'sandbox' };
    },
    async getPayment(id) {
      if (!safeId(id)) throw new TypeError('ID de cobrança inválido.');
      return request('GET', '/payments/' + encodeURIComponent(id));
    },
    // Deliberately no create-payment or raw-card methods until PCI/capture approved.
  });
}
