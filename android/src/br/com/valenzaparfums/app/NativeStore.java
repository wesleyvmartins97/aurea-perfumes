package br.com.valenzaparfums.app;
import android.content.*;import android.security.keystore.*;import android.util.Base64;import org.json.*;
import javax.crypto.*;import javax.crypto.spec.GCMParameterSpec;import javax.net.ssl.HttpsURLConnection;
import java.security.*;import java.net.*;import java.io.*;import java.util.*;

/** HTTPS JSON client. The session is encrypted with a non-exportable Android Keystore key. */
final class NativeStore {
 static final String ORIGIN="https://www.valenzaparfums.com.br";
 final Context context; private final SharedPreferences prefs; private volatile String cookie=""; private volatile String adminCookie="";
 NativeStore(Context c){context=c;prefs=c.getSharedPreferences("valenza_native_private",0);cookie=secret("session");adminCookie=secret("admin_session");}
 static JSONObject object(Object...args){JSONObject j=new JSONObject();try{for(int i=0;i<args.length;i+=2)j.put((String)args[i],args[i+1]);}catch(Exception e){throw new IllegalArgumentException(e);}return j;}
 private javax.crypto.SecretKey key()throws Exception{KeyStore ks=KeyStore.getInstance("AndroidKeyStore");ks.load(null);if(ks.containsAlias("valenza_native_v2"))return (javax.crypto.SecretKey)ks.getKey("valenza_native_v2",null);KeyGenerator g=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");g.init(new KeyGenParameterSpec.Builder("valenza_native_v2",KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());return g.generateKey();}
 synchronized String secret(String name){try{String[] parts=prefs.getString(name,"").split(":");if(parts.length!=2)return "";Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,key(),new GCMParameterSpec(128,Base64.decode(parts[0],Base64.NO_WRAP)));return new String(c.doFinal(Base64.decode(parts[1],Base64.NO_WRAP)),"UTF-8");}catch(Exception e){prefs.edit().remove(name).apply();return "";}}
 synchronized void secret(String name,String value){try{if(value.isEmpty()){prefs.edit().remove(name).apply();return;}Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,key());prefs.edit().putString(name,Base64.encodeToString(c.getIV(),Base64.NO_WRAP)+":"+Base64.encodeToString(c.doFinal(value.getBytes("UTF-8")),Base64.NO_WRAP)).apply();}catch(Exception e){throw new IllegalStateException("Não foi possível proteger os dados no aparelho.",e);}}
 void clearSession(){cookie="";secret("session","");clearAdminSession();}
 void clearAdminSession(){adminCookie="";secret("admin_session","");}
 boolean hasSession(){return !cookie.isEmpty();}
 JSONObject request(String route,JSONObject body)throws Exception{
   if(!route.startsWith("/api/")||route.contains("\r")||route.contains("\n"))throw new IOException("Endereço inválido.");
   HttpsURLConnection c=(HttpsURLConnection)new URL(ORIGIN+route).openConnection();c.setInstanceFollowRedirects(false);c.setConnectTimeout(12000);c.setReadTimeout(route.startsWith("/api/pagamento")?110000:35000);c.setRequestMethod(body==null?"GET":"POST");c.setRequestProperty("Accept","application/json");c.setRequestProperty("Cache-Control","no-cache");c.setRequestProperty("User-Agent","ValenzaNative/2.0 Android");c.setRequestProperty("Origin",ORIGIN);if(!cookie.isEmpty())c.setRequestProperty("Cookie",cookie+(route.startsWith("/api/admin/")&&!adminCookie.isEmpty()?"; "+adminCookie:""));else if(route.startsWith("/api/admin/")&&!adminCookie.isEmpty())c.setRequestProperty("Cookie",adminCookie);
   try{if(body!=null){c.setDoOutput(true);c.setRequestProperty("Content-Type","application/json; charset=utf-8");try(OutputStream out=c.getOutputStream()){out.write(body.toString().getBytes("UTF-8"));}}
    int status=c.getResponseCode();for(Map.Entry<String,List<String>> h:c.getHeaderFields().entrySet())if(h.getKey()!=null&&h.getKey().equalsIgnoreCase("Set-Cookie"))for(String raw:h.getValue()){java.util.regex.Matcher m=java.util.regex.Pattern.compile("(?:^|,\\s*)__Host-valenza_session=([^; ,]*)").matcher(raw);while(m.find()){cookie="__Host-valenza_session="+m.group(1);secret("session",cookie);}if(route.startsWith("/api/admin/")){java.util.regex.Matcher a=java.util.regex.Pattern.compile("(?:^|,\\s*)valenza_admin=([^; ,]*)").matcher(raw);while(a.find()){String token=a.group(1);if(token.isEmpty()){clearAdminSession();}else{adminCookie="valenza_admin="+token;secret("admin_session",adminCookie);}}}}
    InputStream stream=status>=400?c.getErrorStream():c.getInputStream();String text=stream==null?"{}":read(stream,3*1024*1024);JSONObject data;try{data=new JSONObject(text);}catch(Exception e){throw new IOException("A loja não respondeu corretamente. Tente novamente.");}
    if(status>=400||!data.optBoolean("ok",false)){if(status==401&&!route.startsWith("/api/admin/")&&!route.startsWith("/api/auth/login")&&!route.equals("/api/account/password"))clearSession();if(status==401&&route.startsWith("/api/admin/")&&!route.equals("/api/admin/login"))clearAdminSession();throw new ApiError(data.optString("error","Não foi possível concluir agora."),status);}return data;
   }finally{c.disconnect();}
 }
 static String read(InputStream in,int limit)throws IOException{try(InputStream stream=in;ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[8192];int n,total=0;while((n=stream.read(b))!=-1){total+=n;if(total>limit)throw new IOException("Resposta maior que o esperado.");out.write(b,0,n);}return out.toString("UTF-8");}}
 JSONObject catalog()throws Exception{return request("/api/app/catalog",null);}
 static final class ApiError extends IOException{final int status;ApiError(String s,int code){super(s);status=code;}}
}
