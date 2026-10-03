/* Teaching Tracker add-on: Summary, Parents, Backup. Load AFTER extras.js */
(function(){
const SUBJ=['Mathematics','English','Computer','Science','Social Studies','Religious Education'];
const get=(id,def)=>{const d=Ls.find(l=>l.id===id);return d&&d.v!=null?d.v:def};
const o=(arr,v)=>arr.map(x=>`<option${x===v?' selected':''}>${e(x)}</option>`).join('');
const key=k=>`cfg_${k}_${cs().id}_${sel.c}`;
const fname=s=>s.replace(/[^\w]+/g,'_');
const TH='border:1px solid #999;padding:4px;text-align:left;font-size:11px';
const file=(name,data,type)=>{const u=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);toast('Saved')};
const lvl=p=>{try{return lv(p)[0]}catch(x){return ''}};
const hdr=t=>`<div class="card"><h2>${t}</h2>`;

/* ---------- Class summary ---------- */
let SM='Term 1';
function comp(p,ls){const sc=[];ls.forEach(l=>{const m=(l.marks||{})[p];if(m&&m.s!==''&&m.s!=null&&l.outOf>0)sc.push(m.s/l.outOf*100)});return sc.length?Math.round(sc.reduce((a,b)=>a+b,0)/sc.length):null}
function table(){
  const rc=get(key('rc'),{}),ls=lessonsOf();
  const r=(cc().pupils||[]).map(p=>{
    const sc={...((rc[p+'|'+SM]||{}).sc||{})};
    if(sc.Computer===''||sc.Computer==null){const a=comp(p,ls);if(a!=null)sc.Computer=a}
    const v=SUBJ.filter(x=>sc[x]!==''&&sc[x]!=null);
    return{p,sc,avg:v.length?Math.round(v.reduce((a,x)=>a+ +sc[x],0)/v.length):null};
  }).sort((a,b)=>(b.avg==null?-1:b.avg)-(a.avg==null?-1:a.avg));
  r.forEach((x,i)=>x.pos=x.avg==null?'–':(i&&r[i-1].avg===x.avg?r[i-1].pos:i+1));
  return r;
}
function sumHTML(){
  const r=table(),av=r.filter(x=>x.avg!=null),ca=av.length?Math.round(av.reduce((a,x)=>a+x.avg,0)/av.length):null;
  const lc={};av.forEach(x=>lc[lvl(x.avg)]=(lc[lvl(x.avg)]||0)+1);
  return`<div style="font-family:Arial,sans-serif;color:#000;background:#fff;padding:6px"><h2 style="margin:0">Class summary – ${e(cc().name)} · ${e(SM)}</h2><p style="margin:4px 0 8px;font-size:12px">${e(cs().name)}</p>
  <table style="border-collapse:collapse;width:100%"><tr>${['Pos','Pupil',...SUBJ.map(s=>s.slice(0,5)+'.'),'Avg','Level'].map(h=>`<th style="${TH}">${h}</th>`).join('')}</tr>
  ${r.map(x=>`<tr><td style="${TH}">${x.pos}</td><td style="${TH}">${e(x.p)}</td>${SUBJ.map(s=>`<td style="${TH}">${e(x.sc[s])}</td>`).join('')}<td style="${TH}"><b>${x.avg==null?'–':x.avg}</b></td><td style="${TH}">${x.avg==null?'':e(lvl(x.avg))}</td></tr>`).join('')}</table>
  <p style="font-size:12px;margin-top:8px">Class average: <b>${ca==null?'–':ca+'%'}</b> · Highest: ${av.length?av[0].avg+'%':'–'} · Lowest: ${av.length?av[av.length-1].avg+'%':'–'} · ${Object.entries(lc).map(([k,v])=>`${e(k)} ${v}`).join(' · ')}</p></div>`;
}
function vSum(){
  const n=need();if(n)return pickers()+n;
  return pickers()+hdr('Class summary')+`<p class="mut">Uses scores saved in the Report Card tab. Computer fills from lesson marks.</p><label>Term</label><select id="sm">${o(['Term 1','Term 2','Term 3'],SM)}</select>
  <button class="b" id="sm_pdf">Download PDF</button></div><div class="card" id="smv">${sumHTML()}</div>`;
}
function bSum(){
  if(!$('sm'))return;
  $('sm').onchange=()=>{SM=$('sm').value;render()};
  $('sm_pdf').onclick=async()=>{if(!window.html2pdf)return toast('PDF tool did not load');toast('Preparing PDF…');
    file(`Summary_${fname(cc().name+SM)}.pdf`,await html2pdf().set({margin:8,jsPDF:{unit:'mm',format:'a4',orientation:'landscape'},html2canvas:{scale:2}}).from($('smv')).outputPdf('blob'),'application/pdf')};
}

/* ---------- Parents ---------- */
const TPL={
'Report card ready':'Dear {parent}, {pupil}\'s report card is ready. Please come to {school} to collect it. Thank you. – {teacher}',
'Absence':'Dear {parent}, {pupil} of {class} was absent from school today. Please let us know if there is a problem. – {teacher}',
'Praise':'Dear {parent}, I am happy to share that {pupil} has been doing very well in {class}. Please encourage them to keep it up. – {teacher}',
'Needs support':'Dear {parent}, {pupil} needs extra support in class. Please come to {school} so we can talk about how to help. – {teacher}',
'Meeting':'Dear {parent}, you are invited to a parents\' meeting at {school}. Please attend. – {teacher}',
'Homework':'Dear {parent}, please help {pupil} complete the homework given today. – {teacher}'
};
const PM={t:'Report card ready',x:TPL['Report card ready']};
const phone=n=>{let d=(n||'').replace(/\D/g,'');if(d.startsWith('0'))d='256'+d.slice(1);return d};
function vPar(){
  const n=need();if(n)return pickers()+n;
  const D=get(key('pup'),{}),pu=cc().pupils||[];
  return pickers()+hdr('Message parents')+`<label>Message type</label><select id="mt">${o(Object.keys(TPL),PM.t)}</select>
  <label>Message (you can edit it; {parent} {pupil} {class} {school} {teacher} are filled in)</label><textarea id="mx" style="min-height:110px">${e(PM.x)}</textarea>
  <p class="mut">Phone numbers come from the Pupils tab. Numbers starting with 0 are sent as +256.</p></div>
  <div class="card"><table><tr><th>Pupil</th><th>Parent</th><th></th></tr>${pu.map((p,i)=>{const d=D[p]||{};return`<tr><td>${e(p)}</td><td>${e(d.pa)||'–'}<br><span class="mut">${e(d.ph2)}</span></td><td>${d.ph2?`<button class="b" data-pw="${i}" style="margin:2px">WhatsApp</button><button class="b alt" data-ps="${i}" style="margin:2px">SMS</button>`:'<span class="mut">No phone</span>'}</td></tr>`}).join('')}</table></div>`;
}
function bPar(){
  if(!$('mt'))return;
  $('mt').onchange=()=>{PM.t=$('mt').value;PM.x=TPL[PM.t];render()};
  $('mx').oninput=()=>PM.x=$('mx').value;
  const msg=p=>{const d=(get(key('pup'),{}))[p]||{};return PM.x.replace(/\{parent\}/g,d.pa||'Parent/Guardian').replace(/\{pupil\}/g,p).replace(/\{class\}/g,cc().name).replace(/\{school\}/g,cs().name).replace(/\{teacher\}/g,window.teacher||'')};
  const num=p=>phone(((get(key('pup'),{}))[p]||{}).ph2);
  document.querySelectorAll('[data-pw]').forEach(b=>b.onclick=()=>{const p=cc().pupils[+b.dataset.pw];window.open('https://wa.me/'+num(p)+'?text='+encodeURIComponent(msg(p)),'_blank')});
  document.querySelectorAll('[data-ps]').forEach(b=>b.onclick=()=>{const p=cc().pupils[+b.dataset.ps];location.href='sms:+'+num(p)+'?body='+encodeURIComponent(msg(p))});
}

/* ---------- Backup ---------- */
function vBak(){
  return hdr('Backup and restore')+`<p class="mut">Your data is saved online. Download a copy now and then for safety.</p>
  <button class="b" id="bk_json">Download full backup</button><button class="b alt" id="bk_csv">Download lesson scores (CSV)</button></div>
  <div class="card"><h2>Restore from backup</h2><p class="mut">Choose a backup file you downloaded earlier. Items with the same ID are overwritten. Nothing is deleted.</p>
  <input type="file" accept=".json" id="rs_f"><button class="b" id="rs_go">Restore</button></div>`;
}
const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
function bBak(){
  if(!$('bk_json'))return;
  $('bk_json').onclick=()=>file('TeachingTracker_backup_'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({v:1,at:new Date().toISOString(),schools:S,lessons:Ls}),'application/json');
  $('bk_csv').onclick=()=>{
    const rows=[['School','Class','Week','Date','Topic','Pupil','Present','Score','Out of','Remark']];
    Ls.filter(l=>l.marks).forEach(l=>{const sc=S.find(x=>x.id===l.sid);Object.entries(l.marks).forEach(([p,m])=>rows.push([sc?sc.name:'',l.cls,l.w,l.date,l.topic,p,m.p?'Yes':'No',m.s,l.outOf,m.r]))});
    file('LessonScores.csv','\ufeff'+rows.map(r=>r.map(q).join(',')).join('\n'),'text/csv');
  };
  $('rs_go').onclick=async()=>{
    const f=$('rs_f').files[0];if(!f)return toast('Choose a backup file first');
    try{
      const j=JSON.parse(await f.text());if(!Array.isArray(j.schools)||!Array.isArray(j.lessons))return toast('This is not a Teaching Tracker backup');
      if(!confirm(`Restore ${j.schools.length} schools and ${j.lessons.length} records?`))return;
      for(const[t,arr]of[['schools',j.schools],['lessons',j.lessons]])
        for(let i=0;i<arr.length;i+=50){const{error}=await SB.from(t).upsert(arr.slice(i,i+50).map(({id,...d})=>({id,user_id:uid,data:d})));if(error)throw error}
      await load();toast('Restored');
    }catch(x){toast('Restore failed: '+x.message)}
  };
}

const X={Summary:vSum,Parents:vPar,Backup:vBak},B={Summary:bSum,Parents:bPar,Backup:bBak};
const R0=render;
render=function(){
  const tb=tab,ex=uid&&X[tb];
  if(ex)tab='Schools';
  R0();
  if(ex){
    tab=tb;
    document.querySelectorAll('[data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===tb));
    $('m').innerHTML=X[tb]();bindPick();B[tb]();return;
  }
};
['Summary','Parents','Backup'].forEach(t=>{if(!TABS.includes(t))TABS.push(t)});
if(uid)render();
})();
