/* Teaching Tracker add-on: Teachers, Comments & Values log, Grading scale. Load AFTER curriculum.js */
(function(){
const SUBJ=['Mathematics','English','Computer','Science','Social Studies','Religious Education'];
const MAR=['Single','Married','Divorced','Widowed'],TIT=['Mr.','Ms.','Mrs.'];
const CAT=['General','Pupil progress','Behaviour','Parent / guardian','Head teacher','Self-reflection'];
const DEFV=['Respect','Honesty','Responsibility','Hard work','Cooperation','Patriotism','Tolerance','Integrity','Leadership','Cleanliness','Self-discipline'];
const DEFG={Exceeds:80,Meets:50,Developing:35};
const DESC={Exceeds:'Exceeds expectations. Applies skills in new situations.',Meets:'Meets expectations. Does the task independently.',Developing:'Partly there. Needs guidance and practice.','Not yet':'Not yet there. Needs close support.'};
const get=(id,def)=>{const d=Ls.find(l=>l.id===id);return d&&d.v!=null?d.v:def};
const keep=(id,v)=>put('lessons',id,{sid:'cfg:'+id,ci:0,v});
const T=()=>get('cfg_teachers',[]);
const o=(arr,v)=>arr.map(x=>`<option${x===v?' selected':''}>${e(x)}</option>`).join('');
const ini=n=>n.trim().split(/\s+/).filter(Boolean).map(w=>w[0].toUpperCase()).join('.');
const full=t=>`${t.ti} ${t.nm} (${t.ini})`;
let ED=-1;
function setT(id){const t=T().find(x=>x.id===id);if(t){window.teacher=full(t);try{localStorage.tt_t=id}catch(x){}}}
function applyScale(){const g=get('cfg_grading',DEFG);try{lv=p=>p>=g.Exceeds?['Exceeds',1]:p>=g.Meets?['Meets',1]:p>=g.Developing?['Developing',2]:['Not yet',3];return true}catch(x){return false}}

/* ---------- Teachers ---------- */
function vTeach(){
  const L=T(),t=ED>=0?L[ED]:{},ss=t.subj||[];
  return`<div class="card"><h2>${ED>=0?'Edit':'Add'} teacher</h2>
  <div class="row"><div><label>Title</label><select id="t_ti">${o(TIT,t.ti)}</select></div>
  <div style="flex:3"><label>Full name (e.g. Ojok Paul)</label><input id="t_nm" value="${e(t.nm)}"></div>
  <div><label>Initials</label><input id="t_in" value="${e(t.ini)}" placeholder="auto"></div></div>
  <div class="row"><div><label>Marital status</label><select id="t_ms">${o(MAR,t.ms)}</select></div>
  <div><label>Phone</label><input id="t_ph" type="tel" value="${e(t.ph)}"></div>
  <div><label>Email</label><input id="t_em" type="email" value="${e(t.em)}"></div></div>
  <div class="row"><div><label>Staff / registration no.</label><input id="t_id" value="${e(t.sn)}"></div>
  <div><label>Class teacher of</label><input id="t_ct" value="${e(t.ct)}" placeholder="e.g. Primary 5"></div>
  <div><label>School</label><input id="t_sc" value="${e(t.sc||(S[0]&&S[0].name)||'')}"></div></div>
  <label>Subjects taught</label><div class="row">${SUBJ.map((s,i)=>`<label style="flex:0 0 46%;color:var(--ink);margin:2px 0"><input type="checkbox" style="width:auto" class="t_sub" value="${s}"${ss.includes(s)?' checked':''}> ${s}</label>`).join('')}</div>
  <button class="b" id="t_save">Save teacher</button>${ED>=0?'<button class="b alt" id="t_cancel">Cancel</button>':''}</div>`+
  (L.length?L.map((x,i)=>`<div class="card"><h2>${e(full(x))}</h2><p class="mut">${e(x.ms)} · ${e((x.subj||[]).join(', ')||'No subjects')}${x.ct?' · Class teacher: '+e(x.ct):''}</p>
  <p class="mut">${e([x.sc,x.ph,x.em,x.sn&&'No. '+x.sn].filter(Boolean).join(' · '))}</p>
  <button class="b alt" data-te="${i}">Edit</button><button class="b alt" data-td="${i}">Delete</button><button class="b alt" data-tu="${x.id}">Use on reports</button></div>`).join(''):'<div class="card mut">No teachers yet. Add one above.</div>');
}
function bTeach(){
  const L=T();
  $('t_save').onclick=async()=>{
    const nm=$('t_nm').value.trim();if(!nm)return toast('Enter the teacher name');
    const t={id:ED>=0?L[ED].id:crypto.randomUUID(),ti:$('t_ti').value,nm,ini:$('t_in').value.trim()||ini(nm),ms:$('t_ms').value,ph:$('t_ph').value.trim(),em:$('t_em').value.trim(),sn:$('t_id').value.trim(),ct:$('t_ct').value.trim(),sc:$('t_sc').value.trim(),
      subj:[...document.querySelectorAll('.t_sub:checked')].map(x=>x.value)};
    const n=L.slice();if(ED>=0)n[ED]=t;else n.push(t);ED=-1;await keep('cfg_teachers',n);if(!window.teacher)setT(t.id);toast('Teacher saved');
  };
  if($('t_cancel'))$('t_cancel').onclick=()=>{ED=-1;render()};
  document.querySelectorAll('[data-te]').forEach(b=>b.onclick=()=>{ED=+b.dataset.te;render();scrollTo(0,0)});
  document.querySelectorAll('[data-td]').forEach(b=>b.onclick=async()=>{if(confirm('Delete this teacher?')){const n=L.slice();n.splice(+b.dataset.td,1);await keep('cfg_teachers',n)}});
  document.querySelectorAll('[data-tu]').forEach(b=>b.onclick=()=>{setT(b.dataset.tu);toast('Reports will use this teacher')});
}

/* ---------- Comments & values log ---------- */
function vLog(){
  const n=need();if(n)return pickers()+n;
  const s=cs(),cls=cc(),V=get('cfg_values',DEFV),Tc=T(),all=get('cfg_log',[]);
  const lg=all.filter(x=>x.sid===s.id&&x.ci==sel.c).sort((a,b)=>(b.d||'').localeCompare(a.d||''));
  const pu=cls.pupils||[],cnt={};
  lg.forEach(x=>(x.vals||[]).forEach(v=>{(cnt[x.about]=cnt[x.about]||{})[v]=(cnt[x.about][v]||0)+1}));
  const sm=pu.filter(p=>cnt[p]).map(p=>`<tr><td>${e(p)}</td><td>${Object.entries(cnt[p]).sort((a,b)=>b[1]-a[1]).map(([v,c])=>`${e(v)} ×${c}`).join(', ')}</td></tr>`).join('');
  return pickers()+`<div class="card"><h2>Add comment and values</h2>
  <div class="row"><div><label>Date</label><input type="date" id="g_d" value="${new Date().toISOString().slice(0,10)}"></div>
  <div><label>Written by</label><select id="g_t">${Tc.map(t=>`<option value="${t.id}">${e(full(t))}</option>`).join('')||'<option value="">(add teachers first)</option>'}</select></div></div>
  <div class="row"><div><label>About</label><select id="g_a"><option>Whole class</option>${pu.map(p=>`<option>${e(p)}</option>`).join('')}</select></div>
  <div><label>Type of comment</label><select id="g_c">${o(CAT)}</select></div></div>
  <label>Values exhibited</label><div class="row">${V.map(v=>`<label style="flex:0 0 46%;color:var(--ink);margin:2px 0"><input type="checkbox" style="width:auto" class="g_v" value="${e(v)}"> ${e(v)}</label>`).join('')}</div>
  <label>Comment</label><textarea id="g_x"></textarea><button class="b" id="g_save">Save entry</button></div>
  ${sm?`<div class="card"><h2>Values shown by pupil</h2><table><tr><th>Pupil</th><th>Values observed</th></tr>${sm}</table></div>`:''}
  <div class="card"><h2>Entries for ${e(cls.name)}</h2>${lg.map(x=>{const t=Tc.find(y=>y.id===x.tid);return`<p><b>${e(x.about)}</b> · ${e(x.cat)} · <span class="mut">${e(x.d)}${t?' · '+e(t.ini):''}</span><br>${e(x.text)}${(x.vals||[]).length?`<br><span class="mut">Values: ${e(x.vals.join(', '))}</span>`:''}<br><a href="#" data-gd="${x.id}" class="mut">Delete</a></p>`}).join('<hr style="border:0;border-top:1px solid var(--ln)">')||'<p class="mut">No entries yet.</p>'}</div>`;
}
function bLog(){
  const sv=$('g_save');if(!sv)return;
  try{if(localStorage.tt_t&&$('g_t'))$('g_t').value=localStorage.tt_t}catch(x){}
  sv.onclick=async()=>{
    const text=$('g_x').value.trim(),vals=[...document.querySelectorAll('.g_v:checked')].map(x=>x.value);
    if(!text&&!vals.length)return toast('Write a comment or pick a value');
    const en={id:crypto.randomUUID(),sid:cs().id,ci:sel.c,d:$('g_d').value,tid:$('g_t').value,about:$('g_a').value,cat:$('g_c').value,vals,text};
    await keep('cfg_log',get('cfg_log',[]).concat(en));toast('Entry saved');
  };
  document.querySelectorAll('[data-gd]').forEach(a=>a.onclick=async ev=>{ev.preventDefault();if(confirm('Delete this entry?'))await keep('cfg_log',get('cfg_log',[]).filter(x=>x.id!==a.dataset.gd))});
}

/* ---------- Settings: grading scale and values ---------- */
function vSet(){
  const g=get('cfg_grading',DEFG),V=get('cfg_values',DEFV),ok=applyScale();
  return`<div class="card"><h2>Grading scale</h2><p class="mut">Minimum % for each level. Used in pupil progress and reports.</p>
  ${[['Exceeds','c1'],['Meets','c1'],['Developing','c2']].map(([k,c])=>`<div class="row" style="align-items:end"><div class="${c}" style="padding:8px;border-radius:7px"><b>${k}</b><br><span class="mut">${DESC[k]}</span></div><div style="flex:0 0 100px"><label>From %</label><input type="number" min="0" max="100" id="gr_${k}" value="${g[k]}"></div></div>`).join('')}
  <div class="row"><div class="c3" style="padding:8px;border-radius:7px"><b>Not yet</b><br><span class="mut">${DESC['Not yet']} Below the Developing mark.</span></div></div>
  ${ok?'':'<p style="color:#c0392b">To apply these marks on the Progress and Report tabs, open index.html and change <b>const lv=</b> to <b>let lv=</b>.</p>'}
  <button class="b" id="gr_save">Save grading scale</button></div>
  <div class="card"><h2>Values list</h2><p class="mut">One value per line. These appear as tick boxes in the Log tab.</p>
  <textarea id="va" style="min-height:140px">${e(V.join('\n'))}</textarea><button class="b" id="va_save">Save values</button></div>`;
}
function bSet(){
  $('gr_save').onclick=async()=>{
    const g={Exceeds:+$('gr_Exceeds').value,Meets:+$('gr_Meets').value,Developing:+$('gr_Developing').value};
    if(!(g.Exceeds>g.Meets&&g.Meets>g.Developing&&g.Developing>0))return toast('Marks must go down: Exceeds > Meets > Developing');
    await keep('cfg_grading',g);toast('Grading scale saved');
  };
  $('va_save').onclick=async()=>{const v=$('va').value.split('\n').map(x=>x.trim()).filter(Boolean);if(!v.length)return toast('Add at least one value');await keep('cfg_values',v);toast('Values saved')};
}

/* ---------- Lesson tab: taught-by picker ---------- */
function inject(){
  const d=$('f_date'),sv=$('save'),Tc=T();if(!d||!sv||!Tc.length||!cc())return;
  const l=lessonAt(sel.w)||{};let cur=l.teacherId;try{cur=cur||localStorage.tt_t}catch(x){}
  const box=document.createElement('div');
  box.innerHTML=`<label>Taught by</label><select id="f_tch">${Tc.map(t=>`<option value="${t.id}"${t.id===cur?' selected':''}>${e(full(t))}</option>`).join('')}</select>`;
  d.closest('.row').before(box);
  const old=sv.onclick;
  sv.onclick=async()=>{const tid=$('f_tch').value;setT(tid);await old();const nl=lessonAt(sel.w);if(nl){const{id,...r}=nl;await put('lessons',id,{...r,teacherId:tid,teacher:window.teacher})}};
}

const X={Teachers:vTeach,Log:vLog,Settings:vSet},B={Teachers:bTeach,Log:bLog,Settings:bSet};
const R0=render;
render=function(){
  const tb=tab,ex=uid&&X[tb];
  if(uid&&!window.teacher){let id;try{id=localStorage.tt_t}catch(x){}const Tc=T();if(Tc.length)setT(id||Tc[0].id)}
  applyScale();
  if(ex)tab='Schools';
  R0();
  if(ex){
    tab=tb;
    document.querySelectorAll('[data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===tb));
    $('m').innerHTML=X[tb]();bindPick();B[tb]();return;
  }
  if(tab==='Lesson'&&uid)inject();
};
['Log','Teachers','Settings'].forEach(t=>{if(!TABS.includes(t))TABS.push(t)});
if(uid)render();
})();
