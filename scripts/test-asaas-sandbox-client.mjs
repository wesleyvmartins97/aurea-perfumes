import assert from 'node:assert/strict';
import {createAsaasSandboxCardClient} from '../src/payments/asaas-sandbox-client.mjs';

assert.throws(() => createAsaasSandboxCardClient({}), /credencial/);
const requests = [];
const fakeFetch = async (url, init) => {
  requests.push({url, init});
  return Response.json({data:[]});
};
const client = createAsaasSandboxCardClient({ASAAS_SANDBOX_API_KEY:'sandbox-test-key-only-123456789'}, fakeFetch);
assert.deepEqual(await client.checkConnection(), {ok:true,environment:'sandbox'});
assert.equal(requests.length,1);
assert.equal(requests[0].url,'https://api-sandbox.asaas.com/v3/customers?limit=1');
assert.equal(requests[0].init.method,'GET');
assert.equal(requests[0].init.headers.access_token,'sandbox-test-key-only-123456789');
assert.ok(!('createPayment' in client));
assert.ok(!('newTokenizedCard' in client));
await assert.rejects(client.getPayment('!'), /inválido/);
assert.equal(requests.length,1);
console.log('ASAAS SANDBOX: URL isolada, autenticação e operações somente leitura PASS');
