/* Teaching Tracker add-on: Computer curriculum P1-P7 (suggested scheme, not official NCDC)
   T = Theory, P = Practical, B = Both */
(function(){
const CUR={
1:["B|Introducing the computer: what it is and where we see it","P|Switching the computer on and off correctly","T|Parts of a computer: monitor, keyboard, mouse, system unit","P|Mouse skills: point, click, double-click, drag","P|Keyboard familiarisation: letters and numbers","T|Rules and care of the computer lab"],
2:["T|Uses of computers at home, school, hospital, bank and market","P|Typing my name and short words","P|Drawing shapes and colouring in Paint","T|Computer care and safety: dust, water, power","T|Other ICT devices: phone, radio, TV, calculator","P|Opening and closing programs"],
3:["T|Input and output devices","P|Typing words and sentences","P|Saving and opening a file","P|Drawing pictures in Paint: tools, fill, save","T|Storage devices: flash disk, memory card, hard disk","T|Healthy computer use: posture and rest"],
4:["T|Hardware and software","T|Types of computers: desktop, laptop, tablet, smartphone","P|Creating, naming and organising files and folders","P|Word processing: typing, bold, italic, underline, font size","P|Typing speed practice","T|ICT in the community: mobile money, radio, TV, internet"],
5:["T|The system unit, memory and processor","P|Word processing: alignment, copy, cut, paste, print","P|Inserting pictures and borders in a document","T|Operating system and common programs","T|Computer viruses and how to protect a computer","P|Introduction to spreadsheets: rows, columns, cells"],
6:["T|History and generations of computers","P|Spreadsheet: entering data and adding numbers","P|Presentation: making a simple slideshow","T|Communication: email, social media, video calls","P|Safe internet search using a browser","T|Staying safe online and cyberbullying"],
7:["T|Computer networks and the internet","P|Spreadsheet formulas and simple charts","P|Presentation: slides with pictures and transitions","P|Sending and receiving email (if available)","T|Algorithms and flowcharts: steps to solve a problem","P|Block coding in Scratch: moving and repeating","T|Careers and positive uses of ICT; revision"]
};
const KN={T:'Theory',P:'Practical',B:'Theory + Practical'},SP={T:'10/90',P:'80/20',B:'50/50'},KC={T:'c2',P:'c1',B:''};
const LV={};
const today=()=>new Date().toISOString().slice(0,10);
const lvlOf=()=>{const c=cc(),m=c&&/[1-7]/.exec(c.name);return m?+m[0]:4};
const curLvl=()=>LV[cs().id+'_'+sel.c]||lvlOf();
const topics=l=>CUR[l].map((x,i)=>{const[k,t]=x.split('|');return{id:l+'.'+i,k,t}});
const docId=()=>`cur_${cs().id}_${sel.c}`;
const getDone=()=>{const d=Ls.find(l=>l.id===docId());return d&&d.done?d.done:{}};
async function mark(id,on,date){
  const done=JSON.parse(JSON.stringify(getDone()));
  if(on)done[id]={d:date||today()};else delete done[id];
  await put('lessons',docId(),{sid:'cur_'+cs().id,ci:sel.c,done});
}
function vCur(){
  const n=need();if(n)return pickers()+n;
  const l=curLvl(),ts=topics(l),done=getDone();
  const cnt=k=>ts.filter(t=>(t.k===k||t.k==='B')&&done[t.id]).length,tot=k=>ts.filter(t=>t.k===k||t.k==='B').length;
  const nd=ts.filter(t=>done[t.id]).length,p=Math.round(nd/ts.length*100);
  return pickers()+`<div class="card"><h2>Computer curriculum</h2>
  <p class="mut">Suggested scheme of work. Tick each topic once taught.</p>
  <label>Topics for</label><select id="cl">${[1,2,3,4,5,6,7].map(i=>`<option value="${i}"${i===l?' selected':''}>Primary ${i}</option>`).join('')}</select>
  <h3>Syllabus covered: ${p}% (${nd} of ${ts.length})</h3><div style="background:var(--bg);border-radius:4px"><div class="bar" style="width:${p}%"></div></div>
  <p class="mut">Theory taught ${cnt('T')} of ${tot('T')} · Practical taught ${cnt('P')} of ${tot('P')}</p>
  <table><tr><th>Done</th><th>Topic</th><th>Type</th><th>Date</th></tr>
  ${ts.map(t=>`<tr><td><input type="checkbox" data-tp="${t.id}"${done[t.id]?' checked':''}></td><td>${e(t.t)}</td><td class="${KC[t.k]}">${KN[t.k]}</td><td>${e(done[t.id]?done[t.id].d:'')}</td></tr>`).join('')}</table></div>`;
}
function bCur(){
  const c=$('cl');if(c)c.onchange=()=>{LV[cs().id+'_'+sel.c]=+c.value;render()};
  document.querySelectorAll('[data-tp]').forEach(b=>b.onchange=async()=>{await mark(b.dataset.tp,b.checked);toast(b.checked?'Marked as taught':'Unmarked')});
}
function inject(){
  const f=$('f_topic'),sv=$('save');if(!f||!sv||!cc())return;
  const l=curLvl(),done=getDone(),ts=topics(l).filter(t=>!done[t.id]);
  const box=document.createElement('div');
  box.innerHTML=`<label>Pick from computer curriculum (Primary ${l})</label><select id="f_cur"><option value="">– choose a topic –</option>${ts.map(t=>`<option value="${t.id}">${e(t.t)} (${KN[t.k]})</option>`).join('')}</select>`;
  f.previousElementSibling.before(box);
  const sel2=$('f_cur');
  sel2.onchange=()=>{const t=topics(l).find(x=>x.id===sel2.value);if(!t)return;f.value=t.t;const sp=$('f_split');if(sp)sp.value=SP[t.k]};
  const o=sv.onclick;
  sv.onclick=async()=>{const id=sel2.value,dt=$('f_date').value;await o();if(id)await mark(id,true,dt)};
}
const R0=render;
render=function(){
  const cur=tab==='Curriculum'&&uid;
  if(cur)tab='Progress';
  R0();
  if(cur){
    tab='Curriculum';
    document.querySelectorAll('[data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t==='Curriculum'));
    $('m').innerHTML=vCur();bindPick();bCur();return;
  }
  if(tab==='Lesson'&&uid)inject();
};
if(!TABS.includes('Curriculum'))TABS.splice(1,0,'Curriculum');
if(uid)render();
})();
