package br.com.valenzaparfums.app;
import android.graphics.*;import android.graphics.drawable.Drawable;

/** Resolution-independent, antialiased interface icons in a consistent 24-unit grid. */
final class BrandIcon extends Drawable {
 final String kind;final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);final int color;
 BrandIcon(String name,int tint){kind=name;color=tint;}
 public void draw(Canvas c){Rect b=getBounds();int save=c.save();float size=Math.min(b.width(),b.height());c.translate(b.left+(b.width()-size)/2,b.top+(b.height()-size)/2);c.scale(size/24,size/24);paint.setColor(color);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(1.65f);paint.setStrokeCap(Paint.Cap.ROUND);paint.setStrokeJoin(Paint.Join.ROUND);Path p=new Path();
  switch(kind){
   case "bag":c.drawRoundRect(4,7,20,21,3,3,paint);p.moveTo(8,8);p.lineTo(8,6);p.cubicTo(8,1,16,1,16,6);p.lineTo(16,8);break;
   case "heart":p.moveTo(12,20);p.cubicTo(9,17,3,13,3,8);p.cubicTo(3,2,10,2,12,7);p.cubicTo(14,2,21,2,21,8);p.cubicTo(21,13,15,17,12,20);break;
   case "person":c.drawCircle(12,7,4,paint);p.moveTo(4,21);p.lineTo(4,19);p.cubicTo(4,11,20,11,20,19);p.lineTo(20,21);break;
   case "search":c.drawCircle(10.5f,10.5f,6.5f,paint);p.moveTo(16,16);p.lineTo(21,21);break;
   case "back":p.moveTo(15,5);p.lineTo(8,12);p.lineTo(15,19);break;
   case "share":c.drawCircle(18,5,2.5f,paint);c.drawCircle(5,12,2.5f,paint);c.drawCircle(18,19,2.5f,paint);p.moveTo(7,11);p.lineTo(16,6);p.moveTo(7,13);p.lineTo(16,18);break;
   case "refresh":c.drawArc(4,4,20,20,35,290,false,paint);p.moveTo(20,3);p.lineTo(20,9);p.lineTo(14,9);break;
   case "minus":p.moveTo(6,12);p.lineTo(18,12);break;
   case "plus":p.moveTo(6,12);p.lineTo(18,12);p.moveTo(12,6);p.lineTo(12,18);break;
   case "trash":p.moveTo(4,6);p.lineTo(20,6);p.moveTo(9,3);p.lineTo(15,3);p.moveTo(6,6);p.lineTo(7,21);p.lineTo(17,21);p.lineTo(18,6);p.moveTo(10,10);p.lineTo(10,17);p.moveTo(14,10);p.lineTo(14,17);break;
   case "arrow":p.moveTo(4,12);p.lineTo(20,12);p.moveTo(14,6);p.lineTo(20,12);p.lineTo(14,18);break;
   case "truck":c.drawRoundRect(2,5,15,17,1,1,paint);p.moveTo(15,9);p.lineTo(19,9);p.lineTo(22,13);p.lineTo(22,17);p.lineTo(15,17);c.drawCircle(6,18,2,paint);c.drawCircle(18,18,2,paint);break;
   case "shield":p.moveTo(12,2);p.lineTo(21,6);p.cubicTo(21,15,18,19,12,22);p.cubicTo(6,19,3,15,3,6);p.close();p.moveTo(8,12);p.lineTo(11,15);p.lineTo(16,9);break;
  }c.drawPath(p,paint);c.restoreToCount(save);
 }
 public void setAlpha(int alpha){paint.setAlpha(alpha);invalidateSelf();}public void setColorFilter(ColorFilter f){paint.setColorFilter(f);invalidateSelf();}public int getOpacity(){return PixelFormat.TRANSLUCENT;}
}
