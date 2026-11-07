import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  GraduationCap,
  Headphones,
  HelpCircle,
  MapPin,
  Play,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { Activity, Content } from "./shared/content";
import { loadContent } from "./shared/content";
import { audioEngine, type AudioSettings } from "./game/audio";
import { narrationAvailable } from "./game/narration";
import {
  createSave,
  readSave,
  readSettings,
  writeSave,
  writeSettings,
  type Save,
} from "./game/save";
import { Modal, Emblem, PrimaryButton, Settings } from "./components/UI";
import { ActivityDialog } from "./components/ActivityDialog";
const GameView = lazy(() =>
  import("./components/GameView").then((m) => ({ default: m.GameView })),
);
const Editor = lazy(() =>
  import("./components/Editor").then((m) => ({ default: m.Editor })),
);

type Screen =
  "menu" | "character" | "prologue" | "transition" | "game" | "finish";
export default function App() {
  const [content, setContent] = useState<Content | null>(null),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0);
  const [screen, setScreen] = useState<Screen>("menu"),
    [save, setSave] = useState<Save | null>(readSave),
    [settings, setSettings] = useState<AudioSettings>(readSettings);
  const [modal, setModal] = useState<
      "settings" | "help" | "pause" | "journal" | "new" | null
    >(null),
    [activity, setActivity] = useState<Activity | null>(null),
    [intro, setIntro] = useState(false),
    [complete, setComplete] = useState(false),
    [storageError, setStorageError] = useState(false);
  const [name, setName] = useState(""),
    [gender, setGender] = useState<Save["gender"]>("Lelaki"),
    [reflection, setReflection] = useState(""),
    [hash, setHash] = useState(location.hash);
  const current = useRef(save);
  current.current = save;
  useEffect(() => {
    const f = () => setHash(location.hash);
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  useEffect(() => {
    const ctrl = new AbortController(),
      timer = setTimeout(() => ctrl.abort(), 15000);
    setError("");
    loadContent(ctrl.signal)
      .then((c) => {
        setContent(c);
        clearTimeout(timer);
      })
      .catch(() => {
        setError(
          "Kandungan tidak dapat dimuatkan. Semak sambungan dan cuba lagi.",
        );
        clearTimeout(timer);
      });
    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [reload]);
  useEffect(() => {
    audioEngine.update(settings);
    writeSettings(settings);
    document.documentElement.dataset.motion = settings.reducedMotion
      ? "reduced"
      : "full";
  }, [settings]);
  useEffect(() => {
    if (content)
      audioEngine.configure({
        music:
          screen === "finish" || (screen === "game" && save?.mission === 3)
            ? content.soundtrack.mission3
            : screen === "game" && save?.mission === 2
              ? content.soundtrack.mission2
              : content.soundtrack.music,
        ambience: content.soundtrack.ambience,
      });
  }, [content, screen, save?.mission]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.code === "Escape" &&
        screen === "game" &&
        !modal &&
        !activity &&
        !intro &&
        !complete
      ) {
        setModal("pause");
        audioEngine.pause();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [screen, modal, activity, intro, complete]);
  useEffect(() => {
    const f = () => {
      if (document.hidden && screen === "game") {
        setModal("pause");
        audioEngine.pause();
      }
    };
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, [screen]);
  const update = (fn: (s: Save) => Save) => {
    setSave((s) => (s ? fn(s) : s));
  };
  useEffect(() => {
    if (save && !writeSave(save)) setStorageError(true);
  }, [save]);
  const home = () => {
    audioEngine.stopVoice();
    setScreen("menu");
    setModal(null);
    setActivity(null);
    setIntro(false);
    setComplete(false);
  };
  const resumeAudio = () => {
    void audioEngine.unlock();
    setModal(null);
  };
  const start = () => {
    void audioEngine.unlock();
    setScreen("character");
    setModal(null);
  };
  const begin = () => {
    const s = createSave(name.trim(), gender);
    setSave(s);
    if (!writeSave(s)) setStorageError(true);
    setScreen("prologue");
    void audioEngine.unlock();
  };
  const enter = () => {
    audioEngine.stopVoice();
    audioEngine.effect("portal");
    setScreen(settings.reducedMotion ? "game" : "transition");
    if (settings.reducedMotion) setIntro(true);
  };
  useEffect(() => {
    if (screen !== "transition") return;
    const t = setTimeout(() => {
      setScreen("game");
      setIntro(true);
    }, 2200);
    return () => clearTimeout(t);
  }, [screen]);
  const mission = content && save ? content.missions[save.mission - 1] : null;
  const missionDone =
    !!mission && mission.activities.every((a) => save?.solved.includes(a.id));
  useEffect(() => {
    if (screen === "game" && missionDone && !activity && !intro)
      setComplete(true);
  }, [missionDone, activity, intro, screen]);
  const nextMission = () => {
    if (!save) return;
    if (save.mission === 3) {
      update((s) => ({ ...s, finished: true }));
      setComplete(false);
      setScreen("finish");
      audioEngine.effect("success");
      return;
    }
    update((s) => ({ ...s, mission: s.mission + 1, position: [0, 8], yaw: 0 }));
    setComplete(false);
    setIntro(true);
    audioEngine.effect("portal");
  };
  const openActivity = (id: string) => {
    const a = mission?.activities.find((v) => v.id === id);
    if (!a) return;
    if (
      a.id === "sebab" &&
      !mission?.activities
        .filter((v) => v.id !== "sebab")
        .every((v) => save?.solved.includes(v.id))
    ) {
      setModal("journal");
      return;
    }
    setActivity(a);
  };
  if (hash === "#guru")
    return (
      <Suspense
        fallback={<div className="boot-screen">Membuka ruang guru…</div>}
      >
        <Editor
          initialContent={content}
          onHome={() => {
            location.hash = "";
          }}
        />
      </Suspense>
    );
  if (!content)
    return (
      <main className="boot-screen">
        <Emblem />
        <h1>Misi Rukun Negara</h1>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button
              className="primary-button"
              onClick={() => setReload((v) => v + 1)}
            >
              Cuba lagi
            </button>
          </>
        ) : (
          <p>Membuka buku pengembaraan…</p>
        )}
      </main>
    );
  return (
    <div className="app-shell">
      {screen !== "game" && (
        <div
          className={`cinematic-background ${screen === "transition" ? "time-tunnel" : ""}`}
        >
          <div className="background-art" />
          <div className="background-shade" />
          <div className="film-grain" />
        </div>
      )}
      {screen === "menu" && (
        <main className="title-screen">
          <header className="site-header">
            <a className="brand" href="#" aria-label="Misi Rukun Negara">
              <Emblem />
              <span>
                SEBUAH PENGEMBARAAN
                <br />
                <strong>SEJARAH MALAYSIA</strong>
              </span>
            </a>
            <div className="header-right">
              <span className="curriculum-tag">
                SEJARAH <i /> TAHUN 6
              </span>
              <button
                className="round-button"
                aria-label={settings.music ? "Matikan muzik" : "Hidupkan muzik"}
                onClick={() => {
                  void audioEngine.unlock();
                  setSettings((s) => ({ ...s, music: !s.music }));
                }}
              >
                {settings.music ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
            </div>
          </header>
          <section className="hero-copy">
            <span className="eyebrow">
              <span className="gold-line" /> JEJAK SEJARAH. JALINKAN PERPADUAN.
            </span>
            <h1>
              MISI
              <br />
              RUKUN <span>NEGARA</span>
            </h1>
            <p className="hero-subtitle">{content.subtitle}</p>
            <p className="hero-description">
              Sebuah lorong masa. Tiga misi bermakna.
              <br />
              Temui kisah yang menyatukan kita.
            </p>
            <div className="hero-actions">
              <PrimaryButton
                onClick={() =>
                  save && !save.finished ? setModal("new") : start()
                }
              >
                <Play size={16} fill="currentColor" />
                Mula Pengembaraan
              </PrimaryButton>
              {save && (
                <button
                  className="continue-button"
                  onClick={() => {
                    void audioEngine.unlock();
                    setScreen(save.finished ? "finish" : "game");
                  }}
                >
                  <RotateCcw size={17} />
                  {save.finished ? "Lihat pencapaian" : "Sambung Pengembaraan"}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
            <div className="secondary-actions">
              <button onClick={() => setModal("help")}>
                <HelpCircle size={17} />
                Cara Bermain
              </button>
              <span />
              <button onClick={() => setModal("settings")}>
                <Headphones size={17} />
                Tetapan Audio
              </button>
            </div>
          </section>
          <aside className="time-stamp">
            <span>PERJALANAN BERMULA</span>
            <strong>1969</strong>
            <div>
              <span />
              MALAYSIA
            </div>
          </aside>
          <div className="scene-caption">
            <MapPin size={15} />
            <span>
              Sebuah rekonstruksi imaginatif
              <br />
              <strong>Malaysia, penghujung 1960-an</strong>
            </span>
          </div>
          <footer className="title-footer">
            <div className="journey-route">
              <span className="route-dot active" />
              <span>Jejak masa</span>
              <i />
              <span className="route-dot" />
              <span>Temui prinsip</span>
              <i />
              <span className="route-dot" />
              <span>Jadi duta</span>
            </div>
            <span className="footer-note">
              <Compass size={15} /> PENEROKAAN 3D INTERAKTIF
            </span>
            <a href="#guru" className="teacher-link">
              <GraduationCap size={16} />
              Ruang Guru
            </a>
          </footer>
        </main>
      )}
      {screen === "character" && (
        <main className="onboarding">
          <button className="back-button" onClick={home}>
            <ArrowLeft size={18} />
            Menu utama
          </button>
          <div className="onboarding-content">
            <span className="eyebrow">SEBELUM MASA BERPUTAR</span>
            <h1>
              Setiap kisah
              <br />
              bermula dengan <em>kamu.</em>
            </h1>
            <p>Siapakah pengembara kita hari ini?</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim()) begin();
              }}
            >
              <fieldset>
                <legend>Pilih watak</legend>
                <div className="character-options">
                  {(["Lelaki", "Perempuan"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`character-option ${gender === g ? "selected" : ""}`}
                      aria-pressed={gender === g}
                      onClick={() => setGender(g)}
                    >
                      <span
                        className={`avatar-portrait ${g === "Perempuan" ? "female" : ""}`}
                      >
                        <UserRound size={44} strokeWidth={1} />
                      </span>
                      <span>{g}</span>
                      {gender === g && <Check size={17} />}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="name-label" htmlFor="player-name">
                Nama pengembara
              </label>
              <input
                id="player-name"
                autoComplete="off"
                maxLength={30}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama panggilan kamu"
                required
              />
              <p className="fine-print">
                Nama dan kemajuan disimpan pada peranti ini sahaja. Akaun murid
                tidak diperlukan.
              </p>
              <PrimaryButton type="submit" disabled={!name.trim()}>
                Mulakan perjalanan
              </PrimaryButton>
            </form>
          </div>
          <span className="onboarding-number">01 / PERMULAAN</span>
        </main>
      )}
      {screen === "prologue" && (
        <main className="prologue">
          <Emblem />
          <span className="eyebrow">
            SELAMAT DATANG, {save?.name.toLocaleUpperCase("ms")}
          </span>
          <h1>
            Bagaimanakah sebuah
            <br />
            negara menjadi <em>satu?</em>
          </h1>
          <p>{content.introduction}</p>
          <PrimaryButton onClick={enter}>Masuki lorong masa</PrimaryButton>
          <button
            className="text-button light"
            disabled={!narrationAvailable(content.introductionAudio)}
            onClick={() =>
              audioEngine.speak(content.introduction, content.introductionAudio)
            }
          >
            <Volume2 size={17} />
            {narrationAvailable(content.introductionAudio)
              ? "Dengar kisah permulaan"
              : "Audio sedang disemak"}
          </button>
        </main>
      )}
      {screen === "transition" && (
        <div className="transition-copy" role="status">
          <Emblem />
          <span className="eyebrow">MASA SEDANG BERPUTAR</span>
          <h1>Malaysia, 1969</h1>
          <button
            className="text-button light"
            onClick={() => {
              setScreen("game");
              setIntro(true);
            }}
          >
            Langkau animasi
            <ChevronRight size={16} />
          </button>
        </div>
      )}
      {screen === "game" && save && mission && (
        <Suspense
          fallback={
            <div className="boot-screen">Menyediakan pengembaraan…</div>
          }
        >
          <GameView
            content={content}
            save={save}
            settings={settings}
            blocked={!!modal || !!activity || intro || complete}
            onNearChange={() => {}}
            onInteract={openActivity}
            onMove={(position, yaw) => update((s) => ({ ...s, position, yaw }))}
            onPause={() => {
              setModal("pause");
              audioEngine.pause();
            }}
            onJournal={() => setModal("journal")}
            onHome={home}
          />
        </Suspense>
      )}
      {screen === "finish" && save && (
        <main className="finish-screen">
          <span className="finish-medal">
            <Trophy size={46} strokeWidth={1} />
          </span>
          <span className="eyebrow">PENGEMBARAAN SELESAI</span>
          <h1>
            Tahniah, {save.name}.<br />
            Kamu Duta Perpaduan!
          </h1>
          <p>{content.missions[2].conclusion}</p>
          <div className="achievement-row">
            <span>
              <strong>3</strong>Misi diselesaikan
            </span>
            <span>
              <strong>{save.solved.length}</strong>Penemuan direkodkan
            </span>
            <span>
              <strong>5</strong>Prinsip difahami
            </span>
          </div>
          <label htmlFor="reflection">
            Apakah satu tindakan yang boleh kamu lakukan untuk mengukuhkan
            perpaduan dalam kehidupan seharian?
          </label>
          <textarea
            id="reflection"
            maxLength={1000}
            placeholder="Saya akan…"
            value={reflection || save.reflection}
            onChange={(e) => {
              setReflection(e.target.value);
              update((s) => ({ ...s, reflection: e.target.value }));
            }}
          />
          <div className="finish-actions">
            <PrimaryButton onClick={() => setModal("journal")}>
              Lihat buku pengembaraan
            </PrimaryButton>
            <button className="text-button light" onClick={home}>
              Kembali ke menu
            </button>
          </div>
        </main>
      )}
      {screen === "game" &&
        missionDone &&
        !complete &&
        !intro &&
        !activity &&
        !modal && (
          <button
            className="primary-button mission-continue"
            onClick={() => setComplete(true)}
          >
            Buka laluan masa seterusnya
            <ArrowRight size={17} />
          </button>
        )}
      {storageError && (
        <div className="storage-notice" role="alert">
          Pelayar tidak membenarkan simpanan pada peranti. Kemajuan hanya
          tersedia sepanjang sesi ini.
          <button onClick={() => setStorageError(false)}>Tutup</button>
        </div>
      )}
      {modal === "settings" && (
        <Modal title="Sesuaikan pengembaraanmu" onClose={resumeAudio}>
          <Settings value={settings} onChange={setSettings} />
        </Modal>
      )}
      {modal === "help" && (
        <Modal title="Dunia ini menanti kamu" onClose={() => setModal(null)}>
          <p>
            Terokai dunia melalui mata pengembara. Tiada had masa — ikuti
            rentakmu sendiri.
          </p>
          <div className="help-grid">
            <div>
              <Compass />
              <h3>Terokai</h3>
              <p>
                Komputer: W A S D untuk bergerak. Tetikus atau anak panah
                kiri/kanan untuk melihat. Esc melepaskan tetikus.
              </p>
            </div>
            <div>
              <Sparkles />
              <h3>Temui</h3>
              <p>
                Dekati penanda emas. Tekan E atau klik butang interaksi untuk
                memeriksa objek.
              </p>
            </div>
            <div>
              <BookOpen />
              <h3>Fahami</h3>
              <p>
                Baca dialog, selesaikan cabaran dan catat penemuan dalam buku
                pengembaraan.
              </p>
            </div>
          </div>
          <p className="hint-box">
            Telefon dan tablet: gunakan joystick dan leret skrin untuk melihat.
            Jika grafik berat, pilih kualiti rendah dalam tetapan.
          </p>
          <PrimaryButton onClick={() => setModal(null)}>
            Saya bersedia
          </PrimaryButton>
        </Modal>
      )}
      {modal === "new" && (
        <Modal title="Mulakan kisah baharu?" onClose={() => setModal(null)}>
          <p>
            Memulakan pengembaraan baharu akan menggantikan kemajuan{" "}
            {save?.name} pada peranti ini.
          </p>
          <div className="dialog-actions">
            <button
              className="text-button"
              onClick={() => {
                setModal(null);
                setScreen("game");
                void audioEngine.unlock();
              }}
            >
              Sambung kisah sedia ada
            </button>
            <PrimaryButton onClick={start}>Pengembaraan baharu</PrimaryButton>
          </div>
        </Modal>
      )}
      {modal === "pause" && (
        <Modal title="Berehat seketika" onClose={resumeAudio}>
          <p>
            Pengembaraan dijeda. Kemajuan kamu disimpan secara automatik pada
            peranti ini.
          </p>
          <div className="pause-actions">
            <PrimaryButton onClick={resumeAudio}>
              Sambung pengembaraan
            </PrimaryButton>
            <button onClick={() => setModal("journal")}>
              <BookOpen size={18} />
              Buku pengembaraan
            </button>
            <button onClick={() => setModal("settings")}>
              <Settings2 size={18} />
              Tetapan
            </button>
            <button onClick={home}>
              <ArrowLeft size={18} />
              Menu utama
            </button>
          </div>
        </Modal>
      )}
      {modal === "journal" && (
        <Modal title="Buku pengembaraan" onClose={resumeAudio} wide>
          <p className="journal-intro">
            {save?.name || "Pengembara"}, setiap penemuan membawa kita lebih
            dekat kepada perpaduan.
          </p>
          <div className="journal-list">
            {content.missions.map((m) => (
              <section key={m.id}>
                <span className="eyebrow">MISI {m.id}</span>
                <h3>{m.title}</h3>
                {m.activities.map((a) => (
                  <div
                    key={a.id}
                    className={`journal-entry ${save?.solved.includes(a.id) ? "unlocked" : ""}`}
                  >
                    <span>
                      {save?.solved.includes(a.id) ? (
                        <Check size={16} />
                      ) : (
                        <Compass size={16} />
                      )}
                    </span>
                    <div>
                      <strong>{a.label}</strong>
                      <p>
                        {save?.solved.includes(a.id)
                          ? a.feedback
                          : "Petunjuk belum ditemui. Teruskan penerokaan."}
                      </p>
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </Modal>
      )}
      {intro && mission && (
        <Modal title={mission.title} onClose={() => setIntro(false)}>
          <span className="eyebrow">
            MISI {mission.id} · {mission.era}
          </span>
          <p className="dialogue-line">{mission.introduction}</p>
          <PrimaryButton
            onClick={() => {
              setIntro(false);
              void audioEngine.unlock();
            }}
          >
            Terokai kawasan
          </PrimaryButton>
        </Modal>
      )}
      {activity && save && (
        <ActivityDialog
          key={activity.id}
          activity={activity}
          name={save.name}
          alreadySolved={save.solved.includes(activity.id)}
          onClose={() => setActivity(null)}
          onAttempt={() =>
            update((s) => ({
              ...s,
              attempts: {
                ...s.attempts,
                [activity.id]: (s.attempts[activity.id] || 0) + 1,
              },
            }))
          }
          onComplete={() =>
            update((s) => ({
              ...s,
              solved: [...new Set([...s.solved, activity.id])],
            }))
          }
        />
      )}
      {complete && mission && (
        <Modal
          title={
            save?.mission === 3
              ? "Misi terakhir berjaya!"
              : "Laluan masa terbuka"
          }
          onClose={() => setComplete(false)}
        >
          <div className="mission-medal">
            <ShieldCheck size={40} />
          </div>
          <span className="eyebrow">MISI {mission.id} SELESAI</span>
          <p className="dialogue-line">{mission.conclusion}</p>
          <PrimaryButton onClick={nextMission}>
            {save?.mission === 3
              ? "Lengkapkan pengembaraan"
              : "Teruskan ke misi seterusnya"}
          </PrimaryButton>
        </Modal>
      )}
    </div>
  );
}
