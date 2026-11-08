import { useEffect, useState } from "react";
import {
  TextureLoader,
  SRGBColorSpace,
  RepeatWrapping,
  type Texture,
} from "three";
import {
  GLTFLoader,
  type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import { assetUrl } from "../shared/content";

export type WorldAssets = {
  model: GLTF;
  textures: Record<string, Texture>;
  companions: Record<string, GLTF>;
};
export function useWorldAssets(retry: number) {
  const [state, setState] = useState<{
    assets?: WorldAssets;
    progress: number | null;
    bytes: number;
    error?: string;
  }>({ progress: 0, bytes: 0 });
  useEffect(() => {
    const ctrl = new AbortController();
    let alive = true;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      ctrl.abort();
      if (alive)
        setState((s) => ({
          ...s,
          error:
            "Masa memuatkan aset telah tamat. Semak sambungan dan cuba lagi.",
        }));
    }, 30000);
    setState({ progress: 0, bytes: 0 });
    void (async () => {
      const res = await fetch(assetUrl("assets/shophouse.glb"), {
        signal: ctrl.signal,
      });
      if (!res.ok)
        throw new Error(`Model 3D tidak dapat dimuatkan (${res.status}).`);
      const total = Number(res.headers.get("content-length"));
      const reader = res.body?.getReader();
      if (!reader) throw new Error("Pelayar tidak menyokong pemuatan aset.");
      const chunks: Uint8Array[] = [];
      let loaded = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        if (alive)
          setState({
            progress: total > 0 ? Math.min(80, (loaded / total) * 80) : null,
            bytes: loaded,
          });
      }
      const merged = new Uint8Array(loaded);
      let offset = 0;
      for (const c of chunks) {
        merged.set(c, offset);
        offset += c.length;
      }
      const model = await new GLTFLoader().parseAsync(
        merged.buffer,
        assetUrl("assets/"),
      );
      if (ctrl.signal.aborted) return;
      const textures: Record<string, Texture> = {};
      let finished = 0;
      await Promise.all(
        ["road", "stone", "wood"].map(async (name) => {
          const texture = await new TextureLoader().loadAsync(
            assetUrl(`assets/${name}.jpg`),
          );
          texture.colorSpace = SRGBColorSpace;
          texture.wrapS = texture.wrapT = RepeatWrapping;
          textures[name] = texture;
          finished++;
          if (alive && !ctrl.signal.aborted)
            setState({ progress: 80 + (finished / 7) * 20, bytes: loaded });
        }),
      );
      const companions: Record<string, GLTF> = {};
      await Promise.all(
        [
          "companion",
          "companion-female",
          "civic-gallery",
          "community-school",
        ].map(async (name) => {
          const response = await fetch(assetUrl(`assets/${name}.glb`), {
            signal: ctrl.signal,
          });
          if (!response.ok)
            throw new Error(
              `Aset ${name} gagal dimuatkan (${response.status}).`,
            );
          const bytes = await response.arrayBuffer();
          companions[name] = await new GLTFLoader().parseAsync(
            bytes,
            assetUrl("assets/"),
          );
          finished++;
          if (alive && !ctrl.signal.aborted)
            setState({ progress: 80 + (finished / 7) * 20, bytes: loaded });
        }),
      );
      if (alive && !ctrl.signal.aborted)
        setState({
          assets: { model, textures, companions },
          progress: 100,
          bytes: loaded,
        });
      clearTimeout(timer);
    })().catch((e) => {
      clearTimeout(timer);
      if (alive && !timedOut)
        setState((s) => ({
          ...s,
          error: e instanceof Error ? e.message : "Aset gagal dimuatkan.",
        }));
    });
    return () => {
      alive = false;
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [retry]);
  return state;
}
