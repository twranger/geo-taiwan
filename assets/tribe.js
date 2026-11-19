/* 部落：classmates in the same 3D world, and a hunt that needs three people.
   - Positions go through the Realtime Database (cl_pos/{sid}/{era}/{cid}), only between tablets of the same class task
     and only in the same era. Only the seat number is shown, never a name.
   - The hunt (舊石器時代): three stones around a sambar deer. When all three are held for three seconds the deer is caught.
     Tribe members (NPCs) step in for places nobody takes, so two pupils, or one pupil alone, can still hunt.
   - Built for a class of 30 on one school Wi-Fi: child listeners instead of whole-list snapshots, fewer position
     updates the more pupils there are, every "how old is this" check on the server's clock (tablet clocks are often
     minutes off), and onDisconnect set again after every reconnect.
   - Transport is behind NET so it can move to another server later without touching the game. */
window.Tribe=(function(){
'use strict';
if(!window.World||!window.THREE)return null;
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
let barn=null,mart=null,X=null,era=null,me=null,others={},lastSend=0,sent={x:1e9,z:1e9,r:9},labels=null,hooks={},alive=false,palN=0,palSeq=0,VW=1,VH=1,pv=null;
const NPCN=['部落的獵人'];
const TSV=()=>window.firebase&&firebase.database&&firebase.database.ServerValue?firebase.database.ServerValue.TIMESTAMP:Date.now();
/* the server's clock. skew = server time minus this tablet's time, from .info/serverTimeOffset */
let skew=0,skewOk=false;const NOW=()=>Date.now()+skew;
/* ---------- network: Realtime Database ---------- */
const NET={ref:null,ring:null,caught:null,sid:null,cid:null,up:false,
  on(sid,cid,e,onPal,onGone,onRing){this.off();if(!sid||!window.firebase||!firebase.database)return false;
    const db=firebase.database();this.sid=sid;this.cid=cid;this.base='cl_pos/'+sid+'/'+e;this.hb='cl_hunt/'+sid+'/'+e;
    /* one small message per classmate who moved, not the whole list every time */
    this.ref=db.ref(this.base);const a=this.ref.on('child_added',s=>onPal(s.key,s.val()),()=>{}),b=this.ref.on('child_changed',s=>onPal(s.key,s.val()),()=>{}),c=this.ref.on('child_removed',s=>onGone(s.key),()=>{});
    this.ring=db.ref(this.hb+'/ring');const h2=this.ring.on('value',s=>onRing(s.val()||{}),()=>{});
    this.mine=db.ref(this.base+'/'+cid);this.mineR=db.ref(this.hb+'/ring/'+cid);
    const so=db.ref('.info/serverTimeOffset'),h3=so.on('value',s=>{skew=+s.val()||0;skewOk=true;},()=>{});
    /* the server runs onDisconnect once and then forgets it, so it is set again every time the connection comes back */
    const co=db.ref('.info/connected'),h4=co.on('value',s=>{this.up=!!s.val();if(!this.up||!this.mine)return;try{this.mine.onDisconnect().remove();this.mineR.onDisconnect().remove();}catch(e){}lastSend=0;ringAt=-1e9;},()=>{});
    this._off=()=>{this.ref.off('child_added',a);this.ref.off('child_changed',b);this.ref.off('child_removed',c);this.ring.off('value',h2);so.off('value',h3);co.off('value',h4);};return true;},
  pos(v){if(this.mine)this.mine.set(v).catch(()=>{});},
  hold(v){if(this.mineR)(v?this.mineR.set(v):this.mineR.remove()).catch(()=>{});},
  put(p,v){if(!window.firebase||!firebase.database)return;const r=firebase.database().ref(p);(v==null?r.remove():r.set(v)).catch(()=>{});},
  watch(p,fn){const r=firebase.database().ref(p),h=r.on('value',s=>fn(s.val()),()=>{});(this.extra=this.extra||[]).push(()=>r.off('value',h));},
  off(){(this.extra||[]).forEach(u=>{try{u();}catch(e){}});this.extra=[];if(this._off)this._off();this._off=null;if(this.mine){this.mine.remove().catch(()=>{});try{this.mine.onDisconnect().cancel();}catch(e){}}if(this.mineR){this.mineR.remove().catch(()=>{});try{this.mineR.onDisconnect().cancel();}catch(e){}}this.mine=this.mineR=this.ref=this.ring=null;this.up=false;}};
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
/* labels: the size of the view is read once per frame (reading it after a style write forces a layout),
   things too far away are not projected at all, and the style is only written when it changes */
function place(el,x,y,z,maxD){const {cam,S}=X;let tf='';
  if(Math.hypot(x-S.x,z-S.z)<maxD){pv.set(x,y,z).project(cam);if(pv.z<1&&pv.z>-1)tf=`translate(-50%,-50%) translate(${Math.round((pv.x+1)/2*VW)}px,${Math.round((1-pv.y)/2*VH)}px)`;}
  if(el._tf===tf)return;el._tf=tf;if(tf){if(el._on!==1){el._on=1;el.style.display='block';}el.style.transform=tf;}else{el._on=0;el.style.display='none';}}
function hideEl(el){if(el._tf===''&&el._on===0)return;el._tf='';el._on=0;el.style.display='none';}
/* ---------- the hunt: several herds on the grassland, three stones around each deer ----------
   With a whole class in one era a single deer means a queue, so every ground is its own hunt.
   A ring entry is {g: ground, k: stone, s: seat, t, j: when this pupil stepped on, c: when this tablet saw the circle close}.
   Entries without g are ground 0 (older tablets). j and c are server time, so every tablet works out the same thing:
   who was first on a stone, when the tribe's hunters should come, and that the deer was caught. */
const NEED=3,R0=6.5,HOLD=3,WAITH=12,WAITS=4,RESPAWN=7000,FRESH=12000,RBEAT=4;
let hunts=[],ring={},myG=-1,myK=-1,myJ=0,blocked=false,holding=false,ringAt=-1e9,swept={};
function huntBuild(at,gi){const {T,scene,Hf,M,part}=X,[hx,hz]=at;
  const dr=deer();dr.position.set(hx,Hf(hx,hz),hz);dr.rotation.y=gi*1.7;scene.add(dr);
  const marks=[0,1,2].map(k=>{const a=k*2.094+.5+gi,x=hx+Math.cos(a)*R0,z=hz+Math.sin(a)*R0,y=Hf(x,z);
    const st=part('ico',M('#9c968a'),.55,.35,.5,x,y+.18,z);scene.add(st);
    const rg=new T.Mesh(new T.RingGeometry(1.1,1.45,28),new T.MeshBasicMaterial({color:'#ffd23f',transparent:true,opacity:.75,side:T.DoubleSide,depthWrite:false}));rg.rotation.x=-Math.PI/2;rg.position.set(x,y+.08,z);scene.add(rg);
    const el=tag('','tb-mark');el.onclick=e=>{e.stopPropagation();if(X&&X.S)X.S.auto={x,z,stop:.6};};return {k,x,z,y,st,ring:rg,el};});
  return {gi,at,dr,marks,sign:tag('水鹿','tb-sign'),hold:0,state:'idle',joinedAt:0,caughtAt:0,npcs:[],fly:null,team:[],first:0,readyAt:0,seenC:0,myC:0,go:false};}
const fresh=(v,now)=>v&&!(typeof v.t==='number'&&now-v.t>FRESH);
/* two tablets can step on the same stone in the same moment: the one who came first keeps it (a tie goes to the smaller id) */
function rival(g,k,now){return Object.keys(ring).some(c=>{const v=ring[c];if(c===me.cid||!fresh(v,now)||(v.g||0)!==g||v.k!==k)return false;const j=v.j||0;return j<myJ||(j===myJ&&c<me.cid);});}
function heldOf(H,now){const held={};let first=0;if(myG===H.gi&&myK>=0&&holding){held[myK]={who:'me',s:me.seat};first=myJ;}
  Object.keys(ring).forEach(c=>{const v=ring[c];if(c===me.cid||!fresh(v,now)||(v.g||0)!==H.gi)return;
    /* another tablet saw the circle close: the deer is caught here too */
    if(v.c&&v.c>H.seenC){H.seenC=v.c;if(H.state==='idle'&&v.c>H.readyAt&&now-v.c<6000)H.go=true;}
    if(held[v.k])return;held[v.k]={who:'pal',s:v.s};const j=v.j||v.t||now;if(!first||j<first)first=j;});
  H.first=first;return held;}
function huntTick(dt,ts){if(!hunts.length)return;const {S,Hf}=X,now=NOW();
  // which stone am I on
  let g=-1,k=-1,unarmed=false,asleep=false;hunts.forEach(H=>H.marks.forEach(m=>{if(Math.hypot(S.x-m.x,S.z-m.z)<1.7){g=H.gi;k=m.k;}}));
  if(g>=0&&NET.ref&&isIdle()&&hunts[g].state==='idle'){asleep=true;g=k=-1;}
  if(g>=0&&hooks.armed&&!hooks.armed()&&hunts[g].state!=='throw'){unarmed=true;g=k=-1;}
  if(g!==myG||k!==myK){myG=g;myK=k;myJ=g>=0?now:0;ringAt=-1e9;}
  blocked=g>=0&&rival(g,k,now);const hold=g>=0&&!blocked;
  if(hold!==holding){holding=hold;ringAt=-1e9;if(!hold)NET.hold(null);}
  if(holding&&ts-ringAt>RBEAT){ringAt=ts;const v={g,k,s:me.seat||0,t:TSV(),j:myJ};if(hunts[g].myC)v.c=hunts[g].myC;NET.hold(v);}
  const noSpear=!!(hooks.armed&&!hooks.armed());let nearH=null;{let bd=1e9;hunts.forEach(H=>{const d=Math.hypot(H.at[0]-S.x,H.at[1]-S.z);if(d<bd){bd=d;nearH=H;}});}let mine=null,here=null,near=null,nd=1e9;
  hunts.forEach(H=>{const held=heldOf(H,now),humans=Object.keys(held).length;
    /* the tribe's hunters come when the first pupil here has waited long enough (counted from when the deer came back) */
    const waited=humans?Math.max(0,(now-Math.max(H.first,H.readyAt))/1000):0,wantNpc=humans>0&&H.state==='idle'&&waited>(NET.ref&&NET.up?WAITH:WAITS);
    const free=H.marks.filter(m=>!held[m.k]).map(m=>m.k);
    while(wantNpc&&H.npcs.length<free.length)H.npcs.push(npcNew(H,H.npcs.length));
    H.npcs.forEach((n,i)=>{const kk=wantNpc?free[i]:undefined;n.goal=kk==null?null:H.marks[kk];if(n.goal&&Math.hypot(n.x-n.goal.x,n.z-n.goal.z)<.6)held[n.goal.k]={who:'npc',n:n.name};});
    const full=H.marks.every(m=>held[m.k]),iam=myG===H.gi&&holding;
    H.marks.forEach(m=>{const h=held[m.k];const col=h?(h.who==='npc'?'#c9a26b':'#7dffb0'):'#ffd23f';if(m.col!==col){m.col=col;m.ring.material.color.set(col);}m.ring.rotation.z=ts*.6;
      const t=myG===H.gi&&myK===m.k?(blocked?'有人了':'你'):h||noSpear?'':'站這裡';if(m.txt!==t){m.txt=t;m.el.textContent=t;}if(t)place(m.el,m.x,m.y+1.6,m.z,26);else hideEl(m.el);});
    const st=H.state!=='idle'?'圍到了！':noSpear&&!humans?'水鹿：先做長矛才能圍獵':NET.ref?`水鹿：要 3 人圍獵（${Math.min(3,humans)}/3）`:'水鹿：站上石頭，部落的人會來幫你';if(H.signT!==st){H.signT=st;H.sign.textContent=st;}if(noSpear&&!humans&&H!==nearH)hideEl(H.sign);else place(H.sign,H.at[0],Hf(H.at[0],H.at[1])+3.6,H.at[1],46);
    // the deer
    const d=H.dr;
    if(H.state==='caught'){d.rotation.z=Math.min(1.45,d.rotation.z+dt*2.5);if(now-H.caughtAt>RESPAWN){H.state='idle';H.readyAt=now;H.myC=0;H.hold=0;d.rotation.z=0;d.rotation.y+=2.4;if(myG===H.gi)ringAt=-1e9;
        if(H.fly){H.fly.forEach(f=>{if(f.m.parent)f.m.parent.remove(f.m);});H.fly=null;}}}
    else if(H.state==='throw')throwTick(H,dt,now);
    else{d.rotation.y+=Math.sin(ts*.4+H.gi)*dt*.3;d.userData.legs.forEach((l,i)=>l.rotation.x=full?Math.sin(ts*14+i)*.5:0);
      H.hold=full&&iam?H.hold+dt:Math.max(0,H.hold-dt*2);
      if(H.hold>=HOLD){H.myC=H.seenC=now;ringAt=-1e9;startThrow(H,held);}
      else if(H.go)startThrow(H,held);}
    H.go=false;
    if(iam)mine={H,held,full,humans,waited,wantNpc};if(myG===H.gi)here={H,humans};
    const dd=Math.hypot(S.x-H.at[0],S.z-H.at[1]);if(dd<nd){nd=dd;near={H,humans};}});
  /* the catch has to reach the other tablets right away, not at the next heartbeat */
  if(holding&&ringAt<0&&hunts[g].myC){ringAt=ts;NET.hold({g,k,s:me.seat||0,t:TSV(),j:myJ,c:hunts[g].myC});}
  if(!hooks.status)return;
  const nearHint=!!(near&&nd<9&&!(hooks.armed&&!hooks.armed()));
  if(asleep)hooks.status('你在這顆石頭上站很久了。走一走，再回來圍獵。');
  else if(unarmed)hooks.status('空手抓不到水鹿。先到「找食物」用石器和樹枝綁一支長矛，學會了再來圍獵。');
  else if(blocked)hooks.status(here&&here.humans>=NEED&&hunts.length>1?'這群水鹿已經有 3 個人了。看別群頭上的牌子，找還沒滿的那一群。':'這顆石頭已經有同學站了，換一顆黃色的圓圈。');
  else if(mine){const {H,held,full,waited,wantNpc}=mine,miss=NEED-Object.keys(held).length,wt=NET.ref&&NET.up?WAITH:WAITS;
    if(H.state==='idle')hooks.status(full?`圍住了！別動……${Math.ceil(HOLD-H.hold)}`:`還差 ${miss} 個人。${wantNpc?'部落的人過來幫忙了。':NET.ref&&NET.up?`等同學過來；${Math.max(0,Math.ceil(wt-waited))} 秒後部落的人會來幫忙。`:'部落的人馬上過來。'}`);}
  /* only right next to a herd, and only once you have a spear: otherwise the line covers whatever the pupil is really doing */
  else if(nearHint){hooks.status(hunts.length>1?`草原上有 ${hunts.length} 群水鹿，每群要 3 個人各站一顆石頭。看頭上的牌子，找還沒滿的那群。`:'圍獵水鹿：要 3 個人各站一顆石頭，把水鹿圍住。走到黃色圓圈上。');}
  else if(huntTick.st){hooks.status(null);}huntTick.st=!!(asleep||unarmed||mine||blocked||nearHint);}
function startThrow(H,held){const {S,Hf}=X;H.state='throw';H.tt=0;H.hold=0;H.wasMine=myG===H.gi&&holding;
  H.pals=Object.values(held).filter(h=>h.who==='pal').length;H.team=[...new Set(Object.values(held).map(h=>h.who==='me'?null:h.who==='pal'?(h.s?h.s+' 號':'同學'):h.n).filter(Boolean))];
  const dy=Hf(H.at[0],H.at[1]);H.fly=H.marks.map((m,i)=>{const sp=spear();X.scene.add(sp);sp.visible=false;const a=held[m.k]&&held[m.k].who==='me'?{x:S.x,z:S.z,y:Hf(S.x,S.z)+1.5}:{x:m.x,z:m.z,y:m.y+1.6};
    const ang=Math.atan2(a.z-H.at[1],a.x-H.at[0]);return {m:sp,d:i*.45,a,b:{x:H.at[0]+Math.cos(ang)*.2,z:H.at[1]+Math.sin(ang)*.2,y:dy+1.3}};});
  if(myG===H.gi){hooks.status&&hooks.status('丟出長矛！');hooks.throw&&hooks.throw();}}
function throwTick(H,dt,now){H.tt+=dt;const at=(f,k)=>[f.a.x+(f.b.x-f.a.x)*k,f.a.y+(f.b.y-f.a.y)*k+Math.sin(k*Math.PI)*1.4,f.a.z+(f.b.z-f.a.z)*k];
  H.fly.forEach(f=>{if(H.tt<f.d){f.m.visible=false;return;}f.m.visible=true;const k=Math.min(1,(H.tt-f.d)/.8);
   if(f.hit)return;const p=at(f,k),q=at(f,Math.min(1.04,k+.04));if(k>=1){q[0]=p[0]+(f.b.x-f.a.x)*.05;q[1]=p[1]-.12;q[2]=p[2]+(f.b.z-f.a.z)*.05;}
   const dx=q[0]-p[0],dy2=q[1]-p[1],dz=q[2]-p[2],L=Math.hypot(dx,dy2,dz)||1;f.m.position.set(p[0]-dx/L*.95,p[1]-dy2/L*.95,p[2]-dz/L*.95);f.m.lookAt(q[0]-dx/L*.95,q[1]-dy2/L*.95,q[2]-dz/L*.95);if(k>=1){f.hit=1;H.dr.attach(f.m);if(myG===H.gi)hooks.hit&&hooks.hit();}});
  if(H.fly.every(f=>f.hit))H.dr.rotation.z=Math.min(1.45,H.dr.rotation.z+dt*2.2);
  if(H.fly.every(f=>f.hit)&&H.tt>(H.fly.length-1)*.45+.8+1){H.state='caught';H.caughtAt=now;
    // everybody who was on this ground when the circle closed gets the catch, even if they stepped off during the throw
    if(H.wasMine){hooks.status&&hooks.status(null);hooks.caught&&hooks.caught(H.team,H.pals||0);}H.wasMine=false;}}
function onRing(r){ring=r||{};if(!skewOk)return;const now=NOW();
  Object.keys(ring).forEach(c=>{const v=ring[c];if(c!==me.cid&&v&&typeof v.t==='number'&&now-v.t>600000&&!swept['r'+c]){swept['r'+c]=1;NET.put(NET.hb+'/ring/'+c,null);}});}
function npcNew(H,i){const [hx,hz]=H.at,a=Math.random()*6.28,x=hx+Math.cos(a)*16,z=hz+Math.sin(a)*16,g=person('npc',i+H.gi),sp=spear();sp.rotation.x=-1.25;sp.position.set(.32,1.05,0);g.add(sp);X.scene.add(g);
  return {name:NPCN[0],g,x,z,goal:null,H,el:tag(NPCN[0],'tb-npc')};}
function npcTick(dt,ts){const {Hf}=X;hunts.forEach(H=>H.npcs.forEach(n=>{let tx=n.goal?n.goal.x:H.at[0]+Math.cos(ts*.1+n.g.userData.ph)*22,tz=n.goal?n.goal.z:H.at[1]+Math.sin(ts*.1+n.g.userData.ph)*22;
  const dx=tx-n.x,dz=tz-n.z,d=Math.hypot(dx,dz),sp=n.goal?7:1.6;if(d>.4){n.x+=dx/d*Math.min(d,sp*dt);n.z+=dz/d*Math.min(d,sp*dt);n.g.rotation.y=Math.atan2(dx,dz);walk(n.g,ts,1);}else{if(n.goal)n.g.rotation.y=Math.atan2(H.at[0]-n.x,H.at[1]-n.z);walk(n.g,ts,0);}
  n.g.position.set(n.x,Hf(n.x,n.z),n.z);place(n.el,n.x,Hf(n.x,n.z)+2.4,n.z,30);}));}
function walk(g,ts,m){const L=g.userData.legs;if(!L)return;L[0].rotation.x=m?Math.sin(ts*9+g.userData.ph)*.6:0;L[1].rotation.x=-L[0].rotation.x;}
/* ---------- classmates ---------- */
/* how often to say where I am: the more classmates in this era, the less often (traffic grows with the square of the class) */
const STALE=50000,BEAT=20000,sendIv=()=>Math.min(2500,900+Math.max(0,palN-6)*70);
function onPal(c,v){if(!me||c===me.cid||!v||typeof v.x!=='number')return;const now=NOW(),t=typeof v.t==='number'?v.t:now;
  if(now-t>STALE){drop(c);
    /* left behind by a tablet that lost its connection without a goodbye: clear it out so the list does not grow */
    if(skewOk&&now-t>600000&&!swept[c]){swept[c]=1;NET.put(NET.base+'/'+c,null);}return;}
  let o=others[c];if(!o){o=others[c]={g:person('pal',palSeq++),x:v.x,z:v.z,tx:v.x,tz:v.z,el:tag('','tb-pal'),vis:false,sp:8};o.g.visible=false;X.scene.add(o.g);palCount();}
  /* walk to the new place in about the time until the next message, so it looks like steady walking */
  const d=Math.hypot(v.x-o.x,v.z-o.z);o.sp=d>30?1e4:Math.max(3,Math.min(14,d/(sendIv()/1000)));
  o.tx=v.x;o.tz=v.z;o.tr=v.r||0;o.t=t;const lab=v.s?v.s+' 號':'同學';if(o.lab!==lab){o.lab=lab;o.el.textContent=lab;}}
function palCount(){palN=Object.keys(others).length;hooks.count&&hooks.count(palN);}
function drop(c){const o=others[c];if(!o)return;X.scene.remove(o.g);o.el.remove();delete others[c];palCount();}
const SHOW=8,SHOWLOW=5,SHOWD=55;
function palTick(dt,ts){const {Hf,S}=X;
  if(!palTick.n||ts-palTick.n>.5||ts<palTick.n){palTick.n=ts;const now=NOW(),show=X.q&&X.q()?SHOWLOW:SHOW;
    Object.keys(others).forEach(c=>{const o=others[c];if(!o.bot&&o.t&&now-o.t>STALE)drop(c);});
    const L=Object.values(others).map(o=>[Math.hypot(o.x-S.x,o.z-S.z),o]).sort((a,b)=>a[0]-b[0]);L.forEach(([d,o],i)=>{o.vis=i<show&&d<SHOWD;o.g.visible=o.vis;if(!o.vis)hideEl(o.el);});}
  Object.values(others).forEach(o=>{const dx=o.tx-o.x,dz=o.tz-o.z,d=Math.hypot(dx,dz);
    if(d>.05){const m=o.bot?d*Math.min(1,dt*6):Math.min(d,o.sp*dt);o.x+=dx/d*m;o.z+=dz/d*m;}
    if(!o.vis)return;o.g.position.set(o.x,Hf(o.x,o.z),o.z);{const c=X.cam&&X.cam.position;o.g.visible=Math.hypot(o.x-S.x,o.z-S.z)>2.2&&(!c||Math.hypot(o.x-c.x,o.z-c.z)>3.2);}
    if(d>.05){o.g.rotation.y=Math.atan2(dx,dz);walk(o.g,ts,1);}else{o.g.rotation.y=o.tr+Math.PI;walk(o.g,ts,0);}place(o.el,o.x,Hf(o.x,o.z)+2.4,o.z,40);});}
/* A tablet left lying open must not keep the whole class downloading its heartbeat (and must not keep hunting):
   after 3 minutes without walking or looking around it goes quiet until somebody touches it again. */
let movedAt=0,away=false;const IDLE=180000,isIdle=()=>Date.now()-movedAt>IDLE;
function hush(){if(away)return;away=true;if(NET.mine)NET.mine.remove().catch(()=>{});NET.hold(null);holding=false;ringAt=-1e9;}
function onVis(){if(document.hidden)hush();else{movedAt=Date.now();}}
function sendTick(){const {S}=X,now=Date.now();if(!NET.ref)return;const d=Math.hypot(S.x-sent.x,S.z-sent.z),moved=d>.8;
  if(Math.hypot(S.x-sent.lx,S.z-sent.lz)>.02||Math.abs(S.yaw-sent.ly)>.05){sent.lx=S.x;sent.lz=S.z;sent.ly=S.yaw;movedAt=now;}
  if(isIdle()||document.hidden){hush();return;}if(away){away=false;lastSend=0;}
  /* also once when I have stopped, so classmates see me standing where I really am */
  const stopped=d>.25&&now-movedAt>1200;
  if(((moved||stopped)&&now-lastSend>sendIv())||now-lastSend>BEAT){lastSend=now;sent={x:S.x,z:S.z,lx:S.x,lz:S.z,ly:S.yaw};NET.pos({x:+S.x.toFixed(1),z:+S.z.toFixed(1),r:+S.yaw.toFixed(1),s:me.seat||0,t:TSV()});}}
/* ---------- 新石器時代：the village granary, filled together ---------- */
const BGOAL_CLASS=12,BGOAL_SOLO=5,NPC_EVERY=15000,BMAX=40;
function barnBuild(at){const {T,scene,Hf,M,part}=X,[x,z]=at,y=Hf(x,z),g=new T.Group();
  [[-1.4,-1.1],[1.4,-1.1],[-1.4,1.1],[1.4,1.1]].forEach(([px,pz])=>g.add(part('cyl',M('#6b4a2e'),.16,1.6,.16,px,.8,pz),part('cyl',M('#cfc8b8'),.42,.08,.42,px,1.62,pz)));
  g.add(part('box',M('#8a6a44'),3.4,.18,2.8,0,1.75,0),part('box',M('#b89464'),3,1.5,2.4,0,2.6,0));const roof=part('pyr',M('#c9a24e'),2.9,1.8,2.9,0,4.2,0);roof.rotation.y=Math.PI/4;roof.scale.set(3.2,1.8,2.7);g.add(roof);
  const pile=new T.Group();for(let i=0;i<10;i++)pile.add(part('cyl',M(i%2?'#e0b43a':'#c9a640'),.16,.9,.16,rnd2(-1.2,1.2),.45,rnd2(1.6,2.4)));g.add(pile);pile.scale.y=.05;
  g.position.set(x,y,z);scene.add(g);
  return {at,g,pile,mine:0,sent:0,put:0,ready:false,firstAt:0,all:{},full:false,paid:false,sign:tag('穀倉','tb-sign'),local:!NET.ref&&!hooks.demo};}
const rnd2=(a,b)=>a+Math.random()*(b-a);
function barnTotal(B){const now=NOW();let n=0,first=0,who=0;Object.keys(B.all).forEach(c=>{const v=B.all[c];if(!v||typeof v.n!=='number')return;const k=Math.max(0,Math.min(BMAX,v.n));n+=k;if(k)who++;if(typeof v.t==='number'&&(!first||v.t<first))first=v.t;});
  if(B.local){n=B.mine;first=B.firstAt;}const goal=B.local?BGOAL_SOLO:BGOAL_CLASS,npc=first?Math.max(0,Math.min(Math.floor(goal/2),Math.floor((now-first)/NPC_EVERY))):0;
  /* the class keeps storing season after season: a full granary is celebrated, then the next season starts from 0 */
  const all=n+npc,season=B.local?0:Math.floor(all/goal),total=B.local?Math.min(goal,all):all-season*goal;return {n,npc,goal,season,total,who};}
function barnTick(dt,ts){const B=barn,{S,Hf}=X;if(!B)return;const T=barnTotal(B),near=Math.hypot(S.x-B.at[0],S.z-B.at[1])<6;
  B.pile.scale.y=.05+.95*T.total/T.goal;const t=(T.season?`第 ${T.season+1} 季　`:'')+`穀倉 ${T.total}/${T.goal}`;if(B.signT!==t){B.signT=t;B.sign.textContent=t;}place(B.sign,B.at[0],Hf(B.at[0],B.at[1])+6,B.at[1],40);
  if(B.season==null)B.season=T.season;
  const rolled=T.season>B.season;if(rolled){B.season=T.season;B.put=0;B.cheer=Date.now();}
  /* everyone who put millet in belongs to a village with a full granary, also the pupil whose bundle came after it filled,
     or who was somewhere else when it did */
  if(!B.local&&B.mine>0&&!B.paid&&T.season>=1){B.paid=true;hooks.barnFull&&hooks.barnFull(Object.assign({late:!rolled},T));}
  else if(rolled&&near)hooks.toast&&hooks.toast(`第 ${T.season} 季的穀倉存滿了！大家接著存下一季。`);
  /* with many pupils around, nobody fills a season alone */
  const P=palN+1,cap=B.local||hooks.demo?99:P>=8?3:P>=4?4:99,over=B.put>=cap,max=B.sent>=BMAX;
  if(B.local&&T.total>=T.goal&&!B.full){B.full=true;if(B.mine>0&&!B.paid){B.paid=true;hooks.barnFull&&hooks.barnFull(T);}}
  const has=(hooks.bag&&(hooks.bag().millet||0))||0,seed=(hooks.bag&&(hooks.bag().wmillet||0))||0;
  if(near&&!B.full){hooks.status&&hooks.status(has&&max?'你已經放了很多小米，穀倉裡夠多了。':has&&over?`這一季你已經放了 ${B.put} 束。留一些位置給同學放，下一季再來。`:has?`把小米放進大家的穀倉。${T.season?`已經存滿 ${T.season} 季了，這是第 ${T.season+1} 季。`:`部落一起存到 ${T.goal} 束，收成不好的時候也有得吃。`}（現在 ${T.total}/${T.goal} 束，你放了 ${B.mine} 束${T.who>1?`，全班有 ${T.who} 個人放過`:''}）`:seed?'種子要留著種，不能放進穀倉。先到「種小米」把它種出來，收成的小米再拿來放。':`穀倉還差 ${T.goal-T.total} 束。到「種小米」那裡種小米，收成了再拿回來放。`);
   action(has&&!over&&!max&&(B.ready||!NET.ref)?'放 1 束小米進穀倉':null,barnPut);}
  else if(near&&B.full){hooks.status&&hooks.status(B.mine?'穀倉滿了！你也有出一份力。新石器時代的人種田、存糧食，才能在一個地方住下來。':'穀倉已經滿了，這次是其他人存的。');action(null);}
  else if(B.near){hooks.status&&hooks.status(null);action(null);}B.near=near;}
function barnPut(){const B=barn;if(!B||B.full||B.sent>=BMAX||(NET.ref&&!B.ready))return;const bag=hooks.bag(),k=(bag.millet||0)>0?'millet':null;if(!k)return;
  hooks.add({[k]:1},-1);B.mine++;B.sent++;B.put++;if(!B.firstAt)B.firstAt=NOW();hooks.saved&&hooks.saved('gr',1);
  if(hooks.demo)B.all[me.cid]={n:B.mine,s:0,t:B.firstAt};
  /* n is what this tablet has put in; a pupil who moved to another tablet keeps the old tablet's bundles under its id */
  if(NET.ref)NET.put('cl_coop/'+NET.sid+'/neo/'+me.cid,{n:B.sent,s:me.seat||0,t:B.firstAt});hooks.toast&&hooks.toast('放進 1 束小米。');hooks.sfx&&hooks.sfx('rustle');}
/* ---------- 金屬器時代：face-to-face trading ---------- */
/* what things are worth: 0 = lying around, nobody trades for it; trades only go through at the same worth */
const VAL={stone:0,branch:0,grass:0,shell:0,clay:0,ironsand:0,whet:0,greenware:0,
  fish:1,wmillet:1,millet:1,meat:1,charcoal:1,
  hide:2,pot:2,chopper:2,adze:2,iron:2,
  beads:3,jade:3,ironaxe:3};
const WORTH=['路邊就撿得到','普通','要花功夫做','很珍貴'];
const val=k=>VAL[k]==null?1:VAL[k];
const NPCDEALS=[{give:'pot',get:'beads',why:'她說她們那裡的陶罐樣子不一樣，想帶幾個回去。'},{give:'hide',get:'beads',why:'她說她們那裡很少鹿，獸皮很搶手。'},{give:'iron',get:'beads',why:'鐵很有用，她也願意換。'}];
function martBuild(at){const {Hf}=X;let [x,z]=at,wx=null,wz=null;
  /* the trader came by boat: find the nearest water, beach the canoe there and stand her on the shore next to it */
  for(let r=4;r<=40&&wx==null;r+=2)for(let i=0;i<24;i++){const a=i/24*6.28,px=at[0]+Math.cos(a)*r,pz=at[1]+Math.sin(a)*r;if(Hf(px,pz)<.05){wx=px;wz=pz;break;}}
  if(wx!=null){const a=Math.atan2(wz-at[1],wx-at[0]);let bx=wx,bz=wz;for(let k=0;k<12&&Hf(bx,bz)<.25;k++){bx-=Math.cos(a)*.8;bz-=Math.sin(a)*.8;}x=bx-Math.cos(a)*1.6;z=bz-Math.sin(a)*1.6;wx=bx+Math.cos(a)*.6;wz=bz+Math.sin(a)*.6;}
  const g=person('npc',2);g.position.set(x,Hf(x,z),z);X.scene.add(g);
  {const {T,M,part}=X,bt=new T.Group(),hull=part('sph',M('#6b4423'),1,1,1,0,0,0);hull.scale.set(.75,.38,2.9);bt.add(hull,part('box',M('#4a2f18'),1.1,.08,.12,0,.32,.7),part('box',M('#4a2f18'),1.1,.08,.12,0,.32,-.8));
   const oar=part('box',M('#8a6440'),.08,.06,2.4,.7,.42,0);oar.rotation.y=.3;bt.add(oar);const bx=wx==null?x+2.4:wx,bz=wz==null?z:wz;bt.position.set(bx,Math.max(0,Hf(bx,bz))+.12,bz);bt.rotation.y=Math.atan2(bx-x,bz-z);X.scene.add(bt);}
  const {T,M,part}=X,mat=part('box',M('#a07850'),2.2,.06,1.4,x+1.6,Hf(x+1.6,z)+.04,z);X.scene.add(mat);[[0,'#5aa0d8'],[.4,'#9a4f2a'],[.8,'#e0b43a']].forEach(([o,c])=>X.scene.add(part('sph',M(c),.18,.14,.18,x+1.1+o,Hf(x+1.6,z)+.14,z)));
  return {at:[x,z],g,mat,el:tag('坐船來的外地人','tb-npc'),inbox:{},wait:null,seen:{}};}
/* everyone close enough to trade with, nearest first */
function nearPals(){const {S}=X,L=[];Object.keys(others).forEach(c=>{const o=others[c],d=Math.hypot(o.x-S.x,o.z-S.z);if(d<4.5)L.push([d,c]);});return L.sort((a,b)=>a[0]-b[0]).slice(0,5).map(a=>a[1]);}
const nameOf=c=>others[c]?(others[c].lab||others[c].el.textContent):'同學',isBot=c=>!!(others[c]&&others[c].bot);
const WAITT=40000,PENDT=20000;let late={};
function martTick(dt,ts){const M=mart,{S,Hf}=X;if(!M)return;place(M.el,M.at[0],Hf(M.at[0],M.at[1])+2.4,M.at[1],40);M.g.rotation.y=Math.atan2(S.x-M.at[0],S.z-M.at[1]);
  const now=NOW();
  if(M.wait&&now-M.wait.t>WAITT){const w=M.wait;M.wait=null;if(!isBot(w.cid))NET.put(tradePath(w.cid,me.cid),null);hooks.toast&&hooks.toast(`${w.who}沒有回應，這次沒換成。`);}
  if(M.pend&&now-M.pend.t>PENDT){const q=M.pend;M.pend=null;hooks.toast&&hooks.toast(`${q.who}沒有確認，這次沒換成。你的東西還在。`);}
  if(modal)return;
  if(M.wait){hooks.status&&hooks.status(`等 ${M.wait.who}回應……`);action('不換了',()=>{const w=M.wait;M.wait=null;if(w&&!isBot(w.cid))NET.put(tradePath(w.cid,me.cid),null);});return;}
  if(M.pend){hooks.status&&hooks.status(`等 ${M.pend.who}確認……`);action(null);return;}
  if(!M.nt||ts-M.nt>.3||ts<M.nt){M.nt=ts;M.pals=nearPals();M.npc=Math.hypot(S.x-M.at[0],S.z-M.at[1])<4;}
  const pals=(M.pals||[]).filter(c=>others[c]),n=pals.length+(M.npc?1:0);
  /* a crowd around the trader: let the pupil choose who to trade with, so the trader is never hidden behind classmates */
  if(n>1){hooks.status&&hooks.status(`旁邊有 ${n} 個人可以交換${M.npc?'，坐船來的外地人也在':''}。`);action('找人交換東西',choose);}
  else if(pals.length){const who=nameOf(pals[0]);hooks.status&&hooks.status(`${who}就在旁邊，可以拿差不多值錢的東西跟他換。`);action(`和 ${who} 交換東西`,()=>offerTo(pals[0]));}
  else if(M.npc){hooks.status&&hooks.status('有人划船渡海過來，帶了玻璃珠和瑪瑙珠，想換我們這裡的東西。');action('看她想換什麼',npcDeal);}
  else if(M.was){hooks.status&&hooks.status(null);action(null);}M.was=n>0;}
function choose(){const M=mart;if(!M)return;const pals=nearPals();
  modalOpen(`<h3>要跟誰換？</h3><div class="tb-items">${M.npc?'<button class="tb-item" data-w="npc">坐船來的外地人<small>她有玻璃珠和瑪瑙珠</small></button>':''}${pals.map(c=>`<button class="tb-item" data-w="${c}">${nameOf(c)}<small>同學</small></button>`).join('')}</div><div class="tb-row"><button class="tb-btn alt" data-x>先不要</button></div>`,
   el=>el.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{const w=b.dataset.w;modalClose();if(w==='npc')npcDeal();else if(others[w])offerTo(w);else hooks.toast&&hooks.toast('他走開了。');}));}
const tradePath=(to,from)=>'cl_trade/'+NET.sid+'/'+to+'/'+from;
const itemsOf=()=>{const b=hooks.bag?hooks.bag():{};return Object.keys(b).filter(k=>b[k]>0&&k!=='method'&&k!=='slag'&&hooks.name&&hooks.name(k));};
const goodsOf=()=>itemsOf().filter(k=>val(k)>0);
function swap(give,get,who,seat){hooks.add({[give]:1},-1);hooks.add({[get]:1},1);hooks.saved&&hooks.saved('tr',1,seat||0);hooks.toast&&hooks.toast(`換好了：你給 ${who}「${hooks.name(give)}」，拿到「${hooks.name(get)}」。`);hooks.sfx&&hooks.sfx('clink');}
/* A trade takes three messages, and nothing leaves a bag until both sides have agreed:
     offer (A: "I give g")  ->  reply (B: "I give k for it")  ->  ok (A has swapped; now B swaps).
   If A took the offer back, lost the item or walked off, B gets "no" (or nothing) and keeps everything.
   Each side has one slot per classmate: cl_trade/{sid}/{to}/{from}. An id ties the three messages together; it rides in g
   ("pot#123456") so the messages have exactly the fields the database rules already allow: k, g, f, s, t. */
function offerTo(c){const who=nameOf(c),list=goodsOf();if(!list.length){hooks.toast&&hooks.toast('你只有路邊就撿得到的東西，沒有人會想換。先做出陶罐、抓到魚，或找到獸皮再來。');return;}
  pick(`你要拿什麼給 <b>${who}</b>？`,'他會挑一樣差不多值錢、你沒有的東西給你。',list,k=>{if(!k||!mart)return;const i=1+Math.floor(Math.random()*999999);mart.wait={g:k,i,cid:c,who,t:NOW()};
   if(isBot(c)){botReply(c,k);return;}NET.put(tradePath(c,me.cid),{k:'offer',g:k+'#'+i,s:me.seat||0,t:TSV()});});}
function onInbox(all,part){const M=mart;if(!M)return;const now=NOW();all=all||{};
  /* the classmate took the offer back while I was still choosing */
  const idOf=m=>{const p=String(m&&m.g||'').split('#');return p[1]?+p[1]:(m&&m.i)||0;};
  if(!part&&M.ask&&!(all[M.ask.from]&&all[M.ask.from].k==='offer'&&idOf(all[M.ask.from])===M.ask.i)){const a=M.ask;M.ask=null;modalClose();hooks.toast&&hooks.toast(`${a.who}不換了。`);}
  Object.keys(late).forEach(i=>{if(now-late[i].t>90000)delete late[i];});
  Object.keys(all).forEach(from=>{const m0=all[from];if(!m0||typeof m0.k!=='string')return;const gp=String(m0.g||'').split('#'),v=Object.assign({},m0,{g:gp[0],i:gp[1]?+gp[1]:(m0.i==null?null:m0.i)});if(v.k==='busy'){v.k='no';v.b=1;}
    const id=from+':'+m0.k+':'+(v.i||0)+':'+v.t;if(M.seen[id])return;
    const bot=isBot(from),put=(p,x)=>{if(!bot)NET.put(p,x);},box=tradePath(me.cid,from),theirs=tradePath(from,me.cid);
    if(typeof v.t==='number'&&now-v.t>90000){if(!part)put(box,null);return;}M.seen[id]=1;
    const who=v.s?v.s+' 號':'同學',no=b=>put(theirs,{k:b?'busy':'no',g:'-#'+(v.i||0),s:me.seat||0,t:TSV()});
    if(v.k==='offer'){
      /* one thing at a time: a second offer, or one that comes while I am in a task, gets "busy" instead of covering what I am doing */
      if(modal||M.wait||M.pend||M.ask||(X.paused&&X.paused())||!hooks.name(v.g)){put(box,null);no(1);return;}
      const list=goodsOf(),w=val(v.g);M.ask={from,i:v.i||0,who};
      pick(`${who}拿 <b>${hooks.name(v.g)}</b> 想跟你換`,'你要給他什麼？只能選差不多值錢、又不一樣的東西。',list,k=>{M.ask=null;put(box,null);
        if(!k){no(0);return;}
        if(v.i==null){/* an older tablet: it swaps as soon as it hears back */swap(k,v.g,who,v.s);put(theirs,{k:'reply',g:k,f:v.g,s:me.seat||0,t:TSV()});return;}
        const q=M.pend={from,i:v.i,give:k,get:v.g,who,s:v.s||0,t:NOW()};late[v.i]=q;put(theirs,{k:'reply',g:k+'#'+v.i,f:v.g,s:me.seat||0,t:TSV()});
        if(bot)setTimeout(()=>onInbox({[from]:{k:'ok',i:v.i,s:v.s,t:Date.now()}},1),600);
      },'這次不換',k=>k===v.g?'一樣的東西，不用換':val(k)===w?'':val(k)<w?'太便宜，他不換':'太貴了，你會吃虧');}
    else if(v.k==='reply'){put(box,null);const w=M.wait,mineW=w&&w.cid===from&&w.g===v.f&&(v.i==null||v.i===w.i);
      if(mineW&&(hooks.bag()[v.f]||0)>0&&hooks.name(v.g)){M.wait=null;swap(v.f,v.g,who,v.s);if(v.i!=null)put(theirs,{k:'ok',g:'-#'+v.i,s:me.seat||0,t:TSV()});}
      else{if(mineW){M.wait=null;hooks.toast&&hooks.toast(`你身上已經沒有「${hooks.name(v.f)}」了，這次沒換成。`);}if(v.i!=null)no(0);}}
    else if(v.k==='ok'){put(box,null);const q=late[v.i];
      if(q&&q.from===from&&!q.done){q.done=1;if(M.pend===q)M.pend=null;if((hooks.bag()[q.give]||0)>0)swap(q.give,q.get,q.who,q.s);}}
    else if(v.k==='no'){put(box,null);
      if(M.wait&&M.wait.cid===from&&(!v.i||v.i===M.wait.i)){M.wait=null;hooks.toast&&hooks.toast(v.b?`${who}正在忙，等一下再找他換。`:`${who}這次不想換。換別的東西試試看。`);}
      else if(M.pend&&M.pend.from===from&&v.i===M.pend.i){M.pend.done=1;M.pend=null;hooks.toast&&hooks.toast(`${who}那邊沒有換成。你的東西還在。`);}}});}
const NPCMAX=3;
function npcDeal(){const left=NPCMAX-((hooks.given&&hooks.given('nt'))||0);
  if(left<=0){modalOpen('<h3>坐船來的外地人</h3><p>她帶來的珠子都換完了，要把換到的東西載回海的另一邊。</p><div class="tb-row"><button class="tb-btn" data-x>好</button></div>');return;}
  const b=hooks.bag(),rows=NPCDEALS.map(d=>({d,ok:(b[d.give]||0)>0}));
  modalOpen(`<h3>坐船來的外地人</h3><p>她從海的另一邊划船過來，船上有玻璃珠和瑪瑙珠。她想要這些東西（她的珠子還能換 ${left} 次）：</p>${rows.map((r,i)=>`<button class="tb-deal" data-i="${i}" ${r.ok?'':'disabled'}><b>給 1 ${hooks.name(r.d.give)} → 換 1 ${hooks.name(r.d.get)}</b><small>${r.ok?r.d.why:'你沒有'+hooks.name(r.d.give)}</small></button>`).join('')}<div class="tb-row"><button class="tb-btn alt" data-x>先不要</button></div>`,
   el=>{el.querySelectorAll('.tb-deal').forEach(btn=>btn.onclick=()=>{const d=NPCDEALS[+btn.dataset.i];hooks.add({[d.give]:1},-1);hooks.add({[d.get]:1},1);hooks.saved&&hooks.saved('nt',1);modalClose();hooks.toast&&hooks.toast(`換好了：你給她「${hooks.name(d.give)}」，拿到「${hooks.name(d.get)}」。`);hooks.sfx&&hooks.sfx('clink');});});}
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
  others[b.cid]={g,x,z,tx:x,tz:z,tr:0,lab:b.s+' 號',vis:true,sp:8,el:tag(b.s+' 號','tb-pal'),bot:b,goal:null,nt:0,gave:0,offered:0};});palCount();}
function botsTick(dt,ts){const {S}=X,now=NOW();BOTS.forEach((b,i)=>{const o=others[b.cid];if(!o)return;let gx=null,gz=null;
  const H=myG>=0?hunts[myG]:null;
  if(H&&i===0&&H.state==='idle'&&!blocked){const m=H.marks.find(m=>m.k!==myK);if(m){gx=m.x;gz=m.z;if(Math.hypot(o.x-m.x,o.z-m.z)<.6)ring[b.cid]={g:H.gi,k:m.k,s:b.s,t:now};}}
  else delete ring[b.cid];
  if(barn&&!barn.full&&barn.firstAt&&(barn.all[b.cid]||{n:0}).n<6){gx=barn.at[0]+(i?-2:2);gz=barn.at[1]+3;if(Math.hypot(o.x-gx,o.z-gz)<1&&now-o.nt>9000){o.nt=now;const v=barn.all[b.cid]||{n:0,s:b.s,t:now};barn.all[b.cid]={n:v.n+1,s:b.s,t:v.t};}}
  if(gx==null){const a=ts*.25+i*3.1,r=i?3.2:2.4;gx=S.x+Math.cos(a)*r;gz=S.z+Math.sin(a)*r;}
  o.tx=o.x+Math.max(-1,Math.min(1,gx-o.x))*dt*5*(Math.hypot(gx-o.x,gz-o.z)>.3?1:0);o.tz=o.z+Math.max(-1,Math.min(1,gz-o.z))*dt*5*(Math.hypot(gx-o.x,gz-o.z)>.3?1:0);
  /* in 金屬器 the first classmate who reaches you offers a trade once */
  if(mart&&!o.offered&&!modal&&!mart.wait&&i===0&&Math.hypot(o.x-S.x,o.z-S.z)<4&&now-(mart.since||now)>15000){o.offered=1;onInbox({[b.cid]:{k:'offer',g:b.bag[0],s:b.s,t:now}},1);}});
  if(mart&&!mart.since)mart.since=now;}
function botReply(c,k){const o=others[c],b=o.bot,w=mart.wait;
  setTimeout(()=>{if(!mart||mart.wait!==w)return;const mine=hooks.bag?hooks.bag():{},ok0=b.bag.filter(x=>val(x)===val(k)&&x!==k),ok=ok0.filter(x=>!mine[x]).length?ok0.filter(x=>!mine[x]):ok0,give=ok.length?ok[(o.gave++)%ok.length]:null;
   onInbox({[c]:give?{k:'reply',g:give,f:k,i:w.i,s:b.s,t:Date.now()+(++o.gave)}:{k:'no',i:w.i,s:b.s,t:Date.now()+(++o.gave)}},1);},1800);}
/* ---------- life cycle ---------- */
function enter(e,opt){leave();X=World.ext();if(!X.scene)return;era=e;me={cid:opt.cid,seat:opt.seat||0};hooks=opt||{};alive=true;pv=new X.T.Vector3();VW=X.host.clientWidth;VH=X.host.clientHeight;lastSend=0;sent={x:1e9,z:1e9,lx:1e9,lz:1e9,ly:9};palSeq=0;swept={};movedAt=Date.now();away=false;document.addEventListener('visibilitychange',onVis);
  labels=document.createElement('div');labels.className='tb-labels';X.host.appendChild(labels);
  ring={};myG=myK=-1;myJ=0;blocked=holding=false;ringAt=-1e9;
  const live=opt.sid?NET.on(opt.sid,opt.cid,e,onPal,drop,onRing):false;
  /* a whole class starts an era at the same spot: spread out by seat number so nobody stands inside a classmate */
  if(live&&me.seat&&X.START&&X.START[e]){const s0=X.START[e],S=X.S;if(Math.hypot(S.x-s0[0],S.z-s0[1])<.5){const a=me.seat*2.4,r=1.4+(me.seat%5)*.8,nx=s0[0]+Math.cos(a)*r,nz=s0[1]+Math.sin(a)*r;if(X.Hf(nx,nz)>.3&&Math.abs(X.Hf(nx,nz)-X.Hf(s0[0],s0[1]))<1.2){S.x=nx;S.z=nz;}}}
  if(e==='old'){const at=(X.HUNTS&&X.HUNTS.old)||(X.HUNTAT.old?[X.HUNTAT.old]:[]);hunts=at.map((p,i)=>huntBuild(p,i));}
  if(e==='neo'&&X.HUNTAT.neo){barn=barnBuild(X.HUNTAT.neo);barn.mine=hooks.given?hooks.given('gr'):0;barn.paid=!!(hooks.given&&hooks.given('barn'));if(live)NET.watch('cl_coop/'+opt.sid+'/neo',v=>{if(barn){barn.all=v||{};barn.ready=true;const m=barn.all[me.cid];if(m&&m.n>barn.sent)barn.sent=m.n;if(m&&m.t)barn.firstAt=m.t;}});}
  if(e==='iron'&&X.HUNTAT.iron){mart=martBuild(X.HUNTAT.iron);if(live)NET.watch('cl_trade/'+opt.sid+'/'+opt.cid,onInbox);}
  if(opt.demo)botsAdd();
  let prev=0;X.upd.push((dt0,ts)=>{if(!alive)return;const pn=performance.now(),dt=prev?Math.min(.25,(pn-prev)/1000):dt0;prev=pn;VW=X.host.clientWidth;VH=X.host.clientHeight;sendTick();if(opt.demo)botsTick(dt,ts);palTick(dt,ts);if(hunts.length){huntTick(dt,ts);npcTick(dt,ts);}if(barn)barnTick(dt,ts);if(mart)martTick(dt,ts);});
  return {live};}
function leave(){alive=false;document.removeEventListener('visibilitychange',onVis);if(mart&&mart.wait&&NET.ref&&!isBot(mart.wait.cid))NET.put(tradePath(mart.wait.cid,me.cid),null);NET.off();modalClose();action(null);Object.keys(others).forEach(drop);others={};palN=0;holding=false;
  hunts.forEach(H=>{H.npcs.forEach(n=>{try{X.scene&&X.scene.remove(n.g);}catch(e){}n.el.remove();});H.marks.forEach(m=>m.el.remove());H.sign.remove();});hunts=[];ring={};myG=myK=-1;if(barn)barn.sign.remove();barn=null;if(mart)mart.el.remove();mart=null;
  if(labels)labels.remove();labels=null;if(hooks.status)hooks.status(null);}
return {enter,leave,seat(n){if(me){me.seat=n||0;lastSend=0;ringAt=-1e9;}},get hunt(){return hunts[0]||null;},get hunts(){return hunts;},get ring(){return ring;},get barn(){return barn;},get mart(){return mart;},get others(){return others;},get npcs(){return hunts.flatMap(H=>H.npcs);},get net(){return {up:NET.up,skew,iv:sendIv()};},_inbox:(a,p)=>onInbox(a,p)};
})();
