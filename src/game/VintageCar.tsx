import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Original rounded mid-century compact car, used as distant street scenery. */
export function VintageCar({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const body = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.8, 0.5);
    s.quadraticCurveTo(-1.95, 1, -1.35, 1.08);
    s.lineTo(-0.98, 1.1);
    s.quadraticCurveTo(-0.65, 1.85, -0.2, 1.86);
    s.lineTo(0.48, 1.86);
    s.quadraticCurveTo(0.85, 1.8, 1.12, 1.12);
    s.lineTo(1.6, 1.04);
    s.quadraticCurveTo(1.92, 1, 1.86, 0.54);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 1.25,
      bevelEnabled: true,
      bevelSize: 0.1,
      bevelThickness: 0.1,
      bevelSegments: 5,
      steps: 1,
      curveSegments: 12,
    });
    g.translate(0, 0, -0.625);
    return g;
  }, []);
  useFrame(({ clock }) => {
    if (ref.current && !reducedMotion)
      ref.current.position.z = -34 - ((clock.elapsedTime * 1.2) % 26);
  });
  return (
    <group ref={ref} position={[-1.8, 0, -34]} rotation={[0, Math.PI / 2, 0]}>
      <mesh geometry={body} castShadow>
        <meshStandardMaterial
          color="#b5bc9a"
          roughness={0.35}
          metalness={0.22}
        />
      </mesh>
      {[-1, 1].flatMap((side) =>
        [-1.12, 1.12].map((x) => (
          <group key={`${side}${x}`} position={[x, 0.43, side * 0.72]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.38, 0.38, 0.16, 24]} />
              <meshStandardMaterial color="#282d29" roughness={0.9} />
            </mesh>
            <mesh
              position={[0, 0, side * 0.095]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.23, 0.23, 0.02, 24]} />
              <meshStandardMaterial
                color="#a9aaa0"
                metalness={0.8}
                roughness={0.28}
              />
            </mesh>
          </group>
        )),
      )}
      {[-1, 1].map((side) => (
        <group key={side} position={[0, 0, side * 0.742]}>
          <mesh position={[-0.38, 1.47, 0]}>
            <planeGeometry args={[0.62, 0.47]} />
            <meshStandardMaterial
              color="#485c59"
              metalness={0.35}
              roughness={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0.34, 1.47, 0]}>
            <planeGeometry args={[0.6, 0.47]} />
            <meshStandardMaterial
              color="#485c59"
              metalness={0.35}
              roughness={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0.12, 1.08, 0]}>
            <boxGeometry args={[0.2, 0.035, 0.035]} />
            <meshStandardMaterial color="#bab8a6" metalness={0.7} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[1.83, 0.93, side * 0.43]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <circleGeometry args={[0.12, 20]} />
          <meshStandardMaterial
            color="#e1d3a9"
            emissive="#c8ad69"
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
      {[-1.89, 1.91].map((x) => (
        <mesh key={x} position={[x, 0.48, 0]}>
          <boxGeometry args={[0.1, 0.12, 1.4]} />
          <meshStandardMaterial
            color="#b5b3a1"
            metalness={0.7}
            roughness={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}
