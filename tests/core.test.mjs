// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,hydrateState,addPost,automaticReply,nextWarning,receipt,
  PARODY_WARNINGS,REPLY_TEMPLATES,MAX_POSTS,MAX_CHARACTERS,HAT_STEPS,EARTH_FACTS} from '../src/core.mjs';

test('self-replies are local, ordered and attributed only to self',()=>{
 const empty=initialState();
 const first=addPost(empty,'Nobody understands my tweet.');
 const second=addPost(first,'I disagree with myself.',1);
 assert.equal(empty.posts.length,0);
 assert.deepEqual(second.posts.map(p=>[p.id,p.parentId]),[[1,null],[2,1]]);
 assert.equal(receipt(second).selfReplyCount,1);
 assert.match(receipt(second).disclaimer,/Fictional parody/);
});
test('auto-replies are deterministic, bounded and genuinely self-replies',()=>{
 let a=initialState(),b=initialState();
 for(let i=0;i<REPLY_TEMPLATES.length+3;i++){a=automaticReply(a);b=automaticReply(b);}
 assert.deepEqual(a,b);
 assert.equal(a.posts[0].parentId,null);
 assert.ok(a.posts.slice(1).every((p,i)=>p.parentId===a.posts[i].id));
});
test('warnings are reproducible fiction, not AI/network or assertions',()=>{
 let a=initialState(),b=initialState();
 for(let i=0;i<PARODY_WARNINGS.length+3;i++){
  const x=nextWarning(a),y=nextWarning(b);
  assert.deepEqual(x.warning,y.warning);a=x.state;b=y.state;
 }
 assert.ok(PARODY_WARNINGS.every(w=>/fictional|imaginary|made-up|timeline|geography|reality/i.test(w.agency)));
 assert.ok(HAT_STEPS.some(s=>s.includes('does not block')));
 assert.ok(EARTH_FACTS.length>=3);
});
test('invalid, oversized and forged posts are rejected before mutation',()=>{
 const s=addPost(initialState(),'hello');
 for(const v of ['', '   ', 'x'.repeat(MAX_CHARACTERS+1), undefined,1]){
  assert.throws(()=>addPost(s,v),/Write|characters/);
 }
 assert.throws(()=>addPost(s,'oops',999),RangeError);
 assert.equal(s.posts.length,1);
 assert.throws(()=>hydrateState({...s,nextId:1}),TypeError);
 assert.throws(()=>hydrateState({...s,posts:[{id:1,parentId:100,text:'hi'}]}),TypeError);
});
test('archive caps and corrupted persistence do not lead to unbounded work',()=>{
 let s=initialState();
 for(let i=0;i<MAX_POSTS;i++)s=addPost(s,'Self-tweet '+i);
 assert.throws(()=>addPost(s,'One more'),RangeError);
 const exported=JSON.stringify(s);
 assert.deepEqual(hydrateState(JSON.parse(exported)),s);
 assert.throws(()=>hydrateState({...s,warningIndex:Infinity}),TypeError);
 assert.throws(()=>hydrateState({...s,posts:[...s.posts,...s.posts]}),TypeError);
});
test('user HTML is stored as literal data, never interpreted as markup',()=>{
 const dangerous='<img src=x onerror=alert(1)>';
 const s=addPost(initialState(),dangerous);
 assert.equal(s.posts[0].text,dangerous);
 assert.equal(receipt(s).posts[0].text,dangerous);
});
