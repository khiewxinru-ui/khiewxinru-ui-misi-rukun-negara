import { type Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import { readFileSync } from "node:fs";
import { contentSchema, type Activity } from "../../src/shared/content";
const content = contentSchema.parse(
  JSON.parse(
    readFileSync(
      new URL("../../public/content/game.json", import.meta.url),
      "utf8",
    ),
  ),
);
const KEY = "misi-rukun-negara:journey:v1";
async function start(page: Page, waitForCanvas = true) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "misi-rukun-negara:journey:v1:settings",
      JSON.stringify({
        quality: "low",
        music: true,
        effects: true,
        voice: false,
        subtitles: true,
        reducedMotion: true,
        volume: 0.4,
      }),
    );
  });
  await page.goto("./");
  await page.getByRole("button", { name: "Mula Pengembaraan" }).click();
  await page.getByRole("button", { name: "Perempuan", exact: true }).click();
  await page.getByLabel("Nama pengembara").fill("Aina");
  await page.getByRole("button", { name: "Mulakan perjalanan" }).click();
  await page.getByRole("button", { name: "Masuki lorong masa" }).click();
  await page.getByRole("button", { name: "Mula misi" }).click();
  if (waitForCanvas)
    await expect(
      page.getByRole("main", { name: "Dunia pengembaraan 3D" }),
    ).toHaveAttribute("data-ready", "true", { timeout: 60000 });
}
async function position(page: Page) {
  return page.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(key)!).position as [number, number],
    KEY,
  );
}
async function approach(page: Page, a: Activity) {
  await expect(
    page.getByRole("main", { name: "Dunia pengembaraan 3D" }),
  ).toHaveAttribute("data-ready", "true");
  const side = a.position[0] < 0 ? "KeyA" : "KeyD";
  await page.keyboard.down(side);
  // Walk using the actual controls, observing the persisted checkpoint, without editing progress.
  const target = a.position[0] < 0 ? -1.2 : 1.2;
  await expect
    .poll(
      async () => {
        const [x] = await position(page);
        return a.position[0] < 0 ? x <= target : x >= target;
      },
      { timeout: 30000 },
    )
    .toBe(true);
  await page.keyboard.up(side);
  const button = page.getByRole("button").filter({ hasText: a.label });
  if (!(await button.count())) {
    await page.keyboard.down("KeyW");
    try {
      await expect(button).toBeVisible({ timeout: 60000 });
    } finally {
      await page.keyboard.up("KeyW");
    }
  }
  await button.click();
}
async function solve(page: Page, a: Activity, wrong = false) {
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: a.title, exact: true }),
  ).toBeVisible();
  for (let i = 0; i < a.dialogue.length; i++)
    await dialog
      .getByRole("button", {
        name: i === a.dialogue.length - 1 ? "Mula cabaran" : "Teruskan",
        exact: true,
      })
      .click();
  if (a.kind === "match")
    for (let i = 0; i < a.correct.length; i++)
      await dialog
        .getByLabel(`Padanan: ${a.options[i]}`, { exact: true })
        .selectOption(String(a.correct[i]));
  else if (a.kind === "order")
    for (const i of a.correct)
      await dialog
        .getByRole("button", { name: a.options[i], exact: true })
        .click();
  else {
    if (wrong) {
      const index = a.options.findIndex((_, i) => !a.correct.includes(i));
      await dialog
        .getByRole(a.kind === "multi" ? "checkbox" : "radio", {
          name: a.options[index],
          exact: true,
        })
        .click();
      await dialog.getByRole("button", { name: "Semak jawapan" }).click();
      await expect(
        dialog.getByText("Belum tepat.", { exact: false }),
      ).toBeVisible();
      await dialog
        .getByRole(a.kind === "multi" ? "checkbox" : "radio", {
          name: a.options[index],
          exact: true,
        })
        .click();
    }
    for (const i of a.correct)
      await dialog
        .getByRole(a.kind === "multi" ? "checkbox" : "radio", {
          name: a.options[i],
          exact: true,
        })
        .click();
  }
  await dialog.getByRole("button", { name: "Semak jawapan" }).click();
  await expect(
    dialog.getByText("Petunjuk direkodkan!", { exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Teruskan misi" }).click();
}
test("Student completes the entire three-mission journey and resumes after refresh", async ({
  page,
}) => {
  test.setTimeout(600000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  for (const mission of content.missions) {
    for (const a of mission.activities) {
      await approach(page, a);
      await solve(page, a, a.id === "tuhan");
    }
    console.info(
      `Misi ${mission.id}: semua aktiviti selesai melalui kawalan pemain.`,
    );
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByRole("button", {
        name:
          mission.id === 3
            ? "Lengkapkan pengembaraan"
            : "Teruskan ke misi seterusnya",
      })
      .click({ timeout: 15000 });
    if (mission.id < 3)
      await page.getByRole("button", { name: "Mula misi" }).click();
  }
  await expect(
    page.getByRole("heading", { name: /Tahniah, Aina/ }),
  ).toBeVisible();
  await page
    .getByLabel("Apakah satu tindakan")
    .fill("Saya akan bekerjasama dengan semua rakan.");
  const save = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    KEY,
  );
  expect(save.solved).toHaveLength(16);
  expect(save.finished).toBe(true);
  expect(save.gender).toBe("Perempuan");
  expect(save.attempts.tuhan).toBe(2);
  await page.reload();
  await page.getByRole("button", { name: "Lihat pencapaian" }).click();
  await expect(page.getByLabel("Apakah satu tindakan")).toHaveValue(
    "Saya akan bekerjasama dengan semua rakan.",
  );
  expect(errors).toEqual([]);
});
test("Missing 3D asset shows an error and Retry recovers", async ({ page }) => {
  let fail = true;
  await page.route("**/assets/shophouse.glb", (route) =>
    fail ? route.fulfill({ status: 404, body: "missing" }) : route.fallback(),
  );
  await start(page, false);
  await expect(page.getByRole("alert")).toContainText(
    "Model 3D tidak dapat dimuatkan",
  );
  fail = false;
  await page.getByRole("button", { name: "Cuba lagi", exact: true }).click();
  await expect(page.locator("canvas")).toBeVisible({ timeout: 60000 });
});
test("Local teacher draft can be edited, saved, previewed and recovered without publishing", async ({
  page,
}) => {
  await page.goto("./#guru");
  await page.getByRole("button", { name: /Lihat editor tempatan/ }).click();
  await page
    .getByLabel("Nama produk", { exact: true })
    .fill("MISI RUKUN NEGARA — DRAF");
  await page.getByRole("button", { name: "Simpan draf", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Belum diterbitkan");
  await expect(
    page.getByRole("button", { name: "Terbitkan", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Pratonton 3D" }).click();
  await expect(page.locator("canvas")).toBeVisible({ timeout: 60000 });
  await page.getByRole("button", { name: "Keluar pratonton" }).click();
  await page.reload();
  await page.getByRole("button", { name: /Lihat editor tempatan/ }).click();
  await expect(page.getByLabel("Nama produk", { exact: true })).toHaveValue(
    "MISI RUKUN NEGARA — DRAF",
  );
});
test("Phone layout has no horizontal overflow and supports touch movement", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  const joystick = page.getByRole("group", { name: "Joystick pergerakan" });
  await expect(joystick).toBeVisible();
  const before = await position(page),
    box = await joystick.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2 - 30);
  await page.waitForTimeout(2200);
  await page.mouse.up();
  await page.waitForTimeout(1200);
  const after = await position(page);
  expect(after[1]).toBeLessThan(before[1]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("A completed second mission can continue while audio controls are present", async ({
  page,
}) => {
  const solved = content.missions
    .slice(0, 2)
    .flatMap((m) => m.activities.map((a) => a.id));
  await page.addInitScript((solved) => {
    localStorage.setItem(
      "misi-rukun-negara:journey:v1:settings",
      JSON.stringify({
        voice: false,
        subtitles: true,
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
        mission: 2,
        solved,
        attempts: {},
        reflection: "",
        finished: false,
        position: [0, 8],
        yaw: 0,
        updatedAt: new Date().toISOString(),
      }),
    );
  }, solved);
  await page.goto("./");
  await page
    .getByRole("button", { name: "Sambung Pengembaraan", exact: true })
    .click();
  const next = page.getByRole("button", {
    name: "Teruskan ke misi seterusnya",
  });
  await expect(next).toBeVisible();
  const box = await next.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height - 1);
  await next.click({ timeout: 10000 });
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Duta Perpaduan" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Mula misi", exact: true }),
  ).toBeVisible();
});

for (const viewport of [
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
]) {
  test(`Learning text remains readable and usable at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await start(page);
    const activity = content.missions[0].activities[0];
    await approach(page, activity);
    const dialog = page.getByRole("dialog");
    const reading = dialog.locator(".dialogue-line");
    expect(
      await reading.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(18);
    await expect(reading).toHaveText(
      activity.dialogue[0].replaceAll("{name}", "Aina"),
    );
    for (let i = 0; i < activity.dialogue.length; i++) {
      await dialog
        .getByRole("button", {
          name:
            i === activity.dialogue.length - 1 ? "Mula cabaran" : "Teruskan",
          exact: true,
        })
        .click();
    }
    expect(
      await dialog
        .locator(".task-question")
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(18);
    for (let i = 0; i < activity.correct.length; i++) {
      const select = dialog.getByLabel(`Padanan: ${activity.options[i]}`, {
        exact: true,
      });
      expect(
        await select.evaluate((el) =>
          parseFloat(getComputedStyle(el).fontSize),
        ),
      ).toBeGreaterThanOrEqual(16);
      await select.selectOption(String(activity.correct[i]));
    }
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `/workspace/work/learning-text-${viewport.width}.png`,
    });
    await dialog.getByRole("button", { name: "Semak jawapan" }).click();
    await expect(
      dialog.getByText(activity.feedback, { exact: true }),
    ).toBeVisible();
    await dialog
      .getByRole("button", { name: "Teruskan misi", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
  });
}
