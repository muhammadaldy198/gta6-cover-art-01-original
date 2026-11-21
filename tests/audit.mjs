import assert from 'node:assert/strict';
import { readFileSync, readdirSync, lstatSync, existsSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { buildDossier } from '../vendor/makefun-app.ts';

const root=resolve(import.meta.dirname,'..');
const app=resolve(root,'app');
function walk(directory) {
  return readdirSync(directory).flatMap(name=>{
    const path=resolve(directory,name),stat=lstatSync(path);
    assert.ok(!stat.isSymbolicLink(),`symlink forbidden: ${path}`);
    return stat.isDirectory()?[path,...walk(path)]:[path];
  });
}
const paths=walk(app);
const files=paths.filter(path=>lstatSync(path).isFile());
const bytes=files.reduce((sum,path)=>sum+lstatSync(path).size,0);
assert.ok(paths.length<=993 && bytes<=50331648);
let references=0;
function reference(from,specifier) {
  if(specifier.startsWith('data:'))return;
  assert.ok(!/^(?:[a-z]+:|\/\/)/i.test(specifier),`remote reference ${specifier}`);
  const target=specifier.startsWith('/')?resolve(app,specifier.slice(1)):resolve(dirname(from),specifier);
  assert.ok(target.startsWith(app+'/') && existsSync(target) && lstatSync(target).isFile(),`missing/outside reference: ${specifier} in ${from}`);
  references++;
}
for(const path of files) {
  if(!/\.(html|css|js|mjs)$/.test(path))continue;
  const text=readFileSync(path,'utf8');
  assert.ok(!/https?:|(?:['"(]\s*)\/\/[a-z0-9]/i.test(text),`remote URL in ${path}`);
  if(/\.html$/.test(path)) {
    for(const match of text.matchAll(/<(?:script|img|source|video|audio|iframe|link)\b[^>]*?\b(?:src|href)=["']([^"']+)["']/g))reference(path,match[1]);
  }
  if(/\.css$/.test(path))for(const match of text.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g))reference(path,match[1]);
  if(/\.(js|mjs)$/.test(path)) {
    for(const match of text.matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g)) {
      assert.ok(match[1].startsWith('.') || match[1].startsWith('/') || match[1].startsWith('data:'),'bare package import');
      reference(path,match[1]);
    }
    for(const match of text.matchAll(/['"](\.\/?samples\/[^'"]+\.jpg)['"]/g))reference(resolve(app,'index.html'),match[1]);
    assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|Worker)\s*\(/.test(text),`unexpected network/worker API in ${path}`);
    const syntax=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});
    assert.equal(syntax.status,0,syntax.stderr);
  }
}
const output=resolve(root,'.qa/output-a');
const dossier=readFileSync(resolve(output,'dossier.json'));
const rebuilt=Buffer.from(buildDossier(output,{text_max_bytes:163840,screenshots:{max:4,max_bytes:262144},app_max_files:993,app_max_bytes:50331648,app_path_max_bytes:1000}));
assert.ok(dossier.equals(rebuilt),'dossier differs from unchanged helper reconstruction');
const outputFiles=walk(output).filter(path=>lstatSync(path).isFile());
const manifest=outputFiles.map(path=>({path:relative(output,path),bytes:lstatSync(path).size,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')}));
assert.ok(outputFiles.every(path=>(lstatSync(path).mode&4)!==0),'all output files must be world-readable');
console.log(JSON.stringify({appFiles:files.length,appEntries:paths.length,appBytes:bytes,localReferences:references,outputFiles:outputFiles.length,dossierBytes:dossier.length,dossierMatches:true,manifest},null,2));
