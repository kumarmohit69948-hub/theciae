// ---- syllabus course library ----
const DEPTS={FMPE:'Farm Machinery & Power Engineering',SWCE:'Soil & Water Conservation Engineering',IDE:'Irrigation & Drainage Engineering',PFE:'Processing & Food Engineering',REE:'Renewable Energy Engineering',CSE:'Computer Science & Engineering',AS:'Applied Sciences',CAE:'Agricultural Engineering',SEC:'Skill Enhancement',MDC:'Multidisciplinary Course',AEC:'Ability Enhancement Course',VAC:'Value-Added Course',FC:'Foundation Course'};
const PILLS=[['all','All'],['starred','★ My courses'],['Semester 1','Sem 1'],['Semester 2','Sem 2'],['Semester 3','Sem 3'],['Semester 4','Sem 4'],['Semester 5','Sem 5'],['Semester 6','Sem 6'],['Semester 7','Sem 7'],['Semester 8','Sem 8'],['Semester 8 — Electives','Electives'],['Skill Enhancement Courses (Semester 2)','Skill Modules']];
const ICONS={'Semester 1':'S1','Semester 2':'S2','Semester 3':'S3','Semester 4':'S4','Semester 5':'S5','Semester 6':'S6','Semester 7':'S7','Semester 8':'S8','Semester 8 — Electives':'EL','Skill Enhancement Courses (Semester 2)':'SK'};
const grid=document.querySelector('#courseGrid'), search=document.querySelector('#searchInput'), pillBox=document.querySelector('#semPills'), emptyState=document.querySelector('#emptyState');
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const dept=code=>DEPTS[code.replace(/[^A-Z].*$/,'')]||'Agricultural Engineering';
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||d)}catch(e){return JSON.parse(d)}};
let courses=[], activePill='all', filesIdx={};
let progress=load('theciae-progress','{}'), stars=new Set(load('theciae-stars','[]'));
const doneCount=c=>{const p=progress[c.code]||{};return c.lectures.filter(l=>p[l.n]).length};

// Discover uploaded files by reading the repo tree from the GitHub API.
// Any file dropped into courses/<Semester>/<Course>/<Lecture>/ on GitHub
// shows up here automatically on the next page load.
const REPO='kumarmohit69948-hub/theciae', BRANCHES=['main','feat/syllabus-course-folders'];
async function loadFiles(){
  const cached=sessionStorage.getItem('theciae-files-v1');
  if(cached)return JSON.parse(cached);
  for(const br of BRANCHES){
    try{
      const r=await fetch(`https://api.github.com/repos/${REPO}/git/trees/${br}?recursive=1`);
      if(!r.ok)continue;
      const t=await r.json();
      const files=(t.tree||[]).filter(e=>e.type==='blob'&&e.path.startsWith('courses/')&&!/(\.gitkeep|README\.md)$/.test(e.path)).map(e=>e.path);
      if(files.length){const out={branch:br,files};sessionStorage.setItem('theciae-files-v1',JSON.stringify(out));return out}
    }catch(e){}
  }
  return {branch:'main',files:[]};
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
    const f={name,raw,cdn};
    if(seg.length===4){idx[code].course.push(f)}
    else{const n=parseInt(seg[3],10);if(isNaN(n)){idx[code].course.push(f)}else{(idx[code].lectures[n]=idx[code].lectures[n]||[]).push(f)}}
  });
  return idx;
}
const fileCount=code=>{const f=filesIdx[code];return f?f.course.length+Object.values(f.lectures).reduce((a,b)=>a+b.length,0):0};

const SYLLABUS_CARD=`<article class="resource-card course-card"><div class="card-top"><span class="file-icon">PDF</span><span class="tag">Official Syllabus</span></div><h3>B.Tech. Agricultural Engineering — 6th Deans' Committee Syllabus</h3><p>Complete curriculum document</p><div class="card-bottom"><span>All Semesters</span><a href="assets/btech-agril-engg-6th-dean-syllabus.pdf" download>Download ↓</a></div></article>`;

function renderCourses(){
  const q=search.value.trim().toLowerCase();
  const matches=courses.filter(c=>(activePill==='all'||(activePill==='starred'?stars.has(c.code):c.section===activePill))&&(!q||c.text.includes(q)));
  grid.innerHTML=(activePill==='all'&&!q?SYLLABUS_CARD:'')+matches.map(c=>{
    const nf=fileCount(c.code), dn=doneCount(c), tot=c.lectures.length;
    const status=c.practical?'Practical / skill module':tot?(dn?`${dn}/${tot} done`:tot+' lectures'):'Plan coming soon';
    return `<article class="resource-card course-card" data-i="${c.i}"><div class="card-top"><span class="file-icon">${ICONS[c.section]||'—'}</span><span class="card-top-right"><span class="tag">${esc(c.code)}</span><button class="star${stars.has(c.code)?' on':''}" data-star="${esc(c.code)}" title="Save to My courses">★</button></span></div><h3>${esc(c.title)}</h3><p>${esc(dept(c.code))}</p>${dn?`<div class="mini-progress"><i style="width:${Math.round(dn/tot*100)}%"></i></div>`:''}<div class="card-bottom"><span>${status}${nf?` · <b class="has-files">${nf} file${nf>1?'s':''}</b>`:''}</span><a href="#" data-i="${c.i}">View details →</a></div></article>`}).join('');
  emptyState.hidden=!!matches.length||(activePill==='all'&&!q);
  if(activePill==='starred'&&!matches.length&&!q){emptyState.hidden=false;emptyState.textContent='No saved courses yet — tap the ★ on any course card to pin it here.'}
  else emptyState.textContent='No matching courses yet. Try another search.';
}
let openCourse=null;
function updateLectureProgress(c){
  const dn=doneCount(c), tot=c.lectures.length, prog=document.querySelector('#lecProg');
  prog.hidden=!tot;
  if(tot){document.querySelector('#lecProgBar').style.width=Math.round(dn/tot*100)+'%';document.querySelector('#lecProgText').textContent=`${dn} of ${tot} lectures completed`}
}
function fileLinks(list){
  return `<span class="syl-files">${list.map(x=>/\.pdf$/i.test(x.name)
    ?`<a href="${esc(x.cdn)}" class="pdf-chip" data-name="${esc(x.name)}" data-dl="${esc(x.raw)}">${esc(x.name)} — view ⤢</a>`
    :`<a href="${esc(x.raw)}" target="_blank" rel="noopener" download>${esc(x.name)} ↓</a>`).join('')}</span>`;
}
function openLecture(i){
  const c=courses[i], f=filesIdx[c.code]||{course:[],lectures:{}}, p=progress[c.code]||{};
  openCourse=c;
  document.querySelector('#lecCode').textContent=c.code+' · '+(PILLS.find(x=>x[0]===c.section)||['',''])[1].toUpperCase();
  document.querySelector('#lecTitle').textContent=c.title;
  updateLectureProgress(c);
  document.querySelector('#lecBody').innerHTML=
    (f.course.length?`<p class="syl-note"><strong>Course resources:</strong></p>${fileLinks(f.course)}`:'')+
    (c.lectures.length?`<ol class="syl-lectures">${c.lectures.map(l=>`<li class="${p[l.n]?'done':''}"><i class="lec-n">${String(l.n).padStart(2,'0')}</i>${esc(l.t)}${f.lectures[l.n]?fileLinks(f.lectures[l.n]):''}<label class="lec-check" title="Mark as completed"><input type="checkbox" data-n="${l.n}"${p[l.n]?' checked':''}></label></li>`).join('')}</ol>`:`<p class="syl-note">${c.practical?'Hands-on skill module — resources will be added directly under this course.':'Lecture-wise plan will be added soon.'}</p>`)+
    `<p class="syl-hint">Tick lectures as you complete them — your progress is saved on this device. Files uploaded to this course's folders on GitHub appear here automatically.</p>`;
  document.querySelector('#lectureDialog').showModal();
}
Promise.all([fetch('courses.json').then(r=>r.json()),loadFiles().catch(()=>({branch:'main',files:[]}))]).then(([sections,tree])=>{
  filesIdx=indexFiles(tree);
  let i=0;
  sections.forEach(sec=>sec.courses.forEach(c=>{courses.push({...c,section:sec.section,i:i++,text:(c.code+' '+c.title+' '+c.lectures.map(l=>l.t).join(' ')).toLowerCase()})}));
  document.querySelector('#resourceCount').textContent=courses.length;
  pillBox.innerHTML=PILLS.map(([v,l])=>`<button class="pill${v==='all'?' active':''}" data-v="${v}">${l}</button>`).join('');
  pillBox.querySelectorAll('.pill').forEach(b=>b.onclick=()=>{pillBox.querySelectorAll('.pill').forEach(x=>x.classList.remove('active'));b.classList.add('active');activePill=b.dataset.v;renderCourses()});
  renderCourses();
  grid.addEventListener('click',e=>{
    const st=e.target.closest('[data-star]');
    if(st){e.preventDefault();const code=st.dataset.star;stars.has(code)?stars.delete(code):stars.add(code);localStorage.setItem('theciae-stars',JSON.stringify([...stars]));renderCourses();return}
    const t=e.target.closest('[data-i]');if(!t)return;
    e.preventDefault();openLecture(+t.dataset.i);
  });
  search.addEventListener('input',renderCourses);
}).catch(()=>{grid.innerHTML='<p class="empty-state">Could not load the syllabus. Please refresh the page.</p>'});
document.querySelector('#closeLecture').onclick=()=>document.querySelector('#lectureDialog').close();
document.querySelector('#lecBody').addEventListener('change',e=>{
  const cb=e.target.closest('input[data-n]');if(!cb||!openCourse)return;
  const code=openCourse.code;progress[code]=progress[code]||{};
  if(cb.checked)progress[code][cb.dataset.n]=1;else delete progress[code][cb.dataset.n];
  localStorage.setItem('theciae-progress',JSON.stringify(progress));
  cb.closest('li').classList.toggle('done',cb.checked);
  updateLectureProgress(openCourse);renderCourses();
});
// in-page PDF viewer
document.querySelector('#lecBody').addEventListener('click',e=>{
  const a=e.target.closest('.pdf-chip');if(!a)return;
  e.preventDefault();
  document.querySelector('#pdfName').textContent=a.dataset.name;
  document.querySelector('#pdfDownload').href=a.dataset.dl;
  document.querySelector('#pdfFrame').src=a.href;
  document.querySelector('#pdfDialog').showModal();
});
document.querySelector('#closePdf').onclick=()=>{document.querySelector('#pdfDialog').close();document.querySelector('#pdfFrame').src='about:blank'};
// support dialog
document.querySelector('#openSupport').onclick=e=>{e.preventDefault();document.querySelector('#supportDialog').showModal()};
document.querySelector('#closeSupport').onclick=()=>document.querySelector('#supportDialog').close();

// ---- upload dialog ----
const dialog=document.querySelector('#uploadDialog');['openUpload','heroUpload','ctaUpload'].forEach(id=>document.querySelector('#'+id).onclick=()=>dialog.showModal());document.querySelector('#closeUpload').onclick=()=>dialog.close();document.querySelector('#cancelUpload').onclick=()=>dialog.close();
document.querySelector('#uploadForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target);const saved=load('theciae-uploads','[]');saved.unshift({title:f.get('title'),subject:f.get('subject'),semester:f.get('semester'),type:f.get('type')});localStorage.setItem('theciae-uploads',JSON.stringify(saved));dialog.close();e.target.reset();alert('Resource noted in this browser. Connect cloud storage before publishing so uploads are stored permanently.');});

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
