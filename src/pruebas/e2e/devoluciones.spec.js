/**
 * Nombre:                 devoluciones.spec.js
 * Descripción:            Pruebas E2E del incremento 9 (devoluciones): devolución desde una venta con líneas aceptadas y rechazadas (CA-DEV-01, 02), límite de lo vendido (CA-DEV-03), devolución sin venta, motivo obligatorio y accesibilidad.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.9.0
 * @file
 */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { instalarApiSimulada } from './utilidades/apiSimulada.js';

/**
 * @param {import('@playwright/test').Page} page - Página.
 * @param {import('@playwright/test').Locator} combo - Buscador.
 * @param {string} texto - Texto a buscar.
 */
async function elegir(page, combo, texto) {
  await combo.fill(texto);
  await page.getByRole('option', { name: new RegExp(texto) }).first().click();
}

test.describe('Devoluciones como usuario operativo', () => {
  /** @type {Awaited<ReturnType<typeof instalarApiSimulada>>} */
  let api;

  test.beforeEach(async ({ page }) => {
    api = await instalarApiSimulada(page, { sesionInicial: 'operador' });
  });

  test('desde la venta registra una devolución aceptada que reingresa al inventario (CA-DEV-01)', async ({ page }) => {
    await page.goto('/ventas/1');
    await page.getByRole('link', { name: 'Registrar devolución' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Nueva devolución' })).toBeVisible();
    const linea1 = page.getByRole('group', { name: 'Línea 1' });
    await expect(linea1.getByRole('combobox', { name: 'Producto' })).toHaveValue('FER-001 — Martillo de uña 16 oz');
    await expect(linea1.getByText('Por devolver: 3')).toBeVisible();
    await linea1.getByLabel('Cantidad').fill('2');
    await page.getByRole('textbox', { name: 'Motivo' }).fill('Producto defectuoso');
    await page.getByRole('button', { name: 'Registrar devolución' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Devolución DEV-000001' })).toBeVisible();
    await expect(page.getByText('Devolución DEV-000001 registrada.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'VEN-000001' })).toBeVisible();
    const envio = api.llamadas.find((l) => l.metodo === 'POST' && l.ruta === '/devoluciones');
    expect(envio.cuerpo).toEqual({ clienteId: 21, ventaId: 1, motivo: 'Producto defectuoso',
      lineas: [{ productoId: 10, cantidad: '2', resultado: 'ACEPTADA' }] });
    await page.goto('/inventario/10');
    await expect(page.getByText('Existencias actuales')).toContainText('10');
  });

  test('no permite devolver más de lo que queda de la venta (CA-DEV-03)', async ({ page }) => {
    await page.goto('/devoluciones/nueva?venta=1');
    const linea1 = page.getByRole('group', { name: 'Línea 1' });
    await linea1.getByLabel('Cantidad').fill('4');
    await page.getByRole('textbox', { name: 'Motivo' }).fill('Producto defectuoso');
    await page.getByRole('button', { name: 'Registrar devolución' }).click();
    await expect(linea1.getByText('Supera lo que queda por devolver (3).')).toBeVisible();
    // Rechazada no reingresa ni cuenta contra lo vendido
    await linea1.getByRole('combobox', { name: 'Resultado' }).click();
    await page.getByRole('option', { name: 'Rechazada' }).click();
    await page.getByRole('button', { name: 'Registrar devolución' }).click();
    await expect(page.getByText('Devolución DEV-000001 registrada.')).toBeVisible();
    await expect(page.getByText('Rechazada').first()).toBeVisible();
  });

  test('registra una devolución sin venta con líneas aceptadas y rechazadas (CA-DEV-02)', async ({ page }) => {
    await page.goto('/devoluciones');
    await page.getByRole('link', { name: 'Nueva devolución' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Nueva devolución' })).toBeVisible();
    await page.getByRole('button', { name: 'Registrar devolución' }).click();
    await expect(page.getByText('Este campo es obligatorio.').first()).toBeVisible();

    await elegir(page, page.getByRole('combobox', { name: 'Cliente' }), 'Carlos');
    await expect(page.getByText(/Sin venta vinculada, las unidades aceptadas/)).toBeVisible();
    await page.getByRole('textbox', { name: 'Motivo' }).fill('Cliente trae unidades sin factura');
    const linea1 = page.getByRole('group', { name: 'Línea 1' });
    await elegir(page, linea1.getByRole('combobox', { name: 'Producto' }), 'ELE-012');
    await linea1.getByLabel('Cantidad').fill('2,5');
    await page.getByRole('button', { name: 'Agregar línea' }).click();
    const linea2 = page.getByRole('group', { name: 'Línea 2' });
    await elegir(page, linea2.getByRole('combobox', { name: 'Producto' }), 'FER-099');
    await linea2.getByLabel('Cantidad').fill('1');
    await linea2.getByRole('combobox', { name: 'Resultado' }).click();
    await page.getByRole('option', { name: 'Rechazada' }).click();
    await page.getByRole('button', { name: 'Registrar devolución' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Devolución DEV-000001' })).toBeVisible();
    await expect(page.getByText('Sin venta vinculada')).toBeVisible();
    await page.goto('/devoluciones');
    await expect(page.getByText('1 aceptada')).toBeVisible();
    await expect(page.getByText('1 rechazada')).toBeVisible();
    await page.goto('/inventario/11');
    await expect(page.getByText('Existencias actuales')).toContainText('90');
  });

  test('el formulario y el listado no tienen violaciones WCAG A/AA detectables', async ({ page }) => {
    const revisar = async () => expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    await page.goto('/devoluciones/nueva?venta=1');
    await expect(page.getByRole('group', { name: 'Línea 1' })).toBeVisible();
    await revisar();
    await page.goto('/devoluciones');
    await expect(page.getByRole('heading', { level: 1, name: 'Devoluciones' })).toBeVisible();
    await revisar();
  });
});
