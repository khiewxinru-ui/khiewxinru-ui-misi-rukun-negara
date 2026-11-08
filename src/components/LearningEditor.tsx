import { useState } from "react";
import type { Activity, Content, LearningVisual } from "../shared/content";
import type { AssessmentSection } from "../shared/assessment";
export function VisualEditor({
  activity,
  onChange,
  onUpload,
  disabled,
}: {
  activity: Activity;
  onChange: (value: Partial<Activity>) => void;
  onUpload: (
    file: File,
    kind: "visualImage" | "visualAudio",
    index: number,
  ) => void;
  disabled: boolean;
}) {
  const edit = (index: number, patch: Partial<LearningVisual>) =>
    onChange({
      visuals: activity.visuals.map((v, i) =>
        i === index ? { ...v, ...patch } : v,
      ),
    });
  return (
    <fieldset>
      <legend>Album gambar dan pemerhatian</legend>
      <p>
        Bezakan foto sejarah, ilustrasi dan rekonstruksi. Semak tarikh, lesen
        serta sumber sebelum terbit.
      </p>
      {activity.visuals.map((visual, i) => (
        <details key={i}>
          <summary>
            {i + 1}. {visual.title}
          </summary>
          {(
            [
              "title",
              "caption",
              "alt",
              "path",
              "date",
              "creator",
              "license",
              "sourceUrl",
              "sourceTitle",
            ] as const
          ).map((key) => (
            <label key={key}>
              {
                {
                  title: "Tajuk gambar",
                  caption: "Kapsyen",
                  alt: "Penerangan imej untuk pembaca skrin",
                  path: "Laluan gambar",
                  date: "Tarikh / konteks",
                  creator: "Pencipta / kredit",
                  license: "Lesen penggunaan",
                  sourceUrl: "Pautan sumber HTTPS",
                  sourceTitle: "Nama sumber",
                }[key]
              }
              <input
                value={visual[key]}
                onChange={(e) => edit(i, { [key]: e.target.value })}
              />
            </label>
          ))}
          <label>
            Jenis bahan
            <select
              value={visual.kind}
              onChange={(e) =>
                edit(i, { kind: e.target.value as LearningVisual["kind"] })
              }
            >
              {["Foto sejarah", "Ilustrasi pendidikan", "Rekonstruksi"].map(
                (k) => (
                  <option key={k}>{k}</option>
                ),
              )}
            </select>
          </label>
          <label>
            Penerangan NPC
            <textarea
              value={visual.explanation}
              onChange={(e) =>
                edit(i, { explanation: e.target.value, audio: "" })
              }
            />
          </label>
          <label>
            Laluan audio penerangan
            <input
              value={visual.audio}
              onChange={(e) => edit(i, { audio: e.target.value })}
            />
          </label>
          <label>
            Gantikan gambar
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={disabled}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f, "visualImage", i);
              }}
            />
          </label>
          <label>
            Gantikan audio gambar
            <input
              type="file"
              accept="audio/mpeg,audio/ogg,audio/wav"
              disabled={disabled}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f, "visualAudio", i);
              }}
            />
          </label>
          <button
            className="text-button"
            onClick={() =>
              onChange({ visuals: activity.visuals.filter((_, j) => j !== i) })
            }
          >
            Buang gambar ini
          </button>
        </details>
      ))}
      <button
        className="text-button"
        disabled={activity.visuals.length >= 8}
        onClick={() =>
          onChange({
            visuals: [
              ...activity.visuals,
              {
                id: `gambar-${Date.now()}`,
                title: "Gambar baharu",
                path: "assets/visuals/ekonomi.svg",
                caption: "Isi kapsyen dan sahkan sumber sebelum terbit.",
                alt: "Isi penerangan gambar.",
                kind: "Ilustrasi pendidikan",
                date: "Sahkan tarikh",
                creator: "Sahkan pencipta",
                license: "Sahkan lesen",
                sourceUrl: contentSource,
                sourceTitle: "Sahkan sumber",
                explanation: "Isi penerangan yang berkaitan dengan pelajaran.",
                audio: "",
              },
            ],
          })
        }
      >
        Tambah gambar
      </button>
      {activity.observation && (
        <details>
          <summary>Soalan pemerhatian</summary>
          <label>
            Soalan
            <input
              value={activity.observation.question}
              onChange={(e) =>
                onChange({
                  observation: {
                    ...activity.observation!,
                    question: e.target.value,
                    audio: "",
                  },
                })
              }
            />
          </label>
          <label>
            Pilihan (satu setiap baris)
            <textarea
              value={activity.observation.options.join("\n")}
              onChange={(e) =>
                onChange({
                  observation: {
                    ...activity.observation!,
                    options: e.target.value.split("\n"),
                  },
                })
              }
            />
          </label>
          <label>
            Jawapan
            <select
              value={activity.observation.correct}
              onChange={(e) =>
                onChange({
                  observation: {
                    ...activity.observation!,
                    correct: Number(e.target.value),
                  },
                })
              }
            >
              {activity.observation.options.map((o, i) => (
                <option value={i} key={i}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label>
            Rumusan pemerhatian
            <textarea
              value={activity.observation.feedback}
              onChange={(e) =>
                onChange({
                  observation: {
                    ...activity.observation!,
                    feedback: e.target.value,
                  },
                })
              }
            />
          </label>
          <label>
            Laluan audio soalan
            <input
              value={activity.observation.audio}
              onChange={(e) =>
                onChange({
                  observation: {
                    ...activity.observation!,
                    audio: e.target.value,
                  },
                })
              }
            />
          </label>
        </details>
      )}
    </fieldset>
  );
}
const contentSource = "https://fliphtml5.com/itcew/pnmn/Sejarah_Tahun_6/";
export function LearningSettingsEditor({
  content,
  onChange,
}: {
  content: Content;
  onChange: (patch: Partial<Content>) => void;
}) {
  const [section, setSection] = useState(0);
  const sections = content.finalAssessment;
  const current = sections?.[section];
  const editSection = (patch: Partial<AssessmentSection>) =>
    onChange({
      finalAssessment: sections!.map((s, i) =>
        i === section ? { ...s, ...patch } : s,
      ),
    });
  return (
    <>
      <fieldset>
        <legend>Pembukaan dan objektif</legend>
        <label>
          Objektif (satu setiap baris)
          <textarea
            value={content.learningObjectives.join("\n")}
            onChange={(e) =>
              onChange({ learningObjectives: e.target.value.split("\n") })
            }
          />
        </label>
        <label>
          Pautan video YouTube pilihan pemilik
          <input
            value={content.openingVideo}
            onChange={(e) => onChange({ openingVideo: e.target.value })}
          />
        </label>
        <label>
          Persoalan utama
          <textarea
            value={content.openingQuestion}
            onChange={(e) =>
              onChange({
                openingQuestion: e.target.value,
                openingQuestionAudio: "",
              })
            }
          />
        </label>
        <label>
          Naratif perjalanan
          <textarea
            value={content.openingNarration}
            onChange={(e) =>
              onChange({
                openingNarration: e.target.value,
                openingNarrationAudio: "",
              })
            }
          />
        </label>
        <label>
          Laluan audio persoalan
          <input
            value={content.openingQuestionAudio}
            onChange={(e) => onChange({ openingQuestionAudio: e.target.value })}
          />
        </label>
        <label>
          Laluan audio perjalanan
          <input
            value={content.openingNarrationAudio}
            onChange={(e) =>
              onChange({ openingNarrationAudio: e.target.value })
            }
          />
        </label>
      </fieldset>
      {current && (
        <fieldset>
          <legend>Pentaksiran akhir dan rubrik</legend>
          <label>
            Bahagian
            <select
              value={section}
              onChange={(e) => setSection(Number(e.target.value))}
            >
              {sections!.map((s, i) => (
                <option key={s.id} value={i}>
                  {s.id}: {s.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tajuk
            <input
              value={current.title}
              onChange={(e) => editSection({ title: e.target.value })}
            />
          </label>
          <label>
            Objektif
            <input
              value={current.objective}
              onChange={(e) => editSection({ objective: e.target.value })}
            />
          </label>
          {current.questions.map((q, i) => (
            <details key={q.id}>
              <summary>{q.question}</summary>
              <label>
                Soalan
                <textarea
                  value={q.question}
                  onChange={(e) =>
                    editSection({
                      questions: current.questions.map((n, j) =>
                        i === j ? { ...n, question: e.target.value } : n,
                      ),
                    })
                  }
                />
              </label>
              {(["options", "matches"] as const)
                .filter((k) => k !== "matches" || q.kind === "match")
                .map((k) => (
                  <label key={k}>
                    {k === "options" ? "Pilihan / situasi" : "Padanan"} (satu
                    setiap baris)
                    <textarea
                      value={q[k].join("\n")}
                      onChange={(e) =>
                        editSection({
                          questions: current.questions.map((n, j) =>
                            i === j
                              ? { ...n, [k]: e.target.value.split("\n") }
                              : n,
                          ),
                        })
                      }
                    />
                  </label>
                ))}
              <label>
                Jawapan betul (nombor 1 hingga {q.options.length}, dipisahkan
                koma; ikut susunan jika perlu)
                <input
                  value={q.correct.map((n) => n + 1).join(",")}
                  onChange={(e) =>
                    editSection({
                      questions: current.questions.map((n, j) =>
                        i === j
                          ? {
                              ...n,
                              correct: e.target.value
                                .split(",")
                                .filter((v) => v.trim())
                                .map((v) => Number(v) - 1),
                            }
                          : n,
                      ),
                    })
                  }
                />
              </label>
              {(["feedback", "revision"] as const).map((k) => (
                <label key={k}>
                  {k === "feedback"
                    ? "Penerangan jawapan betul"
                    : "Panduan ulang kaji"}
                  <textarea
                    value={q[k]}
                    onChange={(e) =>
                      editSection({
                        questions: current.questions.map((n, j) =>
                          i === j ? { ...n, [k]: e.target.value } : n,
                        ),
                      })
                    }
                  />
                </label>
              ))}
            </details>
          ))}
          <label>
            Soalan jawapan ringkas
            <textarea
              value={current.writtenPrompt}
              onChange={(e) => editSection({ writtenPrompt: e.target.value })}
            />
          </label>
          <label>
            Rubrik guru (satu kriteria setiap baris)
            <textarea
              value={current.rubric.join("\n")}
              onChange={(e) =>
                editSection({ rubric: e.target.value.split("\n") })
              }
            />
          </label>
          <p>
            Jawapan bertulis memerlukan semakan guru. Skor pilihan tidak
            membuktikan kemahiran menerangkan.
          </p>
        </fieldset>
      )}
    </>
  );
}
