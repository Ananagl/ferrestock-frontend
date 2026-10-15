/**
 * Nombre:                 catalogo.spec.js
 * Descripción:            Pruebas E2E de aceptación del incremento 3 (catálogo): CA-PRO-01 a 05, 08, 10 y CA-PRE-01, 02, versión desactualizada, accesibilidad y móvil.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.4.0
 * @file
 */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { instalarApiSimulada } from './utilidades/apiSimulada.js';

test.describe('Productos', () => {
  let api;
  test.beforeEach(async ({ page }) => {
    api = await instalarApiSimulada(page, { sesionInicial: 'operador' });
    await page.goto('/productos');
    await expect(page.getByRole('heading', { level: 1, name: 'Productos' })).toBeVisible();
  });

  test('lista productos con precio en COP, existencias y estado; filtra por búsqueda, categoría y estado (CA-PRO-04)', async ({ page }) => {
    await expect(page.getByText('Martillo de uña 16 oz')).toBeVisible();
    await expect(page.getByText(/\$\s?35\.000/)).toBeVisible();
    await expect(page.getByText(/\$\s?2\.500,50/)).toBeVisible();
    await expect(page.getByText('87,5')).toBeVisible();

    await page.getByLabel('Buscar por código o nombre').fill('ele-');
    await expect(page.getByText('Cable eléctrico N.º 12')).toBeVisible();
    await expect(page.getByText('Martillo de uña 16 oz')).toHaveCount(0);
    await page.getByLabel('Buscar por código o nombre').fill('');

    await page.getByRole('combobox', { name: 'Categoría' }).click();
    await page.getByRole('option', { name: 'Herramientas manuales' }).click();
    await page.getByRole('combobox', { name: 'Estado' }).click();
    await page.getByRole('option', { name: 'Inactivo' }).click();
    await expect(page.getByText('Serrucho antiguo')).toBeVisible();
    await expect(page.getByText('Martillo de uña 16 oz')).toHaveCount(0);
  });

  test('registra un producto con validación en el cliente y código duplicado del backend (CA-PRO-01, 02, 03)', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo producto' }).click();
    const dialogo = page.getByRole('dialog', { name: 'Nuevo producto' });
    await dialogo.getByLabel('Código').fill('con espacio');
    await dialogo.getByLabel('Precio de venta').fill('-5');
    await dialogo.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialogo.getByText('Entre 2 y 30 caracteres: letras, números o guion, sin espacios.')).toBeVisible();
    await expect(dialogo.getByText('Escribe un valor válido, con hasta 2 decimales.')).toBeVisible();
    await expect(dialogo.getByLabel('Código')).toBeFocused();

    await dialogo.getByLabel('Código').fill('fer-001');
    await dialogo.getByLabel('Nombre', { exact: true }).fill('Martillo de bola');
    await dialogo.getByRole('combobox', { name: 'Categoría' }).click();
    await page.getByRole('option', { name: 'Herramientas manuales' }).click();
    await dialogo.getByLabel('Precio de venta').fill('42000,5');
    await dialogo.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialogo.getByText('Ya existe un registro con ese valor.')).toBeVisible();

    await dialogo.getByLabel('Código').fill('fer-002');
    await dialogo.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialogo).toBeHidden();
    await expect(page.getByRole('status').filter({ hasText: 'Producto FER-002 creado.' })).toBeVisible();
    await expect(page.getByText(/\$\s?42\.000,50/)).toBeVisible();
  });

  test('la lista de categorías del formulario solo ofrece categorías activas', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo producto' }).click();
    await page.getByRole('dialog').getByRole('combobox', { name: 'Categoría' }).click();
    await expect(page.getByRole('option', { name: 'Eléctricos' })).toBeVisible();
    await expect(page.getByRole('option', { name: /Descontinuada/ })).toHaveCount(0);
  });

  test('edita un producto (CA-PRO-05) y avisa si otra persona lo modificó antes', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar ELE-012' }).click();
    let dialogo = page.getByRole('dialog', { name: 'Editar producto ELE-012' });
    await expect(dialogo.getByLabel('Se vende en fracciones')).toBeChecked();
    await dialogo.getByLabel('Descripción').fill('Rollo de 50 m');
    await dialogo.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Producto ELE-012 actualizado.' })).toBeVisible();

    await page.getByRole('button', { name: 'Editar FER-001' }).click();
    dialogo = page.getByRole('dialog', { name: 'Editar producto FER-001' });
    api.modificarProductoPorOtro(10);
    await dialogo.getByLabel('Nombre', { exact: true }).fill('Martillo modificado');
    await dialogo.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialogo.getByRole('alert')).toContainText('Otra persona modificó este producto');
    await dialogo.getByRole('button', { name: 'Recargar' }).click();
    await expect(dialogo).toBeHidden();
  });

  test('cambia el precio con validación (CA-PRE-01, CA-PRE-02)', async ({ page }) => {
    await page.getByRole('button', { name: 'Cambiar precio FER-001' }).click();
    const dialogo = page.getByRole('dialog', { name: 'Cambiar precio de FER-001' });
    await expect(dialogo).toContainText('Solo aplica a las ventas que se registren desde ahora.');
    await dialogo.getByLabel('Nuevo precio').fill('0');
    await dialogo.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialogo.getByText('El precio debe ser mayor que cero.')).toBeVisible();
    await dialogo.getByLabel('Nuevo precio').fill('38000');
    await dialogo.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Nuevo precio de FER-001' })).toBeVisible();
    await expect(page.getByText(/\$\s?38\.000/).first()).toBeVisible();
  });

  test('desactiva un producto tras confirmar (CA-PRO-06)', async ({ page }) => {
    await page.getByRole('button', { name: 'Desactivar FER-001' }).click();
    const confirmacion = page.getByRole('dialog', { name: 'Desactivar producto' });
    await expect(confirmacion).toContainText('Su historial se conserva');
    await confirmacion.getByRole('button', { name: 'Desactivar' }).click();
    await expect(page.getByRole('button', { name: 'Activar FER-001' })).toBeVisible();
  });

  test('la pantalla y el formulario no tienen violaciones WCAG A/AA detectables', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    await page.getByRole('button', { name: 'Nuevo producto' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  });

  test('en móvil se muestran tarjetas sin desplazamiento horizontal', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Solo aplica al proyecto móvil');
    await expect(page.getByRole('list', { name: 'Productos' }).getByRole('listitem').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });
});

test.describe('Categorías', () => {
  test('el ADMIN crea, detecta duplicados y desactiva categorías (CA-PRO-10)', async ({ page }) => {
    await instalarApiSimulada(page, { sesionInicial: 'admin' });
    await page.goto('/categorias');
    await page.getByRole('button', { name: 'Nueva categoría' }).click();
    const dialogo = page.getByRole('dialog', { name: 'Nueva categoría' });
    await dialogo.getByLabel('Nombre').fill('eléctricos');
    await dialogo.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialogo.getByText('Ya existe una categoría con ese nombre.')).toBeVisible();
    await dialogo.getByLabel('Nombre').fill('Pinturas');
    await dialogo.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Categoría Pinturas creada.' })).toBeVisible();

    await page.getByRole('button', { name: 'Desactivar Pinturas' }).click();
    await expect(page.getByRole('button', { name: 'Activar Pinturas' })).toBeVisible();
  });

  test('un operativo no ve la opción ni la pantalla de categorías', async ({ page, isMobile }) => {
    await instalarApiSimulada(page, { sesionInicial: 'operador' });
    await page.goto('/');
    if (isMobile) await page.getByRole('button', { name: 'Abrir menú' }).click();
    await expect(page.getByRole('navigation', { name: 'Menú principal' }).getByRole('link', { name: 'Categorías' })).toHaveCount(0);
    await page.goto('/categorias');
    await expect(page.getByRole('heading', { level: 1, name: 'Acceso denegado' })).toBeVisible();
  });
});
