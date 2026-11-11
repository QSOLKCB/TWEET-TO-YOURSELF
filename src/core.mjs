// SPDX-License-Identifier: Apache-2.0
// Fictional, offline-only satire. The "AI" is a deterministic joke generator.
export const MAX_POSTS = 150;
export const MAX_CHARACTERS = 280;
export const STORAGE_KEY = 'qsol.tweet-to-yourself.v1';
export const PARODY_WARNINGS = Object.freeze([
  Object.freeze({
    title: 'FLATULENCE SIGINT DETECTED',
    agency: 'Mossad (fictional alert)',
    message: 'Warning: Mossad is listening to your farts. Go outside, relieve yourself, then touch grass five times to counter their imaginary signals.',
    remedy: 'Grass touches required: 5. Scientific effectiveness: absolutely none.'
  }),
  Object.freeze({
    title: 'UNAUTHORIZED THOUGHT BUFFER',
    agency: 'NSA (fictional alert)',
    message: 'The NSA has allegedly classified your inner monologue as a podcast with no subscribers.',
    remedy: 'Unplug the imaginary microphone. Find a tree. Say hello to it instead.'
  }),
  Object.freeze({
    title: 'TIN FOIL FIRMWARE UPDATE',
    agency: 'CIA (fictional alert)',
    message: 'The CIA has supposedly pushed a firmware update to your tinfoil hat. New feature: 30% more crinkling.',
    remedy: 'Remove the hat. Check the weather. The sky is still there.'
  }),
  Object.freeze({
    title: 'SELF-REPLY FEEDBACK LOOP',
    agency: 'Your own timeline',
    message: 'Your latest reply was reviewed by the author of the original tweet. The reviewer was also you. Conflict of interest detected.',
    remedy: 'Try speaking to another human. Optional but recommended.'
  }),
  Object.freeze({
    title: 'ECHO CHAMBER CALIBRATION',
    agency: 'Bureau of Imaginary Signals',
    message: 'Your replies are bouncing around an empty room at the speed of self-importance.',
    remedy: 'Open a window. Allow one (1) opposing breeze.'
  }),
  Object.freeze({
    title: 'SATELLITE OF THE DAY',
    agency: 'Department of Made-Up Surveillance',
    message: 'A passing satellite has allegedly detected seventeen consecutive self-replies and requested annual leave.',
    remedy: 'Put down the phone and appreciate an actual cloud.'
  }),
  Object.freeze({
    title: 'EARTH SHAPE EMERGENCY',
    agency: 'Geography Department',
    message: 'Critical alert: the horizon refuses to become a straight line on a globe. This is normal.',
    remedy: 'Read the Earth-not-flat guide before posting a diagram made in Paint.'
  }),
  Object.freeze({
    title: 'GRASS HANDSHAKE REQUIRED',
    agency: 'Offline Reality Verification',
    message: 'Reality authentication failed: your finger has only touched glass today.',
    remedy: 'Touch actual grass five times. Do not count browser tabs.'
  })
]);
export const REPLY_TEMPLATES = Object.freeze([
  'I have reviewed my own argument and awarded myself five stars.',
  'Counterpoint: I should probably reply to myself again.',
  'As the original author, I demand that I explain what I meant.',
  'Update: I strongly disagree with the version of me from twelve seconds ago.',
  'Source: a screenshot of myself saying it first.',
  'Breaking: my opponent in this debate is also me.',
  'My fact-checker has confirmed that I am available for comment.',
  'I will now quote-tweet myself for additional visibility.'
]);
export const HAT_STEPS = Object.freeze([
  'Find a clean, ordinary piece of kitchen foil.',
  'Fold it into a ridiculously theatrical little crown.',
  'Add a purely decorative antenna (a paper straw works).',
  'Put it on for the joke. It does not block or scramble surveillance signals.',
  'Take a selfie for your fictional intelligence dossier, then recycle the foil.'
]);
export const EARTH_FACTS = Object.freeze([
  Object.freeze({title:'Two shadows, one curved Earth',
    detail:'Eratosthenes compared shadow angles at different locations. The difference is explained by Earth’s curvature and even lets us estimate its circumference.'}),
  Object.freeze({title:'The lunar-eclipse silhouette',
    detail:'During a lunar eclipse, Earth casts a rounded shadow on the Moon. A spherical Earth explains why that shadow stays circular at different orientations.'}),
  Object.freeze({title:'Ships disappear hull-first',
    detail:'At sea, distant ships tend to disappear below the horizon from the bottom upward. Curvature predicts the effect; height changes how much you can see.'}),
  Object.freeze({title:'Stars change with latitude',
    detail:'As observers travel north or south, the apparent height of celestial poles and visible constellations change in ways predicted by a rotating spherical Earth.'})
]);
/** Shared UI/core Unicode code-point input budget, not UTF-16 maxlength. */
export function limitComposerText(value){
  if(typeof value!=='string')throw new TypeError('Text required');
  return Array.from(value).slice(0,MAX_CHARACTERS).join('');
}
export function initialState(){
  return {schema:1,nextId:1,posts:[],warningIndex:0,replyIndex:0};
}
function integer(n,min,max){
  return Number.isSafeInteger(n)&&n>=min&&n<=max;
}
export function hydrateState(input){
  if(input===null||typeof input!=='object'||Array.isArray(input)||
    input.schema!==1||!Array.isArray(input.posts)||
    input.posts.length>MAX_POSTS||
    !integer(input.nextId,1,1000000)||
    !integer(input.warningIndex,0,1000000)||
    !integer(input.replyIndex,0,1000000))throw new TypeError('Invalid local self-reply archive');
  const ids=new Set(),posts=[];
  let previous=0;
  for(const item of input.posts){
    if(item===null||typeof item!=='object'||Array.isArray(item)||
       !integer(item.id,1,999999)||item.id<=previous||
       ![null,undefined].includes(item.parentId)&&!ids.has(item.parentId)||
       typeof item.text!=='string'||!item.text.trim()||
       Array.from(item.text).length>MAX_CHARACTERS)
      throw new TypeError('Invalid archived post');
    posts.push({id:item.id,parentId:item.parentId??null,text:item.text});
    previous=item.id;ids.add(item.id);
  }
  if(input.nextId<=previous)throw new TypeError('Invalid next post ID');
  return {schema:1,nextId:input.nextId,posts,
    warningIndex:input.warningIndex,replyIndex:input.replyIndex};
}
export function addPost(state,value,parentId=null){
  const s=hydrateState(state);
  if(typeof value!=='string')throw new TypeError('Write a self-reply');
  const text=value.trim();
  if(!text||Array.from(text).length>MAX_CHARACTERS)
    throw new RangeError('Post must contain 1–280 characters');
  if(parentId!==null&&!s.posts.some(post=>post.id===parentId))
    throw new RangeError('Cannot reply to an imaginary previous post');
  if(s.posts.length===MAX_POSTS||s.nextId>=1000000)
    throw new RangeError('Self-reply archive is full. Export or clear it.');
  s.posts.push({id:s.nextId++,parentId,text});
  return s;
}
export function automaticReply(state){
  const s=hydrateState(state);
  const last=s.posts.at(-1)??null;
  const text=last?REPLY_TEMPLATES[s.replyIndex%REPLY_TEMPLATES.length]:
    'I am opening this thread by replying to myself in advance.';
  const next=addPost(s,text,last?.id??null);
  next.replyIndex=s.replyIndex+1;
  return next;
}
export function nextWarning(state){
  const s=hydrateState(state);
  const warning=PARODY_WARNINGS[s.warningIndex%PARODY_WARNINGS.length];
  return {state:{...s,warningIndex:s.warningIndex+1},warning};
}
export function receipt(state){
  const s=hydrateState(state);
  return {kind:'qsol.self-reply-receipt.v1',satire:true,
    disclaimer:'Fictional parody. No posts were published. No surveillance claims are factual.',
    posts:s.posts.map(p=>({...p})),selfReplyCount:s.posts.filter(p=>p.parentId!==null).length};
}
