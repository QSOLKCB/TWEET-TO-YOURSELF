// SPDX-License-Identifier: Apache-2.0
// Optional DOM/presentation layer for the source-pinned reply reactor.
// Nothing in this module changes posts, GF(3) transitions or event ordering.
import {buildReplyReactor,reactorLog,reactorReferenceWav} from './reply-reactor.mjs';

const NS='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id);
const cell=(state)=>({x:90+state[0]*145,y:63+state[1]*100});
function createSVG(name,attrs={},caption){
  const n=document.createElementNS(NS,name);
  for(const [key,value] of Object.entries(attrs))n.setAttribute(key,String(value));
  if(caption!==undefined)n.textContent=caption;
  return n;
}
function fileDownload(bytes,name,mime){
  const blob=new Blob([bytes],{type:mime});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
  // Blob lifecycle is local; downloading never makes an HTTP request.
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
function drawGrid(result){
  const svg=$('reactorGrid');svg.replaceChildren();
  svg.append(createSVG('title',{},'Nine-state exact ternary self-reply lattice'));
  for(let x=0;x<3;x++)for(let y=0;y<3;y++){
    if(x<2)svg.append(createSVG('line',{
      x1:cell([x,y]).x,y1:cell([x,y]).y,
      x2:cell([x+1,y]).x,y2:cell([x+1,y]).y,
      stroke:'#284f56','stroke-width':2
    }));
    if(y<2)svg.append(createSVG('line',{
      x1:cell([x,y]).x,y1:cell([x,y]).y,
      x2:cell([x,y+1]).x,y2:cell([x,y+1]).y,
      stroke:'#284f56','stroke-width':2
    }));
  }
  for(const item of result.transitions){
    const a=cell(item.before),b=cell(item.after);
    // Pure graphical overlay: exact events already calculated by the engine.
    svg.append(createSVG('line',{
      x1:a.x,y1:a.y,x2:b.x,y2:b.y,
      stroke:item.operation==='reply'?'#f8ac80':'#8be5d3',
      'stroke-width':2,'stroke-opacity':0.35
    }));
  }
  for(let y=0;y<3;y++)for(let x=0;x<3;x++){
    const p=cell([x,y]),current=x===result.current[0]&&y===result.current[1],
      target=x===result.target[0]&&y===result.target[1];
    const group=createSVG('g');
    group.append(createSVG('circle',{
      cx:p.x,cy:p.y,r:current?21:target?19:14,
      fill:current?'#c7f77b':target?'#284e38':'#17353a',
      stroke:target?'#ffd28f':'#63b8b5','stroke-width':target?3:1
    }));
    group.append(createSVG('text',{
      x:p.x,y:p.y+4.5,'text-anchor':'middle',
      fill:current?'#0b1a17':'#e2f3e9','font-size':12,'font-family':'monospace',
      'font-weight':800
    },x+','+y));
    if(target)group.append(createSVG('text',{
      x:p.x,y:p.y+36,'text-anchor':'middle',fill:'#ffd28f',
      'font-size':11,'font-family':'monospace'
    },'TARGET'));
    svg.append(group);
  }
}
export function installReplyReactor(){
  let result=null,identity='',audio=null,source=null,playGeneration=0;
  const status=$('reactorStatus');
  function stop(){
    playGeneration++;
    if(source){try{source.stop();}catch{/* Already stopped. */}source.disconnect();source=null;}
    $('reactorStop').disabled=true;
  }
  function render(archive){
    // Warnings or non-post settings do not change the mathematical score.
    const signature=archive.posts.map(p=>p.id+':'+(p.parentId??0)).join('|');
    if(signature===identity&&result)return;
    identity=signature;stop();
    result=buildReplyReactor(archive);
    drawGrid(result);
    $('reactorState').textContent=result.current.join(' : ');
    $('reactorTicks').textContent=String(result.ticks).padStart(2,'0')+' / 32';
    $('reactorWins').textContent=String(result.targetHits).padStart(2,'0');
    $('reactorCount').textContent=result.omittedPosts?
      'Most recent 32 posts scored · '+result.omittedPosts+' earlier posts outside this window':
      'All '+result.totalPosts+' posts scored';
    const hit=result.current.every((v,i)=>v===result.target[i]);
    const next=result.transitions.at(-1);
    status.textContent=!result.ticks?
      'Awaiting your first self-tweet. Make a post to move the marker.':
      hit?'ACHIEVEMENT UNLOCKED: YOU HAVE OFFICIALLY WON AN ARGUMENT AGAINST YOURSELF.':
      'Last move: '+next.operation.toUpperCase()+' → state ['+result.current.join(',')+
      ']. Target [2,1]. Continue arguing with yourself.';
    for(const id of ['reactorExport','reactorWav','reactorPlay'])
      $(id).disabled=result.ticks===0;
  }
  $('reactorExport').addEventListener('click',()=>{
    if(!result?.ticks)return;
    fileDownload(JSON.stringify(reactorLog(result),null,2)+'\n',
      'reply-reactor-event-log.json','application/json');
    $('reactorPlaybackStatus').textContent='Exact symbolic log downloaded. No posts or text included.';
  });
  $('reactorWav').addEventListener('click',()=>{
    if(!result?.ticks)return;
    fileDownload(reactorReferenceWav(result),'reply-reactor-reference.wav','audio/wav');
    $('reactorPlaybackStatus').textContent='Reference PCM16LE WAV downloaded, generated locally from the same events.';
  });
  $('reactorStop').addEventListener('click',()=>{
    stop();$('reactorPlaybackStatus').textContent='Audio stopped. The reactor state is unchanged.';
  });
  $('reactorPlay').addEventListener('click',async()=>{
    if(!result?.ticks)return;
    stop();
    const generation=playGeneration;
    const Ctor=globalThis.AudioContext??globalThis.webkitAudioContext;
    if(!Ctor){
      $('reactorPlaybackStatus').textContent='Audio unavailable. Event JSON and WAV export still work.';
      return;
    }
    try{
      audio??=new Ctor();
      await audio.resume(); // Called only from a user-initiated click.
      if(generation!==playGeneration)return;
      const bytes=reactorReferenceWav(result),frames=(bytes.byteLength-44)/2;
      const pcm=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
      const buffer=audio.createBuffer(1,frames,48000),channel=buffer.getChannelData(0);
      for(let i=0;i<frames;i++)channel[i]=pcm.getInt16(44+i*2,true)/32768;
      const voice=audio.createBufferSource();
      voice.buffer=buffer;voice.connect(audio.destination);source=voice;
      voice.onended=()=>{
        if(source===voice){source=null;$('reactorStop').disabled=true;}
      };
      voice.start();$('reactorStop').disabled=false;
      $('reactorPlaybackStatus').textContent='Playing declared musical mapping. Device playback is presentation only.';
    }catch(error){
      stop();$('reactorPlaybackStatus').textContent='Audio playback unavailable: '+error.message;
    }
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('pagehide',stop);
  return Object.freeze({render,stop});
}
