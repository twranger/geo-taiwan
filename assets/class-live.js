/* Class play, shared by the games on this site.
   The teacher starts a task on nmth-host.html. A tablet enters the 4-digit task code (or opens a ?k= link),
   picks a seat number, waits in the lobby, and starts when the teacher does. Only the seat number is sent, never a name.
   Two stores in the school's Firebase project, each a backup for the other:
   - Realtime Database (cl_rooms/{sid}, cl_live/{sid}/{seat}): live progress, every few seconds. Billed by traffic, so cheap.
   - Firestore (nmth_rooms/{sid}, nmth_live/{sid}_{seat}): the record, written when a task is finished, every 2 minutes,
     and when the pupil saves and leaves. Billed per write, so kept sparse.
   Reads merge both and keep whichever copy is newer. */
window.ClassLive=(function(){
'use strict';
const FB={apiKey:'AIzaSyAIY5trDnEYdzNAG2Y59LD-is7n-if_UG4',authDomain:'orienteering-30fdc.firebaseapp.com',databaseURL:'https://orienteering-30fdc-default-rtdb.asia-southeast1.firebasedatabase.app',projectId:'orienteering-30fdc',storageBucket:'orienteering-30fdc.firebasestorage.app',messagingSenderId:'991787236670',appId:'1:991787236670:web:7ddb997f5dbeb54245406f'};
const GAMES={nmth:{n:'臺史博：閉館之後',page:'nmth-quest.html'},prehistory:{n:'史前生存大冒險',page:'prehistory.html'}};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KC=(()=>{try{const c=new URLSearchParams(location.search).get('c');return c&&/^\d{4}$/.test(c)?c:'';}catch(e){return '';}})();
const KQ=(()=>{try{const k=new URLSearchParams(location.search).get('k');return k&&/^[a-z0-9]{4,20}$/.test(k)?k:'';}catch(e){return '';}})();
let seatUn=[],O=null,sess=null,db=null,rt=null,loading=null,unsub=[],tm=0,box=null,cid='',skew=0,restT=0;
/* tablet clocks in a classroom are often minutes off: compare record times with the server's clock, not the tablet's */
const NOWS=()=>Date.now()+skew;
try{cid=localStorage.getItem('hhl-nmth-cid')||'';if(!cid){cid=Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);localStorage.setItem('hhl-nmth-cid',cid);}}catch(e){cid='x'+Math.random().toString(36).slice(2,10);}
const keep=()=>{try{sess?localStorage.setItem(O.store,JSON.stringify(sess)):localStorage.removeItem(O.store);}catch(e){}};
const off=()=>{unsub.forEach(u=>{try{u();}catch(e){}});unsub=[];seatUn=[];};
/* the free plan allows 100 tablets connected to the Realtime Database at once: a tablet that has left the task hangs up */
const rest=()=>{clearTimeout(restT);restT=setTimeout(()=>{if(!sess&&rt){try{firebase.database().goOffline();}catch(e){}}},5000);};
const wake=()=>{clearTimeout(restT);if(rt){try{firebase.database().goOnline();}catch(e){}}};
const load=()=>loading||(loading=new Promise((ok,no)=>{const need=['app','firestore','database'].filter(n=>!(window.firebase&&(n==='app'||firebase[n]))).map(n=>`https://www.gstatic.com/firebasejs/10.12.2/firebase-${n}-compat.js`);
  const next=()=>{const u=need.shift();if(!u){try{if(!firebase.apps.length)firebase.initializeApp(FB);db=firebase.firestore();try{rt=firebase.database();rt.ref('.info/serverTimeOffset').on('value',s=>{skew=+s.val()||0;},()=>{});}catch(e){rt=null;}ok(db);}catch(e){loading=null;no(e);}return;}
   const sc=document.createElement('script');sc.src=u;sc.onload=next;sc.onerror=()=>{loading=null;no(new Error('net'));};document.head.appendChild(sc);};next();}));
/* time of a record in ms, from either store */
const ms=v=>!v||!v.at?0:typeof v.at==='number'?v.at:v.at.seconds?v.at.seconds*1000:0;
const newer=(a,b)=>!a?b:!b?a:ms(b)>ms(a)?b:a;
/* rooms keep their creation time in at; up is the time of the last change */
const msR=v=>!v?0:(v.up?ms({at:v.up}):0)||ms(v);const newerR=(a,b)=>!a?b:!b?a:msR(b)>msR(a)?b:a;
/* ---- sending ---- */
let lastRt=0,lastFs=0,pendRt=false,pendFs=false,failRt=0,failFs=0;
function rec(){let v;try{v=O.snapshot()||{};}catch(e){return null;}const d=typeof v.d==='string'?v.d:JSON.stringify(v.d||[]);
  return {sid:sess.sid,seat:sess.seat,cid,mode:String(v.mode||'c').slice(0,4),cur:String(sess.on?(v.cur||''):'lobby').slice(0,30),d:d.slice(0,1900),done:v.done|0,stars:v.stars|0,miss:v.miss|0,t:v.t|0,notes:v.notes|0};}
function sendRt(r){if(!rt)return Promise.reject(new Error('no rtdb'));lastRt=Date.now();
  return rt.ref('cl_live/'+sess.sid+'/'+sess.seat).set(Object.assign({},r,{at:firebase.database.ServerValue.TIMESTAMP})).then(()=>{pendRt=false;failRt=0;},e=>{pendRt=true;failRt++;throw e;});}
function sendFs(r){if(!db)return Promise.reject(new Error('no firestore'));lastFs=Date.now();
  return db.collection('nmth_live').doc(sess.sid+'_'+sess.seat).set(Object.assign({},r,{at:firebase.firestore.FieldValue.serverTimestamp()})).then(()=>{pendFs=false;failFs=0;},e=>{pendFs=true;failFs++;throw e;});}
/* both stores now; resolves if at least one of them took it */
function pushBoth(){clearTimeout(tm);if(!db||!sess||!sess.seat)return Promise.reject(new Error('not ready'));const r=rec();if(!r)return Promise.reject(new Error('no data'));
  const a=sendRt(r).then(()=>1,()=>0),b=sendFs(r).then(()=>1,()=>0);return Promise.all([a,b]).then(([x,y])=>{if(!x&&!y)throw new Error('both failed');return {rt:!!x,fs:!!y};});}
/* the cheap store every few seconds; the record only when it has been a while (or the cheap one is failing) */
function push(){clearTimeout(tm);if(!db||!sess||!sess.seat)return;const r=rec();if(!r)return;
  const fsDue=Date.now()-lastFs>120000||(pendRt&&failRt>=2);
  sendRt(r).catch(()=>{if(!fsDue)sendFs(r).catch(()=>{});});if(fsDue)sendFs(r).catch(()=>{});}
const now=()=>{if(sess&&sess.seat&&db)pushBoth().catch(()=>{});};
const touch=()=>{if(!sess||!sess.seat)return;clearTimeout(tm);tm=setTimeout(push,Math.max(1500,5000-(Date.now()-lastRt)));};
setInterval(()=>{if(!(sess&&sess.seat&&sess.on&&db)||document.hidden)return;const t=Date.now();
  if(t-lastRt>30000||(pendRt&&t-lastRt>Math.min(300000,20000*failRt)))push();
  if(pendFs&&t-lastFs>Math.min(600000,30000*failFs))sendFs(rec()).catch(()=>{});},10000);
addEventListener('online',()=>{if(sess&&sess.seat&&(pendRt||pendFs))pushBoth().catch(()=>{});});
addEventListener('pagehide',()=>{if(sess&&sess.seat&&sess.on&&db)pushBoth().catch(()=>{});});
/* ---- reading: Firestore and Realtime Database together, newest copy wins ---- */
/* a room counts as gone only when both stores have answered and neither has it (one store may be out of quota) */
function roomWatch(sid,fn){let a=null,b=null,aS=false,bS=!rt;const emit=()=>{const r=newerR(a,b);if(r){fn(r,true);return;}if(aS&&bS)fn(null,true);};
  unsub.push(db.collection('nmth_rooms').doc(sid).onSnapshot(d=>{aS=true;a=d.exists?d.data():null;emit();},()=>{aS=true;a=null;emit();}));
  if(rt){const ref=rt.ref('cl_rooms/'+sid),h=ref.on('value',s=>{bS=true;b=s.val();emit();},()=>{bS=true;b=null;emit();});unsub.push(()=>ref.off('value',h));}}
function seatsWatch(sid,fn,list){let A={},B={};const emit=()=>{const m={};new Set([...Object.keys(A),...Object.keys(B)]).forEach(k=>{m[k]=newer(A[k],B[k]);});fn(m);};
  const u1=db.collection('nmth_live').where('sid','==',sid).onSnapshot(q=>{A={};q.forEach(d=>{const v=d.data();A[v.seat]=v;});emit();},()=>{});(list||unsub).push(u1);unsub.includes(u1)||unsub.push(u1);
  if(rt){const ref=rt.ref('cl_live/'+sid),h=ref.on('value',s=>{B={};const v=s.val()||{};Object.keys(v).forEach(k=>{if(v[k])B[v[k].seat||k]=v[k];});emit();},()=>{});const u2=()=>ref.off('value',h);(list||unsub).push(u2);unsub.includes(u2)||unsub.push(u2);}}
function findRooms(q){const fs=(q.sid?db.collection('nmth_rooms').doc(q.sid).get().then(d=>d.exists?[Object.assign({sid:d.id},d.data())]:[]):db.collection('nmth_rooms').where('code','==',q.code).get().then(r=>r.docs.map(d=>Object.assign({sid:d.id},d.data()))));
  const rd=!rt?Promise.resolve([]):(q.sid?rt.ref('cl_rooms/'+q.sid).once('value').then(s=>s.val()?[Object.assign({sid:q.sid},s.val())]:[]):rt.ref('cl_rooms').orderByChild('code').equalTo(q.code).once('value').then(s=>{const v=s.val()||{};return Object.keys(v).map(k=>Object.assign({sid:k},v[k]));}));
  return Promise.all([fs.then(x=>({ok:1,x}),()=>({ok:0,x:[]})),rd.then(x=>({ok:1,x}),()=>({ok:0,x:[]}))]).then(([a,b])=>{if(!a.ok&&!b.ok)throw new Error('net');
   const m={};a.x.concat(b.x).forEach(r=>{m[r.sid]=newerR(m[r.sid],r);});return Object.values(m);});}
/* ---- overlay ---- */
const CSS=`/* the box sits in the upper part of the screen, so a tablet's on-screen keyboard does not cover the code field and its button */
.cl-ov{position:fixed;inset:0;z-index:9000;background:rgba(12,18,22,.92);display:grid;place-items:start center;padding:max(18px,9vh) 18px 18px;overflow:auto;font-family:"Noto Sans TC",system-ui,sans-serif}
.cl-box{width:min(560px,100%);background:#f6f1e6;color:#182226;border-radius:14px;padding:26px 24px 22px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.cl-box h2{margin:0 0 4px;font-size:26px;line-height:1.3}.cl-box .cl-sub{margin:0 0 6px;color:#4a5558;font-size:16px}.cl-box p{font-size:17px;line-height:1.7;margin:10px 0}
.cl-code{display:block;width:100%;box-sizing:border-box;margin:16px 0 6px;font:900 44px/1.2 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.35em;text-align:center;padding:10px 6px;border:2px solid #182226;border-radius:10px;background:#fff;color:#182226}
.cl-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.cl-row.c{justify-content:center}
.cl-btn{min-height:48px;padding:10px 22px;border-radius:999px;border:2px solid #182226;background:#182226;color:#fff;font-family:inherit;font-weight:700;font-size:17px;line-height:1.2;cursor:pointer}
.cl-btn.alt{background:transparent;color:#182226}
.cl-btn.cl-wide{flex:1;font-size:19px;min-height:54px}
.cl-solo{margin:18px 0 0;font-size:15px;color:#5a6467;text-align:center}.cl-solo button{background:none;border:0;padding:6px 4px;font:inherit;color:#33464d;text-decoration:underline;cursor:pointer}
.cl-err{color:#a8371f;font-weight:700}.cl-ok{color:#1f6b4c;font-weight:700}
.cl-seats{display:grid;grid-template-columns:repeat(auto-fill,minmax(56px,1fr));gap:8px;margin-top:14px}
.cl-seats button{min-height:54px;font-family:inherit;font-weight:900;font-size:22px;line-height:1;border:2px solid #182226;background:#fff;color:#182226;border-radius:10px;cursor:pointer}
.cl-seats button:disabled{border-color:#b9b3a4;color:#a09a8c;background:#e2dccd;cursor:default}
.cl-btn:focus-visible,.cl-code:focus-visible,.cl-seats button:focus-visible{outline:3px solid #f2a33a;outline-offset:2px}
.cl-big{width:124px;height:124px;margin:4px auto 12px;border-radius:50%;border:5px solid #a8371f;color:#a8371f;display:grid;place-items:center;font-family:inherit;font-weight:900;font-size:56px;line-height:1}
.cl-c{text-align:center}`;
function ui(h){if(!box){const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);box=document.createElement('div');box.className='cl-ov';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','全班一起玩');document.body.appendChild(box);}
  box.hidden=false;box.innerHTML=`<div class="cl-box">${h}</div>`;return box;}
const hide=()=>{if(box)box.hidden=true;};
function ask(msg){off();ui(`<h2>輸入任務代碼</h2><p class="cl-sub">看老師的大螢幕，輸入上面的 4 個數字</p>${msg?`<p class="cl-err" role="alert">${msg}</p>`:''}
  <input class="cl-code" id="clCode" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="任務代碼">
  <div class="cl-row"><button class="cl-btn cl-wide" id="clGo">進大廳</button></div>
  <p class="cl-solo">老師沒有給任務代碼？<button id="clNo">自己玩</button></p>`);
  const go=()=>{const v=box.querySelector('#clCode').value.replace(/\D/g,'');if(v.length!==4){ask('任務代碼是 4 個數字。');return;}join({code:v});};
  box.querySelector('#clGo').onclick=go;box.querySelector('#clCode').onkeydown=e=>{if(e.key==='Enter')go();};box.querySelector('#clNo').onclick=()=>{hide();try{O.onSolo&&O.onSolo();}catch(e){}};box.querySelector('#clCode').focus();}
function join(q){off();ui(`<h2>正在找這個任務</h2><p>等一下下。</p>`);
  load().then(()=>{wake();return findRooms(q);}).then(rooms=>{
    const live=rooms.filter(r=>r.ph!=='closed').sort((a,b)=>ms(b)-ms(a))[0];
    if(!live){ask(rooms.length?'這個任務已經結束了。請看大螢幕上新的任務代碼。':'找不到這個任務。再看一次大螢幕上的數字。');return;}
    const g=live.game||'nmth';
    if(g!==O.game){const G=GAMES[g]||GAMES.nmth;if(q.link){location.replace(G.page+'?k='+live.sid);return;}ui(`<h2>這個代碼是另一個遊戲的</h2><p>老師發的任務是「${esc(G.n)}」。</p><div class="cl-row"><a class="cl-btn" style="text-decoration:none;display:inline-grid;place-items:center" href="${G.page}?k=${live.sid}">去那個遊戲</a><button class="cl-btn alt" id="clBack">重新輸入</button></div>`);box.querySelector('#clBack').onclick=()=>ask();return;}
    if(!sess||sess.sid!==live.sid){sess={sid:live.sid,code:live.code||'',label:live.label||'',seat:0,on:0};keep();try{O.onJoin&&O.onJoin(sess);}catch(e){}}
    sess.seat?wait():seat();})
   .catch(()=>ask('連不上網路，沒辦法接老師的任務。可以先按「自己玩」。'));}
/* a seat whose cid starts with '~' was released by the teacher (reopened task, or a pupil who saved and left);
   a seat not heard from for 20 minutes is free as well. Picking one of these brings its progress back. */
const idle=v=>!ms(v)||NOWS()-ms(v)>1200000;
function seat(msg){const sid=sess.sid;let all={};
  const draw=()=>{ui(`<h2>按下你的座號</h2>${msg?`<p class="cl-err" role="alert">${msg}</p>`:''}<p class="cl-sub">${esc(sess.label)}　灰色的已經有人選了，按錯請舉手</p><div class="cl-seats">${[...Array(40)].map((_,i)=>{const n=i+1,v=all[n],tk=v&&v.cid&&v.cid[0]!=='~'&&v.cid!==cid&&!idle(v);return `<button data-n="${n}" ${tk?'disabled':''}>${n}</button>`;}).join('')}</div>`);
   box.querySelectorAll('.cl-seats button').forEach(b=>b.onclick=()=>{const n=+b.dataset.n,v=all[n];sess.seat=n;sess.on=0;keep();
    if(v&&v.d&&v.d!=='[]'&&v.d!=='{}'&&(v.cid===cid||String(v.cid)[0]==='~'||idle(v))){try{O.onRestore&&O.onRestore(v);}catch(e){}}
    pushBoth().catch(()=>{});wait();});};
  off();draw();seatsWatch(sid,m=>{all=m;if(sess&&!sess.seat)draw();});}
function wait(quiet){const sid=sess.sid,t0=Date.now();off();
  if(!quiet){sess.on=0;keep();ui(`<div class="cl-big">${sess.seat}</div><h2 class="cl-c">${sess.seat} 號，你進大廳了</h2><p class="cl-c">看看大螢幕上有沒有你的座號。等老師按開始。</p><div class="cl-row c"><button class="cl-btn alt" id="clRe">選錯座號了</button></div>`);
   box.querySelector('#clRe').onclick=()=>{const old=sess.seat,blank={sid,seat:old,cid:'',mode:'c',cur:'left',d:'[]',done:0,stars:0,miss:0,t:0,notes:0};sess.seat=0;keep();
    db.collection('nmth_live').doc(sid+'_'+old).set(Object.assign({},blank,{at:firebase.firestore.FieldValue.serverTimestamp()})).catch(()=>{});
    if(rt)rt.ref('cl_live/'+sid+'/'+old).set(Object.assign({},blank,{at:firebase.database.ServerValue.TIMESTAMP})).catch(()=>{});seat();};}
  /* someone else took this seat (two pupils tapped the same number): the later one keeps it, this tablet picks again.
     Needed in the lobby, and for the first 20 seconds of a pupil who came in late. */
  if(sess&&!sess.on)seatsWatch(sid,m=>{const v=m[sess&&sess.seat];if(sess&&sess.seat&&sess.sid===sid&&(!sess.on||Date.now()-t0<20000)&&v&&v.cid&&v.cid[0]!=='~'&&v.cid!==cid&&ms(v)>NOWS()-60000){const n=sess.seat;sess.seat=0;sess.on=0;keep();seat(`${n} 號剛剛被另一台平板選走了。請再按一次你自己的座號。`);}},seatUn);
  roomWatch(sid,(r,known)=>{if(!sess||!known)return;r=r||{ph:'closed'};
   if(r.ph==='closed'){const was=sess.on,last=was?pushBoth().then(()=>1,()=>0):null;off();sess=null;keep();rest();try{O.onClosed&&O.onClosed(was);}catch(e){}if(!was){ask('這個任務已經結束了。');return;}
    /* say so on the tablet: otherwise 30 pupils keep playing and nobody knows the lesson part is over */
    last.then(okd=>{if(sess)return;ui(`<h2>老師結束這一場任務了</h2><p>${okd?'你的進度已經傳給老師。':'網路好像斷了，最後一點進度可能沒傳到，老師那邊有前幾分鐘的紀錄。'}</p><p>先停下來，聽老師說話。</p><div class="cl-row c"><button class="cl-btn" id="clEnd">好</button></div>`);box.querySelector('#clEnd').onclick=hide;});return;}
   if(r.moves&&+r.moves[cid]&&+r.moves[cid]!==sess.seat){sess.seat=+r.moves[cid];keep();pushBoth().catch(()=>{});if(!sess.on){wait();return;}try{O.onSeat&&O.onSeat(sess);}catch(e){}}
   {const sp=r.span||'';if(sp!==(sess.span||'')){sess.span=sp;keep();try{O.onSpan&&O.onSpan(sess);}catch(e){}}}
   if(r.ph==='play'&&!sess.on){sess.on=1;keep();hide();
    /* a pupil who comes in late starts at once, so the "two tablets, one seat" check stays on a little longer */
    const un=seatUn;seatUn=[];setTimeout(()=>un.forEach(u=>{try{u();}catch(e){}}),Math.max(0,20000-(Date.now()-t0)));
    try{O.onStart&&O.onStart(sess);}catch(e){}touch();}});
}
function isItYou(){let nm='';try{nm=O.who&&O.who()||'';}catch(e){}
  ui(`<h2>是你嗎？</h2><p>這台平板上次是<br><b style="font-size:24px">${esc(sess.label)}　${sess.seat} 號　${esc(nm)}</b><br>在玩。</p>
   <div class="cl-row"><button class="cl-btn cl-wide" id="clMe">是我，繼續玩</button></div><div class="cl-row"><button class="cl-btn alt cl-wide" id="clNotMe">不是我</button></div>`);
  box.querySelector('#clMe').onclick=()=>{ui(`<h2>正在連線</h2><p>等一下下。</p>`);load().then(()=>join({sid:sess.sid})).catch(()=>ask('連不上網路，沒辦法接老師的任務。'));};
  box.querySelector('#clNotMe').onclick=()=>{sess=null;keep();hide();rest();try{O.onNotMe&&O.onNotMe();}catch(e){}};}
/* 存檔下課: send to both stores, wait for at least one to confirm, then hand the tablet back clean.
   The seat is marked '~' so the same pupil can pick it again on any tablet next time. */
function saveAndLeave(){if(!sess||!sess.seat){try{O.onLeft&&O.onLeft();}catch(e){}return;}
  const seatNo=sess.seat,label=sess.label;let nm='';try{nm=O.who&&O.who()||'';}catch(e){}
  ui(`<h2>存檔中</h2><p>等一下下，不要關掉。</p>`);
  load().then(()=>{const r=rec();if(!r)throw new Error('no data');r.cid='~'+cid;r.cur='left';
   const a=rt?rt.ref('cl_live/'+sess.sid+'/'+sess.seat).set(Object.assign({},r,{at:firebase.database.ServerValue.TIMESTAMP})).then(()=>1,()=>0):Promise.resolve(0);
   const b=db.collection('nmth_live').doc(sess.sid+'_'+sess.seat).set(Object.assign({},r,{at:firebase.firestore.FieldValue.serverTimestamp()})).then(()=>1,()=>0);
   return Promise.race([Promise.all([a,b]),new Promise(z=>setTimeout(()=>z([0,0]),10000))]);})
  .then(([x,y])=>{if(!x&&!y)throw new Error('fail');off();sess=null;keep();rest();
   ui(`<div class="cl-big" style="border-color:#1f6b4c;color:#1f6b4c">${seatNo}</div><h2 class="cl-c">進度存好了</h2>
    <p class="cl-c">${esc(label)}　${seatNo} 號　${esc(nm)}</p><p class="cl-c">下次上課，打開老師給的網址，<b>選回 ${seatNo} 號</b>，就會接著玩。<br>換一台平板也可以。</p>
    <div class="cl-row c"><button class="cl-btn" id="clDone">好</button></div>`);
   box.querySelector('#clDone').onclick=()=>{hide();try{O.onLeft&&O.onLeft();}catch(e){}};})
  .catch(()=>{ui(`<h2>還沒存到</h2><p class="cl-err">網路好像斷了，進度還沒送到老師那邊。</p><p>進度還留在這台平板上。先不要關機，等網路好了再按一次；或請老師幫忙。</p>
    <div class="cl-row"><button class="cl-btn cl-wide" id="clAgain">再存一次</button></div><div class="cl-row"><button class="cl-btn alt cl-wide" id="clStay">回去繼續玩</button></div>`);
   box.querySelector('#clAgain').onclick=saveAndLeave;box.querySelector('#clStay').onclick=hide;});}
return {
  /* o: {game, store, snapshot(), who(), onJoin(sess), onRestore(liveDoc), onStart(sess), onSeat(sess), onNotMe(), onLeft(), onClosed(wasPlaying)} */
  init(o){O=o;try{sess=JSON.parse(localStorage.getItem(o.store)||'null');}catch(e){sess=null;}
   if(KQ&&sess&&sess.sid!==KQ){sess=null;keep();}
   if(!KQ&&KC&&sess&&sess.code!==KC){sess=null;keep();}
   if(sess&&sess.seat){setTimeout(isItYou,0);return 'confirm';}
   return sess||KQ||KC?'join':'';},
  /* call after the player has typed a name: join by link, rejoin, or ask for the code */
  begin(){if(sess&&sess.on)return;if(KQ)join({sid:KQ,link:1});else if(sess)join({sid:sess.sid});else if(KC)join({code:KC,link:1});else ask();},
  ask,touch,push,now,saveAndLeave,sess:()=>sess,leave(){off();sess=null;keep();rest();},link:KQ};
})();
