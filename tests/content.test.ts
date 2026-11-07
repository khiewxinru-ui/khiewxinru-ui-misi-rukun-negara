import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contentSchema, checkAnswer } from '../src/shared/content';

const content=contentSchema.parse(JSON.parse(readFileSync(new URL('../public/content/game.json',import.meta.url),'utf8')));
test('All three learning missions have valid and solvable assessments',()=>{
  assert.deepEqual(content.missions.map(m=>m.id),[1,2,3]);
  assert.equal(content.missions.flatMap(m=>m.activities).length,16);
  for(const a of content.missions.flatMap(m=>m.activities)){
    assert.ok(checkAnswer(a,a.correct),a.id);
    assert.equal(checkAnswer(a,[]),false,a.id);
    const wrong=a.correct.map((n,i)=>i===0?(n+1)%a.options.length:n);
    assert.equal(checkAnswer(a,wrong),false,`${a.id} rejects a changed answer`);
  }
});
test('The three assessed causes exclude the historical event itself',()=>{
  const a=content.missions[0].activities.find(a=>a.id==='sebab')!;
  assert.deepEqual(a.correct.map(i=>a.options[i]),['Perbezaan kegiatan ekonomi','Pengasingan tempat tinggal','Perbezaan fahaman politik']);
  assert.equal(checkAnswer(a,[0,2,3]),false);
});
test('Duplicate IDs, invalid answers, unsafe assets and out-of-world objects are rejected',()=>{
  const edits=[(c:typeof content)=>{c.missions[1].activities[0].id=c.missions[0].activities[0].id;},(c:typeof content)=>{c.missions[0].activities[0].correct=[99];},(c:typeof content)=>{c.missions[0].activities[0].image='https://evil.invalid/x.svg';},(c:typeof content)=>{c.missions[0].activities[0].position=[500,500];}];
  for(const edit of edits){const c=structuredClone(content);edit(c);assert.equal(contentSchema.safeParse(c).success,false);}
});
test('Multiple-choice assessment cannot be passed by submitting the same answer repeatedly',()=>{
  const a=content.missions[0].activities.find(a=>a.id==='sebab')!;assert.equal(checkAnswer(a,[0,0,0]),false);
});
