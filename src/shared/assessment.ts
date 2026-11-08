import { z } from "zod";
export const assessmentQuestionSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]+$/),
    question: z.string().min(1).max(1000),
    kind: z.enum(["choice", "multi", "match", "order"]),
    options: z.array(z.string().min(1).max(400)).min(2).max(12),
    matches: z.array(z.string().min(1).max(400)).max(12).default([]),
    correct: z.array(z.number().int().min(0).max(11)).min(1).max(12),
    feedback: z.string().min(1).max(1800),
    revision: z.string().min(1).max(1000),
  })
  .superRefine((v, ctx) => {
    if (
      new Set(v.correct).size !== v.correct.length ||
      v.correct.some((n) => n >= v.options.length) ||
      (v.kind === "choice" && v.correct.length !== 1) ||
      (["match", "order"].includes(v.kind) &&
        v.correct.length !== v.options.length) ||
      (v.kind === "match" && v.matches.length !== v.options.length)
    )
      ctx.addIssue({
        code: "custom",
        message: "Jawapan pentaksiran tidak sah.",
      });
  });
export const assessmentSectionSchema = z.object({
  id: z.enum(["A", "B", "C"]),
  title: z.string().min(1).max(300),
  objective: z.string().min(1).max(500),
  questions: z.array(assessmentQuestionSchema).min(1).max(8),
  writtenPrompt: z.string().min(1).max(1000),
  rubric: z.array(z.string().min(1).max(700)).min(1).max(8),
});
export const finalAssessmentSchema = z
  .array(assessmentSectionSchema)
  .length(3)
  .refine(
    (sections) =>
      sections.every((s, i) => s.id === ["A", "B", "C"][i]) &&
      new Set(sections.flatMap((s) => s.questions.map((q) => q.id))).size ===
        sections.flatMap((s) => s.questions).length,
    "Bahagian/ID berulang.",
  );
export type AssessmentSection = z.infer<typeof assessmentSectionSchema>;
export type AssessmentQuestion = z.infer<typeof assessmentQuestionSchema>;
export function correctAssessment(q: AssessmentQuestion, answer: number[]) {
  if (
    answer.length !== q.correct.length ||
    answer.some(
      (n) => !Number.isInteger(n) || n < 0 || n >= q.options.length,
    ) ||
    new Set(answer).size !== answer.length
  )
    return false;
  return q.kind === "multi"
    ? answer.every((n) => q.correct.includes(n))
    : answer.every((n, i) => n === q.correct[i]);
}
export function assessmentScores(
  sections: AssessmentSection[],
  answers: Record<string, number[]>,
) {
  return sections.map((section) => ({
    id: section.id,
    correct: section.questions.filter((q) =>
      correctAssessment(q, answers[q.id] || []),
    ).length,
    total: section.questions.length,
  }));
}
