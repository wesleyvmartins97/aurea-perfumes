const jsonHeaders={"Content-Type":"application/json; charset=UTF-8","Cache-Control":"no-store","Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type, Authorization","Access-Control-Allow-Methods":"GET, POST, OPTIONS","Strict-Transport-Security":"max-age=31536000; includeSubDomains"};

const PRODUCT_IMAGE_SOURCES={
 "/produto-img/asad-zanzibar.jpg":"https://cdn-shopkit.com/usercontent/arabiaperfumes/media/images/660bbd3-174337-asad-zanzibar-1-1080x1080.jpg",
 "/produto-img/asad-elixir.png":"https://www.perfumenz.co.nz/cdn/shop/files/lattafa-asad-elixir_1400x1400.png?v=1770958603"
};
async function productCatalogImage(request,path){
 const source=PRODUCT_IMAGE_SOURCES[path];if(!source)return new Response("Not Found",{status:404});
 const cache=caches.default,cacheKey=new Request(new URL(path,request.url).toString(),{method:"GET"});
 const hit=await cache.match(cacheKey);if(hit)return hit;
 try{
  const upstream=await fetch(source,{headers:{"User-Agent":"Mozilla/5.0 (compatible; VALENZA-PARFUMS/1.0)"},cf:{cacheEverything:true,cacheTtl:604800}});
  const type=upstream.headers.get("Content-Type")||"";
  if(!upstream.ok||!type.toLowerCase().startsWith("image/"))return new Response("Imagem temporariamente indisponível.",{status:502,headers:{"Cache-Control":"no-store"}});
  const headers=new Headers({"Content-Type":type,"Cache-Control":"public, max-age=604800, stale-while-revalidate=2592000","Strict-Transport-Security":"max-age=31536000; includeSubDomains"});
  const response=new Response(upstream.body,{status:200,headers});
  await cache.put(cacheKey,response.clone()).catch(()=>{});
  return response;
 }catch(e){console.error("Imagem catálogo:",e);return new Response("Imagem temporariamente indisponível.",{status:502,headers:{"Cache-Control":"no-store"}})}
}


export default{async fetch(request,env,ctx){
 const url=new URL(request.url);
 if(url.protocol!=="https:"){const target=new URL(request.url);target.protocol="https:";if(target.hostname==="valenzaparfums.com.br"&&(request.method==="GET"||request.method==="HEAD")&&!target.pathname.startsWith("/api/"))target.hostname="www.valenzaparfums.com.br";return Response.redirect(target.toString(),308)}
 if(url.hostname==="valenzaparfums.com.br"&&(request.method==="GET"||request.method==="HEAD")&&!url.pathname.startsWith("/api/")){const target=new URL(request.url);target.protocol="https:";target.hostname="www.valenzaparfums.com.br";return Response.redirect(target.toString(),308)}
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:jsonHeaders});
 if(url.pathname==="/api/health"&&request.method==="GET")return resposta({ok:true,service:"aurea-perfumes",timestamp:new Date().toISOString()});
 if(request.method==="GET"&&PRODUCT_IMAGE_SOURCES[url.pathname])return productCatalogImage(request,url.pathname);
 if(url.pathname==="/api/google/config"&&request.method==="GET"){const measurementId=String(env.GA4_MEASUREMENT_ID||"").trim(),valid=/^G-[A-Z0-9]+$/i.test(measurementId);return resposta({ok:true,enabled:valid,measurementId:valid?measurementId:""})}
 if(url.pathname==="/api/meta/config"&&request.method==="GET"){const cfg=metaConfig(env);return resposta({ok:true,enabled:cfg.enabled,pixelId:cfg.enabled?cfg.pixelId:"",capiEnabled:cfg.enabled&&!!cfg.token,apiVersion:cfg.apiVersion})}
 if(url.pathname==="/api/meta/event"&&request.method==="POST")return metaEvent(request,env);
 if(url.pathname==="/api/promotions/active"&&request.method==="GET")return activePromotionPublic(env);
 if(url.pathname==="/api/product-promotions/active"&&request.method==="GET")return activeProductPromotionsPublic(env);
 if(url.pathname==="/api/catalog/runtime"&&request.method==="GET")return catalogRuntimePublic(env);
 if(request.method==="GET"&&(url.pathname==="/merchant-feed.xml"||url.pathname==="/google-merchant.xml"))return dynamicMerchantFeed(request,env);
 if(request.method==="GET"&&url.pathname==="/sitemap.xml")return dynamicSitemap(request,env);
 if(url.pathname==="/api/analytics/event"&&request.method==="POST")return analyticsEvent(request,env);
 if(url.pathname==="/api/analytics/location"&&request.method==="POST")return analyticsLocation(request,env);
 if(url.pathname==="/api/opportunities/sync"&&request.method==="POST")return opportunitySync(request,env);
 if(url.pathname==="/api/auth/register"&&request.method==="POST")return authRegister(request,env);
 if(url.pathname==="/api/auth/login"&&request.method==="POST")return authLogin(request,env);
 if(url.pathname==="/api/auth/me"&&request.method==="GET")return authMe(request,env);
 if(url.pathname==="/api/auth/logout"&&request.method==="POST")return authLogout(request,env);
 if(url.pathname==="/api/auth/verify"&&request.method==="GET")return authVerify(url,env);
 if(url.pathname==="/api/auth/resend-verification"&&request.method==="POST")return authResendVerification(request,env);
 if(url.pathname==="/api/admin/status"&&request.method==="GET")return adminStatus(request,env);
 if(url.pathname==="/api/admin/setup"&&request.method==="POST")return adminSetup(request,env);
 if(url.pathname==="/api/admin/login"&&request.method==="POST")return adminLogin(request,env);
 if(url.pathname==="/api/admin/password"&&request.method==="POST")return adminPasswordChange(request,env);
 if(url.pathname==="/api/admin/logout"&&request.method==="POST")return adminLogout(request,env);
 if(url.pathname==="/api/admin/dashboard"&&request.method==="GET")return adminDashboard(request,env);
 if(url.pathname==="/api/admin/report/daily"&&request.method==="GET")return adminDailyReport(request,env);
 if(url.pathname==="/api/admin/report/daily/send"&&request.method==="POST")return adminDailyReportSend(request,env);
 if(url.pathname==="/api/admin/emails/status"&&request.method==="GET")return adminOperationalEmailsStatus(request,env);
 if(url.pathname==="/api/admin/emails/test"&&request.method==="POST")return adminOperationalEmailTest(request,env);
 if(url.pathname==="/api/admin/events"&&request.method==="GET")return adminOperationalEvents(request,env);
 if(url.pathname==="/api/admin/members/grant"&&request.method==="POST")return adminMemberGrant(request,env);
 if(url.pathname==="/api/admin/promotions/save"&&request.method==="POST")return adminPromotionSave(request,env);
 if(url.pathname==="/api/admin/promotions/toggle"&&request.method==="POST")return adminPromotionToggle(request,env);
 if(url.pathname==="/api/admin/product-promotions/save"&&request.method==="POST")return adminProductPromotionSave(request,env);
 if(url.pathname==="/api/admin/product-promotions/toggle"&&request.method==="POST")return adminProductPromotionToggle(request,env);
 if(url.pathname==="/api/admin/products/update"&&request.method==="POST")return adminProductUpdate(request,env);
 if(url.pathname==="/api/admin/products/availability"&&request.method==="POST")return adminProductAvailability(request,env);
 if(url.pathname==="/api/admin/prices/update"&&request.method==="POST")return adminPriceUpdate(request,env);
 if(url.pathname==="/api/admin/opportunities/email"&&request.method==="POST")return adminOpportunityEmail(request,env);
 if(url.pathname==="/api/admin/opportunities/contacted"&&request.method==="POST")return adminOpportunityContacted(request,env);
 if(url.pathname==="/api/admin/opportunities/archive"&&request.method==="POST")return adminOpportunityArchive(request,env);
 if(url.pathname==="/api/admin/notifications/poll"&&request.method==="GET")return adminNotificationsPoll(request,env);
 if(url.pathname==="/api/admin/notifications/read"&&request.method==="POST")return adminNotificationsRead(request,env);
 if(url.pathname==="/api/admin/orders/delete-tests"&&request.method==="POST")return adminDeleteTestOrders(request,env);
 if(url.pathname==="/api/account"&&request.method==="GET")return accountData(request,env);
 if(url.pathname==="/api/account/profile"&&request.method==="POST")return accountProfile(request,env);
 if(url.pathname==="/api/account/password"&&request.method==="POST")return accountPasswordChange(request,env);
 if(url.pathname==="/api/account/order/cancel"&&request.method==="POST")return accountCancelOrder(request,env);
 if(url.pathname==="/api/account/order/pix"&&request.method==="POST")return accountOrderPix(request,env);
 if(url.pathname==="/api/account/addresses"&&request.method==="POST")return accountAddressSave(request,env);
 if(url.pathname.startsWith("/api/account/addresses/")&&request.method==="POST")return accountAddressDelete(request,env,url.pathname.split("/").pop());
 if(url.pathname==="/api/frete"&&request.method==="POST")return calcularFrete(request,env);
 if(url.pathname==="/api/estoque"&&request.method==="GET")return consultarEstoque(env);
 if(url.pathname==="/api/pagamento/status"&&request.method==="GET")return statusMercadoPago(env);
 if(url.pathname==="/api/pagamento/webhook"&&request.method==="POST")return webhookMercadoPago(request,env,ctx);
 if(url.pathname==="/api/pagamento/config"&&request.method==="GET"){const mp=mpConfig(env);return resposta({ok:true,cardEnabled:Boolean(mp.publicKey),publicKey:mp.publicKey||"",testMode:mp.testMode})}
 if(url.pathname==="/api/pagamento"&&request.method==="POST")return criarPagamentoPix(request,env);
 if(url.pathname==="/api/pagamento/cartao"&&request.method==="POST")return criarPagamentoCartao(request,env);
 if(url.pathname.startsWith("/api/pagamento/")&&request.method==="GET")return consultarPagamento(request,url.pathname.slice("/api/pagamento/".length).trim(),env);
 if(url.pathname==="/admin"||url.pathname.startsWith("/admin/"))return new Response("Not Found",{status:404,headers:{"Content-Type":"text/plain; charset=UTF-8","X-Robots-Tag":"noindex, nofollow, noarchive"}});
 if(env.ASSETS)return servirAssets(request,env);
 return new Response("VALENZA",{status:404,headers:{"Content-Type":"text/plain; charset=UTF-8"}});
},
async scheduled(controller,env,ctx){ctx.waitUntil(Promise.all([reconcileUncertainPayments(env),reconcileStalePixReservations(env),cleanupExpiredPendingCustomers(env),retryPendingSaleNotifications(env),retryPendingOperationalEmails(env),retryPendingOperationalErrorAlerts(env),processCheckoutRecovery(env),syncShipmentTracking(env),maybeSendDailyReport(env)]))}
};

let authSchemaReady=null;
async function ensureAuthSchema(env){
 if(!env.DB)throw new Error("Banco D1 não conectado.");
 if(authSchemaReady)return authSchemaReady;
 authSchemaReady=env.DB.batch([
  env.DB.prepare("CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, email_verified INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS customer_sessions (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS email_verifications (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_sessions_token ON customer_sessions(token_hash)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_verify_token ON email_verifications(token_hash)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS customer_profiles (customer_id TEXT PRIMARY KEY, phone TEXT, cpf TEXT, birth_date TEXT, updated_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS customer_addresses (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, label TEXT NOT NULL DEFAULT 'Principal', recipient TEXT NOT NULL, cep TEXT NOT NULL, street TEXT NOT NULL, number TEXT NOT NULL, complement TEXT, neighborhood TEXT NOT NULL, city TEXT NOT NULL, state TEXT NOT NULL, is_default INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_addresses_customer ON customer_addresses(customer_id)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, order_number TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'Aguardando pagamento', total REAL NOT NULL DEFAULT 0, tracking_code TEXT, tracking_url TEXT, carrier TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)"),env.DB.prepare("CREATE TABLE IF NOT EXISTS guest_orders (id TEXT PRIMARY KEY, email TEXT NOT NULL, customer_name TEXT NOT NULL, cpf TEXT, order_number TEXT NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'Aguardando pagamento', total REAL NOT NULL DEFAULT 0, tracking_code TEXT, tracking_url TEXT, carrier TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_guest_orders_email ON guest_orders(email)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS inventory (product_id TEXT PRIMARY KEY, stock INTEGER NOT NULL DEFAULT 10, updated_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS order_items (id TEXT PRIMARY KEY, order_id TEXT NOT NULL, product_id TEXT NOT NULL, name TEXT NOT NULL, brand TEXT, type TEXT, image TEXT, quantity INTEGER NOT NULL, unit_price REAL NOT NULL, stock_deducted INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)"),env.DB.prepare("CREATE TABLE IF NOT EXISTS payment_attempts (reference TEXT PRIMARY KEY, customer_id TEXT NOT NULL, snapshot_json TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'sending', provider_id TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_attempt_customer_open ON payment_attempts(customer_id) WHERE state IN ('sending','uncertain')"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS order_payments (order_id TEXT PRIMARY KEY, method TEXT NOT NULL, installments INTEGER NOT NULL DEFAULT 1, installment_amount REAL NOT NULL DEFAULT 0, total_paid REAL NOT NULL DEFAULT 0, status TEXT, status_detail TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),env.DB.prepare("CREATE TABLE IF NOT EXISTS shipment_locks (order_id TEXT PRIMARY KEY, state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS order_shipping (order_id TEXT PRIMARY KEY, email TEXT, customer_name TEXT, cpf TEXT, phone TEXT, cep TEXT, street TEXT, number TEXT, complement TEXT, neighborhood TEXT, city TEXT, state TEXT, carrier TEXT, freight_cost REAL NOT NULL DEFAULT 0, delivery_time INTEGER NOT NULL DEFAULT 0, shipping_id TEXT, barcode TEXT, label_ready INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS shipment_tracking_state (order_id TEXT PRIMARY KEY, shipping_id TEXT, barcode TEXT, carrier TEXT, status TEXT NOT NULL DEFAULT 'prepared', status_label TEXT, status_at TEXT, last_event_key TEXT, last_checked_at TEXT, delivered_at TEXT, issue_code TEXT, updated_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_shipment_tracking_status ON shipment_tracking_state(status,updated_at)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS admin_credentials (username TEXT PRIMARY KEY, customer_id TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS admin_members (customer_id TEXT PRIMARY KEY, role TEXT NOT NULL DEFAULT 'admin', active INTEGER NOT NULL DEFAULT 1, created_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_admin_members_active ON admin_members(active,customer_id)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS admin_sessions (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS admin_login_attempts (key TEXT PRIMARY KEY, failures INTEGER NOT NULL DEFAULT 0, blocked_until TEXT, updated_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS admin_deleted_test_orders (id TEXT PRIMARY KEY, admin_customer_id TEXT NOT NULL, order_id TEXT NOT NULL UNIQUE, order_number TEXT, snapshot_json TEXT NOT NULL, deleted_at TEXT NOT NULL, FOREIGN KEY(admin_customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS admin_notifications (id TEXT PRIMARY KEY, unique_key TEXT NOT NULL UNIQUE, type TEXT NOT NULL, severity TEXT NOT NULL DEFAULT 'info', title TEXT NOT NULL, message TEXT NOT NULL, order_id TEXT, email_sent INTEGER NOT NULL DEFAULT 0, read_at TEXT, created_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON admin_notifications(created_at)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread ON admin_notifications(read_at,created_at)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS inventory_alert_state (product_id TEXT PRIMARY KEY, state TEXT NOT NULL, stock INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_inventory_alert_state_state ON inventory_alert_state(state,updated_at)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS daily_report_runs (report_date TEXT PRIMARY KEY, status TEXT NOT NULL DEFAULT 'pending', source TEXT, recipients_json TEXT, summary_json TEXT, last_error TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, sent_at TEXT)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_daily_report_runs_status ON daily_report_runs(status,updated_at)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS customer_email_deliveries (order_id TEXT NOT NULL, event_key TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, recipient TEXT, subject TEXT, provider_id TEXT, last_error TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, sent_at TEXT, PRIMARY KEY(order_id,event_key))"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_customer_email_deliveries_status ON customer_email_deliveries(status,updated_at)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS admin_whatsapp_deliveries (notification_id TEXT NOT NULL, order_id TEXT NOT NULL, recipient_hash TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, provider_message_id TEXT, last_error TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(notification_id,recipient_hash))"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_admin_whatsapp_delivery_status ON admin_whatsapp_deliveries(status,updated_at)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS admin_promotions (id TEXT PRIMARY KEY, title TEXT NOT NULL, message TEXT NOT NULL, starts_at TEXT, ends_at TEXT, active INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_admin_promotions_active ON admin_promotions(active,starts_at,ends_at,updated_at)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS product_promotions (id TEXT PRIMARY KEY, product_id TEXT NOT NULL UNIQUE, promo_price REAL NOT NULL, starts_at TEXT, ends_at TEXT, active INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_product_promotions_active ON product_promotions(active,starts_at,ends_at,updated_at)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_product_promotions_product ON product_promotions(product_id)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS product_settings (product_id TEXT PRIMARY KEY, price_override REAL, unit_cost REAL, updated_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS disabled_products (product_id TEXT PRIMARY KEY, disabled_at TEXT NOT NULL, disabled_by TEXT NOT NULL)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS order_item_costs (order_item_id TEXT PRIMARY KEY, order_id TEXT NOT NULL, product_id TEXT NOT NULL, unit_cost REAL, created_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_order_item_costs_order ON order_item_costs(order_id)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_order_item_costs_product ON order_item_costs(product_id)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS checkout_opportunities (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL UNIQUE, cart_json TEXT NOT NULL DEFAULT '[]', stage TEXT NOT NULL DEFAULT 'cart', payment_method TEXT, last_error TEXT, subtotal REAL NOT NULL DEFAULT 0, phone TEXT, status TEXT NOT NULL DEFAULT 'active', contacted_at TEXT, email_sent_at TEXT, recovered_order_id TEXT, recovered_at TEXT, recoveries INTEGER NOT NULL DEFAULT 0, last_seen_at TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS checkout_recovered_orders (order_id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, attempt_id TEXT NOT NULL UNIQUE, recovered_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_checkout_opportunities_status ON checkout_opportunities(status,last_seen_at,updated_at)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS admin_audit_log (id TEXT PRIMARY KEY, admin_customer_id TEXT NOT NULL, action TEXT NOT NULL, detail_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS operational_events (id TEXT PRIMARY KEY, unique_key TEXT NOT NULL UNIQUE, order_id TEXT, event_type TEXT NOT NULL, category TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'info', severity TEXT NOT NULL DEFAULT 'info', source TEXT NOT NULL DEFAULT 'worker', message TEXT, metadata_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_operational_events_created ON operational_events(created_at)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_operational_events_order ON operational_events(order_id,created_at)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_operational_events_type ON operational_events(event_type,created_at)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_operational_events_category ON operational_events(category,status,created_at)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS analytics_events (id TEXT PRIMARY KEY, event_key TEXT NOT NULL UNIQUE, visitor_id TEXT NOT NULL, session_id TEXT NOT NULL, event_name TEXT NOT NULL, page_path TEXT, product_id TEXT, product_name TEXT, value REAL NOT NULL DEFAULT 0, transaction_id TEXT, source TEXT, medium TEXT, campaign TEXT, referrer_host TEXT, country TEXT, region TEXT, region_code TEXT, city TEXT, created_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_analytics_event_created ON analytics_events(event_name,created_at)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_analytics_location ON analytics_events(country,region_code,city,created_at)"),
  env.DB.prepare("UPDATE checkout_opportunities SET email_sent_at=(SELECT e.created_at FROM operational_events e WHERE e.unique_key='checkout-recovery:'||checkout_opportunities.id AND e.status='sent'),contacted_at=COALESCE(contacted_at,(SELECT e.created_at FROM operational_events e WHERE e.unique_key='checkout-recovery:'||checkout_opportunities.id AND e.status='sent')) WHERE email_sent_at IS NULL AND EXISTS(SELECT 1 FROM operational_events e WHERE e.unique_key='checkout-recovery:'||checkout_opportunities.id AND e.status='sent')")
 ]).catch(e=>{authSchemaReady=null;throw e});
 return authSchemaReady;
}
const enc=new TextEncoder();
function bytesHex(buf){return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("")}
function randomToken(){const a=new Uint8Array(32);crypto.getRandomValues(a);return btoa(String.fromCharCode(...a)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
async function sha256(s){return bytesHex(await crypto.subtle.digest("SHA-256",enc.encode(s)))}
async function hashPassword(password,saltB64){
 const salt=saltB64?Uint8Array.from(atob(saltB64),c=>c.charCodeAt(0)):crypto.getRandomValues(new Uint8Array(16));
 const key=await crypto.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveBits"]);
 const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:100000,hash:"SHA-256"},key,256);
 return {hash:bytesHex(bits),salt:btoa(String.fromCharCode(...salt))};
}
function validEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}
function cookieTokens(request){const c=request.headers.get("Cookie")||"",out=[];for(const part of c.split(";")){const p=part.trim();let raw="";if(p.startsWith("__Host-valenza_session="))raw=p.slice("__Host-valenza_session=".length);else if(p.startsWith("aurea_session="))raw=p.slice("aurea_session=".length);else continue;try{const t=decodeURIComponent(raw);if(t&&!out.includes(t))out.push(t)}catch{}}return out}
function sessionCookie(token,maxAge=2592000){const exp=(maxAge>0?new Date(Date.now()+maxAge*1000):new Date(0)).toUTCString();return "__Host-valenza_session="+encodeURIComponent(token)+"; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age="+maxAge+"; Expires="+exp+"; Priority=High"}
function legacySessionClearCookies(){const expired="Thu, 01 Jan 1970 00:00:00 GMT",base="aurea_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires="+expired;return [base,base+"; Domain=valenzaparfums.com.br"]}
function primaryDb(env){return typeof env.DB.withSession==="function"?env.DB.withSession("first-primary"):env.DB}
async function validCustomerSession(request,env){const tokens=cookieTokens(request);if(!tokens.length)return {user:null,reason:"missing_cookie"};const db=primaryDb(env);for(const t of tokens){const th=await sha256(t);const u=await db.prepare("SELECT c.id,c.name,c.email,c.email_verified,s.expires_at FROM customer_sessions s JOIN customers c ON c.id=s.customer_id WHERE s.token_hash=?").bind(th).first();if(u&&Date.parse(u.expires_at)>=Date.now())return {user:u,token:t,reason:null}}return {user:null,reason:"session_not_found"}}

async function cleanupExpiredPendingCustomers(env){
 try{
  await ensureAuthSchema(env);const db=primaryDb(env),now=new Date().toISOString();
  const r=await db.prepare("DELETE FROM customers WHERE email_verified=0 AND NOT EXISTS(SELECT 1 FROM email_verifications ev WHERE ev.customer_id=customers.id AND ev.expires_at>?) AND NOT EXISTS(SELECT 1 FROM orders o WHERE o.customer_id=customers.id) AND NOT EXISTS(SELECT 1 FROM guest_orders g WHERE lower(g.email)=lower(customers.email)) AND NOT EXISTS(SELECT 1 FROM admin_credentials a WHERE a.customer_id=customers.id) AND NOT EXISTS(SELECT 1 FROM admin_members m WHERE m.customer_id=customers.id AND m.active=1)").bind(now).run();
  return Number(r.meta?.changes||0);
 }catch(e){console.error("Limpeza pendentes:",e);return 0}
}
async function cleanupExpiredPendingEmail(env,email){
 try{
  await ensureAuthSchema(env);const db=primaryDb(env),now=new Date().toISOString();
  const row=await db.prepare("SELECT c.id FROM customers c WHERE c.email=? AND c.email_verified=0 AND NOT EXISTS(SELECT 1 FROM email_verifications ev WHERE ev.customer_id=c.id AND ev.expires_at>?) AND NOT EXISTS(SELECT 1 FROM orders o WHERE o.customer_id=c.id) AND NOT EXISTS(SELECT 1 FROM guest_orders g WHERE lower(g.email)=lower(c.email)) AND NOT EXISTS(SELECT 1 FROM admin_credentials a WHERE a.customer_id=c.id) AND NOT EXISTS(SELECT 1 FROM admin_members m WHERE m.customer_id=c.id AND m.active=1)").bind(email,now).first();
  if(row?.id)await db.prepare("DELETE FROM customers WHERE id=?").bind(row.id).run();
  return !!row?.id;
 }catch(e){console.error("Limpeza pendente por e-mail:",e);return false}
}
async function authRegister(request,env){
 try{await ensureAuthSchema(env);const d=await request.json();const name=String(d.name||"").trim();const email=String(d.email||"").trim().toLowerCase();const pass=String(d.password||"");
 if(name.length<3)return resposta({ok:false,error:"Informe seu nome completo."},400);if(!validEmail(email))return resposta({ok:false,error:"Informe um e-mail válido."},400);if(pass.length<8)return resposta({ok:false,error:"A senha precisa ter pelo menos 8 caracteres."},400);
 await cleanupExpiredPendingEmail(env,email);
 const exists=await env.DB.prepare("SELECT id,name,email_verified FROM customers WHERE email=?").bind(email).first();
 if(exists){
  if(exists.email_verified)return resposta({ok:false,error:"Já existe uma conta confirmada com este e-mail. Use ENTRAR."},409);
  const hp=await hashPassword(pass),now=new Date().toISOString();
  await env.DB.prepare("UPDATE customers SET name=?,password_hash=?,password_salt=?,updated_at=? WHERE id=?").bind(name,hp.hash,hp.salt,now,exists.id).run();
  await env.DB.prepare("DELETE FROM email_verifications WHERE customer_id=?").bind(exists.id).run();
  const token=randomToken(),th=await sha256(token),exp=new Date(Date.now()+24*3600e3).toISOString();
  await env.DB.prepare("INSERT INTO email_verifications(id,customer_id,token_hash,expires_at,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),exists.id,th,exp,now).run();
  const verifyUrl=new URL("/api/auth/verify",request.url);verifyUrl.searchParams.set("token",token);
  const mail=await sendVerification(env,email,name,verifyUrl.toString());
  return resposta({ok:true,needsVerification:true,emailSent:mail.ok,message:mail.ok?"Cadastro atualizado. Enviamos um novo e-mail de confirmação.":"Cadastro atualizado. Não conseguimos enviar o e-mail agora; tente cadastrar novamente para reenviar."});
 }
 const id=crypto.randomUUID(),now=new Date().toISOString();let hp;try{hp=await hashPassword(pass)}catch(e){console.error("PBKDF2 indisponível, usando SHA-256 com salt:",e);const salt=randomToken();hp={salt,hash:await sha256(salt+":"+pass)}}await env.DB.prepare("INSERT INTO customers(id,name,email,password_hash,password_salt,email_verified,created_at,updated_at) VALUES(?,?,?,?,?,0,?,?)").bind(id,name,email,hp.hash,hp.salt,now,now).run();
 const token=randomToken(),th=await sha256(token),exp=new Date(Date.now()+24*3600e3).toISOString();await env.DB.prepare("INSERT INTO email_verifications(id,customer_id,token_hash,expires_at,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),id,th,exp,now).run();
 const verifyUrl=new URL("/api/auth/verify",request.url);verifyUrl.searchParams.set("token",token);const mail=await sendVerification(env,email,name,verifyUrl.toString());
 return resposta({ok:true,needsVerification:true,emailSent:mail.ok,message:mail.ok?"Conta criada. Enviamos um e-mail para confirmar seu cadastro.":"Conta criada, mas não conseguimos enviar o e-mail de confirmação agora. Use REENVIAR E-MAIL DE CONFIRMAÇÃO em alguns minutos."});
 }catch(e){console.error("Registro:",e);return resposta({ok:false,error:"Não foi possível criar a conta agora. Tente novamente em alguns instantes."},500)}
}
async function sendVerification(env,email,name,url){
 if(!env.RESEND_API_KEY){console.error("Resend: RESEND_API_KEY ausente");return {ok:false,error:"missing_api_key"}};
 const safeName=escapeHtml(name),safeUrl=escapeHtml(url);
 const html='<!doctype html><html><body style="margin:0;padding:0;background:#f5f1ec;font-family:Arial,Helvetica,sans-serif;color:#201d1a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f1ec;padding:32px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e7e0d8"><tr><td style="padding:36px 32px 24px;text-align:center;border-bottom:1px solid #eee7df"><div style="font-family:Georgia,serif;font-size:28px;letter-spacing:8px;color:#171513">VALENZA</div><div style="margin-top:8px;font-size:10px;letter-spacing:5px;color:#8b7a68">PARFUMS</div></td></tr><tr><td style="padding:36px 32px"><h1 style="margin:0 0 22px;font-family:Georgia,serif;font-size:30px;font-weight:400;color:#171513">Confirme seu e-mail</h1><p style="margin:0 0 14px;font-size:16px;line-height:1.6">Olá, '+safeName+'.</p><p style="margin:0 0 26px;font-size:16px;line-height:1.6;color:#4f4943">Seu cadastro na VALENZA PARFUMS foi recebido. Confirme seu endereço de e-mail para ativar sua conta e acessar a loja com segurança.</p><p style="margin:0 0 28px"><a href="'+safeUrl+'" style="display:inline-block;background:#171513;color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:1.5px;padding:16px 24px">CONFIRMAR MEU E-MAIL</a></p><p style="margin:0;font-size:13px;line-height:1.6;color:#7a726a">Por segurança, este link expira em 24 horas. Se você não criou uma conta na VALENZA PARFUMS, pode ignorar esta mensagem.</p></td></tr><tr><td style="padding:24px 32px;background:#faf8f5;border-top:1px solid #eee7df;text-align:center"><p style="margin:0 0 7px;font-size:12px;letter-spacing:1px;color:#5d554d">VALENZA PARFUMS</p><p style="margin:0;font-size:11px;color:#938a82">Mensagem automática de confirmação de cadastro. Por favor, não responda.</p></td></tr></table></td></tr></table></body></html>';
 const textBody='Olá, '+name+'.\n\nConfirme seu e-mail para ativar sua conta VALENZA PARFUMS:\n'+url+'\n\nEste link expira em 24 horas. Se você não criou esta conta, ignore esta mensagem.\n\nVALENZA PARFUMS';
 try{const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:env.AUREA_EMAIL_FROM||"VALENZA PARFUMS <contato@valenzaparfums.com.br>",to:[email],subject:"Confirme seu e-mail | VALENZA PARFUMS",html,text:textBody})});if(!r.ok){const detail=await r.text();console.error("Resend:",r.status,detail);return {ok:false,status:r.status,detail}}return {ok:true}}catch(e){console.error("Resend:",e);return {ok:false,error:String(e&&e.message||e)}}
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function authVerify(url,env){
 try{await ensureAuthSchema(env);const token=url.searchParams.get("token")||"";if(!token)return htmlMsg("Link inválido","O link de confirmação está incompleto.",false);const th=await sha256(token);const row=await env.DB.prepare("SELECT id,customer_id,expires_at FROM email_verifications WHERE token_hash=?").bind(th).first();if(!row||Date.parse(row.expires_at)<Date.now())return htmlMsg("Link expirado","Este link de confirmação não é mais válido.",false);await env.DB.batch([env.DB.prepare("UPDATE customers SET email_verified=1,updated_at=? WHERE id=?").bind(new Date().toISOString(),row.customer_id),env.DB.prepare("DELETE FROM email_verifications WHERE customer_id=?").bind(row.customer_id)]);return htmlMsg("E-mail confirmado!","Sua conta VALENZA está ativa. Volte à loja e faça seu login.",true);
 }catch(e){return htmlMsg("Não foi possível confirmar","Tente novamente mais tarde.",false)}
}
async function authResendVerification(request,env){
 try{
  await ensureAuthSchema(env);
  const d=await request.json(),email=String(d.email||"").trim().toLowerCase();
  if(!validEmail(email))return resposta({ok:false,error:"Informe um e-mail válido."},400);
  const expired=await cleanupExpiredPendingEmail(env,email);
  const u=await env.DB.prepare("SELECT id,name,email,email_verified FROM customers WHERE email=?").bind(email).first();
  if(!u)return resposta({ok:true,expired:!!expired,notPending:true,message:expired?"Seu cadastro pendente expirou após 24 horas. Use CRIAR CONTA para se cadastrar novamente.":"Não há um cadastro pendente ativo para este e-mail. Use CRIAR CONTA se quiser se cadastrar."});
  if(u.email_verified)return resposta({ok:true,alreadyVerified:true,message:"Este e-mail já está confirmado. Você já pode entrar."});
  await env.DB.prepare("DELETE FROM email_verifications WHERE customer_id=?").bind(u.id).run();
  const token=randomToken(),th=await sha256(token),now=new Date().toISOString(),exp=new Date(Date.now()+24*3600e3).toISOString();
  await env.DB.prepare("INSERT INTO email_verifications(id,customer_id,token_hash,expires_at,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),u.id,th,exp,now).run();
  const verifyUrl=new URL("/api/auth/verify",request.url);verifyUrl.searchParams.set("token",token);
  const mail=await sendVerification(env,u.email,u.name,verifyUrl.toString());
  if(!mail.ok)return resposta({ok:false,error:"Não foi possível enviar o e-mail de confirmação agora. Tente novamente em alguns minutos."},503);
  return resposta({ok:true,message:"Novo e-mail de confirmação enviado. Confira também Spam e Lixo eletrônico."});
 }catch(e){console.error("Reenvio confirmação:",e);return resposta({ok:false,error:"Não foi possível reenviar a confirmação agora."},500)}
}
function htmlMsg(title,msg,ok){return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>VALENZA</title><body style="margin:0;background:#f8f5f1;font-family:Arial;color:#171513"><main style="max-width:560px;margin:12vh auto;background:#fff;padding:42px;text-align:center;border:1px solid #e7e1da"><div style="font:24px Georgia;letter-spacing:5px">VALENZA</div><h1 style="font:32px Georgia">'+escapeHtml(title)+'</h1><p>'+escapeHtml(msg)+'</p><a href="/" style="display:inline-block;margin-top:15px;background:#171513;color:white;padding:13px 20px;text-decoration:none">VOLTAR À LOJA</a></main></body>',{status:ok?200:400,headers:{"Content-Type":"text/html; charset=UTF-8","Cache-Control":"no-store"}})}
async function authLogin(request,env){
 try{await ensureAuthSchema(env);const d=await request.json();const email=String(d.email||"").trim().toLowerCase(),pass=String(d.password||"");const u=await env.DB.prepare("SELECT id,name,email,password_hash,password_salt,email_verified FROM customers WHERE email=?").bind(email).first();if(!u)return resposta({ok:false,error:"E-mail ou senha incorretos."},401);let hp;try{hp=await hashPassword(pass,u.password_salt)}catch(e){hp={hash:await sha256(u.password_salt+":"+pass)}}if(hp.hash!==u.password_hash)return resposta({ok:false,error:"E-mail ou senha incorretos."},401);if(!u.email_verified)return resposta({ok:false,error:"Confirme seu e-mail antes de entrar."},403);
 const db=primaryDb(env);for(const oldToken of cookieTokens(request))await db.prepare("DELETE FROM customer_sessions WHERE token_hash=?").bind(await sha256(oldToken)).run();
 const token=randomToken(),th=await sha256(token),now=new Date().toISOString(),exp=new Date(Date.now()+30*86400e3).toISOString();await db.prepare("INSERT INTO customer_sessions(id,customer_id,token_hash,expires_at,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),u.id,th,exp,now).run();const persisted=await db.prepare("SELECT id FROM customer_sessions WHERE token_hash=?").bind(th).first();if(!persisted)throw new Error("Sessão criada, mas não persistida.");const h=new Headers(jsonHeaders);for(const c of legacySessionClearCookies())h.append("Set-Cookie",c);h.append("Set-Cookie",sessionCookie(token));return new Response(JSON.stringify({ok:true,user:{name:u.name,email:u.email}}),{status:200,headers:h});
 }catch(e){console.error("Login:",e);return resposta({ok:false,error:"Não foi possível entrar agora."},500)}
}
async function authMe(request,env){
 try{
  await ensureAuthSchema(env);
  const s=await validCustomerSession(request,env);if(!s.user)return resposta({ok:false,user:null,reason:s.reason},401);
  const u=s.user,adminMember=await primaryDb(env).prepare("SELECT role,active FROM admin_members WHERE customer_id=? AND active=1 LIMIT 1").bind(u.id).first();
  const adminAccess=!!u.email_verified&&(allowedAdminEmail(env,u.email)||!!adminMember);
  return resposta({ok:true,user:{name:u.name,email:u.email,emailVerified:!!u.email_verified,adminAccess,adminRole:allowedAdminEmail(env,u.email)?"owner":(adminMember?.role||null)}});
 }catch(e){console.error("Auth me:",e);return resposta({ok:false,user:null,reason:"server_error"},500)}
}
async function authLogout(request,env){try{await ensureAuthSchema(env);const db=primaryDb(env);for(const t of cookieTokens(request))await db.prepare("DELETE FROM customer_sessions WHERE token_hash=?").bind(await sha256(t)).run();const h=new Headers(jsonHeaders);h.append("Set-Cookie",sessionCookie("",0));for(const c of legacySessionClearCookies())h.append("Set-Cookie",c);return new Response(JSON.stringify({ok:true}),{headers:h})}catch(e){console.error("Logout:",e);return resposta({ok:true})}}


async function currentCustomer(request,env){await ensureAuthSchema(env);const s=await validCustomerSession(request,env);return s.user||null}



function metaConfig(env){
 const pixelId=String(env.META_PIXEL_ID||"").trim(),token=String(env.META_CAPI_ACCESS_TOKEN||"").trim();
 const rawVersion=String(env.META_GRAPH_VERSION||"v26.0").trim(),apiVersion=/^v\d+\.\d+$/.test(rawVersion)?rawVersion:"v26.0";
 return {pixelId,token,apiVersion,testEventCode:String(env.META_TEST_EVENT_CODE||"").trim(),enabled:/^\d{5,30}$/.test(pixelId)};
}
function metaSafeText(v,max=300){return String(v||"").trim().slice(0,max)}
function metaSafeList(v,max=50){return Array.isArray(v)?v.slice(0,max):[]}
async function metaEvent(request,env){
 try{
  const cfg=metaConfig(env);if(!cfg.enabled||!cfg.token)return new Response(null,{status:204,headers:{"Cache-Control":"no-store"}});
  const origin=request.headers.get("Origin")||"";
  if(origin){try{if(new URL(origin).hostname!==new URL(request.url).hostname)return resposta({ok:false},403)}catch{return resposta({ok:false},403)}}
  const d=await request.json().catch(()=>({})),eventName=metaSafeText(d.eventName,40),eventId=metaSafeText(d.eventId,160);
  if(d.consent!=="granted")return new Response(null,{status:204,headers:{"Cache-Control":"no-store"}});
  const allowed=new Set(["PageView","ViewContent","AddToCart","InitiateCheckout","AddPaymentInfo","Purchase"]);
  if(!allowed.has(eventName)||!/^[A-Za-z0-9._:-]{8,160}$/.test(eventId))return resposta({ok:false,error:"Evento Meta inválido."},400);
  let eventSourceUrl="";try{const u=new URL(String(d.eventSourceUrl||request.url));if(u.hostname===new URL(request.url).hostname&&u.protocol==="https:"){u.search="";u.hash="";u.username="";u.password="";eventSourceUrl=u.toString()}}catch{}
  if(!eventSourceUrl)eventSourceUrl=new URL("/",request.url).toString();
  const userData={client_user_agent:metaSafeText(request.headers.get("User-Agent"),500)};
  const ip=metaSafeText(request.headers.get("CF-Connecting-IP"),80);if(ip)userData.client_ip_address=ip;
  const fbp=metaSafeText(d.fbp,200),fbc=metaSafeText(d.fbc,200);if(fbp)userData.fbp=fbp;if(fbc)userData.fbc=fbc;
  const contentIds=metaSafeList(d.contentIds).map(x=>metaSafeText(x,120)).filter(Boolean);
  const contents=metaSafeList(d.contents).map(x=>({id:metaSafeText(x?.id,120),quantity:Math.max(1,Math.min(99,Number(x?.quantity)||1)),item_price:Math.max(0,Math.min(1000000,Number(x?.item_price)||0))})).filter(x=>x.id);
  const customData={currency:"BRL",value:Math.max(0,Math.min(1000000,Number(d.value)||0)),content_type:"product"};
  if(contentIds.length)customData.content_ids=contentIds;if(contents.length)customData.contents=contents;
  const orderId=metaSafeText(d.orderId,120);if(orderId)customData.order_id=orderId;
  if(eventName==="Purchase"){
   const customer=await currentCustomer(request,env);if(!customer)return resposta({ok:false,error:"Entre na conta para confirmar a conversão."},401);
   const db=primaryDb(env),order=await db.prepare("SELECT id,status,total FROM orders WHERE id=? AND customer_id=? UNION SELECT id,status,total FROM guest_orders WHERE id=? AND lower(email)=lower(?) LIMIT 1").bind(orderId,customer.id,orderId,customer.email).first();
   if(!order)return resposta({ok:false,error:"Pedido não encontrado na sua conta."},404);
   if(order.status!=="Pago")return resposta({ok:false,error:"A compra só é registrada após o pagamento aprovado."},409);
   if(eventId!=="purchase:"+String(order.id).replace(/[^A-Za-z0-9._:-]/g,"").slice(0,151))return resposta({ok:false,error:"Identificador de compra inválido."},400);
   const rows=await db.prepare("SELECT product_id,quantity,unit_price FROM order_items WHERE order_id=?").bind(order.id).all(),items=rows.results||[];
   customData.value=Number(order.total);customData.order_id=String(order.id);
   customData.content_ids=items.map(x=>String(x.product_id));customData.contents=items.map(x=>({id:String(x.product_id),quantity:Number(x.quantity),item_price:Number(x.unit_price)}));
  }
  const payload={data:[{event_name:eventName,event_time:Math.floor(Date.now()/1000),event_id:eventId,action_source:"website",event_source_url:eventSourceUrl,user_data:userData,custom_data:customData}]};
  if(cfg.testEventCode)payload.test_event_code=cfg.testEventCode;
  const r=await fetch("https://graph.facebook.com/"+cfg.apiVersion+"/"+cfg.pixelId+"/events",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+cfg.token},body:JSON.stringify(payload)});
  if(!r.ok){console.error("Meta CAPI: HTTP",r.status);return resposta({ok:false,error:"Meta CAPI indisponível."},502)}
  return new Response(null,{status:204,headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("Meta CAPI:",e);return resposta({ok:false},500)}
}

function analyticsText(v,max=120){return String(v||"").trim().slice(0,max)}
async function analyticsEvent(request,env){
 try{
  await ensureAuthSchema(env);
  const origin=request.headers.get("Origin")||"";
  if(origin){try{if(new URL(origin).hostname!==new URL(request.url).hostname)return resposta({ok:false},403)}catch{return resposta({ok:false},403)}}
  const d=await request.json().catch(()=>({})),eventName=analyticsText(d.eventName,40);
  const allowed=new Set(["page_view","view_item","add_to_cart","remove_from_cart","view_cart","begin_checkout","add_shipping_info","add_payment_info","purchase"]);
  if(!allowed.has(eventName))return resposta({ok:false,error:"Evento inválido."},400);
  const visitorId=analyticsText(d.visitorId,80),sessionId=analyticsText(d.sessionId,80);
  if(!/^[A-Za-z0-9_-]{8,80}$/.test(visitorId)||!/^[A-Za-z0-9_-]{8,80}$/.test(sessionId))return resposta({ok:false,error:"Sessão analítica inválida."},400);
  const transactionId=analyticsText(d.transactionId,120),rawKey=analyticsText(d.eventId,120),eventKey=eventName==="purchase"&&transactionId?"purchase:"+transactionId:rawKey;
  if(!/^[A-Za-z0-9:_-]{8,160}$/.test(eventKey))return resposta({ok:false,error:"Identificador analítico inválido."},400);
  const cf=request.cf||{},pagePath=analyticsText(d.pagePath,300),value=Math.max(0,Math.min(1000000,Number(d.value)||0)),now=new Date().toISOString();
  await env.DB.prepare("INSERT OR IGNORE INTO analytics_events(id,event_key,visitor_id,session_id,event_name,page_path,product_id,product_name,value,transaction_id,source,medium,campaign,referrer_host,country,region,region_code,city,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
   .bind(crypto.randomUUID(),eventKey,visitorId,sessionId,eventName,pagePath.startsWith("/")?pagePath:"/",analyticsText(d.productId),analyticsText(d.productName),value,transactionId,analyticsText(d.source,80),analyticsText(d.medium,80),analyticsText(d.campaign,120),analyticsText(d.referrerHost,160),analyticsText(cf.country,8),analyticsText(cf.region,100),analyticsText(cf.regionCode,20),analyticsText(cf.city,120),now).run();
  return new Response(null,{status:204,headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("Analytics event:",e);return resposta({ok:false},500)}
}

async function analyticsLocation(request,env){
 try{
  await ensureAuthSchema(env);
  const origin=request.headers.get("Origin")||"";
  if(origin){try{if(new URL(origin).hostname!==new URL(request.url).hostname)return resposta({ok:false},403)}catch{return resposta({ok:false},403)}}
  const d=await request.json().catch(()=>({})),visitorId=analyticsText(d.visitorId,80),sessionId=analyticsText(d.sessionId,80);
  if(!/^[A-Za-z0-9_-]{8,80}$/.test(visitorId)||!/^[A-Za-z0-9_-]{8,80}$/.test(sessionId))return resposta({ok:false,error:"Sessão analítica inválida."},400);
  const city=analyticsText(d.city,120),region=analyticsText(d.region,120),rawCode=analyticsText(d.regionCode,30),country=analyticsText(d.country,8).toUpperCase(),regionCode=rawCode.includes("-")?rawCode.split("-").pop():rawCode;
  if(!city&&!region&&!country)return resposta({ok:false,error:"Cidade não identificada."},400);
  const db=primaryDb(env);
  await db.prepare("UPDATE analytics_events SET city=?,region=?,region_code=?,country=? WHERE visitor_id=? AND session_id=?").bind(city,region,regionCode,country,visitorId,sessionId).run();
  return resposta({ok:true,resolved:true,city,region,regionCode,country});
 }catch(e){console.error("Analytics location:",e);return resposta({ok:false},500)}
}
async function analyticsDashboard(env){
 const now=Date.now(),since24=new Date(now-24*3600e3).toISOString(),since7=new Date(now-7*86400e3).toISOString(),since30=new Date(now-30*86400e3).toISOString();
 const [metrics,locations,sources,products,daily]=await Promise.all([
  env.DB.prepare("SELECT COUNT(DISTINCT CASE WHEN created_at>=? THEN session_id END) sessions24h,COUNT(DISTINCT CASE WHEN created_at>=? THEN session_id END) sessions7d,COUNT(DISTINCT session_id) sessions30d,COUNT(DISTINCT visitor_id) visitors30d,SUM(CASE WHEN event_name='page_view' THEN 1 ELSE 0 END) page_views30d,SUM(CASE WHEN event_name='view_item' THEN 1 ELSE 0 END) product_views30d,SUM(CASE WHEN event_name='add_to_cart' THEN 1 ELSE 0 END) add_to_cart30d,SUM(CASE WHEN event_name='begin_checkout' THEN 1 ELSE 0 END) begin_checkout30d,COUNT(DISTINCT CASE WHEN event_name='purchase' THEN COALESCE(NULLIF(transaction_id,''),event_key) END) purchases30d,MIN(created_at) first_event_at FROM analytics_events WHERE created_at>=?").bind(since24,since7,since30).first(),
  env.DB.prepare("SELECT country,region,region_code,city,COUNT(DISTINCT session_id) sessions FROM analytics_events WHERE created_at>=? AND event_name='page_view' GROUP BY country,region,region_code,city ORDER BY sessions DESC LIMIT 15").bind(since30).all(),
  env.DB.prepare("SELECT COALESCE(NULLIF(source,''),'direct') source,COALESCE(NULLIF(medium,''),'none') medium,COUNT(DISTINCT session_id) sessions FROM analytics_events WHERE created_at>=? AND event_name='page_view' GROUP BY source,medium ORDER BY sessions DESC LIMIT 12").bind(since30).all(),
  env.DB.prepare("SELECT product_id,MAX(product_name) product_name,SUM(CASE WHEN event_name='view_item' THEN 1 ELSE 0 END) views,SUM(CASE WHEN event_name='add_to_cart' THEN 1 ELSE 0 END) carts FROM analytics_events WHERE created_at>=? AND product_id IS NOT NULL AND product_id<>'' AND event_name IN ('view_item','add_to_cart') GROUP BY product_id ORDER BY views DESC,carts DESC LIMIT 12").bind(since30).all(),
  env.DB.prepare("SELECT date(created_at,'-3 hours') day,COUNT(DISTINCT session_id) sessions,SUM(CASE WHEN event_name='view_item' THEN 1 ELSE 0 END) product_views,SUM(CASE WHEN event_name='begin_checkout' THEN 1 ELSE 0 END) checkouts,COUNT(DISTINCT CASE WHEN event_name='purchase' THEN COALESCE(NULLIF(transaction_id,''),event_key) END) purchases FROM analytics_events WHERE created_at>=? GROUP BY date(created_at,'-3 hours') ORDER BY day DESC LIMIT 7").bind(since7).all()
 ]);
 const m=metrics||{},sessions30=Number(m.sessions30d||0),purchases30=Number(m.purchases30d||0);
 return {periodDays:30,sessions24h:Number(m.sessions24h||0),sessions7d:Number(m.sessions7d||0),sessions30d:sessions30,visitors30d:Number(m.visitors30d||0),pageViews30d:Number(m.page_views30d||0),productViews30d:Number(m.product_views30d||0),addToCart30d:Number(m.add_to_cart30d||0),beginCheckout30d:Number(m.begin_checkout30d||0),purchases30d:purchases30,conversion30d:sessions30?Number((purchases30*100/sessions30).toFixed(2)):0,firstEventAt:m.first_event_at||null,locations:locations.results||[],sources:sources.results||[],products:products.results||[],daily:daily.results||[]};
}
function adminUsername(env){return String(env.ADMIN_USERNAME||"wesleymartins").trim().toLowerCase()}
function adminSuggestedUsername(user,env){
 const email=String(user?.email||"").trim().toLowerCase();
 if(email==="wesleyvmartins97@gmail.com")return adminUsername(env);
 let base=String(user?.name||email.split("@")[0]||"admin").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"").slice(0,28);
 if(base.length<4)base=("admin"+base).slice(0,28);
 return base||"adminvalenza"
}
function validAdminUsername(v){return /^[a-z0-9._-]{4,32}$/.test(String(v||""))}
function adminCookieToken(request){const c=request.headers.get("Cookie")||"";const m=c.match(/(?:^|;\s*)valenza_admin=([^;]+)/);return m?decodeURIComponent(m[1]):""}
function adminSessionCookie(token,maxAge=14400){return "valenza_admin="+encodeURIComponent(token)+"; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age="+maxAge}
function allowedAdminEmail(env,email){const allowed=new Set(String(env.ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean));allowed.add("wesleyvmartins97@gmail.com");allowed.add("jjessitrindade@gmail.com");return allowed.has(String(email||"").toLowerCase())}
async function eligibleAdminCustomer(request,env){
 const u=await currentCustomer(request,env);
 if(!u||!u.email_verified)return null;
 if(allowedAdminEmail(env,u.email))return u;
 const member=await primaryDb(env).prepare("SELECT 1 ok FROM admin_members WHERE customer_id=? AND active=1 LIMIT 1").bind(u.id).first();
 return member?u:null;
}
async function currentAdmin(request,env){
 const u=await eligibleAdminCustomer(request,env);if(!u)return null;
 const token=adminCookieToken(request);if(!token)return null;
 const th=await sha256(token);
 const s=await env.DB.prepare("SELECT customer_id,expires_at FROM admin_sessions WHERE token_hash=? AND customer_id=?").bind(th,u.id).first();
 if(!s||Date.parse(s.expires_at)<Date.now()){if(s)await env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash=?").bind(th).run();return null}
 return u;
}
async function createAdminSession(user,env){
 const token=randomToken(),th=await sha256(token),now=new Date().toISOString(),exp=new Date(Date.now()+4*3600e3).toISOString();
 await env.DB.prepare("DELETE FROM admin_sessions WHERE customer_id=? OR expires_at<?").bind(user.id,now).run();
 await env.DB.prepare("INSERT INTO admin_sessions(id,customer_id,token_hash,expires_at,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),user.id,th,exp,now).run();
 return {token,exp};
}
async function adminAttemptKey(request){const ip=String(request.headers.get("CF-Connecting-IP")||request.headers.get("X-Forwarded-For")||"unknown").split(",")[0].trim();return sha256("admin-login:"+ip)}
async function adminRateState(request,env){
 const key=await adminAttemptKey(request),row=await env.DB.prepare("SELECT failures,blocked_until,updated_at FROM admin_login_attempts WHERE key=?").bind(key).first(),now=Date.now();
 if(!row)return {key,blocked:false};
 const blockedUntil=Date.parse(row.blocked_until||"");
 if(Number.isFinite(blockedUntil)&&blockedUntil>now)return {key,blocked:true,retryAfter:Math.max(1,Math.ceil((blockedUntil-now)/1000))};
 if(Date.parse(row.updated_at||"0")<now-15*60e3){await env.DB.prepare("DELETE FROM admin_login_attempts WHERE key=?").bind(key).run();return {key,blocked:false}}
 return {key,blocked:false,failures:Number(row.failures||0)};
}
async function adminRegisterFailure(key,failures,env){
 const next=Number(failures||0)+1,now=new Date(),block=next>=5?new Date(now.getTime()+15*60e3).toISOString():null,count=next>=5?0:next;
 await env.DB.prepare("INSERT INTO admin_login_attempts(key,failures,blocked_until,updated_at) VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET failures=excluded.failures,blocked_until=excluded.blocked_until,updated_at=excluded.updated_at").bind(key,count,block,now.toISOString()).run();
}
async function adminStatus(request,env){
 try{
  await ensureAuthSchema(env);
  const u=await eligibleAdminCustomer(request,env);if(!u)return resposta({ok:false},404);
  const cred=await env.DB.prepare("SELECT username FROM admin_credentials WHERE customer_id=? LIMIT 1").bind(u.id).first(),active=await currentAdmin(request,env);
  const username=cred?.username||adminSuggestedUsername(u,env);
  return resposta({ok:true,eligible:true,configured:!!cred,authenticated:!!active,username});
 }catch(e){console.error("Admin status:",e);return resposta({ok:false},500)}
}
async function adminSetup(request,env){
 try{
  await ensureAuthSchema(env);
  const u=await eligibleAdminCustomer(request,env);if(!u)return resposta({ok:false,error:"Acesso não autorizado."},404);
  const existing=await env.DB.prepare("SELECT username FROM admin_credentials WHERE customer_id=? LIMIT 1").bind(u.id).first();
  if(existing)return resposta({ok:false,error:"Seu acesso administrativo já foi criado. Use ENTRAR."},409);
  const d=await request.json().catch(()=>({})),username=String(d.username||"").trim().toLowerCase(),pass=String(d.password||""),confirm=String(d.confirmPassword||"");
  if(!validAdminUsername(username))return resposta({ok:false,error:"Use um usuário de 4 a 32 caracteres, apenas letras minúsculas, números, ponto, hífen ou sublinhado."},400);
  const taken=await env.DB.prepare("SELECT customer_id FROM admin_credentials WHERE username=? LIMIT 1").bind(username).first();
  if(taken)return resposta({ok:false,error:"Esse usuário administrativo já está em uso. Escolha outro."},409);
  if(pass.length<12)return resposta({ok:false,error:"Crie uma senha administrativa com pelo menos 12 caracteres."},400);
  if(pass!==confirm)return resposta({ok:false,error:"As senhas não coincidem."},400);
  const hp=await hashPassword(pass),now=new Date().toISOString();
  await env.DB.prepare("INSERT INTO admin_credentials(username,customer_id,password_hash,password_salt,created_at,updated_at) VALUES(?,?,?,?,?,?)").bind(username,u.id,hp.hash,hp.salt,now,now).run();
  await recordAdminAudit(env,u,"admin_credential_created",{username});
  const sess=await createAdminSession(u,env),h=new Headers(jsonHeaders);h.set("Set-Cookie",adminSessionCookie(sess.token));
  return new Response(JSON.stringify({ok:true,eligible:true,configured:true,authenticated:true,username}),{status:200,headers:h});
 }catch(e){console.error("Admin setup:",e);return resposta({ok:false,error:"Não foi possível criar a senha administrativa."},500)}
}
async function adminLogin(request,env){
 try{
  await ensureAuthSchema(env);
  const u=await eligibleAdminCustomer(request,env);if(!u)return resposta({ok:false,error:"Acesso não autorizado."},404);
  const rate=await adminRateState(request,env);if(rate.blocked)return resposta({ok:false,error:"Muitas tentativas. Aguarde alguns minutos e tente novamente.",retryAfter:rate.retryAfter},429);
  const d=await request.json().catch(()=>({})),username=String(d.username||"").trim().toLowerCase(),pass=String(d.password||"");
  const cred=await env.DB.prepare("SELECT username,password_hash,password_salt FROM admin_credentials WHERE customer_id=? AND username=? LIMIT 1").bind(u.id,username).first();
  let valid=false;if(cred&&pass){const hp=await hashPassword(pass,cred.password_salt);valid=hp.hash===cred.password_hash}
  if(!valid){await adminRegisterFailure(rate.key,rate.failures,env);return resposta({ok:false,error:"Usuário ou senha administrativa incorretos."},401)}
  await env.DB.prepare("DELETE FROM admin_login_attempts WHERE key=?").bind(rate.key).run();
  const sess=await createAdminSession(u,env),h=new Headers(jsonHeaders);h.set("Set-Cookie",adminSessionCookie(sess.token));
  return new Response(JSON.stringify({ok:true,eligible:true,configured:true,authenticated:true,username:cred.username}),{status:200,headers:h});
 }catch(e){console.error("Admin login:",e);return resposta({ok:false,error:"Não foi possível entrar no painel agora."},500)}
}
async function adminPasswordChange(request,env){
 try{
  await ensureAuthSchema(env);
  const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  const d=await request.json().catch(()=>({})),currentPassword=String(d.currentPassword||""),newPassword=String(d.newPassword||""),confirmPassword=String(d.confirmPassword||"");
  if(!currentPassword)return resposta({ok:false,error:"Informe a senha administrativa atual."},400);
  if(newPassword.length<12)return resposta({ok:false,error:"A nova senha administrativa precisa ter pelo menos 12 caracteres."},400);
  if(newPassword!==confirmPassword)return resposta({ok:false,error:"A confirmação da nova senha não confere."},400);
  const cred=await env.DB.prepare("SELECT username,password_hash,password_salt FROM admin_credentials WHERE customer_id=? LIMIT 1").bind(admin.id).first();
  if(!cred)return resposta({ok:false,error:"Credencial administrativa não encontrada para esta conta."},404);
  const currentHash=(await hashPassword(currentPassword,cred.password_salt)).hash;
  if(currentHash!==cred.password_hash)return resposta({ok:false,error:"A senha administrativa atual está incorreta."},401);
  const sameHash=(await hashPassword(newPassword,cred.password_salt)).hash;
  if(sameHash===cred.password_hash)return resposta({ok:false,error:"Escolha uma senha administrativa diferente da atual."},400);
  const hp=await hashPassword(newPassword),now=new Date().toISOString();
  await env.DB.prepare("UPDATE admin_credentials SET password_hash=?,password_salt=?,updated_at=? WHERE customer_id=?").bind(hp.hash,hp.salt,now,admin.id).run();
  await env.DB.prepare("DELETE FROM admin_sessions WHERE customer_id=?").bind(admin.id).run();
  await recordAdminAudit(env,admin,"admin_password_changed",{username:cred.username});
  const sess=await createAdminSession(admin,env),h=new Headers(jsonHeaders);h.set("Set-Cookie",adminSessionCookie(sess.token));
  return new Response(JSON.stringify({ok:true,authenticated:true,username:cred.username,message:"Senha administrativa alterada com sucesso."}),{status:200,headers:h});
 }catch(e){console.error("Troca de senha admin:",e);return resposta({ok:false,error:"Não foi possível alterar a senha administrativa agora."},500)}
}

async function adminLogout(request,env){
 try{await ensureAuthSchema(env);const token=adminCookieToken(request);if(token)await env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash=?").bind(await sha256(token)).run();const h=new Headers(jsonHeaders);h.set("Set-Cookie",adminSessionCookie("",0));return new Response(JSON.stringify({ok:true}),{headers:h})}catch(e){return resposta({ok:true})}
}
function adminOrderHasShipment(row){
 return Boolean(String(row?.shipping_id||"").trim()||String(row?.barcode||"").trim()||Number(row?.label_ready||0)||String(row?.tracking_code||"").trim()||String(row?.tracking_url||"").trim()||String(row?.lock_state||"").trim());
}
function adminStatusKey(v){return String(v||"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[\s-]+/g,"_")}
function adminOrderDeletePolicy(row,admin){
 const own=String(row?.customer_id||"")===String(admin.id)||(!row?.customer_id&&String(row?.email||"").toLowerCase()===String(admin.email||"").toLowerCase());
 if(!own)return {allowed:false,reason:"Venda de cliente protegida"};
 if(adminOrderHasShipment(row))return {allowed:false,reason:"Postagem EnvioEcom criada ou em preparação"};

 const orderStatus=adminStatusKey(row?.status),paymentStatus=adminStatusKey(row?.payment_status);
 const active=new Set(["aguardando_pagamento","processando","processing","pending","created","action_required","in_process","authorized","in_mediation","pending_contingency"]);
 const deletableOrder=new Set(["cancelado","expirado","pagamento_recusado","reembolsado","pago"]);
 const knownPayment=new Set(["failed","rejected","canceled","cancelled","expired","refunded","partially_refunded","processed","approved"]);

 if(active.has(orderStatus)||active.has(paymentStatus))return {allowed:false,reason:"Pagamento ainda ativo; cancele ou aguarde expirar"};
 if(!deletableOrder.has(orderStatus))return {allowed:false,reason:"Status de pagamento não encerrado ou não reconhecido"};
 if(paymentStatus&&!knownPayment.has(paymentStatus))return {allowed:false,reason:"Status bruto do Mercado Pago ainda não permite exclusão"};
 return {allowed:true,reason:"Pedido da sua conta de testes"};
}
async function adminDeleteTestOrders(request,env){
 let adminDeleteLocks=[];
 try{
  await ensureAuthSchema(env);await seedInventory(env);
  const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  const d=await request.json().catch(()=>({})),confirm=String(d.confirm||"").trim().toUpperCase(),rawIds=Array.isArray(d.orderIds)?d.orderIds:[];
  const ids=[...new Set(rawIds.map(x=>String(x||"").trim()).filter(Boolean))].slice(0,20);
  if(confirm!=="APAGAR")return resposta({ok:false,error:"Digite APAGAR para confirmar a exclusão."},400);
  if(!ids.length)return resposta({ok:false,error:"Selecione pelo menos um pedido."},400);
  const marks=ids.map(()=>"?").join(",");
  const qr=await env.DB.prepare("WITH selected AS (SELECT o.id,o.customer_id,o.order_number,o.status,o.total,o.tracking_code,o.tracking_url,o.carrier,o.created_at,c.name customer_name,c.email email,'orders' source FROM orders o LEFT JOIN customers c ON c.id=o.customer_id WHERE o.id IN ("+marks+") UNION ALL SELECT g.id,NULL customer_id,g.order_number,g.status,g.total,g.tracking_code,g.tracking_url,g.carrier,g.created_at,g.customer_name,g.email,'guest_orders' source FROM guest_orders g WHERE g.id IN ("+marks+") AND NOT EXISTS(SELECT 1 FROM orders o2 WHERE o2.id=g.id)) SELECT s.*,sh.shipping_id,sh.barcode,sh.label_ready,sh.cep,sh.street,sh.number,sh.complement,sh.neighborhood,sh.city,sh.state,sh.freight_cost,sh.delivery_time,l.state lock_state,p.method,p.installments,p.installment_amount,p.total_paid,p.status payment_status,p.status_detail FROM selected s LEFT JOIN order_shipping sh ON sh.order_id=s.id LEFT JOIN shipment_locks l ON l.order_id=s.id LEFT JOIN order_payments p ON p.order_id=s.id").bind(...ids,...ids).all();
  const rows=qr.results||[],rowMap=new Map(rows.map(x=>[String(x.id),x]));
  const missing=ids.filter(id=>!rowMap.has(id));if(missing.length)return resposta({ok:false,error:"Um ou mais pedidos selecionados não existem mais. Atualize o painel e tente novamente.",missing},409);
  const blocked=[];
  for(const id of ids){const row=rowMap.get(id),policy=adminOrderDeletePolicy(row,admin);if(!policy.allowed)blocked.push({id,orderNumber:row.order_number,status:row.status,reason:policy.reason})}
  if(blocked.length)return resposta({ok:false,error:"A exclusão foi bloqueada para proteger pedidos reais, pagamentos ativos ou postagens do EnvioEcom.",blocked},409);

  const lockNow=new Date().toISOString();
  for(const id of ids){
   const lk=await env.DB.prepare("INSERT OR IGNORE INTO shipment_locks(order_id,state,created_at,updated_at) VALUES(?,?,?,?)").bind(id,"admin_deleting",lockNow,lockNow).run();
   if((lk.meta?.changes||0)<1){
    if(adminDeleteLocks.length)await env.DB.batch(adminDeleteLocks.map(x=>env.DB.prepare("DELETE FROM shipment_locks WHERE order_id=? AND state='admin_deleting'").bind(x)));
    adminDeleteLocks=[];
    return resposta({ok:false,error:"A exclusão foi bloqueada porque uma postagem entrou em preparação. Atualize o painel antes de tentar novamente."},409);
   }
   adminDeleteLocks.push(id);
  }
  const sr=await env.DB.prepare("SELECT s.order_id,s.shipping_id,s.barcode,s.label_ready,o.tracking_code order_tracking,g.tracking_code guest_tracking FROM order_shipping s LEFT JOIN orders o ON o.id=s.order_id LEFT JOIN guest_orders g ON g.id=s.order_id WHERE s.order_id IN ("+marks+")").bind(...ids).all();
  const createdAfterLock=(sr.results||[]).filter(x=>String(x.shipping_id||"").trim()||String(x.barcode||"").trim()||Number(x.label_ready||0)||String(x.order_tracking||"").trim()||String(x.guest_tracking||"").trim());
  if(createdAfterLock.length){
   await env.DB.batch(adminDeleteLocks.map(x=>env.DB.prepare("DELETE FROM shipment_locks WHERE order_id=? AND state='admin_deleting'").bind(x)));adminDeleteLocks=[];
   return resposta({ok:false,error:"A exclusão foi bloqueada porque a postagem do EnvioEcom já foi criada.",blocked:createdAfterLock.map(x=>x.order_id)},409);
  }

  const ir=await env.DB.prepare("SELECT id,order_id,product_id,name,brand,type,image,quantity,unit_price,stock_deducted,created_at FROM order_items WHERE order_id IN ("+marks+") ORDER BY created_at").bind(...ids).all();
  const items=ir.results||[],itemsBy=new Map();for(const it of items){if(!itemsBy.has(String(it.order_id)))itemsBy.set(String(it.order_id),[]);itemsBy.get(String(it.order_id)).push(it)}
  const now=new Date().toISOString(),ops=[];let restoredUnits=0;
  for(const id of ids){
   const row=rowMap.get(id),orderItems=itemsBy.get(id)||[];
   const snapshot={order:{id:row.id,order_number:row.order_number,status:row.status,total:row.total,tracking_code:row.tracking_code,tracking_url:row.tracking_url,carrier:row.carrier,created_at:row.created_at,customer_name:row.customer_name,email:row.email,source:row.source},payment:{method:row.method,installments:row.installments,installment_amount:row.installment_amount,total_paid:row.total_paid,status:row.payment_status,status_detail:row.status_detail},shipping:{shipping_id:row.shipping_id,barcode:row.barcode,label_ready:row.label_ready,cep:row.cep,street:row.street,number:row.number,complement:row.complement,neighborhood:row.neighborhood,city:row.city,state:row.state,freight_cost:row.freight_cost,delivery_time:row.delivery_time},items:orderItems};
   ops.push(env.DB.prepare("INSERT OR REPLACE INTO admin_deleted_test_orders(id,admin_customer_id,order_id,order_number,snapshot_json,deleted_at) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),admin.id,id,String(row.order_number||""),JSON.stringify(snapshot),now));
   for(const it of orderItems){
    const state=Number(it.stock_deducted),qty=Math.max(0,Number(it.quantity)||0);
    if(state!==2&&qty>0){ops.push(env.DB.prepare("UPDATE inventory SET stock=stock+?,updated_at=? WHERE product_id=?").bind(qty,now,String(it.product_id)));restoredUnits+=qty}
   }
   ops.push(env.DB.prepare("DELETE FROM shipment_locks WHERE order_id=? AND state='admin_deleting'").bind(id));
   ops.push(env.DB.prepare("DELETE FROM order_shipping WHERE order_id=?").bind(id));
   ops.push(env.DB.prepare("DELETE FROM order_payments WHERE order_id=?").bind(id));
   ops.push(env.DB.prepare("DELETE FROM order_item_costs WHERE order_id=?").bind(id));
   ops.push(env.DB.prepare("DELETE FROM order_items WHERE order_id=?").bind(id));
   ops.push(env.DB.prepare("DELETE FROM orders WHERE id=? AND customer_id=?").bind(id,admin.id));
   ops.push(env.DB.prepare("DELETE FROM guest_orders WHERE id=? AND lower(email)=lower(?)").bind(id,admin.email));
  }
  await env.DB.batch(ops);adminDeleteLocks=[];
  await recordAdminAudit(env,admin,"test_orders_deleted",{count:ids.length,restoredUnits,orderIds:ids});
  return resposta({ok:true,deletedOrders:ids.length,restoredUnits,archived:true,message:ids.length===1?"Pedido de teste removido e arquivado com segurança.":ids.length+" pedidos de teste removidos e arquivados com segurança."});
 }catch(e){
  if(adminDeleteLocks.length)try{await env.DB.batch(adminDeleteLocks.map(x=>env.DB.prepare("DELETE FROM shipment_locks WHERE order_id=? AND state='admin_deleting'").bind(x)))}catch(cleanErr){console.error("Admin cleanup delete locks:",cleanErr)}
  console.error("Admin delete test orders:",e);return resposta({ok:false,error:"Não foi possível apagar os pedidos de teste agora."},500)
 }
}


async function recordAdminAudit(env,admin,action,detail={}){
 try{
  if(!admin?.id)return;
  let payload="{}";try{payload=JSON.stringify(detail||{}).slice(0,2000)}catch{}
  await env.DB.prepare("INSERT INTO admin_audit_log(id,admin_customer_id,action,detail_json,created_at) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),String(admin.id),String(action||"admin_action").slice(0,80),payload,new Date().toISOString()).run();
 }catch(e){console.error("Admin audit:",e)}
}

function operationalEventText(v,max=180){return String(v??"").replace(/[\u0000-\u001F\u007F]/g," ").trim().slice(0,max)}
function operationalEventMetadata(meta){
 const safe={};if(!meta||typeof meta!=="object")return safe;
 const blocked=/email|cpf|phone|telefone|address|endereco|street|cep|password|token|secret|card|document/i;
 for(const [k,v] of Object.entries(meta)){
  if(blocked.test(String(k)))continue;
  if(v===null||["string","number","boolean"].includes(typeof v))safe[operationalEventText(k,60)]=typeof v==="string"?operationalEventText(v,240):v;
 }
 return safe;
}
async function operationalAlertRecipients(env){
 try{
  const configured=String(env.ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(validEmail);
  const q=await env.DB.prepare("SELECT c.email FROM admin_credentials a JOIN customers c ON c.id=a.customer_id WHERE c.email_verified=1 UNION SELECT c.email FROM admin_members m JOIN customers c ON c.id=m.customer_id WHERE m.active=1 AND c.email_verified=1").all();
  return [...new Set([...configured,...(q.results||[]).map(x=>String(x.email||"").trim().toLowerCase()).filter(validEmail)])].slice(0,10);
 }catch(e){console.error("Destinatários de alerta:",e);return [...new Set(String(env.ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(validEmail))].slice(0,10)}
}
function operationalAlertHeading(eventType,category){
 const type=String(eventType||""),cat=String(category||"");
 if(cat==="payment")return "Problema no pagamento";
 if(cat==="shipping")return "Problema no envio/postagem";
 if(cat==="email")return "Problema no e-mail";
 if(cat==="freight")return "Problema no frete";
 if(type.includes("integration"))return "Falha de integração";
 return "Alerta operacional";
}
async function sendOperationalAlertEmail(env,{title,message,orderId,eventType,source}={}){
 const recipients=await operationalAlertRecipients(env);if(!recipients.length)return {ok:false,error:"admin_email_missing"};
 const safe=escapeHtml,subject="ALERTA | "+String(title||"VALENZA PARFUMS");
 const html='<!doctype html><html><body style="margin:0;background:#f5f1ec;font-family:Arial;color:#201d1a"><table width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px"><tr><td align="center"><table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #e7e0d8"><tr><td style="padding:28px;text-align:center;border-bottom:1px solid #eee7df"><div style="font-family:Georgia,serif;font-size:26px;letter-spacing:7px">VALENZA</div><div style="margin-top:6px;font-size:10px;letter-spacing:4px;color:#9b2c2c">ALERTA OPERACIONAL</div></td></tr><tr><td style="padding:30px"><h1 style="font:26px Georgia,serif;margin:0 0 16px">'+safe(String(title||"Alerta operacional"))+'</h1><p style="font-size:15px;line-height:1.6">'+safe(String(message||"Foi detectado um problema que precisa de atenção."))+'</p>'+(orderId?'<p style="font-size:14px"><b>Pedido:</b> '+safe(String(orderId))+'</p>':'')+'<p style="font-size:12px;color:#777;margin-top:22px">Evento: '+safe(String(eventType||"system.error"))+' · Origem: '+safe(String(source||"worker"))+'</p></td></tr></table></td></tr></table></body></html>';
 const textBody='VALENZA PARFUMS - ALERTA OPERACIONAL\n\n'+String(title||"Alerta operacional")+'\n'+String(message||"")+(orderId?'\nPedido: '+String(orderId):'')+'\nEvento: '+String(eventType||"system.error")+'\nOrigem: '+String(source||"worker");
 return sendResendMessage(env,{to:recipients,subject,html,text:textBody});
}
async function notifyOperationalError(env,{eventId,uniqueKey,orderId,eventType,category,status,severity,source,message}={}){
 try{
  if(String(severity)!=="error"&&String(status)!=="failed")return {ok:true,skipped:true};
  const now=new Date().toISOString(),key="ops-error:"+operationalEventText(uniqueKey||eventId||crypto.randomUUID(),150),title=operationalAlertHeading(eventType,category),msg=operationalEventText(message||"Falha operacional detectada.",500);
  const ins=await env.DB.prepare("INSERT OR IGNORE INTO admin_notifications(id,unique_key,type,severity,title,message,order_id,email_sent,created_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(),key,"error","error",title,msg,orderId?String(orderId):null,0,now).run();
  if(Number(ins.meta?.changes||0)<1)return {ok:true,duplicate:true};
  const n=await env.DB.prepare("SELECT id FROM admin_notifications WHERE unique_key=?").bind(key).first();
  const sent=await sendOperationalAlertEmail(env,{title,message:msg,orderId,eventType,source});
  if(sent.ok&&n?.id)await env.DB.prepare("UPDATE admin_notifications SET email_sent=1 WHERE id=?").bind(n.id).run();
  return {ok:true,notified:true,emailSent:!!sent.ok};
 }catch(e){console.error("Alerta operacional:",e);return {ok:false,error:"operational_alert_failed"}}
}
async function retryPendingOperationalErrorAlerts(env){
 try{
  await ensureAuthSchema(env);
  const q=await env.DB.prepare("SELECT id,title,message,order_id,created_at FROM admin_notifications WHERE type='error' AND email_sent=0 ORDER BY created_at ASC LIMIT 10").all();
  for(const n of (q.results||[])){
   const sent=await sendOperationalAlertEmail(env,{title:n.title,message:n.message,orderId:n.order_id,eventType:"retry.operational_alert",source:"scheduled-retry"});
   if(sent.ok)await env.DB.prepare("UPDATE admin_notifications SET email_sent=1 WHERE id=?").bind(n.id).run();
  }
 }catch(e){console.error("Retry alertas operacionais:",e)}
}
async function recordOperationalEvent(env,{orderId=null,eventType="",category="system",status="info",severity="info",source="worker",message="",metadata={},uniqueKey=null}={}){
 try{
  if(!env?.DB||!eventType)return {ok:false,skipped:true};
  const id=crypto.randomUUID(),key=operationalEventText(uniqueKey||("event:"+id),180),now=new Date().toISOString();
  const payload=JSON.stringify(operationalEventMetadata(metadata)).slice(0,2500);
  const event={eventId:id,uniqueKey:key,orderId:orderId?operationalEventText(orderId,160):null,eventType:operationalEventText(eventType,100),category:operationalEventText(category,50),status:operationalEventText(status,50),severity:operationalEventText(severity,30),source:operationalEventText(source,60),message:operationalEventText(message,500)};
  const r=await env.DB.prepare("INSERT OR IGNORE INTO operational_events(id,unique_key,order_id,event_type,category,status,severity,source,message,metadata_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)")
   .bind(id,key,event.orderId,event.eventType,event.category,event.status,event.severity,event.source,event.message,payload,now).run();
  const inserted=Number(r.meta?.changes||0)>0;
  if(inserted&&(event.severity==="error"||event.status==="failed"))await notifyOperationalError(env,event);
  return {ok:true,inserted,id};
 }catch(e){console.error("Central de Eventos:",e);return {ok:false,error:"event_log_failed"}}
}
async function recordPaymentStatusEvent(env,{orderId,rawStatus="",label="",method="",source="payment"}={}){
 const raw=String(rawStatus||"").toLowerCase(),name=String(label||"");
 let state="pending",eventType="payment.pending",severity="info",message="Pagamento aguardando confirmação.";
 if(name==="Pago"||["approved","processed"].includes(raw)){state="approved";eventType="payment.approved";severity="success";message="Pagamento aprovado."}
 else if(name==="Expirado"||raw==="expired"){state="expired";eventType="payment.expired";severity="warning";message="Pagamento expirado."}
 else if(name==="Cancelado"||["canceled","cancelled"].includes(raw)){state="cancelled";eventType="payment.cancelled";severity="warning";message="Pagamento cancelado."}
 else if(name==="Pagamento recusado"||["failed","rejected"].includes(raw)){state="failed";eventType="payment.failed";severity="error";message="Pagamento recusado ou não concluído."}
 return recordOperationalEvent(env,{orderId,eventType,category:"payment",status:state,severity,source,message,metadata:{rawStatus:raw||name,method},uniqueKey:"payment:"+String(orderId||"")+":"+state});
}
async function adminOperationalEvents(request,env){
 try{
  await ensureAuthSchema(env);const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  const url=new URL(request.url),orderId=operationalEventText(url.searchParams.get("orderId"),120),eventType=operationalEventText(url.searchParams.get("eventType"),80),category=operationalEventText(url.searchParams.get("category"),40),status=operationalEventText(url.searchParams.get("status"),40),date=operationalEventText(url.searchParams.get("date"),10);
  const where=[],bind=[];if(orderId){where.push("order_id LIKE ?");bind.push("%"+orderId+"%")}if(eventType){where.push("event_type=?");bind.push(eventType)}if(category){where.push("category=?");bind.push(category)}if(status){where.push("status=?");bind.push(status)}if(/^\d{4}-\d{2}-\d{2}$/.test(date)){where.push("date(created_at,'-3 hours')=?");bind.push(date)}
  const clause=where.length?" WHERE "+where.join(" AND "):"";
  const [rows,summary,types]=await Promise.all([
   env.DB.prepare("SELECT id,order_id,event_type,category,status,severity,source,message,metadata_json,created_at FROM operational_events"+clause+" ORDER BY created_at DESC LIMIT 250").bind(...bind).all(),
   env.DB.prepare("SELECT COUNT(*) total,SUM(CASE WHEN created_at>=datetime('now','-24 hours') THEN 1 ELSE 0 END) last24h,SUM(CASE WHEN severity='error' OR status='failed' THEN 1 ELSE 0 END) errors,SUM(CASE WHEN category='payment' THEN 1 ELSE 0 END) payments,SUM(CASE WHEN category='shipping' THEN 1 ELSE 0 END) shipping,SUM(CASE WHEN category='email' THEN 1 ELSE 0 END) emails FROM operational_events").first(),
   env.DB.prepare("SELECT event_type,category,COUNT(*) total FROM operational_events GROUP BY event_type,category ORDER BY event_type ASC").all()
  ]);
  return resposta({ok:true,generatedAt:new Date().toISOString(),filters:{orderId,eventType,category,status,date},summary:{total:Number(summary?.total||0),last24h:Number(summary?.last24h||0),errors:Number(summary?.errors||0),payments:Number(summary?.payments||0),shipping:Number(summary?.shipping||0),emails:Number(summary?.emails||0)},types:types.results||[],events:(rows.results||[]).map(x=>({...x,metadata:(()=>{try{return JSON.parse(x.metadata_json||"{}")}catch{return{}}})()}))});
 }catch(e){console.error("Central de Eventos admin:",e);return resposta({ok:false,error:"Não foi possível carregar a Central de Eventos."},500)}
}

function promotionText(v,max=180){return String(v||"").trim().slice(0,max)}
function promotionDate(v){const s=String(v||"").trim();if(!s)return null;const d=new Date(s);return Number.isFinite(d.getTime())?d.toISOString():null}
async function activePromotionPublic(env){
 try{
  await ensureAuthSchema(env);const now=new Date().toISOString();
  const row=await env.DB.prepare("SELECT id,title,message,starts_at,ends_at FROM admin_promotions WHERE active=1 AND (starts_at IS NULL OR starts_at<=?) AND (ends_at IS NULL OR ends_at>=?) ORDER BY updated_at DESC LIMIT 1").bind(now,now).first();
  return resposta({ok:true,promotion:row||null});
 }catch(e){console.error("Promoção pública:",e);return resposta({ok:true,promotion:null})}
}
async function activeProductPromotionRows(env){
 await ensureAuthSchema(env);
 const now=new Date().toISOString();
 const q=await env.DB.prepare("SELECT id,product_id,promo_price,starts_at,ends_at,updated_at FROM product_promotions WHERE active=1 AND (starts_at IS NULL OR starts_at<=?) AND (ends_at IS NULL OR ends_at>=?) ORDER BY updated_at DESC").bind(now,now).all();
 return q.results||[];
}
async function activeProductPromotionMap(env){
 const rows=await activeProductPromotionRows(env),catalog=await officialCatalog(env),map=new Map();
 for(const row of rows){
  const base=Number(catalog[row.product_id]?.price),promo=Number(row.promo_price);
  if(!map.has(String(row.product_id))&&Number.isFinite(base)&&Number.isFinite(promo)&&promo>0&&promo<base)map.set(String(row.product_id),row);
 }
 return map;
}
async function activeProductPromotionsPublic(env){
 try{
  const rows=await activeProductPromotionRows(env),catalog=await officialCatalog(env),promotions=[];
  for(const row of rows){
   const p=catalog[row.product_id],base=Number(p?.price),promo=Number(row.promo_price);
   if(!p||!Number.isFinite(base)||!Number.isFinite(promo)||promo<=0||promo>=base)continue;
   promotions.push({id:String(row.id),productId:String(row.product_id),promoPrice:Number(promo.toFixed(2)),regularPrice:Number(base.toFixed(2)),startsAt:row.starts_at||null,endsAt:row.ends_at||null});
  }
  return resposta({ok:true,promotions});
 }catch(e){console.error("Ofertas públicas:",e);return resposta({ok:false,promotions:[],error:"Não foi possível atualizar as ofertas agora."},503)}
}
async function adminProductPromotionSave(request,env){
 try{
  await ensureAuthSchema(env);const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  const d=await request.json().catch(()=>({})),productId=promotionText(d.productId,120),startsAt=promotionDate(d.startsAt),endsAt=promotionDate(d.endsAt),active=d.active?1:0,promoPrice=Number(d.promoPrice);
  const catalog=await officialCatalog(env),p=catalog[productId],base=Number(p?.price);
  if(!p)return resposta({ok:false,error:"Selecione um produto válido do catálogo."},400);
  if(!Number.isFinite(promoPrice)||promoPrice<=0)return resposta({ok:false,error:"Informe um preço promocional válido."},400);
  if(promoPrice>=base)return resposta({ok:false,error:"O preço promocional precisa ser menor que o preço normal de "+Number(base).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})+"."},400);
  if(String(d.startsAt||"").trim()&&!startsAt)return resposta({ok:false,error:"Data inicial inválida."},400);
  if(String(d.endsAt||"").trim()&&!endsAt)return resposta({ok:false,error:"Data final inválida."},400);
  if(startsAt&&endsAt&&Date.parse(endsAt)<=Date.parse(startsAt))return resposta({ok:false,error:"A data final deve ser posterior ao início."},400);
  const existing=await env.DB.prepare("SELECT id FROM product_promotions WHERE product_id=?").bind(productId).first(),id=String(existing?.id||promotionText(d.id,80)||crypto.randomUUID()),now=new Date().toISOString(),rounded=Number(promoPrice.toFixed(2));
  await env.DB.prepare("INSERT INTO product_promotions(id,product_id,promo_price,starts_at,ends_at,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(product_id) DO UPDATE SET promo_price=excluded.promo_price,starts_at=excluded.starts_at,ends_at=excluded.ends_at,active=excluded.active,updated_at=excluded.updated_at").bind(id,productId,rounded,startsAt,endsAt,active,now,now).run();
  const saved=await env.DB.prepare("SELECT id FROM product_promotions WHERE product_id=?").bind(productId).first();
  await recordAdminAudit(env,admin,"product_promotion_save",{id:String(saved?.id||id),productId,productName:p.name,regularPrice:base,promoPrice:rounded,active:!!active,startsAt,endsAt});
  return resposta({ok:true,id:String(saved?.id||id),message:"Oferta do produto salva com segurança."});
 }catch(e){console.error("Salvar oferta de produto:",e);return resposta({ok:false,error:"Não foi possível salvar a oferta do produto."},500)}
}
async function adminProductPromotionToggle(request,env){
 try{
  await ensureAuthSchema(env);const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  const d=await request.json().catch(()=>({})),id=promotionText(d.id,80);if(!id)return resposta({ok:false,error:"Oferta inválida."},400);
  const row=await env.DB.prepare("SELECT id,product_id,promo_price FROM product_promotions WHERE id=?").bind(id).first();if(!row)return resposta({ok:false,error:"Oferta não encontrada."},404);
  const catalog=await officialCatalog(env),base=Number(catalog[row.product_id]?.price),promo=Number(row.promo_price);
  if(d.active&&(!Number.isFinite(base)||!Number.isFinite(promo)||promo<=0||promo>=base))return resposta({ok:false,error:"Esta oferta não pode ser ativada porque o preço normal do produto mudou. Edite a oferta antes de ativar."},409);
  const now=new Date().toISOString();await env.DB.prepare("UPDATE product_promotions SET active=?,updated_at=? WHERE id=?").bind(d.active?1:0,now,id).run();
  await recordAdminAudit(env,admin,"product_promotion_toggle",{id,productId:row.product_id,active:!!d.active});
  return resposta({ok:true});
 }catch(e){console.error("Alternar oferta de produto:",e);return resposta({ok:false,error:"Não foi possível atualizar a oferta do produto."},500)}
}
async function adminPromotionSave(request,env){
 try{
  await ensureAuthSchema(env);const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  const d=await request.json().catch(()=>({})),id=promotionText(d.id,80)||crypto.randomUUID(),title=promotionText(d.title,70),message=promotionText(d.message,220),startsAt=promotionDate(d.startsAt),endsAt=promotionDate(d.endsAt),active=d.active?1:0;
  if(title.length<3)return resposta({ok:false,error:"Informe um título para a campanha."},400);
  if(message.length<5)return resposta({ok:false,error:"Informe a mensagem da campanha."},400);
  if(String(d.startsAt||"").trim()&&!startsAt)return resposta({ok:false,error:"Data inicial inválida."},400);
  if(String(d.endsAt||"").trim()&&!endsAt)return resposta({ok:false,error:"Data final inválida."},400);
  if(startsAt&&endsAt&&Date.parse(endsAt)<=Date.parse(startsAt))return resposta({ok:false,error:"A data final deve ser posterior ao início."},400);
  const now=new Date().toISOString();
  await env.DB.prepare("INSERT INTO admin_promotions(id,title,message,starts_at,ends_at,active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,message=excluded.message,starts_at=excluded.starts_at,ends_at=excluded.ends_at,active=excluded.active,updated_at=excluded.updated_at").bind(id,title,message,startsAt,endsAt,active,now,now).run();
  await recordAdminAudit(env,admin,"promotion_save",{id,title,active:!!active});
  return resposta({ok:true,id,message:"Campanha salva."});
 }catch(e){console.error("Salvar promoção:",e);return resposta({ok:false,error:"Não foi possível salvar a campanha."},500)}
}
async function adminPromotionToggle(request,env){
 try{
  await ensureAuthSchema(env);const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  const d=await request.json().catch(()=>({})),id=promotionText(d.id,80);if(!id)return resposta({ok:false,error:"Campanha inválida."},400);
  const now=new Date().toISOString(),r=await env.DB.prepare("UPDATE admin_promotions SET active=?,updated_at=? WHERE id=?").bind(d.active?1:0,now,id).run();
  if(!(r.meta?.changes||0))return resposta({ok:false,error:"Campanha não encontrada."},404);
  await recordAdminAudit(env,admin,"promotion_toggle",{id,active:!!d.active});
  return resposta({ok:true});
 }catch(e){console.error("Alternar promoção:",e);return resposta({ok:false,error:"Não foi possível atualizar a campanha."},500)}
}
async function sendAdminSaleEmail(env,row){
 try{
  if(!env.RESEND_API_KEY)return {ok:false,error:"missing_api_key"};
  const admin=await env.DB.prepare("SELECT c.email,c.name FROM admin_credentials a JOIN customers c ON c.id=a.customer_id WHERE c.email_verified=1 LIMIT 1").first();
  if(!admin?.email)return {ok:false,error:"admin_email_missing"};
  const safeOrder=escapeHtml(String(row.order_number||row.id||"")),safeCustomer=escapeHtml(String(row.customer_name||"Cliente")),safeEmail=escapeHtml(String(row.email||"")),safeMethod=escapeHtml(String(row.method||"").toUpperCase()),safeTotal=Number(row.total||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const html='<!doctype html><html><body style="margin:0;background:#f5f1ec;font-family:Arial;color:#201d1a"><table width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px"><tr><td align="center"><table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #e7e0d8"><tr><td style="padding:30px;text-align:center;border-bottom:1px solid #eee7df"><div style="font-family:Georgia,serif;font-size:26px;letter-spacing:7px">VALENZA</div><div style="margin-top:6px;font-size:10px;letter-spacing:4px;color:#8b7a68">NOVA VENDA</div></td></tr><tr><td style="padding:30px"><h1 style="font:28px Georgia,serif;margin:0 0 18px">Pagamento confirmado</h1><p style="font-size:15px;line-height:1.6;margin:0 0 10px"><b>Pedido:</b> '+safeOrder+'</p><p style="font-size:15px;line-height:1.6;margin:0 0 10px"><b>Cliente:</b> '+safeCustomer+' · '+safeEmail+'</p><p style="font-size:15px;line-height:1.6;margin:0 0 10px"><b>Pagamento:</b> '+safeMethod+'</p><p style="font-size:20px;line-height:1.6;margin:18px 0 0"><b>'+safeTotal+'</b></p></td></tr></table></td></tr></table></body></html>';
  const textBody='VALENZA PARFUMS\n\nNova venda confirmada.\nPedido: '+String(row.order_number||row.id||"")+'\nCliente: '+String(row.customer_name||"Cliente")+' ('+String(row.email||"")+')\nPagamento: '+String(row.method||"").toUpperCase()+'\nValor: '+safeTotal;
  const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:env.AUREA_EMAIL_FROM||"VALENZA PARFUMS <contato@valenzaparfums.com.br>",to:[admin.email],subject:"Nova venda confirmada | VALENZA PARFUMS",html,text:textBody})});
  if(!r.ok){console.error("Aviso venda e-mail:",r.status,await r.text());return {ok:false,status:r.status}}
  return {ok:true}
 }catch(e){console.error("Aviso venda e-mail:",e);return {ok:false,error:String(e&&e.message||e)}}
}

function whatsappSaleConfig(env){
 const apiVersion=/^v\d+\.\d+$/.test(String(env.WHATSAPP_API_VERSION||"").trim())?String(env.WHATSAPP_API_VERSION).trim():"v26.0";
 const phoneNumberId=String(env.WHATSAPP_PHONE_NUMBER_ID||"").trim();
 const accessToken=String(env.WHATSAPP_ACCESS_TOKEN||"").trim();
 const templateName=String(env.WHATSAPP_SALE_TEMPLATE_NAME||"valenza_nova_venda").trim();
 const language=String(env.WHATSAPP_SALE_TEMPLATE_LANG||"pt_BR").trim();
 const recipients=[...new Set(String(env.WHATSAPP_ADMIN_RECIPIENTS||"").split(",").map(x=>x.replace(/\D/g,"")).filter(x=>/^\d{8,15}$/.test(x)))].slice(0,5);
 return {apiVersion,phoneNumberId,accessToken,templateName,language,recipients,configured:!!(phoneNumberId&&accessToken&&templateName&&language&&recipients.length)};
}
function whatsappSaleTime(row){
 const d=new Date(String(row?.paid_at||row?.updated_at||row?.created_at||Date.now()));
 try{return new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(isNaN(d)?new Date():d)}catch{return new Date().toISOString()}
}
function whatsappSaleTemplateBody(cfg,row,recipient){
 const total=Number(row.total||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
 return {
  messaging_product:"whatsapp",
  to:recipient,
  type:"template",
  template:{
   name:cfg.templateName,
   language:{code:cfg.language},
   components:[{type:"body",parameters:[
    {type:"text",text:String(row.order_number||row.id||"Pedido")},
    {type:"text",text:String(row.customer_name||"Cliente").slice(0,120)},
    {type:"text",text:total},
    {type:"text",text:String(row.method||"").toUpperCase().slice(0,80)||"PAGAMENTO CONFIRMADO"},
    {type:"text",text:whatsappSaleTime(row)}
   ]}]
  }
 };
}
async function sendAdminSaleWhatsApp(env,row,notificationId){
 const cfg=whatsappSaleConfig(env);
 if(!cfg.configured)return {ok:false,configured:false,sent:0,failed:0};
 let sent=0,failed=0;
 for(const recipient of cfg.recipients){
  const recipientHash=await sha256("wa-recipient:"+recipient),now=new Date().toISOString();
  const existing=await env.DB.prepare("SELECT status,attempts FROM admin_whatsapp_deliveries WHERE notification_id=? AND recipient_hash=?").bind(notificationId,recipientHash).first();
  if(String(existing?.status||"")==="sent"){sent++;continue}
  await env.DB.prepare("INSERT OR IGNORE INTO admin_whatsapp_deliveries(notification_id,order_id,recipient_hash,status,attempts,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").bind(notificationId,String(row.id||""),recipientHash,"pending",0,now,now).run();
  try{
   const r=await fetch("https://graph.facebook.com/"+encodeURIComponent(cfg.apiVersion)+"/"+encodeURIComponent(cfg.phoneNumberId)+"/messages",{method:"POST",headers:{Authorization:"Bearer "+cfg.accessToken,"Content-Type":"application/json"},body:JSON.stringify(whatsappSaleTemplateBody(cfg,row,recipient))});
   const raw=await r.text();let data={};try{data=raw?JSON.parse(raw):{}}catch{}
   if(!r.ok){
    const detail=String(data?.error?.message||("HTTP "+r.status)).slice(0,300);
    await env.DB.prepare("UPDATE admin_whatsapp_deliveries SET status='failed',attempts=attempts+1,last_error=?,updated_at=? WHERE notification_id=? AND recipient_hash=?").bind(detail,now,notificationId,recipientHash).run();
    console.error("WhatsApp aviso venda:",r.status,detail);failed++;continue
   }
   const messageId=String(data?.messages?.[0]?.id||"").slice(0,220);
   await env.DB.prepare("UPDATE admin_whatsapp_deliveries SET status='sent',attempts=attempts+1,provider_message_id=?,last_error=NULL,updated_at=? WHERE notification_id=? AND recipient_hash=?").bind(messageId||null,now,notificationId,recipientHash).run();
   sent++;
  }catch(e){
   const detail=String(e&&e.message||e||"Falha de rede").slice(0,300);
   await env.DB.prepare("UPDATE admin_whatsapp_deliveries SET status='failed',attempts=attempts+1,last_error=?,updated_at=? WHERE notification_id=? AND recipient_hash=?").bind(detail,now,notificationId,recipientHash).run();
   console.error("WhatsApp aviso venda:",detail);failed++
  }
 }
 return {ok:failed===0&&sent===cfg.recipients.length,configured:true,sent,failed};
}
async function retryPendingSaleWhatsApp(env){
 try{
  const cfg=whatsappSaleConfig(env);if(!cfg.configured)return;
  const q=await env.DB.prepare("SELECT DISTINCT d.notification_id,d.order_id FROM admin_whatsapp_deliveries d JOIN admin_notifications n ON n.id=d.notification_id WHERE n.type='sale' AND d.status<>'sent' AND d.attempts<5 AND d.updated_at>=datetime('now','-24 hours') ORDER BY d.updated_at ASC LIMIT 10").all();
  for(const x of (q.results||[])){
   const row=await saleNotificationRow(env,x.order_id);
   if(!row||String(row.status)!=="Pago"||await orderBelongsToAdmin(env,row))continue;
   await sendAdminSaleWhatsApp(env,row,String(x.notification_id));
  }
 }catch(e){console.error("Retry aviso WhatsApp:",e)}
}
async function saleNotificationRow(env,orderId){
 const id=String(orderId||"");if(!id)return null;
 return env.DB.prepare("SELECT o.id,o.customer_id,o.order_number,o.status,o.total,c.name customer_name,c.email,p.method,p.updated_at paid_at FROM orders o LEFT JOIN customers c ON c.id=o.customer_id LEFT JOIN order_payments p ON p.order_id=o.id WHERE o.id=? UNION ALL SELECT g.id,NULL customer_id,g.order_number,g.status,g.total,g.customer_name,g.email,p.method,p.updated_at paid_at FROM guest_orders g LEFT JOIN order_payments p ON p.order_id=g.id WHERE g.id=? AND NOT EXISTS(SELECT 1 FROM orders o2 WHERE o2.id=g.id) LIMIT 1").bind(id,id).first()
}
async function orderBelongsToAdmin(env,row){
 if(!row)return false;
 if(row.customer_id){
  const own=await env.DB.prepare("SELECT 1 ok FROM admin_credentials WHERE customer_id=? LIMIT 1").bind(row.customer_id).first();if(own)return true;
  const member=await env.DB.prepare("SELECT 1 ok FROM admin_members WHERE customer_id=? AND active=1 LIMIT 1").bind(row.customer_id).first();if(member)return true;
 }
 if(row.email){
  const ownEmail=await env.DB.prepare("SELECT 1 ok FROM admin_credentials a JOIN customers c ON c.id=a.customer_id WHERE lower(c.email)=lower(?) LIMIT 1").bind(String(row.email)).first();if(ownEmail)return true;
  const memberEmail=await env.DB.prepare("SELECT 1 ok FROM admin_members m JOIN customers c ON c.id=m.customer_id WHERE m.active=1 AND lower(c.email)=lower(?) LIMIT 1").bind(String(row.email)).first();if(memberEmail)return true;
 }
 return false
}
async function notifyPaidOrder(env,orderId){
 try{
  await ensureAuthSchema(env);const id=String(orderId||"");if(!id)return;await markOpportunityRecovered(env,id);
  const row=await saleNotificationRow(env,id);
  if(!row||String(row.status)!=="Pago"||await orderBelongsToAdmin(env,row))return;
  const key="paid:"+id,now=new Date().toISOString(),title="Nova compra confirmada",message="Pedido "+String(row.order_number||id)+" · "+String(row.customer_name||"Cliente")+" · "+Number(row.total||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const ins=await env.DB.prepare("INSERT OR IGNORE INTO admin_notifications(id,unique_key,type,severity,title,message,order_id,email_sent,created_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(),key,"sale","success",title,message,id,0,now).run();
  if(Number(ins.meta?.changes||0)<1)return;
  const n=await env.DB.prepare("SELECT id FROM admin_notifications WHERE unique_key=?").bind(key).first();
  if(!n)return;
  const [sentEmail,sentWhatsApp]=await Promise.all([sendAdminSaleEmail(env,row),sendAdminSaleWhatsApp(env,row,n.id)]);
  if(sentEmail.ok)await env.DB.prepare("UPDATE admin_notifications SET email_sent=1 WHERE id=?").bind(n.id).run();
  if(sentWhatsApp.configured&&!sentWhatsApp.ok)console.error("WhatsApp de venda ficou pendente para retry:",id,sentWhatsApp.failed);
 }catch(e){console.error("Notificação compra:",e)}
}
async function retryPendingSaleNotifications(env){
 try{
  await ensureAuthSchema(env);
  const q=await env.DB.prepare("SELECT id,order_id FROM admin_notifications WHERE type='sale' AND email_sent=0 ORDER BY created_at ASC LIMIT 10").all();
  for(const n of (q.results||[])){
   const row=await saleNotificationRow(env,n.order_id);
   if(!row||String(row.status)!=="Pago"||await orderBelongsToAdmin(env,row)){await env.DB.prepare("UPDATE admin_notifications SET email_sent=1 WHERE id=?").bind(n.id).run();continue}
   const sent=await sendAdminSaleEmail(env,row);
   if(sent.ok)await env.DB.prepare("UPDATE admin_notifications SET email_sent=1 WHERE id=?").bind(n.id).run();
  }
  await retryPendingSaleWhatsApp(env);
 }catch(e){console.error("Retry aviso venda:",e)}
}
async function adminNotificationsPoll(request,env){
 try{
  await ensureAuthSchema(env);const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  await seedInventory(env);await syncInventorySmartAlerts(env);
  const [count,rows]=await Promise.all([
   env.DB.prepare("SELECT COUNT(*) total FROM admin_notifications WHERE read_at IS NULL").first(),
   env.DB.prepare("SELECT id,type,severity,title,message,order_id,email_sent,read_at,created_at FROM admin_notifications ORDER BY created_at DESC LIMIT 40").all()
  ]);
  return resposta({ok:true,generatedAt:new Date().toISOString(),unread:Number(count?.total||0),notifications:rows.results||[]});
 }catch(e){console.error("Poll de notificações:",e);return resposta({ok:false,error:"Não foi possível atualizar as notificações agora."},500)}
}
async function adminNotificationsRead(request,env){
 try{
  await ensureAuthSchema(env);const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  const now=new Date().toISOString(),r=await env.DB.prepare("UPDATE admin_notifications SET read_at=? WHERE read_at IS NULL").bind(now).run();
  await recordAdminAudit(env,admin,"notifications_read",{count:Number(r.meta?.changes||0)});
  return resposta({ok:true});
 }catch(e){console.error("Ler notificações:",e);return resposta({ok:false,error:"Não foi possível atualizar os alertas."},500)}
}

async function opportunitySync(request,env){
 try{
  await ensureAuthSchema(env);const u=await currentCustomer(request,env);if(!u)return resposta({ok:false,ignored:true},401);
  const isAdmin=allowedAdminEmail(env,u.email)||await env.DB.prepare("SELECT 1 ok FROM admin_credentials WHERE customer_id=? UNION ALL SELECT 1 ok FROM admin_members WHERE customer_id=? AND active=1 LIMIT 1").bind(u.id,u.id).first();if(isAdmin)return resposta({ok:true,ignored:true});
  const d=await request.json().catch(()=>({})),rawItems=Array.isArray(d.items)?d.items:[],now=new Date().toISOString();
  if(!rawItems.length){await env.DB.prepare("UPDATE checkout_opportunities SET cart_json='[]',subtotal=0,status='cleared',stage='cart',last_error=NULL,last_seen_at=?,updated_at=? WHERE customer_id=? AND status='active'").bind(now,now,u.id).run();return resposta({ok:true,cleared:true})}
  const allowedStages=new Set(["cart","checkout","shipping","payment","payment_error"]),stage=allowedStages.has(String(d.stage||""))?String(d.stage):"cart",paymentMethod=["pix","card"].includes(String(d.paymentMethod||"").toLowerCase())?String(d.paymentMethod).toLowerCase():null,lastError=String(d.lastError||"").trim().slice(0,300);
  const items=await canonicalItems(rawItems,env),snapshot=items.map(x=>({id:x.id,name:x.name,brand:x.brand,type:x.type,qty:x.qty,price:Number(x.price),img:String(x.img||"")})),subtotal=Number(items.reduce((s,x)=>s+Number(x.price)*Number(x.qty),0).toFixed(2));
  const profile=await env.DB.prepare("SELECT phone FROM customer_profiles WHERE customer_id=?").bind(u.id).first(),provided=String(d.phone||"").replace(/\D/g,"").slice(0,11),phone=(provided.length>=10?provided:String(profile?.phone||"").replace(/\D/g,"").slice(0,11))||null;
  const existing=await env.DB.prepare("SELECT id,status FROM checkout_opportunities WHERE customer_id=?").bind(u.id).first(),id=String(existing?.status==="active"?existing.id:crypto.randomUUID());
  await env.DB.prepare("INSERT INTO checkout_opportunities(id,customer_id,cart_json,stage,payment_method,last_error,subtotal,phone,status,last_seen_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(customer_id) DO UPDATE SET id=excluded.id,created_at=CASE WHEN checkout_opportunities.status='active' THEN checkout_opportunities.created_at ELSE excluded.created_at END,cart_json=excluded.cart_json,stage=excluded.stage,payment_method=COALESCE(excluded.payment_method,checkout_opportunities.payment_method),last_error=CASE WHEN excluded.last_error<>'' THEN excluded.last_error WHEN excluded.stage<>'payment_error' THEN NULL ELSE checkout_opportunities.last_error END,subtotal=excluded.subtotal,phone=COALESCE(excluded.phone,checkout_opportunities.phone),status='active',contacted_at=CASE WHEN checkout_opportunities.status='active' THEN checkout_opportunities.contacted_at ELSE NULL END,email_sent_at=CASE WHEN checkout_opportunities.status='active' THEN checkout_opportunities.email_sent_at ELSE NULL END,last_seen_at=excluded.last_seen_at,updated_at=excluded.updated_at")
   .bind(id,u.id,JSON.stringify(snapshot),stage,paymentMethod,lastError,subtotal,phone,"active",now,now,now).run();
  return resposta({ok:true});
 }catch(e){console.error("Oportunidade sync:",e);return resposta({ok:false,error:"Não foi possível registrar o carrinho agora."},500)}
}
async function markOpportunityRecovered(env,orderId){
 try{
  const row=await env.DB.prepare("SELECT customer_id,created_at FROM orders WHERE id=? AND status='Pago' LIMIT 1").bind(String(orderId||"")).first();if(!row?.customer_id)return;
  const now=new Date().toISOString(),attempt=crypto.randomUUID();await env.DB.batch([
   env.DB.prepare("INSERT OR IGNORE INTO checkout_recovered_orders(order_id,customer_id,attempt_id,recovered_at) SELECT ?,customer_id,?,? FROM checkout_opportunities WHERE customer_id=? AND status IN ('active','cleared') AND contacted_at IS NOT NULL AND julianday(contacted_at)<=julianday(?) AND julianday(created_at)<=julianday(?) AND (recovered_order_id IS NULL OR recovered_order_id<>?)").bind(String(orderId),attempt,now,row.customer_id,row.created_at,row.created_at,String(orderId)),
   env.DB.prepare("UPDATE checkout_opportunities SET status='recovered',recovered_order_id=?,recovered_at=?,recoveries=recoveries+1,last_error=NULL,updated_at=? WHERE customer_id=? AND status IN ('active','cleared') AND EXISTS(SELECT 1 FROM checkout_recovered_orders r WHERE r.order_id=? AND r.attempt_id=?)").bind(String(orderId),now,now,row.customer_id,String(orderId),attempt)
  ]);
 }catch(e){console.error("Oportunidade recuperada:",e)}
}
async function markOpportunityPaymentIssue(env,orderId,message){
 try{
  const row=await env.DB.prepare("SELECT customer_id FROM orders WHERE id=? LIMIT 1").bind(String(orderId||"")).first();if(!row?.customer_id)return;
  const now=new Date().toISOString();await env.DB.prepare("UPDATE checkout_opportunities SET status='active',stage='payment_error',last_error=?,last_seen_at=?,updated_at=? WHERE customer_id=? AND status='active'").bind(String(message||"Pagamento não concluído").slice(0,300),now,now,row.customer_id).run();
 }catch(e){console.error("Oportunidade erro pagamento:",e)}
}
function opportunityItems(row){try{const x=JSON.parse(row?.cart_json||"[]");return Array.isArray(x)?x:[]}catch{return[]}}
async function sendOpportunityRecoveryEmail(env,row){
 if(!env.RESEND_API_KEY)return {ok:false,error:"Resend não configurado"};
 const items=opportunityItems(row),safeName=escapeHtml(String(row.customer_name||"Cliente")),safeItems=items.map(x=>'<li style="margin:0 0 8px">'+escapeHtml(String(x.name||"Produto"))+' × '+Number(x.qty||1)+' — '+Number(Number(x.price||0)*Number(x.qty||1)).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})+'</li>').join(""),total=Number(row.subtotal||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}),shopUrl="https://www.valenzaparfums.com.br/";
 const html='<!doctype html><html><body style="margin:0;background:#f5f1ec;font-family:Arial;color:#201d1a"><table width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px"><tr><td align="center"><table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid #e7e0d8"><tr><td style="padding:30px;text-align:center;border-bottom:1px solid #eee7df"><div style="font-family:Georgia,serif;font-size:26px;letter-spacing:7px">VALENZA</div><div style="margin-top:6px;font-size:10px;letter-spacing:4px;color:#8b7a68">SEU CARRINHO</div></td></tr><tr><td style="padding:30px"><h1 style="font:27px Georgia,serif;margin:0 0 16px">Olá, '+safeName+'.</h1><p style="font-size:15px;line-height:1.6;color:#4f4943">Você deixou alguns perfumes no carrinho. Se quiser continuar, sua seleção está aqui para você voltar à VALENZA.</p><ul style="padding-left:20px;font-size:14px;line-height:1.5">'+safeItems+'</ul><p style="font-size:20px"><b>Total do carrinho: '+total+'</b></p><p style="margin:24px 0"><a href="'+shopUrl+'" style="display:inline-block;background:#171513;color:#fff;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:1.5px;padding:15px 22px">VOLTAR À VALENZA</a></p><p style="font-size:12px;color:#8a8178">Os preços e a disponibilidade são confirmados novamente no checkout.</p></td></tr></table></td></tr></table></body></html>';
 const textBody='Olá, '+String(row.customer_name||"Cliente")+'.\n\nVocê deixou itens no carrinho da VALENZA PARFUMS.\n\n'+items.map(x=>'- '+String(x.name||"Produto")+' x '+Number(x.qty||1)).join('\n')+'\n\nTotal do carrinho: '+total+'\n\nVoltar à loja: '+shopUrl+'\n\nOs preços e a disponibilidade são confirmados novamente no checkout.';
 try{const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json","Idempotency-Key":"checkout-recovery/"+row.id},body:JSON.stringify({from:env.AUREA_EMAIL_FROM||"VALENZA PARFUMS <contato@valenzaparfums.com.br>",to:[row.email],subject:"Seu carrinho está esperando | VALENZA PARFUMS",html,text:textBody})});if(!r.ok){console.error("Recuperação carrinho e-mail:",r.status,await r.text());return {ok:false,error:"Não foi possível enviar o e-mail."}}return {ok:true}}catch(e){console.error("Recuperação carrinho:",e);return {ok:false,error:"Não foi possível enviar o e-mail."}}
}
async function adminMemberGrant(request,env){
 try{
  await ensureAuthSchema(env);
  const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  const d=await request.json().catch(()=>({})),email=String(d.email||"").trim().toLowerCase();
  if(!validEmail(email))return resposta({ok:false,error:"Informe um e-mail válido."},400);
  const db=primaryDb(env);
  const target=await db.prepare("SELECT id,name,email,email_verified FROM customers WHERE lower(email)=lower(?) LIMIT 1").bind(email).first();
  if(!target)return resposta({ok:false,error:"Cliente não encontrado."},404);
  if(!Number(target.email_verified))return resposta({ok:false,error:"O cliente precisa confirmar o e-mail antes de receber acesso administrativo."},409);
  if(allowedAdminEmail(env,target.email))return resposta({ok:true,alreadyAdmin:true,message:"Esta conta já é administradora principal."});
  const now=new Date().toISOString();
  const wr=await db.prepare("INSERT INTO admin_members(customer_id,role,active,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(customer_id) DO UPDATE SET role='admin',active=1,created_by=excluded.created_by,updated_at=excluded.updated_at").bind(target.id,"admin",1,admin.id,now,now).run();
  const verify=await db.prepare("SELECT role,active FROM admin_members WHERE customer_id=? LIMIT 1").bind(target.id).first();
  if(!verify||!Number(verify.active))return resposta({ok:false,error:"O acesso não foi gravado no banco. Tente novamente."},500);
  await recordAdminAudit(env,admin,"admin_member_grant",{customerId:target.id,role:String(verify.role||"admin")});
  return resposta({ok:true,message:"Acesso administrativo ativado.",member:{name:target.name,role:String(verify.role||"admin")},persisted:true,changes:Number(wr.meta?.changes||0)});
 }catch(e){console.error("Ativar administrador:",e);return resposta({ok:false,error:"Não foi possível ativar o acesso administrativo agora."},500)}
}
async function processCheckoutRecovery(env){
 try{
  await ensureAuthSchema(env);
  if(!env.RESEND_API_KEY)return;
  const cutoff=new Date(Date.now()-15*60e3).toISOString();
  const rows=await env.DB.prepare("SELECT co.*,c.name customer_name,c.email FROM checkout_opportunities co JOIN customers c ON c.id=co.customer_id WHERE co.status='active' AND co.email_sent_at IS NULL AND co.subtotal>0 AND co.cart_json<>'[]' AND NOT EXISTS(SELECT 1 FROM admin_credentials a WHERE a.customer_id=co.customer_id) AND NOT EXISTS(SELECT 1 FROM admin_members m WHERE m.customer_id=co.customer_id AND m.active=1) AND (co.stage='payment_error' OR co.last_seen_at<=?) AND NOT EXISTS(SELECT 1 FROM orders o WHERE o.customer_id=co.customer_id AND o.status IN ('Aguardando pagamento','Processando')) ORDER BY CASE WHEN co.stage='payment_error' THEN 0 ELSE 1 END,co.last_seen_at ASC LIMIT 10").bind(cutoff).all();
  for(const row of (rows.results||[])){
   if(allowedAdminEmail(env,row.email))continue;
   try{
    const sent=await sendOpportunityRecoveryEmail(env,row);if(!sent.ok){console.error("Recuperação automática:",sent.error||"falha no envio");continue}
    const now=new Date().toISOString();
    const r=await env.DB.prepare("UPDATE checkout_opportunities SET email_sent_at=?,contacted_at=?,updated_at=? WHERE id=? AND status='active' AND email_sent_at IS NULL").bind(now,now,now,row.id).run();
    if(Number(r.meta?.changes||0)>0)await recordOperationalEvent(env,{eventType:"checkout.recovery_email",category:"checkout",status:"sent",severity:"info",source:"scheduled",message:"E-mail automático de recuperação de checkout enviado.",metadata:{opportunityId:row.id,customerId:row.customer_id,stage:row.stage,subtotal:Number(row.subtotal||0)},uniqueKey:"checkout-recovery:"+row.id});
   }catch(e){console.error("Recuperação automática de oportunidade:",row?.id,e)}
  }
 }catch(e){console.error("Processar recuperação automática:",e)}
}
async function adminOpportunityEmail(request,env){
 try{
  await ensureAuthSchema(env);const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  const d=await request.json().catch(()=>({})),id=String(d.id||"").trim();if(!id)return resposta({ok:false,error:"Oportunidade inválida."},400);
  const row=await env.DB.prepare("SELECT co.*,c.name customer_name,c.email FROM checkout_opportunities co JOIN customers c ON c.id=co.customer_id WHERE co.id=? AND NOT EXISTS(SELECT 1 FROM admin_credentials a WHERE a.customer_id=co.customer_id) AND NOT EXISTS(SELECT 1 FROM admin_members m WHERE m.customer_id=co.customer_id AND m.active=1) LIMIT 1").bind(id).first();if(!row||allowedAdminEmail(env,row.email))return resposta({ok:false,error:"Oportunidade não encontrada."},404);
  if(String(row.status)!=="active")return resposta({ok:false,error:"Esta oportunidade não está mais ativa."},409);
  if(row.email_sent_at)return resposta({ok:false,error:"Este carrinho já recebeu um e-mail de recuperação."},409);
  const pending=await env.DB.prepare("SELECT 1 ok FROM orders WHERE customer_id=? AND status IN ('Aguardando pagamento','Processando') LIMIT 1").bind(row.customer_id).first();if(pending)return resposta({ok:false,error:"O cliente já possui um pagamento pendente."},409);
  const sent=await sendOpportunityRecoveryEmail(env,row);if(!sent.ok)return resposta({ok:false,error:sent.error||"Não foi possível enviar o e-mail."},503);
  const now=new Date().toISOString();await env.DB.prepare("UPDATE checkout_opportunities SET email_sent_at=?,contacted_at=?,updated_at=? WHERE id=?").bind(now,now,now,id).run();
  await recordAdminAudit(env,admin,"opportunity_email",{id,customerEmail:row.email,subtotal:Number(row.subtotal||0)});
  return resposta({ok:true,message:"E-mail de recuperação enviado."});
 }catch(e){console.error("Admin oportunidade e-mail:",e);return resposta({ok:false,error:"Não foi possível enviar o e-mail agora."},500)}
}
async function adminOpportunityContacted(request,env){
 try{
  await ensureAuthSchema(env);const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  const d=await request.json().catch(()=>({})),id=String(d.id||"").trim(),now=new Date().toISOString();if(!id)return resposta({ok:false,error:"Oportunidade inválida."},400);
  const r=await env.DB.prepare("UPDATE checkout_opportunities SET contacted_at=?,updated_at=? WHERE id=? AND status='active'").bind(now,now,id).run();if(Number(r.meta?.changes||0)<1)return resposta({ok:false,error:"Oportunidade ativa não encontrada."},404);
  await recordAdminAudit(env,admin,"opportunity_contacted",{id});return resposta({ok:true});
 }catch(e){return resposta({ok:false,error:"Não foi possível atualizar o contato."},500)}
}
async function adminOpportunityArchive(request,env){
 try{
  await ensureAuthSchema(env);const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  const d=await request.json().catch(()=>({})),id=String(d.id||"").trim(),now=new Date().toISOString();if(!id)return resposta({ok:false,error:"Oportunidade inválida."},400);
  const r=await env.DB.prepare("UPDATE checkout_opportunities SET status='dismissed',updated_at=? WHERE id=? AND status='active'").bind(now,id).run();if(Number(r.meta?.changes||0)<1)return resposta({ok:false,error:"Oportunidade ativa não encontrada."},404);
  await recordAdminAudit(env,admin,"opportunity_archive",{id});return resposta({ok:true});
 }catch(e){return resposta({ok:false,error:"Não foi possível arquivar a oportunidade."},500)}
}
async function productCostSnapshotMap(env){
 const q=await env.DB.prepare("SELECT product_id,unit_cost FROM product_settings").all(),map=new Map();
 for(const row of (q.results||[])){const raw=row.unit_cost,n=raw===null||typeof raw==="undefined"?null:Number(raw);map.set(String(row.product_id),Number.isFinite(n)?Number(n.toFixed(2)):null)}
 return map
}
async function adminPriceUpdate(request,env){
 try{
  await ensureAuthSchema(env);
  const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  const d=await request.json().catch(()=>({})),productId=String(d.productId||"").trim(),source=AUREA_CATALOG[productId],price=Number(d.price);
  if(!source)return resposta({ok:false,error:"Produto inválido."},400);
  if(!Number.isFinite(price)||price<=0||price>50000)return resposta({ok:false,error:"Informe um preço de venda válido."},400);
  const rounded=Number(price.toFixed(2)),now=new Date().toISOString();
  const activePromo=await env.DB.prepare("SELECT promo_price,starts_at,ends_at FROM product_promotions WHERE product_id=? AND active=1 AND (ends_at IS NULL OR ends_at>=?) LIMIT 1").bind(productId,now).first();
  if(activePromo&&Number(activePromo.promo_price)>=rounded)return resposta({ok:false,error:"Este produto tem uma promoção ativa ou agendada igual ou maior que o novo preço normal. Ajuste ou encerre a promoção primeiro."},409);
  const old=await env.DB.prepare("SELECT price_override FROM product_settings WHERE product_id=?").bind(productId).first(),oldPrice=Number(old?.price_override??source.price);
  await env.DB.prepare("INSERT INTO product_settings(product_id,price_override,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO UPDATE SET price_override=excluded.price_override,updated_at=excluded.updated_at").bind(productId,rounded,now).run();
  await recordAdminAudit(env,admin,"price_update",{productId,productName:source.name,oldPrice:Number(oldPrice.toFixed(2)),price:rounded});
  return resposta({ok:true,message:"Preço normal atualizado em toda a loja.",product:{id:productId,price:rounded,pix:pixPrice(rounded),card3x:Number((rounded/3).toFixed(2))}});
 }catch(e){console.error("Atualizar preço normal:",e);return resposta({ok:false,error:"Não foi possível atualizar o preço agora."},500)}
}
async function adminProductAvailability(request,env){
 try{
  await ensureAuthSchema(env);
  const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  const d=await request.json().catch(()=>({})),productId=String(d.productId||"").trim(),active=d.active===true,source=AUREA_CATALOG[productId];
  if(!source)return resposta({ok:false,error:"Produto inválido."},400);
  const now=new Date().toISOString();
  if(active){
   await env.DB.prepare("DELETE FROM disabled_products WHERE product_id=?").bind(productId).run();
   await recordAdminAudit(env,admin,"product_restore",{productId,productName:source.name});
   return resposta({ok:true,active:true,message:"Produto restaurado na loja. Confira estoque e preço antes de vender."});
  }
  await env.DB.batch([
   env.DB.prepare("INSERT INTO disabled_products(product_id,disabled_at,disabled_by) VALUES(?,?,?) ON CONFLICT(product_id) DO UPDATE SET disabled_at=excluded.disabled_at,disabled_by=excluded.disabled_by").bind(productId,now,admin.id),
   env.DB.prepare("UPDATE product_promotions SET active=0,updated_at=? WHERE product_id=?").bind(now,productId)
  ]);
  await recordAdminAudit(env,admin,"product_remove",{productId,productName:source.name});
  return resposta({ok:true,active:false,message:"Produto removido da loja com segurança. O histórico de pedidos foi preservado."});
 }catch(e){console.error("Disponibilidade do produto:",e);return resposta({ok:false,error:"Não foi possível atualizar a disponibilidade do produto agora."},500)}
}

async function adminProductUpdate(request,env){
 try{
  await ensureAuthSchema(env);const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  await seedInventory(env);
  const d=await request.json().catch(()=>({})),productId=String(d.productId||"").trim(),source=AUREA_CATALOG[productId];
  if(!source)return resposta({ok:false,error:"Produto inválido."},400);
  const price=Number(d.price),stock=Number(d.stock),costRaw=d.unitCost,unitCost=(costRaw===null||costRaw===""||typeof costRaw==="undefined")?null:Number(costRaw),expectedStockUpdatedAt=String(d.expectedStockUpdatedAt||"").trim();
  if(!Number.isFinite(price)||price<=0||price>50000)return resposta({ok:false,error:"Informe um preço válido."},400);
  if(!Number.isInteger(stock)||stock<0||stock>10000)return resposta({ok:false,error:"Informe um estoque inteiro entre 0 e 10.000."},400);
  if(unitCost!==null&&(!Number.isFinite(unitCost)||unitCost<0||unitCost>50000))return resposta({ok:false,error:"Informe um custo unitário válido ou deixe em branco."},400);
  const now=new Date().toISOString(),activePromo=await env.DB.prepare("SELECT promo_price,starts_at,ends_at FROM product_promotions WHERE product_id=? AND active=1 AND (ends_at IS NULL OR ends_at>=?) LIMIT 1").bind(productId,now).first();
  if(activePromo&&Number(activePromo.promo_price)>=price)return resposta({ok:false,error:"Este produto tem uma oferta ativa ou agendada igual ou maior que o novo preço normal. Ajuste ou encerre a promoção primeiro."},409);
  const [oldSetting,oldInv,reservedRow]=await Promise.all([
   env.DB.prepare("SELECT price_override,unit_cost FROM product_settings WHERE product_id=?").bind(productId).first(),
   env.DB.prepare("SELECT stock,updated_at FROM inventory WHERE product_id=?").bind(productId).first(),
   env.DB.prepare("SELECT COALESCE(SUM(oi.quantity),0) reserved FROM order_items oi WHERE oi.product_id=? AND oi.stock_deducted=0 AND (EXISTS(SELECT 1 FROM orders o WHERE o.id=oi.order_id AND o.status IN ('Aguardando pagamento','Processando')) OR EXISTS(SELECT 1 FROM guest_orders g WHERE g.id=oi.order_id AND g.status IN ('Aguardando pagamento','Processando')))").bind(productId).first()
  ]),currentStock=Number(oldInv?.stock||0),reservedUnits=Number(reservedRow?.reserved||0),stockChanged=stock!==currentStock;
  if(stockChanged&&reservedUnits>0)return resposta({ok:false,error:"Este produto tem "+reservedUnits+" unidade(s) reservada(s) em pagamento pendente. Aguarde, conclua ou cancele esses pedidos antes de alterar o estoque."},409);
  if(stockChanged&&expectedStockUpdatedAt&&String(oldInv?.updated_at||"")!==expectedStockUpdatedAt)return resposta({ok:false,error:"O estoque mudou desde que você abriu esta tela. Atualize o painel e confira o valor antes de salvar novamente."},409);
  if(stockChanged){
   const inv=await env.DB.prepare("UPDATE inventory SET stock=?,updated_at=? WHERE product_id=? AND updated_at=?").bind(stock,now,productId,String(oldInv?.updated_at||"")).run();
   if(Number(inv.meta?.changes||0)<1)return resposta({ok:false,error:"O estoque mudou enquanto você salvava. Atualize o painel e tente novamente."},409);
  }
  await env.DB.prepare("INSERT INTO product_settings(product_id,price_override,unit_cost,updated_at) VALUES(?,?,?,?) ON CONFLICT(product_id) DO UPDATE SET price_override=excluded.price_override,unit_cost=excluded.unit_cost,updated_at=excluded.updated_at").bind(productId,Number(price.toFixed(2)),unitCost===null?null:Number(unitCost.toFixed(2)),now).run();
  await recordAdminAudit(env,admin,"product_update",{productId,productName:source.name,oldPrice:Number(oldSetting?.price_override??source.price),price:Number(price.toFixed(2)),oldStock:Number(oldInv?.stock||0),stock,oldUnitCost:oldSetting?.unit_cost??null,unitCost:unitCost===null?null:Number(unitCost.toFixed(2))});
  await syncInventorySmartAlerts(env);
  return resposta({ok:true,message:"Produto atualizado com segurança.",product:{id:productId,price:Number(price.toFixed(2)),stock,unitCost:unitCost===null?null:Number(unitCost.toFixed(2))}});
 }catch(e){console.error("Atualizar produto:",e);return resposta({ok:false,error:"Não foi possível atualizar o produto agora."},500)}
}

const STOCK_REORDER_THRESHOLD=10;
const STOCK_CRITICAL_THRESHOLD=2;
function inventorySmartState(stock){
 const n=Math.max(0,Number(stock||0));
 if(n<=0)return "out";
 if(n<=STOCK_CRITICAL_THRESHOLD)return "critical";
 if(n<=STOCK_REORDER_THRESHOLD)return "reorder";
 return "healthy";
}
async function syncInventorySmartAlerts(env){
 try{
  const [inventoryRows,disabledRows,stateRows]=await Promise.all([
   env.DB.prepare("SELECT product_id,stock,updated_at FROM inventory").all(),
   env.DB.prepare("SELECT product_id FROM disabled_products").all(),
   env.DB.prepare("SELECT product_id,state,stock,updated_at FROM inventory_alert_state").all()
  ]);
  const disabled=new Set((disabledRows.results||[]).map(x=>String(x.product_id))),previous=new Map((stateRows.results||[]).map(x=>[String(x.product_id),x])),now=new Date().toISOString(),ops=[],attention=[];
  for(const row of (inventoryRows.results||[])){
   const id=String(row.product_id||"");if(!id)continue;
   const stock=Math.max(0,Number(row.stock||0)),prev=previous.get(id),prevState=String(prev?.state||"");
   if(disabled.has(id)){
    if(prevState!=="disabled"){
     ops.push(env.DB.prepare("UPDATE admin_notifications SET read_at=COALESCE(read_at,?) WHERE type='stock' AND read_at IS NULL AND unique_key LIKE ?").bind(now,"stock:"+id+":%"));
     ops.push(env.DB.prepare("INSERT INTO inventory_alert_state(product_id,state,stock,updated_at) VALUES(?,?,?,?) ON CONFLICT(product_id) DO UPDATE SET state=excluded.state,stock=excluded.stock,updated_at=excluded.updated_at").bind(id,"disabled",stock,now));
    }
    continue;
   }
   const state=inventorySmartState(stock),product=AUREA_CATALOG[id]||{},name=String(product.name||id);
   if(state!=="healthy"){
    attention.push({product_id:id,name,brand:String(product.brand||""),stock,state,updated_at:String(row.updated_at||now)});
   }
   if(prevState!==state){
    if(state==="healthy"){
     ops.push(env.DB.prepare("UPDATE admin_notifications SET read_at=COALESCE(read_at,?) WHERE type='stock' AND read_at IS NULL AND unique_key LIKE ?").bind(now,"stock:"+id+":%"));
    }else{
     const title=state==="out"?"Produto esgotado":state==="critical"?"Estoque crítico":"Reposição recomendada";
     const message=state==="out"?name+" está esgotado. Reponha antes de novas vendas.":state==="critical"?name+" está com apenas "+stock+" unidade(s). Reposição urgente recomendada.":name+" está com "+stock+" unidade(s). Considere repor o estoque.";
     const uniqueKey="stock:"+id+":"+state+":"+String(row.updated_at||now);
     ops.push(env.DB.prepare("INSERT OR IGNORE INTO admin_notifications(id,unique_key,type,severity,title,message,order_id,email_sent,created_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(),uniqueKey,"stock","warning",title,message,null,1,now));
    }
   }
   if(prevState!==state||Number(prev?.stock)!==stock){
    ops.push(env.DB.prepare("INSERT INTO inventory_alert_state(product_id,state,stock,updated_at) VALUES(?,?,?,?) ON CONFLICT(product_id) DO UPDATE SET state=excluded.state,stock=excluded.stock,updated_at=excluded.updated_at").bind(id,state,stock,now));
   }
  }
  if(ops.length)await env.DB.batch(ops);
  const priority={out:0,critical:1,reorder:2};
  return attention.sort((a,b)=>(priority[a.state]??9)-(priority[b.state]??9)||a.stock-b.stock||a.name.localeCompare(b.name,"pt-BR"));
 }catch(e){console.error("Estoque inteligente:",e);return[]}
}



async function sendResendMessage(env,{to,subject,html,text}){
 if(!env.RESEND_API_KEY)return {ok:false,error:"Resend não configurado"};
 const recipients=(Array.isArray(to)?to:[to]).map(x=>String(x||"").trim().toLowerCase()).filter(validEmail);
 if(!recipients.length)return {ok:false,error:"Destinatário inválido"};
 try{
  const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:env.AUREA_EMAIL_FROM||"VALENZA PARFUMS <contato@valenzaparfums.com.br>",to:recipients,subject:String(subject||"VALENZA PARFUMS"),html:String(html||""),text:String(text||"")})});
  const raw=await r.text();let data={};try{data=JSON.parse(raw)}catch{}
  if(!r.ok){console.error("Resend operacional:",r.status,raw.slice(0,500));return {ok:false,status:r.status,error:"Resend recusou o envio"}}
  return {ok:true,id:String(data?.id||"")};
 }catch(e){console.error("Resend operacional:",e);return {ok:false,error:String(e&&e.message||e)}}
}
async function operationalOrderRow(env,orderId){
 const id=String(orderId||"");if(!id)return null;
 const row=await env.DB.prepare("SELECT o.id,o.customer_id,o.order_number,o.status,o.total,o.tracking_code,o.tracking_url,o.carrier,o.created_at,c.name customer_name,c.email,p.method,p.installments,p.status payment_status,p.status_detail,s.shipping_id,s.barcode,s.label_ready,s.delivery_time,s.city,s.state,s.carrier shipping_carrier FROM orders o LEFT JOIN customers c ON c.id=o.customer_id LEFT JOIN order_payments p ON p.order_id=o.id LEFT JOIN order_shipping s ON s.order_id=o.id WHERE o.id=? UNION ALL SELECT g.id,NULL customer_id,g.order_number,g.status,g.total,g.tracking_code,g.tracking_url,g.carrier,g.created_at,g.customer_name,g.email,p.method,p.installments,p.status payment_status,p.status_detail,s.shipping_id,s.barcode,s.label_ready,s.delivery_time,s.city,s.state,s.carrier shipping_carrier FROM guest_orders g LEFT JOIN order_payments p ON p.order_id=g.id LEFT JOIN order_shipping s ON s.order_id=g.id WHERE g.id=? AND NOT EXISTS(SELECT 1 FROM orders o2 WHERE o2.id=g.id) LIMIT 1").bind(id,id).first();
 if(!row)return null;
 const items=await env.DB.prepare("SELECT name,brand,type,quantity,unit_price FROM order_items WHERE order_id=? ORDER BY created_at ASC").bind(id).all();
 return {...row,items:items.results||[]};
}
function operationalEmailEvent(eventKey,row){
 const code=String(row?.barcode||row?.tracking_code||"").trim(),carrier=String(row?.shipping_carrier||row?.carrier||"").trim(),status=String(row?.status||"");
 const map={
  order_received:{tag:"PEDIDO RECEBIDO",title:"Recebemos seu pedido",subject:"Pedido recebido | VALENZA PARFUMS",message:String(row?.method||"").toLowerCase()==="pix"?"Seu pedido foi criado e o pagamento via PIX está aguardando confirmação. O PIX expira em aproximadamente 30 minutos.":"Seu pedido foi recebido e o pagamento está sendo processado."},
  payment_confirmed:{tag:"PAGAMENTO CONFIRMADO",title:"Pagamento confirmado",subject:"Pagamento confirmado | VALENZA PARFUMS",message:"O pagamento foi confirmado. Seu pedido entrou na etapa de preparação, que pode levar até 10 dias úteis antes do prazo da transportadora."},
  payment_failed:{tag:"PAGAMENTO",title:status==="Expirado"?"Seu PIX expirou":"Pagamento não concluído",subject:(status==="Expirado"?"PIX expirado":"Pagamento não concluído")+" | VALENZA PARFUMS",message:status==="Expirado"?"O prazo deste PIX terminou. Você pode acessar Meus Pedidos e iniciar uma nova tentativa de pagamento.":"Não foi possível concluir este pagamento. Acesse sua conta VALENZA para verificar o pedido ou tentar novamente."},
  shipment_prepared:{tag:"POSTAGEM PREPARADA",title:"A postagem do seu pedido foi preparada",subject:"Postagem preparada | VALENZA PARFUMS",message:"A etiqueta/postagem foi criada. Isso ainda não significa que o pacote já está em trânsito; após a preparação do pedido, a transportadora começará a atualizar o rastreamento."},
  in_transit:{tag:"PEDIDO ENVIADO",title:"Seu pedido está em trânsito",subject:"Seu pedido foi enviado | VALENZA PARFUMS",message:"A transportadora registrou o envio e seu pedido está a caminho."},
  out_for_delivery:{tag:"SAIU PARA ENTREGA",title:"Seu pedido saiu para entrega",subject:"Saiu para entrega | VALENZA PARFUMS",message:"A transportadora informou que seu pedido saiu para entrega. Acompanhe o rastreamento e mantenha alguém disponível no endereço."},
  delivered:{tag:"PEDIDO ENTREGUE",title:"Seu pedido foi entregue",subject:"Pedido entregue | VALENZA PARFUMS",message:"A transportadora registrou a entrega do seu pedido. Obrigado por comprar com a VALENZA PARFUMS."}
 };
 const e=map[String(eventKey||"")];if(!e)return null;return {...e,code,carrier};
}
function operationalOrderEmailContent(eventKey,row){
 const e=operationalEmailEvent(eventKey,row);if(!e)return null;
 const safe=escapeHtml,money=n=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}),order=safe(String(row.order_number||row.id||"")),customer=safe(String(row.customer_name||"Cliente")),items=row.items||[];
 const itemRows=items.length?items.map(x=>'<tr><td style="padding:8px;border-bottom:1px solid #eee">'+safe(String(x.name||"Produto"))+'</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">'+Number(x.quantity||0)+'</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">'+money(Number(x.unit_price||0)*Number(x.quantity||0))+'</td></tr>').join(""):'<tr><td colspan="3" style="padding:10px;color:#777">Itens disponíveis em Meus Pedidos.</td></tr>';
 const tracking=e.code?'<p style="font-size:14px;line-height:1.6"><b>Rastreio:</b> '+safe(e.code)+(e.carrier?' · '+safe(e.carrier):'')+'</p>':'';
 const html='<!doctype html><html><body style="margin:0;background:#f5f1ec;font-family:Arial;color:#201d1a"><table width="100%" cellspacing="0" cellpadding="0" style="padding:26px 10px"><tr><td align="center"><table width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border:1px solid #e7e0d8"><tr><td style="padding:28px;text-align:center;border-bottom:1px solid #eee7df"><div style="font-family:Georgia,serif;font-size:26px;letter-spacing:7px">VALENZA</div><div style="margin-top:6px;font-size:10px;letter-spacing:3px;color:#8b7a68">'+safe(e.tag)+'</div></td></tr><tr><td style="padding:28px"><h1 style="font:27px Georgia,serif;margin:0 0 16px">'+safe(e.title)+'</h1><p style="font-size:14px;line-height:1.7">Olá, '+customer+'. '+safe(e.message)+'</p><p style="font-size:14px"><b>Pedido:</b> '+order+'<br><b>Valor:</b> '+money(row.total)+'</p>'+tracking+'<table width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;border:1px solid #eee;margin-top:18px"><tr><th style="padding:8px;text-align:left">Produto</th><th style="padding:8px">Un.</th><th style="padding:8px;text-align:right">Valor</th></tr>'+itemRows+'</table><p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#777">Acompanhe o pedido em <b>Meus Pedidos</b> no site da VALENZA. Produtos sob encomenda têm preparação de até 10 dias úteis antes do prazo da transportadora.</p></td></tr></table></td></tr></table></body></html>';
 const text=['VALENZA PARFUMS — '+e.tag,'',e.title,'',e.message,'Pedido: '+String(row.order_number||row.id||''),'Valor: '+money(row.total),e.code?'Rastreio: '+e.code+(e.carrier?' · '+e.carrier:''):'','',...items.map(x=>'- '+String(x.name||'Produto')+' × '+Number(x.quantity||0)),'','Acompanhe em Meus Pedidos: https://www.valenzaparfums.com.br/'].filter(Boolean).join('\n');
 return {subject:e.subject,html,text};
}
async function sendOrderOperationalEmail(env,orderId,eventKey){
 try{
  await ensureAuthSchema(env);const id=String(orderId||""),event=String(eventKey||"");if(!id||!operationalEmailEvent(event,{}))return {ok:false,error:"Evento de e-mail inválido"};
  const row=await operationalOrderRow(env,id);if(!row||!validEmail(row.email))return {ok:false,error:"Pedido ou e-mail não encontrado"};
  if(await orderBelongsToAdmin(env,row))return {ok:true,skipped:true,reason:"admin_test"};
  const now=new Date().toISOString();await env.DB.prepare("INSERT OR IGNORE INTO customer_email_deliveries(order_id,event_key,status,attempts,recipient,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").bind(id,event,"pending",0,String(row.email).toLowerCase(),now,now).run();
  const delivery=await env.DB.prepare("SELECT status,attempts,updated_at FROM customer_email_deliveries WHERE order_id=? AND event_key=?").bind(id,event).first();
  if(String(delivery?.status||"")==="sent")return {ok:true,skipped:true,reason:"already_sent"};
  if(Number(delivery?.attempts||0)>=5)return {ok:false,error:"Limite de tentativas atingido"};
  const stale=new Date(Date.now()-5*60e3).toISOString(),lock=await env.DB.prepare("UPDATE customer_email_deliveries SET status='sending',attempts=attempts+1,updated_at=? WHERE order_id=? AND event_key=? AND status<>'sent' AND (status<>'sending' OR updated_at<?)").bind(now,id,event,stale).run();
  if(Number(lock.meta?.changes||0)<1)return {ok:true,skipped:true,reason:"in_progress"};
  const content=operationalOrderEmailContent(event,row);if(!content)return {ok:false,error:"Modelo de e-mail não encontrado"};
  const sent=await sendResendMessage(env,{to:row.email,subject:content.subject,html:content.html,text:content.text});
  if(!sent.ok){const err=String(sent.error||("HTTP "+(sent.status||""))).slice(0,400);await env.DB.prepare("UPDATE customer_email_deliveries SET status='failed',subject=?,last_error=?,updated_at=? WHERE order_id=? AND event_key=?").bind(content.subject,err,new Date().toISOString(),id,event).run();await recordOperationalEvent(env,{orderId:id,eventType:"email.failed",category:"email",status:"failed",severity:"error",source:"resend",message:"Falha no envio do e-mail operacional.",metadata:{emailEvent:event,attempt:Number(delivery?.attempts||0)+1},uniqueKey:"email:"+id+":"+event+":failed:"+(Number(delivery?.attempts||0)+1)});return {ok:false,error:err}}
  const done=new Date().toISOString();await env.DB.prepare("UPDATE customer_email_deliveries SET status='sent',subject=?,provider_id=?,last_error=NULL,updated_at=?,sent_at=? WHERE order_id=? AND event_key=?").bind(content.subject,sent.id||null,done,done,id,event).run();
  await recordOperationalEvent(env,{orderId:id,eventType:"email.sent",category:"email",status:"sent",severity:"success",source:"resend",message:"E-mail operacional enviado.",metadata:{emailEvent:event},uniqueKey:"email:"+id+":"+event+":sent"});
  return {ok:true,sent:true,eventKey:event,orderId:id};
 }catch(e){console.error("E-mail operacional pedido:",e);return {ok:false,error:String(e&&e.message||e)}}
}
async function retryPendingOperationalEmails(env){
 try{
  await ensureAuthSchema(env);const q=await env.DB.prepare("SELECT order_id,event_key FROM customer_email_deliveries WHERE status IN ('pending','failed','sending') AND attempts<5 AND updated_at>=datetime('now','-7 days') ORDER BY updated_at ASC LIMIT 20").all();
  for(const x of (q.results||[]))await sendOrderOperationalEmail(env,x.order_id,x.event_key);
 }catch(e){console.error("Retry e-mails operacionais:",e)}
}
async function adminOperationalEmailsStatus(request,env){
 try{
  await ensureAuthSchema(env);const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  const [counts,rows]=await Promise.all([env.DB.prepare("SELECT COUNT(*) total,SUM(CASE WHEN status='sent' THEN 1 ELSE 0 END) sent,SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) failed,SUM(CASE WHEN status IN ('pending','sending') THEN 1 ELSE 0 END) pending FROM customer_email_deliveries").first(),env.DB.prepare("SELECT d.order_id,d.event_key,d.status,d.attempts,d.recipient,d.subject,d.last_error,d.created_at,d.updated_at,d.sent_at,COALESCE(o.order_number,g.order_number,d.order_id) order_number FROM customer_email_deliveries d LEFT JOIN orders o ON o.id=d.order_id LEFT JOIN guest_orders g ON g.id=d.order_id ORDER BY d.updated_at DESC LIMIT 60").all()]);
  return resposta({ok:true,resend:!!env.RESEND_API_KEY,counts:{total:Number(counts?.total||0),sent:Number(counts?.sent||0),failed:Number(counts?.failed||0),pending:Number(counts?.pending||0)},rows:rows.results||[]});
 }catch(e){console.error("Status e-mails operacionais:",e);return resposta({ok:false,error:"Não foi possível carregar os e-mails operacionais."},500)}
}
async function adminOperationalEmailTest(request,env){
 try{
  await ensureAuthSchema(env);const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  if(!validEmail(admin.email))return resposta({ok:false,error:"E-mail do administrador inválido."},400);
  const html='<!doctype html><html><body style="font-family:Arial;background:#f5f1ec;padding:30px"><div style="max-width:560px;margin:auto;background:white;border:1px solid #e7e0d8;padding:30px"><div style="font:26px Georgia,serif;letter-spacing:6px;text-align:center">VALENZA</div><h1 style="font:25px Georgia,serif">E-mails operacionais ativos</h1><p style="line-height:1.7">Este é um teste do sistema automático de e-mails da VALENZA. O Resend respondeu ao disparo e a comunicação operacional está disponível.</p><p style="color:#777;font-size:12px">Pedido recebido · pagamento confirmado · falha/expiração · postagem preparada · rastreio e entrega.</p></div></body></html>';
  const sent=await sendResendMessage(env,{to:admin.email,subject:"Teste de e-mails operacionais | VALENZA PARFUMS",html,text:"VALENZA PARFUMS\n\nTeste do sistema de e-mails operacionais concluído."});
  if(!sent.ok)return resposta({ok:false,error:sent.error||"Não foi possível enviar o teste."},503);
  await recordAdminAudit(env,admin,"operational_email_test",{email:admin.email,providerId:sent.id||null});
  return resposta({ok:true,message:"E-mail de teste enviado.",recipient:admin.email});
 }catch(e){console.error("Teste e-mail operacional:",e);return resposta({ok:false,error:"Não foi possível enviar o e-mail de teste."},500)}
}

function saoPauloNowParts(date=new Date()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date).filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
 return {date:parts.year+"-"+parts.month+"-"+parts.day,hour:Number(parts.hour||0),minute:Number(parts.minute||0)};
}
function dailyReportRecipients(env){
 const list=String(env.ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(validEmail);
 return [...new Set(list)].slice(0,10);
}
function dailyReportDateBr(iso){
 const [y,m,d]=String(iso||"").split("-");return y&&m&&d?d+"/"+m+"/"+y:String(iso||"");
}
async function buildDailyReport(env,reportDate){
 await ensureAuthSchema(env);await seedInventory(env);
 const date=String(reportDate||saoPauloNowParts().date),stockItems=await syncInventorySmartAlerts(env);
 const realOrdersCte="WITH real_orders AS (SELECT o.id,o.status,o.total,o.created_at FROM orders o WHERE NOT EXISTS(SELECT 1 FROM admin_credentials a WHERE a.customer_id=o.customer_id) AND NOT EXISTS(SELECT 1 FROM admin_members m WHERE m.customer_id=o.customer_id AND m.active=1) UNION ALL SELECT g.id,g.status,g.total,g.created_at FROM guest_orders g WHERE NOT EXISTS(SELECT 1 FROM orders o2 WHERE o2.id=g.id) AND NOT EXISTS(SELECT 1 FROM admin_credentials a JOIN customers c ON c.id=a.customer_id WHERE lower(c.email)=lower(g.email)) AND NOT EXISTS(SELECT 1 FROM admin_members m JOIN customers c2 ON c2.id=m.customer_id WHERE m.active=1 AND lower(c2.email)=lower(g.email))) ";
 const [day,pending,products,inventory,disabled,alerts,shipping]=await Promise.all([
  env.DB.prepare(realOrdersCte+"SELECT COUNT(*) total_orders,SUM(CASE WHEN r.status='Pago' THEN 1 ELSE 0 END) paid_orders,COALESCE(SUM(CASE WHEN r.status='Pago' THEN r.total ELSE 0 END),0) revenue,SUM(CASE WHEN r.status IN ('Aguardando pagamento','Processando') THEN 1 ELSE 0 END) pending_orders,SUM(CASE WHEN r.status='Pagamento recusado' THEN 1 ELSE 0 END) rejected_orders,SUM(CASE WHEN r.status='Pago' AND lower(COALESCE(p.method,''))='pix' THEN 1 ELSE 0 END) pix_orders,COALESCE(SUM(CASE WHEN r.status='Pago' AND lower(COALESCE(p.method,''))='pix' THEN r.total ELSE 0 END),0) pix_revenue,SUM(CASE WHEN r.status='Pago' AND lower(COALESCE(p.method,''))<>'pix' THEN 1 ELSE 0 END) card_orders,COALESCE(SUM(CASE WHEN r.status='Pago' AND lower(COALESCE(p.method,''))<>'pix' THEN r.total ELSE 0 END),0) card_revenue FROM real_orders r LEFT JOIN order_payments p ON p.order_id=r.id WHERE date(r.created_at,'-3 hours')=?").bind(date).first(),
  env.DB.prepare(realOrdersCte+"SELECT SUM(CASE WHEN status IN ('Aguardando pagamento','Processando') THEN 1 ELSE 0 END) pending_now,SUM(CASE WHEN status='Pagamento recusado' THEN 1 ELSE 0 END) rejected_all FROM real_orders").first(),
  env.DB.prepare(realOrdersCte+"SELECT oi.product_id,MAX(oi.name) name,MAX(oi.brand) brand,SUM(oi.quantity) units,ROUND(SUM(oi.quantity*oi.unit_price),2) value FROM order_items oi JOIN real_orders r ON r.id=oi.order_id WHERE r.status='Pago' AND date(r.created_at,'-3 hours')=? GROUP BY oi.product_id ORDER BY units DESC,value DESC LIMIT 10").bind(date).all(),
  env.DB.prepare("SELECT product_id,stock FROM inventory").all(),
  env.DB.prepare("SELECT product_id FROM disabled_products").all(),
  env.DB.prepare("SELECT id,type,severity,title,message,created_at,read_at FROM admin_notifications WHERE date(created_at,'-3 hours')=? AND type<>'sale' ORDER BY created_at DESC LIMIT 20").bind(date).all(),
  env.DB.prepare(realOrdersCte+"SELECT SUM(CASE WHEN r.status='Pago' AND COALESCE(s.carrier,'')<>'Entrega local Valenza' AND COALESCE(s.shipping_id,'')='' AND COALESCE(s.barcode,'')='' AND COALESCE(l.state,'')='' THEN 1 ELSE 0 END) awaiting_shipping FROM real_orders r LEFT JOIN order_shipping s ON s.order_id=r.id LEFT JOIN shipment_locks l ON l.order_id=r.id").first()
 ]);
 const disabledSet=new Set((disabled.results||[]).map(x=>String(x.product_id))),activeInv=(inventory.results||[]).filter(x=>!disabledSet.has(String(x.product_id))),out=stockItems.filter(x=>x.state==="out"),critical=stockItems.filter(x=>x.state==="critical"),reorder=stockItems.filter(x=>x.state==="reorder");
 const paid=Number(day?.paid_orders||0),revenue=Number(day?.revenue||0),alertRows=alerts.results||[];
 return {date,generatedAt:new Date().toISOString(),sales:{orders:Number(day?.total_orders||0),paid,revenue:Number(revenue.toFixed(2)),averageTicket:paid?Number((revenue/paid).toFixed(2)):0,pendingCreatedToday:Number(day?.pending_orders||0),rejectedToday:Number(day?.rejected_orders||0)},payments:{pixOrders:Number(day?.pix_orders||0),pixRevenue:Number(Number(day?.pix_revenue||0).toFixed(2)),cardOrders:Number(day?.card_orders||0),cardRevenue:Number(Number(day?.card_revenue||0).toFixed(2))},pending:{ordersNow:Number(pending?.pending_now||0),awaitingShipping:Number(shipping?.awaiting_shipping||0)},stock:{units:activeInv.reduce((a,x)=>a+Number(x.stock||0),0),products:activeInv.length,out:out.length,critical:critical.length,reorder:reorder.length,attention:stockItems.slice(0,10)},topProducts:products.results||[],alerts:{count:alertRows.length,unread:alertRows.filter(x=>!x.read_at).length,items:alertRows}};
}
function dailyReportEmailContent(report){
 const money=n=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}),safe=escapeHtml,date=dailyReportDateBr(report.date),top=(report.topProducts||[]),alerts=report.alerts?.items||[],stock=report.stock||{},sales=report.sales||{},pay=report.payments||{},pending=report.pending||{};
 const productRows=top.length?top.map(x=>'<tr><td style="padding:8px;border-bottom:1px solid #eee">'+safe(String(x.name||x.product_id))+'</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">'+Number(x.units||0)+'</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">'+money(x.value)+'</td></tr>').join(""):'<tr><td colspan="3" style="padding:12px;color:#777">Nenhum produto vendido hoje.</td></tr>';
 const alertRows=alerts.length?alerts.slice(0,8).map(x=>'<li style="margin:0 0 8px"><b>'+safe(String(x.title||"Alerta"))+'</b> — '+safe(String(x.message||""))+'</li>').join(""):'<li>Nenhum alerta operacional registrado hoje.</li>';
 const html='<!doctype html><html><body style="margin:0;background:#f5f1ec;font-family:Arial;color:#201d1a"><table width="100%" cellspacing="0" cellpadding="0" style="padding:24px 10px"><tr><td align="center"><table width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#fff;border:1px solid #e7e0d8"><tr><td style="padding:28px;text-align:center;border-bottom:1px solid #eee7df"><div style="font-family:Georgia,serif;font-size:26px;letter-spacing:7px">VALENZA</div><div style="margin-top:6px;font-size:10px;letter-spacing:3px;color:#8b7a68">RELATÓRIO DIÁRIO · '+safe(date)+'</div></td></tr><tr><td style="padding:26px"><h1 style="font:26px Georgia,serif;margin:0 0 18px">Resumo do dia</h1><table width="100%" cellspacing="0" cellpadding="8" style="font-size:14px"><tr><td><b>Vendas pagas</b><br>'+Number(sales.paid||0)+'</td><td><b>Faturamento</b><br>'+money(sales.revenue)+'</td><td><b>Ticket médio</b><br>'+money(sales.averageTicket)+'</td></tr><tr><td><b>PIX</b><br>'+Number(pay.pixOrders||0)+' · '+money(pay.pixRevenue)+'</td><td><b>Cartão</b><br>'+Number(pay.cardOrders||0)+' · '+money(pay.cardRevenue)+'</td><td><b>Pendentes agora</b><br>'+Number(pending.ordersNow||0)+'</td></tr><tr><td><b>Aguardando envio</b><br>'+Number(pending.awaitingShipping||0)+'</td><td><b>Estoque crítico/esgotado</b><br>'+Number(stock.critical||0)+' / '+Number(stock.out||0)+'</td><td><b>Reposição</b><br>'+Number(stock.reorder||0)+'</td></tr></table><h2 style="font:20px Georgia,serif;margin:26px 0 10px">Produtos vendidos</h2><table width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;border:1px solid #eee"><tr><th style="padding:8px;text-align:left">Produto</th><th style="padding:8px">Un.</th><th style="padding:8px;text-align:right">Valor</th></tr>'+productRows+'</table><h2 style="font:20px Georgia,serif;margin:26px 0 10px">Alertas do dia</h2><ul style="font-size:13px;line-height:1.55;padding-left:18px">'+alertRows+'</ul><p style="margin:24px 0 0;color:#777;font-size:11px">Relatório automático da operação VALENZA. Vendas de contas administrativas/testes são excluídas dos indicadores comerciais.</p></td></tr></table></td></tr></table></body></html>';
 const text=['VALENZA PARFUMS — RELATÓRIO DIÁRIO '+date,'','Vendas pagas: '+Number(sales.paid||0),'Faturamento: '+money(sales.revenue),'Ticket médio: '+money(sales.averageTicket),'PIX: '+Number(pay.pixOrders||0)+' · '+money(pay.pixRevenue),'Cartão: '+Number(pay.cardOrders||0)+' · '+money(pay.cardRevenue),'Pedidos pendentes agora: '+Number(pending.ordersNow||0),'Aguardando envio: '+Number(pending.awaitingShipping||0),'Estoque: '+Number(stock.out||0)+' esgotado(s), '+Number(stock.critical||0)+' crítico(s), '+Number(stock.reorder||0)+' para repor','','Produtos vendidos:',...(top.length?top.map(x=>'- '+String(x.name||x.product_id)+' · '+Number(x.units||0)+' un. · '+money(x.value)):['- Nenhum']),'', 'Alertas: '+Number(report.alerts?.count||0)].join('\n');
 return {html,text};
}
async function sendDailyReport(env,{force=false,source="scheduled",reportDate}={}){
 await ensureAuthSchema(env);const date=String(reportDate||saoPauloNowParts().date),now=new Date().toISOString(),existing=await env.DB.prepare("SELECT status,updated_at,sent_at FROM daily_report_runs WHERE report_date=?").bind(date).first();
 if(!force&&String(existing?.status||"")==="sent")return {ok:true,skipped:true,reason:"already_sent",date,sentAt:existing.sent_at||null};
 if(!force&&String(existing?.status||"")==="sending"&&Date.parse(existing?.updated_at||0)>Date.now()-30*60e3)return {ok:true,skipped:true,reason:"in_progress",date};
 const recipients=dailyReportRecipients(env);if(!recipients.length)return {ok:false,error:"Nenhum e-mail administrativo configurado.",date};
 if(!env.RESEND_API_KEY)return {ok:false,error:"Resend não configurado.",date};
 await env.DB.prepare("INSERT INTO daily_report_runs(report_date,status,source,recipients_json,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(report_date) DO UPDATE SET status='sending',source=excluded.source,recipients_json=excluded.recipients_json,last_error=NULL,updated_at=excluded.updated_at").bind(date,"sending",source,JSON.stringify(recipients),now,now).run();
 try{
  const report=await buildDailyReport(env,date),content=dailyReportEmailContent(report),r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:env.AUREA_EMAIL_FROM||"VALENZA PARFUMS <contato@valenzaparfums.com.br>",to:recipients,subject:"Relatório diário VALENZA · "+dailyReportDateBr(date),html:content.html,text:content.text})});
  if(!r.ok){const detail=(await r.text()).slice(0,500);throw new Error("Resend "+r.status+": "+detail)}
  const sentAt=new Date().toISOString();await env.DB.prepare("UPDATE daily_report_runs SET status='sent',summary_json=?,last_error=NULL,updated_at=?,sent_at=? WHERE report_date=?").bind(JSON.stringify(report),sentAt,sentAt,date).run();
  await env.DB.prepare("INSERT OR IGNORE INTO admin_notifications(id,unique_key,type,severity,title,message,email_sent,created_at) VALUES(?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(),"daily-report:"+date,"report","success","Relatório diário enviado","Resumo de "+dailyReportDateBr(date)+" enviado para "+recipients.length+" administrador(es).",1,sentAt).run();
  return {ok:true,date,sentAt,recipients,report};
 }catch(e){
  const err=String(e&&e.message||e).slice(0,500),failedAt=new Date().toISOString();await env.DB.prepare("UPDATE daily_report_runs SET status='failed',last_error=?,updated_at=? WHERE report_date=?").bind(err,failedAt,date).run();console.error("Relatório diário:",e);return {ok:false,error:"Não foi possível enviar o relatório diário.",detail:err,date}
 }
}
async function maybeSendDailyReport(env){
 try{
  const now=saoPauloNowParts(),hourRaw=Number(env.DAILY_REPORT_HOUR||20),hour=Number.isInteger(hourRaw)&&hourRaw>=0&&hourRaw<=23?hourRaw:20;
  if(now.hour<hour)return {ok:true,skipped:true,reason:"before_hour",date:now.date};
  return await sendDailyReport(env,{force:false,source:"scheduled",reportDate:now.date});
 }catch(e){console.error("Agendamento relatório diário:",e);return {ok:false,error:String(e&&e.message||e)}}
}
async function adminDailyReport(request,env){
 try{
  await ensureAuthSchema(env);const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  const date=saoPauloNowParts().date,[report,delivery]=await Promise.all([buildDailyReport(env,date),env.DB.prepare("SELECT report_date,status,source,recipients_json,last_error,updated_at,sent_at FROM daily_report_runs WHERE report_date=?").bind(date).first()]);
  return resposta({ok:true,report,delivery:delivery||null,schedule:{hour:Number(env.DAILY_REPORT_HOUR||20),timezone:"America/Sao_Paulo",recipients:dailyReportRecipients(env)}});
 }catch(e){console.error("Prévia relatório diário:",e);return resposta({ok:false,error:"Não foi possível montar o relatório diário."},500)}
}
async function adminDailyReportSend(request,env){
 try{
  await ensureAuthSchema(env);const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  const result=await sendDailyReport(env,{force:true,source:"manual",reportDate:saoPauloNowParts().date});
  if(!result.ok)return resposta({ok:false,error:result.error||"Não foi possível enviar o relatório."},502);
  await recordAdminAudit(env,admin,"daily_report_send",{date:result.date,recipients:result.recipients||[],sentAt:result.sentAt||null});
  return resposta({ok:true,message:"Relatório diário enviado.",date:result.date,sentAt:result.sentAt,recipients:result.recipients||[]});
 }catch(e){console.error("Enviar relatório diário:",e);return resposta({ok:false,error:"Não foi possível enviar o relatório diário."},500)}
}

async function adminDashboard(request,env){
 try{
  await ensureAuthSchema(env);
  const admin=await currentAdmin(request,env);if(!admin)return resposta({ok:false,error:"Confirme sua senha administrativa para continuar."},401);
  await seedInventory(env);
  const stockIntelligence=await syncInventorySmartAlerts(env);
  await cleanupExpiredPendingCustomers(env);
  const allOrdersCte="WITH all_orders AS (SELECT id,order_number,status,total,created_at FROM orders UNION ALL SELECT g.id,g.order_number,g.status,g.total,g.created_at FROM guest_orders g WHERE NOT EXISTS(SELECT 1 FROM orders o WHERE o.id=g.id)) ";
  const realOrdersCte="WITH real_orders AS (SELECT o.id,o.status,o.total,o.created_at FROM orders o WHERE NOT EXISTS(SELECT 1 FROM admin_credentials a WHERE a.customer_id=o.customer_id) AND NOT EXISTS(SELECT 1 FROM admin_members m WHERE m.customer_id=o.customer_id AND m.active=1) UNION ALL SELECT g.id,g.status,g.total,g.created_at FROM guest_orders g WHERE NOT EXISTS(SELECT 1 FROM orders o2 WHERE o2.id=g.id) AND NOT EXISTS(SELECT 1 FROM admin_credentials a JOIN customers c ON c.id=a.customer_id WHERE lower(c.email)=lower(g.email)) AND NOT EXISTS(SELECT 1 FROM admin_members m JOIN customers c2 ON c2.id=m.customer_id WHERE m.active=1 AND lower(c2.email)=lower(g.email))) ";
  const [customers,orders,recentOrders,recentCustomers,inventory,topProducts,productSales,deletedTests,notifications,financeSummary,financeDaily,shippingSummary,shippingRows,promotions,productPromotions,productSettings,disabledProducts,profitSummary,profitProducts,opportunities,auditRows]=await Promise.all([
   env.DB.prepare("SELECT COUNT(*) total,SUM(CASE WHEN email_verified=1 THEN 1 ELSE 0 END) verified FROM customers").first(),
   env.DB.prepare(allOrdersCte+"SELECT COUNT(*) total_orders,SUM(CASE WHEN status='Pago' THEN 1 ELSE 0 END) paid_orders,COALESCE(SUM(CASE WHEN status='Pago' THEN total ELSE 0 END),0) revenue,SUM(CASE WHEN status IN ('Aguardando pagamento','Processando') THEN 1 ELSE 0 END) pending_orders,SUM(CASE WHEN status='Pagamento recusado' THEN 1 ELSE 0 END) rejected_orders,SUM(CASE WHEN status IN ('Cancelado','Expirado','Reembolsado') THEN 1 ELSE 0 END) closed_orders FROM all_orders").first(),
   env.DB.prepare("WITH all_orders AS (SELECT o.id,o.customer_id,o.order_number,o.status,o.total,o.tracking_code,o.tracking_url,o.carrier,o.created_at,c.name customer_name,c.email email FROM orders o LEFT JOIN customers c ON c.id=o.customer_id UNION ALL SELECT g.id,NULL customer_id,g.order_number,g.status,g.total,g.tracking_code,g.tracking_url,g.carrier,g.created_at,g.customer_name,g.email FROM guest_orders g WHERE NOT EXISTS(SELECT 1 FROM orders o2 WHERE o2.id=g.id)) SELECT a.id,a.customer_id,a.order_number,a.status,a.total,a.tracking_code,a.tracking_url,a.carrier,a.created_at,a.customer_name,a.email,p.method,p.installments,p.total_paid,s.barcode,s.shipping_id,s.label_ready,l.state lock_state FROM all_orders a LEFT JOIN order_payments p ON p.order_id=a.id LEFT JOIN order_shipping s ON s.order_id=a.id LEFT JOIN shipment_locks l ON l.order_id=a.id ORDER BY a.created_at DESC LIMIT 50").all(),
   primaryDb(env).prepare("SELECT c.name,c.email,c.email_verified,c.created_at,CASE WHEN EXISTS(SELECT 1 FROM admin_credentials a WHERE a.customer_id=c.id) OR EXISTS(SELECT 1 FROM admin_members am WHERE am.customer_id=c.id AND am.active=1) THEN 1 ELSE 0 END is_admin FROM customers c WHERE c.email_verified=1 OR EXISTS(SELECT 1 FROM email_verifications ev WHERE ev.customer_id=c.id AND ev.expires_at>?) ORDER BY c.created_at DESC LIMIT 50").bind(new Date().toISOString()).all(),
   env.DB.prepare("SELECT product_id,stock,updated_at FROM inventory ORDER BY stock ASC,product_id ASC").all(),
   env.DB.prepare(realOrdersCte+"SELECT oi.product_id,MAX(oi.name) name,MAX(oi.brand) brand,SUM(oi.quantity) units,ROUND(SUM(oi.quantity*oi.unit_price),2) value FROM order_items oi JOIN real_orders r ON r.id=oi.order_id WHERE r.status='Pago' GROUP BY oi.product_id ORDER BY units DESC,value DESC LIMIT 10").all(),
   env.DB.prepare(realOrdersCte+"SELECT oi.product_id,SUM(oi.quantity) units FROM order_items oi JOIN real_orders r ON r.id=oi.order_id WHERE r.status='Pago' GROUP BY oi.product_id").all(),
   env.DB.prepare("SELECT COUNT(*) total FROM admin_deleted_test_orders WHERE admin_customer_id=?").bind(admin.id).first(),
   env.DB.prepare("SELECT id,type,severity,title,message,order_id,email_sent,read_at,created_at FROM admin_notifications ORDER BY created_at DESC LIMIT 40").all(),
   env.DB.prepare(realOrdersCte+"SELECT COUNT(CASE WHEN r.status='Pago' THEN 1 END) paid_all,COALESCE(SUM(CASE WHEN r.status='Pago' THEN r.total ELSE 0 END),0) revenue_all,COUNT(CASE WHEN r.status IN ('Aguardando pagamento','Processando') THEN 1 END) pending_real,COUNT(CASE WHEN r.status='Pago' AND date(r.created_at,'-3 hours')=date('now','-3 hours') THEN 1 END) paid_today,COALESCE(SUM(CASE WHEN r.status='Pago' AND date(r.created_at,'-3 hours')=date('now','-3 hours') THEN r.total ELSE 0 END),0) revenue_today,COUNT(CASE WHEN r.status='Pago' AND r.created_at>=datetime('now','-7 days') THEN 1 END) paid_7d,COALESCE(SUM(CASE WHEN r.status='Pago' AND r.created_at>=datetime('now','-7 days') THEN r.total ELSE 0 END),0) revenue_7d,COUNT(CASE WHEN r.status='Pago' AND r.created_at>=datetime('now','-30 days') THEN 1 END) paid_30d,COALESCE(SUM(CASE WHEN r.status='Pago' AND r.created_at>=datetime('now','-30 days') THEN r.total ELSE 0 END),0) revenue_30d,COUNT(CASE WHEN r.status='Pago' AND r.created_at>=datetime('now','-30 days') AND lower(COALESCE(p.method,''))='pix' THEN 1 END) pix_orders_30d,COALESCE(SUM(CASE WHEN r.status='Pago' AND r.created_at>=datetime('now','-30 days') AND lower(COALESCE(p.method,''))='pix' THEN r.total ELSE 0 END),0) pix_revenue_30d,COUNT(CASE WHEN r.status='Pago' AND r.created_at>=datetime('now','-30 days') AND lower(COALESCE(p.method,''))<>'pix' THEN 1 END) card_orders_30d,COALESCE(SUM(CASE WHEN r.status='Pago' AND r.created_at>=datetime('now','-30 days') AND lower(COALESCE(p.method,''))<>'pix' THEN r.total ELSE 0 END),0) card_revenue_30d,COALESCE(SUM(CASE WHEN r.status='Pago' AND r.created_at>=datetime('now','-30 days') THEN COALESCE(s.freight_cost,0) ELSE 0 END),0) freight_30d FROM real_orders r LEFT JOIN order_payments p ON p.order_id=r.id LEFT JOIN order_shipping s ON s.order_id=r.id").first(),
   env.DB.prepare(realOrdersCte+"SELECT date(r.created_at,'-3 hours') day,COUNT(*) paid_orders,ROUND(SUM(r.total),2) revenue FROM real_orders r WHERE r.status='Pago' AND r.created_at>=datetime('now','-7 days') GROUP BY date(r.created_at,'-3 hours') ORDER BY day DESC").all(),
   env.DB.prepare(realOrdersCte+"SELECT SUM(CASE WHEN r.status='Pago' AND COALESCE(s.carrier,'')='Entrega local Valenza' THEN 1 ELSE 0 END) local_delivery,SUM(CASE WHEN r.status='Pago' AND COALESCE(s.carrier,'')<>'Entrega local Valenza' AND COALESCE(s.shipping_id,'')='' AND COALESCE(s.barcode,'')='' AND COALESCE(l.state,'')='' THEN 1 ELSE 0 END) awaiting,SUM(CASE WHEN COALESCE(s.carrier,'')<>'Entrega local Valenza' AND COALESCE(l.state,'')<>'' AND COALESCE(s.shipping_id,'')='' AND COALESCE(s.barcode,'')='' THEN 1 ELSE 0 END) preparing,SUM(CASE WHEN COALESCE(s.shipping_id,'')<>'' OR COALESCE(s.barcode,'')<>'' THEN 1 ELSE 0 END) created,SUM(CASE WHEN COALESCE(s.label_ready,0)=1 THEN 1 ELSE 0 END) label_ready,SUM(CASE WHEN COALESCE(s.barcode,'')<>'' THEN 1 ELSE 0 END) tracking FROM real_orders r LEFT JOIN order_shipping s ON s.order_id=r.id LEFT JOIN shipment_locks l ON l.order_id=r.id").first(),
   env.DB.prepare("WITH real_orders AS (SELECT o.id,o.order_number,o.status,o.total,o.tracking_code,o.tracking_url,o.carrier,o.created_at,c.name customer_name,c.email FROM orders o LEFT JOIN customers c ON c.id=o.customer_id WHERE NOT EXISTS(SELECT 1 FROM admin_credentials a WHERE a.customer_id=o.customer_id) AND NOT EXISTS(SELECT 1 FROM admin_members m WHERE m.customer_id=o.customer_id AND m.active=1) UNION ALL SELECT g.id,g.order_number,g.status,g.total,g.tracking_code,g.tracking_url,g.carrier,g.created_at,g.customer_name,g.email FROM guest_orders g WHERE NOT EXISTS(SELECT 1 FROM orders o2 WHERE o2.id=g.id) AND NOT EXISTS(SELECT 1 FROM admin_credentials a JOIN customers c ON c.id=a.customer_id WHERE lower(c.email)=lower(g.email)) AND NOT EXISTS(SELECT 1 FROM admin_members m JOIN customers c2 ON c2.id=m.customer_id WHERE m.active=1 AND lower(c2.email)=lower(g.email))) SELECT r.id,r.order_number,r.status,r.total,r.tracking_code,r.tracking_url,r.carrier,r.created_at,r.customer_name,r.email,s.shipping_id,s.barcode,s.label_ready,s.city,s.state,s.cep,s.freight_cost,s.delivery_time,s.carrier shipping_carrier,l.state lock_state FROM real_orders r LEFT JOIN order_shipping s ON s.order_id=r.id LEFT JOIN shipment_locks l ON l.order_id=r.id WHERE r.status='Pago' OR COALESCE(s.shipping_id,'')<>'' OR COALESCE(s.barcode,'')<>'' OR COALESCE(l.state,'')<>'' ORDER BY r.created_at DESC LIMIT 100").all(),
   env.DB.prepare("SELECT id,title,message,starts_at,ends_at,active,created_at,updated_at FROM admin_promotions ORDER BY updated_at DESC LIMIT 50").all(),
   env.DB.prepare("SELECT id,product_id,promo_price,starts_at,ends_at,active,created_at,updated_at FROM product_promotions ORDER BY updated_at DESC").all(),
   env.DB.prepare("SELECT product_id,price_override,unit_cost,updated_at FROM product_settings ORDER BY product_id").all(),
   env.DB.prepare("SELECT product_id,disabled_at,disabled_by FROM disabled_products ORDER BY disabled_at DESC").all(),
   env.DB.prepare(realOrdersCte+"SELECT COALESCE(SUM(CASE WHEN r.status='Pago' THEN oi.quantity*oi.unit_price ELSE 0 END),0) item_revenue_all,COALESCE(SUM(CASE WHEN r.status='Pago' AND oic.unit_cost IS NOT NULL THEN oi.quantity*oi.unit_price ELSE 0 END),0) known_revenue_all,COALESCE(SUM(CASE WHEN r.status='Pago' AND oic.unit_cost IS NOT NULL THEN oi.quantity*oic.unit_cost ELSE 0 END),0) known_cost_all,COALESCE(SUM(CASE WHEN r.status='Pago' AND oic.unit_cost IS NULL THEN oi.quantity ELSE 0 END),0) missing_cost_units_all,COALESCE(SUM(CASE WHEN r.status='Pago' THEN oi.quantity ELSE 0 END),0) paid_units_all,COALESCE(SUM(CASE WHEN r.status='Pago' AND r.created_at>=datetime('now','-30 days') THEN oi.quantity*oi.unit_price ELSE 0 END),0) item_revenue_30d,COALESCE(SUM(CASE WHEN r.status='Pago' AND r.created_at>=datetime('now','-30 days') AND oic.unit_cost IS NOT NULL THEN oi.quantity*oi.unit_price ELSE 0 END),0) known_revenue_30d,COALESCE(SUM(CASE WHEN r.status='Pago' AND r.created_at>=datetime('now','-30 days') AND oic.unit_cost IS NOT NULL THEN oi.quantity*oic.unit_cost ELSE 0 END),0) known_cost_30d,COALESCE(SUM(CASE WHEN r.status='Pago' AND r.created_at>=datetime('now','-30 days') AND oic.unit_cost IS NULL THEN oi.quantity ELSE 0 END),0) missing_cost_units_30d,COALESCE(SUM(CASE WHEN r.status='Pago' AND r.created_at>=datetime('now','-30 days') THEN oi.quantity ELSE 0 END),0) paid_units_30d FROM order_items oi JOIN real_orders r ON r.id=oi.order_id LEFT JOIN order_item_costs oic ON oic.order_item_id=oi.id").first(),
   env.DB.prepare(realOrdersCte+"SELECT oi.product_id,MAX(oi.name) name,MAX(oi.brand) brand,SUM(oi.quantity) units,ROUND(SUM(oi.quantity*oi.unit_price),2) revenue,MAX(oic.unit_cost) unit_cost,ROUND(SUM(oi.quantity*oic.unit_cost),2) cost,ROUND(SUM(oi.quantity*oi.unit_price)-SUM(oi.quantity*oic.unit_cost),2) profit FROM order_items oi JOIN real_orders r ON r.id=oi.order_id JOIN order_item_costs oic ON oic.order_item_id=oi.id AND oic.unit_cost IS NOT NULL WHERE r.status='Pago' AND r.created_at>=datetime('now','-30 days') GROUP BY oi.product_id ORDER BY profit DESC LIMIT 25").all(),
   env.DB.prepare("SELECT co.id,co.customer_id,co.cart_json,co.stage,co.payment_method,co.last_error,co.subtotal,COALESCE(co.phone,cp.phone,'') phone,co.status,co.contacted_at,co.email_sent_at,co.recovered_order_id,co.recovered_at,co.recoveries,co.last_seen_at,co.created_at,co.updated_at,c.name customer_name,c.email,EXISTS(SELECT 1 FROM orders o WHERE o.customer_id=co.customer_id AND o.status IN ('Aguardando pagamento','Processando')) pending_payment FROM checkout_opportunities co JOIN customers c ON c.id=co.customer_id LEFT JOIN customer_profiles cp ON cp.customer_id=co.customer_id WHERE NOT EXISTS(SELECT 1 FROM admin_credentials a WHERE a.customer_id=co.customer_id) AND NOT EXISTS(SELECT 1 FROM admin_members m WHERE m.customer_id=co.customer_id AND m.active=1) ORDER BY CASE co.status WHEN 'active' THEN 0 WHEN 'recovered' THEN 1 ELSE 2 END,co.updated_at DESC LIMIT 100").all(),
   env.DB.prepare("SELECT action,detail_json,created_at FROM admin_audit_log WHERE admin_customer_id=? ORDER BY created_at DESC LIMIT 50").bind(admin.id).all()
  ]);
  const recent=(recentOrders.results||[]).map(row=>{const policy=adminOrderDeletePolicy(row,admin);return {...row,is_test_account:policy.reason!=="Venda de cliente protegida",delete_allowed:policy.allowed,delete_reason:policy.reason}});
  for(const row of recent)delete row.customer_id;
  for(const row of (recentCustomers.results||[]))if(allowedAdminEmail(env,row.email))row.is_admin=1;
  const totalOrders=Number(orders?.total_orders||0),allPaidOrders=Number(orders?.paid_orders||0),fin=financeSummary||{},paidOrders=Number(fin.paid_all||0),revenue=Number(fin.revenue_all||0),stockRows=inventory.results||[],disabledMetricSet=new Set((disabledProducts.results||[]).map(x=>String(x.product_id))),activeStockRows=stockRows.filter(x=>!disabledMetricSet.has(String(x.product_id))),analytics=await analyticsDashboard(env),notificationRows=notifications.results||[],unreadNotifications=notificationRows.filter(x=>!x.read_at).length;
  const pr=profitSummary||{},knownRevenue30=Number(pr.known_revenue_30d||0),knownCost30=Number(pr.known_cost_30d||0),knownRevenueAll=Number(pr.known_revenue_all||0),knownCostAll=Number(pr.known_cost_all||0),paidUnits30=Number(pr.paid_units_30d||0),missingUnits30=Number(pr.missing_cost_units_30d||0);
  const finance={paidToday:Number(fin.paid_today||0),revenueToday:Number(Number(fin.revenue_today||0).toFixed(2)),paid7d:Number(fin.paid_7d||0),revenue7d:Number(Number(fin.revenue_7d||0).toFixed(2)),paid30d:Number(fin.paid_30d||0),revenue30d:Number(Number(fin.revenue_30d||0).toFixed(2)),paidAll:paidOrders,revenueAll:Number(revenue.toFixed(2)),averageTicket30d:Number(fin.paid_30d||0)?Number((Number(fin.revenue_30d||0)/Number(fin.paid_30d||0)).toFixed(2)):0,pixOrders30d:Number(fin.pix_orders_30d||0),pixRevenue30d:Number(Number(fin.pix_revenue_30d||0).toFixed(2)),cardOrders30d:Number(fin.card_orders_30d||0),cardRevenue30d:Number(Number(fin.card_revenue_30d||0).toFixed(2)),freight30d:Number(Number(fin.freight_30d||0).toFixed(2)),testPaidIgnored:Math.max(0,allPaidOrders-paidOrders),pendingReal:Number(fin.pending_real||0),daily:financeDaily.results||[],profit:{knownRevenue30d:Number(knownRevenue30.toFixed(2)),knownCost30d:Number(knownCost30.toFixed(2)),grossProfit30d:Number((knownRevenue30-knownCost30).toFixed(2)),grossMargin30d:knownRevenue30?Number((((knownRevenue30-knownCost30)/knownRevenue30)*100).toFixed(2)):0,costCoverage30d:paidUnits30?Number((((paidUnits30-missingUnits30)/paidUnits30)*100).toFixed(1)):0,missingCostUnits30d:missingUnits30,knownRevenueAll:Number(knownRevenueAll.toFixed(2)),knownCostAll:Number(knownCostAll.toFixed(2)),grossProfitAll:Number((knownRevenueAll-knownCostAll).toFixed(2)),grossMarginAll:knownRevenueAll?Number((((knownRevenueAll-knownCostAll)/knownRevenueAll)*100).toFixed(2)):0,products:profitProducts.results||[]}};
  const sh=shippingSummary||{},shipping={localDelivery:Number(sh.local_delivery||0),awaiting:Number(sh.awaiting||0),preparing:Number(sh.preparing||0),created:Number(sh.created||0),labelReady:Number(sh.label_ready||0),tracking:Number(sh.tracking||0),rows:shippingRows.results||[]};
  const opportunityRows=(opportunities.results||[]).map(x=>{let items=[];try{const parsed=JSON.parse(x.cart_json||"[]");if(Array.isArray(parsed))items=parsed}catch{}const last=Date.parse(x.last_seen_at||x.updated_at||0),abandoned=String(x.status)==="active"&&!Number(x.pending_payment)&&(String(x.stage)==="payment_error"||(Number.isFinite(last)&&last<=Date.now()-15*60e3));return {...x,items,abandoned,pending_payment:!!Number(x.pending_payment)}}),opportunityCandidates=opportunityRows.filter(x=>x.abandoned),opportunityValue=opportunityCandidates.reduce((s,x)=>s+Number(x.subtotal||0),0),recoveredOpportunities=opportunityRows.reduce((s,x)=>s+Number(x.recoveries||0),0);
  const mp=mpConfig(env),mpAccessToken=!!String(mp.accessToken||"").trim(),mpPublicKey=!!String(mp.publicKey||"").trim(),mpProduction=!mp.testMode,wa=whatsappSaleConfig(env),meta=metaConfig(env);
  const system={database:true,mercadoPago:mpAccessToken&&mpPublicKey&&mpProduction,mercadoPagoAccessToken:mpAccessToken,mercadoPagoPublicKey:mpPublicKey,mercadoPagoMode:mp.testMode?"TESTE":"PRODUÇÃO",envioEcom:!!env.ENVIOECOM_TOKEN,envioOriginCep:/^\d{8}$/.test(String(env.ENVIOECOM_ORIGIN_CEP||"").replace(/\D/g,"")),resend:!!env.RESEND_API_KEY,whatsapp:wa.configured,whatsappRecipients:wa.recipients.length,whatsappTemplate:wa.templateName,whatsappApiVersion:wa.apiVersion,ga4:/^G-[A-Z0-9]+$/i.test(String(env.GA4_MEASUREMENT_ID||"").trim()),metaPixel:meta.enabled,metaCapi:meta.enabled&&!!meta.token,metaGraphVersion:meta.apiVersion,canonicalHost:"www.valenzaparfums.com.br",https:true};
  const operationalAlerts=[];
  const paidWithoutShipping=Number(sh.awaiting||0);
  const outStock=stockIntelligence.filter(x=>x.state==="out").length,criticalStock=stockIntelligence.filter(x=>x.state==="critical").length,reorderStock=stockIntelligence.filter(x=>x.state==="reorder").length,lowStock=criticalStock+reorderStock;
  if(paidWithoutShipping)operationalAlerts.push({type:"shipping",severity:"warning",title:"Venda paga aguardando envio",message:paidWithoutShipping+" pedido(s) pago(s) ainda sem postagem criada."});
  if(outStock)operationalAlerts.push({type:"stock",severity:"warning",title:"Produto esgotado",message:outStock+" produto(s) sem estoque. Reposição necessária."});
  if(criticalStock)operationalAlerts.push({type:"stock",severity:"warning",title:"Estoque crítico",message:criticalStock+" produto(s) com 1–"+STOCK_CRITICAL_THRESHOLD+" unidade(s)."});
  if(reorderStock)operationalAlerts.push({type:"stock",severity:"info",title:"Reposição recomendada",message:reorderStock+" produto(s) com até "+STOCK_REORDER_THRESHOLD+" unidades."});
  if(Number(fin.pending_real||0))operationalAlerts.push({type:"payment",severity:"info",title:"Pagamentos pendentes",message:Number(fin.pending_real)+" pedido(s) de clientes aguardando pagamento ou processando."});
  if(opportunityCandidates.length)operationalAlerts.push({type:"opportunity",severity:"info",title:"Oportunidades de recuperação",message:opportunityCandidates.length+" carrinho(s) recuperável(is) · "+Number(opportunityValue).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})+" em potencial."});
  return resposta({ok:true,admin:{name:admin.name},generatedAt:new Date().toISOString(),analytics,finance,shipping,system,auditLog:auditRows.results||[],promotions:promotions.results||[],productPromotions:productPromotions.results||[],productSettings:productSettings.results||[],disabledProducts:disabledProducts.results||[],opportunities:opportunityRows,notifications:notificationRows,operationalAlerts,stockIntelligence:{reorderThreshold:STOCK_REORDER_THRESHOLD,criticalThreshold:STOCK_CRITICAL_THRESHOLD,items:stockIntelligence},metrics:{customers:Number(customers?.total||0),verifiedCustomers:Number(customers?.verified||0),orders:totalOrders,paidOrders,revenue:Number(revenue.toFixed(2)),averageTicket:paidOrders?Number((revenue/paidOrders).toFixed(2)):0,pendingOrders:Number(fin.pending_real||0),rejectedOrders:Number(orders?.rejected_orders||0),closedOrders:Number(orders?.closed_orders||0),inventoryUnits:activeStockRows.reduce((sum,x)=>sum+Number(x.stock||0),0),lowStockProducts:lowStock,outOfStockProducts:outStock,criticalStockProducts:criticalStock,reorderStockProducts:reorderStock,restockProducts:stockIntelligence.length,deletedTestOrders:Number(deletedTests?.total||0),unreadNotifications,opportunityCandidates:opportunityCandidates.length,opportunityValue:Number(opportunityValue.toFixed(2)),recoveredOpportunities},recentOrders:recent,recentCustomers:recentCustomers.results||[],inventory:stockRows,topProducts:topProducts.results||[],productSales:productSales.results||[]});
 }catch(e){console.error("Admin dashboard:",e);return resposta({ok:false,error:"Não foi possível carregar o painel administrativo."},500)}
}
async function accountData(request,env){try{
 const u=await currentCustomer(request,env);if(!u)return resposta({ok:false,error:"Faça login para acessar sua conta."},401);
 const adminMember=await primaryDb(env).prepare("SELECT role,active FROM admin_members WHERE customer_id=? AND active=1 LIMIT 1").bind(u.id).first();
 const adminAccess=!!u.email_verified&&(allowedAdminEmail(env,u.email)||!!adminMember);
 const [p,a,o]=await Promise.all([
  env.DB.prepare("SELECT phone,cpf,birth_date FROM customer_profiles WHERE customer_id=?").bind(u.id).first(),
  env.DB.prepare("SELECT id,label,recipient,cep,street,number,complement,neighborhood,city,state,is_default FROM customer_addresses WHERE customer_id=? ORDER BY is_default DESC,created_at DESC").bind(u.id).all(),
  env.DB.prepare("SELECT id,order_number,status,total,tracking_code,tracking_url,carrier,created_at FROM orders WHERE customer_id=? UNION SELECT id,order_number,status,total,tracking_code,tracking_url,carrier,created_at FROM guest_orders WHERE lower(email)=lower(?) ORDER BY created_at DESC LIMIT 50").bind(u.id,u.email).all()
 ]);
 const orders=o.results||[];
 if(orders.length){
  const ids=orders.map(x=>x.id),marks=ids.map(()=>"?").join(",");
  const [its,ships,pays,tracking]=await Promise.all([
   env.DB.prepare("SELECT order_id,product_id,name,brand,type,image,quantity,unit_price FROM order_items WHERE order_id IN ("+marks+")").bind(...ids).all(),
   env.DB.prepare("SELECT order_id,carrier,shipping_id,barcode,label_ready FROM order_shipping WHERE order_id IN ("+marks+")").bind(...ids).all(),
   env.DB.prepare("SELECT order_id,method,installments,installment_amount,total_paid,status,status_detail FROM order_payments WHERE order_id IN ("+marks+")").bind(...ids).all(),
   env.DB.prepare("SELECT order_id,status,status_label,status_at,last_checked_at,delivered_at,issue_code FROM shipment_tracking_state WHERE order_id IN ("+marks+")").bind(...ids).all()
  ]);
  const itemMap=new Map(),shipMap=new Map(),payMap=new Map(),trackingMap=new Map();
  for(const x of (its.results||[])){if(!itemMap.has(x.order_id))itemMap.set(x.order_id,[]);const {order_id,...item}=x;itemMap.get(x.order_id).push(item)}
  for(const x of (ships.results||[]))shipMap.set(x.order_id,x);
  for(const x of (pays.results||[]))payMap.set(x.order_id,x);
  for(const x of (tracking.results||[]))trackingMap.set(x.order_id,x);
  for(const ord of orders){
   ord.items=itemMap.get(ord.id)||[];
   const sh=shipMap.get(ord.id);if(sh){ord.carrier=sh.carrier||ord.carrier;ord.tracking_code=sh.barcode||ord.tracking_code;ord.shipping_id=sh.shipping_id||null;ord.label_ready=!!sh.label_ready}
   const pay=payMap.get(ord.id);if(pay){const {order_id,...payment}=pay;ord.payment=payment}
   const tr=trackingMap.get(ord.id);if(tr){ord.tracking_status=tr.status;ord.tracking_status_label=tr.status_label;ord.tracking_status_at=tr.status_at;ord.tracking_last_checked_at=tr.last_checked_at;ord.delivered_at=tr.delivered_at;ord.tracking_issue=tr.issue_code}
  }
 }
 return resposta({ok:true,user:{name:u.name,email:u.email,emailVerified:!!u.email_verified,phone:p?.phone||"",cpf:p?.cpf||"",birthDate:p?.birth_date||"",adminAccess,adminRole:allowedAdminEmail(env,u.email)?"owner":(adminMember?.role||null)},addresses:a.results||[],orders});
}catch(e){console.error("Conta:",e);return resposta({ok:false,error:"Não foi possível carregar sua conta."},500)}}
async function accountOrderPix(request,env){
 try{
  const u=await currentCustomer(request,env);if(!u)return resposta({ok:false,error:"Faça login novamente."},401);
  const d=await request.json().catch(()=>({})),id=String(d.orderId||"").trim();if(!id)return resposta({ok:false,error:"Pedido inválido."},400);
  const ord=await env.DB.prepare("SELECT id,status,total FROM orders WHERE id=? AND customer_id=?").bind(id,u.id).first();if(!ord)return resposta({ok:false,error:"Pedido não encontrado na sua conta."},404);
  const payrow=await env.DB.prepare("SELECT method FROM order_payments WHERE order_id=?").bind(id).first();if(String(payrow?.method||"").toLowerCase()!=="pix")return resposta({ok:false,error:"Este pedido não possui pagamento Pix."},409);
  const cfg=mpConfig(env);if(!cfg.accessToken)return resposta({ok:false,error:"Pagamento temporariamente indisponível."},503);
  const mr=await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${cfg.accessToken}`,Accept:"application/json"}}),raw=await mr.text();let md;try{md=JSON.parse(raw)}catch{md={}}if(!mr.ok)return resposta({ok:false,error:"Não foi possível consultar este Pix agora."},502);
  const tx=md?.transactions?.payments?.[0]||{},st=String(tx.status||md.status||""),detail=String(tx.status_detail||md.status_detail||""),approved=["processed","approved"].includes(st)||detail==="accredited",pix=tx?.payment_method?.qr_code||tx?.payment_method?.ticket_url?tx.payment_method:(tx?.payment_method||{});
  if(approved){await consultarPagamentoCore(id,env);return resposta({ok:true,paid:true,status:"approved",message:"Este pedido já está pago."})}
  if(["failed","rejected","canceled","cancelled","expired"].includes(st)){await consultarPagamentoCore(id,env);return resposta({ok:false,expired:st==="expired",status:st,error:st==="expired"?"Este Pix expirou e não pode mais ser pago.":"Este Pix não está mais disponível para pagamento."},409)}
  const qr=String(pix.qr_code||tx.qr_code||""),qr64=String(pix.qr_code_base64||tx.qr_code_base64||""),ticket=String(pix.ticket_url||tx.ticket_url||"");
  if(!qr&&!qr64&&!ticket)return resposta({ok:false,error:"O Mercado Pago não retornou os dados deste Pix. Gere um novo pagamento."},409);
  return resposta({ok:true,orderId:id,status:st||"pending",statusDetail:detail,amount:Number(ord.total||0).toFixed(2),qrCode:qr,qrCodeBase64:qr64,ticketUrl:ticket});
 }catch(e){console.error("Recuperar PIX:",e);return resposta({ok:false,error:"Não foi possível recuperar este Pix agora."},500)}
}
async function releaseReservedStock(env,orderId,now=new Date().toISOString()){
 const its=await env.DB.prepare("SELECT id,product_id,quantity FROM order_items WHERE order_id=? AND stock_deducted=0").bind(orderId).all();
 for(const it of (its.results||[])){
  const marked=await env.DB.prepare("UPDATE order_items SET stock_deducted=2 WHERE id=? AND stock_deducted=0").bind(it.id).run();
  if((marked.meta?.changes||0)>0)await env.DB.prepare("UPDATE inventory SET stock=stock+?,updated_at=? WHERE product_id=?").bind(Number(it.quantity),now,it.product_id).run();
 }
}
async function accountCancelOrder(request,env){
 try{
  const u=await currentCustomer(request,env);if(!u)return resposta({ok:false,error:"Faça login novamente."},401);
  const d=await request.json().catch(()=>({})),id=String(d.orderId||"").trim();if(!id)return resposta({ok:false,error:"Pedido inválido."},400);
  const ord=await env.DB.prepare("SELECT id,status FROM orders WHERE id=? AND customer_id=?").bind(id,u.id).first();if(!ord)return resposta({ok:false,error:"Pedido não encontrado na sua conta."},404);
  if(!["Aguardando pagamento","Processando"].includes(String(ord.status)))return resposta({ok:false,error:"Este pedido não pode mais ser cancelado."},409);
  const cfg=mpConfig(env);if(cfg.accessToken){
   try{
    const mr=await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${cfg.accessToken}`,Accept:"application/json"}});
    if(mr.ok){const md=await mr.json(),tx=md?.transactions?.payments?.[0]||{},st=String(tx.status||md.status||"");if(["processed","approved"].includes(st)||String(tx.status_detail||md.status_detail||"")==="accredited")return resposta({ok:false,error:"O pagamento já foi aprovado e o pedido não pode ser cancelado."},409)}
   }catch(e){console.error("Consulta antes do cancelamento:",e)}
  }
  const now=new Date().toISOString();await releaseReservedStock(env,id,now);
  await env.DB.batch([env.DB.prepare("UPDATE orders SET status='Cancelado',updated_at=? WHERE id=? AND customer_id=?").bind(now,id,u.id),env.DB.prepare("UPDATE order_payments SET status='cancelled',status_detail='cancelled_by_customer',updated_at=? WHERE order_id=?").bind(now,id),env.DB.prepare("UPDATE checkout_opportunities SET status='dismissed',last_error='Pedido cancelado pelo cliente',updated_at=? WHERE customer_id=? AND status='active'").bind(now,u.id)]);
  await recordOperationalEvent(env,{orderId:id,eventType:"order.cancelled",category:"order",status:"cancelled",severity:"warning",source:"customer-account",message:"Pedido cancelado pelo cliente.",uniqueKey:"order:"+id+":cancelled"});await recordPaymentStatusEvent(env,{orderId:id,rawStatus:"cancelled",label:"Cancelado",method:"account",source:"customer-account"});
  return resposta({ok:true,message:"Pedido cancelado."});
 }catch(e){console.error("Cancelar pedido:",e);return resposta({ok:false,error:"Não foi possível cancelar o pedido agora."},500)}
}
async function accountPasswordChange(request,env){
 try{
  await ensureAuthSchema(env);
  const session=await validCustomerSession(request,env);
  if(!session.user)return resposta({ok:false,error:"Sua sessão expirou. Entre novamente para alterar a senha."},401);
  const d=await request.json().catch(()=>({})),currentPassword=String(d.currentPassword||""),newPassword=String(d.newPassword||"");
  if(!currentPassword)return resposta({ok:false,error:"Informe sua senha atual."},400);
  if(newPassword.length<8)return resposta({ok:false,error:"A nova senha precisa ter pelo menos 8 caracteres."},400);
  const db=primaryDb(env),u=await db.prepare("SELECT password_hash,password_salt FROM customers WHERE id=?").bind(session.user.id).first();
  if(!u)return resposta({ok:false,error:"Não foi possível localizar sua conta."},404);
  let currentHash;try{currentHash=(await hashPassword(currentPassword,u.password_salt)).hash}catch{currentHash=await sha256(u.password_salt+":"+currentPassword)}
  if(currentHash!==u.password_hash)return resposta({ok:false,error:"A senha atual está incorreta."},401);
  let sameHash;try{sameHash=(await hashPassword(newPassword,u.password_salt)).hash}catch{sameHash=await sha256(u.password_salt+":"+newPassword)}
  if(sameHash===u.password_hash)return resposta({ok:false,error:"Escolha uma senha nova, diferente da atual."},400);
  let hp;try{hp=await hashPassword(newPassword)}catch(e){console.error("PBKDF2 troca de senha indisponível:",e);const salt=randomToken();hp={salt,hash:await sha256(salt+":"+newPassword)}}
  const now=new Date().toISOString(),currentTokenHash=await sha256(session.token);
  await db.prepare("UPDATE customers SET password_hash=?,password_salt=?,updated_at=? WHERE id=?").bind(hp.hash,hp.salt,now,session.user.id).run();
  await db.prepare("DELETE FROM customer_sessions WHERE customer_id=? AND token_hash<>?").bind(session.user.id,currentTokenHash).run();
  return resposta({ok:true,message:"Senha alterada com sucesso. Os outros acessos da sua conta foram encerrados."});
 }catch(e){console.error("Troca de senha:",e);return resposta({ok:false,error:"Não foi possível alterar sua senha agora. Tente novamente."},500)}
}
async function accountProfile(request,env){try{const u=await currentCustomer(request,env);if(!u)return resposta({ok:false,error:"Faça login novamente."},401);const d=await request.json(),name=String(d.name||"").trim(),phone=String(d.phone||"").replace(/\D/g,"").slice(0,11),cpf=String(d.cpf||"").replace(/\D/g,"").slice(0,11),birth=String(d.birthDate||"").trim();if(name.length<3)return resposta({ok:false,error:"Informe seu nome completo."},400);const now=new Date().toISOString();await env.DB.batch([env.DB.prepare("UPDATE customers SET name=?,updated_at=? WHERE id=?").bind(name,now,u.id),env.DB.prepare("INSERT INTO customer_profiles(customer_id,phone,cpf,birth_date,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(customer_id) DO UPDATE SET phone=excluded.phone,cpf=excluded.cpf,birth_date=excluded.birth_date,updated_at=excluded.updated_at").bind(u.id,phone,cpf,birth,now)]);return resposta({ok:true,message:"Dados salvos."})}catch(e){return resposta({ok:false,error:"Não foi possível salvar seus dados."},500)}}
async function accountAddressSave(request,env){try{const u=await currentCustomer(request,env);if(!u)return resposta({ok:false,error:"Faça login novamente."},401);const d=await request.json();const v={label:String(d.label||"Principal").trim(),recipient:String(d.recipient||u.name).trim(),cep:String(d.cep||"").replace(/\D/g,""),street:String(d.street||"").trim(),number:String(d.number||"").trim(),complement:String(d.complement||"").trim(),neighborhood:String(d.neighborhood||"").trim(),city:String(d.city||"").trim(),state:String(d.state||"").trim().toUpperCase().slice(0,2)};if(v.cep.length!==8||!v.street||!v.number||!v.neighborhood||!v.city||v.state.length!==2)return resposta({ok:false,error:"Preencha o endereço completo."},400);const now=new Date().toISOString(),id=String(d.id||"").trim()||crypto.randomUUID(),def=d.isDefault?1:0;if(def)await env.DB.prepare("UPDATE customer_addresses SET is_default=0 WHERE customer_id=?").bind(u.id).run();const own=await env.DB.prepare("SELECT id FROM customer_addresses WHERE id=? AND customer_id=?").bind(id,u.id).first();if(own)await env.DB.prepare("UPDATE customer_addresses SET label=?,recipient=?,cep=?,street=?,number=?,complement=?,neighborhood=?,city=?,state=?,is_default=?,updated_at=? WHERE id=? AND customer_id=?").bind(v.label,v.recipient,v.cep,v.street,v.number,v.complement,v.neighborhood,v.city,v.state,def,now,id,u.id).run();else await env.DB.prepare("INSERT INTO customer_addresses(id,customer_id,label,recipient,cep,street,number,complement,neighborhood,city,state,is_default,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id,u.id,v.label,v.recipient,v.cep,v.street,v.number,v.complement,v.neighborhood,v.city,v.state,def,now,now).run();return resposta({ok:true,message:"Endereço salvo."})}catch(e){console.error("Endereco:",e);return resposta({ok:false,error:"Não foi possível salvar o endereço."},500)}}
async function accountAddressDelete(request,env,id){try{const u=await currentCustomer(request,env);if(!u)return resposta({ok:false,error:"Faça login novamente."},401);await env.DB.prepare("DELETE FROM customer_addresses WHERE id=? AND customer_id=?").bind(id,u.id).run();return resposta({ok:true})}catch(e){return resposta({ok:false,error:"Não foi possível excluir o endereço."},500)}}
async function dynamicSitemap(request,env){
 try{
  const response=await env.ASSETS.fetch(request);if(!response.ok)return response;
  const disabled=await disabledProductSet(env),xml=await response.text();
  const updated=xml.replace(/<url>[\s\S]*?<\/url>/g,block=>{const m=block.match(/<loc>https:\/\/www\.valenzaparfums\.com\.br\/perfume\/([^/]+)\/<\/loc>/);return m&&disabled.has(decodeURIComponent(m[1]))?"":block});
  return new Response(updated,{status:200,headers:{"Content-Type":"application/xml; charset=UTF-8","Cache-Control":"no-store, max-age=0, must-revalidate","Strict-Transport-Security":"max-age=31536000; includeSubDomains"}})
 }catch(e){console.error("Sitemap dinâmico:",e);return env.ASSETS.fetch(request)}
}

// Deploy marker: republica os assets do Merchant sem alterar a lógica de produção.
async function dynamicMerchantFeed(request,env){
 try{
  const response=await env.ASSETS.fetch(request);if(!response.ok)return response;
  const catalog=await officialCatalog(env),xml=await response.text();
  const updated=xml.replace(/<item>[\s\S]*?<\/item>/g,item=>{
   const m=item.match(/<g:id>([^<]+)<\/g:id>/);if(!m)return item;
   const p=catalog[String(m[1]||"")];if(!p)return "";
   return item.replace(/<g:price>[0-9.]+ BRL<\/g:price>/,"<g:price>"+Number(p.price).toFixed(2)+" BRL</g:price>")
  });
  return new Response(updated,{status:200,headers:{"Content-Type":"application/xml; charset=UTF-8","Cache-Control":"no-store, max-age=0, must-revalidate","Strict-Transport-Security":"max-age=31536000; includeSubDomains"}})
 }catch(e){console.error("Merchant dinâmico:",e);return env.ASSETS.fetch(request)}
}
async function servirAssets(request,env){
 const response=await env.ASSETS.fetch(request),headers=new Headers(response.headers),pathname=new URL(request.url).pathname;
 headers.set("Strict-Transport-Security","max-age=31536000; includeSubDomains");
 const contentType=headers.get("content-type")||"";
 if(contentType.includes("text/html")){
  let html=await response.text();
  // VALENZA preço dinâmico da página individual: o mesmo preço normal salvo no D1 alimenta página, PIX e dados estruturados.
  const pm=pathname.match(/^\/perfume\/([^/]+)\/?$/);
  if(pm){try{
   const id=decodeURIComponent(pm[1]),catalog=await officialCatalog(env),p=catalog[id];
   if(!p)return new Response("Produto não disponível.",{status:404,headers:{"Content-Type":"text/plain; charset=UTF-8","Cache-Control":"no-store","X-Robots-Tag":"noindex, nofollow"}});
   if(p){
    const price=Number(p.price),pix=pixPrice(price),brl=n=>Number(n).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
    html=html.replace(/"price":"[0-9.]+"/,'"price":"'+price.toFixed(2)+'"');
    html=html.replace(/<div class="price">[^<]*<\/div>/,'<div class="price">'+brl(price)+'</div>');
    html=html.replace(/<div class="pix">[^<]*<\/div>/,'<div class="pix">ou '+brl(pix)+' no Pix</div>')
   }
  }catch(e){console.error("Preço página individual:",e)}}
  headers.set("Cache-Control","no-store, max-age=0, must-revalidate");headers.delete("ETag");
  return new Response(html,{status:response.status,statusText:response.statusText,headers})
 }
 if(pathname==="/products.js"||pathname==="/google-commerce.js"||pathname==="/admin-account.js"||pathname.startsWith("/produtos/"))headers.set("Cache-Control","no-cache, max-age=0, must-revalidate");
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers})
}
async function consultarEstoque(env){try{await ensureAuthSchema(env);await seedInventory(env);const r=await env.DB.prepare("SELECT product_id,stock FROM inventory").all();return resposta({ok:true,stock:Object.fromEntries((r.results||[]).map(x=>[x.product_id,Number(x.stock)]))})}catch(e){return resposta({ok:false,error:"Não foi possível consultar o estoque."},500)}}
const AUREA_CATALOG={
"angham-second-song":{name:"Angham Second Song",brand:"Lattafa",type:"EDP · 100ml",price:289.9,weight:.6,length:20,height:12,width:16},
"athena":{name:"Athena",brand:"Maison Alhambra",type:"EDP · 100ml",price:239.9,weight:.6,length:20,height:12,width:16},
"delilah-blanc":{name:"Delilah Blanc",brand:"Maison Alhambra",type:"EDP · 100ml",price:279.9,weight:.6,length:20,height:12,width:16},
"delilah":{name:"Delilah Pour Femme",brand:"Maison Alhambra",type:"EDP · 100ml",price:279.9,weight:.6,length:20,height:12,width:16},
"fakhar-rose":{name:"Fakhar Rose",brand:"Lattafa",type:"EDP · 100ml",price:269.9,weight:.6,length:20,height:12,width:16},
"sabah":{name:"Sabah Al Ward",brand:"Al Wataniah",type:"EDP · 100ml",price:249.9,weight:.6,length:20,height:12,width:16},
"asad":{name:"Asad",brand:"Lattafa",type:"EDP · 100ml",price:269.9,weight:.6,length:20,height:12,width:16},
"asad-bourbon":{name:"Asad Bourbon",brand:"Lattafa",type:"EDP · 100ml · Unissex",price:299.9,weight:.6,length:20,height:12,width:16},
"asad-zanzibar":{name:"Asad Zanzibar",brand:"Lattafa",type:"EDP · 100ml",price:229.9,weight:.6,length:20,height:12,width:16},
"asad-elixir":{name:"Asad Elixir",brand:"Lattafa",type:"EDP · 100ml",price:279.9,weight:.6,length:20,height:12,width:16},
"attar":{name:"Attar Al Wesal",brand:"Al Wataniah",type:"EDP · 100ml",price:229.9,weight:.6,length:20,height:12,width:16},
"decant-sabah":{name:"Decant Sabah Al Ward",brand:"Al Wataniah",type:"Decant · 5ml",price:52,weight:.15,length:12,height:5,width:8},
"ameerati":{name:"Ameerati",brand:"Al Wataniah",type:"EDP · 100ml",price:229.9,weight:.6,length:20,height:12,width:16},
"angham":{name:"Angham",brand:"Lattafa",type:"EDP · 100ml",price:279.9,weight:.6,length:20,height:12,width:16},
"vanilla-voyage":{name:"Vanilla Voyage",brand:"Maison Asrar",type:"EDP · 100ml · Unissex",price:399.9,weight:.6,length:20,height:12,width:16},
"atheeri":{name:"Atheeri",brand:"Lattafa",type:"EDP · 100ml",price:469.9,weight:.6,length:20,height:12,width:16},
"club-de-nuit-intense-man":{name:"Club de Nuit Intense Man",brand:"Armaf",type:"EDT · 105ml",price:289.9,weight:.6,length:20,height:12,width:16},
"musamam-white-intense":{name:"Musamam White Intense",brand:"Lattafa",type:"EDP · 100ml · Unissex",price:329.9,weight:.6,length:20,height:12,width:16},
"afeef":{name:"Afeef",brand:"Lattafa",type:"EDP · 100ml · Unissex",price:549.9,weight:.6,length:20,height:12,width:16},
"queen-of-arabia":{name:"Queen of Arabia",brand:"Lattafa",type:"EDP · 100ml",price:519.9,weight:.6,length:20,height:12,width:16},
"yara":{name:"Yara",brand:"Lattafa",type:"EDP · 100ml",price:269.9,weight:.6,length:20,height:12,width:16},
"yara-moi":{name:"Yara Moi",brand:"Lattafa",type:"EDP · 100ml",price:249.9,weight:.6,length:20,height:12,width:16},
"yara-tous":{name:"Yara Tous",brand:"Lattafa",type:"EDP · 100ml",price:249.9,weight:.6,length:20,height:12,width:16},
"tharwah-gold":{name:"Tharwah Gold",brand:"Lattafa",type:"EDP · 100ml",price:449.9,weight:.6,length:20,height:12,width:16},
"vulcan-feu":{name:"Vulcan Feu",brand:"French Avenue",type:"EDP · 100ml",price:389.9,weight:.6,length:20,height:12,width:16},
"khamrah":{name:"Khamrah",brand:"Lattafa",type:"EDP · 100ml · Unissex",price:249.9,weight:.6,length:20,height:12,width:16},
"khamrah-qahwa":{name:"Khamrah Qahwa",brand:"Lattafa",type:"EDP · 100ml · Unissex",price:269.9,weight:.6,length:20,height:12,width:16},
"eclaire":{name:"Eclaire",brand:"Lattafa",type:"EDP · 100ml",price:319.9,weight:.6,length:20,height:12,width:16},
"liquid-brun":{name:"Liquid Brun",brand:"French Avenue",type:"EDP · 100ml",price:399.9,weight:.6,length:20,height:12,width:16},
"spectre-ghost":{name:"Spectre Ghost",brand:"French Avenue",type:"EDP · 80ml",price:329.9,weight:.6,length:20,height:12,width:16},
"afnan-9pm":{name:"9 PM",brand:"Afnan",type:"EDP · 100ml",price:299.9,weight:.6,length:20,height:12,width:16},
"hawas-ice":{name:"Hawas Ice",brand:"Rasasi",type:"EDP · 100ml",price:329.9,weight:.6,length:20,height:12,width:16},
"yara-candy":{name:"Yara Candy",brand:"Lattafa",type:"EDP · 100ml",price:249.9,weight:.6,length:20,height:12,width:16},
"tiramisu-coco":{name:"Tiramisu Coco",brand:"Zimaya",type:"EDP · 100ml · Unissex",price:279.9,weight:.6,length:20,height:12,width:16},
"fatima-pink":{name:"Fatima Pink",brand:"Zimaya",type:"Extrait de Parfum · 100ml",price:269.9,weight:.6,length:20,height:12,width:16},
"supremacy-not-only-intense":{name:"Supremacy Not Only Intense",brand:"Afnan",type:"Extrait de Parfum · 100ml",price:399.9,weight:.6,length:20,height:12,width:16},
"club-de-nuit-milestone":{name:"Club de Nuit Milestone",brand:"Armaf",type:"EDP · 105ml",price:279.9,weight:.6,length:20,height:12,width:16},
"club-de-nuit-untold":{name:"Club de Nuit Untold",brand:"Armaf",type:"EDP · 105ml · Unissex",price:399.9,weight:.6,length:20,height:12,width:16},
"badee-al-oud-amethyst":{name:"Bade'e Al Oud Amethyst",brand:"Lattafa",type:"EDP · 100ml · Unissex",price:229.9,weight:.6,length:20,height:12,width:16},
"raghba-wood-intense":{name:"Raghba Wood Intense",brand:"Lattafa",type:"EDP · 100ml · Unissex",price:219.9,weight:.6,length:20,height:12,width:16},
"designer-la-vie-est-belle":{name:"La Vie Est Belle",brand:"Lancôme",type:"EDP · 100ml",price:749.9,weight:.6,length:20,height:12,width:16},
"designer-good-girl":{name:"Good Girl",brand:"Carolina Herrera",type:"EDP · 80ml",price:779.9,weight:.6,length:20,height:12,width:16},
"designer-libre":{name:"Libre",brand:"Yves Saint Laurent",type:"EDP · 90ml",price:979.9,weight:.6,length:20,height:12,width:16},
"designer-jadore":{name:"J'adore",brand:"Dior",type:"EDP · 100ml",price:999.9,weight:.6,length:20,height:12,width:16},
"designer-sauvage":{name:"Sauvage",brand:"Dior",type:"EDT · 100ml",price:829.9,weight:.6,length:20,height:12,width:16},
"designer-212-vip-rose":{name:"212 VIP Rosé",brand:"Carolina Herrera",type:"EDP · 80ml",price:839.9,weight:.6,length:20,height:12,width:16},
"designer-1-million":{name:"1 Million",brand:"Rabanne",type:"EDT · 100ml",price:559.9,weight:.6,length:20,height:12,width:16},
"designer-versace-eros":{name:"Eros",brand:"Versace",type:"EDT · 100ml",price:729.9,weight:.6,length:20,height:12,width:16},
"designer-acqua-di-gio":{name:"Acqua di Giò",brand:"Giorgio Armani",type:"EDT · 100ml",price:649.9,weight:.6,length:20,height:12,width:16},
"designer-my-way":{name:"My Way",brand:"Giorgio Armani",type:"EDP · 90ml",price:999.9,weight:.6,length:20,height:12,width:16},
"designer-scandal":{name:"Scandal",brand:"Jean Paul Gaultier",type:"EDP · 80ml",price:849.9,weight:.6,length:20,height:12,width:16},
"designer-invictus":{name:"Invictus",brand:"Rabanne",type:"EDT · 100ml",price:649.9,weight:.6,length:20,height:12,width:16},
"designer-black-opium":{name:"Black Opium",brand:"Yves Saint Laurent",type:"EDP · 90ml",price:949.9,weight:.6,length:20,height:12,width:16},
"designer-light-blue":{name:"Light Blue",brand:"Dolce & Gabbana",type:"EDT · 100ml",price:629.9,weight:.6,length:20,height:12,width:16},
"designer-miss-dior":{name:"Miss Dior",brand:"Dior",type:"EDP · 100ml",price:929.9,weight:.6,length:20,height:12,width:16},
"designer-linterdit":{name:"L'Interdit",brand:"Givenchy",type:"EDP · 80ml",price:849.9,weight:.6,length:20,height:12,width:16},
"armaf-club-de-nuit-maleka":{name:"Club de Nuit Maleka",brand:"Armaf",type:"EDP · 105ml",price:449.90,weight:.6,length:20,height:12,width:16}
};
async function disabledProductSet(env){
 await ensureAuthSchema(env);
 const q=await env.DB.prepare("SELECT product_id FROM disabled_products").all();
 return new Set((q.results||[]).map(x=>String(x.product_id||"")).filter(Boolean))
}

async function officialCatalog(env){
 await ensureAuthSchema(env);
 const out={};for(const [id,p] of Object.entries(AUREA_CATALOG))out[id]={...p};
 try{
  const [q,disabled]=await Promise.all([env.DB.prepare("SELECT product_id,price_override FROM product_settings WHERE price_override IS NOT NULL").all(),disabledProductSet(env)]);
  for(const row of (q.results||[])){const id=String(row.product_id||""),price=Number(row.price_override);if(out[id]&&Number.isFinite(price)&&price>0)out[id].price=Number(price.toFixed(2))}
  for(const id of disabled)delete out[id];
 }catch(e){console.error("Catálogo dinâmico:",e)}
 return out
}
async function catalogRuntimePublic(env){
 try{
  await ensureAuthSchema(env);await seedInventory(env);
  const [stock,settings,disabled]=await Promise.all([
   env.DB.prepare("SELECT product_id,stock FROM inventory").all(),
   env.DB.prepare("SELECT product_id,price_override FROM product_settings WHERE price_override IS NOT NULL").all(),
   disabledProductSet(env)
  ]);
  const stockMap=Object.fromEntries((stock.results||[]).map(x=>[String(x.product_id),Number(x.stock||0)])),priceMap=Object.fromEntries((settings.results||[]).map(x=>[String(x.product_id),Number(x.price_override)]));
  return resposta({ok:true,products:Object.entries(AUREA_CATALOG).map(([id,p])=>{const override=priceMap[id],price=Number.isFinite(override)&&override>0?override:Number(p.price||0),active=!disabled.has(id);return {id,price:Number(price.toFixed(2)),stock:active?Math.max(0,Math.min(10,Number(stockMap[id]||0))):0,active}})});
 }catch(e){console.error("Catálogo runtime:",e);return resposta({ok:false,error:"Não foi possível atualizar preços e estoque agora."},500)}
}
async function seedInventory(env){const now=new Date().toISOString();await env.DB.prepare("CREATE TABLE IF NOT EXISTS inventory_meta (key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TEXT NOT NULL)").run();const doneV1=await env.DB.prepare("SELECT value FROM inventory_meta WHERE key='catalog-stock-v1'").first();if(!doneV1){const catalog=await officialCatalog(env);const q=Object.keys(catalog).map(id=>env.DB.prepare("INSERT INTO inventory(product_id,stock,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO UPDATE SET stock=excluded.stock,updated_at=excluded.updated_at").bind(id,10,now));q.push(env.DB.prepare("INSERT OR REPLACE INTO inventory_meta(key,value,updated_at) VALUES('catalog-stock-v1','10',?)").bind(now));await env.DB.batch(q)}const doneV2=await env.DB.prepare("SELECT value FROM inventory_meta WHERE key='catalog-stock-v2-new10'").first();if(!doneV2){const ids=["khamrah","khamrah-qahwa","eclaire","liquid-brun","spectre-ghost","afnan-9pm","hawas-ice","yara-candy","tiramisu-coco","fatima-pink"];const q=ids.map(id=>env.DB.prepare("INSERT INTO inventory(product_id,stock,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO UPDATE SET stock=excluded.stock,updated_at=excluded.updated_at").bind(id,100,now));q.push(env.DB.prepare("INSERT OR REPLACE INTO inventory_meta(key,value,updated_at) VALUES('catalog-stock-v2-new10','100',?)").bind(now));await env.DB.batch(q)}const doneV4=await env.DB.prepare("SELECT value FROM inventory_meta WHERE key='catalog-stock-v4-new5'").first();if(!doneV4){const ids=["supremacy-not-only-intense","club-de-nuit-milestone","club-de-nuit-untold","badee-al-oud-amethyst","raghba-wood-intense"];const q=ids.map(id=>env.DB.prepare("INSERT INTO inventory(product_id,stock,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO UPDATE SET stock=excluded.stock,updated_at=excluded.updated_at").bind(id,100,now));q.push(env.DB.prepare("INSERT OR REPLACE INTO inventory_meta(key,value,updated_at) VALUES('catalog-stock-v4-new5','100',?)").bind(now));await env.DB.batch(q)}const doneV5=await env.DB.prepare("SELECT value FROM inventory_meta WHERE key='catalog-stock-v5-designer16'").first();if(!doneV5){const ids=["designer-la-vie-est-belle","designer-good-girl","designer-libre","designer-jadore","designer-sauvage","designer-212-vip-rose","designer-1-million","designer-versace-eros","designer-acqua-di-gio","designer-my-way","designer-scandal","designer-invictus","designer-black-opium","designer-light-blue","designer-miss-dior","designer-linterdit"];const q=ids.map(id=>env.DB.prepare("INSERT INTO inventory(product_id,stock,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO UPDATE SET stock=excluded.stock,updated_at=excluded.updated_at").bind(id,100,now));q.push(env.DB.prepare("INSERT OR REPLACE INTO inventory_meta(key,value,updated_at) VALUES('catalog-stock-v5-designer16','100',?)").bind(now));await env.DB.batch(q)}const doneV6=await env.DB.prepare("SELECT value FROM inventory_meta WHERE key='catalog-stock-v6-maleka'").first();if(!doneV6){await env.DB.batch([env.DB.prepare("INSERT INTO inventory(product_id,stock,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO NOTHING").bind("armaf-club-de-nuit-maleka",100,now),env.DB.prepare("INSERT OR REPLACE INTO inventory_meta(key,value,updated_at) VALUES('catalog-stock-v6-maleka','100',?)").bind(now)])}const doneV7=await env.DB.prepare("SELECT value FROM inventory_meta WHERE key='catalog-stock-v7-asad-bourbon'").first();if(!doneV7){await env.DB.batch([env.DB.prepare("INSERT INTO inventory(product_id,stock,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO NOTHING").bind("asad-bourbon",100,now),env.DB.prepare("INSERT OR REPLACE INTO inventory_meta(key,value,updated_at) VALUES('catalog-stock-v7-asad-bourbon','100',?)").bind(now)])}const doneV8=await env.DB.prepare("SELECT value FROM inventory_meta WHERE key='catalog-stock-v8-asad-zanzibar-elixir'").first();if(!doneV8){await env.DB.batch([
 env.DB.prepare("INSERT INTO inventory(product_id,stock,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO NOTHING").bind("asad-zanzibar",100,now),
 env.DB.prepare("INSERT INTO inventory(product_id,stock,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO NOTHING").bind("asad-elixir",100,now),
 env.DB.prepare("INSERT INTO product_settings(product_id,unit_cost,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO NOTHING").bind("asad-zanzibar",161,now),
 env.DB.prepare("INSERT INTO product_settings(product_id,unit_cost,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO NOTHING").bind("asad-elixir",187.5,now),
 env.DB.prepare("INSERT OR REPLACE INTO inventory_meta(key,value,updated_at) VALUES('catalog-stock-v8-asad-zanzibar-elixir','100',?)").bind(now)
])}const doneV9=await env.DB.prepare("SELECT value FROM inventory_meta WHERE key='catalog-stock-v9-yara-moi-tous'").first();if(!doneV9){await env.DB.batch([
 env.DB.prepare("INSERT INTO inventory(product_id,stock,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO NOTHING").bind("yara-moi",100,now),
 env.DB.prepare("INSERT INTO inventory(product_id,stock,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO NOTHING").bind("yara-tous",100,now),
 env.DB.prepare("INSERT INTO product_settings(product_id,unit_cost,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO NOTHING").bind("yara-moi",161,now),
 env.DB.prepare("INSERT INTO product_settings(product_id,unit_cost,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO NOTHING").bind("yara-tous",161,now),
 env.DB.prepare("INSERT OR REPLACE INTO inventory_meta(key,value,updated_at) VALUES('catalog-stock-v9-yara-moi-tous','100',?)").bind(now)
])}const doneV10=await env.DB.prepare("SELECT value FROM inventory_meta WHERE key='catalog-price-v10-vulcan-feu-38990'").first();if(!doneV10){await env.DB.batch([
 env.DB.prepare("INSERT INTO product_settings(product_id,price_override,updated_at) VALUES(?,?,?) ON CONFLICT(product_id) DO UPDATE SET price_override=excluded.price_override,updated_at=excluded.updated_at").bind("vulcan-feu",389.9,now),
 env.DB.prepare("INSERT OR REPLACE INTO inventory_meta(key,value,updated_at) VALUES('catalog-price-v10-vulcan-feu-38990','ok',?)").bind(now)
 ])}const doneV11=await env.DB.prepare("SELECT value FROM inventory_meta WHERE key='catalog-stock-v11-default100'").first();if(!doneV11){await env.DB.batch([
 env.DB.prepare("UPDATE inventory SET stock=100,updated_at=? WHERE stock=10 AND NOT EXISTS(SELECT 1 FROM order_items oi WHERE oi.product_id=inventory.product_id)").bind(now),
 env.DB.prepare("INSERT OR REPLACE INTO inventory_meta(key,value,updated_at) VALUES('catalog-stock-v11-default100','100',?)").bind(now)
 ])}const doneV3=await env.DB.prepare("SELECT value FROM inventory_meta WHERE key='catalog-cleanup-v3'").first();if(!doneV3){await env.DB.prepare("DELETE FROM inventory WHERE product_id IN ('body-cream-yara','musamam','fakhar-rose-banner')").run();await env.DB.prepare("INSERT OR REPLACE INTO inventory_meta(key,value,updated_at) VALUES('catalog-cleanup-v3','ok',?)").bind(now).run()}}
async function canonicalItems(raw,env){if(!Array.isArray(raw)||!raw.length)throw new Error("Carrinho vazio");const catalog=await officialCatalog(env),promoMap=await activeProductPromotionMap(env);return raw.map(x=>{const id=String(x.id||""),p=catalog[id],n=Number(x.qty);if(!p)throw new Error("Produto inválido: "+id);if(!Number.isInteger(n)||n<1||n>10)throw new Error("Quantidade inválida para "+p.name);const regularPrice=Number(p.price),offer=promoMap.get(id),promo=Number(offer?.promo_price),price=offer&&Number.isFinite(promo)&&promo>0&&promo<regularPrice?Number(promo.toFixed(2)):regularPrice,clientPrice=Number(x.price),priceChanged=Number.isFinite(clientPrice)&&Math.abs(clientPrice-price)>0.009;return {id,qty:n,...p,price,regularPrice,promotionId:offer?.id||null,priceChanged,img:String(x.img||"")}})}
function pixPrice(price){const cents=Math.round(Number(price)*100);return Math.floor((cents*95+50)/100)/100}
function quoteKey(x){return String(x?.id??x?.service_id??x?.carrier??x?.company??"")}
const LOCAL_COLATINA={id:"local-colatina",company:"VALENZA",name:"Frete grátis em Colatina",carrier:"Entrega local Valenza",price:0,delivery_time:0,dropoff_points:[]};
function destinoColatina(cep){
 const n=Number(String(cep||"").replace(/\D/g,""));
 return Number.isInteger(n)&&n>=29700000&&n<=29719999;
}
function shippingAddressComplete(shipping){
 const cs=String(shipping?.cityState||""),parts=cs.split(/\s*-\s*/);
 const street=String(shipping?.street||"").trim(),number=String(shipping?.number||"").trim(),neighborhood=String(shipping?.neighborhood||"").trim(),city=String(shipping?.city||parts[0]||"").trim(),state=String(shipping?.state||parts[1]||"").trim().toUpperCase();
 return Boolean(street&&number&&neighborhood&&city&&/^[A-Z]{2}$/.test(state));
}
async function calcularFrete(request,env){
 try{
  const dados=await request.json(),cep=String(dados.cep||"").replace(/\D/g,"");
  if(!/^\d{8}$/.test(cep))return resposta({ok:false,error:"CEP inválido."},400);
  const items=await canonicalItems(dados.produtos,env);
  if(destinoColatina(cep))return resposta({ok:true,fretes:[LOCAL_COLATINA]});
  if(!env.ENVIOECOM_TOKEN){await recordOperationalEvent(env,{eventType:"freight.integration_failed",category:"freight",status:"failed",severity:"error",source:"envioecom",message:"Token do EnvioEcom ausente; cálculo de frete indisponível.",uniqueKey:"freight:missing-token"});return resposta({ok:false,error:"Serviço de frete temporariamente indisponível."},503)}
  await ensureAuthSchema(env);await seedInventory(env);
  const stockChecks=await env.DB.batch(items.map(it=>env.DB.prepare("SELECT stock FROM inventory WHERE product_id=?").bind(it.id)));
  for(let i=0;i<items.length;i++){const inv=stockChecks[i]?.results?.[0];if(Number(inv?.stock||0)<items[i].qty)return resposta({ok:false,error:items[i].name+" está sem estoque suficiente."},409)}
  const produtos=items.map(p=>({weight:p.weight,length:p.length,height:p.height,width:p.width,quantity:p.qty,price:p.price}));
  const upstream=await fetch("https://envioecom.com.br/api/v1/whitelabel/shipping/quote",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json","X-Partner-Token":env.ENVIOECOM_TOKEN},body:JSON.stringify({postal_code_destination:cep,aviso_recebimento:false,include_dropoff_points:true,products:produtos})});
  const raw=await upstream.text();let data;try{data=JSON.parse(raw)}catch{data=null}
  if(!upstream.ok){await recordOperationalEvent(env,{eventType:"freight.quote_failed",category:"freight",status:"failed",severity:"error",source:"envioecom",message:"EnvioEcom recusou a cotação de frete.",metadata:{httpStatus:upstream.status},uniqueKey:"freight:quote:"+String(upstream.status)+":"+new Date().toISOString().slice(0,10)});return resposta({ok:false,error:"Não foi possível calcular o frete agora."},502)}
  const quotes=Array.isArray(data?.quotes)?data.quotes:(Array.isArray(data)?data:[]);
  const fretes=quotes.map(x=>({id:quoteKey(x),company:String(x.carrier||x.company||"Envio Ecom"),name:String(x.carrier||x.name||x.service||"Frete"),carrier:String(x.carrier||x.company||""),price:Number(x.price??x.freight_cost??0),delivery_time:Number(x.delivery_time??x.delivery_days??0),dropoff_points:x.dropoff_points||[]})).filter(x=>x.id&&x.carrier&&Number.isFinite(x.price)&&x.price>=0);
  return resposta({ok:true,fretes});
 }catch(e){console.error("Frete:",e);await recordOperationalEvent(env,{eventType:"freight.error",category:"freight",status:"failed",severity:"error",source:"worker",message:"Falha inesperada ao calcular o frete.",metadata:{name:String(e?.name||""),message:String(e?.message||"").slice(0,200)},uniqueKey:"freight:error:"+new Date().toISOString().slice(0,10)});return resposta({ok:false,error:e.message==="Carrinho vazio"?"Carrinho vazio.":"Não foi possível calcular o frete."},500)}
}
function mpConfig(env){const production=String(env.MERCADOPAGO_MODE||"test").toLowerCase()==="production";return {testMode:!production,publicKey:production?(env.MERCADOPAGO_PUBLIC_KEY||""):(env.MERCADOPAGO_TEST_PUBLIC_KEY||""),accessToken:production?(env.MERCADOPAGO_ACCESS_TOKEN||""):(env.MERCADOPAGO_TEST_ACCESS_TOKEN||"")}}
function cardPublicError(detail,httpStatus=0){
 const d=String(detail||"").toLowerCase();
 if(d.includes("high_risk"))return "Por segurança, este pagamento não pôde ser aprovado. Tente outro cartão ou escolha PIX.";
 if(d.includes("insufficient"))return "O pagamento não foi aprovado por limite ou saldo disponível. Tente outro cartão ou PIX.";
 if(d.includes("bad_filled")||d.includes("invalid"))return "Alguns dados do cartão não puderam ser validados. Confira as informações e tente novamente.";
 if(Number(httpStatus)===429)return "Muitas tentativas foram feitas em pouco tempo. Aguarde alguns minutos e tente novamente.";
 if([401,403].includes(Number(httpStatus))||Number(httpStatus)>=500)return "O pagamento por cartão está temporariamente indisponível. Tente novamente em alguns instantes ou escolha PIX.";
 return "Não foi possível aprovar este cartão. Confira os dados ou tente outra forma de pagamento.";
}
async function statusMercadoPago(env){
 const cfg=mpConfig(env);
 if(!mpConfig(env).accessToken)return resposta({ok:false,error:"Pagamento por cartão temporariamente indisponível."},503);
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{const r=await fetch("https://api.mercadopago.com/users/me",{headers:{Authorization:`Bearer ${mpConfig(env).accessToken}`,Accept:"application/json"},signal:controller.signal});const raw=await r.text();let d={};try{d=JSON.parse(raw)}catch{};if(!r.ok)return resposta({ok:false,provider:"mercadopago",status:r.status,error:d.message||d.error||"Credencial recusada pelo Mercado Pago."},502);const accountId=String(d?.id||"");return resposta({ok:true,provider:"mercadopago",status:r.status,credentials:"accepted",accountIdLast4:accountId?accountId.slice(-4):null});}catch(e){return resposta({ok:false,provider:"mercadopago",error:e?.name==="AbortError"?"Tempo esgotado ao conectar ao Mercado Pago.":"Falha de conexão com o Mercado Pago."},504)}finally{clearTimeout(timer)}
}
async function closePaymentAttempt(env,reference,state){await env.DB.prepare("UPDATE payment_attempts SET state=?,updated_at=? WHERE reference=?").bind(state,new Date().toISOString(),reference).run()}
async function guardedPaymentCreate(env,snapshot,url,options){
 const now=new Date().toISOString();
 // Snapshot contains order data only: no card token, authorization header or password.
 const pending=await env.DB.prepare("SELECT reference FROM payment_attempts WHERE customer_id=? AND state IN ('sending','uncertain') LIMIT 1").bind(snapshot.customerId).first();
 if(pending){
  for(const it of snapshot.items)await env.DB.prepare("UPDATE inventory SET stock=stock+?,updated_at=? WHERE product_id=?").bind(it.qty,now,it.id).run();
  const e=new Error("Pagamento anterior ainda em conferência.");e.paymentUncertain=true;throw e;
 }
 try{await env.DB.prepare("INSERT INTO payment_attempts(reference,customer_id,snapshot_json,state,created_at,updated_at) VALUES(?,?,?,'sending',?,?)").bind(snapshot.reference,snapshot.customerId,JSON.stringify(snapshot),now,now).run()}
 catch(e){for(const it of snapshot.items)await env.DB.prepare("UPDATE inventory SET stock=stock+?,updated_at=? WHERE product_id=?").bind(it.qty,now,it.id).run();throw e}
 try{
  const r=await fetch(url,options);
  if(r.status>=500)throw new Error("Resposta do provedor inconclusiva.");
  const data=await r.clone().json().catch(()=>null);
  if(r.ok&&!data?.id)throw new Error("Resposta do provedor sem identificador.");
  if(data?.id)await env.DB.prepare("UPDATE payment_attempts SET provider_id=?,updated_at=? WHERE reference=?").bind(String(data.id),new Date().toISOString(),snapshot.reference).run();
  return r;
 }catch(e){
  await closePaymentAttempt(env,snapshot.reference,"uncertain");
  await recordOperationalEvent(env,{eventType:"payment.confirmation_uncertain",category:"payment",status:"failed",severity:"error",source:"checkout",message:"A conexão caiu durante o pagamento. Tentativa e reserva preservadas para conferência; não repetir a cobrança antes de verificar.",uniqueKey:"payment-uncertain:"+snapshot.reference});
  e.paymentUncertain=true;throw e;
 }
}
async function restorePaymentAttempt(env,row,remote){
 const snap=JSON.parse(row.snapshot_json),pid=String(remote.id||""),tx=remote?.transactions?.payments?.[0]||{};
 if(!pid||String(remote.external_reference||"")!==row.reference||!Number.isFinite(Number(remote.total_amount))||Math.abs(Number(remote.total_amount)-Number(snap.total))>0.009)return false;
 const now=new Date().toISOString(),st=String(tx.status||remote.status||""),detail=String(tx.status_detail||remote.status_detail||""),approved=["approved","processed"].includes(st)||detail==="accredited",closed=["failed","rejected","expired","cancelled","canceled"].includes(st),status=approved?"Pago":closed?(st==="expired"?"Expirado":st.startsWith("cancel")?"Cancelado":"Pagamento recusado"):"Aguardando pagamento",sh=snap.shipping;
 const costs=await productCostSnapshotMap(env),existing=await env.DB.prepare("SELECT * FROM orders WHERE id=?").bind(pid).first();
 if(existing){
  const storedItems=(await env.DB.prepare("SELECT product_id,quantity FROM order_items WHERE order_id=?").bind(pid).all()).results||[],storedShipping=await env.DB.prepare("SELECT order_id FROM order_shipping WHERE order_id=?").bind(pid).first(),storedPayment=await env.DB.prepare("SELECT order_id FROM order_payments WHERE order_id=?").bind(pid).first();
  const complete=existing.customer_id===snap.customerId&&existing.order_number===row.reference&&Math.abs(Number(existing.total)-Number(snap.total))<0.009&&storedShipping&&storedPayment&&storedItems.length===snap.items.length&&snap.items.every(it=>storedItems.some(saved=>saved.product_id===it.id&&Number(saved.quantity)===Number(it.qty)));
  if(!complete){await recordOperationalEvent(env,{orderId:pid,eventType:"payment.persistence_incomplete",category:"payment",status:"failed",severity:"error",source:"payment-reconcile",message:"Pedido com gravação incompleta: conferir no provedor antes de liberar estoque ou refazer cobrança.",uniqueKey:"payment-incomplete:"+row.reference});return false}
  const checked=await consultarPagamentoCore(pid,env);if(!checked.ok)return false;
 }else{
  const statements=[env.DB.prepare("INSERT OR IGNORE INTO orders(id,customer_id,order_number,status,total,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").bind(pid,snap.customerId,row.reference,status,snap.total,row.created_at,now)];
  for(let i=0;i<snap.items.length;i++){
   const it=snap.items[i],itemId=row.reference+":"+i,price=snap.method==="pix"?pixPrice(it.price):it.price;
   statements.push(env.DB.prepare("INSERT OR IGNORE INTO order_items(id,order_id,product_id,name,brand,type,image,quantity,unit_price,stock_deducted,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").bind(itemId,pid,it.id,it.name,it.brand,it.type,it.img,it.qty,price,approved?1:0,row.created_at));
   statements.push(env.DB.prepare("INSERT OR IGNORE INTO order_item_costs(order_item_id,order_id,product_id,unit_cost,created_at) VALUES(?,?,?,?,?)").bind(itemId,pid,it.id,costs.get(it.id)??null,row.created_at));
  }
  statements.push(env.DB.prepare("INSERT OR IGNORE INTO order_shipping(order_id,email,customer_name,cpf,phone,cep,street,number,complement,neighborhood,city,state,carrier,freight_cost,delivery_time,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(pid,snap.email,snap.name,snap.cpf,snap.phone,String(sh.cep).replace(/\D/g,""),sh.street,sh.number,sh.complement||"",sh.neighborhood,sh.city||String(sh.cityState||"").split(/\s*-\s*/)[0],sh.state||String(sh.cityState||"").split(/\s*-\s*/)[1],sh.carrier,sh.freight_cost,sh.delivery_time,row.created_at,now));
  statements.push(env.DB.prepare("INSERT OR IGNORE INTO order_payments(order_id,method,installments,installment_amount,total_paid,status,status_detail,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(pid,snap.method==="pix"?"pix":"Cartão de crédito",snap.installments,Number((snap.total/snap.installments).toFixed(2)),snap.total,st,detail,row.created_at,now));
  await env.DB.batch(statements);
 }
 if(closed)await releaseReservedStock(env,pid,now);
 await env.DB.prepare("UPDATE payment_attempts SET provider_id=?,state='saved',updated_at=? WHERE reference=?").bind(pid,now,row.reference).run();
 if(approved){await sendOrderOperationalEmail(env,pid,"payment_confirmed");if(!mpConfig(env).testMode)await criarEnvioEnvioEcom(env,pid);await notifyPaidOrder(env,pid)}
 await recordOperationalEvent(env,{orderId:pid,eventType:"payment.attempt_recovered",category:"payment",status:"recovered",severity:"success",source:"payment-reconcile",message:"Pedido recuperado após falha de conexão com o pagamento.",uniqueKey:"payment-recovered:"+row.reference});
 return true;
}
async function reconcileUncertainPayments(env){
 try{
  await ensureAuthSchema(env);const cfg=mpConfig(env);if(!cfg.accessToken)return;
  const cutoff=new Date(Date.now()-2*60e3).toISOString(),rows=await env.DB.prepare("SELECT * FROM payment_attempts WHERE state IN ('sending','uncertain') AND created_at<? ORDER BY created_at LIMIT 10").bind(cutoff).all();
  for(const row of rows.results||[])try{
   const url=new URL("https://api.mercadopago.com/v1/orders");url.searchParams.set("begin_date",new Date(Date.parse(row.created_at)-60e3).toISOString());url.searchParams.set("end_date",new Date().toISOString());url.searchParams.set("external_reference",row.reference);url.searchParams.set("page_size","20");
   const r=await fetch(url.toString(),{headers:{Authorization:`Bearer ${cfg.accessToken}`,Accept:"application/json"}});if(!r.ok)continue;
   const data=await r.json();for(const remote of Array.isArray(data.data)?data.data:[])if(await restorePaymentAttempt(env,row,remote))break;
  }catch(e){console.error("Conferência de tentativa de pagamento:",e)}
 }catch(e){console.error("Conferência de pagamentos:",e)}
}
async function criarPagamentoPix(request,env){
 let attemptReference="";
 try{
  if(!mpConfig(env).accessToken)return resposta({ok:false,error:"Pagamento temporariamente indisponível."},503);
  const dados=await request.json(),deviceId=String(dados.deviceId||"").trim().slice(0,256),nome=String(dados.name||"").trim(),email=String(dados.email||"").trim().toLowerCase(),cpf=String(dados.cpf||"").replace(/\D/g,""),telefone=String(dados.phone||"").replace(/\D/g,""),shipping=dados.shipping&&typeof dados.shipping==="object"?dados.shipping:{};
  if(String(dados.paymentMethod||"").toLowerCase()!=="pix")return resposta({ok:false,error:"Método de pagamento não disponível."},400);
  if(nome.length<3)return resposta({ok:false,error:"Informe seu nome completo."},400);if(!validEmail(email))return resposta({ok:false,error:"Informe um e-mail válido."},400);if(!cpfValido(cpf))return resposta({ok:false,error:"Informe um CPF válido."},400);
  const cep=String(shipping.cep||"").replace(/\D/g,"");if(!/^\d{8}$/.test(cep))return resposta({ok:false,error:"CEP inválido."},400);if(!shippingAddressComplete(shipping))return resposta({ok:false,error:"Preencha o endereço completo antes de pagar."},400);
  await ensureAuthSchema(env);const u=await currentCustomer(request,env);
  if(!u)return resposta({ok:false,requiresLogin:true,error:"Para finalizar a compra, entre ou crie sua conta VALENZA."},401);
  if(!u.email_verified)return resposta({ok:false,requiresVerification:true,error:"Confirme seu e-mail antes de finalizar a compra."},403);
  if(email!==String(u.email||"").toLowerCase())return resposta({ok:false,error:"O e-mail da compra deve ser o mesmo da sua conta VALENZA."},409);
  await seedInventory(env);const items=await canonicalItems(dados.items,env);if(items.some(x=>x.priceChanged))return resposta({ok:false,priceChanged:true,error:"Um preço do carrinho foi atualizado. Revise os valores e tente novamente."},409);
  const quoteReq={postal_code_destination:cep,aviso_recebimento:false,include_dropoff_points:true,products:items.map(p=>({weight:p.weight,length:p.length,height:p.height,width:p.width,quantity:p.qty,price:p.price}))};
  const localDelivery=await destinoColatina(cep);
  let chosen,freight;if(localDelivery){if(String(shipping.id||"")!==LOCAL_COLATINA.id)return resposta({ok:false,error:"Calcule o frete novamente para usar a entrega grátis em Colatina."},409);chosen=LOCAL_COLATINA;freight=0}else{const qr=await fetch("https://envioecom.com.br/api/v1/whitelabel/shipping/quote",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json","X-Partner-Token":env.ENVIOECOM_TOKEN},body:JSON.stringify(quoteReq)});const qraw=await qr.text();let qd;try{qd=JSON.parse(qraw)}catch{qd=null}if(!qr.ok)return resposta({ok:false,error:"Não foi possível validar o frete."},502);const quotes=Array.isArray(qd?.quotes)?qd.quotes:(Array.isArray(qd)?qd:[]),quoteWanted=String(shipping.id||""),carrierWanted=String(shipping.carrier||shipping.name||"");chosen=quoteWanted?quotes.find(x=>quoteKey(x)===quoteWanted):null;if(!chosen)return resposta({ok:false,error:"A opção de frete mudou. Calcule o frete novamente."},409);if(carrierWanted&&String(chosen.carrier||chosen.company||"")!==carrierWanted)return resposta({ok:false,error:"A opção de frete mudou. Calcule o frete novamente."},409);const quotedFreight=Number(chosen.price??chosen.freight_cost);if(!Number.isFinite(quotedFreight)||quotedFreight<0)return resposta({ok:false,error:"Frete inválido."},409);freight=quotedFreight}const carrier=localDelivery?"Entrega local Valenza":String(chosen.carrier||chosen.company||"Envio Ecom");
  const subtotal=items.reduce((s,x)=>s+pixPrice(x.price)*x.qty,0),total=Number((subtotal+freight).toFixed(2));
  for(const it of items){const inv=await env.DB.prepare("SELECT stock FROM inventory WHERE product_id=?").bind(it.id).first();if(Number(inv?.stock||0)<it.qty)return resposta({ok:false,error:it.name+" está sem estoque suficiente."},409)}
  const reserveAt=new Date().toISOString(),reserve=items.map(it=>env.DB.prepare("UPDATE inventory SET stock=stock-?,updated_at=? WHERE product_id=? AND stock>=?").bind(it.qty,reserveAt,it.id,it.qty)),rr=await env.DB.batch(reserve);
  if(rr.some(x=>(x.meta?.changes||0)<1)){for(let i=0;i<items.length;i++)if((rr[i]?.meta?.changes||0)>0)await env.DB.prepare("UPDATE inventory SET stock=stock+?,updated_at=? WHERE product_id=?").bind(items[i].qty,reserveAt,items[i].id).run();return resposta({ok:false,error:"O estoque mudou durante a compra. Tente novamente."},409)}
  const releaseReservation=async()=>{for(const it of items)await env.DB.prepare("UPDATE inventory SET stock=stock+?,updated_at=? WHERE product_id=?").bind(it.qty,new Date().toISOString(),it.id).run()};
  const partes=nome.split(/\s+/).filter(Boolean),referencia=`AUREA-${Date.now()}-${crypto.randomUUID().slice(0,8)}`;
  const payload={type:"online",total_amount:total.toFixed(2),external_reference:referencia,processing_mode:"automatic",transactions:{payments:[{amount:total.toFixed(2),payment_method:{id:"pix",type:"bank_transfer"},expiration_time:"PT30M"}]},payer:{email,first_name:partes[0],last_name:partes.slice(1).join(" ")||"AUREA",identification:{type:"CPF",number:cpf}}};if(telefone.length>=10)payload.payer.phone={area_code:telefone.slice(0,2),number:telefone.slice(2)};
  attemptReference=referencia;
  const mp=await guardedPaymentCreate(env,{reference:referencia,customerId:u.id,items,shipping:{...shipping,carrier,freight_cost:freight,delivery_time:Number(chosen.delivery_time??chosen.delivery_days??0)},name:nome,email,cpf,phone:telefone,total,method:"pix",installments:1},"https://api.mercadopago.com/v1/orders",{method:"POST",headers:{Authorization:`Bearer ${mpConfig(env).accessToken}`,"Content-Type":"application/json",Accept:"application/json","X-Idempotency-Key":crypto.randomUUID(),...(deviceId?{"X-meli-session-id":deviceId}:{})},body:JSON.stringify(payload)});
  const raw=await mp.text();let result;try{result=JSON.parse(raw)}catch{result={}}if(!mp.ok){await releaseReservation();await closePaymentAttempt(env,referencia,"failed");await recordOperationalEvent(env,{eventType:"payment.gateway_error",category:"payment",status:"failed",severity:"error",source:"mercadopago-pix",message:"Mercado Pago recusou a criação do PIX.",metadata:{httpStatus:mp.status},uniqueKey:"mp-pix-create-error:"+String(Date.now())+":"+String(mp.status)});console.error("Mercado Pago PIX recusado:",{status:mp.status,message:result?.message||result?.error||null,data:result?.data||null,cause:result?.cause||null});const msg=(mp.status===429)?"Muitas tentativas foram feitas em pouco tempo. Aguarde alguns minutos e gere o Pix novamente.":([401,403].includes(mp.status)||mp.status>=500)?"O Pix está temporariamente indisponível. Tente novamente em alguns instantes.":"Não foi possível gerar o Pix agora. Confira seus dados e tente novamente.";return resposta({ok:false,error:msg},mp.status>=400&&mp.status<500?400:502)}
  if(!result.id){await releaseReservation();await closePaymentAttempt(env,referencia,"failed");await recordOperationalEvent(env,{eventType:"payment.gateway_error",category:"payment",status:"failed",severity:"error",source:"mercadopago-pix",message:"Mercado Pago respondeu sem identificador do pedido.",metadata:{httpStatus:mp.status},uniqueKey:"mp-pix-no-id:"+String(Date.now())});console.error("Mercado Pago PIX sem identificador:",result);return resposta({ok:false,error:"Não foi possível gerar o Pix agora. Tente novamente."},502)}
  const pay=result?.transactions?.payments?.[0]||{},pix=pay?.payment_method||{},orderId=String(result.id),paymentId=String(pay.id||result.id);let savedToAccount=true;
  if(result.id){const now=new Date().toISOString(),pid=orderId;
   await env.DB.prepare("INSERT OR IGNORE INTO orders(id,customer_id,order_number,status,total,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").bind(pid,u.id,referencia,"Aguardando pagamento",total,now,now).run();
   const costMap=await productCostSnapshotMap(env);
   for(const it of items){const itemId=crypto.randomUUID(),cost=costMap.has(String(it.id))?costMap.get(String(it.id)):null;await env.DB.batch([
    env.DB.prepare("INSERT OR IGNORE INTO order_items(id,order_id,product_id,name,brand,type,image,quantity,unit_price,stock_deducted,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").bind(itemId,pid,it.id,it.name,it.brand,it.type,it.img,it.qty,pixPrice(it.price),0,now),
    env.DB.prepare("INSERT OR IGNORE INTO order_item_costs(order_item_id,order_id,product_id,unit_cost,created_at) VALUES(?,?,?,?,?)").bind(itemId,pid,it.id,cost,now)
   ])}
   const cs=String(shipping.cityState||""),parts=cs.split(/\s*-\s*/),city=String(shipping.city||parts[0]||""),state=String(shipping.state||parts[1]||"").toUpperCase().slice(0,2);
   await env.DB.prepare("INSERT OR REPLACE INTO order_shipping(order_id,email,customer_name,cpf,phone,cep,street,number,complement,neighborhood,city,state,carrier,freight_cost,delivery_time,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(pid,email,nome,cpf,telefone,cep,String(shipping.street||""),String(shipping.number||""),String(shipping.complement||""),String(shipping.neighborhood||""),city,state,carrier,freight,Number(chosen.delivery_time??chosen.delivery_days??0),now,now).run();
   await env.DB.prepare("INSERT OR REPLACE INTO order_payments(order_id,method,installments,installment_amount,total_paid,status,status_detail,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(pid,"pix",1,total,total,String(pay.status||result.status||"created"),String(pay.status_detail||result.status_detail||""),now,now).run();
   await recordOperationalEvent(env,{orderId:pid,eventType:"order.created",category:"order",status:"created",severity:"info",source:"checkout-pix",message:"Pedido criado com pagamento PIX.",metadata:{orderNumber:referencia,total,itemCount:items.length,carrier},uniqueKey:"order:"+pid+":created"});
   await recordPaymentStatusEvent(env,{orderId:pid,rawStatus:String(pay.status||result.status||"created"),label:"Aguardando pagamento",method:"pix",source:"checkout-pix"});
   try{await sendOrderOperationalEmail(env,pid,"order_received")}catch(e){console.error("E-mail pedido PIX:",e)}
  }
  await closePaymentAttempt(env,referencia,"saved");
  return resposta({ok:true,orderId,paymentId,status:pay.status??result.status??"pending",statusDetail:pay.status_detail??result.status_detail??null,amount:total.toFixed(2),qrCode:pix.qr_code||"",qrCodeBase64:pix.qr_code_base64||"",ticketUrl:pix.ticket_url||"",externalReference:referencia,savedToAccount});
 }catch(e){console.error("Criar PIX:",e);if(attemptReference&&!e.paymentUncertain){const open=await env.DB.prepare("SELECT reference FROM payment_attempts WHERE reference=? AND state IN ('sending','uncertain')").bind(attemptReference).first();if(open){await closePaymentAttempt(env,attemptReference,"uncertain");await recordOperationalEvent(env,{eventType:"payment.persistence_failed",category:"payment",status:"failed",severity:"error",source:"checkout",message:"Falha ao registrar o pagamento. Tentativa preservada para conferência antes de repetir a cobrança.",uniqueKey:"payment-persistence:"+attemptReference});e.paymentUncertain=true}}if(e.paymentUncertain)return resposta({ok:false,paymentUncertain:true,error:"Estamos conferindo a tentativa de pagamento. Não tente pagar novamente agora. Acompanhe Meus Pedidos ou fale com a VALENZA."},409);return resposta({ok:false,error:"Não foi possível gerar o Pix agora. Tente novamente em alguns instantes."},500)}
}
async function criarPagamentoCartao(request,env){
 let attemptReference="";
 try{
  if(!mpConfig(env).accessToken)return resposta({ok:false,error:"Pagamento temporariamente indisponível."},503);
  const dados=await request.json(),deviceId=String(dados.deviceId||"").trim().slice(0,256),nome=String(dados.name||"").trim(),email=String(dados.email||"").trim().toLowerCase(),cpf=String(dados.cpf||"").replace(/\D/g,""),telefone=String(dados.phone||"").replace(/\D/g,""),shipping=dados.shipping&&typeof dados.shipping==="object"?dados.shipping:{};
  const token=String(dados.token||"").trim(),paymentMethodId=String(dados.payment_method_id||dados.paymentMethodId||"").trim(),issuerId=String(dados.issuer_id||dados.issuerId||"").trim(),installments=Number(dados.installments);
  if(nome.length<3)return resposta({ok:false,error:"Informe seu nome completo."},400);
  if(!validEmail(email))return resposta({ok:false,error:"Informe um e-mail válido."},400);
  if(!cpfValido(cpf))return resposta({ok:false,error:"Informe um CPF válido."},400);
  if(!token||!paymentMethodId||!Number.isInteger(installments)||installments<1||installments>12)return resposta({ok:false,error:"Dados do cartão ou parcelamento inválidos."},400);
  const cep=String(shipping.cep||"").replace(/\D/g,"");if(!/^\d{8}$/.test(cep))return resposta({ok:false,error:"CEP inválido."},400);if(!shippingAddressComplete(shipping))return resposta({ok:false,error:"Preencha o endereço completo antes de pagar."},400);
  if(!env.ENVIOECOM_TOKEN)return resposta({ok:false,error:"Serviço de frete temporariamente indisponível."},503);
  await ensureAuthSchema(env);const u=await currentCustomer(request,env);
  if(!u)return resposta({ok:false,requiresLogin:true,error:"Para finalizar a compra, entre ou crie sua conta VALENZA."},401);
  if(!u.email_verified)return resposta({ok:false,requiresVerification:true,error:"Confirme seu e-mail antes de finalizar a compra."},403);
  if(email!==String(u.email||"").toLowerCase())return resposta({ok:false,error:"O e-mail da compra deve ser o mesmo da sua conta VALENZA."},409);
  await seedInventory(env);const items=await canonicalItems(dados.items,env);if(items.some(x=>x.priceChanged))return resposta({ok:false,priceChanged:true,error:"Um preço do carrinho foi atualizado. Revise os valores e tente novamente."},409);
  const quoteReq={postal_code_destination:cep,aviso_recebimento:false,include_dropoff_points:true,products:items.map(p=>({weight:p.weight,length:p.length,height:p.height,width:p.width,quantity:p.qty,price:p.price}))};
  const localDelivery=await destinoColatina(cep);
  let chosen,freight;if(localDelivery){if(String(shipping.id||"")!==LOCAL_COLATINA.id)return resposta({ok:false,error:"Calcule o frete novamente para usar a entrega grátis em Colatina."},409);chosen=LOCAL_COLATINA;freight=0}else{const qr=await fetch("https://envioecom.com.br/api/v1/whitelabel/shipping/quote",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json","X-Partner-Token":env.ENVIOECOM_TOKEN},body:JSON.stringify(quoteReq)});const qraw=await qr.text();let qd;try{qd=JSON.parse(qraw)}catch{qd=null}if(!qr.ok)return resposta({ok:false,error:"Não foi possível validar o frete."},502);const quotes=Array.isArray(qd?.quotes)?qd.quotes:(Array.isArray(qd)?qd:[]),quoteWanted=String(shipping.id||""),carrierWanted=String(shipping.carrier||shipping.name||"");chosen=quoteWanted?quotes.find(x=>quoteKey(x)===quoteWanted):null;if(!chosen)return resposta({ok:false,error:"A opção de frete mudou. Calcule o frete novamente."},409);if(carrierWanted&&String(chosen.carrier||chosen.company||"")!==carrierWanted)return resposta({ok:false,error:"A opção de frete mudou. Calcule o frete novamente."},409);const quotedFreight=Number(chosen.price??chosen.freight_cost);if(!Number.isFinite(quotedFreight)||quotedFreight<0)return resposta({ok:false,error:"Frete inválido."},409);freight=quotedFreight}const carrier=localDelivery?"Entrega local Valenza":String(chosen.carrier||chosen.company||"Envio Ecom");
  const subtotal=items.reduce((s,x)=>s+x.price*x.qty,0),total=Number((subtotal+freight).toFixed(2));
  for(const it of items){const inv=await env.DB.prepare("SELECT stock FROM inventory WHERE product_id=?").bind(it.id).first();if(Number(inv?.stock||0)<it.qty)return resposta({ok:false,error:it.name+" está sem estoque suficiente."},409)}
  const reserveAt=new Date().toISOString(),reserve=items.map(it=>env.DB.prepare("UPDATE inventory SET stock=stock-?,updated_at=? WHERE product_id=? AND stock>=?").bind(it.qty,reserveAt,it.id,it.qty)),rr=await env.DB.batch(reserve);
  if(rr.some(x=>(x.meta?.changes||0)<1)){for(let i=0;i<items.length;i++)if((rr[i]?.meta?.changes||0)>0)await env.DB.prepare("UPDATE inventory SET stock=stock+?,updated_at=? WHERE product_id=?").bind(items[i].qty,reserveAt,items[i].id).run();return resposta({ok:false,error:"O estoque mudou durante a compra. Tente novamente."},409)}
  const releaseReservation=async()=>{for(const it of items)await env.DB.prepare("UPDATE inventory SET stock=stock+?,updated_at=? WHERE product_id=?").bind(it.qty,new Date().toISOString(),it.id).run()};
  const partes=nome.split(/\s+/).filter(Boolean),referencia=`AUREA-${Date.now()}-${crypto.randomUUID().slice(0,8)}`;
  const phoneArea=telefone.length>=10?telefone.slice(0,2):"",phoneNumber=telefone.length>=10?telefone.slice(2):telefone,shippingCityState=String(shipping.cityState||""),shippingParts=shippingCityState.split(/\s*-\s*/),payerCity=String(shipping.city||shippingParts[0]||""),payerState=String(shipping.state||shippingParts[1]||"").toUpperCase().slice(0,2);const payload={type:"online",processing_mode:"automatic",total_amount:total.toFixed(2),external_reference:referencia,config:{online:{transaction_security:{validation:"on_fraud_risk",liability_shift:"required"}}},payer:{email,first_name:partes[0]||nome,last_name:partes.slice(1).join(" ")||partes[0]||nome,identification:{type:"CPF",number:cpf},...(phoneNumber?{phone:{area_code:phoneArea,number:phoneNumber}}:{}),address:{zip_code:cep,street_name:String(shipping.street||""),street_number:String(shipping.number||""),neighborhood:String(shipping.neighborhood||""),city:payerCity,state:payerState,...(String(shipping.complement||"").trim()?{complement:String(shipping.complement).trim()}:{})}},items:items.map(it=>({external_code:it.id,title:it.name,type:it.type||"Perfume",description:`${it.brand||""} ${it.name}`.trim(),picture_url:it.img||"",category_id:"beauty",quantity:it.qty,unit_price:Number(it.price).toFixed(2)})),transactions:{payments:[{amount:total.toFixed(2),payment_method:{id:paymentMethodId,type:"credit_card",token,installments}}]}};
  
  attemptReference=referencia;
  const mp=await guardedPaymentCreate(env,{reference:referencia,customerId:u.id,items,shipping:{...shipping,carrier,freight_cost:freight,delivery_time:Number(chosen.delivery_time??chosen.delivery_days??0)},name:nome,email,cpf,phone:telefone,total,method:"card",installments:installments},"https://api.mercadopago.com/v1/orders",{method:"POST",headers:{Authorization:`Bearer ${mpConfig(env).accessToken}`,"Content-Type":"application/json",Accept:"application/json","X-Idempotency-Key":crypto.randomUUID(),...(deviceId?{"X-meli-session-id":deviceId}:{})},body:JSON.stringify(payload)});
  const raw=await mp.text();let result;try{result=JSON.parse(raw)}catch{result={}};
  const tx=result?.transactions?.payments?.[0]||{};
  if(!mp.ok||!result.id){await releaseReservation();await closePaymentAttempt(env,referencia,"failed");const detail=result?.status_detail||tx?.status_detail||result?.error||null;await recordOperationalEvent(env,{eventType:"payment.gateway_error",category:"payment",status:"failed",severity:"error",source:"mercadopago-card",message:"Mercado Pago não concluiu a criação do pagamento por cartão.",metadata:{httpStatus:mp.status,statusDetail:String(detail||"").slice(0,120)},uniqueKey:"mp-card-create-error:"+String(Date.now())+":"+String(mp.status)});console.error("Mercado Pago cartão recusado:",{status:mp.status,message:result?.message||null,statusDetail:detail,errors:result?.errors||null});return resposta({ok:false,error:cardPublicError(detail,mp.status),statusDetail:detail},mp.status>=400&&mp.status<500?400:502)}
  const now=new Date().toISOString(),pid=String(result.id),txStatus=String(tx.status||result.status||""),txDetail=String(tx.status_detail||result.status_detail||""),approved=txStatus==="processed"||txStatus==="approved"||txDetail==="accredited",statusMap={processed:"Pago",processing:"Processando",created:"Processando",action_required:"Aguardando pagamento",failed:"Pagamento recusado",rejected:"Pagamento recusado",canceled:"Cancelado",cancelled:"Cancelado"},status=approved?"Pago":(statusMap[txStatus]||statusMap[result.status]||String(txStatus||result.status||"Processando"));
  await env.DB.prepare("INSERT OR IGNORE INTO orders(id,customer_id,order_number,status,total,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").bind(pid,u.id,referencia,status,total,now,now).run();
  const costMap=await productCostSnapshotMap(env);
  for(const it of items){const itemId=crypto.randomUUID(),cost=costMap.has(String(it.id))?costMap.get(String(it.id)):null;await env.DB.batch([
   env.DB.prepare("INSERT OR IGNORE INTO order_items(id,order_id,product_id,name,brand,type,image,quantity,unit_price,stock_deducted,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)").bind(itemId,pid,it.id,it.name,it.brand,it.type,it.img,it.qty,it.price,approved?1:0,now),
   env.DB.prepare("INSERT OR IGNORE INTO order_item_costs(order_item_id,order_id,product_id,unit_cost,created_at) VALUES(?,?,?,?,?)").bind(itemId,pid,it.id,cost,now)
  ])}
  const chargedTotal=Number(tx?.amount||total),installmentAmount=installments>0?Number((chargedTotal/installments).toFixed(2)):chargedTotal;await env.DB.prepare("INSERT OR REPLACE INTO order_payments(order_id,method,installments,installment_amount,total_paid,status,status_detail,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(pid,"Cartão de crédito",installments,installmentAmount,chargedTotal,txStatus||String(result.status||""),txDetail||String(result.status_detail||""),now,now).run();
  const cs=String(shipping.cityState||""),parts=cs.split(/\s*-\s*/),city=String(shipping.city||parts[0]||""),state=String(shipping.state||parts[1]||"").toUpperCase().slice(0,2);
  await env.DB.prepare("INSERT OR REPLACE INTO order_shipping(order_id,email,customer_name,cpf,phone,cep,street,number,complement,neighborhood,city,state,carrier,freight_cost,delivery_time,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(pid,email,nome,cpf,telefone,cep,String(shipping.street||""),String(shipping.number||""),String(shipping.complement||""),String(shipping.neighborhood||""),city,state,carrier,freight,Number(chosen.delivery_time??chosen.delivery_days??0),now,now).run();
  await recordOperationalEvent(env,{orderId:pid,eventType:"order.created",category:"order",status:"created",severity:"info",source:"checkout-card",message:"Pedido criado com pagamento por cartão.",metadata:{orderNumber:referencia,total,itemCount:items.length,installments,carrier},uniqueKey:"order:"+pid+":created"});
  await recordPaymentStatusEvent(env,{orderId:pid,rawStatus:txStatus||String(result.status||""),label:status,method:"credit",source:"checkout-card"});
  let shipment=null;
  if(approved){
   await markOpportunityRecovered(env,pid);
   await Promise.allSettled([notifyPaidOrder(env,pid),sendOrderOperationalEmail(env,pid,"payment_confirmed")]);
   if(!mpConfig(env).testMode)try{shipment=await criarEnvioEnvioEcom(env,pid)}catch(e){console.error("Expedição cartão:",e)}
  }else if(["failed","rejected","canceled","cancelled"].includes(txStatus)||["failed","rejected","canceled","cancelled"].includes(String(result.status||""))){
   await releaseReservation();await closePaymentAttempt(env,referencia,"failed");await env.DB.prepare("UPDATE order_items SET stock_deducted=2 WHERE order_id=? AND stock_deducted=0").bind(pid).run();await markOpportunityPaymentIssue(env,pid,txDetail||status);await sendOrderOperationalEmail(env,pid,"payment_failed").catch(e=>console.error("E-mail falha cartão:",e))
  }else{
   await sendOrderOperationalEmail(env,pid,"order_received").catch(e=>console.error("E-mail pedido cartão:",e))
  }
  await closePaymentAttempt(env,referencia,"saved");
  const challengeUrl=String(tx?.payment_method?.transaction_security?.url||"");return resposta({ok:true,orderId:pid,paymentId:pid,status:txStatus||result.status||null,statusDetail:txDetail||result.status_detail||null,challengeUrl:challengeUrl||null,amount:total.toFixed(2),externalReference:referencia,shipping:shipment?{created:!!shipment.ok,barcode:shipment.barcode||null,labelReady:!!shipment.labelReady}:null});
 }catch(e){console.error("Criar cartão:",e);if(attemptReference&&!e.paymentUncertain){const open=await env.DB.prepare("SELECT reference FROM payment_attempts WHERE reference=? AND state IN ('sending','uncertain')").bind(attemptReference).first();if(open){await closePaymentAttempt(env,attemptReference,"uncertain");await recordOperationalEvent(env,{eventType:"payment.persistence_failed",category:"payment",status:"failed",severity:"error",source:"checkout",message:"Falha ao registrar o pagamento. Tentativa preservada para conferência antes de repetir a cobrança.",uniqueKey:"payment-persistence:"+attemptReference});e.paymentUncertain=true}}if(e.paymentUncertain)return resposta({ok:false,paymentUncertain:true,error:"Estamos conferindo a tentativa de pagamento. Não tente pagar novamente agora. Acompanhe Meus Pedidos ou fale com a VALENZA."},409);return resposta({ok:false,error:"Não foi possível processar o cartão agora. Tente novamente em alguns instantes."},500)}
}
async function tentarGerarEtiqueta(env,orderId,shippingId,barcode){
 try{
  const body=barcode?{barcodes:[String(barcode)]}:{ids:[Number(shippingId)]};
  const r=await fetch("https://envioecom.com.br/api/v1/whitelabel/shipments/generate-labels",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/pdf","X-Partner-Token":env.ENVIOECOM_TOKEN},body:JSON.stringify(body)});
  if(!r.ok){console.log("Etiqueta ainda não liberada:",r.status);return false}
  const ct=String(r.headers.get("content-type")||"");if(!ct.includes("pdf"))return false;
  await env.DB.prepare("UPDATE order_shipping SET label_ready=1,updated_at=? WHERE order_id=?").bind(new Date().toISOString(),orderId).run();return true;
 }catch(e){console.error("Gerar etiqueta:",e);return false}
}
async function reconcileStalePixReservations(env){
 try{
  await ensureAuthSchema(env);const cfg=mpConfig(env);if(!cfg.accessToken)return;
  const cutoff=new Date(Date.now()-40*60e3).toISOString();
  const rows=await env.DB.prepare("SELECT order_id FROM order_payments WHERE lower(method)='pix' AND created_at<? AND lower(COALESCE(status,'')) IN ('','created','pending','processing','action_required') ORDER BY created_at ASC LIMIT 20").bind(cutoff).all();
  for(const row of (rows.results||[])){
   const id=String(row.order_id||"");if(!id)continue;
   try{
    const r=await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${cfg.accessToken}`,Accept:"application/json"}});
    if(!r.ok)continue;
    const d=await r.json(),tx=d?.transactions?.payments?.[0]||{},st=String(tx.status||d.status||"").toLowerCase(),detail=String(tx.status_detail||d.status_detail||""),approved=["processed","approved"].includes(st)||detail==="accredited",now=new Date().toISOString();
    if(approved){
     await env.DB.batch([env.DB.prepare("UPDATE orders SET status='Pago',updated_at=? WHERE id=?").bind(now,id),env.DB.prepare("UPDATE guest_orders SET status='Pago',updated_at=? WHERE id=?").bind(now,id),env.DB.prepare("UPDATE order_payments SET status=?,status_detail=?,updated_at=? WHERE order_id=?").bind(st||"approved",detail,now,id),env.DB.prepare("UPDATE order_items SET stock_deducted=1 WHERE order_id=? AND stock_deducted=0").bind(id)]);
     await recordPaymentStatusEvent(env,{orderId:id,rawStatus:st||"approved",label:"Pago",method:"pix",source:"pix-reconcile"});
     await sendOrderOperationalEmail(env,id,"payment_confirmed").catch(e=>console.error("E-mail PIX aprovado:",e));
     if(!cfg.testMode)try{await criarEnvioEnvioEcom(env,id)}catch(e){console.error("Reconciliação PIX expedição:",e)}
     await notifyPaidOrder(env,id);
    }else if(["failed","rejected","canceled","cancelled","expired"].includes(st)){
     await releaseReservedStock(env,id,now);
     const label=st==="expired"?"Expirado":(["canceled","cancelled"].includes(st)?"Cancelado":"Pagamento recusado");
     await env.DB.batch([env.DB.prepare("UPDATE orders SET status=?,updated_at=? WHERE id=?").bind(label,now,id),env.DB.prepare("UPDATE guest_orders SET status=?,updated_at=? WHERE id=?").bind(label,now,id),env.DB.prepare("UPDATE order_payments SET status=?,status_detail=?,updated_at=? WHERE order_id=?").bind(st,detail,now,id)]);
     await recordPaymentStatusEvent(env,{orderId:id,rawStatus:st,label,method:"pix",source:"pix-reconcile"});
     await markOpportunityPaymentIssue(env,id,detail||label);await sendOrderOperationalEmail(env,id,"payment_failed").catch(e=>console.error("E-mail PIX encerrado:",e));
    }
   }catch(e){console.error("Reconciliação PIX item:",id,e)}
  }
 }catch(e){console.error("Reconciliação PIX:",e)}
}
async function webhookMercadoPago(request,env,ctx){try{const body=await request.json().catch(()=>({}));const id=String(body?.data?.id||body?.id||"");if(!id)return resposta({ok:true});await ensureAuthSchema(env);const local=await env.DB.prepare("SELECT id FROM orders WHERE id=? UNION SELECT id FROM guest_orders WHERE id=? LIMIT 1").bind(id,id).first();if(!local)return resposta({ok:true});const cfg=mpConfig(env);if(!cfg.accessToken)return resposta({ok:false,error:"Mercado Pago não configurado."},503);const r=await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${cfg.accessToken}`,Accept:"application/json"}});if(!r.ok)return resposta({ok:true});const d=await r.json(),tx=d?.transactions?.payments?.[0]||{},st=String(tx.status||d.status||""),detail=String(tx.status_detail||d.status_detail||""),approved=st==="processed"||st==="approved"||detail==="accredited",pid=String(d.id||id),now=new Date().toISOString();const label=approved?"Pago":({processing:"Processando",created:"Aguardando pagamento",action_required:"Aguardando pagamento",pending:"Aguardando pagamento",failed:"Pagamento recusado",rejected:"Pagamento recusado",canceled:"Cancelado",cancelled:"Cancelado",expired:"Expirado"}[st]||"Processando");await env.DB.prepare("UPDATE orders SET status=?,updated_at=? WHERE id=?").bind(label,now,pid).run();await env.DB.prepare("UPDATE guest_orders SET status=?,updated_at=? WHERE id=?").bind(label,now,pid).run();await env.DB.prepare("UPDATE order_payments SET status=?,status_detail=?,updated_at=? WHERE order_id=?").bind(st,detail,now,pid).run();await recordPaymentStatusEvent(env,{orderId:pid,rawStatus:st,label,method:"mercadopago",source:"mercadopago-webhook"});if(approved){await env.DB.prepare("UPDATE order_items SET stock_deducted=1 WHERE order_id=? AND stock_deducted=0").bind(pid).run();await sendOrderOperationalEmail(env,pid,"payment_confirmed").catch(e=>console.error("E-mail webhook aprovado:",e));if(!cfg.testMode)try{await criarEnvioEnvioEcom(env,pid)}catch(e){console.error("Webhook expedição:",e)}const task=notifyPaidOrder(env,pid);if(ctx?.waitUntil)ctx.waitUntil(task);else await task}else if(["failed","rejected","canceled","cancelled","expired"].includes(st)){await releaseReservedStock(env,pid,now);await markOpportunityPaymentIssue(env,pid,detail||label);const mail=sendOrderOperationalEmail(env,pid,"payment_failed");if(ctx?.waitUntil)ctx.waitUntil(mail);else await mail}return resposta({ok:true})}catch(e){console.error("Webhook Mercado Pago:",e);return resposta({ok:true})}}

function shippingText(v){return String(v??"").trim()}
function shippingNorm(v){return shippingText(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function shippingDate(v){const d=new Date(String(v||""));return Number.isFinite(d.getTime())?d.toISOString():null}
function shipmentRoot(data){return data?.data?.shipment||data?.data||data?.shipment||data?.result||data||{}}
function shipmentHistory(root){
 const pools=[root?.tracking_history,root?.status_history,root?.history,root?.events,root?.movements,root?.occurrences,root?.tracking?.history,root?.tracking?.events];
 for(const x of pools)if(Array.isArray(x))return x;
 return [];
}
function shipmentEventTime(x){return shippingDate(x?.date||x?.datetime||x?.timestamp||x?.created_at||x?.updated_at||x?.event_date||x?.occurrence_date||x?.status_at)}
function shipmentStatusText(root){
 const raw=root?.current_status??root?.tracking_status??root?.status??root?.status_name??root?.status_description??root?.state??"";
 if(raw&&typeof raw==="object")return shippingText(raw.label||raw.name||raw.status||raw.description||raw.title||raw.value);
 return shippingText(raw);
}
function shipmentEventText(x){return shippingText(x?.status||x?.status_name||x?.title||x?.event||x?.description||x?.message||x?.detail||x?.label)}
function classifyShipmentStatus(text){
 const s=shippingNorm(text);
 if(!s)return {key:"unknown",label:"Sem atualização"};
 if(/entregue|delivered|delivery complete|finalizada/.test(s))return {key:"delivered",label:"Entregue"};
 if(/saiu para entrega|em rota para entrega|out for delivery|rota de entrega/.test(s))return {key:"out_for_delivery",label:"Saiu para entrega"};
 if(/atras|extravi|avaria|devolu|destinatario ausente|endereco incorreto|nao entregue|não entregue|retid|falha|ocorrencia|ocorrência|cancelad|sinistro/.test(s))return {key:"problem",label:text||"Problema no transporte"};
 if(/a caminho|em transito|em trânsito|transit|postad|coletad|saiu de uma base|chegou em uma base|transferencia|transferência|encaminhad|transportadora/.test(s))return {key:"in_transit",label:text||"Em trânsito"};
 if(/aguardando|etiqueta|prepar|criad|created|payment|pagamento/.test(s))return {key:"prepared",label:text||"Preparando envio"};
 return {key:"unknown",label:text||"Status em atualização"};
}
function shipmentLatest(root){
 const history=shipmentHistory(root),sorted=[...history].sort((a,b)=>Date.parse(shipmentEventTime(b)||0)-Date.parse(shipmentEventTime(a)||0)),latest=sorted[0]||null;
 const statusText=shipmentEventText(latest)||shipmentStatusText(root),status=classifyShipmentStatus(statusText),statusAt=shipmentEventTime(latest)||shippingDate(root?.updated_at||root?.status_at||root?.last_update);
 return {statusText,status,statusAt,latest,historyCount:history.length};
}
async function shipmentStateRow(env,orderId){return env.DB.prepare("SELECT * FROM shipment_tracking_state WHERE order_id=?").bind(String(orderId)).first()}
async function persistShipmentTracking(env,row,parsed,root){
 const now=new Date().toISOString(),old=await shipmentStateRow(env,row.order_id),status=parsed.status.key,label=shippingText(parsed.status.label||parsed.statusText).slice(0,240),statusAt=parsed.statusAt||now,eventKey=await sha256([row.order_id,status,label,statusAt].join("|"));
 await env.DB.prepare("INSERT INTO shipment_tracking_state(order_id,shipping_id,barcode,carrier,status,status_label,status_at,last_event_key,last_checked_at,delivered_at,issue_code,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(order_id) DO UPDATE SET shipping_id=excluded.shipping_id,barcode=excluded.barcode,carrier=excluded.carrier,status=excluded.status,status_label=excluded.status_label,status_at=excluded.status_at,last_event_key=excluded.last_event_key,last_checked_at=excluded.last_checked_at,delivered_at=COALESCE(shipment_tracking_state.delivered_at,excluded.delivered_at),issue_code=excluded.issue_code,updated_at=excluded.updated_at")
  .bind(String(row.order_id),String(row.shipping_id||""),String(row.barcode||""),String(row.carrier||""),status,label,statusAt,eventKey,now,status==="delivered"?statusAt:null,status==="problem"?shippingNorm(label).slice(0,120):null,now).run();
 const changed=!old||String(old.last_event_key||"")!==eventKey||String(old.status||"")!==status;
 if(!changed)return {changed:false,status};
 const baseMeta={carrier:String(row.carrier||""),barcode:String(row.barcode||""),statusLabel:label,statusAt,historyCount:Number(parsed.historyCount||0)};
 if(status==="in_transit"){
  await recordOperationalEvent(env,{orderId:row.order_id,eventType:"shipping.in_transit",category:"shipping",status:"in_transit",severity:"info",source:"envioecom-tracking",message:"Pedido em trânsito.",metadata:baseMeta,uniqueKey:"tracking:"+row.order_id+":"+eventKey});
  await sendOrderOperationalEmail(env,row.order_id,"in_transit").catch(e=>console.error("E-mail em trânsito:",e));
 }else if(status==="out_for_delivery"){
  await recordOperationalEvent(env,{orderId:row.order_id,eventType:"shipping.out_for_delivery",category:"shipping",status:"out_for_delivery",severity:"info",source:"envioecom-tracking",message:"Pedido saiu para entrega.",metadata:baseMeta,uniqueKey:"tracking:"+row.order_id+":"+eventKey});
  await sendOrderOperationalEmail(env,row.order_id,"out_for_delivery").catch(e=>console.error("E-mail saiu para entrega:",e));
 }else if(status==="delivered"){
  await recordOperationalEvent(env,{orderId:row.order_id,eventType:"shipping.delivered",category:"shipping",status:"delivered",severity:"success",source:"envioecom-tracking",message:"Pedido entregue.",metadata:baseMeta,uniqueKey:"tracking:"+row.order_id+":"+eventKey});
  await sendOrderOperationalEmail(env,row.order_id,"delivered").catch(e=>console.error("E-mail entregue:",e));
 }else if(status==="problem"){
  await recordOperationalEvent(env,{orderId:row.order_id,eventType:"shipping.problem",category:"shipping",status:"failed",severity:"error",source:"envioecom-tracking",message:"Problema detectado no rastreamento: "+label,metadata:baseMeta,uniqueKey:"tracking:"+row.order_id+":"+eventKey});
 }
 return {changed:true,status};
}
async function checkShipmentDelay(env,row,state){
 try{
  if(!state||["delivered","problem"].includes(String(state.status||"")))return;
  const start=Date.parse(row.shipping_updated_at||row.shipping_created_at||row.created_at||"");
  if(!Number.isFinite(start))return;
  const days=Math.max(5,Number(row.delivery_time||0)+3),late=Date.now()>start+days*86400000;
  if(!late)return;
  const key="shipping:"+String(row.order_id)+":delay:"+new Date(start).toISOString().slice(0,10);
  await recordOperationalEvent(env,{orderId:row.order_id,eventType:"shipping.delay",category:"shipping",status:"failed",severity:"error",source:"tracking-watch",message:"Envio sem confirmação de entrega além do prazo operacional esperado.",metadata:{carrier:String(row.carrier||""),barcode:String(row.barcode||""),deliveryTime:Number(row.delivery_time||0),graceDays:3},uniqueKey:key});
 }catch(e){console.error("Verificação de atraso:",e)}
}
async function syncShipmentTracking(env){
 try{
  await ensureAuthSchema(env);if(!env.ENVIOECOM_TOKEN)return;
  const q=await env.DB.prepare("SELECT s.order_id,s.shipping_id,s.barcode,s.carrier,s.delivery_time,s.created_at shipping_created_at,s.updated_at shipping_updated_at,COALESCE(o.created_at,g.created_at) created_at FROM order_shipping s LEFT JOIN orders o ON o.id=s.order_id LEFT JOIN guest_orders g ON g.id=s.order_id LEFT JOIN shipment_tracking_state t ON t.order_id=s.order_id WHERE s.carrier<>'Entrega local Valenza' AND (COALESCE(s.barcode,'')<>'' OR COALESCE(s.shipping_id,'')<>'') AND COALESCE(t.status,'')<>'delivered' ORDER BY COALESCE(t.last_checked_at,'1970-01-01') ASC LIMIT 20").all();
  for(const row of (q.results||[])){
   const ref=shippingText(row.barcode||row.shipping_id);if(!ref)continue;
   try{
    const r=await fetch("https://envioecom.com.br/api/v1/whitelabel/shipments/"+encodeURIComponent(ref),{headers:{"Accept":"application/json","X-Partner-Token":env.ENVIOECOM_TOKEN}});
    const raw=await r.text();let data={};try{data=JSON.parse(raw)}catch{}
    if(!r.ok){
     if(r.status>=500||r.status===429)await recordOperationalEvent(env,{orderId:row.order_id,eventType:"shipping.tracking_api_failed",category:"shipping",status:"failed",severity:"error",source:"envioecom-tracking",message:"Falha ao consultar rastreamento no EnvioEcom.",metadata:{httpStatus:r.status},uniqueKey:"tracking-api:"+row.order_id+":"+String(r.status)+":"+new Date().toISOString().slice(0,10)});
     continue;
    }
    const root=shipmentRoot(data),parsed=shipmentLatest(root);await persistShipmentTracking(env,row,parsed,root);const state=await shipmentStateRow(env,row.order_id);await checkShipmentDelay(env,row,state);
   }catch(e){console.error("Rastreio automático item:",row.order_id,e)}
  }
 }catch(e){console.error("Rastreio automático:",e)}
}
async function criarEnvioEnvioEcom(env,orderId){
 await ensureAuthSchema(env);
 if(!env.ENVIOECOM_TOKEN){await recordOperationalEvent(env,{orderId,eventType:"shipping.integration_failed",category:"shipping",status:"failed",severity:"error",source:"envioecom",message:"Token do EnvioEcom ausente; postagem não pode ser criada.",uniqueKey:"shipping:missing-token"});return {ok:false,error:"Token EnvioEcom ausente"}}const originCep=String(env.ENVIOECOM_ORIGIN_CEP||"").replace(/\D/g,"");if(originCep.length!==8){await recordOperationalEvent(env,{orderId,eventType:"shipping.config_failed",category:"shipping",status:"failed",severity:"error",source:"envioecom",message:"CEP de origem da postagem não configurado.",uniqueKey:"shipping:missing-origin-cep"});return {ok:false,error:"CEP de origem da postagem não configurado"}};
 await ensureAuthSchema(env);const sh=await env.DB.prepare("SELECT * FROM order_shipping WHERE order_id=?").bind(orderId).first();if(!sh){await recordOperationalEvent(env,{orderId,eventType:"shipping.data_missing",category:"shipping",status:"failed",severity:"error",source:"worker",message:"Dados de envio não encontrados para o pedido.",uniqueKey:"shipping:"+String(orderId)+":data-missing"});return {ok:false,error:"Dados de envio não encontrados"}};
 if(sh.shipping_id){const ready=Number(sh.label_ready)||await tentarGerarEtiqueta(env,orderId,sh.shipping_id,sh.barcode);return {ok:true,shippingId:sh.shipping_id,barcode:sh.barcode,existing:true,labelReady:!!ready}}
 if(String(sh.carrier||"")==="Entrega local Valenza"){await recordOperationalEvent(env,{orderId,eventType:"shipping.local_delivery",category:"shipping",status:"prepared",severity:"info",source:"valenza-local",message:"Pedido configurado para entrega local em Colatina.",metadata:{carrier:"Entrega local Valenza"},uniqueKey:"shipping:"+String(orderId)+":local"});return {ok:true,localDelivery:true}};
 if(!sh.carrier||!sh.cep||!sh.street||!sh.number||!sh.city||!sh.state){await recordOperationalEvent(env,{orderId,eventType:"shipping.data_incomplete",category:"shipping",status:"failed",severity:"error",source:"worker",message:"Dados de entrega incompletos; postagem não iniciada.",uniqueKey:"shipping:"+String(orderId)+":data-incomplete"});return {ok:false,error:"Dados de entrega incompletos"}};
 const oldLock=await env.DB.prepare("SELECT state,updated_at FROM shipment_locks WHERE order_id=?").bind(String(orderId)).first();if(oldLock?.state==="creating"&&Date.parse(oldLock.updated_at||"0")<Date.now()-10*60e3)await env.DB.prepare("DELETE FROM shipment_locks WHERE order_id=?").bind(String(orderId)).run();const lockNow=new Date().toISOString();const lk=await env.DB.prepare("INSERT OR IGNORE INTO shipment_locks(order_id,state,created_at,updated_at) VALUES(?,?,?,?)").bind(String(orderId),"creating",lockNow,lockNow).run();if((lk.meta?.changes||0)<1){const again=await env.DB.prepare("SELECT shipping_id,barcode,label_ready FROM order_shipping WHERE order_id=?").bind(orderId).first();if(again?.shipping_id)return {ok:true,shippingId:again.shipping_id,barcode:again.barcode,existing:true,labelReady:!!again.label_ready};return {ok:false,pending:true,error:"Postagem já está sendo preparada"}}
 const oi=await env.DB.prepare("SELECT product_id,name,quantity,unit_price FROM order_items WHERE order_id=?").bind(orderId).all(),items=oi.results||[];if(!items.length)return {ok:false,error:"Itens do pedido não encontrados"};
 const ord=await env.DB.prepare("SELECT order_number,total FROM orders WHERE id=? UNION SELECT order_number,total FROM guest_orders WHERE id=? LIMIT 1").bind(orderId,orderId).first();if(!ord)return {ok:false,error:"Pedido não encontrado"};
 const catalog=AUREA_CATALOG;let weight=0,height=0,width=0,length=0;for(const x of items){const p=catalog[x.product_id];if(!p)continue;weight+=p.weight*Number(x.quantity);height+=p.height*Number(x.quantity);width=Math.max(width,p.width);length=Math.max(length,p.length)}height=Math.max(5,Math.min(height,100));
 const payload={shipments:[{orderId:String(ord.order_number||orderId),shipping_company:String(sh.carrier),cep_origem:originCep,cep_destino:String(sh.cep),freight_cost:Number(sh.freight_cost||0).toFixed(2),delivery_time:String(Number(sh.delivery_time)||0),height:String(height),width:String(width||16),length:String(length||20),weight:Number(weight||.6).toFixed(3),cost:Number(ord.total||0).toFixed(2),name:String(sh.customer_name||""),document_number:String(sh.cpf||""),phone_number:String(sh.phone||""),email:String(sh.email||""),logradouro:String(sh.street||""),number:String(sh.number||""),complemento:String(sh.complement||""),bairro:String(sh.neighborhood||""),localidade:String(sh.city||""),uf:String(sh.state||""),items:items.map(x=>({name:String(x.name),quantity:Number(x.quantity)||1,unit_cost:Number(x.unit_price)||0}))}]};
 let r,raw;try{r=await fetch("https://envioecom.com.br/api/v1/whitelabel/shipping/create",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json","X-Partner-Token":env.ENVIOECOM_TOKEN},body:JSON.stringify(payload)});raw=await r.text()}catch(e){await env.DB.prepare("DELETE FROM shipment_locks WHERE order_id=?").bind(orderId).run();await recordOperationalEvent(env,{orderId,eventType:"shipping.network_failed",category:"shipping",status:"failed",severity:"error",source:"envioecom",message:"Falha de conexão ao criar a postagem no EnvioEcom.",metadata:{name:String(e?.name||""),message:String(e?.message||"").slice(0,200)},uniqueKey:"shipping:"+String(orderId)+":network-failed"});throw e}let d;try{d=JSON.parse(raw)}catch{d=null}
 if(!r.ok){await env.DB.prepare("DELETE FROM shipment_locks WHERE order_id=?").bind(orderId).run();await recordOperationalEvent(env,{orderId,eventType:"shipping.failed",category:"shipping",status:"failed",severity:"error",source:"envioecom",message:"EnvioEcom recusou a criação da postagem.",metadata:{httpStatus:r.status,carrier:String(sh.carrier||"")},uniqueKey:"shipping:"+String(orderId)+":failed:"+String(r.status)});console.error("EnvioEcom create:",r.status,raw.slice(0,1000));return {ok:false,error:"EnvioEcom recusou a criação do envio",status:r.status}}
 const x=Array.isArray(d)?d[0]:(Array.isArray(d?.shipments)?d.shipments[0]:(d?.data?.[0]||d?.shipment||d)),sid=x?.shipping_id??x?.id??null,barcode=x?.barcode??x?.tracking_code??null;if(!sid){await env.DB.prepare("DELETE FROM shipment_locks WHERE order_id=?").bind(orderId).run();await recordOperationalEvent(env,{orderId,eventType:"shipping.failed",category:"shipping",status:"failed",severity:"error",source:"envioecom",message:"EnvioEcom respondeu sem identificador da postagem.",metadata:{carrier:String(sh.carrier||"")},uniqueKey:"shipping:"+String(orderId)+":missing-id"});return {ok:false,error:"Envio criado sem identificador"}};
 const now=new Date().toISOString(),trackingUrl=barcode?"https://envioecom.com.br/tracker?barcode="+encodeURIComponent(String(barcode)):null;await env.DB.batch([env.DB.prepare("UPDATE order_shipping SET shipping_id=?,barcode=?,updated_at=? WHERE order_id=? AND shipping_id IS NULL").bind(String(sid),barcode?String(barcode):null,now,orderId),env.DB.prepare("UPDATE orders SET tracking_code=?,tracking_url=?,carrier=?,updated_at=? WHERE id=?").bind(barcode?String(barcode):null,trackingUrl,String(sh.carrier),now,orderId),env.DB.prepare("UPDATE guest_orders SET tracking_code=?,tracking_url=?,carrier=?,updated_at=? WHERE id=?").bind(barcode?String(barcode):null,trackingUrl,String(sh.carrier),now,orderId),env.DB.prepare("INSERT INTO shipment_tracking_state(order_id,shipping_id,barcode,carrier,status,status_label,status_at,last_checked_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(order_id) DO UPDATE SET shipping_id=excluded.shipping_id,barcode=excluded.barcode,carrier=excluded.carrier,updated_at=excluded.updated_at").bind(String(orderId),String(sid),barcode?String(barcode):null,String(sh.carrier),"prepared","Postagem criada",now,null,now)]);
 await env.DB.prepare("UPDATE shipment_locks SET state=?,updated_at=? WHERE order_id=?").bind("created",new Date().toISOString(),orderId).run();const labelReady=await tentarGerarEtiqueta(env,orderId,sid,barcode);await recordOperationalEvent(env,{orderId,eventType:"shipping.created",category:"shipping",status:"created",severity:"success",source:"envioecom",message:"Postagem criada no EnvioEcom.",metadata:{shippingId:String(sid),hasTracking:!!barcode,labelReady:!!labelReady,carrier:String(sh.carrier||"")},uniqueKey:"shipping:"+String(orderId)+":"+String(sid)});await sendOrderOperationalEmail(env,orderId,"shipment_prepared").catch(e=>console.error("E-mail postagem preparada:",e));return {ok:true,shippingId:String(sid),barcode:barcode?String(barcode):null,labelReady};
}
async function consultarPagamento(request,orderId,env){
 try{
  if(!orderId)return resposta({ok:false,error:"ID de pagamento inválido."},400);
  const u=await currentCustomer(request,env);if(!u)return resposta({ok:false,error:"Faça login novamente."},401);
  const own=await env.DB.prepare("SELECT id FROM orders WHERE id=? AND customer_id=? UNION SELECT id FROM guest_orders WHERE id=? AND lower(email)=lower(?) LIMIT 1").bind(String(orderId),u.id,String(orderId),u.email).first();
  if(!own)return resposta({ok:false,error:"Pedido não encontrado na sua conta."},404);
  return consultarPagamentoCore(orderId,env);
 }catch(e){console.error("Autorização consulta pagamento:",e);return resposta({ok:false,error:"Não foi possível consultar este pagamento."},500)}
}
async function consultarPagamentoCore(orderId,env){
 if(!orderId)return resposta({ok:false,error:"ID de pagamento inválido."},400);const cfg=mpConfig(env);if(!cfg.accessToken)return resposta({ok:false,error:"Pagamento temporariamente indisponível."},503);
 try{
  await ensureAuthSchema(env);const card=await env.DB.prepare("SELECT order_id FROM order_payments WHERE order_id=?").bind(String(orderId)).first();
  if(card){
   const mp=await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(orderId)}`,{headers:{Authorization:`Bearer ${cfg.accessToken}`,Accept:"application/json"}}),raw=await mp.text();let result;try{result=JSON.parse(raw)}catch{result={}}if(!mp.ok)return resposta({ok:false,error:"Não foi possível consultar o pedido no Mercado Pago."},502);
   const tx=result?.transactions?.payments?.[0]||{},st=String(tx.status||result.status||""),detail=String(tx.status_detail||result.status_detail||""),approved=st==="processed"||st==="approved"||detail==="accredited",map={processed:"Pago",approved:"Pago",processing:"Processando",created:"Aguardando pagamento",action_required:"Aguardando pagamento",pending:"Aguardando pagamento",failed:"Pagamento recusado",rejected:"Pagamento recusado",canceled:"Cancelado",cancelled:"Cancelado",expired:"Expirado"},label=approved?"Pago":(map[st]||"Processando"),now=new Date().toISOString(),pid=String(result.id||orderId);
   await env.DB.batch([env.DB.prepare("UPDATE orders SET status=?,updated_at=? WHERE id=?").bind(label,now,pid),env.DB.prepare("UPDATE guest_orders SET status=?,updated_at=? WHERE id=?").bind(label,now,pid),env.DB.prepare("UPDATE order_payments SET status=?,status_detail=?,updated_at=? WHERE order_id=?").bind(st,detail,now,pid)]);
   await recordPaymentStatusEvent(env,{orderId:pid,rawStatus:st,label,method:"mercadopago",source:"payment-query"});
   if(approved){await env.DB.prepare("UPDATE order_items SET stock_deducted=1 WHERE order_id=? AND stock_deducted=0").bind(pid).run();await sendOrderOperationalEmail(env,pid,"payment_confirmed").catch(e=>console.error("E-mail consulta aprovada:",e));if(!cfg.testMode)try{await criarEnvioEnvioEcom(env,pid)}catch(e){console.error("Consulta expedição:",e)}await notifyPaidOrder(env,pid)}
   else if(["failed","rejected","canceled","cancelled","expired"].includes(st)){await releaseReservedStock(env,pid,now);await markOpportunityPaymentIssue(env,pid,detail||label);await sendOrderOperationalEmail(env,pid,"payment_failed").catch(e=>console.error("E-mail consulta encerrada:",e))}
   return resposta({ok:true,orderId:pid,status:approved?"approved":st,statusDetail:detail,paymentId:pid,shipping:null});
  }
  if(!/^\d+$/.test(String(orderId)))return resposta({ok:false,error:"ID de pagamento inválido."},400);
  const mp=await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(orderId)}`,{headers:{Authorization:`Bearer ${cfg.accessToken}`,Accept:"application/json"}}),raw=await mp.text();let result;try{result=JSON.parse(raw)}catch{result={}}if(!mp.ok)return resposta({ok:false,error:"Não foi possível consultar o pagamento."},502);
  const map={approved:"Pago",pending:"Aguardando pagamento",in_process:"Processando",rejected:"Pagamento recusado",cancelled:"Cancelado",expired:"Expirado",refunded:"Reembolsado"},label=map[result.status]||String(result.status||"Aguardando pagamento"),now=new Date().toISOString(),pid=String(result.id??orderId);
  await env.DB.batch([env.DB.prepare("UPDATE orders SET status=?,updated_at=? WHERE id=?").bind(label,now,pid),env.DB.prepare("UPDATE guest_orders SET status=?,updated_at=? WHERE id=?").bind(label,now,pid)]);
  await recordPaymentStatusEvent(env,{orderId:pid,rawStatus:String(result.status||""),label,method:"mercadopago-legacy",source:"payment-query"});
  if(result.status==="approved"){await env.DB.prepare("UPDATE order_items SET stock_deducted=1 WHERE order_id=? AND stock_deducted=0").bind(pid).run();await sendOrderOperationalEmail(env,pid,"payment_confirmed").catch(e=>console.error("E-mail consulta legacy aprovada:",e));if(!cfg.testMode)try{await criarEnvioEnvioEcom(env,pid)}catch(e){console.error("Consulta expedição legacy:",e)}await notifyPaidOrder(env,pid)}
  else if(["cancelled","rejected","expired"].includes(result.status)){await releaseReservedStock(env,pid,now);await markOpportunityPaymentIssue(env,pid,result.status_detail||label);await sendOrderOperationalEmail(env,pid,"payment_failed").catch(e=>console.error("E-mail consulta legacy encerrada:",e))}
  return resposta({ok:true,orderId:pid,status:result.status??null,statusDetail:result.status_detail??null,paymentId:pid,shipping:null});
 }catch(e){console.error("Consultar pagamento:",e);return resposta({ok:false,error:"Erro ao consultar pagamento."},500)}
}
function cpfValido(cpf){if(!/^\d{11}$/.test(cpf)||/^([0-9])\1+$/.test(cpf))return false;let sum=0;for(let i=0;i<9;i++)sum+=Number(cpf[i])*(10-i);let d1=(sum*10)%11;if(d1===10)d1=0;if(d1!==Number(cpf[9]))return false;sum=0;for(let i=0;i<10;i++)sum+=Number(cpf[i])*(11-i);let d2=(sum*10)%11;if(d2===10)d2=0;return d2===Number(cpf[10])}
function resposta(dados,status=200){return new Response(JSON.stringify(dados),{status,headers:jsonHeaders})}
