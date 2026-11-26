/* 走進 1650 年代的大員 — 3D scene (three.js r128)
   Layout follows the schematic 17th-century Taijiang map used in the 1661 navigator game
   (720 x 480 map units). This is an illustrative reconstruction, not a survey. */
(function(){
'use strict';
const box=document.getElementById('t3Box');if(!box)return;
const THREE_URL='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
let started=false;
function load(){if(started)return;started=true;
  const s=document.createElement('script');s.src=THREE_URL;s.onload=()=>{try{init();}catch(e){fail(e);}};s.onerror=()=>fail();document.head.appendChild(s);}
function fail(){box.classList.add('t3-fail');document.getElementById('t3Msg').innerHTML='這台電腦或瀏覽器沒辦法顯示 3D 畫面。可以換一台電腦、或改用 Chrome 再試一次；下面的說明卡片一樣可以點開閱讀。';}
const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();load();}},{rootMargin:'300px'});io.observe(box);

/* ---------- facts for hotspots ---------- */
const SPOTS={
 zee:{n:'熱蘭遮城',x:320,y:262,h:9,cam:[-26,22,44],
  p:'1624 年荷蘭人來到大員，在沙洲上蓋城，後來擴建成堅固的<b>熱蘭遮城</b>。城的四個角有突出去的<b>稜堡</b>，敵人不管從哪一邊靠近，大砲都能從側面射擊。今天臺南的<b>安平古堡</b>就在它的遺址上。'},
 town:{n:'大員市鎮',x:346,y:300,h:4,cam:[18,16,40],
  p:'城堡旁邊的沙洲上有一條條街道，住著漢人和荷蘭人，有商店、市場和公司的倉庫。中國來的<b>生絲、瓷器</b>，臺灣的<b>鹿皮、蔗糖</b>，都在這裡買賣、裝箱。'},
 road:{n:'大員港道',x:262,y:268,h:3,cam:[-50,18,10],
  p:'大員港道比較深，是荷蘭船進出的主要水道，所以荷蘭人把城蓋在這裡守著。大船常常停在外海，再用小船把貨物運進港。'},
 lagoon:{n:'台江內海',x:450,y:170,h:2,cam:[20,40,-30],
  p:'西邊一長串沙洲擋住大浪，裡面是平靜的<b>台江內海</b>，小船可以來回載貨。今天的<b>安南區</b>（海佃國小所在的地方），那時候都在這片海裡！後來河流帶來的泥沙慢慢把內海填平。'},
 lue:{n:'鹿耳門',x:196,y:124,h:2,cam:[-70,20,-40],
  p:'<b>鹿耳門</b>水道很淺，還有沙洲，平常大船很難通過，所以荷蘭人在這裡防守得比較少。1661 年 4 月，鄭成功的船隊趁著<b>漲潮</b>，從這裡開進了台江內海。'},
 bxw:{n:'北線尾',x:244,y:176,h:2,cam:[-60,24,-10],
  p:'大員北邊的一條沙洲。1661 年鄭成功的軍隊開進內海以後，在這裡登陸，和荷蘭軍隊打了一仗。'},
 prov:{n:'普羅民遮城（赤崁）',x:612,y:262,h:7,cam:[60,22,40],
  p:'1652 年郭懷一事件以後，荷蘭人覺得赤崁不安全，就在這裡蓋了<b>普羅民遮城</b>，也就是今天的<b>赤崁樓</b>。1661 年 4 月，它是最先向鄭成功投降的城堡。'},
 junk:{n:'中國帆船（戎克船）',x:470,y:236,h:4,cam:[50,14,10],
  p:'福建的商人駕著帆布有一條條竹骨的<b>戎克船</b>，載著生絲、瓷器渡過臺灣海峽，到大員和荷蘭人做生意，回程再載走鹿皮和蔗糖。'}};

function init(){
 const T=window.THREE;
 const cv=document.createElement('canvas');cv.className='t3-cv';box.prepend(cv);
 let R;try{R=new T.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});}catch(e){fail();return;}
 R.setPixelRatio(Math.min(2,window.devicePixelRatio||1));R.shadowMap.enabled=true;R.shadowMap.type=T.PCFSoftShadowMap;
 const S=new T.Scene();S.background=new T.Color(0xa9cfe3);S.fog=new T.Fog(0xa9cfe3,150,340);
 const C=new T.PerspectiveCamera(42,1,0.5,900);
 S.add(new T.HemisphereLight(0xeaf3ff,0x5d6b48,0.55));
 const sun=new T.DirectionalLight(0xfff1d6,0.85);sun.position.set(-80,120,60);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
 Object.assign(sun.shadow.camera,{left:-110,right:110,top:90,bottom:-90,near:10,far:400});S.add(sun);
 const W=(x,y)=>[(x-360)*0.25,(y-240)*0.25];   // map px -> world x,z

 /* ---- svg-ish path -> THREE.Shape (M L Q Z only) ---- */
 function shape(d){const sh=new T.Shape();const t=d.match(/[MLQZ]|-?\d+(\.\d+)?/g);let i=0,cmd;
  const P=()=>{const x=+t[i++],y=+t[i++];const w=W(x,y);return [w[0],-w[1]];};
  while(i<t.length){if(/[MLQZ]/.test(t[i]))cmd=t[i++];
   if(cmd==='M'){const p=P();sh.moveTo(p[0],p[1]);}else if(cmd==='L'){const p=P();sh.lineTo(p[0],p[1]);}
   else if(cmd==='Q'){const a=P(),b=P();sh.quadraticCurveTo(a[0],a[1],b[0],b[1]);}else if(cmd==='Z'){sh.closePath();}}
  return sh;}
 function slab(d,h,mat,y0=0,bev=true){const g=new T.ExtrudeGeometry(shape(d),{depth:h,bevelEnabled:bev,bevelThickness:0.25,bevelSize:0.6,bevelSegments:2,curveSegments:24});
  g.rotateX(-Math.PI/2);const m=new T.Mesh(g,mat);m.position.y=y0;m.receiveShadow=true;S.add(m);return m;}
 const mat=(c,o={})=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:.92,metalness:0},o));

 /* ---- sea with gentle waves ---- */
 const seaG=new T.PlaneGeometry(700,700,90,90);seaG.rotateX(-Math.PI/2);
 const seaM=mat(0x1f6f99,{roughness:.3,metalness:.1,flatShading:true});const sea=new T.Mesh(seaG,seaM);sea.position.y=-0.95;sea.receiveShadow=true;S.add(sea);
 const seaPos=seaG.attributes.position,seaBase=Float32Array.from(seaPos.array);
 // lagoon (calmer, lighter water)
 const lag=slab('M150 0 L566 0 Q600 80 586 150 Q608 210 590 262 Q602 330 556 382 Q520 440 476 480 L392 480 Q350 410 334 330 Q326 290 304 262 L296 230 Q250 180 205 140 Z',0.05,mat(0x3b8eab,{roughness:.3}),-0.35,false);lag.receiveShadow=true;
 // shoals near Luermen (just under water)
 [[205,132,26,12],[232,150,22,9],[180,118,16,8],[262,168,20,8],[218,112,14,7]].forEach(([x,y,rx,ry])=>{const g=new T.CircleGeometry(1,28);g.rotateX(-Math.PI/2);const m=new T.Mesh(g,mat(0xd8cf9e,{transparent:true,opacity:.55}));const w=W(x,y);m.position.set(w[0],-0.25,w[1]);m.scale.set(rx*0.25,1,ry*0.25);S.add(m);});
 // land and sandbars
 const land=slab('M566 0 L760 0 L760 480 L476 480 Q520 440 556 382 Q602 330 590 262 Q608 210 586 150 Q600 80 566 0 Z',1.6,mat(0x6b9150),-0.6);
 const SAND=mat(0xdcc58a);
 slab('M112 0 L146 0 Q174 58 192 108 Q188 118 180 114 Q156 58 112 0 Z',0.9,SAND,-0.6);
 slab('M214 142 Q248 168 282 204 Q279 213 270 211 Q236 182 207 150 Q205 142 214 142 Z',0.9,SAND,-0.6);
 slab('M300 246 Q326 242 336 262 Q346 300 354 340 Q368 400 394 480 L374 480 Q350 410 337 352 Q328 302 307 270 Q296 256 300 246 Z',0.9,SAND,-0.6);

 /* ---- instanced trees on the mainland and a few on sandbars ---- */
 function inside(d,x,y){const sh=shape(d).getPoints(40);let c=false;const p=[...W(x,y)];p[1]=-p[1];for(let i=0,j=sh.length-1;i<sh.length;j=i++){const a=sh[i],b=sh[j];if(((a.y>p[1])!==(b.y>p[1]))&&(p[0]<(b.x-a.x)*(p[1]-a.y)/(b.y-a.y)+a.x))c=!c;}return c;}
 const LANDD='M566 0 L760 0 L760 480 L476 480 Q520 440 556 382 Q602 330 590 262 Q608 210 586 150 Q600 80 566 0 Z';
 const tg=new T.ConeGeometry(1.1,3.2,7);tg.translate(0,1.6,0);const trunk=new T.CylinderGeometry(.18,.22,1,5);trunk.translate(0,.5,0);
 const N=420;const trees=new T.InstancedMesh(tg,mat(0x4f7d3a,{flatShading:true}),N),stems=new T.InstancedMesh(trunk,mat(0x6b4b2a),N);trees.castShadow=true;
 const dm=new T.Object3D();let k=0,seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
 while(k<N){const x=560+rnd()*200,y=rnd()*480;if(!inside(LANDD,x,y))continue;if(Math.hypot(x-612,y-262)<34)continue;const w=W(x,y),s=.7+rnd()*.9;dm.position.set(w[0],1.2,w[1]);dm.rotation.y=rnd()*6;dm.scale.set(s,s*(.8+rnd()*.5),s);dm.updateMatrix();trees.setMatrixAt(k,dm.matrix);dm.position.y=0.9;dm.updateMatrix();stems.setMatrixAt(k,dm.matrix);k++;}
 S.add(trees,stems);
 // farm fields (rice / sugarcane) near Chikan
 for(let i=0;i<18;i++){const w=W(626+(i%6)*16,300+Math.floor(i/6)*14);const f=new T.Mesh(new T.BoxGeometry(3.6,0.05,3),mat(i%3?0xb9d47e:0x9fc56a));f.position.set(w[0],1.27,w[1]);f.receiveShadow=true;S.add(f);}

 /* ---- buildings ---- */
 const BRICK=mat(0xa4542f),BRICKD=mat(0x7f3f22),LIME=mat(0xd9cfb8),ROOF=mat(0xa63b2a),WOOD=mat(0x6b4b2a),DARK=mat(0x3a2c22);
 const box3=(w,h,d,m,x,y,z,ry=0)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.rotation.y=ry;o.castShadow=o.receiveShadow=true;return o;};
 function roof(w,d,h,m){const g=new T.CylinderGeometry(0,Math.SQRT1_2,1,4,1);g.rotateY(Math.PI/4);g.scale(w,h,d);const o=new T.Mesh(g,m);o.castShadow=true;return o;}
 function flag(colors){const g=new T.Group();g.add(box3(.12,4.5,.12,WOOD,0,2.25,0));colors.forEach((c,i)=>g.add(box3(2.2,.38,.04,mat(c,{side:T.DoubleSide}),1.15,4.2-i*.38,0)));return g;}
 // Fort Zeelandia: upper castle with four bastions + lower castle
 const zee=new T.Group();const zw=W(320,262);zee.position.set(zw[0],0.3,zw[1]);zee.rotation.y=-0.35;
 zee.add(box3(13,1,11,LIME,2,0.5,1.5));                        // terrace
 zee.add(box3(8,3.2,8,BRICK,0,2.6,0));                          // upper castle walls
 [[-4,-4],[4,-4],[4,4],[-4,4]].forEach(([x,z])=>{const b=box3(3.2,3.6,3.2,BRICKD,x,2.8,z,Math.PI/4);zee.add(b);zee.add(box3(1.1,.5,1.1,BRICK,x,4.85,z,Math.PI/4));});
 zee.add(box3(5,2.2,4,LIME,0,5.3,0));const zr=roof(5.6,4.6,1.8,ROOF);zr.position.set(0,7.3,0);zee.add(zr);
 zee.add(box3(9,2,6,BRICK,6.5,2,4.5));                          // lower castle
 [[11,1.5],[11,7.5]].forEach(([x,z])=>zee.add(box3(2.4,2.4,2.4,BRICKD,x,2.2,z,Math.PI/4)));
 const fz=flag([0xe07a2f,0xffffff,0x2a6fb0]);fz.position.set(0,6.4,-1.6);zee.add(fz);S.add(zee);
 // guns on bastions
 [[-4,-4],[4,-4],[4,4],[-4,4]].forEach(([x,z])=>{const g=new T.Mesh(new T.CylinderGeometry(.18,.22,1.6,8),DARK);g.rotation.z=Math.PI/2;g.position.set(zw[0]+x*1.05,5.3,zw[1]+z*1.05);S.add(g);});
 // Tayouan town: rows of houses
 for(let r=0;r<4;r++)for(let c=0;c<5;c++){const w=W(338+c*6+r*3,288+r*9);if(!inside('M300 246 Q326 242 336 262 Q346 300 354 340 Q368 400 394 480 L374 480 Q350 410 337 352 Q328 302 307 270 Q296 256 300 246 Z',338+c*6+r*3,288+r*9))continue;
  const h=box3(1.6,1.1,1.3,c%2?LIME:mat(0xd8c9a6),w[0],0.85,w[1],-0.35);S.add(h);const rf=roof(1.9,1.6,.8,c%3?ROOF:mat(0x5d5248));rf.position.set(w[0],1.8,w[1]);rf.rotation.y=-0.35;S.add(rf);}
 // Fort Provintia
 const prov=new T.Group();const pw=W(612,262);prov.position.set(pw[0],1.0,pw[1]);
 prov.add(box3(7,.6,7,LIME,0,.3,0));prov.add(box3(5,2.6,4,mat(0xd7c4a3),0,1.9,0));const pr=roof(5.8,4.8,2,ROOF);pr.position.set(0,4.2,0);prov.add(pr);
 [[-3.2,-3.2],[3.2,-3.2],[3.2,3.2],[-3.2,3.2]].forEach(([x,z])=>prov.add(box3(1.2,1.6,1.2,BRICKD,x,1.1,z,Math.PI/4)));
 const fp=flag([0xe07a2f,0xffffff,0x2a6fb0]);fp.position.set(2.6,0.6,0);prov.add(fp);S.add(prov);
 // Chikan village
 for(let i=0;i<14;i++){const w=W(580+(i%5)*9+(i>9?4:0),224+Math.floor(i/5)*9);const h=box3(1.4,1,1.2,mat(0xcdb99a),w[0],1.5,w[1],rnd());S.add(h);const rf=roof(1.7,1.5,.7,mat(0x6d5a4a));rf.position.set(w[0],2.35,w[1]);rf.rotation.y=h.rotation.y;S.add(rf);}

 /* ---- ships ---- */
 function fluyt(){const g=new T.Group();const hull=new T.Mesh(new T.BoxGeometry(7,1.4,2.2),mat(0x4a3424));hull.position.y=.4;hull.castShadow=true;g.add(hull);
  g.add(box3(1.8,1.2,2,mat(0x5a4030),-3,1.6,0));
  [-1.8,0.6,2.6].forEach((x,i)=>{g.add(box3(.15,6-i*.8,.15,WOOD,x,3.6-i*.4,0));const sl=new T.Mesh(new T.PlaneGeometry(2.2-i*.3,2.6-i*.4),mat(0xf3eee0,{side:T.DoubleSide}));sl.position.set(x,3.8-i*.4,0.15);sl.rotation.y=Math.PI/2-0.55;sl.castShadow=true;g.add(sl);});
  const f=flag([0xe07a2f,0xffffff,0x2a6fb0]);f.scale.setScalar(.45);f.position.set(-3.4,2.2,0);g.add(f);return g;}
 function junk(sail){const g=new T.Group();const hull=new T.Mesh(new T.BoxGeometry(5,1.1,1.8),mat(0x7a4a22));hull.position.y=.3;hull.castShadow=true;g.add(hull);g.add(box3(1.2,.9,1.7,mat(0x8a5a32),-2,1.2,0));
  [[-0.6,4.2,2.4],[1.4,3.2,1.8]].forEach(([x,h,w])=>{g.add(box3(.14,h,.14,WOOD,x,h/2+.4,0));const s=new T.Mesh(new T.PlaneGeometry(w,h*.7),mat(sail,{side:T.DoubleSide}));s.position.set(x-w*.35,h*.55+.4,.12);s.castShadow=true;g.add(s);
   for(let b=0;b<4;b++){const bt=box3(w,.06,.05,WOOD,x-w*.35,h*.3+.4+b*h*.14,.16);g.add(bt);}});return g;}
 const ships=[];
 [[288,232,0.4],[354,232,-0.2],[250,300,0.9],[232,262,1.2]].forEach(([x,y,r])=>{const s=fluyt();const w=W(x,y);s.position.set(w[0],-0.3,w[1]);s.rotation.y=r;S.add(s);ships.push({o:s,ph:x*.1});});
 const junks=[];const JP=[[[470,236],[540,200],[430,150],[380,220]],[[420,300],[500,330],[560,260],[460,260]],[[400,120],[470,80],[520,140],[440,170]]];
 JP.forEach((path,i)=>{const j=junk(i%2?0xb5442c:0xd4a03c);S.add(j);const pts=path.map(p=>{const w=W(p[0],p[1]);return new T.Vector3(w[0],-0.25,w[1]);});junks.push({o:j,c:new T.CatmullRomCurve3(pts,true),t:i*.3,sp:.012+i*.003});});
 // Zheng fleet (hidden until 1661 mode)
 const zfleet=[];const ZP=[[20,190],[60,200],[150,150],[196,124],[240,150],[330,170],[450,200],[560,232]].map(p=>{const w=W(p[0],p[1]);return new T.Vector3(w[0],-0.25,w[1]);});const zc=new T.CatmullRomCurve3(ZP);
 for(let i=0;i<9;i++){const j=junk(i%3?0xc0392b:0xe0b04a);j.scale.setScalar(1.15);j.visible=false;S.add(j);zfleet.push({o:j,off:i*.045});}

 /* ---- hotspots (HTML overlay) ---- */
 const tags=document.getElementById('t3Tags');tags.innerHTML='';
 const HS=Object.entries(SPOTS).map(([k,s])=>{const b=document.createElement('button');b.type='button';b.className='t3-tag';b.dataset.k=k;b.innerHTML=`<i></i>${s.n}`;tags.appendChild(b);const w=W(s.x,s.y);return {k,b,v:new T.Vector3(w[0],s.h,w[1]),s};});
 const info=document.getElementById('t3Info');
 /* ---- camera control (orbit) ---- */
 let tgt=new T.Vector3(0,0,8),az=-0.75,el=0.48,dist=120,goal=null,idle=0;
 const camAt=()=>{C.position.set(tgt.x+dist*Math.cos(el)*Math.sin(az),tgt.y+dist*Math.sin(el),tgt.z+dist*Math.cos(el)*Math.cos(az));C.lookAt(tgt);};
 function fly(k){const s=SPOTS[k];const w=W(s.x,s.y);const c=new T.Vector3(...s.cam);goal={t:new T.Vector3(w[0],s.h*.4,w[1]),az:Math.atan2(c.x,c.z),el:Math.max(.2,Math.atan2(c.y,Math.hypot(c.x,c.z))),d:Math.max(28,c.length()*.75)};
  info.innerHTML=`<button type="button" class="t3-x" aria-label="關閉">×</button><h3>${s.n}</h3><p>${s.p}</p>`;info.hidden=false;info.querySelector('.t3-x').onclick=()=>{info.hidden=true;};
  HS.forEach(h=>h.b.classList.toggle('on',h.k===k));idle=0;}
 tags.addEventListener('click',e=>{const b=e.target.closest('[data-k]');if(b)fly(b.dataset.k);});
 const P=new Map();let pinch=0;
 cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);P.set(e.pointerId,[e.clientX,e.clientY]);goal=null;idle=0;if(P.size===2){const [a,b]=[...P.values()];pinch=Math.hypot(a[0]-b[0],a[1]-b[1]);}});
 cv.addEventListener('pointermove',e=>{if(!P.has(e.pointerId))return;const o=P.get(e.pointerId);P.set(e.pointerId,[e.clientX,e.clientY]);idle=0;
  if(P.size===2){const [a,b]=[...P.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinch)dist=Math.min(260,Math.max(18,dist*pinch/d));pinch=d;return;}
  const dx=e.clientX-o[0],dy=e.clientY-o[1];
  if(e.shiftKey||e.buttons===2){const s=dist/600;tgt.x-=(Math.cos(az)*dx-Math.sin(az)*dy*1.4)*s;tgt.z-=(-Math.sin(az)*dx-Math.cos(az)*dy*1.4)*s;}
  else{az-=dx*0.006;el=Math.min(1.35,Math.max(0.12,el+dy*0.004));}});
 const up=e=>{P.delete(e.pointerId);if(P.size<2)pinch=0;};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);cv.addEventListener('contextmenu',e=>e.preventDefault());
 cv.addEventListener('wheel',e=>{if(!box.matches(':hover'))return;e.preventDefault();goal=null;dist=Math.min(260,Math.max(18,dist*(e.deltaY>0?1.1:0.9)));},{passive:false});
 const Z=(f)=>{goal=null;dist=Math.min(260,Math.max(18,dist*f));};
 document.getElementById('t3In').onclick=()=>Z(.8);document.getElementById('t3Out').onclick=()=>Z(1.25);
 document.getElementById('t3Home').onclick=()=>{goal={t:new T.Vector3(0,0,8),az:-0.75,el:0.48,d:120};info.hidden=true;HS.forEach(h=>h.b.classList.remove('on'));};
 // tour
 const ORDER=['lagoon','zee','town','road','junk','prov','bxw','lue'];let tourI=-1,tourT=null;
 document.getElementById('t3Tour').onclick=function(){if(tourT){clearInterval(tourT);tourT=null;this.textContent='▶ 自動導覽';return;}this.textContent='⏸ 停止導覽';tourI=-1;const nx=()=>{tourI=(tourI+1)%ORDER.length;fly(ORDER[tourI]);};nx();tourT=setInterval(nx,7000);};
 // 1661 mode
 let mode=1655,zt=0;const yrBtns=[...document.querySelectorAll('#t3Year [data-y]')];
 yrBtns.forEach(b=>b.onclick=()=>{mode=+b.dataset.y;yrBtns.forEach(x=>x.setAttribute('aria-pressed',x===b));zt=0;
  zfleet.forEach(z=>z.o.visible=mode===1661);document.getElementById('t3Cap').textContent=mode===1661?'1661 年 4 月：鄭成功的船隊趁漲潮通過鹿耳門，開進台江內海':'1650 年代的大員：荷蘭東印度公司的貿易港';
  if(mode===1661)fly('lue');});

 /* ---- resize & loop ---- */
 const size=()=>{const w=box.clientWidth,h=box.clientHeight;R.setSize(w,h,false);C.aspect=w/h;C.updateProjectionMatrix();};size();
 if(window.ResizeObserver)new ResizeObserver(size).observe(box);else addEventListener('resize',size);
 let visible=true;new IntersectionObserver(es=>{visible=es[0].isIntersecting;}).observe(box);
 const v=new T.Vector3();let t0=performance.now();document.getElementById('t3Msg').hidden=true;box.classList.add('t3-ready');
 function loop(now){requestAnimationFrame(loop);if(!visible||document.hidden)return;const dt=Math.max(0,Math.min(.05,(now-t0)/1000));t0=now;const t=now/1000;
  // waves (outer sea only; cheap)
  for(let i=0;i<seaPos.count;i++){const x=seaBase[i*3],z=seaBase[i*3+2];seaPos.array[i*3+1]=Math.sin(x*.08+t*1.1)*.14+Math.cos(z*.11+t*.8)*.12;}seaPos.needsUpdate=true;seaG.computeVertexNormals();
  ships.forEach(s=>{s.o.position.y=-0.3+Math.sin(t*1.3+s.ph)*.12;s.o.rotation.z=Math.sin(t*1.1+s.ph)*.03;});
  junks.forEach(j=>{j.t=(j.t+j.sp*dt)%1;const p=j.c.getPointAt(j.t),q=j.c.getPointAt((j.t+.01)%1);j.o.position.copy(p);j.o.lookAt(q);j.o.rotateY(-Math.PI/2);j.o.position.y=-0.25+Math.sin(t*2+j.sp*100)*.08;});
  if(mode===1661){zt=Math.min(1.4,zt+dt*0.06);zfleet.forEach(z=>{const u=Math.max(0,Math.min(1,zt-z.off));const p=zc.getPointAt(u),q=zc.getPointAt(Math.min(1,u+.01));z.o.position.copy(p);if(u<0.999){z.o.lookAt(q);z.o.rotateY(-Math.PI/2);}z.o.position.y=-0.25+Math.sin(t*2+z.off*50)*.08;});}
  if(goal){const k=1-Math.pow(0.04,dt);tgt.lerp(goal.t,k);let da=goal.az-az;while(da>Math.PI)da-=2*Math.PI;while(da<-Math.PI)da+=2*Math.PI;az+=da*k;el+=(goal.el-el)*k;dist+=(goal.d-dist)*k;if(Math.abs(dist-goal.d)<.3&&Math.abs(da)<.003)goal=null;}
  else{idle+=dt;if(idle>8&&!tourT)az+=dt*0.04;}
  camAt();R.render(S,C);
  const w=box.clientWidth,h=box.clientHeight;HS.forEach(hs=>{v.copy(hs.v).project(C);const on=v.z<1&&Math.abs(v.x)<1.05&&Math.abs(v.y)<1.05;hs.b.style.display=on?'':'none';if(on)hs.b.style.transform=`translate(${(v.x*.5+.5)*w}px,${(-v.y*.5+.5)*h}px) translate(-50%,-100%)`;});}
 requestAnimationFrame(loop);
}
})();
