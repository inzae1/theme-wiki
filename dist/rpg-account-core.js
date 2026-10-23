'use strict';
(function(root){class CloudAccount{
 constructor(client,hooks={}){this.client=client;this.hooks=hooks;this.user=null;this.remote=null;this.busy=false;this.generation=0;}
 async init(){const {data,error}=await this.client.auth.getSession();if(error)throw error;await this.session(data.session);this.client.auth.onAuthStateChange((_event,session)=>{queueMicrotask(()=>this.session(session).catch(e=>this.hooks.error?.(e)));});}
 async session(session){const user=session?.user||null;if(user?.id===this.user?.id)return;this.generation++;this.user=user;this.remote=null;this.hooks.change?.();if(user)await this.refresh();}
 async refresh(){if(!this.user)return null;const id=this.user.id,generation=this.generation;const {data,error}=await this.client.from('rpg_cloud_saves').select('payload,revision,updated_at').eq('user_id',id).maybeSingle();if(error)throw error;if(generation!==this.generation)throw Error('계정이 변경됐어요. 다시 확인해 주세요.');this.remote=data;this.hooks.change?.();return data;}
 async upload(payload){if(this.hooks.canUpload&&!this.hooks.canUpload())throw Error('클라우드 원정대를 먼저 불러와 주세요. 게스트 진행으로 기존 계정을 덮어쓸 수 없어요.');if(!this.user)throw Error('먼저 구글로 로그인해 주세요.');if(this.busy)throw Error('저장 작업을 처리하고 있어요.');this.busy=true;const generation=this.generation;try{this.hooks.validate(payload);const revision=this.remote?.revision||0;const {data,error}=await this.client.rpc('rpg_save_progress',{p_revision:revision,p_payload:payload});if(generation!==this.generation)throw Error('계정이 변경되어 저장 확인을 중단했어요.');if(error){if(error.code==='40001'||String(error.message).includes('SAVE_CONFLICT')){const conflict=Object.assign(Error('다른 기기의 저장이 바뀌었어요. 두 저장을 다시 비교한 뒤 선택해 주세요.'),{code:'SAVE_CONFLICT'});try{await this.refresh();}catch(refreshError){conflict.cause=refreshError;}throw conflict;}throw error;}await this.refresh();return data;}finally{this.busy=false;}}
 async download(){if(!this.user)throw Error('먼저 구글로 로그인해 주세요.');const generation=this.generation;const remote=await this.refresh();if(!remote)throw Error('클라우드에 저장된 원정대가 없어요.');this.hooks.validate(remote.payload);if(generation!==this.generation)throw Error('계정이 바뀌었어요.');await this.hooks.apply(remote.payload);return remote;}
 async login(redirectTo){this.hooks.checkpoint?.();const {error}=await this.client.auth.signInWithOAuth({provider:'google',options:{redirectTo,scopes:'openid email profile',queryParams:{prompt:'select_account'}}});if(error)throw error;}
 async logout(){const {error}=await this.client.auth.signOut({scope:'local'});if(error)throw error;await this.session(null);}
}
// Autosave is armed only after the player selects a cloud save or explicitly links local progress.
class AutoSave{
 constructor(account,hooks={}){this.account=account;this.hooks=hooks;this.owner=null;this.running=false;this.blocked=false;}
 enable(){this.owner=this.account.user?.id||null;this.blocked=false;}
 stop(){this.owner=null;}
 async flush(){if(!this.owner||this.owner!==this.account.user?.id||this.running||this.blocked||this.account.busy)return false;this.running=true;try{await this.account.upload(this.hooks.snapshot());this.hooks.saved?.();return true;}catch(e){if(e.code==='SAVE_CONFLICT')this.blocked=true;this.hooks.error?.(e);return false;}finally{this.running=false;}}
}
CloudAccount.AutoSave=AutoSave;
if(typeof module!=='undefined')module.exports=CloudAccount;root.RPG_CLOUD_ACCOUNT=CloudAccount;})(typeof window!=='undefined'?window:globalThis);

(function(root){class PlaySession{
 constructor(client,hooks={}){this.client=client;this.hooks=hooks;this.token=hooks.token||root.crypto.randomUUID();this.active=false;this.reason=null;this.offlineSeconds=0;this.owner=null;this.generation=0;this.pending=null;}
 async claim(owner,force=false){const generation=++this.generation;this.owner=owner;const {data,error}=await this.client.rpc('rpg_play_session',{p_action:'claim',p_token:this.token,p_force:force});if(generation!==this.generation)return false;if(error){this.block('NETWORK');throw error;}if(!data?.active){this.block(data?.reason||'SESSION_LOST');return false;}this.active=true;this.reason=null;this.offlineSeconds=Math.min(28800,Math.max(0,Number(data.offlineSeconds)||0));this.hooks.active?.();return true;}
 block(reason='SESSION_LOST'){this.active=false;this.reason=reason;this.hooks.blocked?.(reason);}
 consumeOffline(){const seconds=this.offlineSeconds;this.offlineSeconds=0;return seconds;}
 async beat(){if(!this.active||this.pending)return false;const generation=this.generation;this.pending=this.client.rpc('rpg_play_session',{p_action:'beat',p_token:this.token,p_force:false});try{const {data,error}=await this.pending;if(generation!==this.generation)return false;if(error||!data?.active){this.block(error?'NETWORK':data?.reason||'SESSION_LOST');return false;}return true;}catch{if(generation===this.generation)this.block('NETWORK');return false;}finally{this.pending=null;}}
 async release(){this.generation++;this.active=false;this.owner=null;this.offlineSeconds=0;try{await this.client.rpc('rpg_play_session',{p_action:'release',p_token:this.token,p_force:false});}catch{} }
}
root.RPG_CLOUD_ACCOUNT.PlaySession=PlaySession;if(typeof module!=='undefined')module.exports.PlaySession=PlaySession;
})(typeof window!=='undefined'?window:globalThis);
