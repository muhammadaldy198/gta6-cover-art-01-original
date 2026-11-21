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
  let boxes;
  if (layout === 'triptych') {
    boxes = [[.025,.105,.31,.73,-.025],[.345,.075,.31,.79,0],[.665,.105,.31,.73,.025]];
  } else if (layout === 'split') {
    boxes = wide
      ? [[.025,.11,.55,.76,0],[.59,.11,.385,.36,0],[.59,.49,.385,.38,0]]
      : [[.035,.09,.93,.48,0],[.035,.59,.45,.30,-.025],[.515,.59,.45,.30,.025]];
  } else {
    boxes = wide
      ? [[.477,.085,.49,.815,.018],[.038,.115,.415,.345,-.04],[.055,.50,.385,.225,-.025]]
      : [[.35,.08,.61,.70,.025],[.04,.13,.36,.355,-.055],[.035,.52,.36,.29,-.035]];
  }
  return boxes.map(([x,y,w,h,angle])=>({x:x*width,y:y*height,w:w*width,h:h*height,angle}));
}
