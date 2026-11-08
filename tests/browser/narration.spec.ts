import { test, expect } from "./fixtures";
import { readFileSync } from "node:fs";

test("Rejected recordings and automatic browser voices stay silent for existing users", async ({
  page,
}) => {
  const legacy = JSON.parse(
    readFileSync(
      new URL("../../public/content/game.json", import.meta.url),
      "utf8",
    ),
  );
  legacy.missions[0].activities[0].audio = "assets/voice/rejected.ogg";
  legacy.missions[0].activities[0].narration[0] = "assets/voice/rejected.ogg";
  await page.route("**/content/game.json", (route) =>
    route.fulfill({ json: legacy }),
  );
  let rejectedRequests = 0;
  await page.route("**/assets/voice/**", (route) => {
    rejectedRequests++;
    return route.abort();
  });
  await page.addInitScript(() => {
    (window as unknown as { __ttsCalls: number }).__ttsCalls = 0;
    Object.defineProperty(window.speechSynthesis, "getVoices", {
      value: () => [{ name: "Unreviewed voice", lang: "ms-MY" }],
    });
    Object.defineProperty(window.speechSynthesis, "speak", {
      value: () => {
        (window as unknown as { __ttsCalls: number }).__ttsCalls++;
      },
    });
    localStorage.setItem(
      "misi-rukun-negara:journey:v1:settings",
      JSON.stringify({
        voice: true,
        subtitles: false,
        music: false,
        effects: false,
        quality: "low",
        reducedMotion: true,
      }),
    );
    localStorage.setItem(
      "misi-rukun-negara:journey:v1",
      JSON.stringify({
        version: 1,
        name: "Aina",
        gender: "Perempuan",
        mission: 1,
        solved: [],
        attempts: {},
        reflection: "",
        finished: false,
        position: [-1.5, 4.5],
        yaw: 0,
        updatedAt: new Date().toISOString(),
      }),
    );
  });
  await page.goto("./");
  await page
    .getByRole("button", { name: "Sambung Pengembaraan", exact: true })
    .click();
  await expect(
    page.getByRole("main", { name: "Dunia pengembaraan 3D" }),
  ).toHaveAttribute("data-ready", "true", { timeout: 60000 });
  await page
    .getByRole("button")
    .filter({ hasText: "Peti perdagangan" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/Selamat datang, Aina/)).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Audio sedang disemak" }),
  ).toBeDisabled();
  expect(rejectedRequests).toBe(0);
  expect(
    await page.evaluate(
      () => (window as unknown as { __ttsCalls: number }).__ttsCalls,
    ),
  ).toBe(0);
});

test("Selected male recordings play, pause on Next, and lower music beneath speech", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const objects: HTMLAudioElement[] = [];
    (
      window as unknown as { __recordedAudio: HTMLAudioElement[] }
    ).__recordedAudio = objects;
    const NativeAudio = window.Audio;
    window.Audio = function (src?: string) {
      const a = new NativeAudio(src);
      objects.push(a);
      return a;
    } as unknown as typeof Audio;
    localStorage.setItem(
      "misi-rukun-negara:journey:v1:settings",
      JSON.stringify({
        voice: true,
        subtitles: true,
        music: true,
        effects: false,
        volume: 0.45,
        quality: "low",
        reducedMotion: true,
      }),
    );
    localStorage.setItem(
      "misi-rukun-negara:journey:v1",
      JSON.stringify({
        version: 1,
        name: "Aina",
        gender: "Perempuan",
        mission: 1,
        solved: [],
        attempts: {},
        reflection: "",
        finished: false,
        position: [-1.5, 4.5],
        yaw: 0,
        updatedAt: new Date().toISOString(),
      }),
    );
  });
  await page.goto("./");
  await page
    .getByRole("button", { name: "Sambung Pengembaraan", exact: true })
    .click();
  await expect(
    page.getByRole("main", { name: "Dunia pengembaraan 3D" }),
  ).toHaveAttribute("data-ready", "true", { timeout: 60000 });
  await page
    .getByRole("button")
    .filter({ hasText: "Peti perdagangan" })
    .click();
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const a = (
            window as unknown as { __recordedAudio: HTMLAudioElement[] }
          ).__recordedAudio.find((a) => a.src.includes("narration-osman"));
          return Boolean(a && !a.paused && a.currentTime > 0);
        }),
      { timeout: 30000 },
    )
    .toBe(true);
  const lowered = await page.evaluate(
    () =>
      (
        window as unknown as { __recordedAudio: HTMLAudioElement[] }
      ).__recordedAudio.find((a) => a.src.endsWith("/journey.wav"))!.volume,
  );
  expect(lowered).toBeLessThan(0.45 * 0.24 * 0.6);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Teruskan", exact: true })
    .click();
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const a = (
            window as unknown as { __recordedAudio: HTMLAudioElement[] }
          ).__recordedAudio.filter((a) => a.src.includes("narration-osman"));
          return a.length >= 2 && a[0].paused && a[1].currentTime > 0;
        }),
      { timeout: 30000 },
    )
    .toBe(true);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Tutup", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const a = (window as unknown as { __recordedAudio: HTMLAudioElement[] })
          .__recordedAudio;
        return (
          a
            .filter((a) => a.src.includes("narration-osman"))
            .every((a) => a.paused) &&
          Math.abs(
            a.find((a) => a.src.endsWith("/journey.wav"))!.volume - 0.45 * 0.24,
          ) < 0.001
        );
      }),
    )
    .toBe(true);
});
