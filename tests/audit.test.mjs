import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const run = (script, args = [], env = {}) => spawnSync(process.execPath, [script, ...args], {
  cwd: root, encoding: 'utf8', env: { ...process.env, ...env },
});

function withOutput(check) {
  const directory = mkdtempSync(join(tmpdir(), 'cover-audit-'));
  try {
    const output = join(directory, 'output');
    const built = run('main.ts', [], { MAKEFUN_OUTPUT_DIR: output });
    assert.equal(built.status, 0, built.stderr);
    check(output);
  } finally { rmSync(directory, { recursive: true, force: true }); }
}

test('audit checks the explicitly requested output, not an old default directory', () => {
  const result = run('tests/audit.mjs', [join(root, '.qa/does-not-exist')]);
  assert.notEqual(result.status, 0, 'audit silently ignored requested output');
});

test('audit accepts exact output and rejects stale copied app bytes', () => {
  withOutput(output => {
    const valid = run('tests/audit.mjs', [output]);
    assert.equal(valid.status, 0, valid.stderr);
    assert.equal(JSON.parse(valid.stdout).output, output);
    appendFileSync(join(output, 'app/src/cover.js'), '\n// stale output fixture\n');
    const stale = run('tests/audit.mjs', [output]);
    assert.notEqual(stale.status, 0);
    assert.match(stale.stderr, /source bytes differ: app\/src\/cover.js/);
  });
});

test('audit rejects stale copied screenshot bytes', () => {
  withOutput(output => {
    appendFileSync(join(output, 'screenshots/01-after-hours-cover.jpg'), 'stale');
    const stale = run('tests/audit.mjs', [output]);
    assert.notEqual(stale.status, 0);
    assert.match(stale.stderr, /source bytes differ: screenshots\/01-after-hours-cover.jpg/);
  });
});
