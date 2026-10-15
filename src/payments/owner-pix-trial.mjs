// Temporary, time-limited production checkout verification for the Valenza owner.
// Never modify public catalog, promotions, Merchant Center prices or other customer accounts.
// At expiration, the ordinary catalog and checkout are restored automatically.
export const OWNER_TRIAL_PRODUCT_ID='vulcan-baie';
export const OWNER_TRIAL_PRICE=1.00;
export const OWNER_TRIAL_ORIGINAL_PRICE=289.90;
export const OWNER_TRIAL_ORIGINAL_PIX=275.41;
export function ownerPixTrialActive(env,now=Date.now()){
 const exp=Date.parse(String(env?.VALENZA_OWNER_PIX_TRIAL_UNTIL||''));
 return env?.VALENZA_OWNER_PIX_TRIAL==='true'&&Number.isFinite(exp)&&now<exp;
}
export function ownerPixTrialEligible(user,env,now=Date.now()){
 return ownerPixTrialActive(env,now)&&Boolean(user?.email_verified)
  &&String(user.email||'').trim().toLowerCase()===String(env.VALENZA_OWNER_PIX_TRIAL_EMAIL||'').trim().toLowerCase()
  &&String(env.VALENZA_OWNER_PIX_TRIAL_EMAIL||'').trim().toLowerCase()==='wesleyvmartins97@gmail.com';
}
export function ownerPixTrialCartAllowed(items,shipping){
 return Array.isArray(items)&&items.length===1&&String(items[0]?.id||'')===OWNER_TRIAL_PRODUCT_ID
  &&Number(items[0]?.qty)===1&&String(shipping?.id||'')==='local-colatina';
}
export function ownerPixTrialPixUnit(item,trial){
 return trial&&String(item?.id||'')===OWNER_TRIAL_PRODUCT_ID?OWNER_TRIAL_PRICE:null;
}
