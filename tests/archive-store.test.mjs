// SPDX-License-Identifier: Apache-2.0
import test from 'node:test';
import assert from 'node:assert/strict';
import {ArchiveStore,StaleArchiveError} from '../src/archive-store.mjs';
import {STORAGE_KEY,MAX_CHARACTERS,initialState,addPost,automaticReply,
  nextWarning,limitComposerText} from '../src/core.mjs';

function shared(){
  const values=new Map();
  return {
    getItem:key=>values.get(key)??null,
    setItem:(key,value)=>values.set(key,value),
    removeItem:key=>values.delete(key),
    externalSet:value=>values.set(STORAGE_KEY,value)
  };
}
test('a stale tab generating a fictional warning cannot erase a newer post',()=>{
  const storage=shared(),a=new ArchiveStore(storage),b=new ArchiveStore(storage);
  a.update(s=>addPost(s,'Posted in tab A'));
  assert.throws(()=>b.update(s=>nextWarning(s).state),StaleArchiveError);
  assert.equal(b.state.posts[0].text,'Posted in tab A');
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).posts.length,1);
  b.update(s=>nextWarning(s).state);
  assert.equal(a.refresh().warningIndex,1);
  assert.equal(a.state.posts.length,1);
});
test('two tabs post sequentially without silently losing either post',()=>{
  const storage=shared(),a=new ArchiveStore(storage),b=new ArchiveStore(storage);
  a.update(s=>addPost(s,'first'));
  assert.throws(()=>b.update(s=>addPost(s,'second')),StaleArchiveError);
  b.update(s=>addPost(s,'second'));
  assert.deepEqual(a.refresh().posts.map(p=>p.text),['first','second']);
  assert.deepEqual(a.state.posts.map(p=>p.id),[1,2]);
});
test('stale tab cannot clear newer posts until a deliberate retry',()=>{
  const storage=shared(),a=new ArchiveStore(storage),b=new ArchiveStore(storage);
  a.update(s=>addPost(s,'important joke'));
  assert.throws(()=>b.clear(),StaleArchiveError);
  assert.equal(JSON.parse(storage.getItem(STORAGE_KEY)).posts.length,1);
  b.clear();
  assert.equal(storage.getItem(STORAGE_KEY),null);
  assert.deepEqual(a.refresh(),initialState());
});
test('external corruption cannot be overwritten by refresh or mutation',()=>{
  const storage=shared(),a=new ArchiveStore(storage);
  a.update(s=>addPost(s,'safe'));
  storage.externalSet('{"broken":');
  assert.throws(()=>a.refresh(),SyntaxError);
  assert.throws(()=>a.update(s=>nextWarning(s).state),SyntaxError);
  assert.equal(storage.getItem(STORAGE_KEY),'{"broken":');
  assert.equal(a.state.posts[0].text,'safe');
});
test('storage write failure does not mutate the local state',()=>{
  const storage=shared();storage.setItem=()=>{throw Error('quota full');};
  const a=new ArchiveStore(storage);
  assert.throws(()=>a.update(s=>addPost(s,'not saved')),/quota full/);
  assert.equal(a.state.posts.length,0);
});
test('in-memory storage fallback supports repeat edits and clear',()=>{
  const a=new ArchiveStore(null);
  a.update(s=>addPost(s,'offline'));a.update(automaticReply);
  assert.equal(a.persistent,false);
  assert.equal(a.state.posts.length,2);
  assert.equal(a.state.posts[1].parentId,1);
  assert.deepEqual(a.clear(),initialState());
});
test('composer and core consistently allow 280 Unicode code points',()=>{
  const emoji='🛸'.repeat(MAX_CHARACTERS);
  assert.equal(Array.from(emoji).length,MAX_CHARACTERS);
  assert.equal(limitComposerText(emoji),emoji);
  assert.equal(addPost(initialState(),emoji).posts[0].text,emoji);
  assert.equal(limitComposerText(emoji+'🛸'),emoji);
  assert.throws(()=>addPost(initialState(),emoji+'🛸'),RangeError);
  assert.equal(limitComposerText('A'.repeat(MAX_CHARACTERS-1)+'🛸'),
    'A'.repeat(MAX_CHARACTERS-1)+'🛸');
  assert.throws(()=>limitComposerText(null),TypeError);
});
