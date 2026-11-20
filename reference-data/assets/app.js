'use strict';
const data=window.REFERENCE_EXAMPLES;
const gallery=document.querySelector('#gallery');
const dialog=document.querySelector('#reference-dialog');
const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
const pauseOthers=except=>document.querySelectorAll('video').forEach(v=>{if(v!==except)v.pause();});
const refCount=data.summary.references;
for(const [value,label] of [[data.summary.clips,'个训练片段'],[refCount,'张对象参考图'],[data.summary.with_text,'个片段带对象文本']]){const stat=el('span','stat');stat.append(el('strong','',String(value)),document.createTextNode(label));document.querySelector('#stats').append(stat);}
function showReference(item,ref){document.querySelector('#dialog-title').textContent=item.title+' · 对象 '+ref.label;document.querySelector('#dialog-reference').src=ref.image;document.querySelector('#dialog-locator').src=ref.locator;dialog.showModal();}
document.querySelector('#close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}});
function makeCard(item){
 const card=el('article','case');card.id='case-'+item.id;card.dataset.category=item.category;card.dataset.imageOnly=String(!item.references.some(r=>r.caption));
 const head=el('div','case-head'),titles=el('div'),h2=el('h2');h2.append(el('span','number',item.id),document.createTextNode(item.title));titles.append(h2,el('p','description',item.description));head.append(titles,el('span','kind',item.source_kind));
 const content=el('div','content'),references=el('div','references');
 for(const ref of item.references){
  const block=el('div','reference'),rhead=el('div','ref-head'),name=el('span','ref-id'),badge=el('span','badge',ref.label);badge.style.backgroundColor=ref.color;name.append(badge,document.createTextNode('参考图'));rhead.append(name,el('span','relation',ref.source_relation));
  const button=el('button','reference-button'),image=el('img');image.src=ref.image;image.alt=item.title+'：对象 '+ref.label+' 的参考图';image.loading='lazy';button.setAttribute('aria-label','查看对象 '+ref.label+' 的参考图与来源');button.append(image);button.addEventListener('click',()=>showReference(item,ref));
  block.append(rhead,button,el('p',ref.caption?'caption':'caption empty',ref.caption||'仅参考图，无对象文本'));references.append(block);
 }
 const column=el('div','video-column'),vhead=el('div','video-heading'),toggle=el('label','toggle'),check=el('input');check.type='checkbox';check.checked=true;toggle.append(check,document.createTextNode('标出目标框'));vhead.append(el('span','','对应训练视频'),toggle);
 const video=el('video');video.src=item.boxed_video;video.poster=item.boxed_poster;video.controls=true;video.muted=true;video.loop=true;video.playsInline=true;video.preload='none';video.setAttribute('aria-label',item.title+'训练视频');video.addEventListener('play',()=>pauseOthers(video));
 check.addEventListener('change',()=>{const time=video.currentTime;const playing=!video.paused;video.pause();video.src=check.checked?item.boxed_video:item.video;video.poster=check.checked?item.boxed_poster:item.poster;video.addEventListener('loadedmetadata',()=>{video.currentTime=Math.min(time,video.duration);if(playing)video.play().catch(()=>{});},{once:true});video.load();});
 const tools=el('div','tools');for(const [label,url] of [['下载原始视频',item.video],['下载带框视频',item.boxed_video]]){const a=el('a','',label);a.href=url;a.download=item.id+'_'+url.split('/').pop();tools.append(a);}
 column.append(vhead,video,tools);content.append(references,column);
 const details=el('details','details');details.append(el('summary','','查看三个时刻与场景描述'));
 details.addEventListener('toggle',()=>{if(details.open&&!details.dataset.loaded){const timeline=el('img','timeline');timeline.src=item.timeline;timeline.alt='起始、中段、末段的目标位置';timeline.loading='lazy';const labels=el('div','timeline-labels');for(const text of ['起始','中段','末段'])labels.append(el('span','',text));details.append(timeline,labels,el('p','',item.background_caption));details.dataset.loaded='true';}});
 card.append(head);
 if(item.cross_time){
  const cross=item.cross_time,pair=el('section','cross-time'),heading=el('div','cross-heading');
  heading.append(el('strong','','同一对象 · 两个时刻'),el('span','time-gap',`相隔 ${cross.delta_seconds.toFixed(1)} 秒`));
  const grid=el('div','context-pair');
  for(const [name,src,caption] of [['参考图的来源画面',cross.source_context,`来源帧在右侧展示时刻${cross.source_relative}`],['训练视频中的画面',cross.target_context,'同一轨迹 ID 的对象 A']]){
   const figure=el('figure'),label=el('figcaption','',name),image=el('img');image.src=src;image.alt=item.title+'：'+name;image.loading='lazy';figure.append(label,image,el('p','',caption));grid.append(figure);
  }
  pair.append(heading,grid,el('p','track-proof',`两侧目标 A 的轨迹 ID 均为 ${cross.track_id}。下方参考图从左侧来源帧裁剪。`));card.append(pair);
 }
 card.append(content,details);return card;
}
for(const item of data.cases)gallery.append(makeCard(item));
function filter(category){let n=0;for(const card of gallery.children){const show=category==='all'||(category==='image-only'?card.dataset.imageOnly==='true':card.dataset.category===category);card.hidden=!show;if(show)n++;else card.querySelector('video').pause();}document.querySelector('#count').textContent=n+' / '+data.cases.length+' 个示例';for(const button of document.querySelectorAll('.filters button')){const active=button.dataset.category===category;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));}}
for(const button of document.querySelectorAll('.filters button'))button.addEventListener('click',()=>filter(button.dataset.category));
filter('all');document.documentElement.dataset.ready='true';
