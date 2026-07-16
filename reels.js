// ---- Study Reels: a swipeable feed of bite-sized revision cards ----
const REPO='kumarmohit69948-hub/theciae';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||d)}catch(e){return JSON.parse(d)}};
const store=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const feed=document.querySelector('#feed');
// ?course=CODE turns the feed into a single-course revision reel
const courseFilter=new URLSearchParams(location.search).get('course');
let deck=[],cursor=0,savedOnly=false,interacted=false;
const saveSet=new Set(load('theciae-reel-saves','[]'));
const seenSet=new Set(load('theciae-reel-seen','[]'));
// session stats
let answered=0,correct=0,combo=0,swiped=0;

const DEPT_EMOJI={FMPE:'🚜',ASPE:'🏗️',SWCE:'⛰️',IDE:'💧',PFE:'🍎',REE:'☀️',CSE:'🤖',AS:'📐',CAE:'🌾',SEC:'🛠️',MDC:'📚',AEC:'🗣️',VAC:'🌱',FC:'🎓'};
const emojiOf=code=>DEPT_EMOJI[String(code).replace(/[^A-Z].*$/,'')]||'🌿';

// same MCQ bank as the quiz corner (kept in sync manually)
const MCQS={
'Irrigation':[['Which method supplies water drop by drop near the roots?',['Flood irrigation','Drip irrigation','Furrow irrigation','Sprinkler irrigation'],1],['What is the main purpose of irrigation?',['Increase soil salinity','Meet crop water needs','Reduce sunlight','Replace fertilizer'],1],['Which device measures water flow in a channel?',['Weir','Thermometer','Barometer','Hygrometer'],0],['Water applied beyond the root zone is called?',['Runoff','Deep percolation','Evaporation','Infiltration'],1],['Which is a micro-irrigation method?',['Basin irrigation','Border irrigation','Drip irrigation','Wild flooding'],2]],
'Soil mechanics':[['The uppermost layer of soil is called?',['Bedrock','Subsoil','Topsoil','Parent material'],2],['Soil texture depends mainly on?',['Colour','Particle size','Temperature','Organic label'],1],['Which soil holds the most water?',['Sand','Clay','Gravel','Silt'],1],['Soil pH below 7 is?',['Alkaline','Neutral','Acidic','Saline'],2],['A good soil structure improves?',['Root growth','Only colour','Wind speed','Temperature'],0]],
'Farm machinery':[['Which is a primary tillage implement?',['Harrow','Mouldboard plough','Roller','Leveller'],1],['PTO on a tractor stands for?',['Power Take-Off','Pull Tractor Operation','Pressure Take-Off','Power Torque Output'],0],['A seed drill is used for?',['Harvesting crops','Sowing seeds in rows','Spraying pesticide','Threshing grain'],1],['Drawbar pull of a tractor is measured with a?',['Tachometer','Speedometer','Dynamometer','Hygrometer'],2],['A combine harvester performs?',['Only cutting','Only threshing','Tillage and sowing','Reaping, threshing and winnowing'],3]],
'Renewable energy':[['The main combustible gas in biogas is?',['Carbon dioxide','Methane','Nitrogen','Oxygen'],1],['Photovoltaic cells convert sunlight directly into?',['Heat','Electricity','Steam','Biogas'],1],['Which of these is NOT a renewable source?',['Solar','Wind','Coal','Biomass'],2],['A wind turbine converts wind energy into?',['Chemical energy','Mechanical/electrical energy','Nuclear energy','Sound energy'],1],['Optimum temperature range for biogas production is about?',['0–5°C','30–40°C','70–80°C','95–100°C'],1]],
'Food processing':[['Pasteurization of milk is done to?',['Freeze it','Destroy harmful microbes','Add flavour','Increase moisture'],1],['Which dryer suits liquid foods like milk?',['Tray dryer','Sun drying','Spray dryer','Bin dryer'],2],['Cold storage preserves produce mainly by?',['Adding preservatives','Slowing spoilage processes','Removing all water','Sterilizing it'],1],['Parboiling is a treatment associated with?',['Wheat','Rice','Cotton','Sugarcane'],1],['Winnowing separates grain from?',['Stones','Chaff','Water','Oil'],1]],
'Surveying':[['Which instrument measures horizontal and vertical angles?',['Chain','Theodolite','Level staff','Planimeter'],1],['Contour lines join points of equal?',['Temperature','Rainfall','Elevation','Slope'],2],['Levelling is used to determine?',['Soil type','Differences in elevation','Wind speed','Area colour'],1],['GPS stands for?',['General Plot Survey','Global Positioning System','Ground Plane Station','Geographic Point Scale'],1],['A planimeter measures?',['Angles','Volume','Area on a map','Temperature'],2]]};

// formula cards bridge the feed to the calculators on the main page
const FORMULAS=[
['💧 Drip irrigation requirement','Litres/plant/day = ET₀ × K꜀ × Sₚ × Sᵣ','ET₀ reference evapotranspiration (mm/day), K꜀ crop coefficient, Sₚ plant spacing (m), Sᵣ row spacing (m).'],
['⚙️ Pump shaft power','P (kW) = 9.81 × Q × H ÷ η','Q discharge (m³/s), H total head (m), η pump efficiency (decimal).'],
['🌱 Seed rate','kg/ha = Population ÷ (Germ % × Purity %) × TGW ÷ 10⁶','Population per hectare, germination and purity as fractions, TGW = 1000-grain weight in grams.'],
['🚜 Effective field capacity','EFC (ha/h) = (S × W × E) ÷ 10','S speed (km/h), W working width (m), E field efficiency (decimal).'],
['🛞 Wheel slip','Slip % = (1 − Vₐ ÷ Vₜ) × 100','Vₐ actual travel speed, Vₜ theoretical wheel speed. Optimum drawbar slip ≈ 10–15 %.'],
['🔥 Biogas from dung','~0.04 m³ gas per kg fresh cattle dung','A 2 m³ family plant needs about 50 kg dung/day at 30–40 °C.']];

// streak: shares the same storage keys as the main site
let studyDays=new Set(load('theciae-days','[]'));
const todayStr=()=>new Date().toISOString().slice(0,10);
function streakLen(){let n=0,d=new Date();if(!studyDays.has(todayStr()))d.setDate(d.getDate()-1);while(studyDays.has(d.toISOString().slice(0,10))){n++;d.setDate(d.getDate()-1)}return n}
function recordStudy(){if(!studyDays.has(todayStr())){studyDays.add(todayStr());store('theciae-days',[...studyDays])}renderStreak()}
function renderStreak(){const s=streakLen(),el=document.querySelector('#reelStreak');el.hidden=!s;el.textContent=`🔥 ${s}`}
function renderScore(){
  let el=document.querySelector('#reelScore');
  if(!el){el=document.createElement('span');el.id='reelScore';el.className='reels-streak';document.querySelector('.reels-top-right').prepend(el)}
  el.hidden=!answered;el.textContent=`🎯 ${correct}/${answered}`;
}
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
  const titles={};
  // 1) topic cards from both programmes
  let topics=[];
  bt.forEach(sec=>sec.courses.forEach(c=>{titles[c.code]=c.title;c.lectures.forEach(l=>topics.push({code:c.code,course:c.title,text:l.t}))}));
  mt.forEach(sec=>sec.courses.forEach(c=>{titles[c.code]=c.title;c.lectures.forEach(l=>topics.push({code:c.code,course:c.title,text:l.t}))}));
  if(courseFilter)topics=topics.filter(t=>t.code===courseFilter);
  shuffle(topics).slice(0,courseFilter?topics.length:220).forEach(t=>cards.push({kind:'topic',id:'t:'+t.code+':'+t.text.slice(0,40),...t}));
  // 2) built-in MCQs and formula cards (general mix only — not tied to one course)
  if(!courseFilter){
    Object.entries(MCQS).forEach(([label,qs])=>qs.forEach(q=>cards.push({kind:'mcq',id:'q:'+q[0].slice(0,50),label,q:q[0],opts:q[1],ans:q[2]})));
    FORMULAS.forEach(f=>cards.push({kind:'formula',id:'F:'+f[0],title:f[0],formula:f[1],legend:f[2]}));
  }
  // 3) user-authored quiz.json / flashcards.json from the repo (served by this same site)
  let special=(tree.files||[]).filter(p=>/\/(quiz|flashcards)\.json$/i.test(p));
  const richCourses=[...new Set(special.map(courseCodeOf))];
  if(courseFilter)special=special.filter(p=>courseCodeOf(p)===courseFilter);
  special=special.slice(0,12);
  await Promise.all(special.map(async p=>{
    try{
      const data=await (await fetch(encodeURI('/'+p))).json();
      const code=courseCodeOf(p);
      if(/quiz\.json$/i.test(p)&&Array.isArray(data))data.forEach(q=>{if(Array.isArray(q)&&q.length>=3&&Array.isArray(q[1]))cards.push({kind:'mcq',id:'q:'+String(q[0]).slice(0,50),label:code,q:q[0],opts:q[1],ans:q[2]})});
      if(/flashcards\.json$/i.test(p)&&Array.isArray(data))data.forEach(f=>{if(Array.isArray(f)&&f.length>=2)cards.push({kind:'flash',id:'f:'+String(f[0]).slice(0,50),label:code,front:f[0],back:f[1]})});
    }catch(e){}
  }));
  // 4) "dive deeper" cards for courses that have practice content (general mix)
  if(!courseFilter)shuffle(richCourses).slice(0,4).forEach(code=>cards.push({kind:'dive',id:'d:'+code,code,course:titles[code]||''}));
  // unseen cards surface first, both halves shuffled
  const unseen=shuffle(cards.filter(c=>!seenSet.has(c.id)));
  const seen=shuffle(cards.filter(c=>seenSet.has(c.id)));
  return unseen.concat(seen);
}

function shareAttr(c){
  const text=c.kind==='mcq'?c.q:c.kind==='flash'?c.front:c.kind==='formula'?c.title+': '+c.formula:c.text||'Study Reels';
  return esc(text);
}
function cardHTML(c){
  const saved=saveSet.has(c.id);
  const rail=`<div class="reel-rail"><button class="rail-btn save${saved?' on':''}" data-save="${esc(c.id)}" title="Save">♥</button><button class="rail-btn" data-share="${shareAttr(c)}" title="Share">↗</button></div>`;
  const review=c.review?'<span class="reel-review">↻ REVIEW</span>':'';
  if(c.kind==='topic')return `<section class="reel"><div class="reel-card reel-topic"><span class="reel-emoji">${emojiOf(c.code)}</span><p class="reel-eyebrow">${esc(c.code)} · ${esc(c.course)}</p><h2>${esc(c.text)}</h2><p class="reel-sub"><a href="index.html#course=${encodeURIComponent(c.code)}">Find notes for this topic in the library →</a></p></div>${rail}</section>`;
  if(c.kind==='flash')return `<section class="reel"><div class="reel-card reel-flash" data-flip><p class="reel-eyebrow">${review}${esc(c.label)} · FLASHCARD — TAP TO FLIP</p><div class="reel-flash-inner"><div class="rf-front"><h2>${esc(c.front)}</h2></div><div class="rf-back"><p>${esc(c.back)}</p></div></div></div>${rail}</section>`;
  if(c.kind==='formula')return `<section class="reel"><div class="reel-card reel-formula"><p class="reel-eyebrow">FIELD FORMULA</p><h2>${esc(c.title)}</h2><div class="formula-box">${esc(c.formula)}</div><p class="reel-sub">${esc(c.legend)}</p><p class="reel-sub"><a href="index.html#tools">Try it in the calculator →</a></p></div>${rail}</section>`;
  if(c.kind==='dive')return `<section class="reel"><div class="reel-card reel-topic"><span class="reel-emoji">${emojiOf(c.code)}</span><p class="reel-eyebrow">DIVE DEEPER</p><h2>${esc(c.code)}${c.course?' — '+esc(c.course):''} has practice content</h2><p class="reel-sub">Quiz and flashcards ready for this course.</p><p class="reel-sub"><a class="reel-cta" href="reels.html?course=${encodeURIComponent(c.code)}">▶ Start its reel</a> &nbsp; <a href="index.html#course=${encodeURIComponent(c.code)}">Open in library →</a></p></div>${rail}</section>`;
  return `<section class="reel"><div class="reel-card reel-mcq"><p class="reel-eyebrow">${review}${esc(c.label)} · QUICK QUESTION</p><h2>${esc(c.q)}</h2><div class="reel-opts">${c.opts.map((o,i)=>`<button class="reel-opt" data-i="${i}" data-ans="${c.ans}" data-id="${esc(c.id)}">${String.fromCharCode(65+i)}. ${esc(o)}</button>`).join('')}</div><p class="reel-fb"></p></div>${rail}</section>`;
}
function milestoneHTML(){
  const s=streakLen();
  const lines=[
    swiped>=20?`You’ve swiped <strong>${swiped}</strong> cards this session 🎉`:`Nice pace — keep swiping!`,
    answered?`Questions: <strong>${correct}/${answered}</strong> correct`:'',
    s?`Study streak: <strong>🔥 ${s} day${s>1?'s':''}</strong>`:''
  ].filter(Boolean).join('<br>');
  return `<section class="reel"><div class="reel-card reel-milestone"><span class="reel-emoji">🏅</span><p class="reel-eyebrow">CHECKPOINT</p><h2>${lines}</h2><p class="reel-sub">Swipe on — or <a href="index.html#resources">pick a course to study properly →</a></p></div></section>`;
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
  let html='';
  chunk.forEach((c,k)=>{
    html+=cardHTML(c);
    if(!savedOnly&&(cursor+k+1)%20===0)html+=milestoneHTML(); // a checkpoint every ~20 cards
    if(!seenSet.has(c.id)){seenSet.add(c.id)}
  });
  // cap the seen list so localStorage stays small
  if(seenSet.size>1200){const arr=[...seenSet].slice(-800);seenSet.clear();arr.forEach(x=>seenSet.add(x))}
  store('theciae-reel-seen',[...seenSet]);
  feed.insertAdjacentHTML('beforeend',html);
  swiped+=chunk.length;
  cursor+=chunk.length;
  if(cursor>=d.length&&!savedOnly){cursor=0;deck=shuffle(deck)} // fresh order every loop
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
    answered++;if(ok){correct++;combo++}else combo=0;
    renderScore();
    if(combo===3)toast('🔥 3 in a row!');
    if(combo===5)toast('⚡ 5 straight — unstoppable!');
    if(combo===10)toast('🏆 10 in a row. Examiner mode.');
    opt.closest('.reel-card').querySelector('.reel-fb').textContent=ok?'✓ Correct!':'✗ Not quite — it will come back for review.';
    if(!ok){ // spaced-repetition lite: wrong answers return a few cards later
      const id=opt.dataset.id;
      const c=deck.find(x=>x.id===id);
      if(c&&!c.review)deck.splice(Math.min(cursor+6,deck.length),0,{...c,review:true,id:c.id+':r'});
    }
    if(!interacted){interacted=true;recordStudy()}
    return;
  }
  const flip=e.target.closest('[data-flip]');
  if(flip){flip.classList.toggle('flipped');if(!interacted){interacted=true;recordStudy()}return}
  const sv=e.target.closest('[data-save]');
  if(sv){
    const id=sv.dataset.save;
    saveSet.has(id)?saveSet.delete(id):saveSet.add(id);
    store('theciae-reel-saves',[...saveSet]);
    sv.classList.toggle('on',saveSet.has(id));
    toast(saveSet.has(id)?'Saved ♥':'Removed from saved');
    return;
  }
  const sh=e.target.closest('[data-share]');
  if(sh){
    const payload={title:'theciae Study Reels',text:sh.dataset.share+' — revise agricultural engineering, one swipe at a time.',url:location.origin+'/reels.html'};
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
