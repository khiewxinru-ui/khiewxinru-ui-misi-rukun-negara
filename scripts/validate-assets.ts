import { existsSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { contentSchema } from '../src/shared/content';
const content=contentSchema.parse(JSON.parse(readFileSync('public/content/game.json','utf8')));
const paths=new Set(['assets/shophouse.glb','assets/heritage-street.webp','assets/road.jpg','assets/stone.jpg','assets/wood.jpg',content.introductionAudio,...Object.values(content.soundtrack),...content.missions.flatMap(m=>m.activities.flatMap(a=>[a.image,a.audio,...a.narration]))].filter(Boolean));
const root=resolve('public')+sep;
for(const path of paths){const file=resolve('public',path);if(!file.startsWith(root)||!existsSync(file))throw new Error(`Aset tidak ditemui: ${path}`);}
console.log(`Verified ${paths.size} local content and world assets.`);
