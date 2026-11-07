import { z } from 'zod';
import type { AudioSettings } from './audio';
import { defaultSettings } from './audio';

const saveSchema=z.object({
  version:z.literal(1), name:z.string().min(1).max(30), gender:z.enum(['Lelaki','Perempuan']),
  mission:z.number().int().min(1).max(3), solved:z.array(z.string()).max(100),
  attempts:z.record(z.string(),z.number().int().nonnegative()).default({}),
  reflection:z.string().max(1000).default(''), finished:z.boolean().default(false),
  position:z.tuple([z.number().min(-4.8).max(4.8),z.number().min(-31).max(10)]).default([0,8]),
  yaw:z.number().default(0), updatedAt:z.string(),
});
export type Save = z.infer<typeof saveSchema>;
const KEY='misi-rukun-negara:journey:v1';
export function readSave(): Save | null {
  try { return saveSchema.parse(JSON.parse(localStorage.getItem(KEY)||'null')); } catch { return null; }
}
export function writeSave(value: Save): boolean {
  try { localStorage.setItem(KEY,JSON.stringify({...value,updatedAt:new Date().toISOString()}));return true; } catch { return false; }
}
export function createSave(name:string,gender:Save['gender']):Save {
  return {version:1,name,gender,mission:1,solved:[],attempts:{},reflection:'',finished:false,position:[0,8],yaw:0,updatedAt:new Date().toISOString()};
}
export function readSettings(): AudioSettings {
  try {
    const s=JSON.parse(localStorage.getItem(KEY+':settings')||'{}');
    return {...defaultSettings,...Object.fromEntries(Object.entries(s).filter(([k,v])=>k in defaultSettings && typeof v===typeof defaultSettings[k as keyof AudioSettings])),volume:Math.max(0,Math.min(1,Number(s.volume ?? .55))),quality:s.quality==='low'?'low':'high'};
  } catch { return defaultSettings; }
}
export function writeSettings(s:AudioSettings) { try { localStorage.setItem(KEY+':settings',JSON.stringify(s)); } catch { /* Settings still apply during this visit. */ } }
