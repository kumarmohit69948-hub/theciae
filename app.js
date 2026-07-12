// ---- syllabus course library ----
const DEPTS={FMPE:'Farm Machinery & Power Engineering',SWCE:'Soil & Water Conservation Engineering',IDE:'Irrigation & Drainage Engineering',PFE:'Processing & Food Engineering',REE:'Renewable Energy Engineering',CSE:'Computer Science & Engineering',AS:'Applied Sciences',CAE:'Agricultural Engineering',SEC:'Skill Enhancement',MDC:'Multidisciplinary Course',AEC:'Ability Enhancement Course',VAC:'Value-Added Course',FC:'Foundation Course'};
const PILLS=[['all','All'],['Semester 1','Sem 1'],['Semester 2','Sem 2'],['Semester 3','Sem 3'],['Semester 4','Sem 4'],['Semester 5','Sem 5'],['Semester 6','Sem 6'],['Semester 7','Sem 7'],['Semester 8','Sem 8'],['Semester 8 — Electives','Electives'],['Skill Enhancement Courses (Semester 2)','Skill Modules']];
const ICONS={'Semester 1':'S1','Semester 2':'S2','Semester 3':'S3','Semester 4':'S4','Semester 5':'S5','Semester 6':'S6','Semester 7':'S7','Semester 8':'S8','Semester 8 — Electives':'EL','Skill Enhancement Courses (Semester 2)':'SK'};
const grid=document.querySelector('#courseGrid'), search=document.querySelector('#searchInput'), pillBox=document.querySelector('#semPills'), emptyState=document.querySelector('#emptyState');
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const dept=code=>DEPTS[code.replace(/[^A-Z].*$/,'')]||'Agricultural Engineering';
let courses=[], activePill='all', filesIdx={};

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
    const url=`https://raw.githubusercontent.com/${REPO}/${branch}/${seg.map(encodeURIComponent).join('/')}`;
    if(seg.length===4){idx[code].course.push({name,url})}
    else{const n=parseInt(seg[3],10);if(isNaN(n)){idx[code].course.push({name,url})}else{(idx[code].lectures[n]=idx[code].lectures[n]||[]).push({name,url})}}
  });
  return idx;
}
const fileCount=code=>{const f=filesIdx[code];return f?f.course.length+Object.values(f.lectures).reduce((a,b)=>a+b.length,0):0};

const SYLLABUS_CARD=`<article class="resource-card course-card"><div class="card-top"><span class="file-icon">PDF</span><span class="tag">Official Syllabus</span></div><h3>B.Tech. Agricultural Engineering — 6th Deans' Committee Syllabus</h3><p>Complete curriculum document</p><div class="card-bottom"><span>All Semesters</span><a href="assets/btech-agril-engg-6th-dean-syllabus.pdf" download>Download ↓</a></div></article>`;

function renderCourses(){
  const q=search.value.trim().toLowerCase();
  const matches=courses.filter(c=>(activePill==='all'||c.section===activePill)&&(!q||c.text.includes(q)));
  grid.innerHTML=(activePill==='all'&&!q?SYLLABUS_CARD:'')+matches.map(c=>{const nf=fileCount(c.code);return `<article class="resource-card course-card" data-i="${c.i}"><div class="card-top"><span class="file-icon">${ICONS[c.section]||'—'}</span><span class="tag">${esc(c.code)}</span></div><h3>${esc(c.title)}</h3><p>${esc(dept(c.code))}</p><div class="card-bottom"><span>${c.practical?'Practical / skill module':c.lectures.length?c.lectures.length+' lectures':'Plan coming soon'}${nf?` · <b class="has-files">${nf} file${nf>1?'s':''}</b>`:''}</span><a href="#" data-i="${c.i}">View details →</a></div></article>`}).join('');
  emptyState.hidden=!!matches.length||(activePill==='all'&&!q);
}
function openLecture(i){
  const c=courses[i], f=filesIdx[c.code]||{course:[],lectures:{}};
  const links=list=>`<span class="syl-files">${list.map(x=>`<a href="${x.url}" target="_blank" rel="noopener" download>${esc(x.name)} ↓</a>`).join('')}</span>`;
  document.querySelector('#lecCode').textContent=c.code+' · '+(PILLS.find(p=>p[0]===c.section)||['',''])[1].toUpperCase();
  document.querySelector('#lecTitle').textContent=c.title;
  document.querySelector('#lecBody').innerHTML=
    (f.course.length?`<p class="syl-note"><strong>Course resources:</strong></p>${links(f.course)}`:'')+
    (c.lectures.length?`<ol class="syl-lectures">${c.lectures.map(l=>`<li><i class="lec-n">${String(l.n).padStart(2,'0')}</i>${esc(l.t)}${f.lectures[l.n]?links(f.lectures[l.n]):''}</li>`).join('')}</ol>`:`<p class="syl-note">${c.practical?'Hands-on skill module — resources will be added directly under this course.':'Lecture-wise plan will be added soon.'}</p>`)+
    `<p class="syl-hint">Notes and papers uploaded to this course's folders on GitHub appear here automatically.</p>`;
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
  grid.addEventListener('click',e=>{const t=e.target.closest('[data-i]');if(!t)return;if(t.tagName==='A'&&!t.dataset.i)return;e.preventDefault();openLecture(+t.dataset.i)});
  search.addEventListener('input',renderCourses);
}).catch(()=>{grid.innerHTML='<p class="empty-state">Could not load the syllabus. Please refresh the page.</p>'});
document.querySelector('#closeLecture').onclick=()=>document.querySelector('#lectureDialog').close();

// ---- upload dialog ----
const dialog=document.querySelector('#uploadDialog');['openUpload','heroUpload','ctaUpload'].forEach(id=>document.querySelector('#'+id).onclick=()=>dialog.showModal());document.querySelector('#closeUpload').onclick=()=>dialog.close();document.querySelector('#cancelUpload').onclick=()=>dialog.close();
document.querySelector('#uploadForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target);const saved=JSON.parse(localStorage.getItem('theciae-uploads')||'[]');saved.unshift({title:f.get('title'),subject:f.get('subject'),semester:f.get('semester'),type:f.get('type')});localStorage.setItem('theciae-uploads',JSON.stringify(saved));dialog.close();e.target.reset();alert('Resource noted in this browser. Connect cloud storage before publishing so uploads are stored permanently.');});

// ---- quizzes ----
const quizzes={irrigation:[['Which method supplies water drop by drop near the roots?',['Flood irrigation','Drip irrigation','Furrow irrigation','Sprinkler irrigation'],1],['What is the main purpose of irrigation?',['Increase soil salinity','Meet crop water needs','Reduce sunlight','Replace fertilizer'],1],['Which device measures water flow in a channel?',['Weir','Thermometer','Barometer','Hygrometer'],0],['Water applied beyond the root zone is called?',['Runoff','Deep percolation','Evaporation','Infiltration'],1],['Which is a micro-irrigation method?',['Basin irrigation','Border irrigation','Drip irrigation','Wild flooding'],2]],soil:[['The uppermost layer of soil is called?',['Bedrock','Subsoil','Topsoil','Parent material'],2],['Soil texture depends mainly on?',['Colour','Particle size','Temperature','Organic label'],1],['Which soil holds the most water?',['Sand','Clay','Gravel','Silt'],1],['Soil pH below 7 is?',['Alkaline','Neutral','Acidic','Saline'],2],['A good soil structure improves?',['Root growth','Only colour','Wind speed','Temperature'],0]]};let quiz='irrigation',index=0,selected=null,checked=false;const answerBox=document.querySelector('#answers');function showQuestion(){const q=quizzes[quiz][index];selected=null;checked=false;document.querySelector('#quizLabel').textContent=quiz.toUpperCase()+' BASICS';document.querySelector('#questionNumber').textContent=`${index+1} / ${quizzes[quiz].length}`;document.querySelector('#questionText').textContent=q[0];document.querySelector('#progressBar').style.width=`${(index+1)/quizzes[quiz].length*100}%`;document.querySelector('#quizFeedback').textContent='';document.querySelector('#nextQuestion').textContent='Check answer';document.querySelector('#nextQuestion').disabled=true;answerBox.innerHTML=q[1].map((a,i)=>`<button class="answer" data-index="${i}">${String.fromCharCode(65+i)}. ${a}</button>`).join('');document.querySelectorAll('.answer').forEach(b=>b.onclick=()=>{if(checked)return;document.querySelectorAll('.answer').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');selected=+b.dataset.index;document.querySelector('#nextQuestion').disabled=false})}document.querySelector('#nextQuestion').onclick=()=>{const q=quizzes[quiz][index],btn=document.querySelector('#nextQuestion');if(!checked){checked=true;document.querySelectorAll('.answer').forEach(b=>{const i=+b.dataset.index;if(i===q[2])b.classList.add('correct');if(i===selected&&i!==q[2])b.classList.add('wrong')});document.querySelector('#quizFeedback').textContent=selected===q[2]?'Correct — well done!':'Not quite. Review the correct answer.';btn.textContent=index===q.length-1?'Restart quiz':'Next question →'}else{if(index===q.length-1)index=0;else index++;showQuestion()}};document.querySelectorAll('.quiz-option').forEach(b=>b.onclick=()=>{document.querySelectorAll('.quiz-option').forEach(x=>x.classList.remove('active'));b.classList.add('active');quiz=b.dataset.quiz;index=0;showQuestion()});showQuestion();document.querySelector('#year').textContent=new Date().getFullYear();
