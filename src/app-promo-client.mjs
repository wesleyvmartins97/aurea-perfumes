// Scoped promotional UI; the approved catalogue styles and account flows stay intact.
export const appClient=String.raw`(()=>{
  if(window.__valenzaInstall||/Valenza(?:Android|Native)\//.test(navigator.userAgent))return;
  window.__valenzaInstall=true;
  const isIOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const key='valenza-app-invite-until-v2';
  let backdrop=null,lastFocus=null,previousOverflow='';
  function remember(){try{localStorage.setItem(key,String(Date.now()+7*86400000));}catch{}}
  function dismissed(){try{return Number(localStorage.getItem(key)||0)>Date.now();}catch{return false;}}
  const style=document.createElement('style');style.dataset.valenzaAppPromo='1';style.textContent=
    '#vzAppTop{display:block;width:100%;border:0;margin:0;padding:10px 12px;min-height:38px;background:#370f24;color:#edd5a0;text-align:center;font:500 12px/1.5 system-ui,sans-serif;letter-spacing:.4px;cursor:pointer}'+
    '#vzAppTop span{border-bottom:1px solid #cba66c;margin-left:8px;white-space:nowrap}'+
    '#vzAppOverlay{position:fixed;inset:0;z-index:2147483000;background:#140b12bd;backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;overflow:auto;overscroll-behavior:contain}'+
    '#vzAppDialog{position:relative;display:grid;grid-template-columns:.9fr 1.1fr;width:min(760px,100%);max-height:calc(100dvh - 32px);overflow:auto;background:#faf6ef;color:#35202b;border:1px solid #d5b57c99;border-radius:24px;box-shadow:0 30px 110px #0008;isolation:isolate;animation:vzAppIn .28s ease-out;font:15px/1.55 system-ui,sans-serif;text-align:left;box-sizing:border-box}'+
    '#vzAppDialog *{box-sizing:border-box}#vzAppDialog button,#vzAppDialog a{-webkit-tap-highlight-color:transparent}'+
    '#vzAppHero{position:relative;min-height:390px;overflow:hidden;background:#370f24}'+
    '#vzAppHeroPhoto{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:78% center;opacity:.68}'+
    '#vzAppHero:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,#240e221a 0%,#370f2444 40%,#370f24 100%)}'+
    '#vzAppHeroBrand{position:absolute;z-index:1;left:24px;right:24px;bottom:28px;color:#f4dfb2}'+
    '#vzAppHeroBrand img{display:block;width:84px;height:76px;padding:7px;background:#370f24cc;border:1px solid #d8bc8055;border-radius:19px;margin-bottom:12px}'+
    '#vzAppHeroBrand strong{display:block;font:25px/1.25 Georgia,serif;letter-spacing:2px}#vzAppHeroBrand small{display:block;font:10px/1.7 system-ui;letter-spacing:4px;margin-top:3px}'+
    '#vzAppContent{padding:44px 30px 28px}#vzAppEyebrow{color:#8c653c;font:700 10px/1.5 system-ui;letter-spacing:2px;margin:0 0 13px}'+
    '#vzAppTitle{font:34px/1.08 Georgia,serif;letter-spacing:-.6px;margin:0 0 16px;color:#3d172b}'+
    '#vzAppCopy{color:#71636a;font-size:14px;line-height:1.65;margin:0 0 18px}'+
    '#vzAppFeatures{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 23px;padding:0;list-style:none}#vzAppFeatures li{font:500 11px/1.4 system-ui;padding:6px 9px;border:1px solid #dfd3c3;border-radius:30px;color:#6a4f40;background:#fffaf2}'+
    '#vzAppDownload{display:block;width:100%;border:0;border-radius:13px;padding:15px 10px;background:linear-gradient(105deg,#3b1128,#642b45);color:#fff1d9;text-align:center;text-decoration:none;font:650 14px/1.4 system-ui;cursor:pointer;box-shadow:0 6px 18px #370f2422}'+
    '#vzAppContinue{display:block;width:100%;min-height:44px;border:0;background:transparent;color:#755b69;font:500 13px/1.4 system-ui;margin:6px 0;cursor:pointer;text-decoration:underline;text-underline-offset:4px}'+
    '#vzAppNote{font:11px/1.55 system-ui;color:#8a7b7f;margin:4px 0 0;text-align:center}'+
    '#vzAppClose{position:absolute;z-index:3;right:10px;top:10px;width:40px;height:40px;border:1px solid #d2bfab;background:#fff9f0ed;border-radius:50%;font:26px/1 system-ui;color:#513345;cursor:pointer;display:grid;place-items:center}'+
    '#vzAppIOS{background:#eee5d8;border-radius:12px;padding:12px;font:13px/1.6 system-ui;margin-top:12px}'+
    '#vzAppDialog :focus-visible,#vzAppTop:focus-visible{outline:3px solid #c79849;outline-offset:3px}'+
    '@keyframes vzAppIn{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}'+
    '@media(max-width:600px){#vzAppDialog{display:block;max-width:390px;border-radius:22px}#vzAppHero{min-height:145px;height:145px}#vzAppHeroPhoto{object-position:78% 48%}#vzAppHero:after{background:linear-gradient(90deg,#370f24ed,#370f2444)}#vzAppHeroBrand{left:20px;bottom:19px}#vzAppHeroBrand img{width:55px;height:52px;padding:5px;margin-bottom:7px;border-radius:13px}#vzAppHeroBrand strong{font-size:18px}#vzAppHeroBrand small{font-size:8px}#vzAppContent{padding:22px 23px 18px}#vzAppTitle{font-size:30px;margin-bottom:12px}#vzAppEyebrow{margin-bottom:9px}#vzAppCopy{margin-bottom:14px;font-size:13px}#vzAppFeatures{margin-bottom:17px}#vzAppNote{font-size:10px}}'+
    '@media(prefers-reduced-motion:reduce){#vzAppDialog{animation:none}}';
  document.head.append(style);
  function close(){if(!backdrop)return;remember();backdrop.remove();backdrop=null;document.body.style.overflow=previousOverflow;document.removeEventListener('keydown',keys);if(lastFocus&&lastFocus.isConnected)lastFocus.focus({preventScroll:true});}
  function keys(e){if(!backdrop)return;if(e.key==='Escape'){e.preventDefault();close();return;}if(e.key!=='Tab')return;const f=[...backdrop.querySelectorAll('a[href],button')].filter(el=>!el.hidden&&el.getClientRects().length);const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  function open(){
    if(backdrop)return;lastFocus=document.activeElement;previousOverflow=document.body.style.overflow;
    backdrop=document.createElement('div');backdrop.id='vzAppOverlay';
    backdrop.innerHTML='<section id="vzAppDialog" role="dialog" aria-modal="true" aria-labelledby="vzAppTitle" aria-describedby="vzAppCopy">'+
      '<button id="vzAppClose" type="button" aria-label="Fechar convite do aplicativo">×</button>'+
      '<div id="vzAppHero"><img id="vzAppHeroPhoto" src="/banners/glossy-fast-file_000000000724820ebc0b08dbb2f06341.webp" alt="" decoding="async"><div id="vzAppHeroBrand"><img src="/brand/valenza-symbol.svg" alt="V com diamante"><strong>VALENZA</strong><small>PARFUMS · NO SEU CELULAR</small></div></div>'+
      '<div id="vzAppContent"><p id="vzAppEyebrow">UM TOQUE DE VALENZA, TODOS OS DIAS</p><h2 id="vzAppTitle">Sua próxima fragrância.<br>Sempre por perto.</h2><p id="vzAppCopy">Explore nossas fragrâncias e tenha sua conta e seus pedidos em um só lugar. Leve a experiência Valenza com você.</p><ul id="vzAppFeatures"><li>✦ Catálogo completo</li><li>◇ Sua conta</li><li>✓ Seus pedidos</li></ul>'+
      (isIOS?'<button id="vzAppDownload" type="button" aria-expanded="false" aria-controls="vzAppIOS">Adicionar a Valenza ao iPhone</button><div id="vzAppIOS" hidden>Abra este site no <strong>Safari</strong>, toque em <strong>Compartilhar</strong> e escolha <strong>Adicionar à Tela de Início</strong>. O APK Android não funciona no iPhone.</div>':'<a id="vzAppDownload" href="/api/app/download" download="Valenza-Parfums.apk">Baixar app para Android ↓</a>')+
      (isIOS?'':'<a id="vzAppPreview" href="https://github.com/wesleyvmartins97/aurea-perfumes/releases/download/android-preview-43669618944/Valenza-Parfums-Teste.apk" rel="noopener noreferrer" style="display:block;margin:10px 0;padding:11px;border:1px solid #b99655;border-radius:12px;color:#5b2038;text-align:center;text-decoration:none;font:600 12px/1.45 system-ui,sans-serif">Versão com Administração (teste separado) ↓</a>')+
      '<button id="vzAppContinue" type="button">Agora não, quero continuar no site</button><p id="vzAppNote">'+(isIOS?'Acesso pelo site, com ícone na sua tela inicial.':'Download gratuito · Android 8 ou superior.<br>O Android pode solicitar autorização para instalar.')+'</p></div></section>';
    backdrop.addEventListener('click',e=>{if(e.target===backdrop)close();});
    backdrop.querySelector('#vzAppClose').addEventListener('click',close);
    backdrop.querySelector('#vzAppContinue').addEventListener('click',close);
    backdrop.querySelector('#vzAppDownload').addEventListener('click',e=>{remember();if(isIOS){const box=backdrop.querySelector('#vzAppIOS');box.hidden=!box.hidden;e.currentTarget.setAttribute('aria-expanded',String(!box.hidden));}});
    document.body.append(backdrop);document.body.style.overflow='hidden';document.addEventListener('keydown',keys);backdrop.querySelector('#vzAppClose').focus({preventScroll:true});
  }
  function insert(){
    const header=document.querySelector('header.header');
    if(header&&!document.getElementById('vzAppTop')){const b=document.createElement('button');b.id='vzAppTop';b.type='button';b.innerHTML='✦ Leve a Valenza com você <span>'+(isIOS?'Instalar no iPhone':'Baixar aplicativo')+' ↗</span>';b.addEventListener('click',open);header.before(b);}
    for(const parent of [document.querySelector('#accountBody'),document.querySelector('#clientCenter .ccSide')]){
      if(!parent||parent.querySelector('[data-valenza-install]'))continue;
      const a=document.createElement('button');a.type='button';a.dataset.valenzaInstall='1';a.textContent='✦ Conheça o app Valenza';a.addEventListener('click',open);
      a.style.cssText='display:block;width:100%;margin:16px 0;padding:14px;border:1px solid #b99655;border-radius:12px;color:#5b2038;background:#fbf7f0;text-align:center;font:500 14px/1.5 sans-serif;cursor:pointer';parent.append(a);
    }
  }
  new MutationObserver(insert).observe(document.body,{childList:true,subtree:true});insert();
  if(/^\/(?:catalogo\/?)?$/.test(location.pathname)&&!dismissed())setTimeout(()=>{
    if(document.visibilityState!=='visible'||dismissed())return;
    const busy=[...document.querySelectorAll('[aria-modal="true"],#cart.open,#clientCenter')].some(el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).display!=='none');
    if(!busy)open();
  },1400);
})();`;
