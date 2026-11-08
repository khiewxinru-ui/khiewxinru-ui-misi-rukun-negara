import { useEffect, useState } from "react";
import * as THREE from "three";
import { assetUrl, type Activity } from "../shared/content";
export function SupportingObject({
  activity,
  mission,
  solved,
}: {
  activity: Activity;
  mission: number;
  solved: boolean;
}) {
  const base: [number, number] = [
    activity.position[0],
    activity.position[1] - 0.95,
  ];
  const [flag, setFlag] = useState<THREE.Texture>();
  useEffect(() => {
    if (activity.object !== "flag") return;
    let alive = true;
    const texture = new THREE.TextureLoader().load(
      assetUrl("assets/visuals/jalur-gemilang.svg"),
      (loaded) => {
        if (alive) {
          loaded.colorSpace = THREE.SRGBColorSpace;
          setFlag(loaded);
        }
      },
      undefined,
      () => {},
    );
    return () => {
      alive = false;
      texture.dispose();
    };
  }, [activity.object]);
  const book = activity.object === "book";
  const notice = ["map", "notice"].includes(activity.object);
  return (
    <group position={[base[0], 0, base[1]]}>
      <mesh castShadow position={[0, 0.43, 0]}>
        <cylinderGeometry args={[0.62, 0.72, 0.86, 8]} />
        <meshStandardMaterial
          color={mission === 2 ? "#a9a185" : "#776b4b"}
          roughness={0.95}
        />
      </mesh>
      {activity.object === "radio" ? (
        <group position={[0, 1.15, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.85, 0.65, 0.34]} />
            <meshStandardMaterial color="#6e4026" />
          </mesh>
          <mesh position={[-0.12, 0, 0.18]}>
            <planeGeometry args={[0.45, 0.45]} />
            <meshStandardMaterial color="#c4ad7f" />
          </mesh>
          {[-0.18, 0.12].map((y) => (
            <mesh
              key={y}
              position={[0.28, y, 0.21]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.055, 0.055, 0.07, 12]} />
              <meshStandardMaterial color="#b39653" />
            </mesh>
          ))}
        </group>
      ) : book ? (
        <group position={[0, 0.97, 0]} rotation={[0.15, 0.2, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.82, 0.17, 0.6]} />
            <meshStandardMaterial color="#183f36" />
          </mesh>
          <mesh position={[0, 0.06, 0.01]}>
            <boxGeometry args={[0.76, 0.09, 0.54]} />
            <meshStandardMaterial color="#e4d8ad" />
          </mesh>
        </group>
      ) : notice ? (
        <group position={[0, 1.44, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1, 0.94, 0.12]} />
            <meshStandardMaterial color="#6a4e2d" />
          </mesh>
          <mesh position={[0, 0, 0.07]}>
            <planeGeometry args={[0.86, 0.8]} />
            <meshStandardMaterial color="#d9caa2" />
          </mesh>
          {[-0.2, 0, 0.2].map((y) => (
            <mesh key={y} position={[0, y, 0.08]}>
              <planeGeometry args={[0.62, 0.02]} />
              <meshBasicMaterial color="#65785b" />
            </mesh>
          ))}
        </group>
      ) : activity.object === "lantern" ? (
        <group position={[0, 1.16, 0]}>
          <mesh>
            <cylinderGeometry args={[0.17, 0.23, 0.55, 10]} />
            <meshStandardMaterial
              color="#d9bc77"
              emissive="#c49039"
              emissiveIntensity={0.4}
            />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <coneGeometry args={[0.28, 0.2, 10]} />
            <meshStandardMaterial color="#385448" />
          </mesh>
        </group>
      ) : activity.object === "garden" ? (
        <group>
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.4, 0.25, 0.3, 12]} />
            <meshStandardMaterial color="#a8603a" />
          </mesh>
          {[-0.28, 0, 0.28].map((x) => (
            <group key={x} position={[x, 1.4, 0]}>
              <mesh>
                <cylinderGeometry args={[0.015, 0.02, 0.7, 5]} />
                <meshStandardMaterial color="#4e6c3d" />
              </mesh>
              <mesh position={[0, 0.37, 0]}>
                <sphereGeometry args={[0.13, 8, 6]} />
                <meshStandardMaterial color={solved ? "#e3b86b" : "#a9b58a"} />
              </mesh>
            </group>
          ))}
        </group>
      ) : activity.object === "flag" ? (
        <group>
          <mesh position={[0, 1.8, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 2.2, 8]} />
            <meshStandardMaterial color="#a99f7d" />
          </mesh>
          <mesh position={[0.31, 2.47, 0]}>
            <planeGeometry args={[0.8, 0.4]} />
            <meshStandardMaterial
              key={flag?.uuid || "plain-flag"}
              map={flag}
              color={flag ? "#ffffff" : "#e2d7b7"}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ) : (
        <group position={[0, 1.1, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.7, 0.48, 0.55]} />
            <meshStandardMaterial color="#8a6643" />
          </mesh>
          {[-0.2, 0.2].map((x) => (
            <mesh key={x} position={[x, 0, 0.29]}>
              <boxGeometry args={[0.05, 0.46, 0.02]} />
              <meshStandardMaterial color="#b99c67" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
