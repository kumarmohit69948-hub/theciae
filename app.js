// ---- syllabus course library ----
const DEPTS={FMPE:'Farm Machinery & Power Engineering',SWCE:'Soil & Water Conservation Engineering',IDE:'Irrigation & Drainage Engineering',PFE:'Processing & Food Engineering',REE:'Renewable Energy Engineering',CSE:'Computer Science & Engineering',AS:'Applied Sciences',CAE:'Agricultural Engineering',SEC:'Skill Enhancement',MDC:'Multidisciplinary Course',AEC:'Ability Enhancement Course',VAC:'Value-Added Course',FC:'Foundation Course'};
const PILLS=[['all','All'],['Semester 1','Sem 1'],['Semester 2','Sem 2'],['Semester 3','Sem 3'],['Semester 4','Sem 4'],['Semester 5','Sem 5'],['Semester 6','Sem 6'],['Semester 7','Sem 7'],['Semester 8','Sem 8'],['Semester 8 — Electives','Electives'],['Skill Enhancement Courses (Semester 2)','Skill Modules']];
const ICONS={'Semester 1':'S1','Semester 2':'S2','Semester 3':'S3','Semester 4':'S4','Semester 5':'S5','Semester 6':'S6','Semester 7':'S7','Semester 8':'S8','Semester 8 — Electives':'EL','Skill Enhancement Courses (Semester 2)':'SK'};
const grid=document.querySelector('#courseGrid'), search=document.querySelector('#searchInput'), pillBox=document.querySelector('#semPills'), emptyState=document.querySelector('#emptyState');
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const dept=code=>DEPTS[code.replace(/[^A-Z].*$/,'')]||'Agricultural Engineering';
let courses=[], activePill='all';

const SYLLABUS_CARD=`<article class="resource-card course-card"><div class="card-top"><span class="file-icon">PDF</span><span class="tag">Official Syllabus</span></div><h3>B.Tech. Agricultural Engineering — 6th Deans' Committee Syllabus</h3><p>Complete curriculum document</p><div class="card-bottom"><span>All Semesters</span><a href="assets/btech-agril-engg-6th-dean-syllabus.pdf" download>Download ↓</a></div></article>`;

function renderCourses(){
  const q=search.value.trim().toLowerCase();
  const matches=courses.filter(c=>(activePill==='all'||c.section===activePill)&&(!q||c.text.includes(q)));
  grid.innerHTML=(activePill==='all'&&!q?SYLLABUS_CARD:'')+matches.map(c=>`<article class="resource-card course-card" data-i="${c.i}"><div class="card-top"><span class="file-icon">${ICONS[c.section]||'—'}</span><span class="tag">${esc(c.code)}</span></div><h3>${esc(c.title)}</h3><p>${esc(dept(c.code))}</p><div class="card-bottom"><span>${c.practical?'Practical / skill module':c.lectures.length?c.lectures.length+' lectures':'Plan coming soon'}</span><a href="#" data-i="${c.i}">View details →</a></div></article>`).join('');
  emptyState.hidden=!!matches.length||(activePill==='all'&&!q);
}
function openLecture(i){
  const c=courses[i];
  document.querySelector('#lecCode').textContent=c.code+' · '+(PILLS.find(p=>p[0]===c.section)||['',''])[1].toUpperCase();
  document.querySelector('#lecTitle').textContent=c.title;
  document.querySelector('#lecBody').innerHTML=c.lectures.length?`<ol class="syl-lectures">${c.lectures.map(l=>`<li>${esc(l)}</li>`).join('')}</ol>`:`<p class="syl-note">${c.practical?'Hands-on skill module — resources will be added directly under this course.':'Lecture-wise plan will be added soon.'}</p>`;
  document.querySelector('#lectureDialog').showModal();
}
fetch('courses.json').then(r=>r.json()).then(sections=>{
  let i=0;
  sections.forEach(sec=>sec.courses.forEach(c=>{courses.push({...c,section:sec.section,i:i++,text:(c.code+' '+c.title+' '+c.lectures.join(' ')).toLowerCase()})}));
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
