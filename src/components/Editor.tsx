import { VisualEditor, LearningSettingsEditor } from "./LearningEditor";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Download,
  Eye,
  Github,
  GraduationCap,
  LogOut,
  Plus,
  Save,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { contentSchema, type Activity, type Content } from "../shared/content";
import { Emblem, Modal, PrimaryButton } from "./UI";
import { ActivityDialog } from "./ActivityDialog";
import { createSave } from "../game/save";
import { defaultSettings } from "../game/audio";
const GameView = lazy(() =>
  import("./GameView").then((m) => ({ default: m.GameView })),
);

type Session = { login: string; csrf: string; repository: string };
type Version = { sha: string; login: string; created: string };
const LOCAL_DRAFT = "misi-rukun-negara:teacher-local-draft";
function savedApi() {
  if (import.meta.env.VITE_EDITOR_SAME_ORIGIN === "1")
    return window.location.origin;
  try {
    return (
      localStorage.getItem("mrn:editor-api") ||
      import.meta.env.VITE_EDITOR_API_URL ||
      ""
    );
  } catch {
    return import.meta.env.VITE_EDITOR_API_URL || "";
  }
}

export function Editor({
  initialContent,
  onHome,
}: {
  initialContent: Content | null;
  onHome: () => void;
}) {
  const [api, setApi] = useState(savedApi),
    [session, setSession] = useState<Session | null>(null),
    [local, setLocal] = useState(false),
    [busy, setBusy] = useState(false),
    [content, setContent] = useState<Content | null>(initialContent);
  const [revision, setRevision] = useState(""),
    [selected, setSelected] = useState("overview"),
    [status, setStatus] = useState(""),
    [isError, setIsError] = useState(false),
    [dirty, setDirty] = useState(false),
    [preview, setPreview] = useState(false),
    [versions, setVersions] = useState<Version[] | null>(null),
    [confirmPublish, setConfirmPublish] = useState(false),
    [commit, setCommit] = useState("");
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const uploadInput = useRef<HTMLInputElement>(null);
  const base = api.replace(/\/$/, "");
  async function request<T = Record<string, unknown>>(
    path: string,
    body?: unknown,
  ): Promise<T> {
    const res = await fetch(base + path, {
      method: body === undefined ? "GET" : "POST",
      credentials: "include",
      headers:
        body === undefined
          ? {}
          : {
              "Content-Type": "application/json",
              "X-CSRF-Token": session?.csrf || "",
            },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.error || `Permintaan gagal (${res.status}).`);
    return data as T;
  }
  const message = (text: string, error = false) => {
    setStatus(text);
    setIsError(error);
  };
  useEffect(() => {
    if (!base) return;
    let alive = true;
    const ctrl = new AbortController();
    void fetch(base + "/api/session", {
      credentials: "include",
      signal: ctrl.signal,
    })
      .then(async (r) => {
        if (!r.ok) return;
        const s = (await r.json()) as Session;
        if (alive) setSession(s);
      })
      .catch(() => {
        if (alive)
          message(
            "Backend tidak dapat dihubungi. Semak URL API atau gunakan pratonton tempatan.",
            true,
          );
      });
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [base]);
  useEffect(() => {
    if (!session) return;
    setBusy(true);
    void request<{ content: Content; revision: string }>("/api/draft")
      .then((d) => {
        setContent(contentSchema.parse(d.content));
        setRevision(d.revision);
        setDirty(false);
        message("Draf bersama telah dimuatkan.");
      })
      .catch((e) => message(e.message, true))
      .finally(() => setBusy(false));
  }, [session?.login]);
  useEffect(() => {
    if (!content && initialContent) setContent(initialContent);
  }, [initialContent, content]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty]);
  useEffect(() => {
    if (!commit || !session) return;
    let alive = true;
    let ticks = 0;
    const check = async () => {
      try {
        const d = await request<{
          status: string;
          conclusion: string | null;
          url?: string;
        }>(`/api/deployment/${commit}`);
        if (!alive) return;
        if (d.conclusion === "success") {
          message(
            "GitHub Actions berjaya. Kandungan telah diterbitkan pada URL website yang sama.",
          );
          setCommit("");
        } else if (d.status === "completed") {
          message(
            "Perubahan disimpan di GitHub, tetapi deployment gagal. Semak GitHub Actions.",
            true,
          );
          setCommit("");
        } else if (++ticks > 120) {
          message(
            "Deployment belum disahkan. Semak GitHub Actions untuk status terkini.",
          );
          setCommit("");
        }
      } catch {
        if (alive) {
          message(
            "Status deployment tidak dapat disahkan. Semak GitHub Actions.",
            true,
          );
          setCommit("");
        }
      }
    };
    void check();
    const timer = setInterval(() => void check(), 5000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [commit]);
  const current = content?.missions
    .flatMap((m) => m.activities)
    .find((a) => a.id === selected);
  const change = (fn: (c: Content) => Content) => {
    setContent((c) => (c ? fn(structuredClone(c)) : c));
    setDirty(true);
  };
  const changeActivity = (fields: Partial<Activity>) =>
    change((c) => {
      for (const m of c.missions)
        m.activities = m.activities.map((a) =>
          a.id === selected ? { ...a, ...fields } : a,
        );
      return c;
    });
  const saveDraft = async () => {
    if (!content) return "";
    const validated = contentSchema.safeParse(content);
    if (!validated.success) {
      message(
        "Draf belum sah: " +
          validated.error.issues.map((i) => i.message).join(" "),
        true,
      );
      return "";
    }
    setBusy(true);
    try {
      if (local) {
        localStorage.setItem(LOCAL_DRAFT, JSON.stringify(content));
        setDirty(false);
        message(
          "Draf tempatan disimpan pada peranti ini sahaja. Belum diterbitkan.",
        );
        return "local";
      }
      const d = await request<{ revision: string }>("/api/draft", {
        content,
        revision,
      });
      setRevision(d.revision);
      setDirty(false);
      message("Draf bersama disimpan pada backend. Belum diterbitkan.");
      return d.revision;
    } catch (e) {
      message((e as Error).message, true);
      return "";
    } finally {
      setBusy(false);
    }
  };
  const publish = async () => {
    setConfirmPublish(false);
    const rev = await saveDraft();
    if (!rev || rev === "local") return;
    setBusy(true);
    try {
      const d = await request<{ commit: string; message: string }>(
        "/api/publish",
        { revision: rev },
      );
      setCommit(d.commit);
      message(d.message);
    } catch (e) {
      message((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  };
  const exportContent = () => {
    if (!content) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(content, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "misi-rukun-negara-draft.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importContent = async (file: File) => {
    try {
      if (file.size > 1024 * 1024)
        throw new Error("Fail kandungan melebihi had 1 MB.");
      setContent(contentSchema.parse(JSON.parse(await file.text())));
      setSelected("overview");
      setDirty(true);
      message("Kandungan diimport sebagai draf. Semak sebelum menerbitkan.");
    } catch {
      message(
        "Fail JSON tidak sah atau tidak sepadan dengan struktur permainan.",
        true,
      );
    }
  };
  const upload = async (
    file: File,
    kind:
      | "image"
      | "audio"
      | "music"
      | "ambience"
      | "mission2"
      | "mission3"
      | "intro"
      | "ending"
      | "questionAudio"
      | "feedbackAudio"
      | "hintAudio"
      | "missionIntro"
      | "missionConclusion"
      | "visualImage"
      | "visualAudio",
    dialogueIndex?: number,
  ) => {
    if (
      !session ||
      (!current &&
        [
          "image",
          "audio",
          "questionAudio",
          "feedbackAudio",
          "hintAudio",
        ].includes(kind))
    )
      return;
    const id = current?.id || "overview";
    if (file.size > 6 * 1024 * 1024) {
      message("Had multimedia ialah 6 MB setiap fail.", true);
      return;
    }
    setBusy(true);
    try {
      const body = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const d = await request<{ path: string; preview: string }>("/api/media", {
        mime: file.type,
        body,
      });
      if (
        kind === "music" ||
        kind === "ambience" ||
        kind === "mission2" ||
        kind === "mission3"
      )
        change((c) => {
          c.soundtrack[kind] = d.path;
          return c;
        });
      else if (kind === "intro")
        change((c) => {
          c.introductionAudio = d.path;
          return c;
        });
      else if (kind === "ending")
        change((c) => {
          c.endingAudio = d.path;
          return c;
        });
      else if (kind === "missionIntro" || kind === "missionConclusion")
        change((c) => {
          c.missions[dialogueIndex!][
            kind === "missionIntro" ? "introductionAudio" : "conclusionAudio"
          ] = d.path;
          return c;
        });
      else if (kind === "visualImage" || kind === "visualAudio")
        changeActivity({
          visuals: current!.visuals.map((v, i) =>
            i === dialogueIndex
              ? { ...v, [kind === "visualImage" ? "path" : "audio"]: d.path }
              : v,
          ),
        });
      else if (kind === "audio" && dialogueIndex !== undefined) {
        const narration = [...current!.narration];
        narration[dialogueIndex] = d.path;
        changeActivity({
          narration,
          ...(dialogueIndex === 0 ? { audio: d.path } : {}),
        });
      } else changeActivity({ [kind]: d.path });
      setPreviews((p) => ({ ...p, [id + kind]: d.preview }));
      message(
        "Fail dimuat naik ke storan draf. Simpan dan terbitkan untuk mengemas kini website.",
      );
    } catch (e) {
      message((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  };
  const loadVersions = async () => {
    setBusy(true);
    try {
      const d = await request<{ versions: Version[] }>("/api/versions");
      setVersions(d.versions);
    } catch (e) {
      message((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  };
  const restore = async (sha: string) => {
    setBusy(true);
    try {
      const d = await request<{ content: Content; revision: string }>(
        "/api/restore",
        { sha, revision },
      );
      setContent(contentSchema.parse(d.content));
      setRevision(d.revision);
      setDirty(false);
      setVersions(null);
      message(
        "Versi dipulihkan sebagai draf. Pratonton dan terbitkan untuk mengemas kini website.",
      );
    } catch (e) {
      message((e as Error).message, true);
    } finally {
      setBusy(false);
    }
  };
  if (preview && content)
    return <EditorPreview content={content} onExit={() => setPreview(false)} />;
  return (
    <main className="editor-page">
      <header className="editor-header">
        <div className="editor-brand">
          <Emblem />
          <span>
            Ruang Guru<strong>MISI RUKUN NEGARA</strong>
          </span>
        </div>
        <div className="editor-header-actions">
          {session && (
            <>
              <span className="fine-print">{session.login}</span>
              <button
                className="text-button"
                onClick={() =>
                  void request("/api/logout", {}).then(() => setSession(null))
                }
              >
                <LogOut size={15} />
                Log keluar
              </button>
            </>
          )}
          <button className="text-button" onClick={onHome}>
            <ArrowLeft size={16} />
            Kembali ke permainan
          </button>
        </div>
      </header>
      {!session && !local ? (
        <section className="editor-login">
          <ShieldCheck size={32} strokeWidth={1.3} />
          <span className="eyebrow">UNTUK GURU SAHAJA</span>
          <h1>
            Jaga cerita.
            <br />
            Hidupkan pembelajaran.
          </h1>
          <p>
            Edit teks, dialog, soalan, multimedia dan objek interaktif melalui
            satu ruang. Perubahan yang diterbitkan akan dihantar ke GitHub dan
            dibina semula melalui GitHub Actions.
          </p>
          <div className="editor-banner">
            <ShieldCheck size={20} />
            <span>
              {base
                ? "Log masuk GitHub memerlukan backend OAuth yang telah dikonfigurasi. Hanya akaun guru yang dibenarkan boleh menerbitkan."
                : "Penerbitan guru belum dihubungkan. GitHub Pages memerlukan backend tambahan untuk pengesahan dan penerbitan yang selamat."}
            </span>
          </div>
          {import.meta.env.VITE_EDITOR_SAME_ORIGIN !== "1" && <label htmlFor="api-url">
            URL backend Teacher Editor
            <input id="api-url" type="url" placeholder="https://editor-api.sekolah.edu.my" value={api} onChange={(e) => setApi(e.target.value)} />
          </label>}
          <PrimaryButton
            disabled={!base}
            onClick={() => {
              try {
                const u = new URL(base);
                if (
                  u.protocol !== "https:" &&
                  !["localhost", "127.0.0.1"].includes(u.hostname)
                )
                  throw new Error();
                localStorage.setItem("mrn:editor-api", base);
                location.href = base + "/auth/github";
              } catch {
                message(
                  "Gunakan URL HTTPS yang sah, atau localhost untuk pembangunan.",
                  true,
                );
              }
            }}
          >
            <Github size={17} />
            Log masuk dengan GitHub
          </PrimaryButton>
          {status && (
            <p
              className={`editor-status ${isError ? "error" : ""}`}
              role="status"
            >
              {status}
            </p>
          )}
          <div>
            <button
              className="text-button"
              onClick={() => {
                try {
                  const d = localStorage.getItem(LOCAL_DRAFT);
                  if (d) setContent(contentSchema.parse(JSON.parse(d)));
                } catch {
                  message(
                    "Draf tempatan tidak sah. Kandungan website digunakan.",
                    true,
                  );
                }
                setLocal(true);
              }}
            >
              Lihat editor tempatan · tanpa penerbitan
              <Eye size={15} />
            </button>
          </div>
          <p className="fine-print">
            Mod tempatan hanya untuk mencuba penyuntingan dan pratonton. Ia
            tidak mengubah kandungan semua murid. Panduan backend disertakan
            dalam repository.
          </p>
        </section>
      ) : content ? (
        <div className="editor-layout">
          <aside className="editor-sidebar">
            <button
              className={selected === "overview" ? "active" : ""}
              onClick={() => setSelected("overview")}
            >
              Gambaran keseluruhan
            </button>
            {content.missions.map((m) => (
              <div key={m.id} style={{ display: "contents" }}>
                <h3>MISI {m.id}</h3>
                {m.activities.map((a) => (
                  <button
                    key={a.id}
                    className={selected === a.id ? "active" : ""}
                    onClick={() => setSelected(a.id)}
                  >
                    <span className="mission-label">MISI {m.id}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            ))}
          </aside>
          <section className="editor-main">
            <div className="editor-banner">
              <ShieldCheck size={21} />
              <span>
                {local
                  ? "MOD TEMPATAN — Draf dan pratonton pada peranti ini sahaja. Log masuk melalui backend untuk penerbitan kepada semua murid."
                  : `DRAF BERSAMA — ${session?.repository}. Simpanan draf belum mengubah website murid.`}
              </span>
            </div>
            <span className="eyebrow">PENYUNTINGAN KANDUNGAN</span>
            <h1>{current?.title || "Kisah yang kamu bina"}</h1>
            <p>Semak ketepatan fakta dan jawapan sebelum menerbitkan.</p>
            {current ? (
              <div className="editor-form">
                <label>
                  Nama paparan objek
                  <input
                    value={current.label}
                    onChange={(e) => changeActivity({ label: e.target.value })}
                  />
                </label>
                <label>
                  Tajuk aktiviti
                  <input
                    value={current.title}
                    onChange={(e) => changeActivity({ title: e.target.value })}
                  />
                </label>
                <label>
                  Nama penutur
                  <input
                    value={current.speaker}
                    onChange={(e) =>
                      changeActivity({ speaker: e.target.value })
                    }
                  />
                </label>
                <fieldset>
                  <legend>Dialog · gunakan {"{name}"} untuk nama murid</legend>
                  {current.dialogue.map((d, i) => (
                    <label key={i}>
                      Dialog {i + 1}
                      <textarea
                        value={d}
                        onChange={(e) =>
                          changeActivity({
                            dialogue: current.dialogue.map((s, j) =>
                              i === j ? e.target.value : s,
                            ),
                            narration: current.narration.map((s, j) =>
                              i === j ? "" : s,
                            ),
                            ...(i === 0 ? { audio: "" } : {}),
                          })
                        }
                      />
                      <span className="fine-print">
                        Ganti audio untuk dialog {i + 1}
                      </span>
                      <input
                        type="file"
                        accept="audio/wav,audio/mpeg,audio/ogg"
                        disabled={!session || busy}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void upload(f, "audio", i);
                        }}
                      />
                      {current.dialogue.length > 1 && (
                        <button
                          className="text-button"
                          onClick={() =>
                            changeActivity({
                              dialogue: current.dialogue.filter(
                                (_, j) => j !== i,
                              ),
                              narration: current.narration.filter(
                                (_, j) => j !== i,
                              ),
                              ...(i === 0
                                ? { audio: current.narration[1] || "" }
                                : {}),
                            })
                          }
                        >
                          Buang dialog ini
                        </button>
                      )}
                    </label>
                  ))}
                  <button
                    className="text-button"
                    disabled={current.dialogue.length >= 8}
                    onClick={() =>
                      changeActivity({
                        dialogue: [...current.dialogue, "Dialog baharu."],
                      })
                    }
                  >
                    <Plus size={15} />
                    Tambah dialog
                  </button>
                </fieldset>
                <label>
                  Jenis cabaran
                  <select
                    value={current.kind}
                    onChange={(e) => {
                      const kind = e.target.value as Activity["kind"];
                      changeActivity({
                        kind,
                        correct:
                          kind === "match" || kind === "order"
                            ? current.options.map((_, i) => i)
                            : [0],
                        matches:
                          kind === "match"
                            ? current.options.map((_, i) => `Padanan ${i + 1}`)
                            : [],
                      });
                    }}
                  >
                    <option value="choice">Pilihan tunggal</option>
                    <option value="multi">Pelbagai pilihan</option>
                    <option value="match">Padanan</option>
                    <option value="order">Susunan</option>
                  </select>
                </label>
                <label>
                  Soalan / arahan
                  <textarea
                    value={current.question}
                    onChange={(e) =>
                      changeActivity({
                        question: e.target.value,
                        questionAudio: "",
                      })
                    }
                  />
                </label>
                <fieldset>
                  <legend>Pilihan jawapan</legend>
                  {current.options.map((option, i) => (
                    <div key={i} className="option-editor">
                      <input
                        aria-label={`Pilihan ${i + 1}`}
                        value={option}
                        onChange={(e) =>
                          changeActivity({
                            options: current.options.map((s, j) =>
                              i === j ? e.target.value : s,
                            ),
                          })
                        }
                      />
                      {["choice", "multi"].includes(current.kind) && (
                        <label>
                          <input
                            type="checkbox"
                            checked={current.correct.includes(i)}
                            onChange={() =>
                              changeActivity({
                                correct:
                                  current.kind === "choice"
                                    ? [i]
                                    : current.correct.includes(i)
                                      ? current.correct.filter((v) => v !== i)
                                      : [...current.correct, i],
                              })
                            }
                          />
                          Betul
                        </label>
                      )}
                    </div>
                  ))}
                  {current.kind === "match" &&
                    current.matches.map((m, i) => (
                      <label key={i}>
                        Padanan {i + 1}
                        <input
                          value={m}
                          onChange={(e) =>
                            changeActivity({
                              matches: current.matches.map((s, j) =>
                                i === j ? e.target.value : s,
                              ),
                            })
                          }
                        />
                      </label>
                    ))}
                  {["match", "order"].includes(current.kind) && (
                    <label>
                      {current.kind === "match"
                        ? "Indeks padanan betul bagi setiap pilihan"
                        : "Urutan indeks pilihan yang betul"}{" "}
                      (bermula dari 1, pisahkan dengan koma)
                      <input
                        key={current.id + current.kind}
                        defaultValue={current.correct
                          .map((i) => i + 1)
                          .join(", ")}
                        onBlur={(e) =>
                          changeActivity({
                            correct: e.target.value
                              .split(",")
                              .map((s) => Number(s.trim()) - 1),
                          })
                        }
                      />
                    </label>
                  )}
                </fieldset>
                <label>
                  Maklum balas selepas betul
                  <textarea
                    value={current.feedback}
                    onChange={(e) =>
                      changeActivity({
                        feedback: e.target.value,
                        feedbackAudio: "",
                      })
                    }
                  />
                </label>
                <label>
                  Petunjuk apabila salah
                  <textarea
                    value={current.hint}
                    onChange={(e) =>
                      changeActivity({ hint: e.target.value, hintAudio: "" })
                    }
                  />
                </label>
                {(["questionAudio", "feedbackAudio", "hintAudio"] as const).map(
                  (key) => (
                    <RecordingField
                      key={key}
                      label={
                        {
                          questionAudio: "Audio arahan",
                          feedbackAudio: "Audio jawapan betul",
                          hintAudio: "Audio petunjuk",
                        }[key]
                      }
                      value={current[key]}
                      onChange={(value) => changeActivity({ [key]: value })}
                      disabled={!session || busy}
                      onUpload={(file) => void upload(file, key)}
                    />
                  ),
                )}
                <VisualEditor
                  activity={current}
                  onChange={changeActivity}
                  disabled={!session || busy}
                  onUpload={(file, kind, index) =>
                    void upload(file, kind, index)
                  }
                />
                <fieldset>
                  <legend>Multimedia</legend>
                  <label>
                    Laluan gambar
                    <input
                      placeholder="assets/..."
                      value={current.image}
                      onChange={(e) =>
                        changeActivity({ image: e.target.value })
                      }
                    />
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={!session || busy}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void upload(file, "image");
                      }}
                    />
                  </label>
                  {previews[current.id + "image"] && (
                    <img
                      style={{ maxWidth: 240, maxHeight: 160 }}
                      src={previews[current.id + "image"]}
                      crossOrigin="use-credentials"
                      alt="Pratonton gambar draf"
                    />
                  )}
                  <label>
                    Laluan audio dialog
                    <input
                      placeholder="assets/..."
                      value={current.audio}
                      onChange={(e) =>
                        changeActivity({ audio: e.target.value })
                      }
                    />
                    <input
                      type="file"
                      accept="audio/wav,audio/mpeg,audio/ogg"
                      disabled={!session || busy}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void upload(file, "audio");
                      }}
                    />
                  </label>
                  {previews[current.id + "audio"] && (
                    <audio
                      controls
                      src={previews[current.id + "audio"]}
                      crossOrigin="use-credentials"
                    />
                  )}
                  <p className="fine-print">
                    PNG, JPEG, WebP, WAV, MP3 atau OGG. Had 6 MB. Muat naik
                    memerlukan log masuk backend.
                  </p>
                </fieldset>
                <fieldset>
                  <legend>Objek interaktif dan persekitaran</legend>
                  <label>
                    Bentuk objek
                    <select
                      value={current.object}
                      onChange={(e) =>
                        changeActivity({
                          object: e.target.value as Activity["object"],
                        })
                      }
                    >
                      {[
                        "radio",
                        "map",
                        "crate",
                        "book",
                        "lantern",
                        "flag",
                        "garden",
                        "notice",
                        "bench",
                        "arch",
                      ].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </label>
                  <div className="coordinate-row">
                    <label>
                      Kedudukan X (-4.5 hingga 4.5)
                      <input
                        type="number"
                        min={-4.5}
                        max={4.5}
                        step={0.1}
                        value={current.position[0]}
                        onChange={(e) =>
                          changeActivity({
                            position: [
                              Number(e.target.value),
                              current.position[1],
                            ],
                          })
                        }
                      />
                    </label>
                    <label>
                      Kedudukan Z (-30 hingga 8)
                      <input
                        type="number"
                        min={-30}
                        max={8}
                        step={0.1}
                        value={current.position[1]}
                        onChange={(e) =>
                          changeActivity({
                            position: [
                              current.position[0],
                              Number(e.target.value),
                            ],
                          })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Halaman buku teks
                    <input
                      value={current.page}
                      onChange={(e) => changeActivity({ page: e.target.value })}
                    />
                  </label>
                  <button
                    className="text-button"
                    onClick={() =>
                      change((c) => {
                        for (const m of c.missions)
                          if (m.activities.some((a) => a.id === current.id)) {
                            const copy = {
                              ...structuredClone(current),
                              id: "objek-" + crypto.randomUUID().slice(0, 8),
                              title: "Aktiviti baharu",
                              label: "Objek baharu",
                            };
                            m.activities.push(copy);
                            setSelected(copy.id);
                          }
                        return c;
                      })
                    }
                  >
                    <Plus size={15} />
                    Gandakan sebagai objek baharu
                  </button>
                </fieldset>
              </div>
            ) : (
              <div className="editor-form">
                <label>
                  Nama produk
                  <input
                    value={content.title}
                    onChange={(e) =>
                      change((c) => {
                        c.title = e.target.value;
                        return c;
                      })
                    }
                  />
                </label>
                <label>
                  Subtajuk
                  <input
                    value={content.subtitle}
                    onChange={(e) =>
                      change((c) => {
                        c.subtitle = e.target.value;
                        return c;
                      })
                    }
                  />
                </label>
                <LearningSettingsEditor
                  content={content}
                  onChange={(patch) => change((c) => ({ ...c, ...patch }))}
                />
                <label>
                  Naratif permulaan
                  <textarea
                    value={content.introduction}
                    onChange={(e) =>
                      change((c) => {
                        c.introduction = e.target.value;
                        c.introductionAudio = "";
                        return c;
                      })
                    }
                  />
                </label>
                <fieldset>
                  <legend>Audio pengembaraan</legend>
                  <label>
                    Audio naratif permulaan
                    <input
                      value={content.introductionAudio}
                      onChange={(e) =>
                        change((c) => {
                          c.introductionAudio = e.target.value;
                          return c;
                        })
                      }
                    />
                    <input
                      type="file"
                      accept="audio/wav,audio/mpeg,audio/ogg"
                      disabled={!session || busy}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void upload(f, "intro");
                      }}
                    />
                  </label>
                  {(["music", "ambience", "mission2", "mission3"] as const).map(
                    (k) => (
                      <label key={k}>
                        {
                          {
                            music: "Muzik prolog dan Misi 1",
                            ambience: "Bunyi persekitaran",
                            mission2: "Muzik Misi 2",
                            mission3: "Muzik Misi 3 dan penamat",
                          }[k]
                        }
                        <input
                          value={content.soundtrack[k]}
                          onChange={(e) =>
                            change((c) => {
                              c.soundtrack[k] = e.target.value;
                              return c;
                            })
                          }
                        />
                        <input
                          type="file"
                          accept="audio/wav,audio/mpeg,audio/ogg"
                          disabled={!session || busy}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void upload(f, k);
                          }}
                        />
                      </label>
                    ),
                  )}
                </fieldset>
                {content.missions.map((m, i) => (
                  <fieldset key={m.id}>
                    <legend>Misi {m.id}</legend>
                    {(
                      [
                        "title",
                        "era",
                        "tagline",
                        "introduction",
                        "conclusion",
                      ] as const
                    ).map((k) => (
                      <label key={k}>
                        {
                          {
                            title: "Tajuk",
                            era: "Zaman",
                            tagline: "Slogan",
                            introduction: "Arahan misi",
                            conclusion: "Rumusan misi",
                          }[k]
                        }
                        <textarea
                          value={m[k]}
                          onChange={(e) =>
                            change((c) => {
                              c.missions[i][k] = e.target.value;
                              if (k === "introduction")
                                c.missions[i].introductionAudio = "";
                              if (k === "conclusion") {
                                c.missions[i].conclusionAudio = "";
                                if (i === 2) c.endingAudio = "";
                              }
                              return c;
                            })
                          }
                        />
                      </label>
                    ))}
                    <RecordingField
                      label="Audio arahan misi"
                      value={m.introductionAudio}
                      onChange={(value) =>
                        change((c) => {
                          c.missions[i].introductionAudio = value;
                          return c;
                        })
                      }
                      disabled={!session || busy}
                      onUpload={(file) => void upload(file, "missionIntro", i)}
                    />
                    <RecordingField
                      label="Audio misi selesai"
                      value={m.conclusionAudio}
                      onChange={(value) =>
                        change((c) => {
                          c.missions[i].conclusionAudio = value;
                          return c;
                        })
                      }
                      disabled={!session || busy}
                      onUpload={(file) =>
                        void upload(file, "missionConclusion", i)
                      }
                    />
                  </fieldset>
                ))}
                <RecordingField
                  label="Audio penamat"
                  value={content.endingAudio}
                  onChange={(value) =>
                    change((c) => {
                      c.endingAudio = value;
                      return c;
                    })
                  }
                  disabled={!session || busy}
                  onUpload={(file) => void upload(file, "ending")}
                />
              </div>
            )}
            {status && (
              <div
                className={`editor-status ${isError ? "error" : ""}`}
                role="status"
              >
                {status}
                {commit && session && (
                  <div>
                    <a
                      href={`https://github.com/${session.repository}/actions`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Lihat GitHub Actions ↗
                    </a>
                  </div>
                )}
              </div>
            )}
            <div className="editor-toolbar">
              <button disabled={busy} onClick={() => void saveDraft()}>
                Simpan draf
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  const result = contentSchema.safeParse(content);
                  if (result.success) setPreview(true);
                  else
                    message(
                      "Betulkan kandungan tidak sah sebelum pratonton.",
                      true,
                    );
                }}
              >
                Pratonton 3D
              </button>
              <PrimaryButton
                disabled={!session || busy || !!commit}
                onClick={() => setConfirmPublish(true)}
              >
                {busy ? "Memproses…" : "Terbitkan"}
              </PrimaryButton>
              <button onClick={exportContent} title="Eksport JSON">
                Eksport
              </button>
              <button onClick={() => uploadInput.current?.click()}>
                Import
              </button>
              <button
                disabled={!session || busy}
                onClick={() => void loadVersions()}
              >
                Versi terdahulu
              </button>
              <span>
                {dirty ? "Perubahan belum disimpan" : "Draf tersimpan"}
              </span>
            </div>
            <input
              ref={uploadInput}
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importContent(file);
                e.target.value = "";
              }}
            />
          </section>
        </div>
      ) : (
        <div className="editor-main">
          <p>Menunggu kandungan…</p>
        </div>
      )}
      {confirmPublish && (
        <Modal
          title="Terbitkan perubahan ini?"
          onClose={() => setConfirmPublish(false)}
        >
          <p>
            Kandungan dan multimedia draf akan dihantar ke{" "}
            <strong>{session?.repository}</strong>. GitHub Actions akan membina
            semula website pada URL yang sama.
          </p>
          <p>
            Pastikan fakta sejarah dan jawapan telah disemak, serta pratonton
            telah diuji.
          </p>
          <PrimaryButton onClick={() => void publish()}>
            Simpan dan terbitkan
          </PrimaryButton>
        </Modal>
      )}
      {versions && (
        <Modal
          title="Versi penerbitan terdahulu"
          onClose={() => setVersions(null)}
        >
          <p>
            Pemulihan mengembalikan kandungan sebagai draf. Ia tidak menerbitkan
            secara automatik.
          </p>
          <div className="version-list">
            {versions.length ? (
              versions.map((v) => (
                <div key={v.sha}>
                  <span>
                    {new Date(v.created).toLocaleString("ms-MY")}
                    <br />
                    {v.login} · {v.sha.slice(0, 7)}
                  </span>
                  <button disabled={busy} onClick={() => void restore(v.sha)}>
                    Pulihkan draf
                  </button>
                </div>
              ))
            ) : (
              <p>Belum ada penerbitan melalui editor ini.</p>
            )}
          </div>
        </Modal>
      )}
    </main>
  );
}

function EditorPreview({
  content,
  onExit,
}: {
  content: Content;
  onExit: () => void;
}) {
  const [save, setSave] = useState(() => createSave("Guru", "Perempuan")),
    [activity, setActivity] = useState<Activity | null>(null);
  return (
    <>
      <Suspense
        fallback={<div className="boot-screen">Memuatkan pratonton…</div>}
      >
        <GameView
          key={save.mission}
          content={content}
          save={save}
          settings={{ ...defaultSettings, music: false, voice: false }}
          blocked={!!activity}
          onNearChange={() => {}}
          onInteract={(id) =>
            setActivity(
              content.missions[save.mission - 1].activities.find(
                (a) => a.id === id,
              ) || null,
            )
          }
          onMove={(position, yaw) => setSave((s) => ({ ...s, position, yaw }))}
          onPause={onExit}
          onJournal={() => {}}
          onHome={onExit}
        />
      </Suspense>
      <div
        style={{
          position: "fixed",
          top: 75,
          right: 20,
          zIndex: 10,
          display: "flex",
          gap: 10,
        }}
      >
        <select
          aria-label="Misi pratonton"
          value={save.mission}
          onChange={(e) =>
            setSave((s) => ({
              ...s,
              mission: Number(e.target.value),
              position: [0, 8],
              yaw: 0,
            }))
          }
        >
          {content.missions.map((m) => (
            <option value={m.id} key={m.id}>
              Misi {m.id}
            </option>
          ))}
        </select>
        <button className="primary-button" onClick={onExit}>
          Keluar pratonton
        </button>
      </div>
      {activity && (
        <ActivityDialog
          key={activity.id}
          activity={activity}
          name="Guru"
          alreadySolved={save.solved.includes(activity.id)}
          onClose={() => setActivity(null)}
          onObservation={() => {}}
          onAttempt={() => {}}
          onComplete={() =>
            setSave((s) => ({
              ...s,
              solved: [...new Set([...s.solved, activity.id])],
            }))
          }
        />
      )}
    </>
  );
}

function RecordingField({
  label,
  value,
  onChange,
  onUpload,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onUpload: (file: File) => void;
  disabled: boolean;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <label>
        Laluan {label.toLowerCase()}
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
      <input
        type="file"
        aria-label={`Muat naik ${label.toLowerCase()}`}
        accept="audio/wav,audio/mpeg,audio/ogg"
        disabled={disabled}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
        }}
      />
    </fieldset>
  );
}
