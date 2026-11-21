import test from 'node:test';
import assert from 'node:assert/strict';

test('crop covers every frame at extreme independent pan and zoom', async () => {
  const { cropRectangle } = await import('../app/src/geometry.js');
  for (const [iw, ih] of [[544,720],[720,720],[4000,700],[700,4000]]) {
    for (const [w,h] of [[700,900],[1500,500],[400,400]]) {
      for (const x of [0,50,100]) for (const y of [0,50,100]) for (const zoom of [1,1.6,3]) {
        const r = cropRectangle(iw,ih,w,h,{x,y,zoom});
        assert.ok(r.x <= 0 && r.y <= 0, JSON.stringify(r));
        assert.ok(r.x + r.width >= w - 0.001);
        assert.ok(r.y + r.height >= h - 0.001);
        assert.ok(Math.abs(r.width / r.height - iw / ih) < 0.0001);
      }
    }
  }
});

test('each layout fits three distinct panels inside all export sizes', async () => {
  const { panelFrames } = await import('../app/src/geometry.js');
  for (const [w,h] of [[1920,1080],[1080,1080],[1080,1350]]) {
    for (const layout of ['dossier','split','triptych']) {
      const frames = panelFrames(w,h,layout);
      assert.equal(frames.length,3);
      if(layout==='dossier' && w/h>1.35) {
        assert.ok(frames[2].y+frames[2].h<h*.75,'detail photo must sit above the title ribbon');
      }
      assert.equal(new Set(frames.map(f=>`${f.x},${f.y}`)).size,3);
      for(const f of frames) {
        assert.ok(f.x>=0 && f.y>=0 && f.w>0 && f.h>0);
        assert.ok(f.x+f.w<=w && f.y+f.h<=h);
      }
    }
  }
});

test('supporting shots keep room for their labels above the title zone', async () => {
  const { panelFrames } = await import('../app/src/geometry.js');
  // The angled title's right edge sits higher than its left edge.
  for (const [w,h,layout,cutoff] of [[1920,1080,'dossier',.72],[1080,1350,'dossier',.77],[1080,1080,'split',.708]]) {
    for (const frame of panelFrames(w,h,layout).slice(1)) {
      const bottom=frame.y+frame.h+Math.abs(Math.sin(frame.angle))*frame.w/2;
      assert.ok(bottom+.018*Math.min(w,h)<cutoff*h, `${layout} ${w}×${h}: photo label in title zone`);
    }
  }
});

test('angular poster panels interlock without overlaps and hit-testing follows their sloping seams', async () => {
  const { panelFrames, panelContains } = await import('../app/src/geometry.js');
  for(const [w,h] of [[1920,1080],[1080,1080],[1080,1350]]) {
    const frames=panelFrames(w,h,'velocity');
    assert.equal(frames.length,3);
    assert.ok(frames.every(f=>f.points?.length===4),'each angular panel needs a real clipping polygon');
    for(const f of frames) {
      assert.ok(panelContains(f,f.x+f.w*.5,f.y+f.h*.5),'panel center must remain selectable');
      assert.ok(!panelContains(f,-1,-1));
    }
    for(let y=0;y<h;y+=h/40)for(let x=0;x<w;x+=w/60) {
      assert.ok(frames.filter(f=>panelContains(f,x,y)).length<=1,'interlocking photo panels must not obscure each other');
    }
    const detail=frames[2];
    assert.ok(detail.w*detail.h>w*h*.09,'detail must be a useful photo region, not a decorative sliver');
    assert.ok(detail.y+detail.h<h*.79,'detail stays clear of the main title');
  }
});
