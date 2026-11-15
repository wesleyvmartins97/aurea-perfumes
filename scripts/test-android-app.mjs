import assert from 'node:assert/strict';import{createHash}from'node:crypto';import{readFile}from'node:fs/promises';import vm from'node:vm';import{androidRoute,appClient}from'../src/android-app.mjs';
const origin='https://www.valenzaparfums.com.br',file=await readFile(new URL('../public/downloads/Valenza-Parfums.apk',import.meta.url));
const env={ASSETS:{async fetch(r){assert.equal(new URL(r.url).pathname,'/downloads/Valenza-Parfums.apk');return new Response(r.method==='HEAD'?null:file,{headers:{'Content-Length':String(file.length)}});}}};
const version=await(await androidRoute(new Request(origin+'/api/app/version'),env)).json();
const apk=await androidRoute(new Request(origin+'/api/app/download'),env),bytes=new Uint8Array(await apk.arrayBuffer());
assert.equal(createHash('sha256').update(bytes).digest('hex'),version.sha256);assert.equal(version.version,'2.1.0');assert.equal(version.versionCode,3);
assert.equal(apk.headers.get('Content-Type'),'application/vnd.android.package-archive');assert.equal(apk.headers.get('Content-Disposition'),'attachment; filename="Valenza-Parfums.apk"');assert.equal(bytes[0],0x50);assert.equal(bytes[1],0x4b);
assert.equal((await androidRoute(new Request(origin+'/api/app/download',{method:'HEAD'}),env)).body,null);
assert.equal((await androidRoute(new Request(origin+'/api/app/download',{method:'POST'}),env)).status,405);
assert.equal(await androidRoute(new Request(origin+'/api/auth/me'),env),null);
new vm.Script(appClient);assert.ok(!appClient.includes('versão de teste'));assert.ok(!appClient.includes('Teste.apk'));
new vm.Script(appClient).runInNewContext({window:{},navigator:{userAgent:'ValenzaNative/2.0 Android'}}); // native app must not see installation UI
const html=await(await androidRoute(new Request(origin+'/api/app/install'),env)).text();assert.match(html,/não instala/);assert.match(html,/avisos de segurança/);assert.ok(!html.includes('APK de teste'));
const java=await readFile(new URL('../android/src/br/com/valenzaparfums/app/MainActivity.java',import.meta.url),'utf8'),client=await readFile(new URL('../android/src/br/com/valenzaparfums/app/NativeStore.java',import.meta.url),'utf8'),cinema=await readFile(new URL('../android/src/br/com/valenzaparfums/app/CinemaIntro.java',import.meta.url),'utf8');
assert.doesNotMatch(java,/android\.webkit|new WebView|evaluateJavascript|addJavascriptInterface/);assert.match(client,/AndroidKeyStore/);assert.match(client,/AES\/GCM\/NoPadding/);assert.match(client,/setInstanceFollowRedirects\(false\)/);assert.doesNotMatch(client,/setHostnameVerifier|setSSLSocketFactory/);assert.match(cinema,/setDuration\(3200\)/);
const manifest=await readFile(new URL('../android/AndroidManifest.xml',import.meta.url),'utf8');assert.match(manifest,/versionCode="3" android:versionName="2\.1\.0"/);assert.match(manifest,/usesCleartextTraffic="false"/);assert.deepEqual([...manifest.matchAll(/uses-permission android:name="([^"]+)"/g)].map(m=>m[1]),['android.permission.INTERNET']);
const catalog=JSON.parse(await readFile(new URL('../android/assets/catalog.json',import.meta.url),'utf8'));assert.ok(catalog.length>=70);assert.ok(file.length>2500000);
console.log('Android 2.1: native-only UI, encrypted session, offline catalogue, APK hash/name, routes and cinematic intro passed.');
