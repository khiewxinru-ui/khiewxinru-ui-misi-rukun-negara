import { z } from 'zod';

const short = z.string().trim().min(1).max(300);
const mediaPath = z.string().max(300).refine(s => !s || (/^(assets|content)\/[a-zA-Z0-9/_ .-]+$/.test(s) && !s.split('/').includes('..') && !s.includes('//')), 'Gunakan laluan aset tempatan yang sah.');
export const activitySchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]{1,59}$/),
  title: short,
  label: short,
  speaker: short,
  dialogue: z.array(z.string().min(1).max(1800)).min(1).max(8),
  kind: z.enum(['choice', 'multi', 'match', 'order']),
  question: z.string().min(1).max(1800),
  options: z.array(short).min(2).max(12),
  correct: z.array(z.number().int().min(0).max(11)).min(1).max(12),
  matches: z.array(short).max(12).default([]),
  feedback: z.string().min(1).max(1800),
  hint: z.string().min(1).max(1800),
  position: z.tuple([z.number().min(-4.5).max(4.5), z.number().min(-30).max(8)]),
  object: z.enum(['radio', 'map', 'crate', 'book', 'lantern', 'flag', 'garden', 'notice', 'bench', 'arch']),
  image: mediaPath.default(''),
  audio: mediaPath.default(''),
  narration: z.array(mediaPath).max(8).default([]),
  page: z.string().regex(/^\d{2}(–\d{2})?$/),
}).superRefine((v, ctx) => {
  if (v.correct.some(i => i >= v.options.length) || new Set(v.correct).size !== v.correct.length)
    ctx.addIssue({code: 'custom', message: 'Jawapan tidak sepadan dengan pilihan.'});
  if (v.kind === 'choice' && v.correct.length !== 1)
    ctx.addIssue({code: 'custom', message: 'Pilihan tunggal memerlukan satu jawapan.'});
  if (v.kind === 'match' && (v.matches.length !== v.options.length || v.correct.length !== v.options.length))
    ctx.addIssue({code: 'custom', message: 'Setiap pasangan memerlukan satu padanan.'});
  if (v.kind === 'order' && v.correct.length !== v.options.length)
    ctx.addIssue({code: 'custom', message: 'Susunan mesti mengandungi semua pilihan.'});
});

export const contentSchema = z.object({
  version: z.literal(1),
  title: short,
  subtitle: short,
  introduction: z.string().min(1).max(1800),
  introductionAudio: mediaPath.default(''),
  soundtrack: z.object({music:mediaPath,ambience:mediaPath}).default({music:'assets/journey.wav',ambience:'assets/ambience.wav'}),
  source: z.object({url: z.string().url(), pages: z.literal('36–46'), checked: z.string()}),
  missions: z.array(z.object({
    id: z.number().int().min(1).max(3),
    title: short, era: short, tagline: short,
    introduction: z.string().min(1).max(1800),
    conclusion: z.string().min(1).max(1800),
    activities: z.array(activitySchema).min(3).max(20),
  })).length(3),
}).superRefine((v, ctx) => {
  const ids = v.missions.flatMap(m => m.activities.map(a => a.id));
  if (new Set(ids).size !== ids.length || v.missions.some((m,i) => m.id !== i + 1))
    ctx.addIssue({code:'custom',message:'ID misi atau objek tidak sah / berulang.'});
});
export type Content = z.infer<typeof contentSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type Mission = Content['missions'][number];

export function checkAnswer(activity: Activity, answer: number[]) {
  if (activity.kind === 'multi')
    return answer.length === activity.correct.length && new Set(answer).size === answer.length && answer.every(i => activity.correct.includes(i));
  return answer.length === activity.correct.length && answer.every((v,i) => v === activity.correct[i]);
}

export function assetUrl(path: string) { return `${import.meta.env.BASE_URL}${path}`; }

export async function loadContent(signal?: AbortSignal): Promise<Content> {
  const res = await fetch(assetUrl('content/game.json'), {signal, cache: 'no-cache'});
  if (!res.ok) throw new Error(`Kandungan tidak dapat dimuatkan (${res.status}).`);
  return contentSchema.parse(await res.json());
}
