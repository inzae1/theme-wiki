'use strict';
(()=>{
  const build='20261021-r64';
  let checking=false,reloading=false;
  async function check(){
    if(checking||reloading||document.hidden||build.startsWith('__'))return;
    checking=true;
    try{
      const response=await fetch('rpg-release.json?t='+Date.now(),{cache:'no-store'});
      if(!response.ok)return;
      const release=await response.json();
      if(!release||typeof release.build!=='string'||!/^[a-zA-Z0-9._-]{1,100}$/.test(release.build)||release.build===build)return;
      const event=new CustomEvent('rpg:before-update',{cancelable:true});
      if(!window.dispatchEvent(event))return;
      reloading=true;
      const notice=document.createElement('div');
      notice.textContent='업데이트 완료 · 새 버전으로 이동합니다';
      notice.setAttribute('role','status');
      notice.style.cssText='position:fixed;inset:16px 12px auto;z-index:99999;background:#182d23;color:#fff;padding:14px;border:1px solid #b8d991;border-radius:12px;text-align:center;font:14px sans-serif';
      document.body.append(notice);
      setTimeout(()=>{const url=new URL(location.href);url.searchParams.set('release',release.build);location.replace(url.href);},1200);
    }catch(error){/* Offline and incomplete deployments keep the current game running. */}
    finally{checking=false;}
  }
  setInterval(check,30000);
  window.addEventListener('online',check);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
  check();
})();
