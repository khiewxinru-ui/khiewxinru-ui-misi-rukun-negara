import { test, expect } from "./fixtures";

test("Rejected recordings and automatic browser voices stay silent for existing users", async ({
  page,
}) => {
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
