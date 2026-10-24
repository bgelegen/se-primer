import { defineConfig } from 'cypress';

export default defineConfig({
  reporter: 'junit',
  reporterOptions: { mochaFile: 'cypress/results/[hash].xml', testCaseSwitchClassnameAndName: false },
  e2e: {
    baseUrl: 'http://127.0.0.1:4173',
    viewportWidth: 390,
    viewportHeight: 844,
    video: true,
    videoCompression: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    setupNodeEvents(on) {
      // Demo videosu net olsun diye tarayıcı penceresi 1920×1080.
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'electron') {
          launchOptions.preferences.width = 1920;
          launchOptions.preferences.height = 1080;
        } else if (browser.family === 'chromium') {
          launchOptions.args.push('--window-size=1920,1080', '--force-device-scale-factor=1');
        }
        return launchOptions;
      });
    },
  },
});
