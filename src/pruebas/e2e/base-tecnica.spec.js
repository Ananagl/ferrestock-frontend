/**
 * Nombre:                 base-tecnica.spec.js
 * Descripción:            Pruebas E2E de humo de la Fase 3: la aplicación carga, muestra el estado del backend (éxito y
 *                         error), cambia de idioma, no tiene violaciones de accesibilidad y no desborda en móvil.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.1.0
 * @file
 */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Simula la respuesta del endpoint de salud para que la prueba no dependa del backend. */
async function simularBackend(page, disponible) {
  await page.route('**/actuator/health', (ruta) => (disponible
    ? ruta.fulfill({ status: 200, json: { status: 'UP' } })
    : ruta.fulfill({ status: 503, json: { status: 'DOWN' } })));
}

test('carga la pantalla base y muestra el backend conectado', async ({ page }) => {
  await simularBackend(page, true);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Base técnica lista' })).toBeVisible();
  await expect(page.getByTestId('estado-backend')).toContainText('Conectado');
});

test('muestra el error y permite reintentar cuando el backend no responde', async ({ page }) => {
  await simularBackend(page, false);
  await page.goto('/');
  await expect(page.getByTestId('estado-backend')).toContainText('Sin conexión');
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible();
});

test('cambia la interfaz a inglés y actualiza el atributo lang (CA-I18N-01)', async ({ page }) => {
  await simularBackend(page, true);
  await page.goto('/');
  await page.getByLabel('Idioma / Language').click();
  await page.getByRole('option', { name: 'English' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Technical base ready' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Technical base ready' })).toBeVisible();
});

test('no tiene violaciones de accesibilidad WCAG A/AA detectables (RNF-USA-03)', async ({ page }) => {
  await simularBackend(page, true);
  await page.goto('/');
  await expect(page.getByTestId('estado-backend')).toContainText('Conectado');
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(resultado.violations).toEqual([]);
});

test('no produce desplazamiento horizontal (RNF-USA-02)', async ({ page }) => {
  await simularBackend(page, true);
  await page.goto('/');
  const desborda = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(desborda).toBe(false);
});
