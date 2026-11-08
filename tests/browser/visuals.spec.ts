import { test, expect } from "./fixtures";
import { readFileSync } from "node:fs";
import { contentSchema } from "../../src/shared/content";
const content = contentSchema.parse(
  JSON.parse(
    readFileSync(
      new URL("../../public/content/game.json", import.meta.url),
      "utf8",
    ),
  ),
);
const KEY = "misi-rukun-negara:journey:v1";
async function seed(
  page: import("@playwright/test").Page,
  mission = 1,
  finished = false,
) {
  await page.addInitScript(
    ({ mission, finished, KEY }) => {
      if (!localStorage.getItem(KEY + ":settings"))
        localStorage.setItem(
          KEY + ":settings",
          JSON.stringify({
            quality: "low",
            voice: false,
            music: false,
            effects: false,
            subtitles: true,
            reducedMotion: true,
          }),
        );
      if (!localStorage.getItem(KEY))
        localStorage.setItem(
          KEY,
          JSON.stringify({
            version: 1,
            name: "Aina",
            gender: "Perempuan",
            mission,
            solved: [],
            attempts: {},
            reflection: "",
            finished,
            position: [-1.5, 4.5],
            yaw: 0,
            updatedAt: new Date().toISOString(),
          }),
        );
    },
    { mission, finished, KEY },
  );
}
test("NPC album supports credited historical images, zoom focus, retry and saved observation", async ({
  page,
}) => {
  await seed(page);
  await page.addInitScript(() => {
    if (window.top !== window) return;
    const NativeAudio = window.Audio;
    const objects: HTMLAudioElement[] = [];
    (
      window as unknown as { __visualVoices: HTMLAudioElement[] }
    ).__visualVoices = objects;
    window.Audio = function (src?: string) {
      const element = new NativeAudio(src);
      objects.push(element);
      return element;
    } as unknown as typeof Audio;
  });
  let fail = true;
  await page.route("**/assets/visuals/ekonomi.svg*", (route) =>
    fail ? route.fulfill({ status: 404, body: "missing" }) : route.fallback(),
  );
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
  const dialog = page.getByRole("dialog").first();
  await expect(dialog.getByRole("alert")).toContainText(
    "Gambar tidak dapat dimuatkan",
  );
  fail = false;
  await dialog.getByRole("button", { name: "Cuba lagi", exact: true }).click();
  await expect
    .poll(() =>
      dialog
        .locator(".visual-image-button img")
        .evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0),
    )
    .toBe(true);
  await dialog
    .getByRole("button", { name: "Menoreh getah, sekitar 1910", exact: true })
    .click();
  await dialog
    .getByRole("button", {
      name: "Besarkan gambar: Menoreh getah, sekitar 1910",
      exact: true,
    })
    .click();
  const zoom = page.getByRole("dialog", {
    name: "Menoreh getah, sekitar 1910",
    exact: true,
  });
  await expect(zoom).toBeVisible();
  await expect(zoom).toContainText("bukan pada 1969");
  await expect(
    zoom.getByRole("button", { name: "Tutup gambar besar" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(zoom).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await dialog.getByText("Sumber dan kredit", { exact: true }).click();
  await expect(dialog.getByRole("link")).toHaveAttribute(
    "href",
    /commons.wikimedia.org/,
  );
  await dialog
    .getByRole("button", { name: "Dengar penerangan gambar", exact: true })
    .click();
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const audio = (
            window as unknown as { __visualVoices: HTMLAudioElement[] }
          ).__visualVoices.find((a) => a.src.includes("ekonomi-visual-2"));
          return Boolean(audio && !audio.paused && audio.currentTime > 0);
        }),
      { timeout: 15000 },
    )
    .toBe(true);
  const a = content.missions[0].activities[0];
  for (let i = 0; i < a.dialogue.length; i++)
    await dialog
      .getByRole("button", {
        name: i === a.dialogue.length - 1 ? "Mula cabaran" : "Teruskan",
        exact: true,
      })
      .click();
  const inquiry = dialog.getByRole("region", { name: "Soalan pemerhatian" });
  await inquiry
    .getByRole("radio", { name: a.observation!.options[1], exact: true })
    .click();
  await inquiry.getByRole("button", { name: "Semak pemerhatian" }).click();
  await expect(inquiry.getByRole("status")).toContainText("Cuba jawapan lain");
  await inquiry
    .getByRole("radio", {
      name: a.observation!.options[a.observation!.correct],
      exact: true,
    })
    .click();
  await inquiry.getByRole("button", { name: "Semak pemerhatian" }).click();
  await inquiry
    .getByLabel("Catatan kamu")
    .fill("Saya melihat kegiatan ekonomi berbeza.");
  await inquiry.getByRole("button", { name: "Teruskan cabaran" }).click();
  await expect
    .poll(() =>
      page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key)!).observations.ekonomi?.note,
        KEY,
      ),
    )
    .toBe("Saya melihat kegiatan ekonomi berbeza.");
});
for (const mission of [1, 2, 3])
  test(`Mission ${mission} renders its own setting and human NPCs`, async ({
    page,
  }) => {
    await seed(page, mission);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("./");
    await page
      .getByRole("button", { name: "Sambung Pengembaraan", exact: true })
      .click();
    await expect(
      page.getByRole("main", { name: "Dunia pengembaraan 3D" }),
    ).toHaveAttribute("data-ready", "true", { timeout: 60000 });
    await expect(
      page
        .getByRole("button")
        .filter({ hasText: content.missions[mission - 1].activities[0].label }),
    ).toContainText("BERCAKAP");
    await page.waitForTimeout(600);
    await page.screenshot({
      path: `/workspace/work/visual-world-${mission}.png`,
    });
    expect(errors).toEqual([]);
  });
test("Partial final assessment and ungraded writing survive refresh without corrupting the journey", async ({
  page,
}) => {
  await seed(page, 3, true);
  await page.goto("./");
  await page
    .getByRole("button", { name: "Lihat pencapaian", exact: true })
    .click();
  await page.getByRole("button", { name: "Buka pentaksiran akhir" }).click();
  await page.getByRole("button", { name: "Bahagian B", exact: true }).click();
  const section = content.finalAssessment![1];
  const q = section.questions[0];
  await page
    .getByLabel(q.options[4], { exact: true })
    .selectOption(String(q.correct[4]));
  await page
    .getByLabel(section.writtenPrompt, { exact: true })
    .fill("Masyarakat progresif menggunakan sains dan teknologi.");
  await page.reload();
  await page
    .getByRole("button", { name: "Lihat pencapaian", exact: true })
    .click();
  await page.getByRole("button", { name: "Buka pentaksiran akhir" }).click();
  await page.getByRole("button", { name: "Bahagian B", exact: true }).click();
  await expect(page.getByLabel(q.options[4], { exact: true })).toHaveValue(
    String(q.correct[4]),
  );
  await expect(page.getByLabel(q.options[0], { exact: true })).toHaveValue(
    "-1",
  );
  await expect(
    page.getByLabel(section.writtenPrompt, { exact: true }),
  ).toHaveValue("Masyarakat progresif menggunakan sains dan teknologi.");
  await page.getByRole("button", { name: "Bahagian C", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Semak pentaksiran", exact: true }),
  ).toBeDisabled();
});

test("Owner-selected opening video keeps the correct embed URL, original link and usable fallback", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "misi-rukun-negara:journey:v1:settings",
      JSON.stringify({
        voice: false,
        music: false,
        effects: false,
        quality: "low",
        reducedMotion: true,
      }),
    ),
  );
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.abort(),
  );
  await page.goto("./");
  await page
    .getByRole("button", { name: "Mula Pengembaraan", exact: true })
    .click();
  await page.getByLabel("Nama pengembara").fill("Aina");
  await page.getByRole("button", { name: "Mulakan perjalanan" }).click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "src",
    "https://www.youtube-nocookie.com/embed/2FgimpUv8q8?rel=0&cc_load_policy=1",
  );
  await expect(
    page.getByRole("link", { name: "Buka video di YouTube" }),
  ).toHaveAttribute("href", content.openingVideo);
  await page
    .getByRole("button", { name: "Teruskan pengembaraan", exact: true })
    .click();
  await expect(
    page.getByText(content.openingQuestion, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Masuki lorong masa" }),
  ).toBeVisible();
});

test("NPC animation runs in the gallery and reduced motion freezes it", async ({
  page,
}) => {
  await seed(page, 2);
  await page.goto("./");
  await page.evaluate((key) => {
    const settings = JSON.parse(localStorage.getItem(key + ":settings")!);
    settings.reducedMotion = false;
    localStorage.setItem(key + ":settings", JSON.stringify(settings));
  }, KEY);
  await page.reload();
  await page
    .getByRole("button", { name: "Sambung Pengembaraan", exact: true })
    .click();
  await expect(
    page.getByRole("main", { name: "Dunia pengembaraan 3D" }),
  ).toHaveAttribute("data-ready", "true", { timeout: 60000 });
  await page.waitForTimeout(1500);
  const first = await page.locator("canvas").screenshot();
  await page.waitForTimeout(1000);
  const second = await page.locator("canvas").screenshot();
  expect(first.equals(second)).toBe(false);
  await page.evaluate((key) => {
    const settings = JSON.parse(localStorage.getItem(key + ":settings")!);
    settings.reducedMotion = true;
    localStorage.setItem(key + ":settings", JSON.stringify(settings));
  }, KEY);
  await page.reload();
  await page
    .getByRole("button", { name: "Sambung Pengembaraan", exact: true })
    .click();
  await expect(
    page.getByRole("main", { name: "Dunia pengembaraan 3D" }),
  ).toHaveAttribute("data-ready", "true", { timeout: 60000 });
  await page.waitForTimeout(1500);
  const still = await page.locator("canvas").screenshot();
  await page.waitForTimeout(1000);
  expect(still.equals(await page.locator("canvas").screenshot())).toBe(true);
});
