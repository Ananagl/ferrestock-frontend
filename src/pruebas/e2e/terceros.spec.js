/**
 * Nombre:                 terceros.spec.js
 * Descripción:            Pruebas E2E de aceptación del incremento 4 (clientes y proveedores): CA-TER-01 a 04, permisos, accesibilidad y móvil.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.5.0
 * @file
 */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { instalarApiSimulada } from './utilidades/apiSimulada.js';

/** Abre el formulario de alta y devuelve el diálogo. */
async function abrirAlta(page) {
  await page.getByRole('button', { name: 'Nuevo tercero' }).click();
  return page.getByRole('dialog', { name: 'Nuevo cliente o proveedor' });
}

/** Elige una opción de una lista desplegable dentro del diálogo. */
async function elegir(page, dialogo, campo, opcion) {
  await dialogo.getByRole('combobox', { name: campo }).click();
  await page.getByRole('option', { name: opcion, exact: true }).click();
}

test.describe('Clientes y proveedores', () => {
  test.beforeEach(async ({ page }) => {
    await instalarApiSimulada(page, { sesionInicial: 'operador' });
    await page.goto('/terceros');
    await expect(page.getByRole('heading', { level: 1, name: 'Clientes y proveedores' })).toBeVisible();
  });

  test('lista terceros con documento y roles, y filtra por rol', async ({ page }) => {
    await expect(page.getByText('NIT 890903938-8')).toBeVisible();
    await expect(page.getByText('CC 1020304050')).toBeVisible();
    await page.getByRole('combobox', { name: 'Rol' }).click();
    await page.getByRole('option', { name: 'Proveedores' }).click();
    await expect(page.getByText('Distribuidora Antioquia SAS')).toBeVisible();
    await expect(page.getByText('Carlos Pérez')).toHaveCount(0);
  });

  test('una persona jurídica solo puede usar NIT y se pide el DV (CA-TER-03)', async ({ page }) => {
    const dialogo = await abrirAlta(page);
    await expect(dialogo.getByLabel('DV')).toHaveCount(0);
    await elegir(page, dialogo, 'Tipo de persona', 'Persona jurídica');
    await expect(dialogo.getByRole('combobox', { name: 'Tipo de documento' })).toHaveText('NIT');
    await expect(dialogo.getByLabel('DV')).toBeVisible();
    await expect(dialogo.getByLabel('Razón social')).toBeVisible();
    await dialogo.getByRole('combobox', { name: 'Tipo de documento' }).click();
    await expect(page.getByRole('option', { name: 'Cédula de ciudadanía' })).toHaveCount(0);
    await page.keyboard.press('Escape');
  });

  test('valida el DV del NIT en el formulario y registra la empresa (CA-TER-04, CA-TER-01)', async ({ page }) => {
    const dialogo = await abrirAlta(page);
    await elegir(page, dialogo, 'Tipo de persona', 'Persona jurídica');
    await dialogo.getByLabel('Número de documento').fill('899999068');
    await dialogo.getByLabel('DV').fill('7');
    await dialogo.getByLabel('Razón social').fill('Ecopetrol SA');
    await dialogo.getByLabel('Proveedor').check();
    await dialogo.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialogo.getByText('El dígito de verificación no corresponde al NIT.')).toBeVisible();
    await expect(dialogo.getByLabel('DV')).toBeFocused();

    await dialogo.getByLabel('DV').fill('1');
    await dialogo.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialogo).toBeHidden();
    await expect(page.getByRole('status').filter({ hasText: 'Ecopetrol SA registrado.' })).toBeVisible();
    await expect(page.getByText('NIT 899999068-1')).toBeVisible();
  });

  test('un documento repetido se marca en el campo del número (CA-TER-02)', async ({ page }) => {
    const dialogo = await abrirAlta(page);
    await dialogo.getByLabel('Número de documento').fill('1020304050');
    await dialogo.getByLabel('Nombre completo').fill('Otra Persona');
    await dialogo.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialogo.getByText('Ya existe un registro con ese valor.')).toBeVisible();
  });

  test('exige al menos un rol y valida correo y teléfono', async ({ page }) => {
    const dialogo = await abrirAlta(page);
    await dialogo.getByLabel('Número de documento').fill('12345678');
    await dialogo.getByLabel('Nombre completo').fill('Ana López');
    await dialogo.getByLabel('Cliente').uncheck();
    await dialogo.getByLabel('Teléfono').fill('abc');
    await dialogo.getByLabel('Correo electrónico').fill('no-es-correo');
    await dialogo.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialogo.getByText('Marca si es cliente, proveedor o ambos.')).toBeVisible();
    await expect(dialogo.getByText('Correo electrónico no válido.')).toBeVisible();
    await expect(dialogo.getByText('Entre 7 y 20 caracteres', { exact: false })).toBeVisible();
  });

  test('un proveedor pasa a ser también cliente; el documento no se edita (CA-TER-01)', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar Distribuidora Antioquia SAS' }).click();
    const dialogo = page.getByRole('dialog', { name: 'Editar Distribuidora Antioquia SAS' });
    await expect(dialogo.getByText('NIT 890903938-8')).toBeVisible();
    await expect(dialogo.getByLabel('Número de documento')).toHaveCount(0);
    await dialogo.getByLabel('Cliente').check();
    await dialogo.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Distribuidora Antioquia SAS actualizado.' })).toBeVisible();
  });

  test('el operativo no ve la acción de desactivar (RF-TER-006)', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Editar Carlos Pérez' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Desactivar/ })).toHaveCount(0);
  });

  test('la pantalla y el formulario no tienen violaciones WCAG A/AA detectables', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    const dialogo = await abrirAlta(page);
    await elegir(page, dialogo, 'Tipo de persona', 'Persona jurídica');
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  });

  test('en móvil se muestran tarjetas sin desplazamiento horizontal', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Solo aplica al proyecto móvil');
    await expect(page.getByRole('list', { name: 'Clientes y proveedores' }).getByRole('listitem').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });
});

test('el ADMIN desactiva un tercero tras confirmar (RF-TER-006)', async ({ page }) => {
  await instalarApiSimulada(page, { sesionInicial: 'admin' });
  await page.goto('/terceros');
  await page.getByRole('button', { name: 'Desactivar Carlos Pérez' }).click();
  const confirmacion = page.getByRole('dialog', { name: 'Desactivar tercero' });
  await expect(confirmacion).toContainText('Su historial se conserva');
  await confirmacion.getByRole('button', { name: 'Desactivar' }).click();
  await expect(page.getByRole('button', { name: 'Activar Carlos Pérez' })).toBeVisible();
});
