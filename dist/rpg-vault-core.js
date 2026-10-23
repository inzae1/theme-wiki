'use strict';
(function(root){
const rewards=Object.freeze([{name:'동전 주머니',chance:40,payout:250},{name:'은화 상자',chance:30,payout:500},{name:'본전 금고',chance:20,payout:1000},{name:'황금 금고',chance:8,payout:2500},{name:'고블린 왕의 금고',chance:2,payout:10000}]);
class Vault{
 constructor(api,hooks={}){this.api=api;this.hooks=hooks;this.owner=api.account.user.id;this.key='rpg-vault-pending:'+this.owner;this.store=hooks.store||root.localStorage;this.busy=false;this.preparing=false;this.unrecorded=null;}
 pending(){if(this.unrecorded)return this.unrecorded;try{const p=JSON.parse(this.store.getItem(this.key)||'null');return p&&typeof p.request==='string'&&Number.isInteger(p.hero)?p:null;}catch{return null;}}
 current(){if(this.owner!==this.api.account.user?.id||!this.api.lease?.active)throw Error('구글 계정의 접속권을 먼저 확인해 주세요.');}
 async rpc(action,p=null){this.current();const {data,error}=await this.api.client.rpc('rpg_goblin_vault',{p_action:action,p_request:p?.request||null,p_hero:p?.hero??null,p_revision:p?.revision??null});if(error)throw Object.assign(Error(error.message||'금고 서버 요청을 확인하지 못했어요.'),error);this.current();return data;}
 async view(){return this.rpc('view');}
 async adopt(data){if(!data?.save?.payload)throw Error('저장 결과를 확인하지 못했어요. 다시 확인해 주세요.');this.current();await this.api.account.hooks.apply(data.save.payload);this.current();this.api.account.remote=data.save;this.api.account.hooks.change?.();}
 async run(action,record){if(this.busy)throw Error('금고 결과를 확인하고 있어요.');this.current();if(this.api.account.busy||this.api.auto.running)throw Error('진행을 저장하고 있어요. 잠시 후 다시 눌러 주세요.');this.busy=true;this.api.account.busy=true;this.api.auto.blocked=true;try{const data=await this.rpc(action,record);await this.adopt(data);try{this.store.removeItem(this.key);}catch{}this.unrecorded=null;this.api.auto.enable();this.api.expedition?.sync().catch(()=>{});return data;}catch(e){if(['22023','PT409'].includes(e.code)){try{const data=await this.rpc('lookup',record);await this.adopt(data);this.store.removeItem(this.key);this.unrecorded=null;this.api.auto.enable();}catch{}}throw e;}finally{this.api.account.busy=false;this.busy=false;}}
 async open(hero){if(this.busy||this.preparing)throw Error('금고 결과를 확인하고 있어요.');if(this.pending())return this.recover();this.current();if(!Number.isInteger(hero)||hero<0||hero>11)throw Error('캐릭터를 선택해 주세요.');this.preparing=true;try{const deadline=Date.now()+8000;while(this.api.account.busy||this.api.auto.running){if(Date.now()>deadline)throw Error('저장 확인이 늦어지고 있어요. 잠시 후 다시 눌러 주세요.');await new Promise(resolve=>setTimeout(resolve,50));this.current();}
 if(!await this.api.auto.flush())throw Error('진행 저장을 확인한 뒤 금고를 열 수 있어요. 계정 연결을 확인해 주세요.');this.current();const record={request:this.hooks.uuid?.()||root.crypto.randomUUID(),hero,revision:this.api.account.remote.revision};this.store.setItem(this.key,JSON.stringify(record));this.unrecorded=record;return await this.run('open',record);}finally{this.preparing=false;}}
 async recover(){const pending=this.pending();if(!pending)return this.view();return this.run('lookup',pending);}
}
const api={Vault,rewards,price:1000,limit:10};root.RPG_VAULT_CORE=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
