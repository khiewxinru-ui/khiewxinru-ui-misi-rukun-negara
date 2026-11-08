import { useEffect } from "react";
import { ExternalLink, ChevronRight } from "lucide-react";
import { audioEngine } from "../game/audio";
export function OpeningVideo({
  url,
  onContinue,
}: {
  url: string;
  onContinue: () => void;
}) {
  const parsed = new URL(url);
  const id =
    parsed.hostname === "youtu.be"
      ? parsed.pathname.slice(1)
      : parsed.searchParams.get("v");
  useEffect(() => {
    audioEngine.pause();
  }, []);
  return (
    <main className="opening-video">
      <span className="eyebrow">KITA BERBEZA. KITA BERSAMA.</span>
      <h1>Kenali Malaysia kita</h1>
      <p>Tonton video. Fikirkan apa yang menyatukan kita.</p>
      <div className="video-frame">
        <iframe
          title="Campur-Campur — video pilihan guru"
          src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&cc_load_policy=1`}
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
      <div className="opening-actions">
        <a href={url} target="_blank" rel="noreferrer">
          <ExternalLink size={18} /> Buka video di YouTube
        </a>
        <button className="primary-button" onClick={onContinue}>
          Teruskan pengembaraan <ChevronRight size={18} />
        </button>
      </div>
      <p className="video-note">
        Jika video tidak dapat dimainkan di sini, buka pautan YouTube. Kembali
        ke sini untuk meneruskan.
      </p>
    </main>
  );
}
