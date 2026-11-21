// Crop controls are percentages of the image overflow, not the frame.
// This keeps every panel covered even for extreme portrait/landscape photos.
export function cropRectangle(imageWidth, imageHeight, width, height, crop) {
  const scale = Math.max(width / imageWidth, height / imageHeight) * Math.max(1, Number(crop.zoom) || 1);
  const drawnWidth = imageWidth * scale;
  const drawnHeight = imageHeight * scale;
  const fraction = value => Math.min(100, Math.max(0, Number(value) || 0)) / 100;
  return {
    x: (width - drawnWidth) * fraction(crop.x),
    y: (height - drawnHeight) * fraction(crop.y),
    width: drawnWidth,
    height: drawnHeight,
  };
}

export function panelFrames(width, height, layout = 'dossier') {
  const wide = width / height > 1.35;
  if(layout==='seven') {
    const [l0,l1,r0,r1,a,b]=wide?[.30,.36,.72,.65,.32,.67]:width===height?[.28,.34,.74,.65,.32,.67]:[.24,.32,.78,.66,.30,.66];
    const L=y=>l0+(l1-l0)*y,R=y=>r0+(r1-r0)*y;
    const shapes=[
      [[l0,0],[r0,0],[r1,1],[l1,1]],
      [[0,0],[l0,0],[L(a),a],[0,a-.04]],
      [[0,a-.04],[L(a),a],[L(b),b],[0,b+.03]],
      [[0,b+.03],[L(b),b],[l1,1],[0,1]],
      [[r0,0],[1,0],[1,a+.04],[R(a),a]],
      [[R(a),a],[1,a+.04],[1,b-.03],[R(b),b]],
      [[R(b),b],[1,b-.03],[1,1],[r1,1]],
    ];
    return shapes.map(shape=>{
      const points=shape.map(([x,y])=>[x*width,y*height]);
      const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
      const x=Math.min(...xs),y=Math.min(...ys);
      return {x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y,angle:0,points};
    });
  }
  if(layout==='velocity') {
    const shapes=wide ? [
      [[.52,.067],[.981,.067],[.981,.90],[.465,.80]],
      [[.019,.067],[.506,.067],[.481,.454],[.019,.51]],
      [[.019,.532],[.478,.476],[.455,.748],[.019,.748]],
    ] : [
      [[.44,.063],[.978,.063],[.978,.86],[.49,.75]],
      [[.022,.063],[.42,.063],[.448,.449],[.022,.49]],
      [[.022,.509],[.45,.468],[.47,.751],[.022,.751]],
    ];
    return shapes.map(shape=>{
      const points=shape.map(([x,y])=>[x*width,y*height]);
      const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
      const x=Math.min(...xs),y=Math.min(...ys);
      return {x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y,angle:0,points};
    });
  }
  let boxes;
  if (layout === 'triptych') {
    boxes = [[.025,.105,.31,.73,-.025],[.345,.075,.31,.79,0],[.665,.105,.31,.73,.025]];
  } else if (layout === 'split') {
    boxes = wide
      ? [[.025,.11,.55,.76,0],[.59,.11,.385,.36,0],[.59,.49,.385,.38,0]]
      : [[.035,.09,.93,.40,0],[.04,.509,.445,.172,-.025],[.515,.509,.445,.172,.025]];
  } else {
    boxes = wide
      ? [[.477,.085,.49,.815,.018],[.038,.115,.415,.338,-.04],[.055,.493,.385,.193,-.025]]
      : [[.35,.08,.61,.70,.025],[.04,.13,.36,.345,-.055],[.035,.518,.36,.212,-.035]];
  }
  return boxes.map(([x,y,w,h,angle])=>({x:x*width,y:y*height,w:w*width,h:h*height,angle}));
}

export function panelContains(frame,x,y) {
  if(frame.points) {
    let inside=false;
    for(let i=0,j=frame.points.length-1;i<frame.points.length;j=i++) {
      const [xi,yi]=frame.points[i],[xj,yj]=frame.points[j];
      if((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
    }
    return inside;
  }
  const dx=x-frame.x-frame.w/2,dy=y-frame.y-frame.h/2;
  const localX=dx*Math.cos(frame.angle)+dy*Math.sin(frame.angle)+frame.w/2;
  const localY=-dx*Math.sin(frame.angle)+dy*Math.cos(frame.angle)+frame.h/2;
  return localX>=0&&localX<=frame.w&&localY>=0&&localY<=frame.h;
}
