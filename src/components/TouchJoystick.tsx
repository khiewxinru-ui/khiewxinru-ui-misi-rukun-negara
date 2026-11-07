import {
  useRef,
  useState,
  type MutableRefObject,
  type PointerEvent,
} from "react";
import type { ControlInput } from "../game/World";

export function TouchJoystick({
  input,
}: {
  input: MutableRefObject<ControlInput>;
}) {
  const [point, setPoint] = useState<[number, number]>([0, 0]);
  const active = useRef<number | null>(null);
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (active.current !== e.pointerId) return;
    const box = e.currentTarget.getBoundingClientRect(),
      dx = e.clientX - box.x - box.width / 2,
      dy = e.clientY - box.y - box.height / 2;
    const distance = Math.hypot(dx, dy),
      factor = distance > 35 ? 35 / distance : 1;
    const x = dx * factor,
      z = dy * factor;
    setPoint([x, z]);
    input.current.x = x / 35;
    input.current.z = -z / 35;
  };
  const reset = () => {
    active.current = null;
    input.current.x = 0;
    input.current.z = 0;
    setPoint([0, 0]);
  };
  return (
    <div
      className="touch-joystick"
      role="group"
      aria-label="Joystick pergerakan"
      tabIndex={0}
      onPointerDown={(e) => {
        e.preventDefault();
        active.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={move}
      onPointerUp={reset}
      onPointerCancel={reset}
      onLostPointerCapture={reset}
    >
      <span className="joystick-ring" />
      <span
        className="joystick-nub"
        style={{ transform: `translate(${point[0]}px,${point[1]}px)` }}
      />
      <span className="joystick-label">GERAK</span>
    </div>
  );
}
