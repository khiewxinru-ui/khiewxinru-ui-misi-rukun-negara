import { useEffect, useState } from "react";
import type { Content } from "../shared/content";
import type { Save } from "../game/save";
import {
  assessmentScores,
  correctAssessment,
  type AssessmentQuestion,
} from "../shared/assessment";
import { audioEngine } from "../game/audio";
export function FinalAssessment({
  content,
  save,
  onChange,
  onFinish,
  onHome,
}: {
  content: Content;
  save: Save;
  onChange: (fn: (s: Save) => Save) => void;
  onFinish: () => void;
  onHome: () => void;
}) {
  const [step, setStep] = useState(0);
  const sections = content.finalAssessment!;
  const section = sections[step];
  const scores = assessmentScores(sections, save.assessmentAnswers);
  const ready = sections.every(
    (s) =>
      s.questions.every((q) => {
        const answer = save.assessmentAnswers[q.id] || [];
        return (
          answer.length > 0 &&
          answer.every((n) => n >= 0 && n < q.options.length) &&
          (q.kind === "multi" ||
            answer.length === (q.kind === "choice" ? 1 : q.options.length))
        );
      }) && Boolean(save.assessmentWriting[s.id]?.trim()),
  );
  useEffect(() => {
    audioEngine.stopVoice();
  }, []);
  const setAnswer = (id: string, answer: number[]) =>
    onChange((s) => ({
      ...s,
      assessmentSubmitted: false,
      assessmentAnswers: { ...s.assessmentAnswers, [id]: answer },
    }));
  return (
    <main className="assessment-screen">
      <header>
        <span className="eyebrow">SEJARAH TAHUN 6 · UNIT 3</span>
        <h1>Pentaksiran Akhir — Misi Perpaduan</h1>
        <p>Tunjukkan apa yang kamu faham. Jawapan disimpan pada peranti ini.</p>
        <button className="text-button" onClick={onHome}>
          Simpan dan kembali ke menu
        </button>
      </header>
      <nav aria-label="Bahagian pentaksiran">
        {sections.map((s, i) => (
          <button
            key={s.id}
            aria-current={i === step ? "step" : undefined}
            onClick={() => setStep(i)}
          >
            Bahagian {s.id}
          </button>
        ))}
      </nav>
      <section>
        <span className="eyebrow">BAHAGIAN {section.id}</span>
        <h2>{section.title}</h2>
        <p>{section.objective}</p>
        {section.questions.map((q) => (
          <Question
            key={q.id}
            q={q}
            answer={save.assessmentAnswers[q.id] || []}
            setAnswer={(answer) => setAnswer(q.id, answer)}
            submitted={save.assessmentSubmitted}
          />
        ))}
        <label className="written-answer">
          {section.writtenPrompt}
          <textarea
            aria-label={section.writtenPrompt}
            maxLength={2500}
            rows={6}
            value={save.assessmentWriting[section.id] || ""}
            onChange={(e) =>
              onChange((s) => ({
                ...s,
                assessmentSubmitted: false,
                assessmentWriting: {
                  ...s.assessmentWriting,
                  [section.id]: e.target.value,
                },
              }))
            }
          />
        </label>
        <details className="assessment-rubric">
          <summary>Panduan jawapan dan semakan guru</summary>
          <p>
            Jawapan penerangan disemak oleh guru. Skor objektif sahaja tidak
            membuktikan penguasaan kemahiran menerangkan.
          </p>
          <ol>
            {section.rubric.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </details>
        <div className="assessment-actions">
          {step > 0 && (
            <button onClick={() => setStep((n) => n - 1)}>
              Bahagian sebelumnya
            </button>
          )}
          {step < 2 ? (
            <button
              className="primary-button"
              onClick={() => setStep((n) => n + 1)}
            >
              Bahagian seterusnya
            </button>
          ) : (
            <button
              className="primary-button"
              disabled={!ready}
              onClick={() =>
                onChange((s) => ({ ...s, assessmentSubmitted: true }))
              }
            >
              Semak pentaksiran
            </button>
          )}
        </div>
        {!ready && step === 2 && (
          <p>
            Lengkapkan pilihan dan jawapan ringkas dalam Bahagian A, B dan C.
          </p>
        )}
      </section>
      {save.assessmentSubmitted && (
        <section className="assessment-results" role="status">
          <h2>Keputusan mengikut objektif</h2>
          {scores.map((score) => (
            <p key={score.id}>
              <strong>
                Bahagian {score.id}: {score.correct}/{score.total} tugasan
                objektif tepat.
              </strong>{" "}
              {score.correct < score.total
                ? `Ulang kaji Misi ${["A", "B", "C"].indexOf(score.id) + 1} dan semak maklum balas.`
                : "Jawapan objektif tepat."}{" "}
              Penerangan bertulis: menunggu semakan guru.
            </p>
          ))}
          <p>
            Semakan automatik tidak memberi markah untuk penerangan bertulis.
          </p>
          <button className="primary-button" onClick={onFinish}>
            Lihat pencapaian
          </button>
          <button className="text-button" onClick={() => window.print()}>
            Cetak jawapan untuk guru
          </button>
        </section>
      )}
      <div className="assessment-print-report">
        <h1>Misi Perpaduan — {save.name}</h1>
        {sections.map((s) => (
          <section key={s.id}>
            <h2>
              Bahagian {s.id}: {s.title}
            </h2>
            {s.questions.map((q) => (
              <div key={q.id}>
                <h3>{q.question}</h3>
                {q.kind === "match" ? (
                  q.options.map((label, i) => (
                    <p key={label}>
                      {label}:{" "}
                      {q.matches[save.assessmentAnswers[q.id]?.[i]] ||
                        "Belum dijawab"}
                    </p>
                  ))
                ) : (
                  <p>
                    {save.assessmentAnswers[q.id]
                      ?.map((i) => q.options[i])
                      .join(" → ") || "Belum dijawab"}
                  </p>
                )}
              </div>
            ))}
            <h3>{s.writtenPrompt}</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>
              {save.assessmentWriting[s.id]}
            </p>
            <h3>Rubrik guru</h3>
            <ol>
              {s.rubric.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </main>
  );
}
function Question({
  q,
  answer,
  setAnswer,
  submitted,
}: {
  q: AssessmentQuestion;
  answer: number[];
  setAnswer: (answer: number[]) => void;
  submitted: boolean;
}) {
  const correct = correctAssessment(q, answer);
  const choose = (i: number) =>
    setAnswer(
      q.kind === "multi"
        ? answer.includes(i)
          ? answer.filter((n) => n !== i)
          : [...answer, i]
        : q.kind === "order"
          ? [...answer, i]
          : [i],
    );
  return (
    <fieldset className="assessment-question">
      <legend>{q.question}</legend>
      {q.kind === "match" ? (
        q.options.map((option, i) => (
          <label className="match-row" key={option}>
            <span>{option}</span>
            <select
              aria-label={option}
              value={answer[i] ?? -1}
              onChange={(e) => {
                const next = Array.from(
                  { length: q.options.length },
                  (_, j) => answer[j] ?? -1,
                );
                next[i] = Number(e.target.value);
                setAnswer(next);
              }}
            >
              <option value={-1}>Pilih padanan…</option>
              {q.matches.map((match, j) => (
                <option key={match} value={j}>
                  {match}
                </option>
              ))}
            </select>
          </label>
        ))
      ) : (
        <>
          <div
            className="answer-options"
            role={
              q.kind === "multi"
                ? undefined
                : q.kind === "choice"
                  ? "radiogroup"
                  : undefined
            }
            aria-label={q.question}
          >
            {q.options.map((option, i) => (
              <button
                key={option}
                className={`answer-option ${answer.includes(i) ? "selected" : ""}`}
                role={
                  q.kind === "multi"
                    ? "checkbox"
                    : q.kind === "choice"
                      ? "radio"
                      : undefined
                }
                aria-checked={
                  q.kind === "order" ? undefined : answer.includes(i)
                }
                disabled={q.kind === "order" && answer.includes(i)}
                onClick={() => choose(i)}
              >
                {q.kind === "order" && answer.includes(i)
                  ? `${answer.indexOf(i) + 1}. `
                  : ""}
                {option}
              </button>
            ))}
          </div>
          {q.kind === "order" && (
            <>
              <p>
                Susunan:{" "}
                {answer.map((i) => q.options[i]).join(" → ") || "Belum dipilih"}
              </p>
              <button className="text-button" onClick={() => setAnswer([])}>
                Susun semula
              </button>
            </>
          )}
        </>
      )}
      {submitted && (
        <p className={correct ? "assessment-correct" : "assessment-revise"}>
          {correct ? q.feedback : q.revision}
          {!correct &&
            q.kind === "match" &&
            ` Semak ${q.correct.filter((n, i) => answer[i] !== n).length} padanan.`}
        </p>
      )}
    </fieldset>
  );
}
