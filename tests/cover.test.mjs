import test from 'node:test';
import assert from 'node:assert/strict';

const { gradePixel } = await import('../app/src/cover.js');

test('each grade pulls cool water toward its palette and keeps portrait skin warm', () => {
  for (const grade of ['sunset', 'neon', 'noir']) {
    const water = gradePixel(65, 146, 211, grade);
    const skin = gradePixel(192, 133, 107, grade);
    assert.ok(water[2] - water[0] < (211 - 65) * 0.75, `${grade} blue cast remains: ${water}`);
    assert.ok(skin[0] > skin[1] && skin[1] > skin[2], `${grade} skin order lost: ${skin}`);
    assert.ok(skin[0] > 145, `${grade} skin became too dark: ${skin}`);
  }
});

test('unknown grade values leave image pixels unchanged', () => {
  assert.deepEqual(gradePixel(65, 146, 211, 'unknown'), [65, 146, 211]);
});

test('sunset prints warm light over cool water instead of a daylight blue cast', () => {
  const [r,g,b] = gradePixel(65, 146, 211, 'sunset');
  assert.ok(b-r < 45, `blue still dominates the mixed grade: ${[r,g,b]}`);
  const [hr,hg,hb] = gradePixel(220, 220, 220, 'sunset');
  assert.ok(hr-hg > 14 && hg-hb > 20, 'bright neutrals should pick up amber light');
});

test('neon prints violet shadows and rose highlights into the photos', () => {
  const [sr,sg,sb] = gradePixel(40, 40, 40, 'neon');
  assert.ok(sb-sg > 23 && sb>sr, 'shadows need a distinct violet cast');
  const [r,g,b] = gradePixel(220, 220, 220, 'neon');
  assert.ok(r-g > 18 && b-g > 9 && r>b, 'highlights should visibly pick up rosy light');
});
