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
let X=null,era=null,me=null,others={},npcs=[],hunt=null,lastSend=0,sent={x:1e9,z:1e9,r:9},labels=null,hooks={},alive=false;
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
  off(){if(this._off)this._off();this._off=null;if(this.mine)this.mine.remove().catch(()=>{});if(this.mineR)this.mineR.remove().catch(()=>{});this.mine=this.mineR=this.ref=this.ring=null;}};
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
/* ---------- life cycle ---------- */
function enter(e,opt){leave();X=World.ext();if(!X.scene)return;era=e;me={cid:opt.cid,seat:opt.seat||0};hooks=opt||{};alive=true;
  labels=document.createElement('div');labels.className='tb-labels';X.host.appendChild(labels);
  if(X.HUNTAT[e])hunt=huntBuild(X.HUNTAT[e]);
  const live=opt.sid?NET.on(opt.sid,opt.cid,e,onPos,r=>{if(hunt)hunt.ring=r;}):false;
  let prev=0;X.upd.push((dt0,ts)=>{if(!alive)return;const pn=performance.now(),dt=prev?Math.min(.25,(pn-prev)/1000):dt0;prev=pn;sendTick();palTick(dt,ts);if(hunt){huntTick(dt,ts);npcTick(dt,ts);}});
  return {live};}
function leave(){alive=false;NET.off();Object.keys(others).forEach(drop);others={};npcs.forEach(n=>{try{X.scene&&X.scene.remove(n.g);}catch(e){}n.el.remove();});npcs=[];
  if(hunt){hunt.marks.forEach(m=>m.el.remove());hunt.sign.remove();}hunt=null;if(labels)labels.remove();labels=null;if(hooks.status)hooks.status(null);}
/* NPC-only trial without a class (tests, and pupils playing alone) */
return {enter,leave,get hunt(){return hunt;},get others(){return others;},get npcs(){return npcs;}};
})();
