package br.com.valenzaparfums.app;
import android.app.AlertDialog;
import android.graphics.Color;
import android.view.Gravity;
import android.view.View;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.text.InputType;
import org.json.JSONArray;
import org.json.JSONObject;

/** Native, server-authorized administration; no WebView, browser or embedded site. */
final class AdminPanel {
 final MainActivity h;
 JSONObject dashboard;
 AdminPanel(MainActivity host){h=host;}
 void open(){
  if(h.user==null||!h.user.optBoolean("adminAccess",false)||!h.api.hasSession()){
   h.notice("Sua conta não tem acesso administrativo confirmado.");return;
  }
  h.begin("admin-auth","Administração Valenza");
  h.page.addView(h.text("Verificando acesso protegido…",15,MainActivity.MUTED));
  h.call("/api/admin/status",null,d->{
   if(!d.optBoolean("eligible",false)){h.notice("Acesso administrativo não autorizado.");h.showAccount();return;}
   if(d.optBoolean("authenticated",false)){home();return;}
   auth(d.optString("username",""),d.optBoolean("configured",false));
  });
 }
 void auth(String username,boolean configured){
  h.begin("admin-auth",configured?"Entrar na administração":"Criar acesso administrativo");
  h.backButton(()->h.showAccount());
  h.page.addView(h.text("Acesso restrito aos administradores autorizados. A senha administrativa é diferente da senha da loja.",14,MainActivity.MUTED));
  EditText login=h.field(h.page,"Usuário administrativo",username,InputType.TYPE_CLASS_TEXT);
  EditText pass=h.field(h.page,configured?"Senha administrativa":"Nova senha administrativa (mínimo 12 caracteres)","",InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);
  EditText confirm=configured?null:h.field(h.page,"Confirme a senha administrativa","",InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);
  h.page.addView(h.button(configured?"Entrar no painel":"Criar acesso protegido",()->{
   String u=h.val(login).toLowerCase(java.util.Locale.ROOT);
   String password=pass.getText().toString();
   if(u.length()<4||password.length()<(configured?1:12)){h.notice("Confira o usuário e a senha administrativa.");return;}
   JSONObject body=MainActivity.j("username",u,"password",password);
   if(!configured){try{body.put("confirmPassword",confirm.getText().toString());}catch(Exception ignored){}}
   h.call(configured?"/api/admin/login":"/api/admin/setup",body,d->{pass.setText("");if(confirm!=null)confirm.setText("");home();});
  }));
  h.page.addView(h.text("O aplicativo mantém a sessão administrativa protegida pelo Android Keystore. Nenhuma senha é salva.",12,MainActivity.MUTED));
 }
 void menu(LinearLayout parent){
  parent.addView(h.secondary("Visão geral",()->home()));
  parent.addView(h.secondary("Pedidos e rastreamentos",()->orders()));
  parent.addView(h.secondary("Produtos e preços",()->products()));
  parent.addView(h.secondary("Clientes",()->customers()));
  parent.addView(h.secondary("Financeiro e alertas",()->finance()));
  parent.addView(h.secondary("Encerrar sessão administrativa",()->logout()));
 }
 void home(){
  h.begin("admin-home","Painel Valenza");
  h.page.addView(h.text("Consultando os indicadores da loja…",14,MainActivity.MUTED));
  h.call("/api/admin/dashboard",null,d->{dashboard=d;renderHome();});
 }
 void renderHome(){
  h.begin("admin-home","Administração da loja");
  JSONObject m=dashboard.optJSONObject("metrics");if(m==null)m=new JSONObject();
  h.page.addView(h.text("Indicadores em tempo real, protegidos pela sua conta administrativa.",13,MainActivity.MUTED));
  metric("Vendas pagas",String.valueOf(m.optInt("paidOrders",0)));
  metric("Faturamento confirmado",h.money(m.optDouble("revenue",0)));
  metric("Pedidos pendentes",String.valueOf(m.optInt("pendingOrders",0)));
  metric("Clientes",String.valueOf(m.optInt("customers",0)));
  metric("Produtos sem estoque",String.valueOf(m.optInt("outOfStockProducts",0)));
  menu(h.page);
  h.page.addView(h.text("As alterações são validadas pelo servidor da Valenza antes de serem gravadas.",12,MainActivity.MUTED));
 }
 void metric(String label,String value){
  LinearLayout row=h.panel();row.addView(h.text(label,13,MainActivity.MUTED));
  TextView num=h.text(value,23,MainActivity.WINE);num.setTypeface(android.graphics.Typeface.create("sans-serif-medium",0));row.addView(num);h.page.addView(row);
 }
 void section(String pageName,String title){
  h.begin(pageName,title);
  h.backButton(()->{if(dashboard==null)home();else renderHome();});
 }
 void orders(){
  if(dashboard==null){home();return;}
  section("admin-orders","Pedidos da loja");
  JSONArray list=dashboard.optJSONArray("recentOrders");
  if(list==null||list.length()==0){h.page.addView(h.text("Nenhum pedido recente.",14,MainActivity.MUTED));return;}
  h.page.addView(h.text("Últimos "+list.length()+" pedidos. Atualize no painel para buscar dados recentes.",12,MainActivity.MUTED));
  for(int i=0;i<list.length();i++){
   JSONObject o=list.optJSONObject(i);if(o==null)continue;
   LinearLayout c=h.panel();
   String number=o.optString("order_number",o.optString("id",""));
   c.addView(h.text("Pedido "+number,17,MainActivity.WINE));
   c.addView(h.text(o.optString("customer_name","Cliente")+" · "+o.optString("status",""),13,MainActivity.INK));
   c.addView(h.text(h.money(o.optDouble("total",0)),17,MainActivity.WINE));
   String track=o.optString("tracking_code","");
   if(!track.isEmpty())c.addView(h.text("Rastreio: "+track,13,MainActivity.MUTED));
   String email=o.optString("email","");
   if(!email.isEmpty())c.addView(h.text(email,12,MainActivity.MUTED));
   h.page.addView(c);
  }
  h.page.addView(h.secondary("Atualizar pedidos",()->home()));
 }
 void customers(){
  if(dashboard==null){home();return;}
  section("admin-customers","Clientes");
  JSONArray list=dashboard.optJSONArray("recentCustomers");
  if(list==null||list.length()==0){h.page.addView(h.text("Nenhum cliente recente.",14,MainActivity.MUTED));return;}
  for(int i=0;i<list.length();i++){
   JSONObject u=list.optJSONObject(i);if(u==null)continue;
   LinearLayout card=h.panel();
   card.addView(h.text(u.optString("name","Cliente"),16,MainActivity.WINE));
   card.addView(h.text(u.optString("email",""),13,MainActivity.MUTED));
   if(u.optInt("is_admin",0)==1)card.addView(h.text("Administrador",12,MainActivity.WINE));
   h.page.addView(card);
  }
 }
 void products(){
  section("admin-products","Produtos e preços");
  h.page.addView(h.text("Carregando catálogo administrativo…",14,MainActivity.MUTED));
  h.call("/api/admin/products/catalog",null,d->renderProducts(d.optJSONArray("products")));
 }
 void renderProducts(JSONArray list){
  section("admin-products","Produtos e preços");
  if(list==null){h.page.addView(h.text("Catálogo indisponível.",14,MainActivity.MUTED));return;}
  h.page.addView(h.text("Toque em um produto para editar preço ou disponibilidade. Mudanças afetam a loja e o app.",13,MainActivity.MUTED));
  h.page.addView(h.text(list.length()+" produtos cadastrados",12,MainActivity.MUTED));
  for(int i=0;i<list.length();i++){
   JSONObject p=list.optJSONObject(i);if(p==null)continue;
   String id=p.optString("id","");if(id.isEmpty())continue;
   LinearLayout card=h.panel();
   card.addView(h.text(p.optString("name",id),16,MainActivity.WINE));
   card.addView(h.text(p.optString("brand","")+" · "+h.money(p.optDouble("price",0))+" · Estoque: "+p.optInt("stock",0),13,MainActivity.MUTED));
   card.addView(h.text(p.optBoolean("active",true)?"Disponível":"Indisponível",12,MainActivity.MUTED));
   card.addView(h.secondary("Gerenciar produto",()->editProduct(p)));
   h.page.addView(card);
  }
 }
 void editProduct(JSONObject p){
  String id=p.optString("id","");
  section("admin-product","Editar produto");
  h.page.addView(h.text(p.optString("name",id),20,MainActivity.WINE));
  h.page.addView(h.text("As informações serão validadas pelo servidor antes da alteração.",13,MainActivity.MUTED));
  EditText price=h.field(h.page,"Preço normal (R$)",String.format(java.util.Locale.US,"%.2f",p.optDouble("price",0)),InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_FLAG_DECIMAL);
  h.page.addView(h.button("Salvar novo preço",()->{
   double amount;try{amount=Double.parseDouble(h.val(price).replace(",","."));}catch(Exception e){h.notice("Informe um preço válido.");return;}
   if(amount<=0||amount>50000){h.notice("O valor deve estar entre R$ 0,01 e R$ 50.000.");return;}
   final double value=amount;
   new AlertDialog.Builder(h).setTitle("Confirmar novo preço").setMessage("Alterar o preço de "+p.optString("name",id)+" para "+h.money(value)+" em toda a loja?").setNegativeButton("Cancelar",null).setPositiveButton("Confirmar",(dialog,which)->h.call("/api/admin/prices/update",MainActivity.j("productId",id,"price",value),d->{h.toast("Preço atualizado.");products();})).show();
  }));
  boolean active=p.optBoolean("active",true);
  h.page.addView(h.secondary(active?"Suspender produto na loja":"Restaurar produto na loja",()->new AlertDialog.Builder(h).setTitle(active?"Suspender produto?":"Restaurar produto?").setMessage("Esta alteração afeta a disponibilidade do produto para os clientes.").setNegativeButton("Cancelar",null).setPositiveButton("Confirmar",(dialog,which)->h.call("/api/admin/products/availability",MainActivity.j("productId",id,"active",!active),d->{h.toast("Disponibilidade atualizada.");products();})).show()));
  h.page.addView(h.secondary("Voltar aos produtos",()->products()));
 }
 void finance(){
  if(dashboard==null){home();return;}
  section("admin-finance","Financeiro e alertas");
  JSONObject m=dashboard.optJSONObject("metrics");if(m!=null){
   metric("Faturamento confirmado",h.money(m.optDouble("revenue",0)));
   metric("Ticket médio",h.money(m.optDouble("averageTicket",0)));
   metric("Pedidos pendentes",String.valueOf(m.optInt("pendingOrders",0)));
  }
  JSONArray alerts=dashboard.optJSONArray("operationalAlerts");
  if(alerts!=null&&alerts.length()>0){
   h.page.addView(h.title("Alertas operacionais"));
   for(int i=0;i<alerts.length();i++){JSONObject a=alerts.optJSONObject(i);if(a==null)continue;LinearLayout c=h.panel();c.addView(h.text(a.optString("title"),16,MainActivity.WINE));c.addView(h.text(a.optString("message"),13,MainActivity.INK));h.page.addView(c);}
  }
  h.page.addView(h.secondary("Atualizar indicadores",()->home()));
 }
 void logout(){
  new AlertDialog.Builder(h).setTitle("Sair da administração?").setMessage("A conta da loja continuará conectada.").setNegativeButton("Cancelar",null).setPositiveButton("Sair",(dialog,which)->h.call("/api/admin/logout",MainActivity.j(),d->{h.api.clearAdminSession();h.showAccount();})).show();
 }
 boolean back(){
  String p=h.screen;
  if(!p.startsWith("admin-"))return false;
  if(p.equals("admin-home")||p.equals("admin-auth"))h.showAccount();
  else if(p.equals("admin-product"))products();
  else if(dashboard!=null)renderHome();else home();
  return true;
 }
}
