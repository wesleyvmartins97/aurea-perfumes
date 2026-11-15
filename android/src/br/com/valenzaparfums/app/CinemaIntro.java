package br.com.valenzaparfums.app;
import android.content.*;import android.graphics.*;import android.view.*;import android.os.*;import android.animation.*;

/** Original real-time Canvas intro: rotating official mark, gold particles and light sweep. */
final class CinemaIntro extends View {
 private final View target;private final Paint p=new Paint(3);private final Bitmap logo;private float t;private final ValueAnimator anim;private final Runnable finish;private boolean done;
 CinemaIntro(Context c,View logoTarget,Runnable end){super(c);target=logoTarget;finish=end;logo=BitmapFactory.decodeResource(getResources(),R.drawable.brand_logo);setContentDescription("Abertura Valenza Parfums. Toque para pular.");setLayerType(View.LAYER_TYPE_HARDWARE,null);anim=ValueAnimator.ofFloat(0,1);anim.setDuration(3200);anim.setInterpolator(new android.view.animation.LinearInterpolator());anim.addUpdateListener(a->{t=(Float)a.getAnimatedValue();invalidate();});anim.addListener(new AnimatorListenerAdapter(){public void onAnimationEnd(Animator a){complete();}});setOnClickListener(v->{anim.cancel();complete();});}
 void start(){anim.start();}
 private void complete(){if(!done){done=true;finish.run();}}
 @Override protected void onDetachedFromWindow(){super.onDetachedFromWindow();done=true;anim.cancel();}
 @Override protected void onDraw(Canvas canvas){super.onDraw(canvas);float w=getWidth(),h=getHeight(),cx=w/2,cy=h*.43f,unit=Math.min(w*.60f,h*.34f);float settleTarget=Math.max(0,Math.min(1,(t-.72f)/.28f));settleTarget=settleTarget*settleTarget*(3-2*settleTarget);int[] targetAt=new int[2],ownAt=new int[2];target.getLocationOnScreen(targetAt);getLocationOnScreen(ownAt);cx+=(targetAt[0]-ownAt[0]+target.getWidth()/2f-cx)*settleTarget;cy+=(targetAt[1]-ownAt[1]+target.getHeight()/2f-cy)*settleTarget;unit+=(target.getWidth()-unit)*settleTarget;canvas.drawColor(0xff370f24);
  p.setShader(new RadialGradient(cx,cy,Math.max(w,h)*.65f,new int[]{0xff6d3048,0xff370f24,0xff210b19},null,Shader.TileMode.CLAMP));p.setAlpha(255);canvas.drawRect(0,0,w,h,p);p.setShader(null);
  float gather=Math.min(1,t/0.78f),fade=Math.min(1,t*6)*(1-Math.max(0,(t-.78f)/.22f));
  for(int i=0;i<68;i++){float seed=i*2.399963f,rad=(.2f+(i%17)/19f)*Math.min(w,h)*.6f*(1-.64f*gather);float x=cx+(float)Math.cos(seed+t*1.8)*rad,y=cy+(float)Math.sin(seed+t*1.8)*rad;p.setColor(0xffffd98e);p.setAlpha((int)(150*fade*(.45f+.55f*Math.sin(i+t*5)*Math.sin(i+t*5))));canvas.drawCircle(x,y,1+(i%4)*getResources().getDisplayMetrics().density*.45f,p);}
  float settle=Math.min(1,t/.78f),ease=1-(float)Math.pow(1-settle,3),size=unit*(.65f+.35f*ease);int sc=canvas.save();canvas.translate(cx,cy);canvas.rotate(360f*ease);canvas.scale(.86f+.14f*ease,.86f+.14f*ease);
  p.setAlpha((int)(255*Math.min(1,t*5)));canvas.drawBitmap(logo,null,new RectF(-size/2,-size*logo.getHeight()/logo.getWidth()/2,size/2,size*logo.getHeight()/logo.getWidth()/2),p);
  float sweep=(t*2.3f-.6f)*size;if(t>.22&&t<.72){p.setShader(new LinearGradient(sweep-size*.16f,0,sweep+size*.16f,0,new int[]{0x00fff5cd,0x55fff5cd,0x00fff5cd},null,Shader.TileMode.CLAMP));canvas.drawRoundRect(new RectF(-size*.38f,-size*.35f,size*.38f,size*.35f),size*.1f,size*.1f,p);p.setShader(null);}canvas.restoreToCount(sc);
  float textAlpha=Math.min(1,Math.max(0,(t-.34f)*3.2f));p.setColor(0xffe8c889);p.setAlpha((int)(255*textAlpha));p.setTextAlign(Paint.Align.CENTER);p.setTypeface(Typeface.create("serif",Typeface.NORMAL));p.setTextSize(w*.083f);canvas.drawText("V A L E N Z A",cx,cy+unit*.65f,p);p.setTypeface(Typeface.create("sans-serif",Typeface.NORMAL));p.setTextSize(w*.035f);canvas.drawText("P A R F U M S",cx,cy+unit*.85f,p);p.setTextSize(w*.028f);p.setAlpha((int)(180*textAlpha));canvas.drawText("Uma assinatura. Infinitas sensações.",cx,cy+unit*1.12f,p);
  p.setTextSize(w*.026f);p.setAlpha(130);canvas.drawText("TOQUE PARA CONTINUAR",cx,h*.91f,p);p.setAlpha(255);
 }
}
