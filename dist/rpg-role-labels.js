'use strict';(function(root){
const roles=['딜러','탱커','힐러','서포터'],descriptions={딜러:'적에게 피해를 주는 역할',탱커:'공격을 버티며 전선을 유지하는 역할',힐러:'체력을 회복하는 역할',서포터:'아군의 공격과 생존을 돕는 역할'};
// Player-facing labels describe current skills. Planned roles stay explicitly separate.
const current=[
['딜러|근접 공격,연속 공격','딜러|접근 공격,반격','딜러|대검 회전,받아내기','딜러|추격,연속 공격','탱커|피해 경감,반격','탱커|도발,피해 경감','딜러|대검 회전,자가 회복'],
['딜러|근접 공격,자가 회복','딜러|출혈,자가 회복','딜러|광역 공격,밀치기','딜러|출혈,흡혈','딜러|약점 공격,처형','딜러|축력 강타,광역 공격','탱커|피해 경감,밀치기'],
['딜러|원거리 주문,광역 공격','딜러|원소 연계,광역 공격','딜러|저주,자가 회복','딜러|원소 연계,운석','딜러|빙결,몹 묶기','서포터|적 약화,지속 피해','딜러|혈석,자가 회복'],
['탱커|받아내기,반격','탱커|성역,피해 경감','딜러|도약,관통 공격','딜러|돌격,성화','탱커|받아내기,아군 보호','딜러|도약,표식 공격','탱커|보호막,공격 강화'],
['딜러|기습,연막','딜러|추격,집중 공격','딜러|미끼,교대','딜러|잔영,추격','딜러|중독,독 전이','딜러|미끼,교대','딜러|폭탄 설치,연쇄 폭발'],
['딜러|근접 공격,자가 회복','딜러|포탑,무기 강화','딜러|시약,지속 피해','딜러|모드 전환,열기','서포터|장치 설치,아군 보호','딜러|산성 지대,지속 피해','딜러|소환 공격,진화'],
['딜러|음파 공격,자가 회복','딜러|연주 공격,자가 회복','딜러|이동 공격,공격 강화','힐러|지속 회복,아군 보호','딜러|소환 공격,몹 묶기','딜러|근접 음압,피드백','서포터|아군 강화,보조 회복'],
['딜러|연속 공격,자가 회복','딜러|기공탄,받아내기','딜러|몹 묶기,자가 회복','딜러|기공포,충전 공격','탱커|피해 경감,반격','딜러|변신,자가 보호','힐러|지속 회복,몹 묶기'],
['딜러|원거리 공격,다중 화살','딜러|정밀 조준,관통 공격','딜러|이동 사격,동료 소환','딜러|정밀 조준,약점 공격','딜러|유도 화살,표식 공격','딜러|이동 사격,회피','딜러|동료 소환,협공'],
['딜러|원거리 공격,연사','딜러|이동 사격,재장전','딜러|포격,폭발','딜러|연사,이동 사격','딜러|원소탄,표식 공격','딜러|곡사 포격,광역 공격','딜러|고정 포격,열기'],
['힐러|회복,보호막','딜러|연속 공격,자가 회복','힐러|지속 회복,성역','딜러|연속 공격,연계 타격','딜러|낙인,성화','힐러|직접 회복,아군 보호','서포터|몹 묶기,주문 차단'],
['딜러|소환 공격,협공','딜러|정령 소환,자가 보호','딜러|군단 소환,협공','딜러|정령왕 소환,자가 보호','딜러|원소 연계,몹 묶기','딜러|영혼 수확,자가 보호','딜러|사신 소환,처형']
];
const planned={
'1:5':['딜러','보스 무력화','광역 공격'],'3:3':['딜러','보스 무력화','아군 강화'],'4:6':['딜러','보스 무력화','몹 묶기'],'5:3':['딜러','보스 무력화','모드 전환'],'5:5':['딜러','몹 묶기','지속 피해'],'6:5':['딜러','보스 무력화','아군 강화'],'9:5':['딜러','보스 무력화','광역 공격'],'10:4':['딜러','보스 무력화','집중 공격'],'11:3':['서포터','아군 강화','아군 보호'],'11:5':['딜러','몹 묶기','지역 제어']};
function get(hero,cell){const row=current[hero]?.[cell];if(!row)return null;const[role,text]=row.split('|'),next=planned[hero+':'+cell];return{role,description:descriptions[role],traits:text.split(','),planned:next?{role:next[0],traits:next.slice(1)}:null};}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function html(hero,cell,options={}){const p=get(hero,cell);if(!p)return'';const role=options.role===false?'':`<strong class="role-badge" data-role="${roles.indexOf(p.role)}" title="${esc(p.description)}">${p.role}</strong>`,tags=p.traits.map(t=>`<span class="role-trait">${esc(t)}</span>`).join(''),note=options.planned&&p.planned?`<small class="role-planned">개편 예정: ${esc(p.planned.role)} · ${p.planned.traits.map(esc).join(' · ')}</small>`:'';return`<div class="role-summary" aria-label="현재 역할과 특징">${role}${tags}</div>${note}`;}
root.RPG_ROLE_LABELS={get,html,roles,descriptions};if(typeof module!=='undefined')module.exports=root.RPG_ROLE_LABELS;
})(typeof window!=='undefined'?window:globalThis);
