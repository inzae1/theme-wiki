'use strict';(function(root){
// Called only by an explicit continue action (or its OAuth return), never by a heartbeat.
async function resume(account,lease,auto){const owner=account?.user?.id;if(!owner)throw Error('구글 계정으로 로그인해 주세요.');if(lease.active&&auto.owner===owner&&!auto.blocked)return{active:true,hasCloud:true,reused:true};auto.stop();if(!await lease.claim(owner,true))return{active:false,hasCloud:false,reused:false};await account.refresh();const hasCloud=!!account.remote;if(hasCloud)await account.download();return{active:true,hasCloud,reused:false};}
if(typeof module!=='undefined')module.exports=resume;root.RPG_GOOGLE_CONTINUE=resume;
})(typeof window!=='undefined'?window:globalThis);
