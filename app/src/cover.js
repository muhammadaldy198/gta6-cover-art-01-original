import { cropRectangle, panelFrames } from './geometry.js';
import { printPixels } from './print.js';

export const PALETTES = {
  sunset: { ink:'#101d29', paper:'#fff2d5', accent:'#ff735b', gold:'#ffc566', sea:'#71d4cc', tint:'#ff8b59' },
  neon: { ink:'#101a2d', paper:'#eaf8ed', accent:'#e981b6', gold:'#85e5d0', sea:'#f5b8d9', tint:'#d364a1' },
  noir: { ink:'#101b22', paper:'#fff0ca', accent:'#e5b35e', gold:'#f7d593', sea:'#90c4c2', tint:'#cab174' },
};
const processed = new WeakMap();

const PHOTO_TONES = {
  sunset: { saturation:.80, amount:.50, shadow:[30,19,30], highlight:[1.03,.87,.58] },
  neon: { saturation:.84, amount:.62, shadow:[22,11,54], highlight:[1.03,.83,.85] },
  noir: { saturation:.30, amount:.35, shadow:[34,32,30], highlight:[.72,.64,.54] },
};

export function gradePixel(red, green, blue, grade) {
  const tone=PHOTO_TONES[grade];
  if(!tone)return [red,green,blue];
  const luminance=red*.299+green*.587+blue*.114;
  // Retain naturally warm subject color where the violet ink would cool it.
  const amount=grade==='neon'?tone.amount*(1-Math.min(.60,Math.max(0,red-blue)/125)):tone.amount;
  const channels=[red,green,blue];
  return channels.map((channel,index)=>{
    const muted=luminance+(channel-luminance)*tone.saturation;
    const target=tone.shadow[index]+luminance*tone.highlight[index];
    return Math.max(0,Math.min(255,muted+(target-muted)*amount));
  });
}

// Local photo -> inked print: gentle color quantization and luminance contours.
// Only bundled demo assets or a user's decoded local image enter this cache.
export function inkPhoto(image, grade, finish='photo') {
  let versions = processed.get(image);
  if (!versions) { versions = {}; processed.set(image, versions); }
  const key=`${grade}:${finish}`;
  if (versions[key]) return versions[key];
  const layer = document.createElement('canvas');
  const scale = Math.min(1, (finish==='photo'?1300:960) / Math.max(image.naturalWidth,image.naturalHeight));
  layer.width = Math.max(1,Math.round(image.naturalWidth*scale));
  layer.height = Math.max(1,Math.round(image.naturalHeight*scale));
  const g = layer.getContext('2d',{willReadFrequently:true});
  g.filter = finish!=='photo' ? 'none' : grade === 'noir' ? 'saturate(0.38) contrast(1.18)'
    : grade === 'sunset' ? 'saturate(0.82) contrast(1.15)'
    : 'saturate(0.86) contrast(1.14)';
  g.drawImage(image,0,0,layer.width,layer.height);
  g.filter='none';
  const pixels = g.getImageData(0,0,layer.width,layer.height);
  if(finish!=='photo') {
    pixels.data.set(printPixels(pixels.data,layer.width,layer.height,grade,finish));
    g.putImageData(pixels,0,0);
    // At most six prepared images per photo; crop/typing/export never reprocesses pixels.
    if(Object.keys(versions).length>=6)delete versions[Object.keys(versions)[0]];
    versions[key]=layer;
    return layer;
  }
  const original = new Uint8ClampedArray(pixels.data);
  const { data } = pixels;
  const width = layer.width;
  for (let y=1;y<layer.height-1;y++) for (let x=1;x<width-1;x++) {
    const i=(y*width+x)*4;
    const toned=gradePixel(original[i],original[i+1],original[i+2],grade);
    const lum = at => original[at]*.299+original[at+1]*.587+original[at+2]*.114;
    const edge = Math.abs(lum(i-4)-lum(i+4))+Math.abs(lum(i-width*4)-lum(i+width*4));
    const outline = edge>92 ? .67 : edge>58 ? .86 : 1;
    for(let c=0;c<3;c++) data[i+c]=(Math.round(toned[c]/22)*22*.4+toned[c]*.6)*outline;
  }
  g.putImageData(pixels,0,0);
  if(Object.keys(versions).length>=6)delete versions[Object.keys(versions)[0]];
  versions[key]=layer;
  return layer;
}

function polygon(ctx, points, fill) {
  ctx.beginPath();
  points.forEach(([x,y],i)=>i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  ctx.closePath();
  ctx.fillStyle=fill;
  ctx.fill();
}

function lettering(ctx, text, x, y, size, width, color, italic=false) {
  ctx.save();
  ctx.font = `${italic?'italic ':''}700 ${size}px ${italic?'Cover':'Studio'}`;
  ctx.translate(x,y);
  const measured=ctx.measureText(text).width;
  ctx.scale(Math.min(1,width/Math.max(1,measured)),1);
  ctx.fillStyle=color;
  ctx.fillText(text,0,0);
  ctx.restore();
}

function drawPalm(ctx,x,y,size,color) {
  ctx.save();ctx.translate(x,y);ctx.scale(size,size);
  ctx.strokeStyle=color;ctx.lineCap='round';ctx.lineWidth=.046;
  ctx.beginPath();ctx.moveTo(0,1);ctx.quadraticCurveTo(.11,.45,0,0);ctx.stroke();
  for(let i=0;i<7;i++) {
    const a=-Math.PI+.25+i*.42;
    const ex=Math.cos(a)*.52,ey=Math.sin(a)*.30+.12;
    ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(ex*.55,ey-.2,ex,ey);ctx.stroke();
    for(let j=1;j<7;j++) {
      const t=j/7;const px=ex*t,py=(ey-.2)*2*t*(1-t)+ey*t*t;
      ctx.lineWidth=.014;ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-.05,py+.14);ctx.stroke();
    }
    ctx.lineWidth=.03;
  }
  ctx.restore();
}

function drawPhotoPanel(ctx, photo, crop, f, palette, grade, index, unit, finish) {
  if(f.points) {
    ctx.save();
    polygon(ctx,f.points,palette.paper);
    ctx.strokeStyle=palette.paper;ctx.lineWidth=unit*.006;ctx.lineJoin='miter';ctx.stroke();
    ctx.clip();ctx.translate(f.x,f.y);
    const r=cropRectangle(photo.naturalWidth,photo.naturalHeight,f.w,f.h,crop);
    ctx.drawImage(inkPhoto(photo,grade,finish),r.x,r.y,r.width,r.height);
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.translate(f.x+f.w/2,f.y+f.h/2);ctx.rotate(f.angle);ctx.translate(-f.w/2,-f.h/2);
  ctx.shadowColor='#0009';ctx.shadowBlur=unit*.015;ctx.shadowOffsetY=unit*.009;
  ctx.fillStyle=index===0?palette.ink:palette.paper;
  const edge=unit*(index===0?.009:.008);
  ctx.fillRect(-edge,-edge,f.w+edge*2,f.h+edge*2+unit*.022);
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.save();ctx.beginPath();ctx.rect(0,0,f.w,f.h);ctx.clip();
  const r=cropRectangle(photo.naturalWidth,photo.naturalHeight,f.w,f.h,crop);
  ctx.drawImage(inkPhoto(photo,grade,finish),r.x,r.y,r.width,r.height);
  const tint=ctx.createLinearGradient(0,0,f.w,f.h);
  tint.addColorStop(0,grade==='neon'?'#343b7829':'#ffc56612');
  tint.addColorStop(.55,'#ff735b00');tint.addColorStop(1,`${palette.accent}55`);
  ctx.globalCompositeOperation='soft-light';ctx.fillStyle=tint;ctx.fillRect(0,0,f.w,f.h);
  ctx.globalCompositeOperation='source-over';
  const shade=ctx.createLinearGradient(0,f.h*.55,0,f.h);
  shade.addColorStop(0,'#07121c00');shade.addColorStop(1,'#07121ca0');
  ctx.fillStyle=shade;ctx.fillRect(0,0,f.w,f.h);
  ctx.restore();
  if(index!==0) {
    ctx.fillStyle=palette.ink;ctx.font=`700 ${unit*.014}px Studio`;
    ctx.fillText(index===1?'02 / THE CONNECTION':'03 / THE RIG',unit*.008,f.h+unit*.019);
  }
  ctx.fillStyle=palette.ink;ctx.fillRect(unit*.011,unit*.011,unit*.044,unit*.029);
  lettering(ctx,`0${index+1}`,unit*.018,unit*.032,unit*.017,unit*.032,palette.paper);
  ctx.restore();
}

function drawMotelStamp(ctx,x,y,size,palette,stamp) {
  ctx.save();ctx.translate(x,y);ctx.rotate(.13);ctx.scale(size,size);
  ctx.strokeStyle=palette.paper;ctx.lineWidth=.025;
  ctx.beginPath();ctx.arc(.02,-.18,.18,0,Math.PI*2);ctx.stroke();
  polygon(ctx,[[-.48,.05],[-.34,-.08],[.35,-.08],[.48,.05],[.39,.75],[-.39,.75]],palette.gold);
  ctx.strokeStyle=palette.ink;ctx.lineWidth=.012;ctx.strokeRect(-.33,.07,.66,.54);
  ctx.fillStyle=palette.ink;ctx.font='700 .13px Studio';ctx.textAlign='center';
  ctx.fillText('LAST CHECK-IN',0,.22,.60);ctx.font='italic 700 .21px Cover';
  ctx.fillText(stamp.toUpperCase()||'ROOM 07',0,.45,.60);
  ctx.font='700 .075px Studio';ctx.fillText('LEAVE NO TRACE',0,.57);
  ctx.restore();
}

function drawTitleRibbon(ctx,w,h,state,p) {
  const wide=w/h>1.35;
  ctx.save();ctx.translate(w*.035,h*(wide?.73:.77));ctx.rotate(-.058);
  const rw=w*.93,rh=h*(wide?.205:.178);
  polygon(ctx,[[0,0],[rw,0],[rw*.98,rh],[rw*.015,rh]],p.ink);
  ctx.strokeStyle=p.paper;ctx.lineWidth=h*.003;ctx.strokeRect(w*.015,-h*.012,rw*.97,rh+h*.018);
  polygon(ctx,[[-w*.004,h*.012],[rw*.985,h*.012],[rw*.968,rh-h*.012],[w*.025,rh-h*.012]],p.accent);
  const text=(state.title.trim()||'YOUR STORY').toUpperCase();
  const size=h*(wide?.193:.137);
  ctx.font=`italic 700 ${size}px Cover`;
  const natural=ctx.measureText(text).width;
  const target=rw*.90;
  ctx.save();ctx.translate(rw*.045,rh*.80);ctx.scale(Math.min(1.15,target/natural),1);
  ctx.lineWidth=h*.009;ctx.lineJoin='round';ctx.strokeStyle=p.ink;
  ctx.strokeText(text,h*.004,h*.007);
  ctx.fillStyle=p.paper;ctx.fillText(text,0,0);
  ctx.restore();
  ctx.restore();
}

function drawCoastlineTitle(ctx,w,h,state,p) {
  const wide=w/h>1.35,u=Math.min(w,h);
  // A single hard-cut stage for lettering, not a stack of postcard borders.
  ctx.fillStyle=p.ink;ctx.fillRect(0,h*.86,w,h*.14);
  ctx.save();
  const text=(state.title.trim()||'YOUR STORY').toUpperCase();
  const size=h*(wide?.270:.180);
  ctx.font=`700 ${size}px Studio`;
  const measured=ctx.measureText(text).width;
  ctx.translate(w*.052,h*.938);ctx.rotate(-.042);
  ctx.transform(Math.min(1.18,w*.885/Math.max(measured,1)),0,-.13,1,0,0);
  ctx.lineJoin='round';ctx.miterLimit=2;
  ctx.lineWidth=u*.019;ctx.strokeStyle=p.ink;
  ctx.strokeText(text,u*.010,u*.009);
  ctx.lineWidth=u*.010;ctx.strokeStyle=p.paper;ctx.strokeText(text,0,0);
  ctx.lineWidth=u*.004;ctx.strokeStyle=p.ink;ctx.strokeText(text,0,0);
  const face=ctx.createLinearGradient(0,-size*.75,0,0);
  face.addColorStop(0,p.paper);face.addColorStop(.43,p.gold);
  face.addColorStop(.46,p.gold);face.addColorStop(.47,p.accent);face.addColorStop(1,p.accent);
  ctx.fillStyle=face;ctx.fillText(text,0,0);
  ctx.restore();
}

function drawSevenTitle(ctx,w,h,state,p) {
  const u=Math.min(w,h),wide=w/h>1.35;
  const text=(state.title.trim()||'YOUR STORY').toUpperCase();
  let lines=[text];
  if(text.length>17 && text.includes(' ')) {
    const words=text.split(/\s+/);let split=1;
    for(let i=1;i<words.length;i++)if(Math.abs(words.slice(0,i).join(' ').length-text.length/2)<Math.abs(words.slice(0,split).join(' ').length-text.length/2))split=i;
    lines=[words.slice(0,split).join(' '),words.slice(split).join(' ')];
  }
  const size=h*(lines.length===2?(wide?.13:.09):(wide?.21:.145));
  ctx.save();ctx.translate(w*.075,h*(lines.length===2?.80:.89));ctx.rotate(-.035);
  ctx.font=`700 ${size}px Studio`;ctx.lineJoin='round';ctx.miterLimit=2;
  const width=Math.max(...lines.map(line=>ctx.measureText(line).width));
  ctx.transform(Math.min(1.18,w*.84/Math.max(width,1)),0,-.12,1,0,0);
  lines.forEach((line,i)=>{
    const y=i*size*.88;
    ctx.lineWidth=u*.027;ctx.strokeStyle='#25162f';ctx.strokeText(line,u*.010,y+u*.014);
    ctx.lineWidth=u*.014;ctx.strokeStyle='#fff0d1';ctx.strokeText(line,0,y);
    ctx.lineWidth=u*.005;ctx.strokeStyle='#39213c';ctx.strokeText(line,0,y);
    const fill=ctx.createLinearGradient(0,y-size*.8,0,y);
    fill.addColorStop(0,'#fff1cd');fill.addColorStop(.42,'#ffc797');fill.addColorStop(.48,'#fff1cd');fill.addColorStop(.49,'#f49b91');fill.addColorStop(1,'#ed7286');
    ctx.fillStyle=fill;ctx.fillText(line,0,y);
  });
  ctx.restore();
}

export function drawCover(canvas,photos,state) {
  const ctx=canvas.getContext('2d');
  const w=canvas.width,h=canvas.height,u=Math.min(w,h),wide=w/h>1.35;
  const p=PALETTES[state.grade]||PALETTES.sunset;
  ctx.clearRect(0,0,w,h);ctx.fillStyle=p.ink;ctx.fillRect(0,0,w,h);
  const sky=ctx.createLinearGradient(0,0,w,h);
  sky.addColorStop(0,p.ink);sky.addColorStop(.45,'#283d43');sky.addColorStop(1,p.accent);
  if(!['velocity','seven'].includes(state.layout)) {
    ctx.fillStyle=sky;ctx.fillRect(w*.018,h*.065,w*.964,h*.865);
    ctx.fillStyle=p.gold;ctx.beginPath();ctx.arc(w*.47,h*.40,u*.23,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.globalAlpha=.28;
    for(let i=0;i<9;i++){ctx.fillStyle=p.ink;ctx.fillRect(w*.18,h*(.41+i*.024),w*.65,h*(.004+i*.001));}
    ctx.restore();
    drawPalm(ctx,w*.028,h*.14,u*.43,p.ink);drawPalm(ctx,w*.945,h*.19,u*.60,p.ink);
  }
  const frames=panelFrames(w,h,state.layout);
  frames.forEach((frame,index)=>{
    const crop=state.panels[index];const photo=photos[crop.photo]?.image;
    if(photo) drawPhotoPanel(ctx,photo,crop,frame,p,state.grade,index,u,state.finish);
  });
  if(state.layout==='seven') {
    // Draw seams after all photos, so gutter width never depends on paint order.
    for(const frame of frames) {
      polygon(ctx,frame.points,'#0000');ctx.lineJoin='round';
      ctx.strokeStyle='#25162f';ctx.lineWidth=u*.009;ctx.stroke();
      ctx.strokeStyle='#fff0d1';ctx.lineWidth=u*.002;ctx.stroke();
    }
    const shade=ctx.createLinearGradient(0,h*.64,0,h);
    shade.addColorStop(0,'#25162f00');shade.addColorStop(1,'#25162f99');
    ctx.fillStyle=shade;ctx.fillRect(0,h*.64,w,h*.36);
  }
  const seven=state.layout==='seven';
  ctx.fillStyle=p.ink;ctx.fillRect(0,0,w,h*(seven?.033:.067));
  lettering(ctx,(state.location.trim()||'PALM COAST').toUpperCase(),w*.03,h*(seven?.024:.045),h*(seven?.018:.026),w*.48,p.paper);
  ctx.save();ctx.textAlign='right';ctx.font=`700 ${h*.015}px Studio`;ctx.fillStyle=p.gold;
  ctx.fillText(['velocity','seven'].includes(state.layout)?`AFTER HOURS ORIGINAL / ${state.stamp.trim().toUpperCase()}`:'AN AFTER HOURS ORIGINAL',w*.97,h*(seven?.023:.043),w*.46);ctx.restore();
  if(!['velocity','seven'].includes(state.layout))drawMotelStamp(ctx,w*(wide?.449:.31),h*(wide?.48:.49),u*(wide?.15:.14),p,state.stamp);
  if(state.layout==='seven')drawSevenTitle(ctx,w,h,state,p);
  else if(state.layout==='velocity')drawCoastlineTitle(ctx,w,h,state,p);
  else drawTitleRibbon(ctx,w,h,state,p);
  ctx.fillStyle=p.ink;ctx.fillRect(0,h*.944,w,h*.056);
  lettering(ctx,state.subtitle.trim(),w*.035,h*.978,h*(wide?.025:.021),w*.79,p.paper);
  ctx.fillStyle=p.gold;
  // A little film-edge device rather than an unrelated badge or logo.
  if(!['velocity','seven'].includes(state.layout))for(let i=0;i<5;i++)ctx.fillRect(w*(.89+i*.015),h*.965,w*.008,h*.013);
  if(state.texture==='print') {
    ctx.save();ctx.globalAlpha=.075;
    for(let i=0;i<3200;i++) {
      const x=((i*277+31)%10009)/10009*w,y=((i*619+77)%10007)/10007*h;
      ctx.fillStyle=i%3?p.paper:p.ink;ctx.fillRect(x,y,u*.0012,u*.0012);
    }
    ctx.restore();
  }
  ctx.strokeStyle=p.paper;ctx.lineWidth=u*.004;ctx.strokeRect(u*.011,u*.011,w-u*.022,h-u*.022);
  return frames;
}
