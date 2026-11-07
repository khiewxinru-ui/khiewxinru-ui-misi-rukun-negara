import { useEffect, useRef, type ReactNode } from 'react';
import { X, Compass, ArrowRight, Volume2, Music2, Waves, Captions, RotateCcw } from 'lucide-react';
import type { AudioSettings } from '../game/audio';

export function Emblem({small=false}:{small?:boolean}) {
  return <span className={`emblem ${small?'small':''}`} aria-hidden="true"><Compass size={small?20:30} strokeWidth={1.1}/></span>;
}
export function PrimaryButton({children,onClick,disabled=false,type='button'}:{children:ReactNode;onClick?:()=>void;disabled?:boolean;type?:'button'|'submit'}) {
  return <button type={type} className="primary-button" onClick={onClick} disabled={disabled}><span>{children}</span><ArrowRight size={19}/></button>;
}
export function Modal({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}) {
  const ref=useRef<HTMLDivElement>(null);
  const closeRef=useRef(onClose);closeRef.current=onClose;
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    ref.current?.focus();
    const listener=(e:KeyboardEvent)=>{
      if(e.key==='Escape')closeRef.current();
      if(e.key==='Tab'){
        const els=ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,textarea,a[href],[tabindex="0"]');
        if(!els?.length)return;
        if(e.shiftKey&&document.activeElement===els[0]){e.preventDefault();els[els.length-1].focus();}
        else if(!e.shiftKey&&document.activeElement===els[els.length-1]){e.preventDefault();els[0].focus();}
      }
    };
    document.addEventListener('keydown',listener);return()=>{document.removeEventListener('keydown',listener);previous?.focus();};
  },[]);
  return <div className="modal-scrim" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><div className={`modal ${wide?'wide':''}`} ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}>
    <div className="modal-header"><span className="eyebrow">MISI RUKUN NEGARA</span><button className="icon-button" aria-label="Tutup" onClick={onClose}><X size={22}/></button></div>
    <h2>{title}</h2>{children}
  </div></div>;
}
export function Settings({value,onChange}:{value:AudioSettings;onChange:(s:AudioSettings)=>void}) {
  const toggles:[keyof AudioSettings,string,ReactNode][]=[['music','Muzik latar',<Music2 size={19}/>],['effects','Kesan bunyi',<Waves size={19}/>],['voice','Suara narator',<Volume2 size={19}/>],['subtitles','Sari kata',<Captions size={19}/>],['reducedMotion','Kurangkan pergerakan',<RotateCcw size={19}/>]];
  return <div className="settings-list">{toggles.map(([key,label,icon])=><label className="setting-row" key={key}><span>{icon}{label}</span><input type="checkbox" role="switch" checked={Boolean(value[key])} onChange={e=>onChange({...value,[key]:e.target.checked})}/></label>)}
    <label className="volume-label">Kelantangan <span>{Math.round(value.volume*100)}%</span><input type="range" min="0" max="1" step=".05" aria-label="Kelantangan" value={value.volume} onChange={e=>onChange({...value,volume:Number(e.target.value)})}/></label>
    <label className="setting-row"><span>Kualiti grafik</span><select value={value.quality} onChange={e=>onChange({...value,quality:e.target.value as AudioSettings['quality']})}><option value="high">Tinggi</option><option value="low">Rendah · lebih ringan</option></select></label>
    <p className="fine-print">Suara automatik tersedia jika peranti mempunyai suara Bahasa Melayu. Teks dialog sentiasa boleh dibaca.</p>
  </div>;
}
