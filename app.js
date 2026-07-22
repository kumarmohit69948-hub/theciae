// ---- syllabus course library ----
const DEPTS={FMPE:'Farm Machinery & Power Engineering',ASPE:'Agricultural Structures & Process Engineering',SWCE:'Soil & Water Conservation Engineering',IDE:'Irrigation & Drainage Engineering',PFE:'Processing & Food Engineering',REE:'Renewable Energy Engineering',CSE:'Computer Science & Engineering',AS:'Applied Sciences',CAE:'Agricultural Engineering',SEC:'Skill Enhancement',MDC:'Multidisciplinary Course',AEC:'Ability Enhancement Course',VAC:'Value-Added Course',FC:'Foundation Course'};
const PILLS=[['all','All'],['starred','★ My courses'],['Semester 1','Sem 1'],['Semester 2','Sem 2'],['Semester 3','Sem 3'],['Semester 4','Sem 4'],['Semester 5','Sem 5'],['Semester 6','Sem 6'],['Semester 7','Sem 7'],['Semester 8','Sem 8'],['Semester 8 — Electives','Electives'],['Skill Enhancement Courses (Semester 2)','Skill Modules']];
// M.Tech (ARS/NET) disciplines come from the section names in mtech.json;
// each is shown as its own sub-tab (FMPE, ASPE, …).
let MTECH_SECTIONS=[];
const MTECH_PILLS=[['all','All units'],['starred','★ My saved']];
const mtechShort=s=>s.split('—').pop().trim().replace('Farm Machinery & Power','FMPE').replace('Agricultural Structures & Process Engineering','ASPE');
const ICONS={'Semester 1':'S1','Semester 2':'S2','Semester 3':'S3','Semester 4':'S4','Semester 5':'S5','Semester 6':'S6','Semester 7':'S7','Semester 8':'S8','Semester 8 — Electives':'EL','Skill Enhancement Courses (Semester 2)':'SK'};
const grid=document.querySelector('#courseGrid'), search=document.querySelector('#searchInput'), pillBox=document.querySelector('#semPills'), emptyState=document.querySelector('#emptyState');
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const dept=code=>DEPTS[code.replace(/[^A-Z].*$/,'')]||'Agricultural Engineering';
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||d)}catch(e){return JSON.parse(d)}};
let courses=[], activePill='all', activeProg='btech', activeDisc='', filesIdx={}, specialsIdx={};
let progress=load('theciae-progress','{}'), stars=new Set(load('theciae-stars','[]'));
const doneCount=c=>{const p=progress[c.code]||{};return c.lectures.filter(l=>p[l.n]).length};

// Discover uploaded files by reading the repo tree from the GitHub API.
// Any file dropped into courses/<Semester>/<Course>/<Lecture>/ on GitHub
// shows up here automatically on the next page load.
const REPO='kumarmohit69948-hub/theciae', BRANCHES=['main','feat/syllabus-course-folders'];
async function loadFiles(){
  const cached=sessionStorage.getItem('theciae-files-v2');
  if(cached)return JSON.parse(cached);
  for(const br of BRANCHES){
    try{
      const r=await fetch(`https://api.github.com/repos/${REPO}/git/trees/${br}?recursive=1`);
      if(!r.ok)continue;
      const t=await r.json();
      const files=(t.tree||[]).filter(e=>e.type==='blob'&&e.path.startsWith('courses/')&&!/(\.gitkeep|README\.md)$/.test(e.path)).map(e=>e.path);
      const dirs=(t.tree||[]).filter(e=>e.type==='tree'&&e.path.startsWith('courses/')).map(e=>e.path);
      if(dirs.length){const out={branch:br,files,dirs};sessionStorage.setItem('theciae-files-v2',JSON.stringify(out));return out}
    }catch(e){}
  }
  return {branch:'main',files:[],dirs:[]};
}
function indexFiles({branch,files}){
  const idx={};
  files.forEach(path=>{
    const seg=path.split('/');if(seg.length<4)return;
    const code=seg[2].split(' - ')[0].trim();
    idx[code]=idx[code]||{course:[],lectures:{}};
    const name=seg[seg.length-1];
    const enc=seg.map(encodeURIComponent).join('/');
    const raw=`https://raw.githubusercontent.com/${REPO}/${branch}/${enc}`;
    const cdn=`https://cdn.jsdelivr.net/gh/${REPO}@${branch}/${enc}`;
    const f={name,raw,cdn,path};
    // quiz.json / flashcards.json in a course folder power the practice features
    if(seg.length===4&&/^(quiz|flashcards)\.json$/i.test(name)){
      specialsIdx[code]=specialsIdx[code]||{};
      specialsIdx[code][name.toLowerCase().startsWith('quiz')?'quiz':'flash']=f;
      return;
    }
    if(seg.length===4){idx[code].course.push(f)}
    else{const n=parseInt(seg[3],10);if(isNaN(n)){idx[code].course.push(f)}else{(idx[code].lectures[n]=idx[code].lectures[n]||[]).push(f)}}
  });
  return idx;
}
const fileCount=code=>{const f=filesIdx[code];return f?f.course.length+Object.values(f.lectures).reduce((a,b)=>a+b.length,0):0};

function renderCourses(){
  const q=search.value.trim().toLowerCase();
  const matches=courses.filter(c=>c.prog===activeProg
    &&(activeProg!=='mtech'||c.section===activeDisc)
    &&(activePill==='all'||(activePill==='starred'?stars.has(c.code):c.section===activePill))
    &&(!q||c.text.includes(q)));
  grid.innerHTML=matches.map(c=>{
    const nf=fileCount(c.code), dn=doneCount(c), tot=c.lectures.length, sp=specialsIdx[c.code];
    const word=c.prog==='mtech'?'topic':'lecture';
    let status=c.practical?'Practical / skill module':tot?(dn?`${dn}/${tot} done`:tot+' '+word+'s'):'Plan coming soon';
    if(sp)status+=(sp.quiz?' · <b class="has-files">quiz</b>':'')+(sp.flash?' · <b class="has-files">cards</b>':'');
    return `<article class="resource-card course-card" data-i="${c.i}"><div class="card-top"><span class="file-icon">${esc(c.icon||ICONS[c.section]||'—')}</span><span class="card-top-right"><span class="tag">${esc(c.code)}</span><a class="card-reel" href="reels.html?course=${encodeURIComponent(c.code)}" title="Study reels for this course">▶</a><button class="star${stars.has(c.code)?' on':''}" data-star="${esc(c.code)}" title="Save to My courses">★</button></span></div><h3>${esc(c.title)}</h3><p>${esc(dept(c.code))}</p>${dn?`<div class="mini-progress"><i style="width:${Math.round(dn/tot*100)}%"></i></div>`:''}<div class="card-bottom"><span>${status}${nf?` · <b class="has-files">${nf} file${nf>1?'s':''}</b>`:''}</span><a href="#" data-i="${c.i}">View details →</a></div></article>`}).join('');
  emptyState.hidden=!!matches.length;
  if(activePill==='starred'&&!matches.length&&!q){emptyState.textContent='No saved courses yet — tap the ★ on any course card to pin it here.'}
  else emptyState.textContent='No matching courses yet. Try another search.';
}
let openCourse=null;
function updateLectureProgress(c){
  const dn=doneCount(c), tot=c.lectures.length, prog=document.querySelector('#lecProg');
  prog.hidden=!tot;
  if(tot){document.querySelector('#lecProgBar').style.width=Math.round(dn/tot*100)+'%';document.querySelector('#lecProgText').textContent=`${dn} of ${tot} ${c.prog==='mtech'?'topics':'lectures'} completed`}
}
function fileLinks(list){
  return `<span class="syl-files">${list.map(x=>(/\.pdf$/i.test(x.name)
    ?`<a href="${esc(x.cdn)}" class="pdf-chip" data-name="${esc(x.name)}" data-dl="${esc(x.raw)}">${esc(x.name)} — view ⤢</a>`
    :`<a href="${esc(x.raw)}" target="_blank" rel="noopener" download>${esc(x.name)} ↓</a>`)
    +`<button class="file-del" data-path="${esc(x.path)}" data-fname="${esc(x.name)}" title="Delete this file (admin only)">🗑</button>`).join('')}</span>`;
}
function openLecture(i){
  const c=courses[i], f=filesIdx[c.code]||{course:[],lectures:{}}, p=progress[c.code]||{};
  openCourse=c;
  const sectionLabel=c.prog==='mtech'?mtechShort(c.section):((PILLS.find(x=>x[0]===c.section)||[null,c.section])[1]);
  document.querySelector('#lecCode').textContent=c.code+' · '+sectionLabel.toUpperCase();
  document.querySelector('#lecTitle').textContent=c.title;
  updateLectureProgress(c);
  const sp=specialsIdx[c.code];
  document.querySelector('#lecBody').innerHTML=
    `<div class="practice-row"><a class="button button-primary" href="reels.html?course=${encodeURIComponent(c.code)}">▶ Study reels</a>${sp&&sp.quiz?`<button class="button button-plain" data-practice="quiz">❓ Practice quiz</button>`:''}${sp&&sp.flash?`<button class="button button-plain" data-practice="flash">🃏 Flashcards</button>`:''}</div>`+
    (f.course.length?`<p class="syl-note"><strong>Course resources:</strong></p>${fileLinks(f.course)}`:'')+
    (c.lectures.length?`<ol class="syl-lectures">${c.lectures.map(l=>`<li class="${p[l.n]?'done':''}"><i class="lec-n">${String(l.n).padStart(2,'0')}</i>${esc(l.t)}${f.lectures[l.n]?fileLinks(f.lectures[l.n]):''}<label class="lec-check" title="Mark as completed"><input type="checkbox" data-n="${l.n}"${p[l.n]?' checked':''}></label></li>`).join('')}</ol>`:`<p class="syl-note">${c.practical?'Hands-on skill module — resources will be added directly under this course.':'Lecture-wise plan will be added soon.'}</p>`)+
    `<p class="syl-hint">Tick lectures as you complete them — your progress is saved on this device. Files uploaded to this course's folders on GitHub appear here automatically.</p>`;
  document.querySelector('#lectureDialog').showModal();
}
function renderPills(){
  const list=activeProg==='mtech'?MTECH_PILLS:PILLS;
  pillBox.innerHTML=list.map(([v,l])=>`<button class="pill${v===activePill?' active':''}" data-v="${esc(v)}">${esc(l)}</button>`).join('');
  pillBox.querySelectorAll('.pill').forEach(b=>b.onclick=()=>{pillBox.querySelectorAll('.pill').forEach(x=>x.classList.remove('active'));b.classList.add('active');activePill=b.dataset.v;renderCourses()});
}
function renderDiscTabs(){
  const box=document.querySelector('#discTabs');
  if(activeProg!=='mtech'||!MTECH_SECTIONS.length){box.hidden=true;return}
  box.hidden=false;
  box.innerHTML=MTECH_SECTIONS.map(s=>`<button class="disc-tab${s===activeDisc?' active':''}" data-disc="${esc(s)}">${esc(mtechShort(s))}</button>`).join('');
  box.querySelectorAll('.disc-tab').forEach(b=>b.onclick=()=>{
    box.querySelectorAll('.disc-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');
    activeDisc=b.dataset.disc;activePill='all';renderPills();renderCourses();
  });
}
Promise.all([fetch('courses.json').then(r=>r.json()),fetch('mtech.json').then(r=>r.json()).catch(()=>[]),loadFiles().catch(()=>({branch:'main',files:[],dirs:[]}))]).then(([sections,msections,tree])=>{
  filesIdx=indexFiles(tree);
  populateUploadPickers(tree.dirs||[]);
  let i=0;
  sections.forEach(sec=>sec.courses.forEach(c=>{courses.push({...c,prog:'btech',section:sec.section,i:i++,text:(c.code+' '+c.title+' '+c.lectures.map(l=>l.t).join(' ')).toLowerCase()})}));
  MTECH_SECTIONS=msections.map(s=>s.section);
  activeDisc=MTECH_SECTIONS[0]||'';
  msections.forEach(sec=>sec.courses.forEach(c=>{courses.push({...c,prog:'mtech',section:sec.section,i:i++,text:(c.code+' '+c.title+' '+c.lectures.map(l=>l.t).join(' ')).toLowerCase()})}));
  document.querySelector('#resourceCount').textContent=courses.length;
  document.querySelectorAll('.prog-tab').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('.prog-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');
    activeProg=b.dataset.prog;activePill='all';
    if(activeProg==='mtech'&&!activeDisc)activeDisc=MTECH_SECTIONS[0]||'';
    renderDiscTabs();renderPills();renderCourses();
  });
  renderDiscTabs();
  renderPills();
  renderCourses();
  renderStreak();
  grid.addEventListener('click',e=>{
    if(e.target.closest('.card-reel'))return; // let the reels link navigate
    const st=e.target.closest('[data-star]');
    if(st){e.preventDefault();const code=st.dataset.star;stars.has(code)?stars.delete(code):stars.add(code);localStorage.setItem('theciae-stars',JSON.stringify([...stars]));renderCourses();return}
    const t=e.target.closest('[data-i]');if(!t)return;
    e.preventDefault();openLecture(+t.dataset.i);
  });
  search.addEventListener('input',renderCourses);
  // deep link: index.html#course=CODE opens that course's popup (used by Study Reels)
  const openFromHash=()=>{
    if(location.hash==='#support'){document.querySelector('#supportDialog').showModal();return}
    const m=location.hash.match(/^#course=(.+)$/);if(!m)return;
    const c=courses.find(x=>x.code===decodeURIComponent(m[1]));
    if(!c)return;
    if(c.prog==='mtech'){activeProg='mtech';activeDisc=c.section;document.querySelectorAll('.prog-tab').forEach(x=>x.classList.toggle('active',x.dataset.prog==='mtech'));renderDiscTabs();renderPills();renderCourses()}
    document.querySelector('#resources').scrollIntoView();
    openLecture(c.i);
  };
  window.addEventListener('hashchange',openFromHash);
  openFromHash();
  // "What are you looking for?" chips route straight to the right shelf
  document.querySelectorAll('.find-chip[data-route]').forEach(b=>b.onclick=()=>{
    if(b.dataset.route==='sem'){
      activeProg='btech';activePill=b.dataset.v;activeDisc=activeDisc||MTECH_SECTIONS[0]||'';
    }else{
      activeProg='mtech';activePill='all';
      activeDisc=MTECH_SECTIONS.find(s=>mtechShort(s).includes(b.dataset.v))||MTECH_SECTIONS[0]||'';
    }
    document.querySelectorAll('.prog-tab').forEach(x=>x.classList.toggle('active',x.dataset.prog===activeProg));
    renderDiscTabs();renderPills();renderCourses();
    document.querySelector('#resources').scrollIntoView({behavior:'smooth'});
  });
}).catch(()=>{grid.innerHTML='<p class="empty-state">Could not load the syllabus. Please refresh the page.</p>'});

// ---- "New this week": latest uploads, straight from the repo's commits ----
async function loadFresh(){
  const box=document.querySelector('#freshStrip');if(!box)return;
  try{
    let items=null;
    const cached=sessionStorage.getItem('theciae-fresh-v1');
    if(cached)items=JSON.parse(cached);
    if(!items){
      const commits=await (await fetch(`https://api.github.com/repos/${REPO}/commits?path=courses&per_page=8`)).json();
      if(!Array.isArray(commits))throw 0;
      items=[];const seen=new Set();
      for(const c of commits){
        if(items.length>=4)break;
        const det=await (await fetch(c.url)).json();
        for(const f of (det.files||[])){
          if(items.length>=4)break;
          if(f.status!=='added')continue;
          if(!f.filename.startsWith('courses/'))continue;
          if(/(\.gitkeep|README\.md)$/.test(f.filename))continue;
          const seg=f.filename.split('/');if(seg.length<4)continue;
          if(seen.has(f.filename))continue;seen.add(f.filename);
          items.push({name:seg[seg.length-1],code:seg[2].split(' - ')[0].trim(),date:det.commit.author.date});
        }
      }
      sessionStorage.setItem('theciae-fresh-v1',JSON.stringify(items));
    }
    if(!items.length)return;
    const ago=d=>{const days=Math.floor((Date.now()-new Date(d).getTime())/864e5);
      if(days<1)return 'today';if(days===1)return 'yesterday';if(days<7)return days+' days ago';
      const w=Math.floor(days/7);return w<5?w+' week'+(w>1?'s':'')+' ago':Math.floor(days/30)+' month(s) ago'};
    document.querySelector('#freshRow').innerHTML=items.map(it=>
      `<a class="fresh-item" href="#course=${encodeURIComponent(it.code)}"><span class="fresh-ico">📄</span><span class="fresh-body"><b>${esc(it.name)}</b><span>${esc(it.code)} · ${esc(ago(it.date))}</span></span></a>`).join('');
    box.hidden=false;
  }catch(e){}
}
loadFresh();
document.querySelector('#closeLecture').onclick=()=>document.querySelector('#lectureDialog').close();
document.querySelector('#lecBody').addEventListener('change',e=>{
  const cb=e.target.closest('input[data-n]');if(!cb||!openCourse)return;
  const code=openCourse.code;progress[code]=progress[code]||{};
  if(cb.checked)progress[code][cb.dataset.n]=1;else delete progress[code][cb.dataset.n];
  localStorage.setItem('theciae-progress',JSON.stringify(progress));
  cb.closest('li').classList.toggle('done',cb.checked);
  updateLectureProgress(openCourse);renderCourses();
  if(cb.checked)recordStudy();
});
// in-page PDF viewer + admin file delete + practice launchers
document.querySelector('#lecBody').addEventListener('click',async e=>{
  const pr=e.target.closest('[data-practice]');
  if(pr&&openCourse){
    const sp=specialsIdx[openCourse.code];if(!sp)return;
    pr.disabled=true;
    try{
      if(pr.dataset.practice==='quiz'){
        const data=await (await fetch(sp.quiz.raw)).json();
        if(!Array.isArray(data)||!data.length)throw new Error('quiz.json is empty or invalid');
        quizzes.__custom=data;QUIZ_TITLES.__custom=openCourse.code+' practice';
        document.querySelector('#lectureDialog').close();
        startQuiz('__custom');
        document.querySelector('#quizzes').scrollIntoView({behavior:'smooth'});
      }else{
        const data=await (await fetch(sp.flash.raw)).json();
        if(!Array.isArray(data)||!data.length)throw new Error('flashcards.json is empty or invalid');
        openFlashcards(openCourse.code,data);
      }
    }catch(err){alert('⚠ Could not load practice content: '+err.message)}
    finally{pr.disabled=false}
    return;
  }
  const del=e.target.closest('.file-del');
  if(del){
    e.preventDefault();
    const name=del.dataset.fname;
    if(!confirm(`Delete "${name}" from the website?\n(Only the site owner can complete this.)`))return;
    const pw=prompt('Admin password:');
    if(!pw)return;
    del.disabled=true;
    try{
      const r=await fetch('/api/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw,path:del.dataset.path})});
      const j=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(j.error||('Delete failed ('+r.status+')'));
      sessionStorage.removeItem('theciae-files-v2');
      alert('"'+name+'" deleted.');
      location.reload();
    }catch(err){alert('⚠ '+err.message);del.disabled=false}
    return;
  }
  const a=e.target.closest('.pdf-chip');if(!a)return;
  e.preventDefault();
  document.querySelector('#pdfName').textContent=a.dataset.name;
  document.querySelector('#pdfDownload').href=a.dataset.dl;
  document.querySelector('#pdfFrame').src=a.href;
  document.querySelector('#pdfDialog').showModal();
});
document.querySelector('#closePdf').onclick=()=>{document.querySelector('#pdfDialog').close();document.querySelector('#pdfFrame').src='about:blank'};

// ---- flashcards ----
let flashDeck=[],flashIdx=0;
function renderFlash(){
  const [front,back]=flashDeck[flashIdx];
  document.querySelector('#flashCard').classList.remove('flipped');
  document.querySelector('#flashFront').textContent=front;
  document.querySelector('#flashBack').textContent=back;
  document.querySelector('#flashCount').textContent=`${flashIdx+1} / ${flashDeck.length}`;
}
function openFlashcards(code,deck){
  flashDeck=shuffle(deck);flashIdx=0;
  document.querySelector('#flashCode').textContent=code+' · TAP TO FLIP';
  renderFlash();
  document.querySelector('#flashDialog').showModal();
  recordStudy('flash');
}
document.querySelector('#flashCard').onclick=()=>document.querySelector('#flashCard').classList.toggle('flipped');
document.querySelector('#flashPrev').onclick=()=>{flashIdx=(flashIdx-1+flashDeck.length)%flashDeck.length;renderFlash()};
document.querySelector('#flashNext').onclick=()=>{flashIdx=(flashIdx+1)%flashDeck.length;renderFlash()};
document.querySelector('#closeFlash').onclick=()=>document.querySelector('#flashDialog').close();

// ---- streaks, badges, toast ----
const BADGES=[
  ['seed','🌱','First lecture completed',s=>s.ticks>=1],
  ['sprout','📚','10 lectures completed',s=>s.ticks>=10],
  ['harvest','🎓','First course fully completed',s=>s.courseDone],
  ['flame3','🔥','3-day study streak',s=>s.streak>=3],
  ['flame7','⚡','7-day study streak',s=>s.streak>=7],
  ['ace','🏅','Perfect quiz score',s=>s.perfect]
];
let studyDays=new Set(load('theciae-days','[]')), earned=new Set(load('theciae-badges','[]'));
const todayStr=()=>new Date().toISOString().slice(0,10);
function streakLen(){
  let n=0,d=new Date();
  if(!studyDays.has(todayStr()))d.setDate(d.getDate()-1); // streak may end yesterday
  while(studyDays.has(d.toISOString().slice(0,10))){n++;d.setDate(d.getDate()-1)}
  return n;
}
function toast(msg){
  const t=document.querySelector('#toast');
  t.textContent=msg;t.hidden=false;t.classList.add('show');
  clearTimeout(t._h);t._h=setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.hidden=true,300)},3200);
}
function statsNow(){
  const ticks=Object.values(progress).reduce((a,p)=>a+Object.keys(p).length,0);
  const courseDone=courses.some(c=>c.lectures.length&&doneCount(c)===c.lectures.length);
  return {ticks,courseDone,streak:streakLen(),perfect:localStorage.getItem('theciae-perfect')==='1'};
}
function checkBadges(){
  const s=statsNow();
  BADGES.forEach(([id,icon,label,test])=>{
    if(!earned.has(id)&&test(s)){earned.add(id);localStorage.setItem('theciae-badges',JSON.stringify([...earned]));toast(`Badge earned: ${icon} ${label}!`)}
  });
  renderStreak();
}
function renderStreak(){
  const s=statsNow(), strip=document.querySelector('#streakStrip');
  if(!s.ticks&&!s.streak&&!earned.size){strip.hidden=true;return}
  const icons=BADGES.filter(([id])=>earned.has(id)).map(([,i,l])=>`<span title="${l}">${i}</span>`).join('');
  strip.innerHTML=`${s.streak?`<b>🔥 ${s.streak}-day streak</b>`:'<b>Start your streak today</b>'} · ${s.ticks} lecture${s.ticks===1?'':'s'} completed ${icons?`· <span class="badge-row">${icons}</span>`:''}`;
  strip.hidden=false;
}
function recordStudy(){
  if(!studyDays.has(todayStr())){studyDays.add(todayStr());localStorage.setItem('theciae-days',JSON.stringify([...studyDays]))}
  checkBadges();
}

// ---- calculators ----
function bindCalc(ids,fn,outId){
  const els=ids.map(id=>document.querySelector('#'+id)), out=document.querySelector('#'+outId);
  const run=()=>{const v=els.map(e=>parseFloat(e.value));out.innerHTML=v.some(x=>!isFinite(x)||x<0)?'Enter valid values':fn(...v)};
  els.forEach(e=>e.addEventListener('input',run));run();
}
bindCalc(['dripEto','dripKc','dripSp','dripSr'],(eto,kc,sp,sr)=>{
  const l=eto*kc*sp*sr;
  return `≈ <strong>${l.toFixed(1)} litres</strong> per plant per day`;
},'dripOut');
bindCalc(['pumpQ','pumpH','pumpEff'],(q,h,eff)=>{
  if(!eff)return 'Enter valid values';
  const kw=(9.81*(q/1000)*h)/(eff/100);
  return `≈ <strong>${kw.toFixed(2)} kW</strong> (${(kw*1.341).toFixed(2)} hp) shaft power`;
},'pumpOut');
bindCalc(['seedPop','seedTgw','seedGerm','seedPur'],(pop,tgw,g,p)=>{
  if(!g||!p)return 'Enter valid values';
  const kg=(pop/((g/100)*(p/100)))*tgw/1e6;
  return `≈ <strong>${kg.toFixed(1)} kg/ha</strong> seed required`;
},'seedOut');
// support dialog
document.querySelector('#openSupport').onclick=e=>{e.preventDefault();document.querySelector('#supportDialog').showModal()};
document.querySelector('#closeSupport').onclick=()=>document.querySelector('#supportDialog').close();
document.querySelector('#copyUpi').onclick=e=>{navigator.clipboard.writeText(document.querySelector('#upiId').textContent).then(()=>{e.target.textContent='Copied ✓';setTimeout(()=>e.target.textContent='Copy',1800)}).catch(()=>{})};

// ---- upload dialog (commits to GitHub via /api/upload) ----
const dialog=document.querySelector('#uploadDialog');['openUpload','heroUpload','ctaUpload'].forEach(id=>document.querySelector('#'+id).onclick=()=>dialog.showModal());document.querySelector('#closeUpload').onclick=()=>dialog.close();document.querySelector('#cancelUpload').onclick=()=>dialog.close();
let courseDirs=[],lectureDirs=[];
function populateUploadPickers(dirs){
  // course folders start with a course code, e.g. "courses/Semester 1/SWCE1.4 - ..."
  courseDirs=dirs.filter(d=>/^[A-Z]{2,4}[-0-9]/.test(d.split('/').pop()));
  lectureDirs=dirs.filter(d=>/^\d\d /.test(d.split('/').pop()));
  const sel=document.querySelector('#upCourse');if(!sel)return;
  const groups={};
  courseDirs.forEach(d=>{const seg=d.split('/');const g=seg.slice(1,-1).join(' / ');(groups[g]=groups[g]||[]).push(d)});
  sel.innerHTML='<option value="">Select a course…</option>'+Object.keys(groups).map(g=>`<optgroup label="${esc(g)}">${groups[g].map(d=>`<option value="${esc(d)}">${esc(d.split('/').pop())}</option>`).join('')}</optgroup>`).join('');
}
document.querySelector('#upCourse').addEventListener('change',e=>{
  const course=e.target.value, lec=document.querySelector('#upLecture');
  const kids=lectureDirs.filter(d=>d.startsWith(course+'/')&&d.split('/').length===course.split('/').length+1).sort();
  lec.innerHTML='<option value="">— course level (no specific lecture) —</option>'+kids.map(d=>`<option value="${esc(d)}">${esc(d.split('/').pop())}</option>`).join('');
});
// multi-file batch upload with drag & drop and a session-remembered password
const upFile=document.querySelector('#upFile'), dropZone=document.querySelector('#dropZone'), pwInput=document.querySelector('#uploadForm [name=password]');
let uploadedSomething=false;
pwInput.value=sessionStorage.getItem('theciae-pw')||'';
['dragover','dragenter'].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.add('drag')}));
['dragleave','drop'].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.remove('drag')}));
dropZone.addEventListener('drop',e=>{if(e.dataTransfer.files.length){upFile.files=e.dataTransfer.files;upFile.dispatchEvent(new Event('change'))}});
upFile.addEventListener('change',()=>{
  document.querySelector('#uploadList').innerHTML=[...upFile.files].map(f=>`<div class="up-item" data-f="${esc(f.name)}"><span>${esc(f.name)}</span><b>${f.size>3*1024*1024?'⚠ over 3 MB':'ready'}</b></div>`).join('');
});
const closeUploadDialog=()=>{dialog.close();if(uploadedSomething){uploadedSomething=false;location.reload()}};
document.querySelector('#closeUpload').onclick=closeUploadDialog;
document.querySelector('#cancelUpload').onclick=closeUploadDialog;
document.querySelector('#uploadForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const f=new FormData(e.target), files=[...upFile.files], status=document.querySelector('#uploadStatus'), btn=document.querySelector('#uploadSubmit');
  if(!f.get('course')){status.textContent='Please select a course.';return}
  if(!files.length){status.textContent='Please choose at least one file.';return}
  const dir=f.get('lecture')||f.get('course'), pw=f.get('password');
  btn.disabled=true;status.textContent='';
  let ok=0;
  for(const file of files){
    const row=document.querySelector(`.up-item[data-f="${CSS.escape(file.name)}"] b`);
    if(file.size>3*1024*1024){if(row)row.textContent='⚠ skipped (over 3 MB)';continue}
    if(row)row.textContent='uploading…';
    btn.textContent=`Uploading ${ok+1} / ${files.length}…`;
    const safeName=file.name.replace(/[<>:"/\\|?*]/g,' ').replace(/\s+/g,' ').trim();
    try{
      const b64=await new Promise((res,rej)=>{const rd=new FileReader();rd.onload=()=>res(rd.result.split(',')[1]);rd.onerror=rej;rd.readAsDataURL(file)});
      const r=await fetch('/api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw,path:`${dir}/${safeName}`,content:b64})});
      const j=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(j.error||('failed ('+r.status+')'));
      ok++;uploadedSomething=true;
      if(row)row.textContent='✓ uploaded';
      sessionStorage.setItem('theciae-pw',pw);
    }catch(err){
      if(row)row.textContent='✗ '+err.message;
      if(/password/i.test(err.message)){status.textContent='⚠ '+err.message;sessionStorage.removeItem('theciae-pw');break}
    }
  }
  if(uploadedSomething)sessionStorage.removeItem('theciae-files-v2');
  btn.disabled=false;btn.textContent='Upload to site';
  if(ok===files.length&&ok>0){status.textContent='';toast(`${ok} file${ok>1?'s':''} uploaded ✓ — same course selected for more`);upFile.value='';document.querySelector('#uploadList').innerHTML=''}
  else if(ok>0)status.textContent=`Uploaded ${ok} of ${files.length} — see the list above.`;
});

// ---- quizzes ----
const QUIZ_TITLES={irrigation:'Irrigation basics',soil:'Soil mechanics',machinery:'Farm machinery',energy:'Renewable energy',food:'Food processing',surveying:'Surveying'};
const quizzes={
irrigation:[['Which method supplies water drop by drop near the roots?',['Flood irrigation','Drip irrigation','Furrow irrigation','Sprinkler irrigation'],1],['What is the main purpose of irrigation?',['Increase soil salinity','Meet crop water needs','Reduce sunlight','Replace fertilizer'],1],['Which device measures water flow in a channel?',['Weir','Thermometer','Barometer','Hygrometer'],0],['Water applied beyond the root zone is called?',['Runoff','Deep percolation','Evaporation','Infiltration'],1],['Which is a micro-irrigation method?',['Basin irrigation','Border irrigation','Drip irrigation','Wild flooding'],2]],
soil:[['The uppermost layer of soil is called?',['Bedrock','Subsoil','Topsoil','Parent material'],2],['Soil texture depends mainly on?',['Colour','Particle size','Temperature','Organic label'],1],['Which soil holds the most water?',['Sand','Clay','Gravel','Silt'],1],['Soil pH below 7 is?',['Alkaline','Neutral','Acidic','Saline'],2],['A good soil structure improves?',['Root growth','Only colour','Wind speed','Temperature'],0]],
machinery:[['Which is a primary tillage implement?',['Harrow','Mouldboard plough','Roller','Leveller'],1],['PTO on a tractor stands for?',['Power Take-Off','Pull Tractor Operation','Pressure Take-Off','Power Torque Output'],0],['A seed drill is used for?',['Harvesting crops','Sowing seeds in rows','Spraying pesticide','Threshing grain'],1],['Drawbar pull of a tractor is measured with a?',['Tachometer','Speedometer','Dynamometer','Hygrometer'],2],['A combine harvester performs?',['Only cutting','Only threshing','Tillage and sowing','Reaping, threshing and winnowing'],3]],
energy:[['The main combustible gas in biogas is?',['Carbon dioxide','Methane','Nitrogen','Oxygen'],1],['Photovoltaic cells convert sunlight directly into?',['Heat','Electricity','Steam','Biogas'],1],['Which of these is NOT a renewable source?',['Solar','Wind','Coal','Biomass'],2],['A wind turbine converts wind energy into?',['Chemical energy','Mechanical/electrical energy','Nuclear energy','Sound energy'],1],['Optimum temperature range for biogas production is about?',['0–5°C','30–40°C','70–80°C','95–100°C'],1]],
food:[['Pasteurization of milk is done to?',['Freeze it','Destroy harmful microbes','Add flavour','Increase moisture'],1],['Which dryer suits liquid foods like milk?',['Tray dryer','Sun drying','Spray dryer','Bin dryer'],2],['Cold storage preserves produce mainly by?',['Adding preservatives','Slowing spoilage processes','Removing all water','Sterilizing it'],1],['Parboiling is a treatment associated with?',['Wheat','Rice','Cotton','Sugarcane'],1],['Winnowing separates grain from?',['Stones','Chaff','Water','Oil'],1]],
surveying:[['Which instrument measures horizontal and vertical angles?',['Chain','Theodolite','Level staff','Planimeter'],1],['Contour lines join points of equal?',['Temperature','Rainfall','Elevation','Slope'],2],['Levelling is used to determine?',['Soil type','Differences in elevation','Wind speed','Area colour'],1],['GPS stands for?',['General Plot Survey','Global Positioning System','Ground Plane Station','Geographic Point Scale'],1],['A planimeter measures?',['Angles','Volume','Area on a map','Temperature'],2]]};
let quiz='irrigation',order=[],pos=0,score=0,wrong=[],selected=null,checked=false,summary=false;
const answerBox=document.querySelector('#answers'),nextBtn=document.querySelector('#nextQuestion');
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function startQuiz(bank,indices){quiz=bank;order=shuffle(indices||quizzes[bank].map((_,i)=>i));pos=0;score=0;wrong=[];summary=false;showQuestion()}
function showQuestion(){
  const q=quizzes[quiz][order[pos]];selected=null;checked=false;
  document.querySelector('#quizLabel').textContent=QUIZ_TITLES[quiz].toUpperCase();
  document.querySelector('#questionNumber').textContent=`${pos+1} / ${order.length}`;
  document.querySelector('#questionText').textContent=q[0];
  document.querySelector('#progressBar').style.width=`${(pos+1)/order.length*100}%`;
  document.querySelector('#quizFeedback').textContent='';
  nextBtn.textContent='Check answer';nextBtn.disabled=true;
  answerBox.innerHTML=q[1].map((a,i)=>`<button class="answer" data-index="${i}">${String.fromCharCode(65+i)}. ${a}</button>`).join('');
  answerBox.querySelectorAll('.answer').forEach(b=>b.onclick=()=>{if(checked)return;answerBox.querySelectorAll('.answer').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');selected=+b.dataset.index;nextBtn.disabled=false});
}
function showSummary(){
  summary=true;
  const total=order.length;
  document.querySelector('#questionNumber').textContent='✓ done';
  document.querySelector('#progressBar').style.width='100%';
  document.querySelector('#questionText').textContent=`You scored ${score} / ${total}`;
  document.querySelector('#quizFeedback').textContent=score===total?'Perfect! You have mastered this topic.':score>=Math.ceil(total*0.6)?'Good work — review the ones you missed.':'Keep practising — try the wrong ones again.';
  if(score===total)localStorage.setItem('theciae-perfect','1');
  recordStudy();
  answerBox.innerHTML=wrong.length?`<button class="answer" id="retryWrong">↻ Retry the ${wrong.length} you got wrong</button>`:'';
  const rw=document.querySelector('#retryWrong');if(rw)rw.onclick=()=>startQuiz(quiz,wrong);
  nextBtn.textContent='Restart quiz';nextBtn.disabled=false;
}
nextBtn.onclick=()=>{
  if(summary){startQuiz(quiz);return}
  const q=quizzes[quiz][order[pos]];
  if(!checked){
    checked=true;
    answerBox.querySelectorAll('.answer').forEach(b=>{const i=+b.dataset.index;if(i===q[2])b.classList.add('correct');if(i===selected&&i!==q[2])b.classList.add('wrong')});
    if(selected===q[2])score++;else wrong.push(order[pos]);
    document.querySelector('#quizFeedback').textContent=selected===q[2]?'Correct — well done!':'Not quite. Review the correct answer.';
    nextBtn.textContent=pos===order.length-1?'See result →':'Next question →';
  }else{
    pos++;
    if(pos>=order.length)showSummary();else showQuestion();
  }
};
document.querySelectorAll('.quiz-option').forEach(b=>b.onclick=()=>{document.querySelectorAll('.quiz-option').forEach(x=>x.classList.remove('active'));b.classList.add('active');startQuiz(b.dataset.quiz)});
startQuiz('irrigation');
document.querySelector('#year').textContent=new Date().getFullYear();

// ---- gentle reveal-on-scroll for sections ----
if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
  const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{threshold:.12});
  document.querySelectorAll('.section, .cta').forEach(el=>{el.classList.add('fade-up');io.observe(el)});
}
