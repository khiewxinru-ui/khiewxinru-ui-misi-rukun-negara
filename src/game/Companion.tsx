import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { assetUrl, type Activity } from "../shared/content";
import type { WorldAssets } from "./assets";

export function Companion({
  activity,
  assets,
  solved,
  reducedMotion,
}: {
  activity: Activity;
  assets: WorldAssets;
  solved: boolean;
  reducedMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const female = /Mei Ling|Asha/.test(activity.speaker);
  const model = useMemo(() => {
    const object =
      assets.companions[female ? "companion-female" : "companion"].scene.clone(
        true,
      );
    const index = activity.id
      .split("")
      .reduce((sum, c) => sum + c.charCodeAt(0), 0);
    object.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        node.material = (node.material as THREE.MeshStandardMaterial).clone();
        if (node.material.name.includes("Cotton"))
          node.material.color.set(
            ["#426f64", "#718690", "#8d7153", "#805f56"][index % 4],
          );
      }
    });
    return object;
  }, [assets, female, activity.id]);
  const legs = model.children.filter((node) =>
    node.name.startsWith("Trouser_leg"),
  );
  const arm = model.getObjectByName("ArmR"),
    head = model.getObjectByName("Head");
  useEffect(
    () => () => {
      model.traverse((node) => {
        if (node instanceof THREE.Mesh)
          (node.material as THREE.Material).dispose();
      });
    },
    [model],
  );
  useFrame(({ clock, camera }) => {
    if (!group.current) return;
    const distance = camera.position.distanceTo(group.current.position);
    if (distance < 7) {
      const angle = Math.atan2(
        camera.position.x - activity.position[0],
        camera.position.z - activity.position[1],
      );
      group.current.rotation.y = angle;
    }
    if (reducedMotion) return;
    const t = clock.elapsedTime;
    const walking = distance > 6;
    group.current.position.x =
      activity.position[0] + (walking ? Math.sin(t * 0.4) * 0.12 : 0);
    legs.forEach((leg, i) => {
      leg.rotation.x = walking ? Math.sin(t * 2.3 + i * Math.PI) * 0.08 : 0;
    });
    group.current.position.y = Math.sin(t * 1.5) * 0.008;
    if (arm)
      arm.rotation.x =
        distance < 4 ? -0.22 + Math.sin(t * 1.3) * 0.14 : Math.sin(t) * 0.025;
    if (head)
      head.rotation.x =
        Math.sin(t * (solved ? 2 : 1)) * (solved ? 0.035 : 0.012);
  });
  return (
    <group
      ref={group}
      position={[activity.position[0], 0, activity.position[1]]}
      rotation={[0, 0, 0]}
    >
      <primitive object={model} />
    </group>
  );
}

export function PictureBoard({ activity }: { activity: Activity }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const visual = activity.visuals[0];
  useEffect(() => {
    if (!visual) return;
    let alive = true;
    const t = new THREE.TextureLoader().load(
      assetUrl(visual.path),
      (loaded) => {
        if (alive) {
          loaded.colorSpace = THREE.SRGBColorSpace;
          setTexture(loaded);
        }
      },
      undefined,
      () => {},
    );
    return () => {
      alive = false;
      t.dispose();
    };
  }, [visual?.path]);
  if (!visual) return null;
  const side = activity.position[0] < 0 ? -1 : 1;
  return (
    <group
      position={[
        activity.position[0] + side * 0.8,
        0,
        activity.position[1] - 0.65,
      ]}
      rotation={[0, side < 0 ? 0.32 : -0.32, 0]}
    >
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 1.8, 12]} />
        <meshStandardMaterial color="#675139" />
      </mesh>
      <mesh position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[1.75, 1.18, 0.1]} />
        <meshStandardMaterial color="#715537" />
      </mesh>
      <mesh position={[0, 1.55, 0.058]}>
        <planeGeometry args={[1.63, 1.03]} />
        <meshStandardMaterial
          key={texture?.uuid || "placeholder"}
          map={texture}
          color={texture ? "#ffffff" : "#e8dfc1"}
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
