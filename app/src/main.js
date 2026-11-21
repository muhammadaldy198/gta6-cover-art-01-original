import { drawCover } from './cover.js';
import { cropRectangle, panelFrames } from './geometry.js';
import { querySettings } from './shots.js';

const $ = id => document.getElementById(id);
const canvas=$('cover');
const initial=querySettings(new URLSearchParams(location.search));
const panelNames=['hero','snapshot','detail'];
const photos=[];
const state={ title:initial.title,subtitle:initial.subtitle,location:'Palm Coast',stamp:'ROOM 07',
  layout:initial.layout,grade:initial.grade,texture:'print',panels:[] };
let selected=0;
let scheduled=0;
let loading=false;

function defaultPanels() {
  return [{photo:0,zoom:1,x:50,y:18},{photo:Math.min(1,photos.length-1),zoom:1,x:50,y:0},{photo:0,zoom:1.05,x:0,y:78}];
}
function announce(message) { $('status').textContent=message; }
function paint() {
  scheduled=0;
  if(!photos.length || state.panels.length!==3)return;
  drawCover(canvas,photos,state);
  canvas.dataset.rendered=String(Number(canvas.dataset.rendered||0)+1);
}
function redraw() { if(!scheduled)scheduled=requestAnimationFrame(paint); }
function updateSize() {
  const [w,h]=$('size').value.split('x').map(Number);
  canvas.width=w;canvas.height=h;
  $('dimensions').textContent=`${w} × ${h}`;
  redraw();
}
export function loadImage(url) {
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error('That image could not be decoded. Try a JPG, PNG or WebP.'));
    image.src=url;
  });
}
function updateCropControls() {
  const crop=state.panels[selected];
  if(!crop)return;
  $('panel-photo').value=String(crop.photo);
  $('zoom').value=String(Math.round(crop.zoom*100));
  $('pan-x').value=String(Math.round(crop.x));$('pan-y').value=String(Math.round(crop.y));
  $('zoom-value').value=`${crop.zoom.toFixed(2)}×`;
  $('pan-x-value').value=`${Math.round(crop.x)}%`;$('pan-y-value').value=`${Math.round(crop.y)}%`;
  $('zoom').setAttribute('aria-valuetext',`${crop.zoom.toFixed(2)} times`);
  $('selected-note').textContent=`Editing ${panelNames[selected]} · drag photo to reposition`;
  document.querySelectorAll('[data-panel]').forEach(button=>{
    const active=Number(button.dataset.panel)===selected;
    button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
  });
  document.querySelectorAll('.photo-thumb').forEach((button,i)=>{
    button.classList.toggle('active',i===crop.photo);
    button.setAttribute('aria-label',`Use ${photos[i].name} in ${panelNames[selected]} panel`);
  });
}
function selectPanel(index) { selected=index;updateCropControls(); }
function syncPhotos() {
  $('photo-tray').replaceChildren();$('panel-photo').replaceChildren();
  photos.forEach((photo,index)=>{
    const option=document.createElement('option');option.value=String(index);option.textContent=photo.name;$('panel-photo').append(option);
    const button=document.createElement('button');button.type='button';button.className='photo-thumb';
    button.setAttribute('aria-label',`Use ${photo.name} in ${panelNames[selected]} panel`);button.title=photo.name;
    const thumb=document.createElement('img');thumb.src=photo.url;thumb.alt='';
    const number=document.createElement('span');number.textContent=String(index+1).padStart(2,'0');
    button.append(thumb,number);
    button.addEventListener('click',()=>{state.panels[selected]={photo:index,zoom:1,x:50,y:50};updateCropControls();redraw();});
    $('photo-tray').append(button);
  });
  $('photo-count').textContent=`${photos.length} photos loaded · choose a frame below the preview`;
  updateCropControls();
}
async function loadSamples() {
  if(loading)return;
  loading=true;$('export').disabled=true;announce('Loading local sample photos…');
  try {
    const definitions=[['Boulevard · kit sample','./samples/boulevard.jpg'],['Pier · kit sample','./samples/pier.jpg']];
    const loaded=await Promise.all(definitions.map(async([name,url])=>({name,url,image:await loadImage(url)})));
    photos.forEach(photo=>{if(photo.local)URL.revokeObjectURL(photo.url);});
    photos.splice(0,photos.length,...loaded);state.panels=defaultPanels();
    selected=0;syncPhotos();paint();$('export').disabled=false;
    announce('2 kit samples loaded. Your cover is ready to export.');
    window.__shotReady=true;
  } catch(error) {announce(error.message);} finally {loading=false;}
}
async function addPhotos(files) {
  if(loading||!files.length)return;
  loading=true;$('export').disabled=true;
  let added=0,failed=0;
  try {
    for(const file of files) {
      if(photos.length>=12){failed++;continue;}
      if(!/^image\/(jpeg|png|webp|avif)$/.test(file.type)||file.size>25*1024*1024){failed++;continue;}
      const url=URL.createObjectURL(file);
      try {
        const image=await loadImage(url);
        if(image.naturalWidth*image.naturalHeight>60000000)throw new Error('Image too large');
        photos.push({name:file.name.slice(0,70),url,image,local:true});
        if(added<3)state.panels[(selected+added)%3]={photo:photos.length-1,zoom:1,x:50,y:50};
        added++;
      }catch{URL.revokeObjectURL(url);failed++;}
    }
    syncPhotos();paint();
    announce(added?`${added} local photo${added===1?'':'s'} loaded. Nothing was uploaded.${failed?' Some files were skipped (use JPG/PNG/WebP under 25 MB; max 12 photos).':''}`:'No photos added. Use JPG, PNG or WebP under 25 MB (max 12 photos).');
  } finally {loading=false;$('photos').value='';$('export').disabled=photos.length===0;}
}
function exportPng() {
  if(loading||!photos.length)return;
  paint();const button=$('export');button.disabled=true;announce('Preparing your full-resolution PNG…');
  canvas.toBlob(blob=>{
    button.disabled=false;
    if(!blob){announce('PNG export failed. Try a smaller output size.');return;}
    const url=URL.createObjectURL(blob);const link=document.createElement('a');
    link.href=url;link.download=`after-hours-${canvas.width}x${canvas.height}.png`;
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    announce(`PNG ready · ${canvas.width} × ${canvas.height}. Download started.`);
  },'image/png');
}

for(const id of ['title','subtitle','location','stamp','layout','grade','texture']) {
  $(id).value=state[id];
  $(id).addEventListener(['layout','grade','texture'].includes(id)?'change':'input',()=>{
    state[id]=$(id).value;
    if(id==='title')$('title-count').textContent=`${state.title.length} / 26`;
    redraw();
  });
}
$('title-count').textContent=`${state.title.length} / 26`;
$('size').value=initial.size;$('size').addEventListener('change',updateSize);updateSize();
$('samples').addEventListener('click',loadSamples);
$('photos').addEventListener('change',event=>addPhotos([...event.target.files]));
$('export').addEventListener('click',exportPng);
$('reset').addEventListener('click',()=>{
  for(const [id,value]of Object.entries({title:'After Hours',subtitle:'One last score. No way back.',location:'Palm Coast',stamp:'ROOM 07',layout:'dossier',grade:'sunset',texture:'print'})){
    state[id]=value;$(id).value=value;
  }
  $('title-count').textContent='11 / 26';$('size').value='1920x1080';updateSize();loadSamples();
});
document.querySelectorAll('[data-panel]').forEach(button=>button.addEventListener('click',()=>selectPanel(Number(button.dataset.panel))));
$('panel-photo').addEventListener('change',()=>{
  state.panels[selected]={photo:Number($('panel-photo').value),zoom:1,x:50,y:50};updateCropControls();redraw();
});
$('fill-all').addEventListener('click',()=>{
  const photo=state.panels[selected].photo;state.panels=state.panels.map(()=>({photo,zoom:1,x:50,y:50}));
  updateCropControls();redraw();announce('One photo, three independent crops. Choose each frame to recompose.');
});
$('crop-reset').addEventListener('click',()=>{
  Object.assign(state.panels[selected],{zoom:1,x:50,y:50});updateCropControls();redraw();
});
for(const [id,prop,scale]of [['zoom','zoom',100],['pan-x','x',1],['pan-y','y',1]]) {
  $(id).addEventListener('input',()=>{state.panels[selected][prop]=Number($(id).value)/scale;updateCropControls();redraw();});
}
let drag=null;
canvas.addEventListener('pointerdown',event=>{
  if(!photos.length)return;
  const rect=canvas.getBoundingClientRect();
  const x=(event.clientX-rect.left)/rect.width*canvas.width,y=(event.clientY-rect.top)/rect.height*canvas.height;
  const frames=panelFrames(canvas.width,canvas.height,state.layout);
  let hit=-1;
  frames.forEach((f,i)=>{if(x>=f.x&&x<=f.x+f.w&&y>=f.y&&y<=f.y+f.h)hit=i;});
  if(hit<0)return;
  selectPanel(hit);canvas.setPointerCapture(event.pointerId);
  const crop=state.panels[selected],f=frames[selected],image=photos[crop.photo].image;
  const r=cropRectangle(image.naturalWidth,image.naturalHeight,f.w,f.h,crop);
  drag={startX:event.clientX,startY:event.clientY,x:crop.x,y:crop.y,overflowX:r.width-f.w,overflowY:r.height-f.h,scale:canvas.width/rect.width};
});
canvas.addEventListener('pointermove',event=>{
  if(!drag)return;
  const clamp=n=>Math.max(0,Math.min(100,n));const crop=state.panels[selected];
  if(drag.overflowX>1)crop.x=clamp(drag.x-(event.clientX-drag.startX)*drag.scale/drag.overflowX*100);
  if(drag.overflowY>1)crop.y=clamp(drag.y-(event.clientY-drag.startY)*drag.scale/drag.overflowY*100);
  updateCropControls();redraw();
});
canvas.addEventListener('pointerup',()=>{drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;});
$('full-preview').addEventListener('click',()=>{paint();$('preview-image').src=canvas.toDataURL('image/png');$('preview-dialog').showModal();});
$('close-preview').addEventListener('click',()=>$('preview-dialog').close());
if(initial.coverOnly)document.body.classList.add('cover-only');
await Promise.all([document.fonts.load('400 14px Studio'),document.fonts.load('700 20px Studio'),document.fonts.load('italic 700 100px Cover')]);
await loadSamples();
