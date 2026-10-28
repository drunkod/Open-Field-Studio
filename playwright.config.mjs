import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests',testMatch:'**/*.spec.mjs',timeout:60000,retries:0,
  use:{browserName:'chromium',headless:true,acceptDownloads:true,viewport:{width:1440,height:1000}},
  reporter:'list',
  webServer: { command:'npm run dev -- --host 127.0.0.1', url:'http://127.0.0.1:3042/', timeout:30000, reuseExistingServer:!process.env.CI },
});
