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
