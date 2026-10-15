/**
 * Nombre:                 playwright.config.js
 * Descripción:            Configuración de Playwright: navegadores de escritorio y móvil, servidor Vite automático
 *                         y reportes. Las pruebas viven en src/pruebas/e2e.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.1.0
 * @file
 */
import { defineConfig, devices } from '@playwright/test';

const URL_BASE = process.env.FS_URL_BASE ?? 'http://localhost:5173';

export default defineConfig({
  testDir: './src/pruebas/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: URL_BASE,
    locale: 'es-CO',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium-escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox-escritorio', use: { ...devices['Desktop Firefox'] } },
    { name: 'chromium-movil', use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env.FS_URL_BASE ? undefined : {
    command: 'npm run dev',
    url: URL_BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
