/**
 * Nombre:                 comprobantes.spec.js
 * Descripción:            Pruebas E2E de los incrementos 10 y 11: búsqueda y comprobante imprimible con la leyenda (CA-DOC-01, 03) y consulta de auditoría filtrada por usuario (CA-AUD-01).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.10.0
 * @file
 */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { instalarApiSimulada } from './utilidades/apiSimulada.js';

test('desde la venta se abre el comprobante con cliente, líneas, pago, cambio y la leyenda (CA-DOC-01, CA-DOC-03)', async ({ page }) => {
  await instalarApiSimulada(page, { sesionInicial: 'operador' });
  await page.goto('/ventas/1');
  await page.getByRole('link', { name: 'Ver comprobante' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Venta VEN-000001' })).toBeVisible();
  await expect(page.getByTestId('leyenda')).toHaveText('Documento simulado — sin validez fiscal — no transmitido a la DIAN');
  await expect(page.getByText('Carlos Pérez — CC 1020304050')).toBeVisible();
  await expect(page.getByTestId('total-comprobante')).toHaveText(/\$\s?105\.000/);
  await expect(page.getByText(/\$\s?5\.000/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Imprimir' })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});

test('la búsqueda de comprobantes lista ventas y compras; el operativo no ve el tipo Ajuste (RF-DOC-005)', async ({ page }) => {
  await instalarApiSimulada(page, { sesionInicial: 'operador' });
  await page.goto('/comprobantes');
  await expect(page.getByText('VEN-000001')).toBeVisible();
  await expect(page.getByText('COM-000002')).toBeVisible();
  await page.getByRole('combobox', { name: 'Tipo' }).click();
  await expect(page.getByRole('option', { name: 'Ajuste' })).toHaveCount(0);
});

test('el ADMIN consulta la auditoría y filtra por usuario (CA-AUD-01); el operativo no tiene acceso', async ({ page }) => {
  await instalarApiSimulada(page, { sesionInicial: 'admin' });
  await page.goto('/auditoria');
  await expect(page.getByRole('heading', { level: 1, name: 'Auditoría' })).toBeVisible();
  await expect(page.getByText('LOGIN_EXITOSO')).toBeVisible();
  await page.getByRole('combobox', { name: 'Usuario' }).click();
  await page.getByRole('option', { name: 'operador', exact: true }).click();
  await expect(page.getByText(/Venta VEN-000001 a Carlos Pérez/)).toBeVisible();
  await expect(page.getByText('LOGIN_EXITOSO')).toHaveCount(0);
  // Se espera a que termine la animación de cierre del menú antes de medir el contraste
  await expect(page.getByRole('listbox')).toHaveCount(0);
  await page.waitForTimeout(400);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});

test('un operativo no ve la auditoría', async ({ page }) => {
  await instalarApiSimulada(page, { sesionInicial: 'operador' });
  await page.goto('/auditoria');
  await expect(page.getByRole('heading', { level: 1, name: 'Acceso denegado' })).toBeVisible();
});
