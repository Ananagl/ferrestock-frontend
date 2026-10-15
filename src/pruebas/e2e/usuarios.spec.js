/**
 * Nombre:                 usuarios.spec.js
 * Descripción:            Pruebas E2E de aceptación del incremento 2 (gestión de usuarios, RF-AUT-006): listado, filtros, alta con validación, duplicado, edición, desactivación con confirmación, restablecimiento, accesibilidad y móvil.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.3.0
 * @file
 */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { instalarApiSimulada } from './utilidades/apiSimulada.js';

test.describe('Gestión de usuarios (ADMIN)', () => {
  test.beforeEach(async ({ page }) => {
    await instalarApiSimulada(page, { sesionInicial: 'admin' });
    await page.goto('/usuarios');
    await expect(page.getByRole('heading', { level: 1, name: 'Usuarios' })).toBeVisible();
  });

  test('lista los usuarios con su rol y estado, y filtra por texto y rol', async ({ page, isMobile }) => {
    await expect(page.getByText('operador', { exact: true })).toBeVisible();
    await expect(page.getByText('Bloqueado', { exact: true })).toBeVisible();
    await page.getByLabel('Buscar por usuario o nombre').fill('maría');
    await expect(page.getByText('nuevo', { exact: true })).toBeVisible();
    await expect(page.getByText('operador', { exact: true })).toHaveCount(0);
    await page.getByLabel('Buscar por usuario o nombre').fill('');
    await page.getByRole('combobox', { name: 'Rol' }).click();
    await page.getByRole('option', { name: 'Administrador' }).click();
    await expect(page.getByText('admin', { exact: true })).toBeVisible();
    await expect(page.getByText('operador', { exact: true })).toHaveCount(0);
    if (!isMobile) await expect(page.getByRole('table', { name: 'Usuarios' })).toBeVisible();
  });

  test('crea un usuario: valida en el cliente, muestra el duplicado del backend y confirma el alta', async ({ page }) => {
    await page.getByRole('button', { name: 'Nuevo usuario' }).click();
    const dialogo = page.getByRole('dialog', { name: 'Nuevo usuario' });
    await dialogo.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialogo.getByText('Este campo es obligatorio.').first()).toBeVisible();
    await expect(dialogo.getByLabel('Nombre de usuario')).toBeFocused();

    await dialogo.getByLabel('Nombre de usuario').fill('con espacio');
    await dialogo.getByLabel('Nombre completo').fill('María Mercedes');
    await dialogo.getByLabel('Contraseña temporal', { exact: true }).fill('corta');
    await dialogo.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialogo.getByText('sin espacios.')).toBeVisible();
    await expect(dialogo.getByText('Debe tener entre 8 y 72 caracteres, con al menos una letra y un número.')).toBeVisible();

    await dialogo.getByLabel('Nombre de usuario').fill('operador');
    await dialogo.getByLabel('Contraseña temporal', { exact: true }).fill('Temporal2026');
    await dialogo.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialogo.getByText('Ya existe un usuario con ese nombre.')).toBeVisible();

    await dialogo.getByLabel('Nombre de usuario').fill('Maria.Rincon');
    await dialogo.getByRole('button', { name: 'Guardar' }).click();
    await expect(dialogo).toBeHidden();
    await expect(page.getByRole('status').filter({ hasText: 'Usuario maria.rincon creado.' })).toBeVisible();
    await expect(page.getByText('maria.rincon', { exact: true })).toBeVisible();
  });

  test('edita el nombre y el rol de otro usuario', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar operador' }).click();
    const dialogo = page.getByRole('dialog', { name: 'Editar usuario operador' });
    await dialogo.getByLabel('Nombre completo').fill('Juan David Camacho');
    await dialogo.getByRole('combobox', { name: 'Rol' }).click();
    await page.getByRole('option', { name: 'Administrador' }).click();
    await dialogo.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Usuario operador actualizado.' })).toBeVisible();
    await expect(page.getByText('Juan David Camacho')).toBeVisible();
  });

  test('el administrador no puede cambiar su propio rol ni desactivarse', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Desactivar admin' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Restablecer contraseña admin' })).toBeDisabled();
    await page.getByRole('button', { name: 'Editar admin' }).click();
    const dialogo = page.getByRole('dialog', { name: 'Editar usuario admin' });
    await expect(dialogo.getByText('No puedes cambiar tu propio rol.')).toBeVisible();
    await expect(dialogo.getByRole('combobox', { name: 'Rol' })).toHaveAttribute('aria-disabled', 'true');
  });

  test('desactiva un usuario tras confirmar; Cancelar tiene el foco por defecto (CA-AUT-07)', async ({ page }) => {
    await page.getByRole('button', { name: 'Desactivar operador' }).click();
    const confirmacion = page.getByRole('dialog', { name: 'Desactivar usuario' });
    await expect(confirmacion).toContainText('se cerrarán sus sesiones abiertas');
    await expect(confirmacion.getByRole('button', { name: 'Cancelar' })).toBeFocused();
    await confirmacion.getByRole('button', { name: 'Desactivar' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Usuario operador desactivado.' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Activar operador' })).toBeVisible();
  });

  test('restablece la contraseña de un usuario bloqueado', async ({ page }) => {
    await page.getByRole('button', { name: 'Restablecer contraseña bloqueado' }).click();
    const dialogo = page.getByRole('dialog', { name: 'Restablecer contraseña' });
    await dialogo.getByLabel('Contraseña temporal', { exact: true }).fill('Temporal2026');
    await dialogo.getByRole('button', { name: 'Restablecer' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Contraseña temporal asignada a bloqueado.' })).toBeVisible();
    await expect(page.getByText('Bloqueado', { exact: true })).toHaveCount(0);
  });

  test('la pantalla y el diálogo de alta no tienen violaciones WCAG A/AA detectables', async ({ page }) => {
    // Sin animaciones, axe mide los colores finales y no los de la transición de entrada
    await page.emulateMedia({ reducedMotion: 'reduce' });
    let resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(resultado.violations).toEqual([]);
    await page.getByRole('button', { name: 'Nuevo usuario' }).click();
    await expect(page.getByRole('dialog', { name: 'Nuevo usuario' })).toBeVisible();
    resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(resultado.violations).toEqual([]);
  });

  test('en móvil los usuarios se muestran como tarjetas sin desplazamiento horizontal', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Solo aplica al proyecto móvil');
    await expect(page.getByRole('table')).toHaveCount(0);
    await expect(page.getByRole('list', { name: 'Usuarios' }).getByRole('listitem').first()).toBeVisible();
    const desborda = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(desborda).toBe(false);
  });
});

test('un operativo no ve la gestión de usuarios (CA-AUT-05)', async ({ page }) => {
  await instalarApiSimulada(page, { sesionInicial: 'operador' });
  await page.goto('/usuarios');
  await expect(page.getByRole('heading', { level: 1, name: 'Acceso denegado' })).toBeVisible();
});
