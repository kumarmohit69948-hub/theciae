// theciae app view — phase 1: shell, bottom nav, Home dashboard.
// Reuses the SAME localStorage keys as the main site so progress,
// streaks and stars carry over both ways.
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||d)}catch(e){return JSON.parse(d)}};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const $=s=>document.querySelector(s);

const DEPTS={FMPE:'Farm Machinery & Power Engineering',ASPE:'Agricultural Structures & Process Engineering',SWCE:'Soil & Water Conservation Engineering',IDE:'Irrigation & Drainage Engineering',PFE:'Processing & Food Engineering',REE:'Renewable Energy Engineering',CSE:'Computer Science & Engineering',AS:'Applied Sciences',CAE:'Agricultural Engineering',SEC:'Skill Enhancement',MDC:'Multidisciplinary Course',AEC:'Ability Enhancement Course',VAC:'Value-Added Course',FC:'Foundation Course'};
const ICONS={'Semester 1':'S1','Semester 2':'S2','Semester 3':'S3','Semester 4':'S4','Semester 5':'S5','Semester 6':'S6','Semester 7':'S7','Semester 8':'S8','Semester 8 — Electives':'EL','Skill Enhancement Courses (Semester 2)':'SK'};
const BADGES=[['seed','🌱'],['sprout','📚'],['harvest','🎓'],['flame3','🔥'],['flame7','⚡'],['ace','🏅']];
const FORMULAS=[
['💧 Drip irrigation requirement','Litres/plant/day = ET₀ × K꜀ × Sₚ × Sᵣ','ET₀ reference evapotranspiration (mm/day), K꜀ crop coefficient, Sₚ plant spacing (m), Sᵣ row spacing (m).'],
['⚙️ Pump shaft power','P (kW) = 9.81 × Q × H ÷ η','Q discharge (m³/s), H total head (m), η pump efficiency (decimal).'],
['🌱 Seed rate','kg/ha = Population ÷ (Germ % × Purity %) × TGW ÷ 10⁶','Population per hectare, germination and purity as fractions, TGW = 1000-grain weight in grams.'],
['🚜 Effective field capacity','EFC (ha/h) = (S × W × E) ÷ 10','S speed (km/h), W working width (m), E field efficiency (decimal).'],
['🛞 Wheel slip','Slip % = (1 − Vₐ ÷ Vₜ) × 100','Vₐ actual travel speed, Vₜ theoretical wheel speed. Optimum drawbar slip ≈ 10–15%.'],
['🔥 Biogas from dung','~0.04 m³ gas per kg fresh cattle dung','A 2 m³ family plant needs about 50 kg dung/day at 30–40 °C.']];

const dept=code=>DEPTS[String(code).replace(/[^A-Z].*$/,'')]||'Agricultural Engineering';
const iconOf=(c)=>c.icon||ICONS[c.section]||(c.code||'').slice(0,2).toUpperCase();

// shared state (same keys as the site)
const progress=load('theciae-progress','{}');
const stars=new Set(load('theciae-stars','[]'));
const days=new Set(load('theciae-days','[]'));
const earned=new Set(load('theciae-badges','[]'));
// optional name/sem from the design's onboarding blob, if present
const appBlob=load('theciae-app','{}');

let courses=[];
function streakLen(){let n=0,d=new Date();const k=x=>x.toISOString().slice(0,10);if(!days.has(k(d)))d.setDate(d.getDate()-1);while(days.has(k(d))){n++;d.setDate(d.getDate()-1)}return n}
function ticks(){return Object.values(progress).reduce((a,p)=>a+Object.keys(p).length,0)}
function doneCount(c){const p=progress[c.code]||{};return c.lectures.filter(l=>p[l.n]).length}

function toast(msg){const t=$('#appToast');t.textContent=msg;t.hidden=false;clearTimeout(t._h);t._h=setTimeout(()=>t.hidden=true,2600)}

function renderStreakBits(){
  const s=streakLen(),t=ticks();
  const chip=$('#hdStreak');chip.hidden=!s;chip.textContent='🔥 '+s;
  const strip=$('#streakStrip');
  if(!s&&!t&&!earned.size){strip.hidden=true;return}
  strip.hidden=false;
  const badges=BADGES.filter(([id])=>earned.has(id)).map(([,e])=>e).join(' ');
  strip.innerHTML=`<b>${s?'🔥 '+s+'-day streak':'Start your streak today'}</b><span>· ${t} lecture${t===1?'':'s'} done</span>${badges?`<span style="font-size:13px">${badges}</span>`:''}`;
}

function renderContinue(){
  const wrap=$('#contWrap');
  // most-progressed course that isn't finished
  const inProg=courses.filter(c=>c.lectures.length&&doneCount(c)>0&&doneCount(c)<c.lectures.length)
    .sort((a,b)=>doneCount(b)-doneCount(a));
  const c=inProg[0];
  if(!c){
    wrap.innerHTML=`<div class="empty-card"><p>No course in progress yet.</p><button class="btn" style="width:auto;padding:0 20px;margin:0 auto" data-go="courses">Browse the syllabus</button></div>`;
    return;
  }
  const dn=doneCount(c),tot=c.lectures.length,pct=Math.round(dn/tot*100);
  wrap.innerHTML=`<div class="card"><p class="card-label">CONTINUE LEARNING</p>
    <div class="cont-row"><span class="ficon">${esc(iconOf(c))}</span>
      <div style="flex:1;min-width:0"><p>${esc(c.title)}</p><p class="sub">${esc(c.code)} · ${dn}/${tot} lectures</p></div></div>
    <div class="bar"><i style="width:${pct}%"></i></div>
    <a class="btn" href="index.html#course=${encodeURIComponent(c.code)}">Resume →</a></div>`;
}

function renderMineCount(){
  const n=stars.size;
  $('#mineCount').textContent=n?`${n} saved course${n>1?'s':''}`:'nothing saved yet';
}

function renderGreeting(){
  const name=appBlob.name||'';
  $('#greet').innerHTML=name?`Namaste, <em>${esc(name.split(' ')[0])}</em>`:'Welcome back';
  const sem=appBlob.sem;
  $('#semLine').textContent=sem?`${String(sem).toUpperCase()} · B.TECH AE`:'AGRICULTURAL ENGINEERING';
}

let fmlIdx=Math.floor(Math.random()*FORMULAS.length);
function renderFormula(){
  const f=FORMULAS[fmlIdx%FORMULAS.length];
  $('#fmlTitle').textContent=f[0];$('#fmlBox').textContent=f[1];$('#fmlLegend').textContent=f[2];
}
$('#fmlAnother').onclick=()=>{fmlIdx++;renderFormula()};

// bottom-nav tab switching
function go(tab){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('on',b.dataset.tab===tab));
  document.querySelectorAll('.screen').forEach(s=>s.hidden=(s.id!=='screen-'+tab));
  $('#screens').scrollTop=0;
}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>go(b.dataset.tab));
document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g){go(g.dataset.go)}});

// support → the site's support dialog (opens via #support hash handler)
$('#hdSupport').onclick=()=>{location.href='index.html#support'};
$('#qaSupport').onclick=()=>{location.href='index.html#support'};

// load real course data (B.Tech + M.Tech)
Promise.all([
  fetch('courses.json').then(r=>r.json()).catch(()=>[]),
  fetch('mtech.json').then(r=>r.json()).catch(()=>[])
]).then(([bt,mt])=>{
  const push=(secs,prog)=>secs.forEach(sec=>sec.courses.forEach(c=>courses.push(Object.assign({},c,{section:sec.section,prog}))));
  push(bt,'btech');push(mt,'mtech');
  renderContinue();
}).catch(()=>{});

renderGreeting();
renderStreakBits();
renderMineCount();
renderFormula();
