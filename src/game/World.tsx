import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { Mission, Activity } from '../shared/content';
import type { WorldAssets } from './assets';
import type { AudioSettings } from './audio';
import { audioEngine } from './audio';

export type ControlInput={x:number;z:number;lookX:number;lookY:number};
type WorldProps={assets:WorldAssets;mission:Mission;solved:string[];active:boolean;settings:AudioSettings;input:MutableRefObject<ControlInput>;position:[number,number];yaw:number;onNear:(id:string|null)=>void;onMove:(p:[number,number],yaw:number)=>void;onInteract:()=>void;onReady:()=>void};

function Shop({assets,x,z,index}:{assets:WorldAssets;x:number;z:number;index:number}) {
  const model=useMemo(()=>{
    const o=assets.model.scene.clone(true);
    o.traverse(n=>{if(n instanceof THREE.Mesh){n.castShadow=true;n.receiveShadow=true;const clone=(m:THREE.Material)=>{const c=m.clone();if(c.name.includes('plaster'))(c as THREE.MeshStandardMaterial).color.set(['#d9b987','#92b8a6','#dbb49a','#aebfc1'][index%4]);return c;};n.material=Array.isArray(n.material)?n.material.map(clone):clone(n.material);}});
    return o;
  },[assets,index]);
  useEffect(()=>()=>model.traverse(n=>{if(n instanceof THREE.Mesh)(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>m.dispose());}),[model]);
  return <group position={[x,0,z]} rotation={[0,x<0?Math.PI/2:-Math.PI/2,0]}>
    <primitive object={model}/>
    <mesh position={[0,3.17,3.25]}><boxGeometry args={[4.8,.6,.08]}/><meshStandardMaterial color={index%2?'#183e36':'#513c2b'}/></mesh>
    <Sign text={['KEDAI RUNCIT','KEDAI KOPI','PASAR SENTOSA','KEDAI BUKU'][index%4]} position={[0,3.18,3.31]} size={.24}/>
    <Awning color={index%2?'#b26748':'#6b8980'}/>
  </group>;
}

// Canvas text is embedded locally: no font CDN or runtime network dependency.
function Sign({text,position,size=.22}:{text:string;position:[number,number,number];size?:number}) {
  const texture=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const c=canvas.getContext('2d')!;
    c.clearRect(0,0,1024,128);c.fillStyle='#e8d8af';c.textAlign='center';c.textBaseline='middle';c.font='600 53px Georgia';c.fillText(text,512,68);
    const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;return t;
  },[text]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <mesh position={position}><planeGeometry args={[size*16,size*2]}/><meshBasicMaterial map={texture} transparent depthWrite={false}/></mesh>;
}
function Awning({color}:{color:string}) {
  return <group position={[0,2.92,3.27]} rotation={[-.18,0,0]}>{Array.from({length:12},(_,i)=><mesh key={i} position={[-2.2+i*.4,0,.5]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.4,1.8]}/><meshStandardMaterial color={i%2?'#d6cbb2':color} side={THREE.DoubleSide}/></mesh>)}</group>;
}

function Palm({position,scale=1}:{position:[number,number,number];scale?:number}) {
  const leaves=useMemo(()=>Array.from({length:9},(_,i)=>{
    const angle=i*Math.PI*2/9;const verts:number[]=[];const faces:number[]=[];
    for(let j=0;j<8;j++){
      const t=j/7,rad=t*3;const width=Math.sin(t*Math.PI)*.43;const center=new THREE.Vector3(Math.cos(angle)*rad,5.7+Math.sin(t*Math.PI)*.9-t*t*1.2,Math.sin(angle)*rad);
      for(const side of [-1,1])verts.push(center.x+Math.sin(angle)*width*side,center.y,center.z-Math.cos(angle)*width*side);
      if(j<7){const k=j*2;faces.push(k,k+1,k+2,k+1,k+3,k+2);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(faces);g.computeVertexNormals();return g;
  }),[]);
  return <group position={position} scale={scale}>
    <mesh castShadow position={[.12,2.8,0]} rotation={[0,0,-.04]}><cylinderGeometry args={[.12,.25,5.6,9]}/><meshStandardMaterial color="#776347" roughness={1}/></mesh>
    {leaves.map((g,i)=><mesh key={i} geometry={g} castShadow><meshStandardMaterial color={i%2?'#4d6535':'#607745'} side={THREE.DoubleSide} roughness={.9}/></mesh>)}
    <mesh position={[.23,5.65,0]}><sphereGeometry args={[.3,8,6]}/><meshStandardMaterial color="#57613c"/></mesh>
  </group>;
}

function Lamp({x,z}:{x:number;z:number}) {
  return <group position={[x,0,z]}><mesh castShadow position={[0,1.8,0]}><cylinderGeometry args={[.045,.075,3.6,8]}/><meshStandardMaterial color="#293b34"/></mesh>
    <mesh position={[0,.14,0]}><cylinderGeometry args={[.16,.21,.28,8]}/><meshStandardMaterial color="#293b34"/></mesh>
    <mesh position={[0,3.63,0]}><cylinderGeometry args={[.21,.14,.43,6]}/><meshStandardMaterial color="#f1d49e" emissive="#c99b48" emissiveIntensity={.3}/></mesh>
    <mesh position={[0,3.93,0]}><coneGeometry args={[.32,.22,6]}/><meshStandardMaterial color="#293b34"/></mesh>
  </group>;
}

function Bicycle({position,rotation=0}:{position:[number,number,number];rotation?:number}) {
  const lines=useMemo(()=>{
    const pairs=[[-.6,.42,0,0,.5,0],[0,.5,0,-.2,.95,0],[-.2,.95,0,-.6,.42,0],[-.2,.95,0,.5,.95,0],[.5,.95,0,0,.5,0],[.5,.95,0,.68,.42,0],[.5,.95,0,.45,1.2,0]];
    return pairs.map(p=>{const a=new THREE.Vector3(...p.slice(0,3) as [number,number,number]),b=new THREE.Vector3(...p.slice(3) as [number,number,number]);return{mid:a.clone().add(b).multiplyScalar(.5),len:a.distanceTo(b),q:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),b.sub(a).normalize())};});
  },[]);
  return <group position={position} rotation={[0,rotation,.05]}>{[-.6,.68].map(x=><group key={x} position={[x,.42,0]}><mesh><torusGeometry args={[.38,.035,7,28]}/><meshStandardMaterial color="#32332e"/></mesh><mesh><torusGeometry args={[.345,.012,5,28]}/><meshStandardMaterial color="#a6aaa1" metalness={.6} roughness={.4}/></mesh>{Array.from({length:8},(_,i)=><mesh key={i} rotation={[0,0,i*Math.PI/8]}><boxGeometry args={[.006,.68,.006]}/><meshStandardMaterial color="#aaa99a"/></mesh>)}</group>)}
    {lines.map((l,i)=><mesh key={i} position={l.mid} quaternion={l.q}><cylinderGeometry args={[.018,.018,l.len,6]}/><meshStandardMaterial color="#25483e" metalness={.3}/></mesh>)}
    <mesh position={[-.2,1.02,0]}><boxGeometry args={[.27,.06,.14]}/><meshStandardMaterial color="#47372b"/></mesh>
  </group>;
}

function MarketStall({position,color='#ac6946'}:{position:[number,number,number];color?:string}) {
  return <group position={position}>
    {[-.9,.9].flatMap(x=>[-.5,.5].map(z=><mesh key={`${x},${z}`} position={[x,1.1,z]} castShadow><cylinderGeometry args={[.035,.04,2.2,6]}/><meshStandardMaterial color="#6a5333"/></mesh>))}
    {Array.from({length:10},(_,i)=><mesh key={i} position={[-.9+i*.2,2.2,0]} rotation={[.13,0,0]}><boxGeometry args={[.2,.025,1.6]}/><meshStandardMaterial color={i%2?'#e2d3b2':color}/></mesh>)}
    <mesh position={[0,.8,0]} castShadow><boxGeometry args={[1.9,.12,1.1]}/><meshStandardMaterial color="#8b6846"/></mesh>
    {[-.6,0,.6].map((x,i)=><group key={x} position={[x,.98,0]}><mesh><cylinderGeometry args={[.24,.18,.25,10]}/><meshStandardMaterial color="#ac8954"/></mesh>{Array.from({length:7},(_,j)=><mesh key={j} position={[Math.sin(j*2.4)*.13,.15+(j%2)*.06,Math.cos(j*2.4)*.13]}><sphereGeometry args={[.075,8,6]}/><meshStandardMaterial color={i===0?'#a79c4b':i===1?'#c07d3b':'#648051'}/></mesh>)}</group>)}
  </group>;
}
function Bench({x,z,rotation=0}:{x:number;z:number;rotation?:number}) {
  return <group position={[x,0,z]} rotation={[0,rotation,0]}>{[-.56,.56].map(xx=><mesh key={xx} position={[xx,.3,0]} castShadow><boxGeometry args={[.09,.6,.46]}/><meshStandardMaterial color="#334837"/></mesh>)}{[0,.16,.32].map(zz=><mesh key={zz} position={[0,.62,zz-.16]} castShadow><boxGeometry args={[1.5,.06,.13]}/><meshStandardMaterial color="#9b7650"/></mesh>)}{[.9,1.12].map(y=><mesh key={y} position={[0,y,-.25]} castShadow><boxGeometry args={[1.5,.14,.05]}/><meshStandardMaterial color="#9b7650"/></mesh>)}</group>;
}
function SceneDetails({mission}:{mission:number}) {
  if(mission===1)return <><MarketStall position={[-5.7,0,10]}/><MarketStall position={[5.8,0,-22]} color="#527c67"/><Bicycle position={[-5.1,0,-9]} rotation={.3}/><Bicycle position={[5.2,0,4]} rotation={-.2}/></>;
  if(mission===2)return <>
    <group position={[0,.035,-10]} rotation={[-Math.PI/2,0,0]}><mesh><ringGeometry args={[2,2.04,64]}/><meshStandardMaterial color="#c2a46e"/></mesh>{Array.from({length:5},(_,i)=><mesh key={i} rotation={[0,0,i*Math.PI*2/5]}><ringGeometry args={[1.1,1.14,4]}/><meshStandardMaterial color="#b6a17b"/></mesh>)}</group>
    {[-1,1].flatMap(side=>[-5,-19].map(z=><group key={`${side}${z}`} position={[side*5.25,0,z]} rotation={[0,side<0?Math.PI/2:-Math.PI/2,0]}><mesh position={[0,1.5,0]} castShadow><boxGeometry args={[1.7,3,.16]}/><meshStandardMaterial color="#e5d6b3"/></mesh><mesh position={[0,1.5,.1]}><boxGeometry args={[1.45,2.6,.03]}/><meshStandardMaterial color="#31594c"/></mesh><mesh position={[0,1.9,.13]} rotation={[0,0,Math.PI/4]}><ringGeometry args={[.32,.35,4]}/><meshStandardMaterial color="#cdae65"/></mesh><Sign text="RUKUN NEGARA" position={[0,1.25,.14]} size={.075}/></group>))}
  </>;
  return <>
    {[-1,1].flatMap(side=>[-3,-16].map(z=><group key={`${side}${z}`}><Bench x={side*5.75} z={z} rotation={side<0?Math.PI/2:-Math.PI/2}/><Palm position={[side*6.25,0,z-3]} scale={.8}/><mesh position={[side*5.7,.25,z-3]} castShadow><cylinderGeometry args={[.65,.55,.5,12]}/><meshStandardMaterial color="#baad86"/></mesh></group>))}
    <group position={[0,0,-35]}><mesh position={[0,1.4,0]} castShadow><boxGeometry args={[5.7,2.8,.22]}/><meshStandardMaterial color="#e2d8b7"/></mesh><mesh position={[0,2.75,.1]}><boxGeometry args={[5.8,.34,.25]}/><meshStandardMaterial color="#326252"/></mesh><Sign text="TAMAN PERPADUAN" position={[0,1.8,.14]} size={.22}/></group>
  </>;
}

function Prop({activity,solved,near,mission,reducedMotion}:{activity:Activity;solved:boolean;near:boolean;mission:number;reducedMotion:boolean}) {
  const float=useRef<THREE.Group>(null);const marker=useRef<THREE.Mesh>(null);const base=activity.position;
  useFrame(({clock})=>{if(reducedMotion)return;if(float.current)float.current.position.y=2.6+Math.sin(clock.elapsedTime*1.7+base[1])*.09;if(marker.current)marker.current.rotation.z=clock.elapsedTime*.2;});
  const color=solved?'#a6d5b2':near?'#fbe2a5':'#d7b16b';
  const book=activity.object==='book';const notice=['map','notice'].includes(activity.object);
  return <group position={[base[0],0,base[1]]}>
    <mesh castShadow position={[0,.43,0]}><cylinderGeometry args={[.62,.72,.86,8]}/><meshStandardMaterial color={mission===2?'#a9a185':'#776b4b'} roughness={.95}/></mesh>
    {activity.object==='radio'?<group position={[0,1.15,0]}><mesh castShadow><boxGeometry args={[.85,.65,.34]}/><meshStandardMaterial color="#6e4026"/></mesh><mesh position={[-.12,0,.18]}><planeGeometry args={[.45,.45]}/><meshStandardMaterial color="#c4ad7f"/></mesh>{[-.18,.12].map(y=><mesh key={y} position={[.28,y,.21]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.055,.055,.07,12]}/><meshStandardMaterial color="#b39653"/></mesh>)}</group>
    :book?<group position={[0,.97,0]} rotation={[.15,.2,0]}><mesh castShadow><boxGeometry args={[.82,.17,.6]}/><meshStandardMaterial color="#183f36"/></mesh><mesh position={[0,.06,.01]}><boxGeometry args={[.76,.09,.54]}/><meshStandardMaterial color="#e4d8ad"/></mesh></group>
    :notice?<group position={[0,1.44,0]}><mesh castShadow><boxGeometry args={[1,.94,.12]}/><meshStandardMaterial color="#6a4e2d"/></mesh><mesh position={[0,0,.07]}><planeGeometry args={[.86,.8]}/><meshStandardMaterial color="#d9caa2"/></mesh>{[-.2,0,.2].map(y=><mesh key={y} position={[0,y,.08]}><planeGeometry args={[.62,.02]}/><meshBasicMaterial color="#65785b"/></mesh>)}</group>
    :activity.object==='lantern'?<group position={[0,1.16,0]}><mesh><cylinderGeometry args={[.17,.23,.55,10]}/><meshStandardMaterial color="#d9bc77" emissive="#c49039" emissiveIntensity={.4}/></mesh><mesh position={[0,.32,0]}><coneGeometry args={[.28,.2,10]}/><meshStandardMaterial color="#385448"/></mesh></group>
    :activity.object==='garden'?<group><mesh position={[0,1,0]}><cylinderGeometry args={[.4,.25,.3,12]}/><meshStandardMaterial color="#a8603a"/></mesh>{[-.28,0,.28].map(x=><group key={x} position={[x,1.4,0]}><mesh><cylinderGeometry args={[.015,.02,.7,5]}/><meshStandardMaterial color="#4e6c3d"/></mesh><mesh position={[0,.37,0]}><sphereGeometry args={[.13,8,6]}/><meshStandardMaterial color={solved?'#e3b86b':'#a9b58a'}/></mesh></group>)}</group>
    :activity.object==='flag'?<group><mesh position={[0,1.8,0]}><cylinderGeometry args={[.025,.025,2.2,8]}/><meshStandardMaterial color="#a99f7d"/></mesh><mesh position={[.31,2.47,0]}><boxGeometry args={[.6,.4,.03]}/><meshStandardMaterial color="#315c50"/></mesh><mesh position={[.3,2.47,.025]} rotation={[0,0,Math.PI/4]}><planeGeometry args={[.12,.12]}/><meshBasicMaterial color="#dfc284"/></mesh></group>
    :<group position={[0,1.1,0]}><mesh castShadow><boxGeometry args={[.7,.48,.55]}/><meshStandardMaterial color="#8a6643"/></mesh>{[-.2,.2].map(x=><mesh key={x} position={[x,0,.29]}><boxGeometry args={[.05,.46,.02]}/><meshStandardMaterial color="#b99c67"/></mesh>)}</group>}
    <group ref={float} position={[0,2.6,0]}><Billboard><mesh ref={marker} rotation={[0,0,Math.PI/4]}><ringGeometry args={[.18,.22,4]}/><meshBasicMaterial color={color} side={THREE.DoubleSide}/></mesh><mesh><circleGeometry args={[.07,16]}/><meshBasicMaterial color={color}/></mesh></Billboard></group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,.025,0]}><ringGeometry args={[.83,.88,32]}/><meshBasicMaterial color={color} transparent opacity={near?.8:.35}/></mesh>
  </group>;
}

function Player({mission,active,input,settings,position,yaw,onNear,onMove,onInteract,onReady}:Omit<WorldProps,'assets'|'solved'>) {
  const {camera,gl}=useThree();const state=useRef({x:position[0],z:position[1],yaw,pitch:0,step:0,lastUpdate:0,near:null as string|null});
  const keys=useRef(new Set<string>());const drag=useRef<{x:number;y:number}|null>(null);
  const callbacks=useRef({onNear,onMove,onInteract,onReady});callbacks.current={onNear,onMove,onInteract,onReady};
  useEffect(()=>{state.current={x:position[0],z:position[1],yaw,pitch:0,step:0,lastUpdate:0,near:null};},[mission.id]); // Position snapshots do not teleport the player every save.
  useEffect(()=>{
    const canvas=gl.domElement;
    const down=(e:KeyboardEvent)=>{if(!active||e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.current.add(e.code);if(e.code==='KeyE'&&!e.repeat)callbacks.current.onInteract();};
    const up=(e:KeyboardEvent)=>keys.current.delete(e.code);
    const move=(e:MouseEvent)=>{if(!active)return;if(document.pointerLockElement===canvas){state.current.yaw-=e.movementX*.002;state.current.pitch=THREE.MathUtils.clamp(state.current.pitch-e.movementY*.002,-1.1,1.1);}};
    const pointerDown=(e:PointerEvent)=>{if(!active)return;drag.current={x:e.clientX,y:e.clientY};if(e.pointerType==='mouse'&&!document.pointerLockElement)void canvas.requestPointerLock?.()?.catch(()=>{});canvas.setPointerCapture?.(e.pointerId);};
    const pointerMove=(e:PointerEvent)=>{if(!active||!drag.current||document.pointerLockElement)return;state.current.yaw-=(e.clientX-drag.current.x)*.004;state.current.pitch=THREE.MathUtils.clamp(state.current.pitch-(e.clientY-drag.current.y)*.003,-1.1,1.1);drag.current={x:e.clientX,y:e.clientY};};
    const pointerUp=()=>{drag.current=null;};
    const clear=()=>{keys.current.clear();drag.current=null;};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('mousemove',move);window.addEventListener('blur',clear);
    canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);
    if(active)callbacks.current.onReady();
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('mousemove',move);window.removeEventListener('blur',clear);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);};
  },[active,gl]);
  useEffect(()=>{if(!active){keys.current.clear();drag.current=null;if(document.pointerLockElement)document.exitPointerLock();}},[active]);
  useFrame((_,rawDt)=>{
    const s=state.current,dt=Math.min(rawDt,.05);const k=keys.current;
    if(active){
      if(k.has('ArrowLeft'))s.yaw+=dt*1.6;if(k.has('ArrowRight'))s.yaw-=dt*1.6;
      s.yaw-=input.current.lookX*dt;s.pitch=THREE.MathUtils.clamp(s.pitch-input.current.lookY*dt,-1.1,1.1);
      let x=(k.has('KeyD')?1:0)-(k.has('KeyA')?1:0)+input.current.x;
      let z=(k.has('KeyW')||k.has('ArrowUp')?1:0)-(k.has('KeyS')||k.has('ArrowDown')?1:0)+input.current.z;
      const len=Math.hypot(x,z);if(len>1){x/=len;z/=len;}
      if(len>.05){
        const nx=THREE.MathUtils.clamp(s.x+(Math.cos(s.yaw)*x-Math.sin(s.yaw)*z)*dt*3.4,-4.85,4.85);
        const nz=THREE.MathUtils.clamp(s.z+(-Math.sin(s.yaw)*x-Math.cos(s.yaw)*z)*dt*3.4,-29.8,9);
        const blocked=(xx:number,zz:number)=>mission.activities.some(a=>Math.hypot(xx-a.position[0],zz-a.position[1])<1.08);
        if(!blocked(nx,s.z))s.x=nx;if(!blocked(s.x,nz))s.z=nz;
        s.step+=dt;if(s.step>.45){audioEngine.effect('step');s.step=0;}
      }
      const nearest=mission.activities.map(a=>({id:a.id,d:Math.hypot(a.position[0]-s.x,a.position[1]-s.z)})).sort((a,b)=>a.d-b.d)[0];
      const id=nearest&&nearest.d<3.25?nearest.id:null;
      if(id!==s.near){s.near=id;callbacks.current.onNear(id);}
      s.lastUpdate+=dt;if(s.lastUpdate>1){s.lastUpdate=0;callbacks.current.onMove([s.x,s.z],s.yaw);}
    }
    camera.position.set(s.x,1.68,s.z);camera.rotation.set(s.pitch,s.yaw,0,'YXZ');
  });
  return null;
}

export function World(props:WorldProps) {
  const {assets,mission,settings,solved}=props;const near=useRef<string|null>(null);
  const road=useMemo(()=>{const t=assets.textures.road.clone();t.repeat.set(3,14);return t;},[assets]);
  const pavement=useMemo(()=>{const t=assets.textures.stone.clone();t.repeat.set(2,14);return t;},[assets]);
  return <Canvas shadows={settings.quality==='high'} dpr={settings.quality==='low'?1:[1,1.5]} camera={{fov:68,near:.1,far:150,position:[0,1.68,8]}} gl={{antialias:settings.quality==='high',powerPreference:'high-performance',toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1.1}} onCreated={({gl})=>{gl.setClearColor('#c9ccb5');}}>
    <fog attach="fog" args={[mission.id===1?'#d8c9a4':'#c9d4c3',25,85]}/>
    <Sky distance={4500} sunPosition={[60,25,-35]} inclination={.5} turbidity={4} rayleigh={1.5}/>
    <hemisphereLight args={['#dfe7da','#716a42',1.35]}/>
    <directionalLight castShadow={settings.quality==='high'} position={[-12,18,-8]} intensity={3.5} color={mission.id===1?'#ffe0ae':'#ffefd0'} shadow-mapSize={[2048,2048]} shadow-camera-left={-25} shadow-camera-right={25} shadow-camera-top={35} shadow-camera-bottom={-35} shadow-normalBias={.04}/>
    <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,-.025,-10]}><planeGeometry args={[100,140]}/><meshStandardMaterial color="#81906b" roughness={1}/></mesh>
    <mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[0,0,-10]}><planeGeometry args={[10.2,54]}/><meshStandardMaterial map={road} roughness={.95} color={mission.id===2?'#c2b896':'#a6a69d'}/></mesh>
    {[-1,1].map(side=><group key={side}><mesh receiveShadow rotation={[-Math.PI/2,0,0]} position={[side*6.6,.04,-10]}><planeGeometry args={[3.1,54]}/><meshStandardMaterial map={pavement} roughness={1}/></mesh>{[10,3,-4,-11,-18,-25].map((z,i)=><Shop key={z} assets={assets} x={side*11} z={z} index={i+(side<0?1:0)}/>)}
      {[-1,-15,-29].map(z=><Lamp key={z} x={side*5.35} z={z}/>)}
      {[-38,18].map(z=><Palm key={z} position={[side*7.5,0,z]} scale={1.1}/>)}
    </group>)}
    <SceneDetails mission={mission.id}/>
    {[-1,1].map(x=><Palm key={x} position={[x*3.1,0,-34]} scale={1.2}/>)}
    <group position={[0,0,-33]}><mesh position={[0,2.5,0]}><torusGeometry args={[2.2,.08,8,64]}/><meshStandardMaterial color="#c4aa6a" emissive="#c29438" emissiveIntensity={.35}/></mesh><mesh position={[0,2.5,.03]}><circleGeometry args={[2.15,64]}/><meshStandardMaterial color="#3e6859" transparent opacity={.28}/></mesh></group>
    {mission.activities.map(a=><Prop key={a.id} activity={a} solved={solved.includes(a.id)} near={near.current===a.id} mission={mission.id} reducedMotion={settings.reducedMotion}/>)}
    <Player {...props} onNear={id=>{near.current=id;props.onNear(id);}}/>
  </Canvas>;
}
