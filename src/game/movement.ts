export type Point = readonly [number, number];

/** Substeps preserve collision checks when a frame takes longer on a slow device. */
export function movePlayer(
  position: Point,
  direction: Point,
  delta: number,
  obstacles: readonly Point[],
): [number, number] {
  let [x, z] = position;
  let remaining = Math.min(Math.max(delta, 0), 0.5);
  const collides = (xx: number, zz: number) =>
    obstacles.some(([ox, oz]) => Math.hypot(xx - ox, zz - oz) < 1.08);
  while (remaining > 0.000001) {
    const dt = Math.min(0.04, remaining);
    remaining -= dt;
    const nx = Math.max(-4.85, Math.min(4.85, x + direction[0] * 3.4 * dt));
    const nz = Math.max(-29.8, Math.min(9, z + direction[1] * 3.4 * dt));
    if (!collides(nx, z)) x = nx;
    if (!collides(x, nz)) z = nz;
  }
  return [x, z];
}
