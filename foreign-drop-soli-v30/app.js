'use strict';
const storageKey = document.body.dataset.reviewKey || 'foreign-drop-v27-100-human-review';
const names = {KEEP:'Keep',REJECT:'Reject',UNCERTAIN:'Unclear',technical_failure:'Output error',PENDING:'Pending',SCORED:'Scored'};
const root = document.getElementById('clips');
let data, saved = {};
try {const v = JSON.parse(localStorage.getItem(storageKey)||'{}');if(v && typeof v==='object' && !Array.isArray(v))saved=v;} catch (_) {}
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function save(id,verdict,note){saved[id]={verdict,note,updated_at:new Date().toISOString()};try{localStorage.setItem(storageKey,JSON.stringify(saved));}catch(_){document.getElementById('saved').textContent='Storage unavailable. Export your review.';}filter();}
function filter(){
  if(!data)return;
  const status=document.getElementById('status').value,family=document.getElementById('family').value,human=document.getElementById('human').value,query=document.getElementById('search').value.trim().toLowerCase();
  const shown=[];
  for(const row of data.rows){const card=document.getElementById(row.id),review=saved[row.id]?.verdict||'';
    const visible=(status==='ALL'||row.status===status)&&(family==='ALL'||row.event===family)&&
      (human==='ALL'||(human==='UNREVIEWED'?!review:review===human))&&row.id.toLowerCase().includes(query);
    card.hidden=!visible;if(visible)shown.push(row);else card.querySelector('video').pause();
  }
  const showModel=document.getElementById('show-model').checked;
  document.body.classList.toggle('hide-model',!showModel);
  const counts=[`${shown.length} / ${data.rows.length}`];
  if(showModel)for(const key of Object.keys(names)){const n=shown.filter(r=>r.status===key).length;if(n)counts.push(`${names[key]} ${n}`);}
  document.getElementById('counts').textContent=counts.join('  |  ');
  const reviewed=data.rows.filter(r=>saved[r.id]?.verdict).length;
  document.getElementById('saved').textContent=`Reviewed ${reviewed} / ${data.rows.length}`;
  document.getElementById('empty').hidden=shown.length!==0;
}
function orderRows(){
  if(!data)return;
  const order=document.getElementById('order')?.value,rows=[...data.rows];
  if(order==='low')rows.sort((a,b)=>a.score-b.score||a.id.localeCompare(b.id));
  else if(order==='high')rows.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
  else rows.sort((a,b)=>(a.ordinal??0)-(b.ordinal??0));
  const empty=document.getElementById('empty');
  for(const row of rows){const article=document.getElementById(row.id);article.querySelector('video').pause();root.insertBefore(article,empty);}
}
function render(){
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){const v=e.target;v.src=v.dataset.src;observer.unobserve(v);}},{rootMargin:'400px'}):null;
  for(const family of [...new Set(data.rows.map(r=>r.event))].sort()){const option=el('option',family);option.value=family;document.getElementById('family').append(option);}
  for(const row of data.rows){
    const article=el('article');article.id=row.id;
    const meta=el('div',undefined,'meta');meta.append(el('strong',row.id),el('span',row.event,'family'));
    meta.append(Number.isFinite(row.score)?el('span',`${data.score_label||'Score'} ${row.score.toFixed(3)}`,'status model score'):el('span',names[row.status],`status model ${row.status}`));article.append(meta);
    const video=el('video');video.controls=true;video.loop=true;video.playsInline=true;video.preload='none';video.poster=row.poster;video.dataset.src=row.video;video.setAttribute('aria-label',row.id);
    if(observer)observer.observe(video);else video.src=row.video;
    video.addEventListener('play',()=>{for(const other of root.querySelectorAll('video'))if(other!==video)other.pause();});article.append(video);
    const form=el('div',undefined,'review');const select=el('select');select.setAttribute('aria-label',`${row.id} human review`);
    for(const [value,label] of (data.human_labels||[['','Your review'],['KEEP','Keep'],['REJECT','Reject'],['UNCERTAIN','Unsure']])){const option=el('option',label);option.value=value;select.append(option);}
    select.value=saved[row.id]?.verdict||'';
    const note=el('input');note.type='text';note.maxLength=2000;note.placeholder='Review notes';note.setAttribute('aria-label',`${row.id} notes`);note.value=saved[row.id]?.note||'';
    select.addEventListener('change',()=>save(row.id,select.value,note.value));note.addEventListener('input',()=>save(row.id,select.value,note.value));form.append(select,note);article.append(form);
    const detail=el('details',undefined,'model');detail.append(el('summary',data.details_label||'Model evidence'));
    for(const [key,label] of (data.answer_labels || [['source','Source: full video'],['quality',row.fallback_full_frame?'Naturalness: full video':'Naturalness: fixed crop']])){
      detail.append(el('div',label,'answer-label'),el('p',row.answers?.[key]||(row.status==='PENDING'?'Pending':'No final answer'),'answer'));
    }
    article.append(detail);root.append(article);
  }
  const empty=el('p','No matching videos','empty');empty.id='empty';empty.hidden=true;root.append(empty);if(document.getElementById('order'))orderRows();filter();
}
for(const id of ['status','family','human','search','show-model'])document.getElementById(id).addEventListener('input',filter);
document.getElementById('order')?.addEventListener('change',()=>{orderRows();filter();});
document.getElementById('export').addEventListener('click',()=>{
  if(!data)return;
  const output={experiment:data.experiment,manifest_sha256:data.manifest_sha256,exported_at:new Date().toISOString(),
    reviews:data.rows.filter(r=>saved[r.id]).map(r=>({id:r.id,source_sha256:r.source_sha256,model_status:r.status,
      ...(Number.isFinite(r.score)?{solireward_score:r.score,qwen_shape_status:r.qwen_shape_status}:{}),...saved[r.id]}))};
  const url=URL.createObjectURL(new Blob([JSON.stringify(output,null,2)],{type:'application/json'}));
  const a=el('a');a.href=url;a.download=data.review_filename||'foreign-drop-v27-100-human-review.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
fetch('data.json').then(response=>{if(!response.ok)throw new Error(`HTTP ${response.status}`);return response.json();}).then(value=>{data=value;render();}).catch(error=>{document.getElementById('counts').textContent=`Could not load videos: ${error.message}`;});
