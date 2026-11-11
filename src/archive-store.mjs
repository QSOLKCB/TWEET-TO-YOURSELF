// SPDX-License-Identifier: Apache-2.0
// Offline per-tab archive with optimistic stale-snapshot rejection.
// localStorage is synchronous but has no compare-and-swap: this protects
// ordinary sequential multi-tab edits, not simultaneous racing writers.
import {STORAGE_KEY,initialState,hydrateState} from './core.mjs';

export class StaleArchiveError extends Error {
  constructor(){
    super('Another tab changed the timeline. Your action was not saved.');
    this.name='StaleArchiveError';
  }
}

export class ArchiveStore {
  #storage;
  #key;
  #knownRaw=null;
  #state=initialState();
  constructor(storage=null,key=STORAGE_KEY){
    if(storage!==null&&(typeof storage.getItem!=='function'||
      typeof storage.setItem!=='function'||typeof storage.removeItem!=='function'))
      throw new TypeError('Storage interface required');
    this.#storage=storage;
    this.#key=key;
    this.refresh();
  }
  get state(){return hydrateState(this.#state);}
  get persistent(){return this.#storage!==null;}
  #read(){
    if(this.#storage===null)return {raw:this.#knownRaw,state:this.#state};
    const raw=this.#storage.getItem(this.#key);
    if(raw!==null&&typeof raw!=='string')throw new TypeError('Invalid storage value');
    return {raw,state:raw===null?initialState():hydrateState(JSON.parse(raw))};
  }
  refresh(){
    const current=this.#read(); // A malformed remote value must not replace local state.
    this.#knownRaw=current.raw;
    this.#state=current.state;
    return this.state;
  }
  #requireFresh(){
    const current=this.#read();
    if(current.raw!==this.#knownRaw){
      this.#knownRaw=current.raw;
      this.#state=current.state;
      throw new StaleArchiveError();
    }
  }
  update(transform){
    if(typeof transform!=='function')throw new TypeError('State transformer required');
    this.#requireFresh();
    const next=hydrateState(transform(this.state));
    const raw=JSON.stringify(next);
    if(this.#storage!==null)this.#storage.setItem(this.#key,raw);
    this.#knownRaw=raw;
    this.#state=next;
    return this.state;
  }
  clear(){
    this.#requireFresh(); // Even explicit deletion must not act on a stale tab.
    if(this.#storage!==null)this.#storage.removeItem(this.#key);
    this.#knownRaw=null;
    this.#state=initialState();
    return this.state;
  }
}
