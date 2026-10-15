/**
 * Nombre:                 ajustes.spec.js
 * Descripción:            Pruebas E2E del incremento 6 (ajustes): acceso solo ADMIN (CA-AJU-02), historial con motivo y responsable, ajuste de salida (CA-AJU-01), inventario inicial, validaciones del formulario (CA-AJU-03, 04), enlace desde el kardex, accesibilidad y móvil.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.7.0
 * @file
 */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { instalarApiSimulada } from './utilidades/apiSimulada.js';

/**
 * Elige un producto en el buscador del diálogo.
 * @param {import('@playwright/test').Locator} dialogo - Diálogo del ajuste.
 * @param {string} codigo - Código del producto.
 */
async function elegirProducto(dialogo, codigo) {
  await dialogo.getByRole('combobox', { name: 'Producto' }).fill(codigo);
  await dialogo.page().getByRole('option', { name: new RegExp(codigo) }).click();
}

test('el usuario operativo no ve la opción de ajustes y la ruta le muestra acceso denegado (CA-AJU-02)', async ({ page }) => {
  await instalarApiSimulada(page, { sesionInicial: 'operador' });
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Ajustes' })).toHaveCount(0);
  await page.goto('/ajustes');
  await expect(page.getByRole('heading', { level: 1, name: 'Acceso denegado' })).toBeVisible();
  await page.goto('/inventario/10');
  await expect(page.getByRole('link', { name: 'Registrar ajuste' })).toHaveCount(0);
});

test.describe('Ajustes como administrador', () => {
  /** @type {Awaited<ReturnType<typeof instalarApiSimulada>>} */
  let api;

  test.beforeEach(async ({ page }) => {
    api = await instalarApiSimulada(page, { sesionInicial: 'admin' });
    await page.goto('/ajustes');
    await expect(page.getByRole('heading', { level: 1, name: 'Ajustes de inventario' })).toBeVisible();
  });

  test('el historial muestra motivo y responsable, y filtra por tipo (RF-AJU-004)', async ({ page }) => {
    await expect(page.getByText('Unidad dañada en bodega')).toBeVisible();
    await expect(page.getByText('FER-001').first()).toBeVisible();
    await page.getByRole('combobox', { name: 'Tipo' }).click();
    await page.getByRole('option', { name: 'Entrada', exact: true }).click();
    await expect(page.getByText('No hay ajustes que coincidan con los filtros.')).toBeVisible();
  });

  test('registra una salida con motivo y muestra el efecto antes de guardar (CA-AJU-01)', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo ajuste' }).click();
    const dialogo = page.getByRole('dialog', { name: 'Nuevo ajuste de inventario' });
    await elegirProducto(dialogo, 'FER-001');
    await dialogo.getByRole('button', { name: 'Unidad dañada en bodega' }).click();
    await expect(dialogo.getByRole('radio', { name: 'Salida' })).toBeChecked();
    await expect(dialogo.getByLabel('Costo unitario')).toHaveCount(0);
    await dialogo.getByLabel('Cantidad').fill('1');
    await expect(dialogo.getByTestId('efecto-ajuste')).toContainText('de 8 a 7');
    await dialogo.getByRole('button', { name: 'Registrar ajuste' }).click();

    await expect(page.getByText('Ajuste AJU-000002 registrado. Existencias de FER-001: 7.')).toBeVisible();
    await expect(dialogo).toHaveCount(0);
    const envio = api.llamadas.find((l) => l.metodo === 'POST' && l.ruta === '/ajustes');
    expect(envio.cuerpo).toEqual({ productoId: 10, tipo: 'SALIDA', cantidad: '1', costoUnitario: null,
      motivo: 'Unidad dañada en bodega' });
    await page.goto('/inventario/10');
    await expect(page.getByText('Existencias actuales')).toContainText('7');
  });

  test('carga el inventario inicial con el costo promedio sugerido y fracciones', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo ajuste' }).click();
    const dialogo = page.getByRole('dialog');
    await elegirProducto(dialogo, 'ELE-012');
    await dialogo.getByRole('button', { name: 'Inventario inicial' }).click();
    await expect(dialogo.getByRole('radio', { name: 'Entrada' })).toBeChecked();
    await expect(dialogo.getByLabel('Costo unitario')).toHaveValue('1800');
    await expect(dialogo.getByText(/Costo promedio actual: \$\s?1\.800/)).toBeVisible();
    await dialogo.getByLabel('Cantidad').fill('12,5');
    await expect(dialogo.getByTestId('efecto-ajuste')).toContainText('de 87,5 a 100');
    await dialogo.getByRole('button', { name: 'Registrar ajuste' }).click();
    await expect(page.getByText('Existencias de ELE-012: 100.')).toBeVisible();
    const envio = api.llamadas.find((l) => l.metodo === 'POST' && l.ruta === '/ajustes');
    expect(envio.cuerpo).toMatchObject({ tipo: 'ENTRADA', cantidad: '12.5', costoUnitario: '1800', motivo: 'Inventario inicial' });
  });

  test('valida campos obligatorios, fracciones y existencias antes de enviar (CA-AJU-03, CA-AJU-04)', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo ajuste' }).click();
    const dialogo = page.getByRole('dialog');
    await dialogo.getByRole('button', { name: 'Registrar ajuste' }).click();
    await expect(dialogo.getByText('Este campo es obligatorio.')).toHaveCount(3);
    await expect(dialogo.getByText('Indique el costo unitario de la entrada.')).toBeVisible();

    await elegirProducto(dialogo, 'FER-001');
    await dialogo.getByRole('radio', { name: 'Salida' }).check();
    await dialogo.getByLabel('Cantidad').fill('1,5');
    await dialogo.getByRole('textbox', { name: 'Motivo' }).fill('Rotura');
    await expect(dialogo.getByText('Use una cantidad entera: este producto no se vende en fracciones.')).toBeVisible();
    await dialogo.getByLabel('Cantidad').fill('9');
    await dialogo.getByRole('textbox', { name: 'Motivo' }).click();
    await expect(dialogo.getByText('La salida supera las existencias disponibles (8).')).toBeVisible();
    await dialogo.getByRole('textbox', { name: 'Motivo' }).fill('   ab   ');
    await dialogo.getByRole('button', { name: 'Registrar ajuste' }).click();
    await expect(dialogo.getByText('Debe tener entre 5 y 300 caracteres.')).toBeVisible();
    expect(api.llamadas.some((l) => l.metodo === 'POST' && l.ruta === '/ajustes')).toBe(false);
  });

  test('desde el kardex se abre el formulario con el producto elegido', async ({ page }) => {
    await page.goto('/inventario/10');
    await page.getByRole('link', { name: 'Registrar ajuste' }).click();
    const dialogo = page.getByRole('dialog', { name: 'Nuevo ajuste de inventario' });
    await expect(dialogo.getByRole('combobox', { name: 'Producto' })).toHaveValue('FER-001 — Martillo de uña 16 oz');
    await expect(page).toHaveURL(/\/ajustes$/);
  });

  test('la página y el formulario no tienen violaciones WCAG A/AA detectables', async ({ page }) => {
    await expect(page.getByText('Unidad dañada en bodega')).toBeVisible();
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    await page.getByRole('button', { name: 'Nuevo ajuste' }).click();
    await elegirProducto(page.getByRole('dialog'), 'FER-001');
    await page.getByRole('dialog').getByLabel('Cantidad').fill('2');
    expect((await new AxeBuilder({ page }).include('[role="dialog"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations).toEqual([]);
  });

  test('en móvil el historial se muestra como tarjetas sin desplazamiento horizontal', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Solo aplica al proyecto móvil');
    await expect(page.getByRole('list', { name: 'Historial de ajustes' }).getByRole('listitem')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });
});
