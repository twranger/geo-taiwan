/* 部落：classmates in the same 3D world, and a hunt that needs three people.
   - Positions go through the Realtime Database (cl_pos/{sid}/{era}/{cid}), only between tablets of the same class task
     and only in the same era. Only the seat number is shown, never a name.
   - The hunt (舊石器時代): three stones around a sambar deer. When all three are held for three seconds the deer is caught.
     Tribe members (NPCs) step in for places nobody takes, so two pupils, or one pupil alone, can still hunt.
   - Transport is behind NET so it can move to another server later without touching the game. */
window.Tribe=(function(){
'use strict';
if(!window.World||!window.THREE)return null;
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
let barn=null,mart=null,X=null,era=null,me=null,others={},npcs=[],hunt=null,lastSend=0,sent={x:1e9,z:1e9,r:9},labels=null,hooks={},alive=false;
const NPCN=['阿洛','莎莉','巴奈','達利'];
const TSV=()=>window.firebase&&firebase.database&&firebase.database.ServerValue?firebase.database.ServerValue.TIMESTAMP:Date.now();
/* ---------- network: Realtime Database ---------- */
const NET={ref:null,ring:null,caught:null,sid:null,cid:null,
  on(sid,cid,e,onPos,onRing){this.off();if(!sid||!window.firebase||!firebase.database)return false;
    const db=firebase.database();this.sid=sid;this.cid=cid;this.base='cl_pos/'+sid+'/'+e;this.hb='cl_hunt/'+sid+'/'+e;
    this.ref=db.ref(this.base);const h1=this.ref.on('value',s=>onPos(s.val()||{}),()=>{});
    this.ring=db.ref(this.hb+'/ring');const h2=this.ring.on('value',s=>onRing(s.val()||{}),()=>{});
    this.mine=db.ref(this.base+'/'+cid);try{this.mine.onDisconnect().remove();}catch(e){}
    this.mineR=db.ref(this.hb+'/ring/'+cid);try{this.mineR.onDisconnect().remove();}catch(e){}
    this._off=()=>{this.ref.off('value',h1);this.ring.off('value',h2);};return true;},
  pos(v){if(this.mine)this.mine.set(v).catch(()=>{});},
  hold(v){if(this.mineR)(v?this.mineR.set(v):this.mineR.remove()).catch(()=>{});},
  put(p,v){if(!window.firebase||!firebase.database)return;const r=firebase.database().ref(p);(v==null?r.remove():r.set(v)).catch(()=>{});},
  watch(p,fn){const r=firebase.database().ref(p),h=r.on('value',s=>fn(s.val()),()=>{});(this.extra=this.extra||[]).push(()=>r.off('value',h));},
  off(){(this.extra||[]).forEach(u=>{try{u();}catch(e){}});this.extra=[];if(this._off)this._off();this._off=null;if(this.mine)this.mine.remove().catch(()=>{});if(this.mineR)this.mineR.remove().catch(()=>{});this.mine=this.mineR=this.ref=this.ring=null;}};
/* ---------- figures ---------- */
const SK=['#8a5a3c','#9b6a48','#7a4e34','#a8774f'];
function person(kind,i){const {T,M,part}=X,g=new T.Group(),skin=M(SK[i%SK.length]),cloth=M(kind==='npc'?'#6b4b2a':['#8c6b3e','#7d6a4a','#94704a','#6f5a3a'][i%4]),hair=M('#1d1712');
  g.add(part('box',cloth,.62,.78,.36,0,1.12,0),part('box',skin,.2,.62,.2,-.42,1.12,0),part('box',skin,.2,.62,.2,.42,1.12,0));
  const lg=[part('box',skin,.22,.72,.22,-.16,.38,0),part('box',skin,.22,.72,.22,.16,.38,0)];lg.forEach(l=>g.add(l));
  g.add(part('sph',skin,.26,.28,.26,0,1.76,0),part('sph',hair,.28,.16,.28,0,1.92,-.02));
  if(kind==='npc'){const sp=new T.Group();sp.add(part('cyl',M('#6b4a2e'),.04,2.2,.04,0,0,0),part('cone',M('#9a948a'),.09,.36,.09,0,1.26,0));sp.position.set(.48,1.3,.1);sp.rotation.x=-.15;g.add(sp);}
  g.userData={legs:lg,ph:Math.random()*6};return g;}
function deer(){const {T,M,part}=X,g=new T.Group(),c=M('#8a6440'),d=M('#5c4029');
  g.add(part('box',c,.7,.7,1.7,0,1.25,0),part('box',c,.3,.7,.3,0,1.75,.8),part('box',c,.3,.3,.6,0,2.1,1.08),part('box',d,.08,.4,.08,-.12,2.5,.9),part('box',d,.08,.4,.08,.12,2.5,.9),part('box',d,.3,.06,.06,-.2,2.66,.9),part('box',d,.3,.06,.06,.2,2.66,.9));
  const lg=[[-.25,.6],[.25,.6],[-.25,-.6],[.25,-.6]].map(([x,z])=>{const l=part('box',d,.14,.95,.14,x,.47,z);g.add(l);return l;});g.add(part('box',M('#e8dcc8'),.2,.2,.1,0,1.4,-.86));g.userData={legs:lg};return g;}
function tag(txt,cls){const el=document.createElement('div');el.className='tb-tag '+(cls||'');el.textContent=txt;labels.appendChild(el);return el;}
function place(el,x,y,z,maxD){const {T,cam,host,S}=X,v=new T.Vector3(x,y,z).project(cam),d=Math.hypot(x-S.x,z-S.z);
  if(v.z<1&&v.z>-1&&d<maxD){el.style.display='block';el.style.transform=`translate(-50%,-50%) translate(${((v.x+1)/2*host.clientWidth).toFixed(1)}px,${((1-v.y)/2*host.clientHeight).toFixed(1)}px)`;}else el.style.display='none';}
/* ---------- the hunt ---------- */
const NEED=3,R0=6.5,HOLD=3,WAITH=12,WAITS=4;
function huntBuild(at){const {T,scene,Hf,M,part}=X,g=new T.Group(),[hx,hz]=at;
  const dr=deer();dr.position.set(hx,Hf(hx,hz),hz);scene.add(dr);
  const marks=[0,1,2].map(k=>{const a=k*2.094+.5,x=hx+Math.cos(a)*R0,z=hz+Math.sin(a)*R0,y=Hf(x,z);
    const st=part('ico',M('#9c968a'),.55,.35,.5,x,y+.18,z);scene.add(st);
    const ring=new T.Mesh(new T.RingGeometry(1.1,1.45,28),new T.MeshBasicMaterial({color:'#ffd23f',transparent:true,opacity:.75,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(x,y+.08,z);scene.add(ring);
    return {k,x,z,y,st,ring,el:tag('','tb-mark')};});
  const sign=tag('圍獵：水鹿','tb-sign');
  return {at,dr,marks,sign,hold:0,state:'idle',myK:-1,joinedAt:0,ring:{},caughtAt:0,dx:0};}
function huntTick(dt,ts){const H=hunt,{S,Hf}=X;if(!H)return;
  // where am I standing
  let mk=-1;H.marks.forEach(m=>{if(Math.hypot(S.x-m.x,S.z-m.z)<1.7)mk=m.k;});
  if(mk!==H.myK){H.myK=mk;if(mk>=0&&!H.joinedAt)H.joinedAt=Date.now();if(mk<0&&!Object.keys(H.ring).some(c=>c!==me.cid))H.joinedAt=0;NET.hold(mk>=0?{k:mk,s:me.seat||0,t:TSV()}:null);}
  if(mk>=0&&ts-(H.lastHold||0)>2){H.lastHold=ts;NET.hold({k:mk,s:me.seat||0,t:TSV()});}
  // who holds which stone: me, classmates (fresh entries), then tribe members for the rest once someone has waited a while
  const now=Date.now(),held={};if(mk>=0)held[mk]={who:'me',s:me.seat};
  Object.keys(H.ring).forEach(c=>{const v=H.ring[c];if(c===me.cid||!v||held[v.k])return;if(typeof v.t==='number'&&now-v.t>8000)return;held[v.k]={who:'pal',s:v.s};});
  const humans=Object.keys(held).length,waited=H.joinedAt?(now-H.joinedAt)/1000:0,wantNpc=humans>0&&H.state!=='caught'&&waited>(NET.ref?WAITH:WAITS);
  const free=H.marks.filter(m=>!held[m.k]).map(m=>m.k);
  npcs.forEach((n,i)=>{const k=wantNpc?free[i]:undefined;n.goal=k==null?null:H.marks[k];});
  while(wantNpc&&npcs.length<free.length)npcs.push(npcNew(npcs.length));
  npcs.forEach(n=>{if(n.goal&&Math.hypot(n.x-n.goal.x,n.z-n.goal.z)<.6)held[n.goal.k]={who:'npc',n:n.name};});
  const full=H.marks.every(m=>held[m.k]);
  H.marks.forEach(m=>{const h=held[m.k];m.ring.material.color.set(h?(h.who==='npc'?'#c9a26b':'#7dffb0'):'#ffd23f');m.ring.rotation.z=ts*.6;
    const t=h?(h.who==='me'?'你':h.who==='pal'?(h.s?h.s+' 號':'同學'):h.n):'站這裡';if(m.el.textContent!==t)m.el.textContent=t;place(m.el,m.x,m.y+1.6,m.z,26);});
  place(H.sign,H.at[0],Hf(H.at[0],H.at[1])+3.6,H.at[1],34);
  // the deer: grazes, startles when the circle closes
  const d=H.dr;if(H.state==='caught'){d.rotation.z=Math.min(1.45,d.rotation.z+dt*2.5);if(now-H.caughtAt>25000){H.state='idle';d.rotation.z=0;H.joinedAt=0;}}
  else{d.rotation.y+=Math.sin(ts*.4)*dt*.3;d.userData.legs.forEach((l,i)=>l.rotation.x=full?Math.sin(ts*14+i)*.5:0);}
  if(H.state!=='caught'){H.hold=full&&mk>=0?H.hold+dt:Math.max(0,H.hold-dt*2);
    const left=Math.ceil(HOLD-H.hold);const miss=NEED-Object.keys(held).length;
    hooks.status&&hooks.status(mk<0?(Math.hypot(S.x-H.at[0],S.z-H.at[1])<16?'圍獵水鹿：要 3 個人各站一顆石頭，把水鹿圍住。走到黃色圓圈上。':null):full?`圍住了！別動……${left}`:`還差 ${miss} 個人。${wantNpc?'部落的人過來幫忙了。':NET.ref?`等同學過來；${Math.max(0,Math.ceil(WAITH-waited))} 秒後部落的人會來幫忙。`:'部落的人馬上過來。'}`);
    if(H.hold>=HOLD){H.state='caught';H.caughtAt=now;H.hold=0;const team=Object.values(held).map(h=>h.who==='me'?null:h.who==='pal'?(h.s?h.s+' 號':'同學'):h.n).filter(Boolean);hooks.status&&hooks.status(null);hooks.caught&&hooks.caught(team);}}}
function npcNew(i){const {Hf}=X,[hx,hz]=hunt.at,a=Math.random()*6.28,x=hx+Math.cos(a)*16,z=hz+Math.sin(a)*16,g=person('npc',i);X.scene.add(g);
  return {name:NPCN[i%NPCN.length],g,x,z,goal:null,el:tag(NPCN[i%NPCN.length],'tb-npc')};}
function npcTick(dt,ts){const {Hf}=X;npcs.forEach(n=>{let tx=n.goal?n.goal.x:hunt.at[0]+Math.cos(ts*.1+n.g.userData.ph)*22,tz=n.goal?n.goal.z:hunt.at[1]+Math.sin(ts*.1+n.g.userData.ph)*22;
  const dx=tx-n.x,dz=tz-n.z,d=Math.hypot(dx,dz),sp=n.goal?7:1.6;if(d>.4){n.x+=dx/d*Math.min(d,sp*dt);n.z+=dz/d*Math.min(d,sp*dt);n.g.rotation.y=Math.atan2(dx,dz);walk(n.g,ts,1);}else{if(n.goal)n.g.rotation.y=Math.atan2(hunt.at[0]-n.x,hunt.at[1]-n.z);walk(n.g,ts,0);}
  n.g.position.set(n.x,Hf(n.x,n.z),n.z);place(n.el,n.x,Hf(n.x,n.z)+2.4,n.z,30);});}
function walk(g,ts,m){const L=g.userData.legs;if(!L)return;L[0].rotation.x=m?Math.sin(ts*9+g.userData.ph)*.6:0;L[1].rotation.x=-L[0].rotation.x;}
/* ---------- classmates ---------- */
function onPos(all){const now=Date.now();Object.keys(all).forEach(c=>{if(c===me.cid)return;const v=all[c];if(!v||typeof v.x!=='number')return;if(typeof v.t==='number'&&now-v.t>20000)return;
   let o=others[c];if(!o){o=others[c]={g:person('pal',Object.keys(others).length),x:v.x,z:v.z,el:tag('','tb-pal')};X.scene.add(o.g);}o.tx=v.x;o.tz=v.z;o.tr=v.r||0;o.seen=now;const t=v.s?v.s+' 號':'同學';if(o.el.textContent!==t)o.el.textContent=t;});
  Object.keys(others).forEach(c=>{if(!all[c]||(typeof all[c].t==='number'&&now-all[c].t>20000))drop(c);});hooks.count&&hooks.count(Object.keys(others).length);}
function drop(c){const o=others[c];if(!o)return;X.scene.remove(o.g);o.el.remove();delete others[c];}
function palTick(dt,ts){const {Hf}=X;Object.values(others).forEach(o=>{const k=Math.min(1,dt*6),dx=o.tx-o.x,dz=o.tz-o.z;o.x+=dx*k;o.z+=dz*k;o.g.position.set(o.x,Hf(o.x,o.z),o.z);
  if(Math.hypot(dx,dz)>.05){o.g.rotation.y=Math.atan2(dx,dz);walk(o.g,ts,1);}else{o.g.rotation.y=o.tr+Math.PI;walk(o.g,ts,0);}place(o.el,o.x,Hf(o.x,o.z)+2.4,o.z,40);});}
function sendTick(){const {S}=X,now=Date.now();if(!NET.ref)return;const moved=Math.hypot(S.x-sent.x,S.z-sent.z)>.4||Math.abs(S.yaw-sent.r)>.25;
  if((moved&&now-lastSend>300)||now-lastSend>5000){lastSend=now;sent={x:S.x,z:S.z,r:S.yaw};NET.pos({x:+S.x.toFixed(2),z:+S.z.toFixed(2),r:+S.yaw.toFixed(2),s:me.seat||0,t:TSV()});}}
/* ---------- 新石器時代：the village granary, filled together ---------- */
const BGOAL_CLASS=12,BGOAL_SOLO=5,NPC_EVERY=15000;
function barnBuild(at){const {T,scene,Hf,M,part}=X,[x,z]=at,y=Hf(x,z),g=new T.Group();
  [[-1.4,-1.1],[1.4,-1.1],[-1.4,1.1],[1.4,1.1]].forEach(([px,pz])=>g.add(part('cyl',M('#6b4a2e'),.16,1.6,.16,px,.8,pz),part('cyl',M('#cfc8b8'),.42,.08,.42,px,1.62,pz)));
  g.add(part('box',M('#8a6a44'),3.4,.18,2.8,0,1.75,0),part('box',M('#b89464'),3,1.5,2.4,0,2.6,0));const roof=part('pyr',M('#c9a24e'),2.9,1.8,2.9,0,4.2,0);roof.rotation.y=Math.PI/4;roof.scale.set(3.2,1.8,2.7);g.add(roof);
  const pile=new T.Group();for(let i=0;i<10;i++)pile.add(part('cyl',M(i%2?'#e0b43a':'#c9a640'),.16,.9,.16,rnd2(-1.2,1.2),.45,rnd2(1.6,2.4)));g.add(pile);pile.scale.y=.05;
  g.position.set(x,y,z);scene.add(g);
  return {at,g,pile,mine:0,firstAt:0,all:{},full:false,paid:false,sign:tag('穀倉','tb-sign'),local:!NET.ref};}
const rnd2=(a,b)=>a+Math.random()*(b-a);
function barnTotal(B){const now=Date.now();let n=0,first=0;Object.keys(B.all).forEach(c=>{const v=B.all[c];if(!v||typeof v.n!=='number')return;n+=Math.max(0,Math.min(40,v.n));if(typeof v.t==='number'&&(!first||v.t<first))first=v.t;});
  if(B.local){n=B.mine;first=B.firstAt;}const goal=B.local?BGOAL_SOLO:BGOAL_CLASS,npc=first?Math.max(0,Math.min(goal-1,Math.floor((now-first)/NPC_EVERY))):0;return {n,npc,goal,total:Math.min(goal,n+npc)};}
function barnTick(dt,ts){const B=barn,{S,Hf}=X;if(!B)return;const T=barnTotal(B),near=Math.hypot(S.x-B.at[0],S.z-B.at[1])<6;
  B.pile.scale.y=.05+.95*T.total/T.goal;const t=`穀倉 ${T.total}/${T.goal}`;if(B.sign.textContent!==t)B.sign.textContent=t;place(B.sign,B.at[0],Hf(B.at[0],B.at[1])+6,B.at[1],40);
  if(T.total>=T.goal&&!B.full){B.full=true;if(B.mine>0&&!B.paid){B.paid=true;hooks.barnFull&&hooks.barnFull(T);}}
  const has=(hooks.bag&&((hooks.bag().millet||0)+(hooks.bag().wmillet||0)))||0;
  if(near&&!B.full){hooks.status&&hooks.status(has?`把小米放進大家的穀倉。部落一起存到 ${T.goal} 束，冬天就不怕餓。（現在 ${T.total} 束，你放了 ${B.mine} 束）`:`穀倉還差 ${T.goal-T.total} 束。去草地採野生小米，或去田裡種小米，再拿回來放。`);
   action(has?'放 1 束小米進穀倉':null,barnPut);}
  else if(near&&B.full){hooks.status&&hooks.status(B.mine?'穀倉滿了！你也有出一份力。新石器時代的人種田、存糧食，才能在一個地方住下來。':'穀倉已經滿了。下次早一點來幫忙。');action(null);}
  else if(B.near){hooks.status&&hooks.status(null);action(null);}B.near=near;}
function barnPut(){const B=barn;if(!B||B.full)return;const bag=hooks.bag(),k=(bag.millet||0)>0?'millet':(bag.wmillet||0)>0?'wmillet':null;if(!k)return;
  hooks.add({[k]:1},-1);B.mine++;if(!B.firstAt)B.firstAt=Date.now();hooks.saved&&hooks.saved('gr',1);
  if(NET.ref)NET.put('cl_coop/'+NET.sid+'/neo/'+me.cid,{n:B.mine,s:me.seat||0,t:B.firstAt});hooks.toast&&hooks.toast(`放進 1 束${k==='millet'?'小米':'野生小米'}。`);}
/* ---------- 金屬器時代：face-to-face trading ---------- */
const NPCDEALS=[{give:'iron',get:'pot',why:'他們的陶罐做得好，可是不會煉鐵。'},{give:'hide',get:'beads',why:'外地來的玻璃珠，要用獸皮換。'},{give:'fish',get:'millet',why:'山邊的部落種小米，換你們海邊的魚。'},{give:'pot',get:'hide',why:'他們打獵，獸皮多。'}];
function martBuild(at){const {Hf}=X,[x,z]=at,g=person('npc',3);g.position.set(x,Hf(x,z),z);X.scene.add(g);
  const {T,M,part}=X,mat=part('box',M('#a07850'),2.2,.06,1.4,x+1.6,Hf(x+1.6,z)+.04,z);X.scene.add(mat);[[0,'#5aa0d8'],[.4,'#9a4f2a'],[.8,'#e0b43a']].forEach(([o,c])=>X.scene.add(part('sph',M(c),.18,.14,.18,x+1.1+o,Hf(x+1.6,z)+.14,z)));
  return {at,g,mat,el:tag('鄰村的巴奈','tb-npc'),inbox:{},wait:null,seen:{}};}
function nearestPal(){const {S}=X;let best=null,bd=4.5;Object.keys(others).forEach(c=>{const o=others[c],d=Math.hypot(o.x-S.x,o.z-S.z);if(d<bd){bd=d;best=c;}});return best;}
function martTick(dt,ts){const M=mart,{S,Hf}=X;if(!M)return;place(M.el,M.at[0],Hf(M.at[0],M.at[1])+2.4,M.at[1],40);M.g.rotation.y=Math.atan2(S.x-M.at[0],S.z-M.at[1]);
  if(modal)return;const nearNpc=Math.hypot(S.x-M.at[0],S.z-M.at[1])<4,pal=nearestPal();
  if(M.wait){hooks.status&&hooks.status(`等 ${M.wait.s?M.wait.s+' 號':'同學'}回應……`);action('不換了',()=>{M.wait=null;NET.put(tradePath(M.waitCid,me.cid),null);});return;}
  if(pal){const o=others[pal];hooks.status&&hooks.status(`${o.el.textContent}就在旁邊。金屬器時代的人會拿自己有的東西，和別人交換需要的東西。`);action(`和 ${o.el.textContent} 交換東西`,()=>offerTo(pal));}
  else if(nearNpc){hooks.status&&hooks.status('鄰村的巴奈帶了東西來交換。');action('看巴奈想換什麼',npcDeal);}
  else if(M.was){hooks.status&&hooks.status(null);action(null);}M.was=!!(pal||nearNpc);}
const tradePath=(to,from)=>'cl_trade/'+NET.sid+'/'+to+'/'+from;
const itemsOf=()=>{const b=hooks.bag?hooks.bag():{};return Object.keys(b).filter(k=>b[k]>0&&k!=='method'&&hooks.name&&hooks.name(k));};
function offerTo(c){const o=others[c],list=itemsOf();if(!list.length){hooks.toast&&hooks.toast('背包是空的，先去撿一些東西再來交換。');return;}
  pick(`要拿什麼給 ${o.el.textContent}？`,'他會再選一樣東西給你。',list,k=>{if(!k)return;mart.wait={g:k,s:+String(o.el.textContent).replace(/\D/g,'')||0,t:Date.now()};mart.waitCid=c;
   NET.put(tradePath(c,me.cid),{k:'offer',g:k,s:me.seat||0,t:TSV()});});}
function onInbox(all){const M=mart;if(!M)return;const now=Date.now();Object.keys(all||{}).forEach(from=>{const v=all[from];if(!v||M.seen[from+':'+v.t])return;if(typeof v.t==='number'&&now-v.t>90000)return;M.seen[from+':'+v.t]=1;
  const who=v.s?v.s+' 號':'同學';
  if(v.k==='offer'){const list=itemsOf();pick(`${who}想給你「${hooks.name(v.g)}」`,'你要拿什麼跟他換？',list,k=>{NET.put(tradePath(me.cid,from),null);
     if(!k){NET.put(tradePath(from,me.cid),{k:'no',s:me.seat||0,t:TSV()});return;}
     hooks.add({[k]:1},-1);hooks.add({[v.g]:1},1);hooks.saved&&hooks.saved('tr',1);NET.put(tradePath(from,me.cid),{k:'reply',g:k,f:v.g,s:me.seat||0,t:TSV()});
     hooks.toast&&hooks.toast(`換好了：你給 ${who}「${hooks.name(k)}」，拿到「${hooks.name(v.g)}」。`);},'這次不換');}
  else if(v.k==='reply'&&M.wait&&M.wait.g===v.f){hooks.add({[v.f]:1},-1);hooks.add({[v.g]:1},1);hooks.saved&&hooks.saved('tr',1);M.wait=null;NET.put(tradePath(me.cid,from),null);
     hooks.toast&&hooks.toast(`換好了：你給 ${who}「${hooks.name(v.f)}」，拿到「${hooks.name(v.g)}」。`);}
  else if(v.k==='no'&&M.wait){M.wait=null;NET.put(tradePath(me.cid,from),null);hooks.toast&&hooks.toast(`${who}這次不想換。換別的東西試試看。`);}});}
function npcDeal(){const b=hooks.bag(),rows=NPCDEALS.map(d=>({d,ok:(b[d.give]||0)>0}));
  modalOpen(`<h3>鄰村的巴奈</h3><p>「我帶了東西來，你有什麼可以換？」</p>${rows.map((r,i)=>`<button class="tb-deal" data-i="${i}" ${r.ok?'':'disabled'}><b>給 1 ${hooks.name(r.d.give)} → 換 1 ${hooks.name(r.d.get)}</b><small>${r.ok?r.d.why:'你沒有'+hooks.name(r.d.give)}</small></button>`).join('')}<div class="tb-row"><button class="tb-btn alt" data-x>先不要</button></div>`,
   el=>{el.querySelectorAll('.tb-deal').forEach(btn=>btn.onclick=()=>{const d=NPCDEALS[+btn.dataset.i];hooks.add({[d.give]:1},-1);hooks.add({[d.get]:1},1);hooks.saved&&hooks.saved('nt',1);modalClose();hooks.toast&&hooks.toast(`和巴奈換好了：拿到「${hooks.name(d.get)}」。`);});});}
/* ---------- small in-world dialogs and the action button ---------- */
let modal=null,act=null;
function action(label,fn){if(!hooks.action)return;if(!label){if(act){act=null;hooks.action(null);}return;}if(!act||act.label!==label){act={label,fn};hooks.action(label,()=>act&&act.fn());}else act.fn=fn;}
function modalOpen(html,bind){modalClose();modal=document.createElement('div');modal.className='tb-modal';modal.setAttribute('role','dialog');modal.innerHTML=`<div class="tb-box">${html}</div>`;X.host.appendChild(modal);
  modal.querySelectorAll('[data-x]').forEach(b=>b.onclick=modalClose);bind&&bind(modal);const f=modal.querySelector('button:not([disabled])');f&&f.focus();X.S.keys={};}
function modalClose(){if(modal){modal.remove();modal=null;}}
function pick(title,sub,list,done,noLabel){modalOpen(`<h3>${title}</h3><p>${sub}</p><div class="tb-items">${list.map(k=>`<button class="tb-item" data-k="${k}">${hooks.name(k)}<small>有 ${hooks.bag()[k]}</small></button>`).join('')||'<p>背包是空的。</p>'}</div><div class="tb-row"><button class="tb-btn alt" data-no>${noLabel||'不要了'}</button></div>`,
  el=>{el.querySelectorAll('.tb-item').forEach(b=>b.onclick=()=>{modalClose();done(b.dataset.k);});el.querySelector('[data-no]').onclick=()=>{modalClose();done(null);};});}
/* ---------- life cycle ---------- */
function enter(e,opt){leave();X=World.ext();if(!X.scene)return;era=e;me={cid:opt.cid,seat:opt.seat||0};hooks=opt||{};alive=true;
  labels=document.createElement('div');labels.className='tb-labels';X.host.appendChild(labels);
  const live=opt.sid?NET.on(opt.sid,opt.cid,e,onPos,r=>{if(hunt)hunt.ring=r;}):false;
  if(e==='old'&&X.HUNTAT.old)hunt=huntBuild(X.HUNTAT.old);
  if(e==='neo'&&X.HUNTAT.neo){barn=barnBuild(X.HUNTAT.neo);barn.mine=hooks.given?hooks.given('gr'):0;if(live)NET.watch('cl_coop/'+opt.sid+'/neo',v=>{if(barn){barn.all=v||{};const m=barn.all[me.cid];if(m&&m.n>barn.mine)barn.mine=m.n;if(m&&m.t)barn.firstAt=m.t;}});}
  if(e==='iron'&&X.HUNTAT.iron){mart=martBuild(X.HUNTAT.iron);if(live)NET.watch('cl_trade/'+opt.sid+'/'+opt.cid,onInbox);}
  let prev=0;X.upd.push((dt0,ts)=>{if(!alive)return;const pn=performance.now(),dt=prev?Math.min(.25,(pn-prev)/1000):dt0;prev=pn;sendTick();palTick(dt,ts);if(hunt){huntTick(dt,ts);npcTick(dt,ts);}if(barn)barnTick(dt,ts);if(mart)martTick(dt,ts);});
  return {live};}
function leave(){alive=false;NET.off();modalClose();action(null);Object.keys(others).forEach(drop);others={};npcs.forEach(n=>{try{X.scene&&X.scene.remove(n.g);}catch(e){}n.el.remove();});npcs=[];
  if(hunt){hunt.marks.forEach(m=>m.el.remove());hunt.sign.remove();}hunt=null;if(barn)barn.sign.remove();barn=null;if(mart)mart.el.remove();mart=null;
  if(labels)labels.remove();labels=null;if(hooks.status)hooks.status(null);}
return {enter,leave,get hunt(){return hunt;},get barn(){return barn;},get mart(){return mart;},get others(){return others;},get npcs(){return npcs;},_inbox:a=>onInbox(a)};
})();
