// Public Android test distribution. No customer data or signing secrets belong here.
import { APK_SHA256 } from './android-apk.mjs';
const ROOT='/api/app/';
const VERSION='2.0.0';
import { appClient } from './app-promo-client.mjs';
export { appClient };
function installer(){return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>App Valenza Parfums</title><style>body{margin:0;background:#370f24;color:#f8f1e7;font:16px/1.6 system-ui,sans-serif}main{max-width:560px;margin:auto;padding:36px 24px}img{display:block;width:130px;height:120px;margin:auto}h1{text-align:center;color:#d8bc80;font:32px Georgia}small{color:#dccfce}section{background:#fff8ee0b;border:1px solid #d8bc8044;border-radius:20px;padding:22px;margin:20px 0}a{color:#ead3a2}a.download{display:block;padding:16px;background:#d8bc80;color:#370f24;border-radius:14px;text-align:center;text-decoration:none;font-weight:700}h2{font-size:20px}code{font-size:11px;overflow-wrap:anywhere}button{font:inherit}</style><main><img src="/brand/valenza-symbol.svg" alt="V com diamante — Valenza"><h1>Valenza Parfums</h1><p style="text-align:center">Seu universo de fragrâncias, em um app.</p><section><h2>Aplicativo Android</h2><p>Telas Android próprias, abertura cinematográfica e som original com opção de silenciar. Consulte o catálogo sem entrar. Para comprar ou acompanhar seus pedidos, use sua conta da loja.</p><a class="download" href="/api/app/download">Baixar app Valenza · Android 8 ou superior</a><p><small>Versão ${VERSION}. O Android pode pedir autorização para instalar aplicativos deste site e apresentar avisos de segurança. A assinatura do APK não elimina esses avisos. Não desative as proteções do aparelho.</small></p></section><section><h2>A loja e o app juntos</h2><p>Catálogo, preços e sua conta usam o mesmo sistema da loja. Catálogo e preços são atualizados pelo sistema da loja. As telas são próprias do aplicativo Android. Novas funções do aplicativo Android podem exigir uma atualização. Catálogo salvo para consulta sem internet; login, compra e confirmação precisam de conexão. O checkout de cartão abre no navegador seguro da loja.</p><p><strong>No iPhone:</strong> este APK não instala. Continue usando a loja no Safari e a opção Adicionar à Tela de Início.</p></section><details><summary>Verificar o arquivo</summary><p>SHA-256:</p><code>${APK_SHA256}</code><p><small>Toque de abertura original, composto por síntese original para este projeto. Sem gravações ou músicas de terceiros.</small></p></details><p><a href="/">← Voltar para a loja</a></p></main></html>`;}
export async function androidRoute(request,env){
  const path=new URL(request.url).pathname;if(!path.startsWith(ROOT))return null;
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex'};
  if(!['GET','HEAD'].includes(request.method))return new Response('Método não permitido',{status:405,headers:{...headers,Allow:'GET, HEAD'}});
  let body,type;
  if(path===ROOT+'client.js'){body=appClient;type='text/javascript; charset=utf-8';}
  else if(path===ROOT+'install'){body=installer();type='text/html; charset=utf-8';headers['Content-Security-Policy']="default-src 'self'; style-src 'unsafe-inline'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'";}
  else if(path===ROOT+'version'){body=JSON.stringify({version:VERSION,versionCode:2,sha256:APK_SHA256,download:'/api/app/download'});type='application/json';}
  else if(path===ROOT+'download'){
    const asset=await env.ASSETS.fetch(new Request(new URL('/downloads/Valenza-Parfums.apk',request.url),{method:request.method}));
    if(!asset.ok)return new Response('Download temporariamente indisponível. Tente novamente.',{status:503,headers});
    const output=new Headers(asset.headers);for(const [k,v]of Object.entries(headers))output.set(k,v);output.set('Content-Type','application/vnd.android.package-archive');output.set('Content-Disposition','attachment; filename="Valenza-Parfums.apk"');
    return new Response(request.method==='HEAD'?null:asset.body,{status:asset.status,headers:output});
  }else return new Response('Não encontrado',{status:404,headers});
  headers['Content-Type']=type;
  return new Response(request.method==='HEAD'?null:body,{headers});
}
export function addAndroidInstall(response){
  if(!response.headers.get('Content-Type')?.includes('text/html')||response.status!==200)return response;
  return new HTMLRewriter().on('body',{element(el){el.append('<script src="/api/app/client.js" defer></script>',{html:true});}}).transform(response);
}
