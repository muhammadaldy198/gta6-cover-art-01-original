import test from 'node:test';
import assert from 'node:assert/strict';
import { querySettings } from '../app/src/shots.js';

test('studio starts with seven sunset scenes and rejects unknown query choices', () => {
  for(const query of ['', 'layout=outside&finish=remote&grade=invalid&size=999x999']) {
    const state=querySettings(new URLSearchParams(query));
    assert.equal(state.layout,'seven');
    assert.equal(state.finish,'illustrated');
    assert.equal(state.grade,'sunset');
    assert.equal(state.size,'1920x1080');
  }
});

test('all ordinary art directions remain selectable and query captions respect input lengths', () => {
  for(const layout of ['velocity','dossier','split','triptych'])for(const finish of ['illustrated','screenprint','photo']) {
    const state=querySettings(new URLSearchParams({layout,finish,grade:'sunset',title:'x'.repeat(60),caption:'y'.repeat(100)}));
    assert.equal(state.layout,layout);
    assert.equal(state.finish,finish);
    assert.equal(state.grade,'sunset');
    assert.equal(state.title.length,26);
    assert.equal(state.subtitle.length,68);
  }
});
