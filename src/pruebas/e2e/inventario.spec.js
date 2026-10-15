/**
 * Nombre:                 inventario.spec.js
 * Descripción:            Pruebas E2E del incremento 5 (inventario): existencias, kardex de CA-INV-01, costos solo para ADMIN (DP-15), valorización, verificación, accesibilidad y móvil.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.6.0
 * @file
 */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { instalarApiSimulada } from './utilidades/apiSimulada.js';

test.describe('Inventario como usuario operativo', () => {
  test.beforeEach(async ({ page }) => {
    await instalarApiSimulada(page, { sesionInicial: 'operador' });
    await page.goto('/inventario');
    await expect(page.getByRole('heading', { level: 1, name: 'Inventario' })).toBeVisible();
  });

  test('muestra existencias sin costos ni valorización y filtra solo con existencias (RF-INV-001, DP-15)', async ({ page }) => {
    await expect(page.getByText('Martillo de uña 16 oz')).toBeVisible();
    await expect(page.getByText('87,5')).toBeVisible();
    await expect(page.getByText('Costo promedio')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Valor del inventario' })).toHaveCount(0);
    await expect(page.getByText('Serrucho antiguo')).toBeVisible();
    await page.getByLabel('Solo con existencias').check();
    await expect(page.getByText('Serrucho antiguo')).toHaveCount(0);
  });

  test('abre el kardex con saldos y filtra por tipo, sin columnas de costo (CA-INV-01)', async ({ page }) => {
    await page.getByRole('link', { name: 'Ver kardex FER-001' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Kardex de FER-001' })).toBeVisible();
    await expect(page.getByText('Existencias actuales')).toContainText('8');
    for (const saldo of ['10', '7', '6']) {
      await expect(page.getByText(saldo, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByText('Costo unitario')).toHaveCount(0);

    await page.getByRole('combobox', { name: 'Tipo' }).click();
    await page.getByRole('option', { name: 'Venta', exact: true }).click();
    await expect(page.getByText('Compra', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Venta', { exact: true }).first()).toBeVisible();
  });

  test('un producto sin movimientos muestra el estado vacío y uno inexistente un aviso', async ({ page }) => {
    await page.goto('/inventario/11');
    await expect(page.getByText('Este producto aún no tiene movimientos.')).toBeVisible();
    await page.goto('/inventario/999');
    await expect(page.getByText('El producto no existe.')).toBeVisible();
    await page.getByRole('link', { name: 'Volver al inventario' }).click();
    await expect(page).toHaveURL(/\/inventario$/);
  });

  test('desde Productos se llega al kardex', async ({ page }) => {
    await page.goto('/productos');
    await page.getByRole('link', { name: 'Ver kardex ELE-012' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Kardex de ELE-012' })).toBeVisible();
  });

  test('en móvil se muestran tarjetas sin desplazamiento horizontal', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Solo aplica al proyecto móvil');
    await expect(page.getByRole('list', { name: 'Inventario' }).getByRole('listitem').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    await page.goto('/inventario/10');
    await expect(page.getByRole('list', { name: 'Kardex' }).getByRole('listitem')).toHaveCount(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });
});

test.describe('Inventario como administrador', () => {
  test.beforeEach(async ({ page }) => {
    await instalarApiSimulada(page, { sesionInicial: 'admin' });
    await page.goto('/inventario');
  });

  test('ve el valor del inventario por categoría y verifica la consistencia (RF-COS-002)', async ({ page }) => {
    await expect(page.getByTestId('valor-total')).toHaveText(/\$\s?319\.500/);
    await expect(page.getByRole('region', { name: 'Valor del inventario' }).getByRole('cell', { name: 'Eléctricos' })).toBeVisible();
    await page.getByRole('button', { name: 'Verificar consistencia' }).click();
    await expect(page.getByText('Existencias y costos coinciden con el kardex.')).toBeVisible();
  });

  test('ve el costo en existencias y en el kardex', async ({ page, isMobile }) => {
    await expect(page.getByText('Costo promedio').first()).toBeVisible();
    await page.goto('/inventario/10');
    await expect(page.getByText('Costo unitario').first()).toBeVisible();
    if (!isMobile) await expect(page.getByRole('cell', { name: /\$\s?21\.000/ })).toBeVisible();
  });

  test('inventario y kardex no tienen violaciones WCAG A/AA detectables', async ({ page }) => {
    await expect(page.getByTestId('valor-total')).toBeVisible();
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    await page.goto('/inventario/10');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  });
});
