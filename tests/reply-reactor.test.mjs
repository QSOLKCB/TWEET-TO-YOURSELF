// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {initialState,addPost,automaticReply} from '../src/core.mjs';
import {REACTOR_KIND,buildReplyReactor,reactorLog,reactorReferenceWav} from '../src/reply-reactor.mjs';

function posts(...items){
  let s=initialState();
  for(const [text,parent] of items)s=addPost(s,text,parent??null);
  return s;
}
test('independently calculated GF(3) post/reply transitions reach the target',()=>{
  const s=posts(['First',null],['I disagree',1],['Counter-reply',null]);
  const r=buildReplyReactor(s);
  assert.equal(r.kind,REACTOR_KIND);
  assert.deepEqual(r.transitions.map(t=>[t.operation,t.before,t.after]),[
    ['post',[0,0],[1,0]],
    ['reply',[1,0],[1,1]],
    ['post',[1,1],[2,1]]
  ]);
  assert.deepEqual(r.current,[2,1]);
  assert.equal(r.targetHits,1);
  assert.deepEqual(r.events.map(e=>e.frequency),[294,392,196]);
  assert.ok(Object.isFrozen(r)&&Object.isFrozen(r.events)&&Object.isFrozen(r.current));
  assert.ok(Object.isFrozen(r.transitions)&&Object.isFrozen(r.transitions[2]));
});
test('empty archive has a valid state and no audio authority',()=>{
  const result=buildReplyReactor(initialState());
  assert.deepEqual(result.current,[0,0]);
  assert.equal(result.ticks,0);
  assert.equal(result.targetHits,0);
  assert.deepEqual(result.events,[]);
  assert.throws(()=>reactorReferenceWav(result),RangeError);
  assert.equal(reactorLog(result).events.length,0);
});
test('repeated source input yields exactly identical canonical event logs and WAV',()=>{
  const s=posts(['Hi',null],['A reply',1],['Another',2],['Fresh',null]);
  const a=buildReplyReactor(s),b=buildReplyReactor(s);
  assert.deepEqual(reactorLog(a),reactorLog(b));
  assert.deepEqual(reactorReferenceWav(a),reactorReferenceWav(b));
  const wav=reactorReferenceWav(a),view=new DataView(wav.buffer,wav.byteOffset,wav.byteLength);
  assert.equal(wav.length,44+4*12000*2);
  assert.equal(view.getUint32(24,true),48000);
  assert.equal(view.getUint16(22,true),1);
  assert.equal(view.getUint16(34,true),16);
  assert.equal(view.getUint32(40,true),4*12000*2);
});
test('non-post warning increments do not influence mathematical events',()=>{
  const one=posts(['Hi',null],['Reply',1]);
  const two={...one,warningIndex:77,replyIndex:42};
  assert.deepEqual(reactorLog(buildReplyReactor(one)),reactorLog(buildReplyReactor(two)));
  assert.deepEqual(reactorReferenceWav(buildReplyReactor(one)),
    reactorReferenceWav(buildReplyReactor(two)));
});
test('most recent 32 posts form a bounded deterministic musical window',()=>{
  let s=initialState();
  for(let i=0;i<150;i++)s=addPost(s,'Self-argument '+i,i?i:null);
  const reactor=buildReplyReactor(s),log=reactorLog(reactor);
  assert.equal(reactor.ticks,32);
  assert.equal(reactor.omittedPosts,118);
  assert.equal(log.totalPosts,150);
  assert.equal(log.transitions[0].postId,119);
  assert.equal(log.transitions.at(-1).postId,150);
  assert.equal(log.events.length,32);
  assert.equal(log.events[0].tick,1);
  assert.equal(log.events.at(-1).tick,32);
  assert.equal(reactorReferenceWav(reactor).length,44+8*48000*2);
});
test('event receipts contain no post text or cloud/surveillance identity',()=>{
  const secret='This sentence stays in the local timeline 🤖';
  const log=reactorLog(buildReplyReactor(posts([secret,null])));
  const json=JSON.stringify(log);
  assert.equal(json.includes(secret),false);
  assert.equal(json.includes('surveillance data'),false);
  assert.equal(log.mapping,'declared-reply-score-v1');
  assert.match(log.model,/not quantum mechanics/);
  const changed=structuredClone(log);
  changed.transitions[0].after[0]=99;
  assert.deepEqual(reactorLog(buildReplyReactor(posts([secret,null]))).finalState,[1,0]);
});
test('compiled authority and malformed archives fail closed',()=>{
  assert.throws(()=>reactorLog({events:[]}),TypeError);
  assert.throws(()=>reactorReferenceWav({events:[]}),TypeError);
  assert.throws(()=>buildReplyReactor({posts:[{id:0}]}),TypeError);
  const s=posts(['hi',null]);
  const wrong=structuredClone(s);wrong.posts[0].parentId=999;
  assert.throws(()=>buildReplyReactor(wrong),TypeError);
});
test('published VANILLAJS v1.7.0 modules are byte-identical to pinned upstream Git blobs',async()=>{
  const expected={
    gf3:'b0848ac3dadd4f315cfa0f8719949e04ae6ac397',
    'symbolic-events':'f47aa0b37840dc6d1772858fe85a837f858aa88c',
    audio2d:'698d2cf9238999cbd6dfd50010c7ba3e49bc5e3a'
  };
  for(const [name,sha] of Object.entries(expected)){
    const file=await readFile(new URL('../vendor/vanillajs/'+name+'/index.js',import.meta.url));
    const digest=createHash('sha1').update('blob '+file.length+'\0').update(file).digest('hex');
    assert.equal(digest,sha,name+' source changed');
  }
});
