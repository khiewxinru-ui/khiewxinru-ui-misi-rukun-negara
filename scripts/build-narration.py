"""Reproducible Malay synthetic narration. Requires espeakng-loader and ffmpeg.
Generated files are included, so these tools are not needed to run the game.
"""
import ctypes,json,subprocess,wave,tempfile
from pathlib import Path
import espeakng_loader

lib=espeakng_loader.load_library()
lib.espeak_Initialize.argtypes=[ctypes.c_int,ctypes.c_int,ctypes.c_char_p,ctypes.c_int]
lib.espeak_Initialize.restype=ctypes.c_int
rate=lib.espeak_Initialize(2,0,str(Path(espeakng_loader.get_data_path()).parent).encode(),0)
lib.espeak_SetVoiceByName.argtypes=[ctypes.c_char_p]
assert lib.espeak_SetVoiceByName(b'ms')==0
lib.espeak_SetParameter(1,155,0)
Callback=ctypes.CFUNCTYPE(ctypes.c_int,ctypes.POINTER(ctypes.c_short),ctypes.c_int,ctypes.c_void_p)
chunks=[]
@Callback
def callback(samples,count,events):
 if samples and count:chunks.append(ctypes.string_at(samples,count*2))
 return 0
lib.espeak_SetSynthCallback(callback)
lib.espeak_Synth.argtypes=[ctypes.c_void_p,ctypes.c_size_t,ctypes.c_uint,ctypes.c_int,ctypes.c_uint,ctypes.c_uint,ctypes.c_void_p,ctypes.c_void_p]
out=Path('public/assets/voice');out.mkdir(exist_ok=True)
def speak(text,name):
 chunks.clear();data=text.replace('{name}','pengembara').encode('utf-8')+b'\0'
 lib.espeak_Synth(data,len(data),0,1,0,1,None,None);lib.espeak_Synchronize()
 with tempfile.NamedTemporaryFile(suffix='.wav') as t:
  with wave.open(t.name,'w') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(b''.join(chunks))
  subprocess.run(['ffmpeg','-loglevel','error','-y','-i',t.name,'-c:a','libvorbis','-q:a','3',str(out/(name+'.ogg'))],check=True)
 return f'assets/voice/{name}.ogg'
path=Path('public/content/game.json');content=json.loads(path.read_text())
content['introductionAudio']=speak(content['introduction'],'prologue')
count=1
for mission in content['missions']:
 for a in mission['activities']:
  a['narration']=[speak(text,f"{a['id']}-{i}") for i,text in enumerate(a['dialogue'])]
  a['audio']=a['narration'][0];count+=len(a['narration'])
path.write_text(json.dumps(content,ensure_ascii=False,indent=2)+'\n')
print(f'{count} Malay narration files generated.')
