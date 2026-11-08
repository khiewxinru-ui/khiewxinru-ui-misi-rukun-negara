"""Edit operational instructions only; assert textbook-derived content is intact."""
import copy, hashlib, json
from pathlib import Path

p=Path('public/content/game.json')
content=json.loads(p.read_text())
def history(c):
 return dict(source=c['source'],introduction=c['introduction'],missions=[dict(id=m['id'],conclusion=m['conclusion'],activities=[{k:a[k] for k in ['id','title','speaker','dialogue','options','matches','correct','feedback','hint','page']} for a in m['activities']]) for m in c['missions']])
before=history(content)
instructions={
 'ekonomi':'Padankan barang dengan kegiatan ekonomi.',
 'penempatan':'Pilih 2 jawapan yang betul.',
 'politik':'Susun dari awal hingga akhir.',
 'sebab':'Pilih 3 sebab pengenalan Rukun Negara.',
 'matlamat':'Padankan tindakan dengan matlamatnya.',
 'tuhan':'Rakan kamu mengamalkan agamanya. Pilih tindakan yang betul.',
 'raja':'Padankan dengan penerangan yang betul.',
 'perlembagaan':'Pilih undang-undang tertinggi negara.',
 'undang':'Susun langkah melintas jalan.',
 'sopan':'Pilih 2 tindakan yang sopan.',
 'agama':'Jiran perlukan ruang untuk beribadat. Pilih tindakan yang betul.',
 'patriotik':'Pilih 2 tindakan yang patriotik.',
 'patuh':'Pilih tindakan yang betul.',
 'perpaduan':'Padankan situasi dengan tindakan yang betul.',
 'nilai':'Susun langkah membantu jiran.',
 'jati':'Pilih 3 amalan yang baik.',
}
introductions={
 1:'Cari 3 petunjuk. Kemudian, jawab soalan di meja penyiasat.',
 2:'Selesaikan cabaran matlamat dan 5 cabaran prinsip.',
 3:'Bantu jiran. Selesaikan 6 cabaran.',
}
changes=[]
for m in content['missions']:
 changes.append(dict(id=f"mission-{m['id']}",before=m['introduction'],after=introductions[m['id']]))
 m['introduction']=introductions[m['id']]
 for a in m['activities']:
  changes.append(dict(id=a['id'],before=a['question'],after=instructions[a['id']]))
  a['question']=instructions[a['id']]
assert before==history(content),'Historical content must not change.'
digest=hashlib.sha256(json.dumps(before,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
p.write_text(json.dumps(content,ensure_ascii=False,indent=2)+'\n')
Path('docs/instruction-review.json').write_text(json.dumps(dict(history_sha256=digest,history_unchanged=True,protected_fields=['source','prologue','dialogue','options','matches','correct','feedback','hint','conclusion'],changes=changes),ensure_ascii=False,indent=2)+'\n')
print('19 instructions shortened. Historical dialogue, choices, answers and explanations are unchanged.')
