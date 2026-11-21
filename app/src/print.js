// Deterministic, image-agnostic print preparation. No sample masks or face coordinates.
// A small joint-range filter groups tones before selective dark-side contours.
const RAMPS = {
  sunset:[[18,27,39],[74,65,81],[157,111,106],[232,174,134],[255,239,198]],
  neon:[[19,21,43],[57,38,91],[155,91,128],[239,163,168],[255,234,209]],
  noir:[[18,28,35],[54,64,67],[125,124,107],[199,178,131],[255,237,193]],
};
const luminance = (data,i) => data[i]*.299+data[i+1]*.587+data[i+2]*.114;
const clamp = value => Math.max(0,Math.min(255,value));

function smoothPlanes(source,width,height) {
  let input=new Uint8ClampedArray(source);
  const range=Float32Array.from({length:766},(_,d)=>1/(1+(d/44)**4));
  const offsets=[[0,0,3],[-1,0,2],[1,0,2],[0,-1,2],[0,1,2],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]];
  for(const radius of [1,2,3]) {
    const output=new Uint8ClampedArray(input.length);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
      const i=(y*width+x)*4;
      let r=0,g=0,b=0,total=0;
      for(const [dx,dy,spatial] of offsets) {
        const sx=Math.max(0,Math.min(width-1,x+dx*radius));
        const sy=Math.max(0,Math.min(height-1,y+dy*radius));
        const j=(sy*width+sx)*4;
        // Range weights keep strong silhouettes from bleeding into the background.
        const distance=Math.abs(input[i]-input[j])+Math.abs(input[i+1]-input[j+1])+Math.abs(input[i+2]-input[j+2]);
        const weight=range[distance]*spatial*(input[j+3]/255);
        total+=weight;r+=input[j]*weight;g+=input[j+1]*weight;b+=input[j+2]*weight;
      }
      if(total) {output[i]=r/total;output[i+1]=g/total;output[i+2]=b/total;}
      output[i+3]=source[i+3];
    }
    input=output;
  }
  return input;
}

export function printPixels(source,width,height,grade='sunset',finish='illustrated') {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||source.length!==width*height*4) {
    throw new RangeError('Print pixels require positive dimensions and a complete RGBA image.');
  }
  const smooth=smoothPlanes(source,width,height);
  const output=new Uint8ClampedArray(source.length);
  const luma=new Float32Array(width*height);
  for(let i=0;i<source.length;i+=4)luma[i/4]=luminance(smooth,i);
  const ramp=RAMPS[grade]||RAMPS.sunset;
  const screen=finish==='screenprint';
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const n=y*width+x,i=n*4,light=luma[n];
    const step=screen?47:20;
    const flat=Math.round(light/step)*step;
    const shaped=clamp(light+(flat-light)*(screen?.93:.48));
    const position=Math.min(3.999,shaped/255*4),band=Math.floor(position),t=position-band;
    const coolness=Math.min(1,Math.max(0,smooth[i+2]-smooth[i])/110);
    const cool=Math.max(0,smooth[i+2]-smooth[i])*(grade==='sunset'?.035:screen?.12:.28);
    // Relight cool daylight rather than preserving a separate blue/green scene.
    // This hue-based separation applies to every uploaded image, never a subject mask.
    const chroma=screen?.10:grade==='noir'?.22:grade==='sunset'?.59*(1-coolness*.80):.48;
    const nearby=(dx,dy)=>luma[Math.max(0,Math.min(height-1,y+dy))*width+Math.max(0,Math.min(width-1,x+dx))];
    // Draw only on the darker side of large, smoothed edges; flat skin stays clean.
    const rise=Math.max(nearby(-2,0),nearby(2,0),nearby(0,-2),nearby(0,2))-light;
    const ink=Math.min(screen?.52:.36,Math.max(0,(rise-22)/110));
    for(let c=0;c<3;c++) {
      const base=ramp[band][c]*(1-t)+ramp[band+1][c]*t;
      const color=base+(smooth[i+c]-light)*chroma+cool*(c===0?-.25:c===1?.90:.68);
      output[i+c]=clamp(color*(1-ink)+ramp[0][c]*ink);
    }
    output[i+3]=source[i+3];
  }
  return output;
}
