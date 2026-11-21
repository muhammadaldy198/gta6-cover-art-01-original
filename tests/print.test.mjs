import test from 'node:test';
import assert from 'node:assert/strict';

const pixels = (width, height, color) => Uint8ClampedArray.from(Array.from({length:width*height}, (_, i)=>[...color(i%width,Math.floor(i/width)),255]).flat());

test('illustrated ink merges low-contrast photo grain while retaining a strong silhouette', async () => {
  const { printPixels } = await import('../app/src/print.js');
  const width=40,height=24;
  const source=pixels(width,height,(x,y)=>{
    const noise=((x*19+y*13)%13)-6;
    return x<20?[68+noise,57+noise,55+noise]:[210+noise,173+noise,132+noise];
  });
  const copy=new Uint8ClampedArray(source);
  const output=printPixels(source,width,height,'sunset','illustrated');
  assert.deepEqual(source,copy,'source pixels must not be mutated');
  const spread=(data,left,right)=>{
    const values=[];
    for(let y=5;y<height-5;y++)for(let x=left;x<right;x++)values.push(data[(y*width+x)*4]);
    return Math.max(...values)-Math.min(...values);
  };
  assert.ok(spread(output,4,15)<spread(source,4,15)*.65,'flat planes must lose photographic grain');
  const red=x=>output[(12*width+x)*4];
  assert.ok(red(28)-red(10)>85,'smoothing must not smear across the silhouette');
  assert.ok(red(18)<red(12),'selective ink should reinforce the dark side of a coherent edge');
  assert.deepEqual(printPixels(source,width,height,'sunset','illustrated'),output,'print must be deterministic');
});

test('print handles transparent borders, tiny images and every grade without invalid channels', async () => {
  const { printPixels } = await import('../app/src/print.js');
  for(const [w,h] of [[1,1],[1,9],[9,1],[16,16]]) {
    const source=pixels(w,h,(x,y)=>[(x*73)%256,(y*91)%256,190]);
    source[3]=0;
    for(const grade of ['sunset','neon','noir'])for(const finish of ['illustrated','screenprint']) {
      const output=printPixels(source,w,h,grade,finish);
      assert.equal(output.length,source.length);
      for(let i=3;i<output.length;i+=4)assert.equal(output[i],source[i]);
    }
  }
  assert.throws(()=>printPixels(new Uint8ClampedArray(5),2,2),RangeError);
});

test('illustrated sunset relights daylight cyan into the warm print while keeping skin distinct', async () => {
  const { printPixels } = await import('../app/src/print.js');
  const water=printPixels(pixels(12,12,()=>[32,165,180]),12,12,'sunset','illustrated');
  const skin=printPixels(pixels(12,12,()=>[192,133,107]),12,12,'sunset','illustrated');
  assert.ok(water[0]>=water[1]*.9,`daylight cyan still escapes the sunset palette: ${water.slice(0,3)}`);
  assert.ok(water[2]<=water[0]*1.15,'water must share the warm/violet sunset light');
  assert.ok(skin[0]>skin[1] && skin[1]>skin[2] && skin[0]>160,'warm skin must remain recognizable');
  assert.ok(Math.abs(water[0]-skin[0])>25,'relighting must not flatten distinct subjects into one ink');
});

test('neon illustration retains luminous skin midtones instead of a dark magenta mask', async () => {
  const { printPixels } = await import('../app/src/print.js');
  const skin=printPixels(pixels(8,8,()=>[192,133,107]),8,8,'neon','illustrated');
  const shade=printPixels(pixels(8,8,()=>[50,40,38]),8,8,'neon','illustrated');
  assert.ok(skin[1]>=skin[0]*.5,`green midtones were crushed into magenta: ${skin.slice(0,3)}`);
  assert.ok(skin[0]>190 && skin[0]>skin[2],'skin light and warm identity must survive neon');
  assert.ok(shade[2]>shade[1],'violet ink must remain in deep shadows');
});
