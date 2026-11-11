// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const file=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');
test('one static offline entry and explicitly local ES module import',async()=>{
 const html=await file('index.html'),js=await file('src/app.mjs'),css=await file('style.css');
 assert.match(html,/<html lang="en">/);
 assert.match(html,/Content-Security-Policy/);
 assert.match(html,/connect-src 'none'/);
 assert.match(html,/script-src 'self'/);
 assert.match(html,/src="\.\/src\/app\.mjs"/);
 assert.match(html,/href="\.\/style\.css"/);
 assert.doesNotMatch(html,/<script[^>]+https?:/i);
 assert.doesNotMatch(css,/@import|url\(\s*['"]?https?:/i);
 assert.doesNotMatch(js,/\bfetch\s*\(|\bWebSocket\s*\(|\bXMLHttpRequest\b/);
 assert.doesNotMatch(js,/\binnerHTML\b|\bouterHTML\b|\b(insertAdjacentHTML|eval)\s*\(/);
 assert.match(js,/node\('p','post-content',post\.text\)/);
 assert.match(js,/element\.textContent=text/);
 assert.match(js,/localStorage/);
 assert.match(js,/installReplyReactor\(\)/);
 assert.match(js,/replyReactor\.render\(state\)/);
 for(const id of ['reply-reactor','reactorGrid','reactorStatus','reactorState',
   'reactorTicks','reactorWins','reactorCount','reactorPlay','reactorStop',
   'reactorWav','reactorExport','reactorPlaybackStatus']){
   assert.ok(html.includes('id="'+id+'"'), 'missing reactor ID '+id);
 }
 assert.doesNotMatch(html,/maxlength="280"/);
 assert.match(js,/limitComposerText\(composer\.value\)/);
 assert.match(js,/addEventListener\('storage'/);
 assert.match(js,/store\.update\(transform\)/);
});
test('app wires all interactive controls to actual DOM identities',async()=>{
 const html=await file('index.html'),js=await file('src/app.mjs');
 const ids=[...js.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]);
 for(const id of new Set(ids)){
  assert.ok(html.includes('id="'+id+'"'), 'missing '+id);
 }
 assert.ok(ids.length>=18);
});
test('site contains both guide modules and a clear fictional disclaimer',async()=>{
 const html=await file('index.html');
 for(const id of ['advisor','grass','hatSteps','nextFact','timeline','scan','touchGrass','downloadReceipt']){
  assert.ok(html.includes('id="'+id+'"'));
 }
 assert.match(html,/ALL SURVEILLANCE ALERTS ARE FICTIONAL/);
 assert.match(html,/EARTH/);
 assert.match(html,/TINFOIL HAT/);
});
