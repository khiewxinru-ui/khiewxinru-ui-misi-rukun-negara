import test from "node:test";
import assert from "node:assert/strict";
import { movePlayer } from "../src/game/movement";
test("Slow and fast frames cover the same walking distance", () => {
  let fast: [number, number] = [0, 8];
  for (let i = 0; i < 10; i++) fast = movePlayer(fast, [0, -1], 0.05, []);
  const slow = movePlayer([0, 8], [0, -1], 0.5, []);
  assert.ok(Math.abs(fast[1] - slow[1]) < 1e-9);
  assert.ok(Math.abs(slow[1] - 6.3) < 1e-9);
});
test("Collision substeps prevent crossing an object on a slow frame", () => {
  const result = movePlayer([0, 2], [0, -1], 0.5, [[0, 1]]);
  assert.ok(result[1] >= 2); // Starting beside an object cannot pass through it.
  const outside = movePlayer([0, 4], [0, -1], 0.5, [[0, 2]]);
  assert.ok(outside[1] >= 3.08);
});
test("Walking remains inside the navigable world", () => {
  assert.equal(movePlayer([4.8, -29.7], [1, -1], 0.5, [])[0], 4.85);
  assert.equal(movePlayer([4.8, -29.7], [1, -1], 0.5, [])[1], -29.8);
});
