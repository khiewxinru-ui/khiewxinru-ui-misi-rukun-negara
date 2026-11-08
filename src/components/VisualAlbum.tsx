import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Volume2, X, RotateCcw } from "lucide-react";
import {
  assetUrl,
  type LearningVisual,
  type Activity,
} from "../shared/content";
import { audioEngine } from "../game/audio";

export function VisualAlbum({
  visuals,
  speaker,
}: {
  visuals: LearningVisual[];
  speaker: string;
}) {
  const [selected, setSelected] = useState(0),
    [expanded, setExpanded] = useState(false),
    [failed, setFailed] = useState(false),
    [retry, setRetry] = useState(0);
  const zoomRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const visual = visuals[selected] || visuals[0];
  useEffect(() => {
    setFailed(false);
  }, [visual?.path]);
  useEffect(() => {
    if (!expanded) return;
    zoomRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.stopImmediatePropagation();
        const focusables = Array.from(
          zoomRef.current?.querySelectorAll<HTMLElement>(
            "button:not(:disabled),a[href],summary",
          ) || [],
        ).filter((el) => el.getClientRects().length);
        const first = focusables[0],
          last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        setExpanded(false);
      }
    };
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("keydown", key, true);
      document.body.style.overflow = oldOverflow;
      triggerRef.current?.focus();
    };
  }, [expanded]);
  if (!visual) return null;
  const frame = (
    <div
      ref={expanded ? zoomRef : undefined}
      role={expanded ? "dialog" : undefined}
      aria-modal={expanded || undefined}
      aria-label={expanded ? visual.title : undefined}
      className={expanded ? "visual-expanded" : "visual-frame"}
    >
      {expanded && (
        <button
          autoFocus
          className="visual-close"
          onClick={() => setExpanded(false)}
          aria-label="Tutup gambar besar"
        >
          <X /> Tutup gambar
        </button>
      )}
      {failed ? (
        <div className="visual-error" role="alert">
          Gambar tidak dapat dimuatkan.
          <button
            onClick={() => {
              setFailed(false);
              setRetry((n) => n + 1);
            }}
          >
            <RotateCcw size={16} /> Cuba lagi
          </button>
        </div>
      ) : (
        <button
          ref={expanded ? undefined : triggerRef}
          className="visual-image-button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={`${expanded ? "Kecilkan" : "Besarkan"} gambar: ${visual.title}`}
        >
          <img
            key={`${visual.path}-${retry}`}
            src={`${assetUrl(visual.path)}${retry ? `?retry=${retry}` : ""}`}
            alt={visual.alt}
            onError={() => setFailed(true)}
          />
          {!expanded && (
            <span>
              <Maximize2 size={16} /> Besarkan
            </span>
          )}
        </button>
      )}
      <div className="visual-caption">
        <span className="visual-kind">
          {visual.kind} · {visual.date}
        </span>
        <h3>{visual.title}</h3>
        <p>{visual.caption}</p>
        <details>
          <summary>Sumber dan kredit</summary>
          <p>
            {visual.creator} · {visual.license}
          </p>
          <a href={visual.sourceUrl} target="_blank" rel="noreferrer">
            {visual.sourceTitle} ↗
          </a>
        </details>
      </div>
    </div>
  );
  return (
    <section className="visual-album" aria-label={`Album gambar ${speaker}`}>
      <div className="album-heading">
        <span>BAHAN PEMERHATIAN</span>
        <span>
          {selected + 1} / {visuals.length}
        </span>
      </div>
      {expanded ? createPortal(frame, document.body) : frame}
      {visuals.length > 1 && (
        <div className="visual-choices" aria-label="Pilih gambar">
          {visuals.map((v, i) => (
            <button
              key={`${v.id}-${i}`}
              aria-pressed={selected === i}
              onClick={() => {
                audioEngine.stopVoice();
                setSelected(i);
              }}
            >
              {v.title}
            </button>
          ))}
        </div>
      )}
      <div className="visual-explanation">
        <strong>{speaker}</strong>
        <p>{visual.explanation}</p>
        {visual.audio && (
          <button
            className="text-button"
            onClick={() =>
              audioEngine.speak(visual.explanation, visual.audio, true)
            }
          >
            <Volume2 size={18} /> Dengar penerangan gambar
          </button>
        )}
      </div>
    </section>
  );
}

export function VisualInquiry({
  activity,
  onContinue,
  onResponse,
}: {
  activity: Activity;
  onContinue: () => void;
  onResponse: (answer: number, note: string) => void;
}) {
  const question = activity.observation!;
  const [answer, setAnswer] = useState<number | null>(null),
    [submitted, setSubmitted] = useState(false),
    [note, setNote] = useState("");
  const correct = submitted && answer === question.correct;
  useEffect(() => {
    if (question.audio) audioEngine.speak(question.question, question.audio);
    return () => audioEngine.stopVoice();
  }, [question.audio, question.question]);
  return (
    <section className="visual-inquiry" aria-label="Soalan pemerhatian">
      <h3>Apakah yang kamu perhatikan?</h3>
      <p>{question.question}</p>
      {question.audio && (
        <button
          className="text-button"
          onClick={() =>
            audioEngine.speak(question.question, question.audio, true)
          }
        >
          <Volume2 size={18} /> Dengar soalan
        </button>
      )}
      <div role="radiogroup" aria-label={question.question}>
        {question.options.map((option, i) => (
          <button
            key={option}
            className={`answer-option ${answer === i ? "selected" : ""}`}
            role="radio"
            aria-checked={answer === i}
            onClick={() => {
              setAnswer(i);
              setSubmitted(false);
            }}
          >
            {option}
          </button>
        ))}
      </div>
      {submitted && (
        <p role="status">
          {correct
            ? question.feedback
            : "Lihat gambar semula. Cuba jawapan lain."}
        </p>
      )}
      {correct ? (
        <>
          <label className="observation-note">
            Catatan kamu (pilihan)
            <textarea
              value={note}
              maxLength={700}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Saya perhatikan…"
            />
          </label>
          <button
            className="primary-button"
            onClick={() => {
              onResponse(answer!, note);
              onContinue();
            }}
          >
            Teruskan cabaran
          </button>
        </>
      ) : (
        <button
          className="primary-button"
          disabled={answer === null}
          onClick={() => setSubmitted(true)}
        >
          Semak pemerhatian
        </button>
      )}
    </section>
  );
}
