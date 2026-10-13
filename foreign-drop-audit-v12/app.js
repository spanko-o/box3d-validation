'use strict';
const data = JSON.parse(document.getElementById('review-data').textContent);
const storageKey = 'foreign-drop-event-v12-human-review';
const labels = {KEEP:'Keep', REJECT:'Reject', UNCERTAIN:'Withheld', technical_failure:'Output error'};
const sources = {VEHICLE:'Vehicle drop', OTHER:'No vehicle drop', UNCLEAR:'Source unclear'};
const realism = {REALISTIC:'Natural', UNREALISTIC:'Unnatural', UNCLEAR:'Realism unclear'};
const groups = {fresh_random:'New random',human_positive:'Human reference',human_negative:'Human reference',diagnostic:'Previous test',previous_unlabeled:'Previous test'};
let saved = {};
try {const value=JSON.parse(localStorage.getItem(storageKey)||'{}'); if(value && typeof value==='object' && !Array.isArray(value)) saved=value;} catch (_) {}
const byId = new Map(data.rows.map(row=>[row.id,row]));
const parent=document.getElementById('clips');
function element(tag,text,className){const node=document.createElement(tag); if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
function store(id,verdict,note){saved[id]={verdict,note,updated_at:new Date().toISOString()};try{localStorage.setItem(storageKey,JSON.stringify(saved)); document.getElementById('saved').textContent=`Saved ${Object.keys(saved).length}`;}catch(_){document.getElementById('saved').textContent='Save failed; export your review';}}
for(const row of data.rows){
 const item=element('article');item.id=row.id;item.dataset.id=row.id;item.dataset.status=row.status;item.dataset.group=row.group;
 const meta=element('div',undefined,'meta');meta.append(element('strong',row.id),element('span',groups[row.group]||row.group,'group'),element('span',labels[row.status],`status ${row.status}`));item.append(meta);
 const video=document.createElement('video');video.controls=true;video.loop=true;video.playsInline=true;video.preload='none';video.src=row.video;video.poster=row.poster;video.setAttribute('aria-label',row.id);item.append(video);
 video.addEventListener('play',()=>{for(const other of parent.querySelectorAll('video'))if(other!==video)other.pause();});
 const models=element('div',undefined,'models');
 for(const [key,name] of [['qwen','Qwen'],['cosmos','Cosmos']]){
  const review=row.reviews[key];const line=element('div',undefined,'model-line');line.append(element('strong',name),element('span',sources[review.source?.status]||'Output error'),element('span',realism[review.realism?.status]||'Output error'),element('span',labels[review.status],review.status));models.append(line);
 }
 item.append(models);
 const details=document.createElement('details');details.append(element('summary','Original model answers'));
 for(const [key,name] of [['qwen','Qwen'],['cosmos','Cosmos']]) for(const [question,label] of [['source','Source'],['realism','Naturalness']]){details.append(element('h2',`${name} / ${label}`),element('pre',row.final_answers[key][question]||'No valid final answer'));}
 item.append(details);
 const form=element('div',undefined,'human');const select=document.createElement('select');select.setAttribute('aria-label',`${row.id} human review`);
 for(const [value,label] of [['','Your review'],['KEEP','Keep'],['REJECT','Reject'],['UNCERTAIN','Unsure']]){const option=element('option',label);option.value=value;select.append(option);}
 select.value=saved[row.id]?.verdict||'';const note=document.createElement('input');note.type='text';note.maxLength=2000;note.placeholder='Review notes';note.setAttribute('aria-label',`${row.id} notes`);note.value=saved[row.id]?.note||'';
 select.addEventListener('change',()=>store(row.id,select.value,note.value));note.addEventListener('input',()=>store(row.id,select.value,note.value));form.append(select,note);item.append(form);parent.append(item);
}
const empty=element('p','No matching videos','empty');empty.hidden=true;parent.append(empty);
function filter(){
 const status=document.getElementById('status').value;const group=document.getElementById('cohort').value;const search=document.getElementById('search').value.trim().toLowerCase();const selected=[];
 for(const item of parent.querySelectorAll('article')){const row=byId.get(item.dataset.id);const groupMatch=group==='ALL'||row.group===group||(group==='human'&&row.group.startsWith('human_'))||(group==='previous'&&!row.group.startsWith('human_')&&row.group!=='fresh_random');const show=(status==='ALL'||row.status===status)&&groupMatch&&row.id.toLowerCase().includes(search);item.hidden=!show;if(show)selected.push(row);else item.querySelector('video').pause();}
 const totals=document.getElementById('totals');totals.replaceChildren(element('span',`${selected.length} / ${data.rows.length}`,'stat'));
 for(const key of ['KEEP','REJECT','UNCERTAIN','technical_failure']){const count=selected.filter(r=>r.status===key).length;if(count||key!=='technical_failure')totals.append(element('span',`${labels[key]} ${count}`,key));}
 const fresh=data.rows.filter(r=>r.group==='fresh_random');const keep=fresh.filter(r=>r.status==='KEEP').length;totals.append(element('span',`New random: ${keep}/${fresh.length} kept`));empty.hidden=selected.length!==0;
}
for(const id of ['status','cohort','search'])document.getElementById(id).addEventListener('input',filter);
document.getElementById('export').addEventListener('click',()=>{
 const output={experiment:data.experiment,manifest_sha256:data.manifest_sha256,exported_at:new Date().toISOString(),reviews:Object.entries(saved).filter(([id])=>byId.has(id)).map(([id,review])=>({id,source_sha256:byId.get(id).source_sha256,model_status:byId.get(id).status,...review}))};
 const blob=new Blob([JSON.stringify(output,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='foreign-drop-event-v12-human-review.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
if(Object.keys(saved).length)document.getElementById('saved').textContent=`Saved ${Object.keys(saved).length}`;
filter();
