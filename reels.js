// ---- Study Reels: a swipeable feed of bite-sized revision cards ----
const REPO='kumarmohit69948-hub/theciae';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||d)}catch(e){return JSON.parse(d)}};
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const feed=document.querySelector('#feed');
// ?course=CODE turns the feed into a single-course revision reel
const courseFilter=new URLSearchParams(location.search).get('course');
let deck=[],cursor=0,savedOnly=false,interacted=false;
let saves=load('theciae-reel-saves','[]'); // array of card ids
const saveSet=new Set(saves);

// same MCQ bank as the quiz corner (kept in sync manually)
const MCQS={
'Irrigation':[['Which method supplies water drop by drop near the roots?',['Flood irrigation','Drip irrigation','Furrow irrigation','Sprinkler irrigation'],1],['What is the main purpose of irrigation?',['Increase soil salinity','Meet crop water needs','Reduce sunlight','Replace fertilizer'],1],['Which device measures water flow in a channel?',['Weir','Thermometer','Barometer','Hygrometer'],0],['Water applied beyond the root zone is called?',['Runoff','Deep percolation','Evaporation','Infiltration'],1],['Which is a micro-irrigation method?',['Basin irrigation','Border irrigation','Drip irrigation','Wild flooding'],2]],
'Soil mechanics':[['The uppermost layer of soil is called?',['Bedrock','Subsoil','Topsoil','Parent material'],2],['Soil texture depends mainly on?',['Colour','Particle size','Temperature','Organic label'],1],['Which soil holds the most water?',['Sand','Clay','Gravel','Silt'],1],['Soil pH below 7 is?',['Alkaline','Neutral','Acidic','Saline'],2],['A good soil structure improves?',['Root growth','Only colour','Wind speed','Temperature'],0]],
'Farm machinery':[['Which is a primary tillage implement?',['Harrow','Mouldboard plough','Roller','Leveller'],1],['PTO on a tractor stands for?',['Power Take-Off','Pull Tractor Operation','Pressure Take-Off','Power Torque Output'],0],['A seed drill is used for?',['Harvesting crops','Sowing seeds in rows','Spraying pesticide','Threshing grain'],1],['Drawbar pull of a tractor is measured with a?',['Tachometer','Speedometer','Dynamometer','Hygrometer'],2],['A combine harvester performs?',['Only cutting','Only threshing','Tillage and sowing','Reaping, threshing and winnowing'],3]],
'Renewable energy':[['The main combustible gas in biogas is?',['Carbon dioxide','Methane','Nitrogen','Oxygen'],1],['Photovoltaic cells convert sunlight directly into?',['Heat','Electricity','Steam','Biogas'],1],['Which of these is NOT a renewable source?',['Solar','Wind','Coal','Biomass'],2],['A wind turbine converts wind energy into?',['Chemical energy','Mechanical/electrical energy','Nuclear energy','Sound energy'],1],['Optimum temperature range for biogas production is about?',['0–5°C','30–40°C','70–80°C','95–100°C'],1]],
'Food processing':[['Pasteurization of milk is done to?',['Freeze it','Destroy harmful microbes','Add flavour','Increase moisture'],1],['Which dryer suits liquid foods like milk?',['Tray dryer','Sun drying','Spray dryer','Bin dryer'],2],['Cold storage preserves produce mainly by?',['Adding preservatives','Slowing spoilage processes','Removing all water','Sterilizing it'],1],['Parboiling is a treatment associated with?',['Wheat','Rice','Cotton','Sugarcane'],1],['Winnowing separates grain from?',['Stones','Chaff','Water','Oil'],1]],
'Surveying':[['Which instrument measures horizontal and vertical angles?',['Chain','Theodolite','Level staff','Planimeter'],1],['Contour lines join points of equal?',['Temperature','Rainfall','Elevation','Slope'],2],['Levelling is used to determine?',['Soil type','Differences in elevation','Wind speed','Area colour'],1],['GPS stands for?',['General Plot Survey','Global Positioning System','Ground Plane Station','Geographic Point Scale'],1],['A planimeter measures?',['Angles','Volume','Area on a map','Temperature'],2]]};

// streak: shares the same storage keys as the main site
let studyDays=new Set(load('theciae-days','[]'));
const todayStr=()=>new Date().toISOString().slice(0,10);
function streakLen(){let n=0,d=new Date();if(!studyDays.has(todayStr()))d.setDate(d.getDate()-1);while(studyDays.has(d.toISOString().slice(0,10))){n++;d.setDate(d.getDate()-1)}return n}
function recordStudy(){if(!studyDays.has(todayStr())){studyDays.add(todayStr());localStorage.setItem('theciae-days',JSON.stringify([...studyDays]))}renderStreak()}
function renderStreak(){const s=streakLen(),el=document.querySelector('#reelStreak');el.hidden=!s;el.textContent=`🔥 ${s}`}
function toast(msg){const t=document.querySelector('#toast');t.textContent=msg;t.hidden=false;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.hidden=true,300)},2600)}

async function loadFiles(){
  const cached=sessionStorage.getItem('theciae-files-v2');
  if(cached)return JSON.parse(cached);
  try{
    const r=await fetch(`https://api.github.com/repos/${REPO}/git/trees/main?recursive=1`);
    if(!r.ok)return{files:[]};
    const t=await r.json();
    const files=(t.tree||[]).filter(e=>e.type==='blob'&&e.path.startsWith('courses/')).map(e=>e.path);
    const dirs=(t.tree||[]).filter(e=>e.type==='tree'&&e.path.startsWith('courses/')).map(e=>e.path);
    const out={branch:'main',files,dirs};
    sessionStorage.setItem('theciae-files-v2',JSON.stringify(out));
    return out;
  }catch(e){return{files:[]}}
}
const courseCodeOf=p=>{const seg=p.split('/');return (seg[2]||'').split(' - ')[0].trim()};

async function buildDeck(){
  const [bt,mt,tree]=await Promise.all([
    fetch('courses.json').then(r=>r.json()).catch(()=>[]),
    fetch('mtech.json').then(r=>r.json()).catch(()=>[]),
    loadFiles()
  ]);
  const cards=[];
  // 1) topic cards from both programmes
  let topics=[];
  bt.forEach(sec=>sec.courses.forEach(c=>c.lectures.forEach(l=>topics.push({code:c.code,course:c.title,text:l.t}))));
  mt.forEach(sec=>sec.courses.forEach(c=>c.lectures.forEach(l=>topics.push({code:c.code,course:c.title,text:l.t}))));
  if(courseFilter)topics=topics.filter(t=>t.code===courseFilter);
  shuffle(topics).slice(0,courseFilter?topics.length:220).forEach(t=>cards.push({kind:'topic',id:'t:'+t.code+':'+t.text.slice(0,40),...t}));
  // 2) built-in MCQs (general mix only — they aren't tied to one course)
  if(!courseFilter)Object.entries(MCQS).forEach(([label,qs])=>qs.forEach(q=>cards.push({kind:'mcq',id:'q:'+q[0].slice(0,50),label,q:q[0],opts:q[1],ans:q[2]})));
  // 3) user-authored quiz.json / flashcards.json from the repo (served by this same site)
  let special=(tree.files||[]).filter(p=>/\/(quiz|flashcards)\.json$/i.test(p));
  if(courseFilter)special=special.filter(p=>courseCodeOf(p)===courseFilter);
  special=special.slice(0,12);
  await Promise.all(special.map(async p=>{
    try{
      const data=await (await fetch(encodeURI('/'+p))).json();
      const code=courseCodeOf(p);
      if(/quiz\.json$/i.test(p)&&Array.isArray(data))data.forEach(q=>{if(Array.isArray(q)&&q.length>=3)cards.push({kind:'mcq',id:'q:'+String(q[0]).slice(0,50),label:code,q:q[0],opts:q[1],ans:q[2]})});
      if(/flashcards\.json$/i.test(p)&&Array.isArray(data))data.forEach(f=>{if(Array.isArray(f)&&f.length>=2)cards.push({kind:'flash',id:'f:'+String(f[0]).slice(0,50),label:code,front:f[0],back:f[1]})});
    }catch(e){}
  }));
  return shuffle(cards);
}

function cardHTML(c,idx){
  const saved=saveSet.has(c.id);
  const rail=`<div class="reel-rail"><button class="rail-btn save${saved?' on':''}" data-save="${esc(c.id)}" title="Save">♥</button><button class="rail-btn" data-share="${idx}" title="Share">↗</button></div>`;
  if(c.kind==='topic')return `<section class="reel" data-idx="${idx}"><div class="reel-card reel-topic"><p class="reel-eyebrow">${esc(c.code)} · ${esc(c.course)}</p><h2>${esc(c.text)}</h2><p class="reel-sub">Find notes for this topic in the library →</p></div>${rail}</section>`;
  if(c.kind==='flash')return `<section class="reel" data-idx="${idx}"><div class="reel-card reel-flash" data-flip><p class="reel-eyebrow">${esc(c.label)} · FLASHCARD — TAP TO FLIP</p><div class="reel-flash-inner"><div class="rf-front"><h2>${esc(c.front)}</h2></div><div class="rf-back"><p>${esc(c.back)}</p></div></div></div>${rail}</section>`;
  return `<section class="reel" data-idx="${idx}"><div class="reel-card reel-mcq"><p class="reel-eyebrow">${esc(c.label)} · QUICK QUESTION</p><h2>${esc(c.q)}</h2><div class="reel-opts">${c.opts.map((o,i)=>`<button class="reel-opt" data-i="${i}" data-ans="${c.ans}">${String.fromCharCode(65+i)}. ${esc(o)}</button>`).join('')}</div><p class="reel-fb"></p></div>${rail}</section>`;
}

function currentDeck(){return savedOnly?deck.filter(c=>saveSet.has(c.id)):deck}
function renderMore(reset){
  const d=currentDeck();
  if(reset){feed.innerHTML='';cursor=0}
  if(!d.length){
    feed.innerHTML=savedOnly
      ?'<section class="reel"><div class="reel-card reel-topic"><p class="reel-eyebrow">SAVED CARDS</p><h2 style="color:#fff">Nothing saved yet</h2><p class="reel-sub">Tap ♥ on any card to keep it here.</p></div></section>'
      :`<section class="reel"><div class="reel-card reel-topic"><p class="reel-eyebrow">${esc(courseFilter||'FEED')}</p><h2 style="color:#fff">No cards for this course yet</h2><p class="reel-sub">Topics appear once the course has a lecture plan — and quiz.json / flashcards.json files make it even richer. <a href="reels.html" style="color:#dcec6a">Watch the full mix instead →</a></p></div></section>`;
    return;
  }
  const chunk=d.slice(cursor,cursor+10);
  feed.insertAdjacentHTML('beforeend',chunk.map((c,k)=>cardHTML(c,cursor+k)).join(''));
  cursor+=chunk.length;
  if(cursor>=d.length&&!savedOnly){cursor=0} // loop the feed like reels
}
// Feed keeper: appends more cards when near the bottom and hides the swipe
// hint after the first scroll. A timer is used instead of IntersectionObserver
// so the feed also works in embedded/preview browsers that throttle observers.
setInterval(()=>{
  if(!deck.length)return;
  if(feed.scrollTop+feed.clientHeight*2.2>=feed.scrollHeight)renderMore(false);
  const h=document.querySelector('#reelsHint');
  if(h&&feed.scrollTop>60){h.style.opacity='0';setTimeout(()=>h.remove(),400)}
},700);

feed.addEventListener('click',e=>{
  const opt=e.target.closest('.reel-opt');
  if(opt){
    if(opt.closest('.reel-opts').dataset.done)return;
    opt.closest('.reel-opts').dataset.done='1';
    const ok=+opt.dataset.i===+opt.dataset.ans;
    opt.classList.add(ok?'correct':'wrong');
    if(!ok)opt.closest('.reel-opts').querySelector(`[data-i="${opt.dataset.ans}"]`).classList.add('correct');
    opt.closest('.reel-card').querySelector('.reel-fb').textContent=ok?'✓ Correct!':'✗ Not quite — the highlighted one is right.';
    if(!interacted){interacted=true;recordStudy()}
    return;
  }
  const flip=e.target.closest('[data-flip]');
  if(flip){flip.classList.toggle('flipped');if(!interacted){interacted=true;recordStudy()}return}
  const sv=e.target.closest('[data-save]');
  if(sv){
    const id=sv.dataset.save;
    saveSet.has(id)?saveSet.delete(id):saveSet.add(id);
    localStorage.setItem('theciae-reel-saves',JSON.stringify([...saveSet]));
    sv.classList.toggle('on',saveSet.has(id));
    toast(saveSet.has(id)?'Saved ♥':'Removed from saved');
    return;
  }
  const sh=e.target.closest('[data-share]');
  if(sh){
    const c=currentDeck()[+sh.dataset.share];
    const text=c?(c.kind==='mcq'?c.q:c.kind==='flash'?c.front:c.text):'Study Reels';
    const payload={title:'theciae Study Reels',text:text+' — revise agricultural engineering, one swipe at a time.',url:location.origin+'/reels.html'};
    if(navigator.share)navigator.share(payload).catch(()=>{});
    else navigator.clipboard.writeText(payload.text+' '+payload.url).then(()=>toast('Copied — paste it anywhere')).catch(()=>{});
    return;
  }
});
// keyboard navigation like reels
document.addEventListener('keydown',e=>{
  if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;
  e.preventDefault();
  const reels=[...feed.querySelectorAll('.reel')];
  const y=feed.scrollTop,h=feed.clientHeight;
  const i=Math.round(y/h)+(e.key==='ArrowDown'?1:-1);
  if(reels[i])reels[i].scrollIntoView({behavior:'smooth'});
});
document.querySelector('#savedToggle').onclick=e=>{
  savedOnly=!savedOnly;
  e.target.classList.toggle('on',savedOnly);
  renderMore(true);
  feed.scrollTop=0;
};
if(courseFilter){
  const chip=document.createElement('a');
  chip.className='reels-chip on';chip.href='reels.html';chip.title='Back to the full mix';
  chip.textContent=courseFilter+' ✕';
  document.querySelector('.reels-top-right').prepend(chip);
}
buildDeck().then(d=>{
  deck=d;
  renderStreak();
  renderMore(true);
}).catch(()=>{feed.innerHTML='<section class="reel"><div class="reel-card reel-topic"><h2 style="color:#fff">Could not load the feed — please refresh.</h2></div></section>'});
