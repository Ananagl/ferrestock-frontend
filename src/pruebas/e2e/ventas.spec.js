/**
 * Nombre:                 ventas.spec.js
 * Descripción:            Pruebas E2E del incremento 8 (ventas y pagos): listado, venta con precio vigente, total y cambio (CA-VEN-01, CA-PAG-01), validaciones de existencias y pago (CA-VEN-02, CA-PAG-02), costos solo ADMIN, anulación (CA-VEN-05, 06) y accesibilidad.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.8.0
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

test.describe('Ventas como usuario operativo', () => {
  /** @type {Awaited<ReturnType<typeof instalarApiSimulada>>} */
  let api;

  test.beforeEach(async ({ page }) => {
    api = await instalarApiSimulada(page, { sesionInicial: 'operador' });
    await page.goto('/ventas/nueva');
    await expect(page.getByRole('heading', { level: 1, name: 'Nueva venta' })).toBeVisible();
  });

  test('confirma una venta con precio vigente, total y cambio, sin enviar el precio (CA-VEN-01, CA-PAG-01)', async ({ page }) => {
    await elegir(page, page.getByRole('combobox', { name: 'Cliente' }), 'Carlos');
    const linea1 = page.getByRole('group', { name: 'Línea 1' });
    await elegir(page, linea1.getByRole('combobox', { name: 'Producto' }), 'ELE-012');
    await expect(linea1.getByText(/Precio: \$\s?2\.500,5/)).toBeVisible();
    await linea1.getByLabel('Cantidad').fill('2');
    await page.getByRole('button', { name: 'Agregar línea' }).click();
    const linea2 = page.getByRole('group', { name: 'Línea 2' });
    await elegir(page, linea2.getByRole('combobox', { name: 'Producto' }), 'FER-001');
    await linea2.getByLabel('Cantidad').fill('1');
    await expect(page.getByTestId('total-venta')).toHaveText(/\$\s?40\.001/);
    await page.getByLabel('Efectivo recibido').fill('50000');
    await expect(page.getByTestId('cambio-venta')).toHaveText(/\$\s?9\.999/);
    await page.getByRole('button', { name: 'Confirmar venta' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Venta VEN-000002' })).toBeVisible();
    await expect(page.getByText(/Venta VEN-000002 confirmada\. Cambio: \$\s?9\.999/)).toBeVisible();
    const envio = api.llamadas.find((l) => l.metodo === 'POST' && l.ruta === '/ventas');
    expect(envio.cuerpo).toEqual({ clienteId: 21, lineas: [{ productoId: 11, cantidad: '2' }, { productoId: 10, cantidad: '1' }],
      pago: { medio: 'EFECTIVO', valorRecibido: '50000' } });
    await expect(page.getByRole('columnheader', { name: 'Costo' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Anular' })).toHaveCount(0);
  });

  test('valida existencias, pago insuficiente y cliente antes de enviar (CA-VEN-02, CA-VEN-04, CA-PAG-02)', async ({ page }) => {
    const linea1 = page.getByRole('group', { name: 'Línea 1' });
    await elegir(page, linea1.getByRole('combobox', { name: 'Producto' }), 'FER-001');
    await linea1.getByLabel('Cantidad').fill('9');
    await page.getByLabel('Efectivo recibido').fill('1000');
    await page.getByRole('button', { name: 'Confirmar venta' }).click();
    await expect(page.getByText('Supera las existencias disponibles (8).')).toBeVisible();
    await expect(page.getByText('El efectivo recibido no cubre el total.')).toBeVisible();
    await expect(page.getByText('Este campo es obligatorio.')).toHaveCount(1);
    expect(api.llamadas.some((l) => l.metodo === 'POST' && l.ruta === '/ventas')).toBe(false);
  });

  test('muestra junto al campo el rechazo del servidor por existencias (CA-VEN-03)', async ({ page }) => {
    await elegir(page, page.getByRole('combobox', { name: 'Cliente' }), 'Carlos');
    const linea1 = page.getByRole('group', { name: 'Línea 1' });
    await elegir(page, linea1.getByRole('combobox', { name: 'Producto' }), 'FER-001');
    await linea1.getByLabel('Cantidad').fill('8');
    await page.getByLabel('Efectivo recibido').fill('280000');
    // Otra caja vendió mientras tanto: el servidor ya solo tiene 2
    await page.route('**/api/v1/ventas', (ruta) => ruta.fulfill({ status: 409, json: { codigo: 'EXISTENCIAS_INSUFICIENTES',
      detail: 'Existencias insuficientes para FER-001: disponibles 2.',
      errores: [{ campo: 'lineas[0].cantidad', mensaje: 'Existencias insuficientes para FER-001: disponibles 2.' }] } }));
    await page.getByRole('button', { name: 'Confirmar venta' }).click();
    await expect(linea1.getByText('Existencias insuficientes para FER-001: disponibles 2.')).toBeVisible();
  });
});

test.describe('Ventas como administrador', () => {
  /** @type {Awaited<ReturnType<typeof instalarApiSimulada>>} */
  let api;

  test.beforeEach(async ({ page }) => {
    api = await instalarApiSimulada(page, { sesionInicial: 'admin' });
  });

  test('ve el costo de las líneas y anula una venta con motivo (CA-VEN-05)', async ({ page, isMobile }) => {
    await page.goto('/ventas');
    await page.getByRole('link', { name: 'Ver detalle VEN-000001' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Venta VEN-000001' })).toBeVisible();
    // En móvil las líneas son tarjetas con etiqueta y valor; en escritorio, una tabla
    if (isMobile) await expect(page.getByRole('list', { name: 'Líneas' }).getByText('Costo', { exact: true })).toBeVisible();
    else await expect(page.getByRole('columnheader', { name: 'Costo' })).toBeVisible();
    await page.getByRole('button', { name: 'Anular' }).click();
    const dialogo = page.getByRole('dialog', { name: 'Anular la venta VEN-000001' });
    await dialogo.getByLabel('Motivo de la anulación').fill('Cliente desistió de la compra');
    await dialogo.getByRole('button', { name: 'Anular documento' }).click();
    await expect(page.getByText('Venta VEN-000001 anulada.')).toBeVisible();
    await expect(page.getByText('Anulada', { exact: true })).toBeVisible();
    await page.goto('/inventario/10');
    await expect(page.getByText('Existencias actuales')).toContainText('11');
  });

  test('una venta con devoluciones no se anula (CA-VEN-06)', async ({ page }) => {
    api.marcarDevolucion(1);
    await page.goto('/ventas/1');
    await page.getByRole('button', { name: 'Anular' }).click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo.getByText('Esta venta tiene devoluciones: el sistema rechazará la anulación.')).toBeVisible();
    await dialogo.getByLabel('Motivo de la anulación').fill('Cliente desistió de la compra');
    await dialogo.getByRole('button', { name: 'Anular documento' }).click();
    await expect(dialogo.getByRole('alert')).toHaveText('La venta tiene devoluciones y no se puede anular.');
  });

  test('el listado, el formulario y el detalle no tienen violaciones WCAG A/AA detectables', async ({ page }) => {
    const revisar = async () => expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    await page.goto('/ventas');
    await expect(page.getByText('VEN-000001')).toBeVisible();
    await revisar();
    await page.goto('/ventas/nueva');
    await expect(page.getByRole('heading', { level: 1, name: 'Nueva venta' })).toBeVisible();
    await revisar();
    await page.goto('/ventas/1');
    await expect(page.getByTestId('total-documento')).toBeVisible();
    await revisar();
  });
});
