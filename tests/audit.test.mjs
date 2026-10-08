import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const cli=fileURLToPath(new URL('../scripts/audit-tokens.mjs',import.meta.url));
test('CSS audit catches new drift and bounds material exceptions by count',async()=>{
 const root=await mkdtemp(join(tmpdir(),'hds-audit-'));
 try{
  await mkdir(join(root,'src'));
  const config={paths:['src']};
  const writeConfig=()=>writeFile(join(root,'design-system.audit.json'),JSON.stringify(config));
  const css=join(root,'src','sample.css');
  const run=()=>spawnSync(process.execPath,[cli,root],{encoding:'utf8'});
  await writeConfig();
  await writeFile(css,'.card {color:var(--ink);background:var(--paper)} /* #abcdef is a note */');
  assert.equal(run().status,0);
  await writeFile(css,'.card {color:#ff00ff}');
  assert.equal(run().status,1);assert.match(run().stderr,/raw color/);
  config.exceptions={'src/sample.css':{reason:'Illustration material',colors:{'#ff00ff':1}}};
  await writeConfig();assert.equal(run().status,0);
  await writeFile(css,'.card {color:#ff00ff; border-color:#ff00ff}');assert.equal(run().status,1);
  await writeFile(css,':root {--ink:var(--accent-text)}');assert.match(run().stderr,/shared token --ink/);
  await writeFile(css,'.card {color:var(--ink)}');
  await writeFile(join(root,'src','new-file.css'),'.new {background:rgb(0 0 0)}');
  assert.match(run().stderr,/new-file\.css: raw color/);
 }finally{await rm(root,{recursive:true,force:true});}
});
