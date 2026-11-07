import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'tests/browser',
  timeout:90000,
  workers:1,
  use:{baseURL:process.env.TEST_URL||'http://127.0.0.1:5173',viewport:{width:1440,height:1000},launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']},screenshot:'only-on-failure',trace:'retain-on-failure'},
  reporter:[['list']],
});
