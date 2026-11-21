import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

test('screenshot manifest names exact four delivered images within the required caps',async()=>{
  const manifest=JSON.parse(await readFile(new URL('../shots.json',import.meta.url)));
  const names=(await readdir(new URL('../screenshots/',import.meta.url))).filter(name=>!name.startsWith('.')).sort();
  assert.deepEqual(manifest.map(row=>row.name).sort(),names);
  assert.equal(names.length,4);
  for(const row of manifest) {
    const bytes=await readFile(new URL('../screenshots/'+row.name,import.meta.url));
    assert.ok(bytes.length<=262144,row.name);
    assert.ok(Math.max(row.w,row.h)<=1280 && Math.min(row.w,row.h)>=480);
    if(row.name!=='02-after-hours-studio.jpg'){assert.equal(row.layout,'seven');assert.equal(row.sources,7);}
  }
});
