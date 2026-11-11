// SPDX-License-Identifier: Apache-2.0
// No social-media connection, no external API, no actual AI or surveillance data.
import {STORAGE_KEY,MAX_CHARACTERS,initialState,hydrateState,addPost,
  automaticReply,nextWarning,receipt,HAT_STEPS,EARTH_FACTS,limitComposerText} from './core.mjs';
import {ArchiveStore,StaleArchiveError} from './archive-store.mjs';
import {installReplyReactor} from './reply-reactor-ui.mjs';

const $=id=>document.getElementById(id);
const replyReactor=installReplyReactor();
let store,savedNotice='';
try{
  store=new ArchiveStore(localStorage);
}catch{
  // Never overwrite a corrupt persisted archive with an empty new session.
  store=new ArchiveStore(null);
  savedNotice='Saved archive is invalid or storage unavailable. In-memory mode: previous saved data was NOT overwritten. Export receipts before closing.';
}
let state=store.state,replyTarget=null,grassTouches=0,earthIndex=0;
function mutationError(error){
  if(error instanceof StaleArchiveError){
    state=store.state;
    renderFeed();
    if(replyTarget!==null&&!state.posts.some(p=>p.id===replyTarget))resetReply();
    $('feedStatus').textContent='Another tab changed the timeline. Your action was NOT saved; newest posts loaded. Your unsent draft is preserved. Review and retry.';
  }else{
    $('feedStatus').textContent='NOT SAVED: '+error.message+' (export any existing receipts if storage is unavailable).';
  }
}
function persist(transform,message){
  try{
    state=store.update(transform);
    renderFeed();
    $('feedStatus').textContent=message;
    return true;
  }catch(error){mutationError(error);return false;}
}
if(store.persistent){
  window.addEventListener('storage',event=>{
    if(event.key!==STORAGE_KEY&&event.key!==null)return;
    try{
      state=store.refresh();renderFeed();
      if(replyTarget!==null&&!state.posts.some(p=>p.id===replyTarget))resetReply();
      $('feedStatus').textContent='Timeline updated from another tab; your unsent draft was preserved.';
    }catch{
      $('feedStatus').textContent='Another tab has an invalid archive. This tab will not overwrite it.';
    }
  });
}
function node(tag,cls,text){
  const element=document.createElement(tag);
  if(cls)element.className=cls;
  if(text!==undefined)element.textContent=text;
  return element;
}
function format(n){return String(n).padStart(3,'0');}
function renderFeed(){
  $('postCount').textContent=format(state.posts.length);
  $('replyCount').textContent=format(state.posts.filter(p=>p.parentId!==null).length);
  const timeline=$('timeline');
  timeline.replaceChildren();
  replyReactor.render(state);
  if(state.posts.length===0){
    const empty=node('div','empty');
    empty.append(node('strong','', 'NO ARGUMENTS DETECTED'),
      node('p','', 'The silence is deafening. Start a discussion with your most demanding audience: yourself.'));
    timeline.append(empty);return;
  }
  for(const post of [...state.posts].reverse()){
    const article=node('article','post-card');
    article.setAttribute('aria-label','Self-post '+post.id);
    const head=node('div','post-heading');
    const badge=node('span','avatar','ME');
    badge.setAttribute('aria-hidden','true');
    const identity=node('div');
    identity.append(node('strong','','You, the original poster'),node('small','','@replying_to_myself · 100% independent'));
    head.append(badge,identity,node('span','post-number','#'+format(post.id)));
    article.append(head);
    if(post.parentId!==null)
      article.append(node('span','parent-mark','↩ Replying to your own post #'+format(post.parentId)));
    article.append(node('p','post-content',post.text));
    const actions=node('div','post-actions'),reply=node('button','','↩ REPLY TO YOURSELF');
    reply.type='button';
    reply.addEventListener('click',()=>{
      replyTarget=post.id;
      $('replyTarget').textContent='↩ Replying to yourself, post #'+format(post.id);
      $('replyTarget').hidden=false;
      $('cancelReply').hidden=false;
      $('compose').focus();
      $('compose').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
    });
    actions.append(reply);article.append(actions);timeline.append(article);
  }
}
function resetReply(){
  replyTarget=null;
  $('replyTarget').hidden=true;
  $('replyTarget').textContent='';
  $('cancelReply').hidden=true;
}
function updateCount(){
  const composer=$('compose'),limited=limitComposerText(composer.value);
  if(limited!==composer.value){
    composer.value=limited;
    composer.setSelectionRange(composer.value.length,composer.value.length);
    $('feedStatus').textContent='280 Unicode characters maximum; extra pasted characters were trimmed.';
  }
  $('charCount').textContent=Array.from(composer.value).length+' / '+MAX_CHARACTERS;
}
function submit(text,parent=null){
  if(persist(current=>addPost(current,text,parent),
    'Self-reply archived locally. Outside opinions received: zero.')){
    resetReply();$('compose').value='';updateCount();
  }
}
$('postForm').addEventListener('submit',event=>{
  event.preventDefault();
  submit($('compose').value,replyTarget);
});
$('compose').addEventListener('input',updateCount);
$('cancelReply').addEventListener('click',resetReply);
$('autoReply').addEventListener('click',()=>{
  if(persist(automaticReply,'Your AI opponent (also you) has responded. No LLM was harmed.')){
    resetReply();$('compose').value='';updateCount();
  }
});
$('clearPosts').addEventListener('click',()=>{
  if(!window.confirm('Delete all local self-replies from this browser? This cannot be undone.'))return;
  try{
    state=store.clear();resetReply();$('compose').value='';updateCount();
    renderFeed();
    $('feedStatus').textContent='Echo chamber emptied. You may now disagree with yourself anew.';
  }catch(error){mutationError(error);}
});
function downloadJson(content,name){
  const blob=new Blob([JSON.stringify(content,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;link.download=name;
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$('downloadReceipt').addEventListener('click',()=>{
  downloadJson(receipt(state),'self-reply-receipts.json');
  $('feedStatus').textContent='Receipts downloaded. This did not post anything online.';
});
$('scan').addEventListener('click',()=>{
  let warning=null;
  if(!persist(current=>{
    const output=nextWarning(current);warning=output.warning;return output.state;
  },'Imaginary alert generated. Timeline preserved.'))return;
  $('warningTitle').textContent=warning.title;
  $('warningMessage').textContent=warning.message;
  $('warningAgency').textContent='SOURCE: '+warning.agency.toUpperCase();
  $('warningRemedy').textContent='FAKE COUNTERMEASURE: '+warning.remedy;
});
function renderGrass(){
  const pips=$('grassPips');
  pips.replaceChildren();
  for(let i=0;i<5;i++){
    const pip=node('span',i<grassTouches?'active':'');
    pip.setAttribute('aria-hidden','true');
    pips.append(pip);
  }
  pips.setAttribute('aria-label',grassTouches+' of 5 grass touches completed');
  $('grassStatus').textContent=grassTouches===5?
    'PROTOCOL COMPLETE. Imaginary signals disrupted: 0. Real-world outdoor time: encouraged.':
    grassTouches+' / 5 grass touches. Going outside is the premium feature.';
  $('touchGrass').disabled=grassTouches===5;
}
function touchGrass(){
  grassTouches=Math.min(5,grassTouches+1);renderGrass();
  $('grass').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
}
$('touchGrass').addEventListener('click',touchGrass);
$('grassShortcut').addEventListener('click',touchGrass);
function renderHat(){
  const holder=$('hatSteps');holder.replaceChildren();
  HAT_STEPS.forEach((text,index)=>{
    const label=node('label'),input=node('input'),desc=node('span','','0'+(index+1)+' / '+text);
    input.type='checkbox';input.setAttribute('aria-label','Hat step '+(index+1));
    input.addEventListener('change',()=>{
      const checked=holder.querySelectorAll('input:checked').length;
      $('hatProgress').textContent=checked+' / '+HAT_STEPS.length+' COMPLETED';
    });
    label.append(input,desc);holder.append(label);
  });
}
function renderEarth(){
  const fact=EARTH_FACTS[earthIndex%EARTH_FACTS.length];
  $('factTitle').textContent=fact.title;
  $('factDetail').textContent=fact.detail;
}
$('nextFact').addEventListener('click',()=>{earthIndex++;renderEarth();});
renderHat();renderEarth();renderGrass();renderFeed();updateCount();
if(savedNotice)$('feedStatus').textContent=savedNotice;
