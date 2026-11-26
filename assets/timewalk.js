/* 史料實境：走進 400 年前的大員港 — 用真正的十七世紀古圖探險 */
(function(){
const root=document.getElementById('twApp');if(!root)return;
const C='https://upload.wikimedia.org/wikipedia/commons/';
const ACTS=[
{key:'a1',stamp:'港',name:'第一站 1626 大員港',title:'1626 年：西班牙人偷偷畫的大員港',
 lo:C+'thumb/4/43/Description_of_the_Dutch_port_on_Formosa_Island_%28Taiwan%29%2C_drawing_1626.jpg/1920px-Description_of_the_Dutch_port_on_Formosa_Island_%28Taiwan%29%2C_drawing_1626.jpg',
 hi:C+'thumb/4/43/Description_of_the_Dutch_port_on_Formosa_Island_%28Taiwan%29%2C_drawing_1626.jpg/3840px-Description_of_the_Dutch_port_on_Formosa_Island_%28Taiwan%29%2C_drawing_1626.jpg',
 w:1920,h:1380,
 intro:'荷蘭人來到大員才兩年，對手西班牙人就畫了這張「情報地圖」。注意：這張圖的<strong>上方是東邊</strong>，下方是西邊的大海（臺灣海峽）。',
 src:{who:'西班牙人（傳為 Pedro de Vera 繪）',when:'約 1626 年',where:'西班牙馬德里海軍博物館（現在看到的是後來的抄本）',page:'https://commons.wikimedia.org/wiki/File:Description_of_the_Dutch_port_on_Formosa_Island_(Taiwan),_drawing_1626.jpg'},
 spots:[
  {id:'fort',x:66,y:74.5,t:'荷蘭人的城堡',orig:'Fuerça del Olandes puesta en un alto',zh:'荷蘭人的城堡，蓋在高處',
   p:'1624 年荷蘭人來到大員，在這個沙洲的高處蓋城堡。這座城堡後來叫做<strong>熱蘭遮城</strong>，就是今天臺南的<strong>安平古堡</strong>。'},
  {id:'guns',x:55,y:71,t:'入口的 6 門小砲',orig:'En esta punta están puestas 6 piezas pequeñas de la entrada',zh:'這個岬角上放了 6 門守入口的小砲',
   p:'船要進港，一定要經過這個狹窄的入口。在這裡放大砲，就能管住誰可以進來。'},
  {id:'ships',x:39,y:48,t:'港裡的荷蘭大帆船',orig:'Aquí dentro es el fondo de 4 brazas',zh:'這裡面水深 4 噚（大約 7 公尺）',
   p:'西班牙人特別記下港內的水深，是要知道<strong>大船能不能開進來</strong>。這是一份打仗用的情報。'},
  {id:'junk',x:24,y:87,t:'中國帆船',
   p:'這種帆船從福建開過來，載著生絲、瓷器來大員交易。荷蘭人再把這些貨運去日本和巴達維亞（今天的雅加達）賣。'},
  {id:'note',x:9.5,y:60,t:'地圖上的人數說明',orig:'Ay en todo esto 220 Olandeses … Ay también 5U000 chinas y 160 japones',zh:'這裡一共有 220 個荷蘭人……還有 5000 個中國人和 160 個日本人',
   p:'220 個荷蘭人裡，城堡 100 人、農場的小堡 10 人、商館 8 人，其他在船上。（5U000 的 U 是西班牙舊寫法的「千」）。<br>想一想：人數最多的是誰？'},
  {id:'fac',x:25,y:59,t:'荷蘭人的商館',orig:'Fatoria del Olandes',zh:'荷蘭人的商館',
   p:'商館就是做生意、存放貨物的地方。紅色的圍牆把它圍起來保護。'},
  {id:'jp',x:13,y:49,t:'日本人住的地方',orig:'Lugar de los japones',zh:'日本人住的地方',
   p:'那時候日本商人也來大員買生絲和鹿皮。荷蘭人想向他們收稅，雙方還吵過架。'},
  {id:'hunt',x:84,y:42,t:'原住民在打獵',orig:'Campaña de caza',zh:'打獵的原野',
   p:'畫裡的人拿著長矛在追鹿。原住民打到的鹿，鹿皮會賣給漢人和荷蘭人，再運到日本做成武士的衣物和用品。'},
  {id:'vil',x:9,y:36,t:'原住民的村子',orig:'… de los naturales',zh:'……原住民的（村子）',
   p:'圖的左上方畫了好幾個村子，旁邊都寫著「原住民的」。這一帶住的是<strong>西拉雅族</strong>。'},
  {id:'sak',x:66,y:24,t:'對岸的赤崁',orig:'Chacam, lugar de chinos pescadores y ladrones',zh:'赤崁，中國漁民和盜賊住的地方',
   p:'對岸是赤崁（今天臺南市區）。旁邊還畫了荷蘭人的小堡和養牛的地方。<br><strong>小心！</strong>「盜賊」是西班牙人的說法，他們和荷蘭人、漢人海商是競爭對手。'}
 ],
 tasks:[{q:'找到荷蘭人的城堡',a:'fort'},{q:'找到地圖上寫的人數',a:'note'},{q:'找到原住民在做什麼',a:'hunt'}],
 quiz:{q:'照這張地圖的說明，住在大員一帶、人數最多的是哪一群人？',o:['從中國來的漢人（約 5000 人）','荷蘭人（220 人）','日本人（160 人）'],a:0,
  e:'荷蘭人雖然管理這裡，但人數很少。來做生意、捕魚、後來種田的，大多是從福建來的漢人。'}},
{key:'a2',stamp:'城',name:'第二站 熱蘭遮城與市鎮',title:'約 1670 年出版：熱蘭遮城和大員市鎮',
 lo:C+'thumb/1/13/AMH-6844-KB_View_of_city_and_Fort_Zeelandia_on_Taiwan.jpg/1920px-AMH-6844-KB_View_of_city_and_Fort_Zeelandia_on_Taiwan.jpg',
 hi:C+'1/13/AMH-6844-KB_View_of_city_and_Fort_Zeelandia_on_Taiwan.jpg',
 w:1920,h:1575,
 intro:'這是從海上看大員的版畫。圖的最上面有一排說明，A 到 L 分別是：長官的房子、教堂、秤重所、打鐵鋪、法院、肉市場、市場、監獄、住宿區、小堡和城堡。',
 src:{who:'荷蘭出版商 Jacob van Meurs，收在 Olfert Dapper 寫的中國見聞書裡',when:'約 1670 年出版',where:'荷蘭',page:'https://commons.wikimedia.org/wiki/File:AMH-6844-KB_View_of_city_and_Fort_Zeelandia_on_Taiwan.jpg'},
 spots:[
  {id:'castle',x:60.5,y:60,t:'熱蘭遮城',orig:"L. 't Casteel",zh:'L. 城堡',
   p:'掛著旗子的就是熱蘭遮城。城牆一層一層，越裡面越高，是荷蘭人在臺灣最重要的據點，長官就在這裡辦公。'},
  {id:'town',x:22,y:66,t:'大員市鎮',orig:'Stadt … Zelandia',zh:'熱蘭遮市鎮',
   p:'城堡旁邊有一整條街的房子，住了很多漢人商人。說明裡列出的教堂、市場、法院、監獄，就在這一帶。這裡像一個熱鬧的小城市。'},
  {id:'ind',x:92.5,y:51.5,t:'荷蘭東印度公司的大船',
   p:'圖片說明寫著：右邊是東印度公司的大帆船。它們從巴達維亞開來，再把貨物運往日本或歐洲。'},
  {id:'junk2',x:9.5,y:85,t:'中國帆船',
   p:'左下角這艘大帆船有好幾面四方形的帆，是中國式的帆船。港裡還停了很多艘。'},
  {id:'bar',x:86,y:63,t:'彎彎的沙洲',
   p:'大員本來是台江內海外面的一個<strong>沙洲島</strong>。後來泥沙越積越多，今天已經和陸地連在一起，就是臺南的安平。'},
  {id:'mt',x:11,y:47,t:'對面的山',
   p:'隔著台江內海，遠方就是臺灣本島。畫家把山畫得很高很近，跟真實的樣子不太一樣。'},
  {id:'boat',x:34,y:80,t:'划槳的小船',
   p:'大船吃水深，不能直接靠岸，要靠小船在大船和岸邊之間來回載人、載貨。'},
  {id:'net',x:31,y:92,t:'岸邊的漁網',
   p:'前面淺水的地方架著漁網。除了做大生意，也有人靠捕魚過日子。'}
 ],
 tasks:[{q:'找到熱蘭遮城',a:'castle'},{q:'找到從遠方來的東印度公司大船',a:'ind'},{q:'找到漢人住的大員市鎮',a:'town'}],
 quiz:{q:'為什麼熱蘭遮城要蓋在沙洲上、靠近港口的入口？',o:['可以管住進出台江內海的船','沙洲上的土最適合種田','離原住民的村子最近'],a:0,
  e:'城堡守在入口，所有進出的船都看得到、管得到。這樣荷蘭人才能控制貿易、收稅。'}},
{key:'a3',stamp:'戰',name:'第三站 1661 圍城',title:'1661 年：鄭成功包圍熱蘭遮城',
 lo:C+'8/84/Herport_Albrecht_Zeelandia_1669.jpg',hi:null,w:1201,h:945,
 intro:'畫圖的人叫赫波特（Albrecht Herport），是瑞士人，1661 年正在臺灣替荷蘭東印度公司當兵。他回到歐洲後，1669 年出書，這張圖就在書裡。圖上的小數字是他標的記號。',
 src:{who:'赫波特（瑞士人，當時在臺灣當兵）',when:'1669 年出版',where:'瑞士伯恩',page:'https://commons.wikimedia.org/wiki/File:Herport_Albrecht_Zeelandia_1669.jpg'},
 spots:[
  {id:'inset',x:33,y:25,t:'城堡放大圖',
   p:'畫家怕城堡太小看不清楚，另外在上面的布條裡把熱蘭遮城放大畫一次。'},
  {id:'z1',x:60,y:47.5,t:'熱蘭遮城（記號 1）',
   p:'荷蘭人躲在城裡守了大約 <strong>9 個月</strong>。城裡大約有 1700 多人，其中軍人約 900 人。'},
  {id:'z2',x:60.5,y:39.5,t:'烏特勒支堡（記號 2）',
   p:'城堡後面山丘上的小堡。1662 年 1 月，鄭軍用大砲攻下它。從這裡可以直接打進城堡，不久荷蘭人就投降了。'},
  {id:'z3',x:39.7,y:45.5,t:'大員市鎮（記號 3）',
   p:'鄭軍一來就占領了城外的市鎮，把城堡團團圍住。'},
  {id:'z6',x:5,y:21.5,t:'對岸的赤崁（記號 6）',
   p:'對岸赤崁的普羅民遮城（今天的赤崁樓），在鄭軍登陸後沒幾天就投降了。'},
  {id:'z8',x:93.8,y:58,t:'爆炸的大船（記號 8）',
   p:'這是荷蘭人在臺灣最大的戰船赫克托號，被很多艘中國帆船包圍後爆炸沉沒。<br><strong>偵探提醒：</strong>研究者指出，這場海戰其實發生在另一邊的海面，畫家可能是為了讓畫面更精彩才把它畫進來。'},
  {id:'army',x:52,y:85,t:'鄭成功的軍隊',
   p:'前面一排排的是鄭軍，拿著長刀、長矛和弓箭。鄭成功帶了兩萬多名士兵、幾百艘船來到臺灣。'}
 ],
 tasks:[{q:'找到熱蘭遮城（有記號 1）',a:'z1'},{q:'找到正在爆炸的大船',a:'z8'},{q:'找到鄭成功的軍隊',a:'army'}],
 quiz:{q:'1661 年 4 月 30 日鄭軍來到，熱蘭遮城大約守了多久才投降？',o:['大約 9 個月','大約 9 天','大約 9 年'],a:0,
  e:'1661 年 4 月底被包圍，1662 年 2 月初荷蘭人投降，大約 9 個月。之後荷蘭人離開臺灣。'}}
];
const DET=[
 {q:'三張圖裡，哪一張的作者<strong>從來沒有來過臺灣</strong>，是根據別人的說法編出來的？',o:['第二站：Dapper 書裡的熱蘭遮城版畫','第一站：西班牙人的情報地圖','第三站：赫波特的圍城圖'],a:0,
  e:'收藏單位的說明寫著：Dapper 寫了很多外國的書，但他自己<strong>沒有去過</strong>那些地方。所以圖上的山、房子不一定準確。'},
 {q:'哪一張圖把<strong>不在那裡發生的事</strong>也畫了進去，讓畫面更刺激？',o:['第三站：爆炸的赫克托號','第一站：港內的水深','第二站：岸邊的漁網'],a:0,
  e:'赫波特真的在臺灣，但他畫的爆炸大船，海戰其實發生在另一邊。親身經歷的人畫的圖，也可能加油添醋。'},
 {q:'西班牙地圖說赤崁是「漁民和盜賊住的地方」，我們應該怎麼看這句話？',o:['西班牙人是對手，要再找其他史料對照','地圖上寫的一定是真的','古代的東西一定都是假的'],a:0,
  e:'史料會帶著畫圖的人的立場。好的歷史偵探會問：誰畫的？為什麼畫？再找其他資料互相比對。'}
];

/* ---------- styles ---------- */
const css=`
#twApp{--tw-gold:#e9b949;--tw-ink:#f6efe0}
.tw-acts{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.tw-acts button{display:flex;align-items:center;gap:8px;border:2px solid var(--line);background:var(--surface);color:var(--ink);border-radius:14px;padding:8px 14px;font:700 17px var(--f-body);cursor:pointer}
.tw-acts button[aria-selected="true"]{border-color:#8a5a12;background:#8a5a12;color:#fff}
.tw-acts .tw-st{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:15px;background:var(--surface-2);color:var(--muted);border:2px dashed var(--line)}
.tw-acts .done .tw-st{background:#c0392b;color:#fff;border:2px solid #fff;transform:rotate(-12deg)}
.tw-prog{height:10px;border-radius:99px;background:var(--surface-2);border:1px solid var(--line);overflow:hidden;margin:0 0 12px}
.tw-prog i{display:block;height:100%;width:0;background:linear-gradient(90deg,#e9b949,#c0392b);transition:width .5s}
.tw-stage{position:relative;height:min(72vh,680px);min-height:420px;background:#14110c;border-radius:18px;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;box-shadow:var(--shadow)}
.tw-stage.tw-full{position:fixed;inset:0;height:auto;z-index:9999;border-radius:0}
.tw-stage:fullscreen{height:100%;border-radius:0}
.tw-layer{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform;cursor:grab}
.tw-layer.drag{cursor:grabbing}
.tw-layer img{display:block;width:100%;height:100%;pointer-events:none;filter:sepia(.08)}
.tw-layer img.hi{position:absolute;inset:0;opacity:0;transition:opacity .4s}
.tw-layer img.hi.on{opacity:1}
.tw-hs{position:absolute;width:44px;height:44px;margin:-22px 0 0 -22px;border:0;padding:0;background:none;cursor:pointer;transform:scale(var(--inv,1));z-index:2}
.tw-hs::before{content:"";position:absolute;inset:9px;border-radius:50%;background:radial-gradient(circle,#fff6d5 0 30%,#e9b949 31% 60%,rgba(233,185,73,.0) 61%);box-shadow:0 0 14px 4px rgba(233,185,73,.85)}
.tw-hs::after{content:"";position:absolute;inset:0;border-radius:50%;border:3px solid rgba(255,214,102,.9);animation:twPulse 1.8s ease-out infinite}
.tw-hs.seen::before{background:radial-gradient(circle,#fff 0 30%,#58a55c 31% 60%,transparent 61%);box-shadow:0 0 10px 2px rgba(88,165,92,.8)}
.tw-hs.seen::after{border-color:rgba(120,200,120,.7);animation-duration:3s}
.tw-hs.cur::after{border-color:#fff;border-width:4px}
.tw-hs:focus-visible{outline:3px solid #fff;outline-offset:2px;border-radius:50%}
.tw-hs span{position:absolute;left:50%;top:100%;transform:translateX(-50%);white-space:nowrap;background:rgba(20,17,12,.82);color:#fff;font:700 15px var(--f-body);padding:3px 9px;border-radius:8px;margin-top:2px;opacity:0;transition:opacity .2s;pointer-events:none}
.tw-hs:hover span,.tw-hs:focus-visible span,.tw-stage.labels .tw-hs span{opacity:1}
@keyframes twPulse{0%{transform:scale(.55);opacity:1}100%{transform:scale(1.5);opacity:0}}
@media (prefers-reduced-motion:reduce){.tw-hs::after{animation:none}}
.tw-top{position:absolute;left:12px;right:12px;top:12px;display:flex;justify-content:space-between;gap:8px;pointer-events:none;z-index:4}
.tw-top>*{pointer-events:auto}
.tw-ttl{background:rgba(20,17,12,.78);color:var(--tw-ink);padding:8px 14px;border-radius:12px;font:700 18px var(--f-display);max-width:60%;backdrop-filter:blur(4px)}
.tw-ttl small{display:block;font:500 14px var(--f-body);color:#d9cdb4}
.tw-tools{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;align-content:flex-start}
.tw-tools .lb{font-weight:700}
.tw-tools button{min-width:44px;height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.25);background:rgba(20,17,12,.78);color:#fff;font:700 15px var(--f-body);padding:0 12px;cursor:pointer;backdrop-filter:blur(4px)}
.tw-tools button[aria-pressed="true"]{background:#e9b949;color:#14110c;border-color:#e9b949}
.tw-task{position:absolute;left:12px;bottom:12px;z-index:4;background:rgba(20,17,12,.84);color:#fff;border-radius:14px;padding:12px 16px;max-width:min(360px,calc(100% - 24px));backdrop-filter:blur(4px)}
.tw-task h4{margin:0 0 6px;font:700 16px var(--f-body);color:var(--tw-gold)}
.tw-tg{all:unset;cursor:pointer;color:var(--tw-gold);font:700 16px var(--f-body);display:block;min-height:28px}
.tw-task.min ol{display:none}.tw-task.min h4{margin:0}
.tw-task ol{margin:0;padding-left:1.4em;font-size:17px;line-height:1.6}
.tw-task li.ok{color:#9fe0a0;text-decoration:line-through;text-decoration-thickness:2px}
.tw-task li.ok::marker{content:"✔ "}
.tw-card{position:absolute;right:12px;top:72px;bottom:12px;width:min(400px,calc(100% - 24px));z-index:5;background:#fbf6ea;color:#2b2418;border-radius:16px;padding:18px 20px 16px;overflow:auto;box-shadow:0 10px 40px rgba(0,0,0,.45);transform:translateX(110%);transition:transform .35s ease}
.tw-card.on{transform:none}
.tw-card h3{margin:0 34px 10px 0;font:700 22px var(--f-display);color:#6b3f0a}
.tw-card p{font-size:18px;line-height:1.75;margin:0 0 10px}
.tw-card .orig{background:#efe3c6;border-left:5px solid #b8862b;padding:8px 12px;border-radius:8px;margin:0 0 12px;font-size:16px}
.tw-card .orig i{display:block;font-family:Georgia,serif;color:#6b5a3c;font-size:15px}
.tw-card .x{position:absolute;right:10px;top:10px;width:40px;height:40px;border-radius:50%;border:0;background:#e8dcc0;font-size:20px;cursor:pointer;color:#2b2418}
.tw-card .nav{display:flex;gap:8px;margin-top:8px}
.tw-card .nav button{flex:1;border:0;border-radius:10px;padding:10px;font:700 16px var(--f-body);background:#e8dcc0;color:#2b2418;cursor:pointer}
.tw-toast{position:absolute;left:50%;top:76px;transform:translate(-50%,-20px);opacity:0;z-index:6;background:#2e7d32;color:#fff;font:700 18px var(--f-body);padding:10px 18px;border-radius:999px;transition:.3s;pointer-events:none}
.tw-toast.on{opacity:1;transform:translate(-50%,0)}
.tw-zoom{position:absolute;right:12px;bottom:12px;z-index:3;display:flex;flex-direction:column;gap:6px}
.tw-card.on~.tw-zoom{display:none}
.tw-zoom button{width:44px;height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.25);background:rgba(20,17,12,.78);color:#fff;font:700 22px var(--f-body);cursor:pointer}
.tw-below{display:grid;grid-template-columns:1.2fr 1fr;gap:16px;margin-top:14px}
.tw-intro p{font-size:18px;line-height:1.75;margin:0 0 8px}
.tw-src{font-size:15px;color:var(--muted);line-height:1.6}
.tw-src b{color:var(--ink)}
.tw-quiz h4{margin:0 0 10px;font:700 19px var(--f-display)}
.tw-quiz .opts{display:grid;gap:8px}
.tw-quiz .opts button{text-align:left;border:2px solid var(--line);background:var(--surface);color:var(--ink);border-radius:12px;padding:10px 14px;font:600 17px var(--f-body);cursor:pointer}
.tw-quiz .opts button.right{border-color:#2e7d32;background:#e7f4e7;color:#1b4d1d}
.tw-quiz .opts button.wrong{border-color:#c0392b;background:#fbe9e7;color:#7a1f14}
.tw-quiz .exp{font-size:17px;line-height:1.7;margin-top:10px}
.tw-quiz .lock{font-size:16px;color:var(--muted)}
.tw-next{text-decoration:none;margin-top:12px;border:0;border-radius:12px;background:#8a5a12;color:#fff;font:700 17px var(--f-body);padding:10px 18px;cursor:pointer}
.tw-det{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px}
.tw-det figure{margin:0;background:var(--surface);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.tw-det img{width:100%;height:150px;object-fit:cover;display:block;background:#ddd}
.tw-det figcaption{padding:10px 12px;font-size:15px;line-height:1.55}
.tw-det figcaption b{display:block;font-size:16px}
.tw-cert{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:12px}
.tw-cert input{font:600 18px var(--f-body);padding:10px 12px;border-radius:10px;border:2px solid var(--line);background:var(--surface);color:var(--ink);min-width:200px}
#twApp canvas{display:block;width:100%;max-width:720px;border-radius:12px;box-shadow:var(--shadow);margin-top:12px}
@media (max-width:760px){
 .tw-stage{height:62vh;min-height:360px}
 .tw-ttl{font-size:16px;max-width:100%}
 .tw-acts{display:grid;grid-template-columns:1fr 1fr;gap:6px}
 .tw-acts button{font-size:15px;padding:6px 8px;gap:6px}
 .tw-acts .tw-st{width:24px;height:24px;font-size:13px;flex:none}
 .tw-ttl small{display:none}
 .tw-ttl{max-width:calc(100% - 100px);padding:6px 10px}
 .tw-tools{flex-wrap:wrap;width:96px;gap:4px}
 .tw-tools .lb{display:none}
 .tw-tools button{min-width:44px;padding:0}
 .tw-toast{top:auto;bottom:110px;max-width:90%;white-space:normal;text-align:center;font-size:16px}
 .tw-card{top:auto;height:58%;left:8px;right:8px;width:auto;bottom:8px;transform:translateY(110%)}
 .tw-below{grid-template-columns:1fr}
 .tw-det{grid-template-columns:1fr}
 .tw-task{bottom:8px;left:8px;padding:8px 12px}
 .tw-task ol{font-size:15px}
}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

/* ---------- state ---------- */
let SAVE={};try{SAVE=JSON.parse(localStorage.getItem('tw-prog')||'{}')}catch(e){}
const save=()=>{try{localStorage.setItem('tw-prog',JSON.stringify(SAVE))}catch(e){}};
ACTS.forEach(a=>{SAVE[a.key]=SAVE[a.key]||{seen:[],quiz:null}});
SAVE.det=SAVE.det||[null,null,null];
let cur=0,view={z:1,x:0,y:0},fit=1,openId=null,touring=false,tourT=null;

root.innerHTML=`
<div class="tw-acts" role="tablist" aria-label="探險站">${ACTS.map((a,i)=>`<button role="tab" data-i="${i}"><span class="tw-st">${a.stamp}</span>${a.name}</button>`).join('')}<button role="tab" data-i="3"><span class="tw-st">證</span>第四站 史料偵探</button></div>
<div class="tw-prog" aria-hidden="true"><i></i></div>
<div id="twMain"></div>`;
const tabs=[...root.querySelectorAll('.tw-acts button')];
tabs.forEach(b=>b.onclick=()=>go(+b.dataset.i));
const main=root.querySelector('#twMain');

function progress(){
  let n=0,tot=0;
  ACTS.forEach(a=>{tot+=a.tasks.length+1;const s=SAVE[a.key];n+=a.tasks.filter(t=>s.seen.includes(t.a)).length+(s.quiz===a.quiz.a?1:0)});
  tot+=DET.length;n+=SAVE.det.filter((v,i)=>v===DET[i].a).length;
  root.querySelector('.tw-prog i').style.width=(n/tot*100)+'%';
  ACTS.forEach((a,i)=>tabs[i].classList.toggle('done',actDone(i)));
  tabs[3].classList.toggle('done',detDone());
}
const actDone=i=>{const a=ACTS[i],s=SAVE[a.key];return a.tasks.every(t=>s.seen.includes(t.a))&&s.quiz===a.quiz.a};
const detDone=()=>SAVE.det.every((v,i)=>v===DET[i].a);

/* ---------- ambience: synthesized waves ---------- */
let AC=null,amb=null;
function sound(on){
  if(on){
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();AC.resume();
    const len=AC.sampleRate*4,buf=AC.createBuffer(2,len,AC.sampleRate);
    for(let c=0;c<2;c++){const d=buf.getChannelData(c);let last=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;last=(last+.02*w)/1.02;d[i]=last*3.2}}
    const src=AC.createBufferSource();src.buffer=buf;src.loop=true;
    const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=700;
    const g=AC.createGain();g.gain.value=.0;
    const lfo=AC.createOscillator();lfo.frequency.value=.11;const lg=AC.createGain();lg.gain.value=.22;
    lfo.connect(lg);lg.connect(g.gain);
    const base=AC.createConstantSource?AC.createConstantSource():null;
    if(base){base.offset.value=.3;base.connect(g.gain);base.start()}else g.gain.value=.3;
    src.connect(lp);lp.connect(g);g.connect(AC.destination);src.start();lfo.start();
    amb={src,lfo,base,g};
  }else if(amb){try{amb.src.stop();amb.lfo.stop();amb.base&&amb.base.stop()}catch(e){}amb=null}
}

/* ---------- viewer ---------- */
let stage,layer,card,taskEl,toast;
function go(i){
  stopTour();cur=i;openId=null;
  tabs.forEach((b,k)=>b.setAttribute('aria-selected',k===i));
  if(i===3){renderDet();progress();return}
  const a=ACTS[i],s=SAVE[a.key];
  main.innerHTML=`
  <div class="tw-stage" tabindex="0" aria-label="${a.title}，可以拖曳和縮放">
    <div class="tw-layer"><img alt="${a.title}" src="${a.lo}">${a.hi?`<img class="hi" alt="" data-src="${a.hi}">`:''}
      ${a.spots.map(h=>`<button class="tw-hs" data-id="${h.id}" style="left:${h.x}%;top:${h.y}%" aria-label="${h.t}"><span>${h.t}</span></button>`).join('')}
    </div>
    <div class="tw-top"><div class="tw-ttl">${a.title}<small>找找發光的點，點下去看看</small></div>
      <div class="tw-tools">
        <button data-act="tour" aria-pressed="false" title="自動帶你看每一個點">▶<b class="lb"> 自動導覽</b></button>
        <button data-act="lab" aria-pressed="false" title="顯示所有名稱">🏷<b class="lb"> 名稱</b></button>
        <button data-act="snd" aria-pressed="${!!amb}" title="海浪聲">🌊<b class="lb"> 海浪</b></button>
        <button data-act="full" title="全螢幕">⛶<b class="lb"> 全螢幕</b></button>
      </div></div>
    <div class="tw-task"><h4><button class="tw-tg" aria-expanded="true">任務 <span class="tw-cnt"></span> <span aria-hidden="true">▾</span></button></h4><ol>${a.tasks.map(t=>`<li data-a="${t.a}">${t.q}</li>`).join('')}</ol></div>
    <aside class="tw-card" aria-live="polite"></aside>
    <div class="tw-zoom"><button data-z="1.5" aria-label="放大">＋</button><button data-z="0.667" aria-label="縮小">－</button><button data-z="0" aria-label="看全圖">⤢</button></div>
    <div class="tw-toast" role="status"></div>
  </div>
  <div class="tw-below">
    <div class="panel pad tw-intro"><p>${a.intro}</p>
      <p class="tw-src"><b>這張圖是誰畫的？</b>${a.src.who}<br><b>什麼時候：</b>${a.src.when}　<b>現在在哪裡：</b>${a.src.where}<br>圖片來源：<a href="${a.src.page}" target="_blank" rel="noopener">維基共享資源（公有領域）</a></p></div>
    <div class="panel pad tw-quiz" id="twQuiz"></div>
  </div>`;
  stage=main.querySelector('.tw-stage');layer=main.querySelector('.tw-layer');card=main.querySelector('.tw-card');taskEl=main.querySelector('.tw-task');toast=main.querySelector('.tw-toast');
  layer.style.width=a.w+'px';layer.style.height=a.h+'px';
  s.seen.forEach(id=>{const b=layer.querySelector(`[data-id="${id}"]`);b&&b.classList.add('seen')});
  markTasks();
  taskEl.querySelector('.tw-tg').onclick=()=>{const m=taskEl.classList.toggle('min');taskEl.querySelector('.tw-tg').setAttribute('aria-expanded',!m)};
  layer.querySelectorAll('.tw-hs').forEach(b=>{b.onclick=e=>{e.stopPropagation();if(moved)return;stopTour();openSpot(b.dataset.id,true)}});
  main.querySelectorAll('.tw-tools button').forEach(b=>b.onclick=()=>tool(b));
  main.querySelectorAll('.tw-zoom button').forEach(b=>b.onclick=()=>{const z=+b.dataset.z;z?zoomAt(view.z*z,stage.clientWidth/2,stage.clientHeight/2,true):home(true)});
  bindPan();renderQuiz();
  requestAnimationFrame(()=>home(false));
  progress();
}
function clampV(){
  const W=stage.clientWidth,H=stage.clientHeight,a=ACTS[cur],w=a.w*view.z,h=a.h*view.z;
  view.x=w<=W?(W-w)/2:Math.min(0,Math.max(W-w,view.x));
  view.y=h<=H?(H-h)/2:Math.min(0,Math.max(H-h,view.y));
}
function apply(anim){
  clampV();
  layer.style.transition=anim?'transform .9s cubic-bezier(.4,.1,.2,1)':'none';
  layer.style.transform=`translate(${view.x}px,${view.y}px) scale(${view.z})`;
  layer.style.setProperty('--inv',(1/view.z).toFixed(4));
  const hi=layer.querySelector('img.hi');
  if(hi&&view.z/fit>1.6&&!hi.src){hi.src=hi.dataset.src;hi.onload=()=>hi.classList.add('on')}
}
function home(anim){
  const a=ACTS[cur];fit=Math.min(stage.clientWidth/a.w,stage.clientHeight/a.h);
  view.z=fit;view.x=0;view.y=0;apply(anim);
}
function zoomAt(z,cx,cy,anim){
  z=Math.max(fit,Math.min(fit*7,z));
  const ix=(cx-view.x)/view.z,iy=(cy-view.y)/view.z;
  view.z=z;view.x=cx-ix*z;view.y=cy-iy*z;apply(anim);
}
function flyTo(h,anim=true){
  const a=ACTS[cur],W=stage.clientWidth,H=stage.clientHeight;
  const z=Math.max(fit*2.2,Math.min(fit*3,fit*2.6));
  const cardW=card.classList.contains('on')&&W>760?Math.min(400,W-24)+12:0;
  const cardH=W<=760?H*.58:0;
  view.z=z;view.x=(W-cardW)/2-h.x/100*a.w*z;view.y=(H-cardH)/2-h.y/100*a.h*z;apply(anim);
}
let moved=false;
function bindPan(){
  const pts=new Map();let last=null,pinch=null;
  stage.addEventListener('pointerdown',e=>{
    if(e.target.closest('.tw-card,.tw-tools,.tw-zoom,.tw-task'))return;
    stopTour();stage.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=false;
    last={x:e.clientX,y:e.clientY};layer.classList.add('drag');layer.style.transition='none';
    if(pts.size===2){const [p,q]=[...pts.values()];pinch={d:Math.hypot(p.x-q.x,p.y-q.y),z:view.z}}
  });
  stage.addEventListener('pointermove',e=>{
    if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===2&&pinch){const [p,q]=[...pts.values()],r=stage.getBoundingClientRect();
      zoomAt(pinch.z*Math.hypot(p.x-q.x,p.y-q.y)/pinch.d,(p.x+q.x)/2-r.left,(p.y+q.y)/2-r.top,false);moved=true;return}
    const dx=e.clientX-last.x,dy=e.clientY-last.y;if(Math.abs(dx)+Math.abs(dy)>3)moved=true;
    view.x+=dx;view.y+=dy;last={x:e.clientX,y:e.clientY};apply(false);
  });
  const up=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch=null;if(!pts.size){layer.classList.remove('drag');setTimeout(()=>moved=false,0)}
    else{const p=[...pts.values()][0];last={x:p.x,y:p.y}}};
  stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);
  stage.addEventListener('wheel',e=>{e.preventDefault();stopTour();const r=stage.getBoundingClientRect();zoomAt(view.z*Math.exp(-e.deltaY*.0015),e.clientX-r.left,e.clientY-r.top,false)},{passive:false});
  stage.addEventListener('dblclick',e=>{if(e.target.closest('.tw-card,.tw-tools,.tw-zoom,.tw-task,.tw-hs'))return;const r=stage.getBoundingClientRect();zoomAt(view.z*2,e.clientX-r.left,e.clientY-r.top,true)});
  stage.addEventListener('keydown',e=>{
    const k=e.key,m=60;
    if(k==='ArrowLeft')view.x+=m;else if(k==='ArrowRight')view.x-=m;else if(k==='ArrowUp')view.y+=m;else if(k==='ArrowDown')view.y-=m;
    else if(k==='+'||k==='=')return zoomAt(view.z*1.4,stage.clientWidth/2,stage.clientHeight/2,true);
    else if(k==='-')return zoomAt(view.z/1.4,stage.clientWidth/2,stage.clientHeight/2,true);
    else if(k==='Escape'){closeCard();if(stage.classList.contains('tw-full'))full(false);return}
    else return;
    e.preventDefault();apply(true);
  });
  window.addEventListener('resize',()=>{if(stage&&stage.isConnected){const a=ACTS[cur];const old=fit;fit=Math.min(stage.clientWidth/a.w,stage.clientHeight/a.h);if(view.z<fit||Math.abs(view.z-old)<1e-6)home(false);else apply(false)}});
}
function openSpot(id,fly){
  const a=ACTS[cur],h=a.spots.find(s=>s.id===id),s=SAVE[a.key];
  openId=id;
  layer.querySelectorAll('.tw-hs').forEach(b=>b.classList.toggle('cur',b.dataset.id===id));
  const i=a.spots.indexOf(h);
  card.innerHTML=`<button class="x" aria-label="關閉">✕</button><h3>${h.t}</h3>
   ${h.orig?`<div class="orig">圖上寫著：<i>${h.orig}</i>意思是：「${h.zh}」</div>`:''}<p>${h.p}</p>
   <div class="nav"><button data-d="-1">← 上一個</button><button data-d="1">下一個 →</button></div>`;
  card.classList.add('on');
  card.querySelector('.x').onclick=closeCard;
  card.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>{stopTour();const n=a.spots[(i+ +b.dataset.d+a.spots.length)%a.spots.length];openSpot(n.id,true)});
  if(fly)flyTo(h);
  if(!s.seen.includes(id)){s.seen.push(id);save();layer.querySelector(`[data-id="${id}"]`).classList.add('seen');
    const t=a.tasks.find(t=>t.a===id);if(t){say('任務完成：'+t.q);chime()}
    markTasks();renderQuiz();progress()}
}
function closeCard(){card.classList.remove('on');openId=null;layer.querySelectorAll('.tw-hs.cur').forEach(b=>b.classList.remove('cur'))}
function markTasks(){const a=ACTS[cur],s=SAVE[a.key];taskEl.querySelector('.tw-cnt').textContent=a.tasks.filter(t=>s.seen.includes(t.a)).length+' / '+a.tasks.length;taskEl.querySelectorAll('li').forEach(li=>li.classList.toggle('ok',s.seen.includes(li.dataset.a)))}
function say(t){toast.textContent=t;toast.classList.add('on');clearTimeout(say.t);say.t=setTimeout(()=>toast.classList.remove('on'),2200)}
function chime(){if(!AC)return;const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(660,AC.currentTime);o.frequency.setValueAtTime(990,AC.currentTime+.12);g.gain.setValueAtTime(.12,AC.currentTime);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+.5);o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+.5)}
function tool(b){
  const act=b.dataset.act;
  if(act==='tour'){touring?stopTour():startTour()}
  else if(act==='lab'){const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);stage.classList.toggle('labels',on)}
  else if(act==='snd'){const on=!amb;sound(on);b.setAttribute('aria-pressed',on)}
  else if(act==='full'){full(!(document.fullscreenElement||stage.classList.contains('tw-full')))}
}
function full(on){
  const done=()=>setTimeout(()=>{const a=ACTS[cur];fit=Math.min(stage.clientWidth/a.w,stage.clientHeight/a.h);home(false)},120);
  if(on){if(stage.requestFullscreen)stage.requestFullscreen().then(done).catch(()=>{stage.classList.add('tw-full');done()});else{stage.classList.add('tw-full');done()}}
  else{if(document.fullscreenElement)document.exitFullscreen().then(done);stage.classList.remove('tw-full');done()}
}
document.addEventListener('fullscreenchange',()=>{if(stage&&!document.fullscreenElement){const a=ACTS[cur];setTimeout(()=>{fit=Math.min(stage.clientWidth/a.w,stage.clientHeight/a.h);home(false)},120)}});
function startTour(){
  touring=true;const b=main.querySelector('[data-act="tour"]');b.setAttribute('aria-pressed','true');b.innerHTML='■<b class="lb"> 停止導覽</b>';
  const a=ACTS[cur];let k=openId?Math.max(0,a.spots.findIndex(s=>s.id===openId)+1)%a.spots.length:0;
  const step=()=>{if(!touring)return;openSpot(a.spots[k].id,true);k++;if(k>=a.spots.length){tourT=setTimeout(()=>{stopTour();closeCard();home(true)},7000);return}tourT=setTimeout(step,7000)};
  step();
}
function stopTour(){if(!touring)return;touring=false;clearTimeout(tourT);const b=main.querySelector('[data-act="tour"]');if(b){b.setAttribute('aria-pressed','false');b.innerHTML='▶<b class="lb"> 自動導覽</b>'}}
function renderQuiz(){
  const el=main.querySelector('#twQuiz');if(!el)return;
  const a=ACTS[cur],s=SAVE[a.key],q=a.quiz;
  const ready=a.tasks.every(t=>s.seen.includes(t.a));
  if(!ready){el.innerHTML=`<h4>動動腦</h4><p class="lock">先完成畫面左下角的 3 個任務，這裡的問題就會打開。<br>已完成 ${a.tasks.filter(t=>s.seen.includes(t.a)).length} / 3</p>`;return}
  el.innerHTML=`<h4>動動腦：${q.q}</h4><div class="opts">${q.o.map((o,i)=>`<button data-i="${i}">${o}</button>`).join('')}</div><div class="exp"></div>`;
  const show=pick=>{el.querySelectorAll('.opts button').forEach((b,i)=>{b.classList.toggle('right',i===q.a&&pick===q.a);b.classList.toggle('wrong',i===pick&&pick!==q.a)});
    el.querySelector('.exp').innerHTML=pick===q.a?`<strong>答對了！</strong>${q.e}${cur<3?`<br><button class="tw-next">前往${cur<2?ACTS[cur+1].name:'第四站 史料偵探'} →</button>`:''}`:'再想想看，可以回到圖上找線索。';
    const n=el.querySelector('.tw-next');if(n)n.onclick=()=>{go(cur+1);root.scrollIntoView({behavior:'smooth',block:'start'})}};
  el.querySelectorAll('.opts button').forEach(b=>b.onclick=()=>{const p=+b.dataset.i;s.quiz=p;save();show(p);progress();if(p===q.a){chime();if(actDone(cur))say('拿到印章：'+a.stamp)}});
  if(s.quiz!=null)show(s.quiz);
}

/* ---------- act 4: detective + certificate ---------- */
function renderDet(){
  const th=[ACTS[0].lo,ACTS[1].lo,ACTS[2].lo];
  main.innerHTML=`<div class="panel pad">
   <h3 style="margin:0 0 6px;font:700 22px var(--f-display)">史料偵探：這三張圖，哪裡可以相信？</h3>
   <p style="font-size:18px;line-height:1.75;margin:0 0 14px">古圖不是照片。每一張都是某個人、為了某個目的畫的。先看看三位畫家的資料，再回答問題。</p>
   <div class="tw-det">${ACTS.map((a,i)=>`<figure><img src="${th[i]}" alt="${a.title}" loading="lazy"><figcaption><b>${a.name}</b>${a.src.who}<br>${a.src.when}</figcaption></figure>`).join('')}</div>
   <div id="twDetQ"></div>
   <div id="twCert"></div></div>`;
  const box=main.querySelector('#twDetQ');
  box.innerHTML=DET.map((d,k)=>`<div class="tw-quiz" style="margin:0 0 16px" data-k="${k}"><h4>${k+1}. ${d.q}</h4><div class="opts">${d.o.map((o,i)=>`<button data-i="${i}">${o}</button>`).join('')}</div><div class="exp"></div></div>`).join('');
  box.querySelectorAll('.tw-quiz').forEach(el=>{
    const k=+el.dataset.k,d=DET[k];
    const show=p=>{el.querySelectorAll('.opts button').forEach((b,i)=>{b.classList.toggle('right',i===d.a&&p===d.a);b.classList.toggle('wrong',i===p&&p!==d.a)});
      el.querySelector('.exp').innerHTML=p===d.a?'<strong>答對了！</strong>'+d.e:'再想想：畫的人是誰？他真的在場嗎？'};
    el.querySelectorAll('.opts button').forEach(b=>b.onclick=()=>{const p=+b.dataset.i;SAVE.det[k]=p;save();show(p);progress();renderCert()});
    if(SAVE.det[k]!=null)show(SAVE.det[k]);
  });
  renderCert();
}
function renderCert(){
  const el=main.querySelector('#twCert');if(!el)return;
  const done=ACTS.map((a,i)=>actDone(i)),all=done.every(Boolean)&&detDone();
  if(!all){el.innerHTML=`<p class="tw-src" style="font-size:17px">收集 4 個印章就能領取「大員港史料探險家」證書。目前：${ACTS.map((a,i)=>`${a.stamp}${done[i]?'✔':'—'}`).join('　')}　證${detDone()?'✔':'—'}</p>`;return}
  el.innerHTML=`<h4 style="font:700 20px var(--f-display);margin:8px 0 0">🎉 你收集到 4 個印章了！</h4><div class="tw-cert"><label>你的名字 <input id="twName" maxlength="12" placeholder="寫上你的名字"></label><button class="tw-next" id="twMake" style="margin:0">做我的證書</button></div><div id="twOut"></div>`;
  el.querySelector('#twMake').onclick=()=>{
    const name=(el.querySelector('#twName').value||'').trim()||'小小探險家';
    const cv=drawCert(name);const out=el.querySelector('#twOut');out.innerHTML='';out.appendChild(cv);
    const a=document.createElement('a');a.className='tw-next';a.style.display='inline-block';a.textContent='下載證書圖片';a.download='大員港史料探險證書.png';a.href=cv.toDataURL('image/png');out.appendChild(document.createElement('br'));out.appendChild(a);
  };
}
function drawCert(name){
  const W=1600,H=1100,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');
  const F='"Huninn","Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
  const bg=g.createRadialGradient(W/2,H/2,100,W/2,H/2,900);bg.addColorStop(0,'#fbf3dc');bg.addColorStop(1,'#e6d2a2');g.fillStyle=bg;g.fillRect(0,0,W,H);
  g.strokeStyle='#8a5a12';g.lineWidth=14;g.strokeRect(40,40,W-80,H-80);g.lineWidth=3;g.strokeRect(68,68,W-136,H-136);
  // compass rose
  g.save();g.translate(W-230,250);g.globalAlpha=.25;g.fillStyle='#8a5a12';for(let k=0;k<8;k++){g.rotate(Math.PI/4);g.beginPath();g.moveTo(0,0);g.lineTo(18,0);g.lineTo(0,k%2?-80:-130);g.lineTo(-18,0);g.fill()}g.restore();
  g.textAlign='center';g.fillStyle='#6b3f0a';g.font=`700 92px ${F}`;g.fillText('大員港史料探險家',W/2,250);
  g.font=`500 38px ${F}`;g.fillStyle='#4a3a20';g.fillText('證　書',W/2,320);
  g.font=`700 84px ${F}`;g.fillStyle='#2b2418';g.fillText(name,W/2,470);
  g.strokeStyle='#8a5a12';g.lineWidth=3;g.beginPath();g.moveTo(W/2-300,500);g.lineTo(W/2+300,500);g.stroke();
  g.font=`500 36px ${F}`;g.fillStyle='#3a2e1a';
  ['走過 1626 年的大員港、熱蘭遮城和 1661 年的圍城，','看懂了四百年前的古地圖，','也學會問：「這是誰畫的？可以相信嗎？」'].forEach((t,i)=>g.fillText(t,W/2,580+i*54));
  const stamps=['港','城','戰','證'];
  stamps.forEach((s,i)=>{const x=W/2-330+i*220,y=880;g.save();g.translate(x,y);g.rotate((i%2?1:-1)*.12);g.strokeStyle='#b0281a';g.lineWidth=8;g.beginPath();g.arc(0,0,74,0,7);g.stroke();g.lineWidth=3;g.beginPath();g.arc(0,0,60,0,7);g.stroke();g.fillStyle='#b0281a';g.font=`700 66px ${F}`;g.textBaseline='middle';g.fillText(s,0,4);g.restore()});
  const d=new Date();g.textBaseline='alphabetic';g.font=`500 28px ${F}`;g.fillStyle='#5a4a2e';
  g.fillText(`海佃地圖 · 第四單元　${d.getFullYear()} 年 ${d.getMonth()+1} 月 ${d.getDate()} 日`,W/2,1010);
  cv.setAttribute('role','img');cv.setAttribute('aria-label',name+' 的大員港史料探險家證書');
  return cv;
}

go(0);
})();
