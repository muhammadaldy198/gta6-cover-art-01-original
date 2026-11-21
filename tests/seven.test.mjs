import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { panelFrames, panelContains } from '../app/src/geometry.js';

test('seven sloped panels tile every export ratio with unique hit targets', () => {
  for(const [w,h] of [[1920,1080],[1080,1080],[1080,1350]]) {
    const frames=panelFrames(w,h,'seven');
    assert.equal(frames.length,7);
    const area=frames.reduce((sum,f)=>sum+Math.abs(f.points.reduce((s,p,i,a)=>s+p[0]*a[(i+1)%a.length][1]-p[1]*a[(i+1)%a.length][0],0))/2,0);
    assert.ok(Math.abs(area-w*h)<.001);
    for(let y=.007;y<1;y+=.023)for(let x=.011;x<1;x+=.027)
      assert.equal(frames.filter(f=>panelContains(f,x*w,y*h)).length,1);
    assert.ok(frames[0].h>frames[1].h*2);
  }
});

test('seven default sources have distinct content and independently replaceable crops', async()=>{
  const { DEMO_SOURCES, demoPanels, replacePanel, fillPanels }=await import('../app/src/panels.js');
  assert.equal(DEMO_SOURCES.length,7);
  const hashes=await Promise.all(DEMO_SOURCES.map(async source=>createHash('sha256').update(await readFile(new URL('../app/'+source.path,import.meta.url))).digest('hex')));
  assert.equal(new Set(hashes).size,7);
  const panels=demoPanels();
  assert.equal(new Set(panels.map(p=>p.photo)).size,7);
  const before=structuredClone(panels);
  const next=replacePanel(panels,4,9);
  assert.equal(next[4].photo,9);
  next[4].zoom=2.4;
  for(let i=0;i<7;i++)if(i!==4)assert.deepEqual(next[i],before[i]);
  assert.deepEqual(panels,before);
  const filled=fillPanels(panels,1);
  filled[0].x=0;
  assert.equal(filled[1].x,50);
  assert.ok(filled.every(p=>p.photo===1));
});
