/* Teaching Tracker add-on: Pupils, Timetable & duty roster, Report Card. Load AFTER teachers.js */
(function(){
const SUBJ=['Mathematics','English','Computer','Science','Social Studies','Religious Education'];
const SUBX=SUBJ.concat(['CAPE','Local Language','Games','Break','Assembly']);
const DAYS=['Mon','Tue','Wed','Thu','Fri'],PER=8,DEFG={Exceeds:80,Meets:50,Developing:35};
const get=(id,def)=>{const d=Ls.find(l=>l.id===id);return d&&d.v!=null?d.v:def};
const keep=(id,v)=>put('lessons',id,{sid:'cfg:'+id,ci:0,v});
const o=(arr,v)=>arr.map(x=>`<option${x===v?' selected':''}>${e(x)}</option>`).join('');
const key=k=>`cfg_${k}_${cs().id}_${sel.c}`;
const hdr=t=>`<div class="card"><h2>${t}</h2>`;
const A='font-family:Arial,sans-serif;color:#000;background:#fff;padding:6px';
const TH='border:1px solid #999;padding:5px;text-align:left;font-size:12px';
function download(el,base,html){
  const save=(n,d)=>{const u=URL.createObjectURL(d),a=document.createElement('a');a.href=u;a.download=n;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);toast('Saved')};
  return{
    pdf:async()=>{if(!window.html2pdf)return toast('PDF tool did not load – check internet');toast('Preparing PDF…');save(base+'.pdf',await html2pdf().set({margin:10,jsPDF:{unit:'mm',format:'a4'},html2canvas:{scale:2}}).from(el).outputPdf('blob'))},
    doc:()=>{if(!window.htmlDocx)return toast('Word tool did not load');save(base+'.docx',htmlDocx.asBlob('<!DOCTYPE html><html><body>'+html+'</body></html>'))}
  };
}
const fname=s=>s.replace(/[^\w]+/g,'_');
const thumb=(d,z)=>d&&d.ph?`<img src="${d.ph}" style="width:${z}px;height:${z}px;object-fit:cover;border-radius:8px">`:`<div style="width:${z}px;height:${z}px;border-radius:8px;background:var(--ln)"></div>`;

/* ---------- Pupils ---------- */
function clHTML(){
  const cls=cc(),D=get(key('pup'),{}),b=`<td style="${TH}">&nbsp;</td>`;
  return`<div style="${A}"><h2 style="margin:0">Class list – ${e(cls.name)}</h2><p style="margin:4px 0 10px">${e(cs().name)}</p>
  <table style="border-collapse:collapse;width:100%"><tr>${['No.','Pupil','Sex','Parent / guardian','Phone','','','','',''].map(h=>`<th style="${TH}">${h}</th>`).join('')}</tr>
  ${(cls.pupils||[]).map((p,i)=>{const d=D[p]||{};return`<tr><td style="${TH}">${i+1}</td><td style="${TH}">${e(p)}</td><td style="${TH}">${e(d.sx)}</td><td style="${TH}">${e(d.pa)}</td><td style="${TH}">${e(d.ph2)}</td>${b.repeat(5)}</tr>`}).join('')}</table></div>`;
}
function vPup(){
  const n=need();if(n)return pickers()+n;
  const cls=cc(),D=get(key('pup'),{});
  return pickers()+hdr('Pupils – '+e(cls.name))+`<p class="mut">Add photos and parent contacts. Print a class list with blank columns for registers.</p><button class="b" id="cl_pdf">Download class list (PDF)</button></div>`+
  (cls.pupils||[]).map((p,i)=>{const d=D[p]||{};return`<div class="card"><div class="row" style="flex-wrap:nowrap;align-items:center"><div style="flex:0 0 64px;min-width:64px">${thumb(d,64)}</div><div><b>${e(p)}</b>${d.ph2?`<br><a href="tel:${e(d.ph2)}">${e(d.ph2)}</a>`:''}</div></div>
  <div class="row"><div><label>Sex</label><select id="px${i}"><option></option>${o(['Girl','Boy'],d.sx)}</select></div><div><label>Parent / guardian</label><input id="pa${i}" value="${e(d.pa)}"></div><div><label>Parent phone</label><input id="pt${i}" type="tel" value="${e(d.ph2)}"></div></div>
  <label>Notes (health, needs, home situation)</label><textarea id="pn${i}">${e(d.nt)}</textarea>
  <label>Photo</label><input type="file" accept="image/*" id="pf${i}"><button class="b" data-ps="${i}">Save pupil</button></div>`}).join('');
}
const shrink=f=>new Promise(r=>{const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas'),z=120,m=Math.min(im.width,im.height);c.width=c.height=z;c.getContext('2d').drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,z,z);r(c.toDataURL('image/jpeg',.6))};im.src=fr.result};fr.readAsDataURL(f)});
function bPup(){
  if(!$('cl_pdf'))return;
  $('cl_pdf').onclick=()=>{const h=document.createElement('div');h.innerHTML=clHTML();download(h,'ClassList_'+fname(cs().name+cc().name),clHTML()).pdf()};
  document.querySelectorAll('[data-ps]').forEach(b=>b.onclick=async()=>{
    const i=+b.dataset.ps,p=cc().pupils[i],D=JSON.parse(JSON.stringify(get(key('pup'),{}))),d=D[p]||{};
    d.sx=$('px'+i).value;d.pa=$('pa'+i).value.trim();d.ph2=$('pt'+i).value.trim();d.nt=$('pn'+i).value.trim();
    const f=$('pf'+i).files[0];if(f)d.ph=await shrink(f);
    D[p]=d;await keep(key('pup'),D);toast('Pupil saved');
  });
}

/* ---------- Timetable & duty roster ---------- */
function ttHTML(){
  const D=get(key('tt'),{}),cls=cc();
  return`<div style="${A}"><h2 style="margin:0">Timetable – ${e(cls.name)}</h2><p style="margin:4px 0 10px">${e(cs().name)}</p><table style="border-collapse:collapse;width:100%"><tr><th style="${TH}">Period</th>${DAYS.map(d=>`<th style="${TH}">${d}</th>`).join('')}</tr>
  ${[...Array(PER)].map((_,p)=>`<tr><td style="${TH}">${p+1}<br>${e((D.tm||{})[p])}</td>${DAYS.map((_,d)=>`<td style="${TH}">${e((D.c||{})[d+'-'+p])}</td>`).join('')}</tr>`).join('')}</table></div>`;
}
function vTT(){
  const n=need();if(n)return pickers()+n;
  const D=get(key('tt'),{}),du=get('cfg_duty_'+cs().id,{}),Tc=get('cfg_teachers',[]);
  return pickers()+hdr('Timetable – '+e(cc().name))+`<table><tr><th>Time</th>${DAYS.map(d=>`<th>${d}</th>`).join('')}</tr>
  ${[...Array(PER)].map((_,p)=>`<tr><td style="min-width:100px"><input id="tm${p}" placeholder="8:00-8:40" value="${e((D.tm||{})[p])}"></td>${DAYS.map((_,d)=>`<td><select id="tt${d}_${p}"><option></option>${o(SUBX,(D.c||{})[d+'-'+p])}</select></td>`).join('')}</tr>`).join('')}</table>
  <button class="b" id="tt_save">Save timetable</button><button class="b alt" id="tt_pdf">Download PDF</button></div>`+
  hdr('Duty roster – '+e(cs().name))+`<p class="mut">Teacher on duty each week. Add teachers in the Teachers tab first.</p><table><tr><th>Week</th><th>Teacher</th><th>Note</th></tr>
  ${[...Array(14)].map((_,w)=>{const x=du[w+1]||{};return`<tr><td>${w+1}</td><td><select id="dt${w}"><option value=""></option>${Tc.map(t=>`<option value="${t.id}"${t.id===x.t?' selected':''}>${e(t.ti+' '+t.nm)}</option>`).join('')}</select></td><td><input id="dn${w}" value="${e(x.n)}"></td></tr>`}).join('')}</table>
  <button class="b" id="du_save">Save roster</button></div>`;
}
function bTT(){
  if(!$('tt_save'))return;
  $('tt_save').onclick=async()=>{const D={tm:{},c:{}};
    for(let p=0;p<PER;p++){D.tm[p]=$('tm'+p).value.trim();DAYS.forEach((_,d)=>D.c[d+'-'+p]=$('tt'+d+'_'+p).value)}
    await keep(key('tt'),D);toast('Timetable saved')};
  $('tt_pdf').onclick=()=>{const h=document.createElement('div');h.innerHTML=ttHTML();download(h,'Timetable_'+fname(cs().name+cc().name),ttHTML()).pdf()};
  $('du_save').onclick=async()=>{const du={};for(let w=0;w<14;w++)du[w+1]={t:$('dt'+w).value,n:$('dn'+w).value.trim()};await keep('cfg_duty_'+cs().id,du);toast('Roster saved')};
}

/* ---------- Report card ---------- */
const RC={p:'',t:'Term 1'};
const rcKey=()=>RC.p+'|'+RC.t;
const rcD=()=>(get(key('rc'),{}))[rcKey()]||{};
const lvl=p=>{try{return lv(p)[0]}catch(x){return ''}};
function pupilStats(p){
  const ls=lessonsOf();let pr=0,sc=[];
  ls.forEach(l=>{const m=(l.marks||{})[p];if(m){if(m.p)pr++;if(m.s!==''&&m.s!=null&&l.outOf>0)sc.push(m.s/l.outOf*100)}});
  return{att:ls.length?Math.round(pr/ls.length*100):null,avg:sc.length?Math.round(sc.reduce((a,b)=>a+b,0)/sc.length):null,n:ls.length};
}
function rcHTML(){
  const s=cs(),cls=cc(),p=RC.p,d=rcD(),pd=(get(key('pup'),{}))[p]||{},st=pupilStats(p),g=get('cfg_grading',DEFG);
  const sc={...(d.sc||{})};if((sc.Computer===''||sc.Computer==null)&&st.avg!=null)sc.Computer=st.avg;
  const vals=SUBJ.filter(x=>sc[x]!==''&&sc[x]!=null),tot=vals.length?Math.round(vals.reduce((a,x)=>a+ +sc[x],0)/vals.length):null;
  const cnt={};get('cfg_log',[]).filter(x=>x.sid===s.id&&x.ci==sel.c&&x.about===p).forEach(x=>(x.vals||[]).forEach(v=>cnt[v]=(cnt[v]||0)+1));
  const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]).join(', ');
  const R=(a,b)=>`<tr><td style="${TH};width:36%;font-weight:bold">${a}</td><td style="${TH}">${b||'–'}</td></tr>`;
  return`<div style="${A}"><h2 style="margin:0;text-align:center">${e(s.name)}</h2><p style="text-align:center;margin:2px 0 10px">End of ${e(RC.t)} report${d.yr?' · '+e(d.yr):''}</p>
  <table style="width:100%"><tr><td style="width:84px">${pd.ph?`<img src="${pd.ph}" style="width:80px;height:80px;object-fit:cover">`:''}</td><td><b style="font-size:16px">${e(p)}</b><br>${e(cls.name)}${pd.sx?' · '+e(pd.sx):''}<br>Parent / guardian: ${e(pd.pa)||'–'}</td></tr></table>
  <table style="border-collapse:collapse;width:100%;margin-top:8px"><tr><th style="${TH}">Subject</th><th style="${TH}">Score %</th><th style="${TH}">Level</th></tr>
  ${SUBJ.map(x=>`<tr><td style="${TH}">${x}</td><td style="${TH}">${e(sc[x])}</td><td style="${TH}">${sc[x]!==''&&sc[x]!=null?e(lvl(+sc[x])):''}</td></tr>`).join('')}
  <tr><td style="${TH}"><b>Average</b></td><td style="${TH}"><b>${tot==null?'–':tot}</b></td><td style="${TH}"><b>${tot==null?'':e(lvl(tot))}</b></td></tr></table>
  <table style="border-collapse:collapse;width:100%;margin-top:8px">${R('Computer lessons attendance',st.att==null?'–':st.att+'% of '+st.n+' lessons')}${R('Conduct',e(d.cd))}${R('Values exhibited',e(top))}
  ${R('Class teacher comment',e(d.tc))}${R('Head teacher comment',e(d.hc))}${R('Next term begins',e(d.nx))}</table>
  <p style="font-size:11px;margin-top:10px">Grading: Exceeds ${g.Exceeds}%+ · Meets ${g.Meets}%+ · Developing ${g.Developing}%+ · Not yet below ${g.Developing}%</p>
  <p style="font-size:12px;margin-top:22px">Class teacher: ${e(window.teacher||'')} ______________ &nbsp;&nbsp; Head teacher: ______________ &nbsp;&nbsp; Date: ________</p></div>`;
}
function vRC(){
  const n=need();if(n)return pickers()+n;
  const pu=cc().pupils||[];if(!pu.includes(RC.p))RC.p=pu[0]||'';
  if(!RC.p)return pickers()+'<div class="card">Add pupils to this class first (Schools tab).</div>';
  const d=rcD(),sc=d.sc||{};
  return pickers()+hdr('Report card')+`<div class="row"><div><label>Pupil</label><select id="rp">${o(pu,RC.p)}</select></div><div><label>Term</label><select id="rt">${o(['Term 1','Term 2','Term 3'],RC.t)}</select></div><div><label>Year</label><input id="ry" value="${e(d.yr||new Date().getFullYear())}"></div></div>
  <h3>Subject scores (%)</h3><p class="mut">Computer fills from lesson scores if left blank.</p><div class="row">${SUBJ.map((x,i)=>`<div><label>${x}</label><input type="number" min="0" max="100" id="rs${i}" value="${e(sc[x])}"></div>`).join('')}</div>
  <div class="row"><div><label>Conduct</label><select id="rd"><option></option>${o(['Excellent','Very good','Good','Fair','Needs improvement'],d.cd)}</select></div><div><label>Next term begins</label><input type="date" id="rn" value="${e(d.nx)}"></div></div>
  <label>Class teacher comment</label><textarea id="rtc">${e(d.tc)}</textarea><label>Head teacher comment</label><textarea id="rhc">${e(d.hc)}</textarea>
  <button class="b" id="rc_save">Save report card</button></div><div class="card" id="rcv">${rcHTML()}</div>
  <div class="card"><button class="b" id="rc_pdf">Download PDF</button><button class="b alt" id="rc_doc">Download Word</button></div>`;
}
function bRC(){
  if(!$('rc_save'))return;
  $('rp').onchange=()=>{RC.p=$('rp').value;render()};$('rt').onchange=()=>{RC.t=$('rt').value;render()};
  $('rc_save').onclick=async()=>{
    const sc={};SUBJ.forEach((x,i)=>sc[x]=$('rs'+i).value===''?'':+$('rs'+i).value);
    const all=JSON.parse(JSON.stringify(get(key('rc'),{})));
    all[rcKey()]={sc,yr:$('ry').value.trim(),cd:$('rd').value,nx:$('rn').value,tc:$('rtc').value.trim(),hc:$('rhc').value.trim()};
    await keep(key('rc'),all);toast('Report card saved');
  };
  const dl=download($('rcv'),'ReportCard_'+fname(RC.p+RC.t),rcHTML());
  $('rc_pdf').onclick=dl.pdf;$('rc_doc').onclick=dl.doc;
}

const X={Pupils:vPup,Timetable:vTT,'Report Card':vRC},B={Pupils:bPup,Timetable:bTT,'Report Card':bRC};
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
['Pupils','Timetable','Report Card'].forEach(t=>{if(!TABS.includes(t))TABS.push(t)});
if(uid)render();
})();
