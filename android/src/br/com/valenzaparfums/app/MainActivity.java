package br.com.valenzaparfums.app;

import android.app.*;
import android.os.*;
import android.content.*;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.*;
import android.net.Uri;
import android.view.*;
import android.webkit.*;
import android.widget.*;

/** Platform Android shell; customer accounts and catalogue remain on the trusted store. */
public class MainActivity extends Activity {
  private static final String HOME="https://www.valenzaparfums.com.br/";
  private static final int WINE=0xff370f24, GOLD=0xffd8bc80;
  private FrameLayout root; private WebView web; private LinearLayout welcome; private ScrollView welcomeScroll; private ProgressBar loading;
  private MediaPlayer chime; private boolean sound=true; private TextView soundButton;
  private int dp(float n){return (int)(getResources().getDisplayMetrics().density*n+.5f);}
  @Override public void onCreate(Bundle state){super.onCreate(state);
    sound=getPreferences(0).getBoolean("sound",true);
    root=new FrameLayout(this);root.setBackgroundColor(WINE);setContentView(root);
    root.setOnApplyWindowInsetsListener((v,i)->{v.setPadding(i.getSystemWindowInsetLeft(),i.getSystemWindowInsetTop(),i.getSystemWindowInsetRight(),i.getSystemWindowInsetBottom());return i.consumeSystemWindowInsets();});
    createWeb();showWelcome(true);
  }
  private TextView label(String text,int size,int color){TextView t=new TextView(this);t.setText(text);t.setTextSize(size);t.setTextColor(color);t.setGravity(Gravity.CENTER);return t;}
  private void gap(LinearLayout l,int height){l.addView(new View(this),new LinearLayout.LayoutParams(1,dp(height)));}
  private GradientDrawable shape(int color){GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(18));return d;}
  private Button button(String text,Runnable action){Button b=new Button(this);b.setText(text);b.setAllCaps(false);b.setTextSize(16);b.setTypeface(null,Typeface.BOLD);b.setTextColor(WINE);b.setBackground(shape(GOLD));LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,dp(54));lp.setMargins(0,dp(8),0,dp(4));b.setLayoutParams(lp);b.setOnClickListener(v->action.run());return b;}
  private void showWelcome(boolean animate){
    if(welcome!=null)root.removeView(welcomeScroll);
    welcome=new LinearLayout(this);welcome.setOrientation(1);welcome.setGravity(Gravity.CENTER);welcome.setPadding(dp(30),dp(18),dp(30),dp(18));welcome.setBackgroundColor(WINE);
    ImageView logo=new ImageView(this);logo.setImageResource(R.drawable.brand_logo);logo.setContentDescription("Valenza: V com diamante");welcome.addView(logo,new LinearLayout.LayoutParams(dp(170),dp(170)));
    TextView title=label("VALENZA",32,GOLD);title.setLetterSpacing(.18f);title.setTypeface(Typeface.create("serif",Typeface.NORMAL));welcome.addView(title);TextView subtitle=label("P A R F U M S",15,GOLD);welcome.addView(subtitle);gap(welcome,24);
    TextView headline=label("Sua próxima fragrância começa aqui.",22,Color.WHITE);welcome.addView(headline);gap(welcome,10);
    welcome.addView(label("Explore o catálogo. Entre na sua conta para comprar e acompanhar seus pedidos.",15,0xffe2d8dd));gap(welcome,24);
    welcome.addView(button("Entrar ou criar minha conta",()->openStore("minha-conta/?app=android")));
    Button browse=button("Explorar o catálogo",()->openStore("?app=android"));browse.setBackground(shape(0xfff6efe5));welcome.addView(browse);gap(welcome,18);
    soundButton=label("",14,GOLD);soundButton.setMinHeight(dp(48));updateSound();soundButton.setOnClickListener(v->{sound=!sound;getPreferences(0).edit().putBoolean("sound",sound).apply();updateSound();if(!sound)stopSound();else playSound();});welcome.addView(soundButton);
    welcomeScroll=new ScrollView(this);welcomeScroll.setFillViewport(true);welcomeScroll.setBackgroundColor(WINE);welcomeScroll.addView(welcome,new ScrollView.LayoutParams(-1,-2));root.addView(welcomeScroll,new FrameLayout.LayoutParams(-1,-1));
    if(animate){logo.setAlpha(0f);logo.setScaleX(.88f);logo.setScaleY(.88f);logo.animate().alpha(1).scaleX(1).scaleY(1).setDuration(650).start();
      ProgressBar spinner=new ProgressBar(this);spinner.setIndeterminateTintList(android.content.res.ColorStateList.valueOf(GOLD));FrameLayout.LayoutParams sp=new FrameLayout.LayoutParams(dp(28),dp(28),Gravity.BOTTOM|Gravity.CENTER_HORIZONTAL);sp.bottomMargin=dp(18);root.addView(spinner,sp);new Handler(Looper.getMainLooper()).postDelayed(()->root.removeView(spinner),1100);playSound();}
  }
  private void updateSound(){soundButton.setText(sound?"Som de abertura: ligado · tocar para desligar":"Som de abertura: desligado · tocar para ligar");}
  private void playSound(){if(!sound)return;AudioManager am=(AudioManager)getSystemService(AUDIO_SERVICE);if(am.getRingerMode()!=AudioManager.RINGER_MODE_NORMAL)return;try{stopSound();chime=MediaPlayer.create(this,R.raw.valenza_chime);chime.setVolume(.22f,.22f);chime.setOnCompletionListener(p->stopSound());chime.start();}catch(Exception ignored){stopSound();}}
  private void stopSound(){if(chime!=null){chime.release();chime=null;}}
  private void createWeb(){
    LinearLayout container=new LinearLayout(this);container.setOrientation(1);container.setBackgroundColor(Color.WHITE);root.addView(container,new FrameLayout.LayoutParams(-1,-1));
    LinearLayout toolbar=new LinearLayout(this);toolbar.setGravity(Gravity.CENTER_VERTICAL);toolbar.setBackgroundColor(WINE);
    TextView brand=label("VALENZA PARFUMS",14,GOLD);brand.setTypeface(null,Typeface.BOLD);toolbar.addView(brand,new LinearLayout.LayoutParams(0,dp(48),1));
    TextView menu=label("⋮",28,GOLD);menu.setContentDescription("Opções do aplicativo");toolbar.addView(menu,new LinearLayout.LayoutParams(dp(52),dp(48)));menu.setOnClickListener(v->{PopupMenu p=new PopupMenu(this,menu);p.getMenu().add("Minha conta");p.getMenu().add("Atualizar catálogo");p.getMenu().add("Tela inicial e som");p.setOnMenuItemClickListener(item->{String s=item.getTitle().toString();if(s.equals("Minha conta"))openStore("minha-conta/?app=android");else if(s.equals("Atualizar catálogo"))web.reload();else showWelcome(false);return true;});p.show();});container.addView(toolbar);
    loading=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);loading.setProgressTintList(android.content.res.ColorStateList.valueOf(GOLD));container.addView(loading,new LinearLayout.LayoutParams(-1,dp(3)));
    web=new WebView(this);WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setJavaScriptCanOpenWindowsAutomatically(false);s.setMediaPlaybackRequiresUserGesture(true);s.setUserAgentString(s.getUserAgentString()+" ValenzaAndroid/1.0");s.setCacheMode(WebSettings.LOAD_DEFAULT);
    CookieManager.getInstance().setAcceptCookie(true);CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
    web.setWebViewClient(new WebViewClient(){
      @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest r){Uri u=r.getUrl();if(trusted(u))return false;external(u);return true;}
      @Override public void onPageStarted(WebView v,String u,android.graphics.Bitmap icon){loading.setVisibility(View.VISIBLE);}
      @Override public void onPageFinished(WebView v,String url){loading.setVisibility(View.GONE);CookieManager.getInstance().flush();if(trusted(Uri.parse(url)))installAppGuards();}
      @Override public void onReceivedError(WebView v,WebResourceRequest r,WebResourceError e){if(r.isForMainFrame()){loading.setVisibility(View.GONE);new AlertDialog.Builder(MainActivity.this).setTitle("Não foi possível abrir a loja").setMessage("Confira sua conexão. Sua conta e seus pedidos continuam salvos na loja.").setPositiveButton("Tentar novamente",(d,w)->web.loadUrl(HOME)).setNegativeButton("Voltar",(d,w)->showWelcome(false)).show();}}
    });
    web.setWebChromeClient(new WebChromeClient(){
      @Override public void onProgressChanged(WebView v,int progress){loading.setProgress(progress);}
      @Override public boolean onJsAlert(WebView v,String url,String message,JsResult result){new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("OK",(d,w)->result.confirm()).setOnCancelListener(d->result.cancel()).show();return true;}
      @Override public boolean onJsConfirm(WebView v,String url,String message,JsResult result){new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("Confirmar",(d,w)->result.confirm()).setNegativeButton("Cancelar",(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()).show();return true;}
    });
    web.setDownloadListener((url,ua,disposition,mime,length)->{Uri u=Uri.parse(url);if(trusted(u))external(u);else Toast.makeText(this,"Abra os documentos pela sua conta no navegador.",Toast.LENGTH_LONG).show();});
    container.addView(web,new LinearLayout.LayoutParams(-1,0,1));
  }
  private boolean trusted(Uri u){return "https".equalsIgnoreCase(u.getScheme())&&("www.valenzaparfums.com.br".equalsIgnoreCase(u.getHost())||"valenzaparfums.com.br".equalsIgnoreCase(u.getHost()))&&(u.getPort()==-1||u.getPort()==443);}
  private void external(Uri u){String scheme=u.getScheme();if(!"https".equalsIgnoreCase(scheme)&&!"tel".equalsIgnoreCase(scheme)&&!"mailto".equalsIgnoreCase(scheme)&&!"whatsapp".equalsIgnoreCase(scheme))return;try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception e){Toast.makeText(this,"Não foi possível abrir este link no aparelho.",Toast.LENGTH_LONG).show();}}
  private void openStore(String path){if(welcome!=null){root.removeView(welcomeScroll);welcome=null;}web.loadUrl(HOME+path);}
  private void installAppGuards(){web.evaluateJavascript("(()=>{if(window.__valenzaNativeGuard)return;window.__valenzaNativeGuard=true;for(const name of ['add']){const original=window[name];if(typeof original==='function')window[name]=async function(...args){try{const r=await fetch('/api/auth/me',{credentials:'include',cache:'no-store'});const d=await r.json();if(!r.ok||!d.user){await openAccount();return;}return original.apply(this,args);}catch(e){alert('Confira sua conexão para entrar na conta.');}};} })();",null);}
  @Override public void onBackPressed(){if(welcome!=null){super.onBackPressed();return;}if(web.canGoBack())web.goBack();else showWelcome(false);}
  @Override protected void onPause(){super.onPause();stopSound();web.onPause();CookieManager.getInstance().flush();}
  @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
  @Override protected void onDestroy(){stopSound();web.destroy();super.onDestroy();}
}
