/* Class play, shared by the games on this site.
   The teacher starts a task on nmth-host.html. A tablet enters the 4-digit task code (or opens a ?k= link),
   picks a seat number, waits in the lobby, and starts when the teacher does. While playing, the game's own
   snapshot is written to Firestore (nmth_live/{sid}_{seat}). Only the seat number is sent, never a name.
   Uses the school's existing Firebase project (same one as the orienteering game). */
window.ClassLive=(function(){
'use strict';
const FB={apiKey:'AIzaSyAIY5trDnEYdzNAG2Y59LD-is7n-if_UG4',authDomain:'orienteering-30fdc.firebaseapp.com',projectId:'orienteering-30fdc',storageBucket:'orienteering-30fdc.firebasestorage.app',messagingSenderId:'991787236670',appId:'1:991787236670:web:7ddb997f5dbeb54245406f'};
const GAMES={nmth:{n:'臺史博：閉館之後',page:'nmth-quest.html'},prehistory:{n:'史前生存大冒險',page:'prehistory.html'}};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KC=(()=>{try{const c=new URLSearchParams(location.search).get('c');return c&&/^\d{4}$/.test(c)?c:'';}catch(e){return '';}})();
let O=null,sess=null,db=null,loading=null,unsub=[],tm=0,box=null,cid='';
try{cid=localStorage.getItem('hhl-nmth-cid')||'';if(!cid){cid=Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);localStorage.setItem('hhl-nmth-cid',cid);}}catch(e){cid='x'+Math.random().toString(36).slice(2,10);}
const KQ=(()=>{try{const k=new URLSearchParams(location.search).get('k');return k&&/^[a-z0-9]{4,20}$/.test(k)?k:'';}catch(e){return '';}})();
const keep=()=>{try{sess?localStorage.setItem(O.store,JSON.stringify(sess)):localStorage.removeItem(O.store);}catch(e){}};
const off=()=>{unsub.forEach(u=>{try{u();}catch(e){}});unsub=[];};
const load=()=>loading||(loading=new Promise((ok,no)=>{const need=['app','firestore'].map(n=>`https://www.gstatic.com/firebasejs/10.12.2/firebase-${n}-compat.js`);
  if(window.firebase&&firebase.firestore)need.length=0;
  const next=()=>{const u=need.shift();if(!u){try{if(!firebase.apps.length)firebase.initializeApp(FB);db=firebase.firestore();ok(db);}catch(e){loading=null;no(e);}return;}
   const sc=document.createElement('script');sc.src=u;sc.onload=next;sc.onerror=()=>{loading=null;no(new Error('net'));};document.head.appendChild(sc);};next();}));
function push(){clearTimeout(tm);if(!db||!sess||!sess.seat)return;let v;try{v=O.snapshot()||{};}catch(e){return;}
  const d=typeof v.d==='string'?v.d:JSON.stringify(v.d||[]);
  db.collection('nmth_live').doc(sess.sid+'_'+sess.seat).set({sid:sess.sid,seat:sess.seat,cid,mode:String(v.mode||'c').slice(0,4),cur:String(sess.on?(v.cur||''):'lobby').slice(0,30),d:d.slice(0,1900),
   done:v.done|0,stars:v.stars|0,miss:v.miss|0,t:v.t|0,notes:v.notes|0,at:firebase.firestore.FieldValue.serverTimestamp()}).catch(()=>{});}
const touch=()=>{if(!sess||!sess.seat)return;clearTimeout(tm);tm=setTimeout(push,1800);};
setInterval(()=>{if(sess&&sess.seat&&sess.on&&!document.hidden&&db)push();},45000);
addEventListener('pagehide',()=>{if(sess&&sess.seat&&sess.on&&db)push();});
/* ---- overlay ---- */
const CSS=`.cl-ov{position:fixed;inset:0;z-index:9000;background:rgba(12,18,22,.92);display:grid;place-items:center;padding:18px;overflow:auto;font-family:"Noto Sans TC",system-ui,sans-serif}
.cl-box{width:min(560px,100%);background:#f6f1e6;color:#182226;border-radius:14px;padding:26px 24px 22px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.cl-box h2{margin:0 0 4px;font-size:26px;line-height:1.3}.cl-box .cl-sub{margin:0 0 6px;color:#4a5558;font-size:16px}.cl-box p{font-size:17px;line-height:1.7;margin:10px 0}
.cl-code{display:block;width:100%;box-sizing:border-box;margin:16px 0 6px;font:900 44px/1.2 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.35em;text-align:center;padding:10px 6px;border:2px solid #182226;border-radius:10px;background:#fff;color:#182226}
.cl-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.cl-row.c{justify-content:center}
.cl-btn{min-height:48px;padding:10px 22px;border-radius:999px;border:2px solid #182226;background:#182226;color:#fff;font-family:inherit;font-weight:700;font-size:17px;line-height:1.2;cursor:pointer}
.cl-btn.alt{background:transparent;color:#182226}
.cl-btn.cl-wide{flex:1;font-size:19px;min-height:54px}
.cl-solo{margin:18px 0 0;font-size:15px;color:#5a6467;text-align:center}.cl-solo button{background:none;border:0;padding:6px 4px;font:inherit;color:#33464d;text-decoration:underline;cursor:pointer}
.cl-err{color:#a8371f;font-weight:700}
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
  load().then(db=>(q.sid?db.collection('nmth_rooms').doc(q.sid).get().then(d=>d.exists?[d]:[]):db.collection('nmth_rooms').where('code','==',q.code).get().then(r=>r.docs)).then(docs=>{
    const live=docs.map(d=>Object.assign({sid:d.id},d.data())).filter(r=>r.ph!=='closed').sort((a,b)=>(b.at&&b.at.seconds||0)-(a.at&&a.at.seconds||0))[0];
    if(!live){ask(docs.length?'這個任務已經結束了。請看大螢幕上新的任務代碼。':'找不到這個任務。再看一次大螢幕上的數字。');return;}
    const g=live.game||'nmth';
    if(g!==O.game){const G=GAMES[g]||GAMES.nmth;if(q.link){location.replace(G.page+'?k='+live.sid);return;}ui(`<h2>這個代碼是另一個遊戲的</h2><p>老師發的任務是「${esc(G.n)}」。</p><div class="cl-row"><a class="cl-btn" style="text-decoration:none;display:inline-grid;place-items:center" href="${G.page}?k=${live.sid}">去那個遊戲</a><button class="cl-btn alt" id="clBack">重新輸入</button></div>`);box.querySelector('#clBack').onclick=()=>ask();return;}
    if(!sess||sess.sid!==live.sid){sess={sid:live.sid,code:live.code||'',label:live.label||'',seat:0,on:0};keep();try{O.onJoin&&O.onJoin(sess);}catch(e){}}
    sess.seat?wait():seat();}))
   .catch(()=>ask('連不上網路，沒辦法接老師的任務。可以先按「自己玩」。'));}
function seat(){const sid=sess.sid;let taken={};
  const draw=()=>{ui(`<h2>按下你的座號</h2><p class="cl-sub">${esc(sess.label)}　灰色的已經有人選了，按錯請舉手</p><div class="cl-seats">${[...Array(35)].map((_,i)=>{const n=i+1,tk=taken[n]&&taken[n]!==cid;return `<button data-n="${n}" ${tk?'disabled':''}>${n}</button>`;}).join('')}</div>`);
   box.querySelectorAll('.cl-seats button').forEach(b=>b.onclick=()=>{sess.seat=+b.dataset.n;sess.on=0;keep();push();wait();});};
  draw();off();unsub.push(db.collection('nmth_live').where('sid','==',sid).onSnapshot(q=>{taken={};q.forEach(d=>{const v=d.data();taken[v.seat]=v.cid;});if(sess&&!sess.seat)draw();},()=>{}));}
function wait(quiet){const sid=sess.sid;off();
  if(!quiet){sess.on=0;keep();ui(`<div class="cl-big">${sess.seat}</div><h2 class="cl-c">${sess.seat} 號，你進大廳了</h2><p class="cl-c">看看大螢幕上有沒有你的座號。等老師按開始。</p><div class="cl-row c"><button class="cl-btn alt" id="clRe">選錯座號了</button></div>`);
   box.querySelector('#clRe').onclick=()=>{const old=sess.seat;sess.seat=0;keep();db.collection('nmth_live').doc(sid+'_'+old).set({sid,seat:old,cid:'',mode:'c',cur:'left',d:'[]',done:0,stars:0,miss:0,t:0,notes:0,at:firebase.firestore.FieldValue.serverTimestamp()}).catch(()=>{});seat();};}
  unsub.push(db.collection('nmth_rooms').doc(sid).onSnapshot(d=>{if(!sess)return;const r=d.exists?d.data():{ph:'closed'};
   if(r.ph==='closed'){const was=sess.on;if(was)push();off();sess=null;keep();try{O.onClosed&&O.onClosed(was);}catch(e){}if(!was)ask('這個任務已經結束了。');return;}
   if(r.ph==='play'&&!sess.on){sess.on=1;keep();hide();try{O.onStart&&O.onStart(sess);}catch(e){}touch();}},()=>{}));
  unsub.push(db.collection('nmth_live').doc(sid+'_'+sess.seat).onSnapshot(d=>{if(sess&&sess.seat&&!sess.on&&d.exists&&d.data().cid!==cid){sess.seat=0;keep();seat();}},()=>{}));}
return {
  /* o: {game, store, snapshot(), onJoin(sess), onStart(sess), onClosed(wasPlaying)} */
  init(o){O=o;try{sess=JSON.parse(localStorage.getItem(o.store)||'null');}catch(e){sess=null;}
   if(KQ&&sess&&sess.sid!==KQ){sess=null;keep();}
   if(!KQ&&KC&&sess&&sess.code!==KC){sess=null;keep();}
   if(sess&&sess.on){load().then(()=>wait(true)).catch(()=>{});return 'playing';}
   return sess||KQ||KC?'join':'';},
  /* call after the player has typed a name: join by link, rejoin, or ask for the code */
  begin(){if(sess&&sess.on)return;if(KQ)join({sid:KQ,link:1});else if(sess)join({sid:sess.sid});else if(KC)join({code:KC,link:1});else ask();},
  ask,touch,push,sess:()=>sess,leave(){off();sess=null;keep();},link:KQ};
})();
