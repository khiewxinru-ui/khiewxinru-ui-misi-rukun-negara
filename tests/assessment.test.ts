import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contentSchema } from "../src/shared/content";
import {
  assessmentScores,
  correctAssessment,
  finalAssessmentSchema,
} from "../src/shared/assessment";
const content = contentSchema.parse(
  JSON.parse(
    readFileSync(
      new URL("../public/content/game.json", import.meta.url),
      "utf8",
    ),
  ),
);
const sections = content.finalAssessment!;
test("Final assessment grades by objective and rejects duplicate or incomplete answers", () => {
  const answers = Object.fromEntries(
    sections.flatMap((s) => s.questions.map((q) => [q.id, q.correct])),
  );
  assert.deepEqual(
    assessmentScores(sections, answers).map((s) => s.correct),
    [2, 2, 2],
  );
  for (const section of sections)
    for (const q of section.questions) {
      assert.equal(correctAssessment(q, []), false);
      assert.equal(correctAssessment(q, [-1]), false);
      if (q.correct.length > 1)
        assert.equal(
          correctAssessment(
            q,
            q.correct.map(() => q.correct[0]),
          ),
          false,
        );
    }
  assert.equal(
    correctAssessment(sections[0].questions[0], [0, 1, 3]),
    false,
    "Historical event must not replace one of the three causes",
  );
});
test("Assessment schema rejects duplicate IDs, out of range answers and mismatched pairs", () => {
  for (const edit of [
    (s: typeof sections) => {
      s[1].questions[0].id = s[0].questions[0].id;
    },
    (s: typeof sections) => {
      s[0].questions[0].correct = [99];
    },
    (s: typeof sections) => {
      s[1].questions[0].matches = ["one"];
    },
  ]) {
    const changed = structuredClone(sections);
    edit(changed);
    assert.equal(finalAssessmentSchema.safeParse(changed).success, false);
  }
});
test("All 16 learning discoveries have contextual visual evidence and an answerable observation", () => {
  for (const m of content.missions)
    for (const a of m.activities) {
      assert.ok(a.visuals.length > 0, a.id);
      assert.ok(a.observation);
      assert.ok(a.observation.correct < a.observation.options.length);
      for (const v of a.visuals) {
        assert.ok(
          v.caption &&
            v.alt &&
            v.date &&
            v.creator &&
            v.license &&
            v.explanation,
        );
        assert.ok(v.sourceUrl.startsWith("https://"));
      }
    }
  const changed = structuredClone(content);
  changed.missions[0].activities[0].visuals[0].sourceUrl =
    "javascript:alert(1)";
  assert.equal(contentSchema.safeParse(changed).success, false);
});
