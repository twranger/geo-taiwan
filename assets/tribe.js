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
const NPCN=['部落的獵人'];
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
function spear(){const {T,M,part}=X,g=new T.Group(),sh=part('cyl',M('#7a5230'),.035,1.9,.035,0,0,0);sh.rotation.x=Math.PI/2;g.add(sh);
  const tip=part('cone',M('#8d877b'),.09,.32,.06,0,0,1.08);tip.rotation.x=Math.PI/2;g.add(tip,part('cyl',M('#3b2a1a'),.05,.14,.05,0,0,.86));const b=g.children[2];b.rotation.x=Math.PI/2;return g;}
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
  const armed=!hooks.armed||hooks.armed();if(mk>=0&&!armed&&H.state!=='throw'){if(H.myK>=0){H.myK=-1;NET.hold(null);}hooks.status&&hooks.status('空手抓不到水鹿。先到「找食物」用石器和樹枝綁一支長矛，學會了再來圍獵。');return;}
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
    const t=h?(h.who==='me'?'你':''):'站這裡';if(m.el.textContent!==t)m.el.textContent=t;if(t)place(m.el,m.x,m.y+1.6,m.z,26);else m.el.style.display='none';});
  place(H.sign,H.at[0],Hf(H.at[0],H.at[1])+3.6,H.at[1],34);
  // the deer: grazes, startles when the circle closes
  const d=H.dr;if(H.state==='caught'){d.rotation.z=Math.min(1.45,d.rotation.z+dt*2.5);if(now-H.caughtAt>25000){H.state='idle';d.rotation.z=0;H.joinedAt=0;}}
  else if(H.state!=='throw'){d.rotation.y+=Math.sin(ts*.4)*dt*.3;d.userData.legs.forEach((l,i)=>l.rotation.x=full?Math.sin(ts*14+i)*.5:0);}
  if(H.state==='throw'){H.tt+=dt;const at=(f,k)=>[f.a.x+(f.b.x-f.a.x)*k,f.a.y+(f.b.y-f.a.y)*k+Math.sin(k*Math.PI)*1.4,f.a.z+(f.b.z-f.a.z)*k];
    H.fly.forEach(f=>{if(H.tt<f.d){f.m.visible=false;return;}f.m.visible=true;const k=Math.min(1,(H.tt-f.d)/.8);
     if(f.hit)return;const p=at(f,k),q=at(f,Math.min(1.04,k+.04));if(k>=1){q[0]=p[0]+(f.b.x-f.a.x)*.05;q[1]=p[1]-.12;q[2]=p[2]+(f.b.z-f.a.z)*.05;}
     const dx=q[0]-p[0],dy2=q[1]-p[1],dz=q[2]-p[2],L=Math.hypot(dx,dy2,dz)||1;f.m.position.set(p[0]-dx/L*.95,p[1]-dy2/L*.95,p[2]-dz/L*.95);f.m.lookAt(q[0]-dx/L*.95,q[1]-dy2/L*.95,q[2]-dz/L*.95);if(k>=1){f.hit=1;H.dr.attach(f.m);hooks.hit&&hooks.hit();}});
    if(H.fly.every(f=>f.hit))H.dr.rotation.z=Math.min(1.45,H.dr.rotation.z+dt*2.2);
    if(H.fly.every(f=>f.hit)&&H.tt>(H.fly.length-1)*.45+.8+1){H.state='caught';H.caughtAt=now;hooks.status&&hooks.status(null);hooks.caught&&hooks.caught(H.team);}return;}
  if(H.state==='caught'&&H.fly&&now-H.caughtAt>20000){H.fly.forEach(f=>{if(f.m.parent)f.m.parent.remove(f.m);});H.fly=null;}
  if(H.state!=='caught'){H.hold=full&&mk>=0?H.hold+dt:Math.max(0,H.hold-dt*2);
    const left=Math.ceil(HOLD-H.hold);const miss=NEED-Object.keys(held).length;
    hooks.status&&hooks.status(mk<0?(Math.hypot(S.x-H.at[0],S.z-H.at[1])<16?'圍獵水鹿：要 3 個人各站一顆石頭，把水鹿圍住。走到黃色圓圈上。':null):full?`圍住了！別動……${left}`:`還差 ${miss} 個人。${wantNpc?'部落的人過來幫忙了。':NET.ref?`等同學過來；${Math.max(0,Math.ceil(WAITH-waited))} 秒後部落的人會來幫忙。`:'部落的人馬上過來。'}`);
    if(H.hold>=HOLD){H.state='throw';H.tt=0;H.hold=0;H.team=[...new Set(Object.values(held).map(h=>h.who==='me'?null:h.who==='pal'?(h.s?h.s+' 號':'同學'):h.n).filter(Boolean))];
      const dy=Hf(H.at[0],H.at[1]);H.fly=H.marks.map((m,i)=>{const sp=spear();X.scene.add(sp);sp.visible=false;const a=held[m.k]&&held[m.k].who==='me'?{x:S.x,z:S.z,y:Hf(S.x,S.z)+1.5}:{x:m.x,z:m.z,y:m.y+1.6};
        const ang=Math.atan2(a.z-H.at[1],a.x-H.at[0]);return {m:sp,d:i*.45,a,b:{x:H.at[0]+Math.cos(ang)*.2,z:H.at[1]+Math.sin(ang)*.2,y:dy+1.3}};});
      hooks.status&&hooks.status('丟出長矛！');hooks.throw&&hooks.throw();}}}
function npcNew(i){const {Hf}=X,[hx,hz]=hunt.at,a=Math.random()*6.28,x=hx+Math.cos(a)*16,z=hz+Math.sin(a)*16,g=person('npc',i),sp=spear();sp.rotation.x=-1.25;sp.position.set(.32,1.05,0);g.add(sp);X.scene.add(g);
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
  return {at,g,pile,mine:0,firstAt:0,all:{},full:false,paid:false,sign:tag('穀倉','tb-sign'),local:!NET.ref&&!hooks.demo};}
const rnd2=(a,b)=>a+Math.random()*(b-a);
function barnTotal(B){const now=Date.now();let n=0,first=0;Object.keys(B.all).forEach(c=>{const v=B.all[c];if(!v||typeof v.n!=='number')return;n+=Math.max(0,Math.min(40,v.n));if(typeof v.t==='number'&&(!first||v.t<first))first=v.t;});
  if(B.local){n=B.mine;first=B.firstAt;}const goal=B.local?BGOAL_SOLO:BGOAL_CLASS,npc=first?Math.max(0,Math.min(Math.floor(goal/2),Math.floor((now-first)/NPC_EVERY))):0;return {n,npc,goal,total:Math.min(goal,n+npc)};}
function barnTick(dt,ts){const B=barn,{S,Hf}=X;if(!B)return;const T=barnTotal(B),near=Math.hypot(S.x-B.at[0],S.z-B.at[1])<6;
  B.pile.scale.y=.05+.95*T.total/T.goal;const t=`穀倉 ${T.total}/${T.goal}`;if(B.sign.textContent!==t)B.sign.textContent=t;place(B.sign,B.at[0],Hf(B.at[0],B.at[1])+6,B.at[1],40);
  if(T.total>=T.goal&&!B.full){B.full=true;if(B.mine>0&&!B.paid){B.paid=true;hooks.barnFull&&hooks.barnFull(T);}}
  const has=(hooks.bag&&(hooks.bag().millet||0))||0,seed=(hooks.bag&&(hooks.bag().wmillet||0))||0;
  if(near&&!B.full){hooks.status&&hooks.status(has?`把小米放進大家的穀倉。部落一起存到 ${T.goal} 束，收成不好的時候也有得吃。（現在 ${T.total} 束，你放了 ${B.mine} 束）`:seed?'種子要留著種，不能放進穀倉。先到「種小米」把它種出來，收成的小米再拿來放。':`穀倉還差 ${T.goal-T.total} 束。到「種小米」那裡種小米，收成了再拿回來放。`);
   action(has?'放 1 束小米進穀倉':null,barnPut);}
  else if(near&&B.full){hooks.status&&hooks.status(B.mine?'穀倉滿了！你也有出一份力。新石器時代的人種田、存糧食，才能在一個地方住下來。':'穀倉已經滿了，這次是其他人存的。');action(null);}
  else if(B.near){hooks.status&&hooks.status(null);action(null);}B.near=near;}
function barnPut(){const B=barn;if(!B||B.full)return;const bag=hooks.bag(),k=(bag.millet||0)>0?'millet':null;if(!k)return;
  hooks.add({[k]:1},-1);B.mine++;if(!B.firstAt)B.firstAt=Date.now();hooks.saved&&hooks.saved('gr',1);
  if(hooks.demo)B.all[me.cid]={n:B.mine,s:0,t:B.firstAt};
  if(NET.ref)NET.put('cl_coop/'+NET.sid+'/neo/'+me.cid,{n:B.mine,s:me.seat||0,t:B.firstAt});hooks.toast&&hooks.toast('放進 1 束小米。');}
/* ---------- 金屬器時代：face-to-face trading ---------- */
/* what things are worth: 0 = lying around, nobody trades for it; trades only go through at the same worth */
const VAL={stone:0,branch:0,grass:0,shell:0,clay:0,ironsand:0,whet:0,greenware:0,
  fish:1,wmillet:1,millet:1,meat:1,charcoal:1,
  hide:2,pot:2,chopper:2,adze:2,iron:2,
  beads:3,jade:3,ironaxe:3};
const WORTH=['路邊就撿得到','普通','要花功夫做','很珍貴'];
const val=k=>VAL[k]==null?1:VAL[k];
const NPCDEALS=[{give:'pot',get:'beads',why:'她說海的那一邊不太會燒這種陶罐。'},{give:'hide',get:'beads',why:'她說她們那裡很少鹿，獸皮很搶手。'},{give:'iron',get:'beads',why:'鐵很有用，她也願意換。'}];
function martBuild(at){const {Hf}=X;let [x,z]=at,wx=null,wz=null;
  /* the trader came by boat: find the nearest water, beach the canoe there and stand her on the shore next to it */
  for(let r=4;r<=40&&wx==null;r+=2)for(let i=0;i<24;i++){const a=i/24*6.28,px=at[0]+Math.cos(a)*r,pz=at[1]+Math.sin(a)*r;if(Hf(px,pz)<.05){wx=px;wz=pz;break;}}
  if(wx!=null){const a=Math.atan2(wz-at[1],wx-at[0]);let bx=wx,bz=wz;for(let k=0;k<12&&Hf(bx,bz)<.25;k++){bx-=Math.cos(a)*.8;bz-=Math.sin(a)*.8;}x=bx-Math.cos(a)*1.6;z=bz-Math.sin(a)*1.6;wx=bx+Math.cos(a)*.6;wz=bz+Math.sin(a)*.6;}
  const g=person('npc',2);g.position.set(x,Hf(x,z),z);X.scene.add(g);
  {const {T,M,part}=X,bt=new T.Group(),hull=part('sph',M('#6b4423'),1,1,1,0,0,0);hull.scale.set(.75,.38,2.9);bt.add(hull,part('box',M('#4a2f18'),1.1,.08,.12,0,.32,.7),part('box',M('#4a2f18'),1.1,.08,.12,0,.32,-.8));
   const oar=part('box',M('#8a6440'),.08,.06,2.4,.7,.42,0);oar.rotation.y=.3;bt.add(oar);const bx=wx==null?x+2.4:wx,bz=wz==null?z:wz;bt.position.set(bx,Math.max(0,Hf(bx,bz))+.12,bz);bt.rotation.y=Math.atan2(bx-x,bz-z);X.scene.add(bt);}
  const {T,M,part}=X,mat=part('box',M('#a07850'),2.2,.06,1.4,x+1.6,Hf(x+1.6,z)+.04,z);X.scene.add(mat);[[0,'#5aa0d8'],[.4,'#9a4f2a'],[.8,'#e0b43a']].forEach(([o,c])=>X.scene.add(part('sph',M(c),.18,.14,.18,x+1.1+o,Hf(x+1.6,z)+.14,z)));
  return {at:[x,z],g,mat,el:tag('坐船來的外地人','tb-npc'),inbox:{},wait:null,seen:{}};}
function nearestPal(){const {S}=X;let best=null,bd=4.5;Object.keys(others).forEach(c=>{const o=others[c],d=Math.hypot(o.x-S.x,o.z-S.z);if(d<bd){bd=d;best=c;}});return best;}
function martTick(dt,ts){const M=mart,{S,Hf}=X;if(!M)return;place(M.el,M.at[0],Hf(M.at[0],M.at[1])+2.4,M.at[1],40);M.g.rotation.y=Math.atan2(S.x-M.at[0],S.z-M.at[1]);
  if(modal)return;const nearNpc=Math.hypot(S.x-M.at[0],S.z-M.at[1])<4,pal=nearestPal();
  if(M.wait){hooks.status&&hooks.status(`等 ${M.wait.s?M.wait.s+' 號':'同學'}回應……`);action('不換了',()=>{M.wait=null;if(!(others[M.waitCid]&&others[M.waitCid].bot))NET.put(tradePath(M.waitCid,me.cid),null);});return;}
  if(pal){const o=others[pal];hooks.status&&hooks.status(`${o.el.textContent}就在旁邊，可以拿差不多值錢的東西跟他換。`);action(`和 ${o.el.textContent} 交換東西`,()=>offerTo(pal));}
  else if(nearNpc){hooks.status&&hooks.status('有人划船渡海過來，帶了玻璃珠和瑪瑙珠，想換我們這裡的東西。');action('看她想換什麼',npcDeal);}
  else if(M.was){hooks.status&&hooks.status(null);action(null);}M.was=!!(pal||nearNpc);}
const tradePath=(to,from)=>'cl_trade/'+NET.sid+'/'+to+'/'+from;
const itemsOf=()=>{const b=hooks.bag?hooks.bag():{};return Object.keys(b).filter(k=>b[k]>0&&k!=='method'&&k!=='slag'&&hooks.name&&hooks.name(k));};
const goodsOf=()=>itemsOf().filter(k=>val(k)>0);
function offerTo(c){const o=others[c],list=goodsOf();if(!list.length){hooks.toast&&hooks.toast('你只有路邊就撿得到的東西，沒有人會想換。先做出陶罐、抓到魚，或找到獸皮再來。');return;}
  pick(`要拿什麼給 ${o.el.textContent}？`,'他會拿一樣差不多值錢的東西跟你換。石頭、樹枝這種到處都撿得到的，沒人要換。',list,k=>{if(!k)return;mart.wait={g:k,s:+String(o.el.textContent).replace(/\D/g,'')||0,t:Date.now()};mart.waitCid=c;
   if(others[c]&&others[c].bot){botReply(c,k);return;}NET.put(tradePath(c,me.cid),{k:'offer',g:k,s:me.seat||0,t:TSV()});});}
function onInbox(all){const M=mart;if(!M)return;const now=Date.now();Object.keys(all||{}).forEach(from=>{const v=all[from];if(!v||M.seen[from+':'+v.t])return;if(typeof v.t==='number'&&now-v.t>90000)return;M.seen[from+':'+v.t]=1;
  const who=v.s?v.s+' 號':'同學';
  const bot=others[from]&&others[from].bot,put=(p,x)=>{if(!bot)NET.put(p,x);};
  if(v.k==='offer'){const list=goodsOf(),w=val(v.g);pick(`${who}想給你「${hooks.name(v.g)}」`,`這是「${WORTH[w]}」的東西。要拿一樣差不多值錢的跟他換，太便宜的他不會要。`,list,k=>{put(tradePath(me.cid,from),null);
     if(!k){put(tradePath(from,me.cid),{k:'no',s:me.seat||0,t:TSV()});return;}
     hooks.add({[k]:1},-1);hooks.add({[v.g]:1},1);hooks.saved&&hooks.saved('tr',1);put(tradePath(from,me.cid),{k:'reply',g:k,f:v.g,s:me.seat||0,t:TSV()});
     hooks.toast&&hooks.toast(`換好了：你給 ${who}「${hooks.name(k)}」，拿到「${hooks.name(v.g)}」。`);},'這次不換',k=>val(k)===w?'':val(k)<w?'太便宜，他不換':'太貴了，你會吃虧');}
  else if(v.k==='reply'&&M.wait&&M.wait.g===v.f&&!((hooks.bag()[v.f]||0)>0)){M.wait=null;put(tradePath(me.cid,from),null);hooks.toast&&hooks.toast(`你身上已經沒有「${hooks.name(v.f)}」了，這次沒換成。`);}
  else if(v.k==='reply'&&M.wait&&M.wait.g===v.f){hooks.add({[v.f]:1},-1);hooks.add({[v.g]:1},1);hooks.saved&&hooks.saved('tr',1);M.wait=null;put(tradePath(me.cid,from),null);
     hooks.toast&&hooks.toast(`換好了：你給 ${who}「${hooks.name(v.f)}」，拿到「${hooks.name(v.g)}」。`);}
  else if(v.k==='no'&&M.wait){M.wait=null;put(tradePath(me.cid,from),null);hooks.toast&&hooks.toast(`${who}這次不想換。換別的東西試試看。`);}});}
function npcDeal(){const b=hooks.bag(),rows=NPCDEALS.map(d=>({d,ok:(b[d.give]||0)>0}));
  modalOpen(`<h3>坐船來的外地人</h3><p>她從海的另一邊划船過來，船上有玻璃珠和瑪瑙珠。她想要這些東西：</p>${rows.map((r,i)=>`<button class="tb-deal" data-i="${i}" ${r.ok?'':'disabled'}><b>給 1 ${hooks.name(r.d.give)} → 換 1 ${hooks.name(r.d.get)}</b><small>${r.ok?r.d.why:'你沒有'+hooks.name(r.d.give)}</small></button>`).join('')}<div class="tb-row"><button class="tb-btn alt" data-x>先不要</button></div>`,
   el=>{el.querySelectorAll('.tb-deal').forEach(btn=>btn.onclick=()=>{const d=NPCDEALS[+btn.dataset.i];hooks.add({[d.give]:1},-1);hooks.add({[d.get]:1},1);hooks.saved&&hooks.saved('nt',1);modalClose();hooks.toast&&hooks.toast(`換好了：你給她「${hooks.name(d.give)}」，拿到「${hooks.name(d.get)}」。`);});});}
/* ---------- small in-world dialogs and the action button ---------- */
let modal=null,act=null;
function action(label,fn){if(!hooks.action)return;if(!label){if(act){act=null;hooks.action(null);}return;}if(!act||act.label!==label){act={label,fn};hooks.action(label,()=>act&&act.fn());}else act.fn=fn;}
function modalOpen(html,bind){modalClose();modal=document.createElement('div');modal.className='tb-modal';modal.setAttribute('role','dialog');modal.innerHTML=`<div class="tb-box">${html}</div>`;X.host.appendChild(modal);
  modal.querySelectorAll('[data-x]').forEach(b=>b.onclick=modalClose);bind&&bind(modal);const f=modal.querySelector('button:not([disabled])');f&&f.focus();X.S.keys={};}
function modalClose(){if(modal){modal.remove();modal=null;}}
function pick(title,sub,list,done,noLabel,off){modalOpen(`<h3>${title}</h3><p>${sub}</p><div class="tb-items">${list.map(k=>{const x=off&&off(k);return `<button class="tb-item" data-k="${k}" ${x?'disabled':''}>${hooks.name(k)}<small>${x||'有 '+hooks.bag()[k]}</small></button>`;}).join('')||'<p>沒有可以換的東西。</p>'}</div><div class="tb-row"><button class="tb-btn alt" data-no>${noLabel||'不要了'}</button></div>`,
  el=>{el.querySelectorAll('.tb-item:not([disabled])').forEach(b=>b.onclick=()=>{modalClose();done(b.dataset.k);});el.querySelector('[data-no]').onclick=()=>{modalClose();done(null);};});}
/* ---------- 試玩: two pretend classmates (12 號, 7 號) so a teacher can try every shared activity alone ---------- */
const BOTS=[{cid:'bot12',s:12,bag:['pot','fish','hide','millet']},{cid:'bot7',s:7,bag:['millet','hide','fish','pot']}];
function botsAdd(){const {S}=X;BOTS.forEach((b,i)=>{const g=person('pal',i+1),x=S.x+(i?-3:3),z=S.z+2;X.scene.add(g);
  others[b.cid]={g,x,z,tx:x,tz:z,tr:0,el:tag(b.s+' 號','tb-pal'),bot:b,goal:null,nt:0,gave:0,offered:0};});hooks.count&&hooks.count(BOTS.length);}
function botsTick(dt,ts){const {S}=X,now=Date.now();BOTS.forEach((b,i)=>{const o=others[b.cid];if(!o)return;let gx=null,gz=null;
  if(hunt&&i===0&&hunt.state!=='caught'&&hunt.myK>=0){const taken=new Set([hunt.myK]);BOTS.slice(0,i).forEach(p=>{const r=hunt.ring[p.cid];if(r)taken.add(r.k);});
    const m=hunt.marks.find(m=>!taken.has(m.k));if(m){gx=m.x;gz=m.z;if(Math.hypot(o.x-m.x,o.z-m.z)<.6)hunt.ring[b.cid]={k:m.k,s:b.s,t:now};}}
  else if(hunt)delete hunt.ring[b.cid];
  if(barn&&!barn.full&&barn.firstAt){gx=barn.at[0]+(i?-2:2);gz=barn.at[1]+3;if(Math.hypot(o.x-gx,o.z-gz)<1&&now-o.nt>9000){o.nt=now;const v=barn.all[b.cid]||{n:0,s:b.s,t:now};barn.all[b.cid]={n:v.n+1,s:b.s,t:v.t};}}
  if(gx==null){const a=ts*.25+i*3.1,r=i?3.2:2.4;gx=S.x+Math.cos(a)*r;gz=S.z+Math.sin(a)*r;}
  o.tx=o.x+Math.max(-1,Math.min(1,gx-o.x))*dt*5*(Math.hypot(gx-o.x,gz-o.z)>.3?1:0);o.tz=o.z+Math.max(-1,Math.min(1,gz-o.z))*dt*5*(Math.hypot(gx-o.x,gz-o.z)>.3?1:0);
  /* in 金屬器 the first classmate who reaches you offers a trade once */
  if(mart&&!o.offered&&!modal&&!mart.wait&&i===0&&Math.hypot(o.x-S.x,o.z-S.z)<4&&now-(mart.since||now)>15000){o.offered=1;onInbox({[b.cid]:{k:'offer',g:b.bag[0],s:b.s,t:now}});}});
  if(mart&&!mart.since)mart.since=now;}
function botReply(c,k){const o=others[c],b=o.bot;mart.wait={g:k,s:b.s,t:Date.now()};mart.waitCid=c;
  setTimeout(()=>{if(!mart||!mart.wait)return;const ok=b.bag.filter(x=>val(x)===val(k)&&x!==k),give=ok.length?ok[(o.gave++)%ok.length]:null;
   onInbox({[c]:give?{k:'reply',g:give,f:k,s:b.s,t:Date.now()+(++o.gave)}:{k:'no',s:b.s,t:Date.now()+(++o.gave)}});},1800);}
/* ---------- life cycle ---------- */
function enter(e,opt){leave();X=World.ext();if(!X.scene)return;era=e;me={cid:opt.cid,seat:opt.seat||0};hooks=opt||{};alive=true;
  labels=document.createElement('div');labels.className='tb-labels';X.host.appendChild(labels);
  const live=opt.sid?NET.on(opt.sid,opt.cid,e,onPos,r=>{if(hunt)hunt.ring=r;}):false;
  if(e==='old'&&X.HUNTAT.old)hunt=huntBuild(X.HUNTAT.old);
  if(e==='neo'&&X.HUNTAT.neo){barn=barnBuild(X.HUNTAT.neo);barn.mine=hooks.given?hooks.given('gr'):0;if(live)NET.watch('cl_coop/'+opt.sid+'/neo',v=>{if(barn){barn.all=v||{};const m=barn.all[me.cid];if(m&&m.n>barn.mine)barn.mine=m.n;if(m&&m.t)barn.firstAt=m.t;}});}
  if(e==='iron'&&X.HUNTAT.iron){mart=martBuild(X.HUNTAT.iron);if(live)NET.watch('cl_trade/'+opt.sid+'/'+opt.cid,onInbox);}
  if(opt.demo)botsAdd();
  let prev=0;X.upd.push((dt0,ts)=>{if(!alive)return;const pn=performance.now(),dt=prev?Math.min(.25,(pn-prev)/1000):dt0;prev=pn;sendTick();if(opt.demo)botsTick(dt,ts);palTick(dt,ts);if(hunt){huntTick(dt,ts);npcTick(dt,ts);}if(barn)barnTick(dt,ts);if(mart)martTick(dt,ts);});
  return {live};}
function leave(){alive=false;NET.off();modalClose();action(null);Object.keys(others).forEach(drop);others={};npcs.forEach(n=>{try{X.scene&&X.scene.remove(n.g);}catch(e){}n.el.remove();});npcs=[];
  if(hunt){hunt.marks.forEach(m=>m.el.remove());hunt.sign.remove();}hunt=null;if(barn)barn.sign.remove();barn=null;if(mart)mart.el.remove();mart=null;
  if(labels)labels.remove();labels=null;if(hooks.status)hooks.status(null);}
return {enter,leave,get hunt(){return hunt;},get barn(){return barn;},get mart(){return mart;},get others(){return others;},get npcs(){return npcs;},_inbox:a=>onInbox(a)};
})();
