import { test, expect } from "@playwright/test";

test("A finished journey at the map edge remains resumable after refresh", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "misi-rukun-negara:journey:v1",
      JSON.stringify({
        version: 1,
        name: "Aina",
        gender: "Perempuan",
        mission: 3,
        solved: [],
        attempts: {},
        reflection: "Saya akan membantu jiran.",
        finished: true,
        position: [4.85, -25],
        yaw: 0,
        updatedAt: new Date().toISOString(),
      }),
    );
    localStorage.setItem(
      "misi-rukun-negara:journey:v1:settings",
      JSON.stringify({ volume: "corrupt", lookSensitivity: "corrupt" }),
    );
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Lihat pencapaian" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Lihat pencapaian" }).click();
  await expect(page.getByLabel("Apakah satu tindakan")).toHaveValue(
    "Saya akan membantu jiran.",
  );
});
