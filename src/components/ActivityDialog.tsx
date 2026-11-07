import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronRight,
  Lightbulb,
  RotateCcw,
  Volume2,
  BookOpen,
  ArrowUp,
  Undo2,
} from "lucide-react";
import { type Activity, checkAnswer, assetUrl } from "../shared/content";
import { audioEngine } from "../game/audio";
import { Modal, PrimaryButton } from "./UI";

export function ActivityDialog({
  activity,
  name,
  alreadySolved,
  onClose,
  onComplete,
  onAttempt,
}: {
  activity: Activity;
  name: string;
  alreadySolved: boolean;
  onClose: () => void;
  onComplete: () => void;
  onAttempt: () => void;
}) {
  const wasAlreadySolved = useRef(alreadySolved).current;
  const [page, setPage] = useState(0),
    [answer, setAnswer] = useState<number[]>([]),
    [feedback, setFeedback] = useState<"wrong" | "correct" | null>(null),
    [hint, setHint] = useState(false);
  const task = page >= activity.dialogue.length;
  const [showText, setShowText] = useState(false);
  const line = task
    ? activity.question
    : activity.dialogue[page].replaceAll("{name}", name);
  const audioPath = task
    ? ""
    : page === 0
      ? activity.audio
      : activity.narration[page] || "";
  useEffect(() => {
    audioEngine.speak(line, audioPath);
    return () => audioEngine.stopVoice();
  }, [line, audioPath]);
  const chosen = (i: number) => {
    setFeedback(null);
    if (activity.kind === "multi")
      setAnswer((a) => (a.includes(i) ? a.filter((x) => x !== i) : [...a, i]));
    else if (activity.kind === "order")
      setAnswer((a) => (a.includes(i) ? a : [...a, i]));
    else setAnswer([i]);
    audioEngine.effect("click");
  };
  const submit = () => {
    onAttempt();
    if (checkAnswer(activity, answer)) {
      setFeedback("correct");
      audioEngine.effect("success");
      onComplete();
    } else {
      setFeedback("wrong");
      setHint(true);
    }
  };
  const ready =
    activity.kind === "match" || activity.kind === "order"
      ? answer.length === activity.options.length &&
        answer.every((v) => v !== undefined && v >= 0)
      : answer.length > 0;
  return (
    <Modal title={activity.title} onClose={onClose} wide>
      <div className="dialog-meta">
        <span>
          <span className="status-dot" />
          {activity.speaker}
        </span>
        <span>
          {task ? "CABARAN" : `${page + 1} / ${activity.dialogue.length}`}
        </span>
      </div>
      {!task ? (
        <>
          {activity.image && page === 0 && (
            <img
              className="dialog-image"
              src={assetUrl(activity.image)}
              alt={activity.title}
            />
          )}
          {audioEngine.settings.subtitles ||
          !audioEngine.settings.voice ||
          !audioPath ||
          showText ? (
            <p className="dialogue-line">{line}</p>
          ) : (
            <div className="dialogue-line">
              <Volume2 size={25} />
              <p>Dengarkan kisah penemuan ini.</p>
              <button className="text-button" onClick={() => setShowText(true)}>
                Tunjukkan teks
              </button>
            </div>
          )}
          <div className="dialog-actions">
            <button
              className="text-button"
              onClick={() => audioEngine.speak(line, audioPath)}
            >
              <Volume2 size={17} />
              Dengar semula
            </button>
            <PrimaryButton onClick={() => setPage((p) => p + 1)}>
              {page === activity.dialogue.length - 1
                ? "Terima cabaran"
                : "Teruskan"}
            </PrimaryButton>
          </div>
        </>
      ) : (
        <>
          <p className="task-question">{activity.question}</p>
          {feedback === "correct" ? (
            <div className="answer-success" role="status">
              <span className="success-medal">
                <Check size={30} />
              </span>
              <h3>
                {wasAlreadySolved
                  ? "Pengetahuan diperkukuh!"
                  : "Petunjuk direkodkan!"}
              </h3>
              <p>{activity.feedback}</p>
              <PrimaryButton onClick={onClose}>
                Sambung penerokaan
              </PrimaryButton>
            </div>
          ) : (
            <>
              {activity.kind === "match" ? (
                <div className="match-list">
                  {activity.options.map((option, i) => (
                    <label key={option} className="match-row">
                      <span>
                        <span className="number-dot">{i + 1}</span>
                        {option}
                      </span>
                      <select
                        aria-label={`Padanan: ${option}`}
                        value={answer[i] ?? -1}
                        onChange={(e) => {
                          setAnswer((a) => {
                            const b = [...a];
                            b[i] = Number(e.target.value);
                            return b;
                          });
                          setFeedback(null);
                        }}
                      >
                        <option value={-1}>Pilih padanan…</option>
                        {activity.matches.map((s, j) => (
                          <option value={j} key={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              ) : activity.kind === "order" ? (
                <div className="order-task">
                  <p className="fine-print">
                    <ArrowUp size={14} /> Klik tindakan mengikut urutan yang
                    betul.
                  </p>
                  <div className="order-slots">
                    {activity.options.map((_, i) => (
                      <div
                        key={i}
                        className={`order-slot ${answer[i] !== undefined ? "filled" : ""}`}
                      >
                        <span>{i + 1}</span>
                        {answer[i] !== undefined
                          ? activity.options[answer[i]]
                          : "Pilih tindakan di bawah"}
                      </div>
                    ))}
                  </div>
                  <div className="order-options">
                    {activity.options.map((option, i) => (
                      <button
                        key={option}
                        disabled={answer.includes(i)}
                        onClick={() => chosen(i)}
                      >
                        {option}
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                  <button
                    className="text-button"
                    onClick={() => {
                      setAnswer([]);
                      setFeedback(null);
                    }}
                  >
                    <Undo2 size={16} />
                    Susun semula
                  </button>
                </div>
              ) : (
                <div className="answer-options">
                  {activity.options.map((option, i) => (
                    <button
                      className={`answer-option ${answer.includes(i) ? "selected" : ""}`}
                      key={option}
                      onClick={() => chosen(i)}
                      role={activity.kind === "multi" ? "checkbox" : "radio"}
                      aria-checked={answer.includes(i)}
                    >
                      <span
                        className={
                          activity.kind === "multi"
                            ? "checkbox-mark"
                            : "radio-mark"
                        }
                      >
                        {answer.includes(i) && <Check size={14} />}
                      </span>
                      {option}
                    </button>
                  ))}
                </div>
              )}
              {feedback === "wrong" && (
                <div className="feedback-error" role="status">
                  Belum tepat. Gunakan petunjuk dan cuba lagi.
                </div>
              )}
              {hint && (
                <p className="hint-box">
                  <Lightbulb size={19} />
                  {activity.hint}
                </p>
              )}
              <div className="dialog-actions">
                <button
                  className="text-button"
                  onClick={() => setHint((h) => !h)}
                >
                  <Lightbulb size={17} />
                  Petunjuk
                </button>
                <PrimaryButton disabled={!ready} onClick={submit}>
                  Semak jawapan
                </PrimaryButton>
              </div>
            </>
          )}
          <button
            className="text-button revisit"
            onClick={() => {
              setPage(0);
              setFeedback(null);
            }}
          >
            <BookOpen size={15} />
            Baca semula penemuan
          </button>
        </>
      )}
    </Modal>
  );
}
