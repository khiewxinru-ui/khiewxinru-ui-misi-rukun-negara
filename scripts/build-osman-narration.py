"""Generate the selected ms-MY Osman voice with sentence-level direction.

Requires edge-tts and ffmpeg. Student playback uses local MP3s, not a TTS API.
The service supports rate, pitch and volume; named acting/emotion styles are
not assumed. Full sentences preserve the neural voice's natural contours.
"""
import argparse,asyncio,hashlib,importlib,json,os,re,subprocess,tempfile
from pathlib import Path
import edge_tts

VOICE='ms-MY-OsmanNeural'
WORK=Path(os.environ.get('NARRATION_WORK_DIR','work/narration'))
WORK.mkdir(parents=True,exist_ok=True)
PROFILES={
 'opening':dict(rate='-10%',pitch='-2Hz',volume='+0%',pause=.60),
 'history':dict(rate='-9%',pitch='-2Hz',volume='+0%',pause=.48),
 'explain':dict(rate='-6%',pitch='+0Hz',volume='+0%',pause=.38),
 'instruction':dict(rate='-6%',pitch='+0Hz',volume='+0%',pause=.40),
 'question':dict(rate='-7%',pitch='+2Hz',volume='+0%',pause=.70),
 'encourage':dict(rate='-5%',pitch='+1Hz',volume='+0%',pause=.48),
 'success':dict(rate='-2%',pitch='+3Hz',volume='+3%',pause=.48),
}
def plan(text,style):
 spoken=text.replace('{name}','pengembara')
 sentences=[s.strip() for s in re.split(r'(?<=[.!?])\s+',spoken) if s.strip()]
 result=[]
 for sentence in sentences:
  tone='question' if sentence.endswith('?') else style
  if re.match(r'^(Tepat|Betul|Bagus|Tahniah)[!.]',sentence):tone='success'
  result.append(dict(text=sentence,tone=tone,**PROFILES[tone]))
 return result

async def main():
 parser=argparse.ArgumentParser();parser.add_argument('--limit',type=int);args=parser.parse_args()
 # Extend the library's CA bundle with the already-trusted environment roots.
 if os.environ.get('SSL_CERT_FILE'):
  for module in ['edge_tts.communicate','edge_tts.voices']:
   importlib.import_module(module)._SSL_CTX.load_verify_locations(cafile=os.environ['SSL_CERT_FILE'])
 path=Path('public/content/game.json');content=json.loads(path.read_text());jobs=[]
 def job(target,key,text,style,identifier):
  segments=plan(text,style)
  fingerprint=hashlib.sha256(json.dumps(dict(voice=VOICE,segments=segments),sort_keys=True,ensure_ascii=False).encode()).hexdigest()[:10]
  relative=f'assets/narration-osman/{identifier}-{fingerprint}.mp3'
  jobs.append(dict(target=target,key=key,source=text,style=style,segments=segments,path=relative,id=identifier))
 job(content,'introductionAudio',content['introduction'],'opening','prologue')
 if content.get('openingQuestion'):job(content,'openingQuestionAudio',content['openingQuestion'],'question','opening-question')
 if content.get('openingNarration'):job(content,'openingNarrationAudio',content['openingNarration'],'opening','opening-journey')
 for m in content['missions']:
  job(m,'introductionAudio',m['introduction'],'instruction',f"mission-{m['id']}-intro")
  job(m,'conclusionAudio',m['conclusion'],'success',f"mission-{m['id']}-complete")
  for a in m['activities']:
   a['narration']=['']*len(a['dialogue'])
   for i,text in enumerate(a['dialogue']):job(a['narration'],i,text,'history' if m['id']==1 else 'explain',f"{a['id']}-dialogue-{i}")
   for i,visual in enumerate(a.get('visuals',[])):job(visual,'audio',visual['explanation'],'history' if m['id']==1 else 'explain',f"{a['id']}-visual-{i}")
   if a.get('observation'):job(a['observation'],'audio',a['observation']['question'],'question',f"{a['id']}-observe")
   job(a,'questionAudio',a['question'],'instruction',f"{a['id']}-task")
   job(a,'feedbackAudio',a['feedback'],'success',f"{a['id']}-success")
   job(a,'hintAudio',a['hint'],'encourage',f"{a['id']}-hint")
 job(content,'endingAudio','Tahniah, pengembara! Kamu telah berjaya menamatkan Misi Rukun Negara. '+content['missions'][2]['conclusion'],'success','ending')
 out=Path('public/assets/narration-osman');out.mkdir(exist_ok=True)
 semaphore=asyncio.Semaphore(2)
 async def generate(item):
  dest=Path('public',item['path'])
  if dest.exists() and dest.stat().st_size>1000:return
  async with semaphore:
   with tempfile.TemporaryDirectory(dir=WORK) as tmp:
    root=Path(tmp);parts=[]
    for i,segment in enumerate(item['segments']):
     cache_key=hashlib.sha256(json.dumps(dict(voice=VOICE,**segment),sort_keys=True,ensure_ascii=False).encode()).hexdigest()
     cache=WORK/'sentences';cache.mkdir(exist_ok=True)
     media=cache/(cache_key+'.mp3')
     if not media.exists() or media.stat().st_size<1000:
      for attempt in range(3):
       try:
        await asyncio.wait_for(edge_tts.Communicate(segment['text'],VOICE,rate=segment['rate'],pitch=segment['pitch'],volume=segment['volume'],proxy=os.environ.get('HTTPS_PROXY')).save(str(media)),timeout=50)
        if media.stat().st_size<1000:raise RuntimeError('Empty narration response')
        break
       except Exception:
        media.unlink(missing_ok=True)
        if attempt==2:raise
        await asyncio.sleep(2*(attempt+1))
     wav=root/f'{i}.wav'
     subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(media),'-af',f"apad=pad_dur={segment['pause']}",'-ar','24000','-ac','1','-c:a','pcm_s16le',str(wav)],check=True)
     parts.append(wav)
    listing=root/'parts.txt';listing.write_text(''.join(f"file '{p}'\n" for p in parts))
    subprocess.run(['ffmpeg','-loglevel','error','-y','-f','concat','-safe','0','-i',str(listing),'-c:a','libmp3lame','-b:a','64k',str(dest)],check=True)
   print(f"Generated {item['id']} ({item['style']})",flush=True)
 selected=jobs[:args.limit] if args.limit else jobs
 await asyncio.gather(*(generate(item) for item in selected))
 if args.limit:print('Preview limit only: content references not changed.');return
 manifest=[]
 for item in jobs:
  item['target'][item['key']]=item['path']
  probe=subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(Path('public',item['path']))],text=True)
  manifest.append({k:item[k] for k in ['id','path','source','style','segments']}|dict(duration_seconds=float(json.loads(probe)['format']['duration'])))
 for m in content['missions']:
  for a in m['activities']:a['audio']=a['narration'][0]
 temporary=path.with_suffix('.tmp');temporary.write_text(json.dumps(content,ensure_ascii=False,indent=2)+'\n');temporary.replace(path)
 Path('docs/narration-direction.json').write_text(json.dumps(dict(voice=VOICE,locale='ms-MY',method='Full-sentence neural narration; supported rate/pitch/volume controls and editorial pauses.',clips=manifest),ensure_ascii=False,indent=2)+'\n')
 print(f'Completed {len(jobs)} clips. All references updated atomically after generation.',flush=True)
asyncio.run(main())
