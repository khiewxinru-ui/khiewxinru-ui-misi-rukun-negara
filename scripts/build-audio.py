"""Original, quiet pentatonic instrumental. No third-party recording."""
import wave,math,struct,random
from pathlib import Path
sr=22050;duration=32;n=sr*duration;buf=[0.0]*n
notes=[196,246.94,293.66,329.63,392,493.88,587.33]
for beat in range(64):
 freq=notes[[0,2,4,2,1,3,5,3,0,2,6,4,1,3,4,2][beat%16]];start=int(beat*.5*sr)
 for k in range(min(int(sr*2),n-start)):
  t=k/sr;env=(1-math.exp(-t*80))*math.exp(-t*3)
  buf[start+k]+=env*(math.sin(2*math.pi*freq*t)+.25*math.sin(2*math.pi*freq*2*t))*.13
for k in range(n):
 t=k/sr;fade=min(1,t/1,(duration-t)/1)
 buf[k]=(buf[k]+.014*math.sin(2*math.pi*98*t)+.01*math.sin(2*math.pi*146.83*t))*fade
out=Path('public/assets/journey.wav')
with wave.open(str(out),'w') as w:
 w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,v))*32767)) for v in buf))
print('Original 32-second music loop generated.')

# A soft, original outdoor sound bed: breeze, a distant motor and bird calls.
rng=random.Random(1969);ambient=[];smooth=0.0
for k in range(sr*24):
 t=k/sr;smooth=smooth*.97+rng.uniform(-1,1)*.03
 wind=smooth*.18*(.7+.3*math.sin(t*.45))
 motor=.008*(math.sin(2*math.pi*(52+2*math.sin(t*.3))*t)+.4*math.sin(2*math.pi*103*t))*(.4+.4*math.sin(t*.2))
 chirp=0
 for at in (2.5,7.4,12.7,19.3):
  delta=t-at
  if 0<delta<.4:chirp+=.025*math.sin(2*math.pi*(1800*delta+1000*delta*delta))*math.sin(math.pi*delta/.4)**2
 ambient.append((wind+motor+chirp)*min(1,t,24-t))
with wave.open('public/assets/ambience.wav','w') as w:
 w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,v))*32767)) for v in ambient))
print('Original outdoor ambience generated.')

for filename,tempo,scale in [('hope.wav',.6,[261.63,329.63,392,523.25]),('together.wav',.4,[293.66,329.63,392,440,493.88,587.33])]:
 length=24;track=[0.0]*(sr*length)
 for beat in range(int(length/tempo)):
  freq=scale[(beat*3+beat//4)%len(scale)];start=int(beat*tempo*sr)
  for k in range(min(int(sr*1.6),len(track)-start)):
   t=k/sr;env=(1-math.exp(-t*60))*math.exp(-t*2.7)
   track[start+k]+=.12*env*(math.sin(2*math.pi*freq*t)+.15*math.sin(2*math.pi*freq*2*t))
 for k in range(len(track)):
  t=k/sr;track[k]=(track[k]+.014*math.sin(2*math.pi*scale[0]/2*t))*min(1,t,length-t)
 with wave.open('public/assets/'+filename,'w') as w:
  w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,v))*32767)) for v in track))
print('Hope and community mission music generated.')
