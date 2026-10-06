[Reading 1000 lines from start (total: 2251 lines, 1251 remaining)]

import {catalogPageHtml} from './catalog-page.mjs';
import {merchantFulfillment} from './merchant-fulfillment.mjs';
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
 if(url.pathname==="/api/admin/products/catalog"&&request.method==="GET")return adminCatalogProducts(request,env);
 if(url.pathname==="/api/admin/products/save"&&request.method==="POST")return adminCatalogProductSave(request,env);
 if(url.pathname==="/api/admin/products/image"&&request.method==="POST")return adminCatalogProductImage(request,env);
 if(request.method==="GET"&&url.pathname.startsWith("/media/products/"))return catalogProductImage(request,env,url.pathname.slice("/media/products/".length));
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
  env.DB.prepare("CREATE TABLE IF NOT EXISTS catalog_products (product_id TEXT PRIMARY KEY, is_custom INTEGER NOT NULL DEFAULT 0, published INTEGER NOT NULL DEFAULT 1, name TEXT, brand TEXT, cat TEXT, collection TEXT, type TEXT, gtin TEXT, base_price REAL, short_description TEXT, long_description TEXT, notes_top TEXT, notes_heart TEXT, notes_base TEXT, weight REAL, length REAL, height REAL, width REAL, image_url TEXT, offer INTEGER, featured INTEGER NOT NULL DEFAULT 0, seo_title TEXT, seo_description TEXT, sort_order INTEGER, created_by TEXT, updated_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)"),
  env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_catalog_products_custom_published ON catalog_products(is_custom,published,updated_at)"),
  env.DB.prepare("CREATE TABLE IF NOT EXISTS catalog_product_images (product_id TEXT PRIMARY KEY, content_type TEXT NOT NULL, data BLOB NOT NULL, byte_size INTEGER NOT NULL, updated_at TEXT NOT NULL)"),
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
  const p=catalog[row.product_id],base=Number(p?.price),promo=Number(row.promo_price);
  if(p&&p.offer!==false&&!map.has(String(row.product_id))&&Number.isFinite(base)&&Number.isFinite(promo)&&promo>0&&promo<base)map.set(String(row.product_id),row);
 }
 return map;
}
async function activeProductPromotionsPublic(env){
 try{
  const rows=await activeProductPromotionRows(env),catalog=await officialCatalog(env),promotions=[];
  for(const row of rows){
   const p=catalog[row.product_id],base=Number(p?.price),promo=Number(row.promo_price);
   if(!p||p.offer===false||!Number.isFinite(base)||!Number.isFinite(promo)||promo<=0||promo>=base)continue;
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
  if(p.offer===false)return resposta({ok:false,error:"Este produto está marcado como não vendável. Ative a venda antes de criar uma oferta."},409);
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
  const catalog=await officialCatalog(env),product=catalog[row.product_id],base=Number(product?.price),promo=Number(row.promo_price);
  if(d.active&&product?.offer===false)return resposta({ok:false,error:"Este produto está marcado como não vendável. Ative a venda antes de reativar a oferta."},409);
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

[executed on device: Wesley-Comercial (046fd993-2053-4712-9851-794f0185b67f)]