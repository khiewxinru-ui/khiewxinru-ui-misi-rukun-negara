import { test as base, expect, request } from "@playwright/test";

// In managed Cloud, Node trusts the supplied proxy CA while Chromium may not.
// Fetch through the TLS-verifying request client; never disable HTTPS validation.
export const test = base.extend({
  page: async ({ page }, use) => {
    if (process.env.TEST_USE_VERIFIED_PROXY !== "1") {
      await use(page);
      return;
    }
    const target = new URL(process.env.TEST_URL!).origin;
    const upstream = await request.newContext({
      proxy: process.env.HTTPS_PROXY
        ? { server: process.env.HTTPS_PROXY }
        : undefined,
      ignoreHTTPSErrors: false,
    });
    await page.route("**/*", async (route) => {
      if (new URL(route.request().url()).origin !== target)
        return route.fallback();
      const response = await upstream.fetch(route.request(), {
        timeout: 30000,
      });
      await route.fulfill({ response });
    });
    try {
      await use(page);
    } finally {
      await page.unrouteAll({ behavior: "wait" });
      await page.close();
      await upstream.dispose();
    }
  },
});
export { expect };
