/**
 * Nombre:                 compras.spec.js
 * Descripción:            Pruebas E2E del incremento 7 (compras): listado y filtros, registro con varias líneas y total, validaciones de líneas, detalle, anulación solo ADMIN con motivo (CA-COM-01 a 04) y accesibilidad.
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
 * Elige una opción en un buscador (Autocomplete) dentro de un contenedor.
 * @param {import('@playwright/test').Page} page - Página.
 * @param {import('@playwright/test').Locator} combo - Campo del buscador.
 * @param {string} texto - Texto a buscar.
 */
async function elegir(page, combo, texto) {
  await combo.fill(texto);
  await page.getByRole('option', { name: new RegExp(texto) }).first().click();
}

test.describe('Compras como usuario operativo', () => {
  /** @type {Awaited<ReturnType<typeof instalarApiSimulada>>} */
  let api;

  test.beforeEach(async ({ page }) => {
    api = await instalarApiSimulada(page, { sesionInicial: 'operador' });
    await page.goto('/compras');
    await expect(page.getByRole('heading', { level: 1, name: 'Compras' })).toBeVisible();
  });

  test('lista las compras y filtra por estado (RF-COM-004)', async ({ page }) => {
    await expect(page.getByText('COM-000002')).toBeVisible();
    await expect(page.getByText('COM-000001')).toBeVisible();
    await page.getByRole('combobox', { name: 'Estado' }).click();
    await page.getByRole('option', { name: 'Anulada' }).click();
    await expect(page.getByText('No hay compras que coincidan con los filtros.')).toBeVisible();
  });

  test('registra una compra con dos líneas, muestra el total y abre el detalle (CA-COM-01)', async ({ page }) => {
    await page.getByRole('link', { name: 'Nueva compra' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Nueva compra' })).toBeVisible();
    await elegir(page, page.getByRole('combobox', { name: 'Proveedor' }), 'Distribuidora');
    await page.getByLabel('Observación').fill('Factura FV-900');
    const linea1 = page.getByRole('group', { name: 'Línea 1' });
    await elegir(page, linea1.getByRole('combobox', { name: 'Producto' }), 'FER-001');
    await linea1.getByLabel('Cantidad').fill('10');
    await linea1.getByLabel('Costo unitario').fill('500');
    await page.getByRole('button', { name: 'Agregar línea' }).click();
    const linea2 = page.getByRole('group', { name: 'Línea 2' });
    await elegir(page, linea2.getByRole('combobox', { name: 'Producto' }), 'ELE-012');
    await linea2.getByLabel('Cantidad').fill('6,5');
    await linea2.getByLabel('Costo unitario').fill('1000');
    await expect(page.getByTestId('total-compra')).toHaveText(/\$\s?11\.500/);
    await page.getByRole('button', { name: 'Registrar compra' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Compra COM-000003' })).toBeVisible();
    await expect(page.getByText('Compra COM-000003 registrada.')).toBeVisible();
    await expect(page.getByTestId('total-documento')).toHaveText(/\$\s?11\.500/);
    const envio = api.llamadas.find((l) => l.metodo === 'POST' && l.ruta === '/compras');
    expect(envio.cuerpo).toEqual({ proveedorId: 20, observacion: 'Factura FV-900', lineas: [
      { productoId: 10, cantidad: '10', costoUnitario: '500' }, { productoId: 11, cantidad: '6.5', costoUnitario: '1000' }] });
    await expect(page.getByRole('button', { name: 'Anular' })).toHaveCount(0);
  });

  test('valida proveedor, líneas, fracciones y productos repetidos antes de enviar (CA-COM-02)', async ({ page }) => {
    await page.goto('/compras/nueva');
    await page.getByRole('button', { name: 'Registrar compra' }).click();
    await expect(page.getByText('Este campo es obligatorio.')).toHaveCount(4);
    const linea1 = page.getByRole('group', { name: 'Línea 1' });
    await elegir(page, linea1.getByRole('combobox', { name: 'Producto' }), 'FER-001');
    await linea1.getByLabel('Cantidad').fill('1,5');
    await linea1.getByLabel('Costo unitario').fill('100');
    await expect(page.getByText('Use una cantidad entera: este producto no se vende en fracciones.')).toBeVisible();
    await page.getByRole('button', { name: 'Agregar línea' }).click();
    const linea2 = page.getByRole('group', { name: 'Línea 2' });
    await elegir(page, linea2.getByRole('combobox', { name: 'Producto' }), 'FER-001');
    await linea2.getByLabel('Cantidad').fill('0');
    await page.getByRole('button', { name: 'Registrar compra' }).click();
    await expect(page.getByText('El producto ya está en otra línea.').first()).toBeVisible();
    await expect(page.getByText('Ingrese una cantidad mayor que cero, con máximo 3 decimales.')).toBeVisible();
    await page.getByRole('button', { name: 'Quitar la línea 2' }).click();
    await expect(page.getByRole('group', { name: 'Línea 2' })).toHaveCount(0);
    expect(api.llamadas.some((l) => l.metodo === 'POST' && l.ruta === '/compras')).toBe(false);
  });
});

test.describe('Compras como administrador', () => {
  test.beforeEach(async ({ page }) => {
    await instalarApiSimulada(page, { sesionInicial: 'admin' });
  });

  test('anula la última compra con motivo y la anterior queda bloqueada (CA-COM-03, CA-COM-04)', async ({ page }) => {
    await page.goto('/compras/1');
    await page.getByRole('button', { name: 'Anular' }).click();
    let dialogo = page.getByRole('dialog', { name: 'Anular la compra COM-000001' });
    await dialogo.getByLabel('Motivo de la anulación').fill('Factura duplicada');
    await dialogo.getByRole('button', { name: 'Anular documento' }).click();
    await expect(dialogo.getByRole('alert')).toContainText('cambiaron su costo promedio');
    await dialogo.getByRole('button', { name: 'Cancelar' }).click();

    await page.goto('/compras/2');
    await page.getByRole('button', { name: 'Anular' }).click();
    dialogo = page.getByRole('dialog', { name: 'Anular la compra COM-000002' });
    await dialogo.getByRole('button', { name: 'Anular documento' }).click();
    await expect(dialogo.getByText('Este campo es obligatorio.')).toBeVisible();
    await dialogo.getByLabel('Motivo de la anulación').fill('Factura del proveedor duplicada');
    await dialogo.getByRole('button', { name: 'Anular documento' }).click();
    await expect(page.getByText('Compra COM-000002 anulada.')).toBeVisible();
    await expect(page.getByText(/Anulado por admin .* Motivo: Factura del proveedor duplicada/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Anular' })).toHaveCount(0);
    await page.goto('/inventario/10');
    await expect(page.getByText('Existencias actuales')).toContainText('6');
    await expect(page.getByText('Anulación de compra').first()).toBeVisible();
  });

  test('el listado, el formulario y el detalle no tienen violaciones WCAG A/AA detectables', async ({ page }) => {
    const revisar = async () => expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    await page.goto('/compras');
    await expect(page.getByText('COM-000001')).toBeVisible();
    await revisar();
    await page.goto('/compras/nueva');
    await expect(page.getByRole('heading', { level: 1, name: 'Nueva compra' })).toBeVisible();
    await revisar();
    await page.goto('/compras/1');
    await expect(page.getByTestId('total-documento')).toBeVisible();
    await revisar();
  });
});
