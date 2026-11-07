import { Component, Suspense, lazy, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Compass, RotateCcw, Home, BookOpen, Pause, ChevronRight, UserRound } from 'lucide-react';
import type { Content, Activity } from '../shared/content';
import type { Save } from '../game/save';
import type { AudioSettings } from '../game/audio';
import { useWorldAssets } from '../game/assets';
import { Emblem } from './UI';
import type { ControlInput } from '../game/World';
const World=lazy(()=>import('../game/World').then(m=>({default:m.World})));

class CanvasBoundary extends Component<{children:ReactNode;onRetry:()=>void;onHome:()=>void},{error:boolean}> {
  state={error:false};static getDerivedStateFromError(){return{error:true};}
  componentDidCatch(_error:Error,_info:ErrorInfo) { /* Accessible recovery UI replaces a broken canvas. */ }
  render(){return this.state.error?<div className="world-loading"><Compass size={38}/><h2>Grafik 3D tidak dapat dimulakan</h2><p>Cuba semula dengan kualiti grafik rendah. Pastikan WebGL tersedia pada pelayar ini.</p><button className="primary-button" onClick={this.props.onRetry}>Cuba lagi</button><button className="text-button" onClick={this.props.onHome}>Kembali ke menu</button></div>:this.props.children;}
}
export function GameView({content,save,settings,blocked,onNearChange,onInteract,onMove,onPause,onJournal,onHome}:{content:Content;save:Save;settings:AudioSettings;blocked:boolean;onNearChange:(id:string|null)=>void;onInteract:(id:string)=>void;onMove:(p:[number,number],yaw:number)=>void;onPause:()=>void;onJournal:()=>void;onHome:()=>void}) {
  const [retry,setRetry]=useState(0),[near,setNear]=useState<string|null>(null),[mobile,setMobile]=useState(false);
  const [ready,setReady]=useState(false);
  const input=useRef<ControlInput>({x:0,z:0,lookX:0,lookY:0});
  const state=useWorldAssets(retry),mission=content.missions[save.mission-1];
  const nearest=mission.activities.find(a=>a.id===near);
  const completed=mission.activities.filter(a=>save.solved.includes(a.id)).length;
  const first=mission.activities.find(a=>!save.solved.includes(a.id));
  useEffect(()=>{const q=window.matchMedia('(pointer:coarse)');setMobile(q.matches||window.innerWidth<800);},[]);
  useEffect(()=>{if(blocked){input.current={x:0,z:0,lookX:0,lookY:0};setReady(false);}},[blocked]);
  const interact=()=>{if(near&&!blocked)onInteract(near);};
  const bind=(key:'x'|'z',value:number)=>({onPointerDown:(e:React.PointerEvent<HTMLButtonElement>)=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);input.current[key]=value;},onPointerUp:()=>{input.current[key]=0;},onPointerCancel:()=>{input.current[key]=0;},onLostPointerCapture:()=>{input.current[key]=0;}});
  return <main className={`game-screen ${settings.reducedMotion?'reduced':''}`} aria-label="Dunia pengembaraan 3D" data-ready={ready}>
    <div className="world-canvas" aria-label="Gunakan W A S D untuk bergerak, tetikus untuk melihat, dan E untuk berinteraksi.">
      {state.error?<div className="world-loading" role="alert"><Compass size={40}/><span className="eyebrow">SAMBUNGAN TERGANGGU</span><h2>Perjalanan belum dapat dimulakan</h2><p>{state.error}</p><button className="primary-button" onClick={()=>setRetry(v=>v+1)}><RotateCcw size={18}/>Cuba lagi</button><button className="text-button" onClick={onHome}><Home size={17}/>Kembali ke menu</button></div>
      :state.assets?<CanvasBoundary key={retry} onRetry={()=>{setReady(false);setRetry(v=>v+1);}} onHome={onHome}><Suspense fallback={<Loading progress={100} bytes={state.bytes}/>}><World assets={state.assets} mission={mission} solved={save.solved} active={!blocked} settings={settings} input={input} position={save.position} yaw={save.yaw} onNear={id=>{setNear(id);onNearChange(id);}} onMove={onMove} onInteract={interact} onReady={()=>setReady(true)}/></Suspense></CanvasBoundary>
      :<Loading progress={state.progress} bytes={state.bytes}/>}
    </div>
    <div className="game-vignette"/>
    <header className="game-header"><button className="game-brand" onClick={onPause} aria-label="Jeda permainan"><Emblem small/><span>MISI<br/>RUKUN NEGARA</span></button><div className="era-pill"><span className="status-dot"/>{mission.era}</div><div className="hud-buttons"><button aria-label="Buku pengembaraan" className="hud-icon" onClick={onJournal}><BookOpen size={21}/></button><button aria-label="Jeda" className="hud-icon" onClick={onPause}><Pause size={21}/></button></div></header>
    <div className="mission-panel"><span className="eyebrow">MISI {String(save.mission).padStart(2,'0')}</span><h1>{mission.title}</h1><div className="clue-progress">{mission.activities.map(a=><span key={a.id} className={save.solved.includes(a.id)?'done':''}/>)}<small>{completed} / {mission.activities.length} penemuan</small></div><div className="player-identity"><UserRound size={13}/>{save.name}<span>Pengembara {save.gender.toLowerCase()}</span></div></div>
    {!blocked&&state.assets&&ready&&<><div className="crosshair"/>
      {nearest&&<button className="interact-prompt" onClick={interact}><span className="key-cap">{mobile?<ChevronRight size={20}/>:'E'}</span><span><small>{save.solved.includes(nearest.id)?'LIHAT SEMULA':'PERIKSA OBJEK'}</small>{nearest.label}</span><ChevronRight size={19}/></button>}
      <div className="explore-hint"><span className="small-compass"><Compass size={27} strokeWidth={1}/></span><span><small>JEJAK SETERUSNYA</small>{first?first.label:'Semua penemuan direkodkan'}</span></div>
      <div className="world-controls">{mobile?'Leret skrin untuk melihat sekeliling':<><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Bergerak</span><span>Tetikus · Lihat sekeliling</span><span><kbd>E</kbd> Interaksi</span></>}</div>
      {mobile&&<div className="touch-controls" aria-label="Kawalan pergerakan"><button aria-label="Bergerak ke hadapan" {...bind('z',1)}><ArrowUp/></button><div><button aria-label="Bergerak ke kiri" {...bind('x',-1)}><ArrowLeft/></button><button aria-label="Bergerak ke belakang" {...bind('z',-1)}><ArrowDown/></button><button aria-label="Bergerak ke kanan" {...bind('x',1)}><ArrowRight/></button></div></div>}
    </>}
  </main>;
}
function Loading({progress,bytes}:{progress:number|null;bytes:number}) {
  return <div className="world-loading" role="status"><Emblem/><span className="eyebrow">MENYUSURI MASA</span><h2>Membuka lembaran sejarah</h2><p>Memuatkan model, tekstur dan persekitaran 3D.</p><div className={`loading-bar ${progress===null?'indeterminate':''}`} role="progressbar" aria-label="Kemajuan pemuatan" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress??undefined}><span style={{width:progress===null?'30%':`${progress}%`}}/></div><small>{progress===null?`${(bytes/1024/1024).toFixed(1)} MB diterima`:`${Math.round(progress)}%`}</small></div>;
}
