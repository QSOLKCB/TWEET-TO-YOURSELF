// SPDX-License-Identifier: Apache-2.0
// REPLY REACTOR 3000: exact, classical GF(3) self-reply game.
// Source-pinned VANILLAJS v1.7.0 modules. This is NOT quantum physics.
import {hydrateState} from './core.mjs';
import {affineTransform,stateVector,transition} from '../vendor/vanillajs/gf3/index.js';
import {MAPPING_KIND,eventMapping,transitionEvent,referenceSound,MAX_EVENT_TICKS} from '../vendor/vanillajs/symbolic-events/index.js';

export const REACTOR_KIND='qsol.tweet-to-yourself.reply-reactor.v1';
export const REACTOR_TARGET=Object.freeze([2,1]);
const postsToReactor=new WeakSet();

const postTransform=affineTransform('post',
  [[1,0],[0,1]],[1,0]);
const replyTransform=affineTransform('reply',
  [[1,1],[0,1]],[0,1]);
const score=eventMapping({
  kind:MAPPING_KIND,
  frequencies:[196,294,392],
  wave:'triangle',
  gain:2800
});

/**
 * Pure, bounded, reproducible score derived only from the validated archive.
 * A new top-level post shifts x by 1; a self-reply shears x by y and
 * increases y by 1, all over GF(3). These are declared *game* rules.
 * Up to the LAST 32 posts form one local 4 Hz score window. Earlier posts
 * remain in the timeline but do not change the current score window.
 */
export function buildReplyReactor(archive){
  const state=hydrateState(archive);
  const selected=state.posts.slice(-MAX_EVENT_TICKS);
  let cursor=stateVector([0,0]);
  const transitions=[],events=[];
  let successes=0;
  for(let i=0;i<selected.length;i++){
    const post=selected[i];
    const op=post.parentId===null?postTransform:replyTransform;
    const result=transition(op,cursor,i+1);
    const event=transitionEvent(score,result);
    cursor=result.after;
    if(cursor[0]===REACTOR_TARGET[0]&&cursor[1]===REACTOR_TARGET[1])successes++;
    transitions.push(Object.freeze({
      tick:result.tick,
      postId:post.id,
      operation:result.operation,
      before:result.before,
      after:result.after,
      note:event.note
    }));
    events.push(event);
  }
  const output=Object.freeze({
    kind:REACTOR_KIND,
    tickRate:4,
    totalPosts:state.posts.length,
    omittedPosts:state.posts.length-selected.length,
    ticks:selected.length,
    current:cursor,
    target:REACTOR_TARGET,
    targetHits:successes,
    transitions:Object.freeze(transitions),
    events:Object.freeze(events)
  });
  postsToReactor.add(output);
  return output;
}
function genuine(result){
  if(!postsToReactor.has(result))
    throw new TypeError('buildReplyReactor result required');
  return result;
}
/** Detached, inert, post-text-free evidence; no social-media or network ID. */
export function reactorLog(result){
  const r=genuine(result);
  return {
    kind:'qsol.tweet-to-yourself.reactor-log.v1',
    source:'QSOLKCB/VANILLAJS v1.7.0 8774be1cc1f4a4cf234f71622c304944cd0ecba5',
    mapping:'declared-reply-score-v1',
    model:'classical GF(3) finite-state parody, not quantum mechanics',
    tickRate:r.tickRate,
    totalPosts:r.totalPosts,
    omittedPosts:r.omittedPosts,
    target:[...r.target],
    finalState:[...r.current],
    targetHits:r.targetHits,
    transitions:r.transitions.map(t=>({
      tick:t.tick,postId:t.postId,operation:t.operation,
      before:[...t.before],after:[...t.after],note:t.note
    })),
    events:r.events.map(e=>({
      tick:e.tick,operation:e.operation,note:e.note,
      frequency:e.frequency,wave:e.wave,gain:e.gain
    }))
  };
}
/** Source-pinned reference PCM16LE WAV, at most 8 s / 48 kHz mono. */
export function reactorReferenceWav(result){
  const r=genuine(result);
  if(r.ticks===0)throw new RangeError('At least one post is required for a sound score');
  return referenceSound(r.events).wav();
}
