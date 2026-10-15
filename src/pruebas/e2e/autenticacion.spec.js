/**
 * Nombre:                 autenticacion.spec.js
 * Descripción:            Pruebas E2E de aceptación del incremento 1 (autenticación y menú por rol): CA-AUT-01 a 06 y 08, CA-I18N-01, accesibilidad y responsive.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
 * @file
 */
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { CLAVE_VALIDA, ingresar, instalarApiSimulada } from './utilidades/apiSimulada.js';

/**
 * Devuelve el menú principal; en móvil primero lo abre con el botón de la barra superior.
 * @param {import('@playwright/test').Page} page - Página.
 * @param {boolean} movil - Si el proyecto emula un móvil.
 * @returns {Promise<import('@playwright/test').Locator>} Menú principal.
 */
async function menuPrincipal(page, movil) {
  if (movil) await page.getByRole('button', { name: 'Abrir menú' }).click();
  return page.getByRole('navigation', { name: 'Menú principal' });
}

test.describe('Autenticación', () => {
  test('sin sesión, una ruta protegida redirige al ingreso conservando el destino (CA-AUT-04)', async ({ page }) => {
    await instalarApiSimulada(page);
    await page.goto('/ventas');
    await expect(page).toHaveURL(/\/ingresar\?volver=%2Fventas/);
    await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible();
  });

  test('un operativo ingresa, ve su menú sin opciones de administrador (CA-AUT-01, CA-AUT-05)', async ({ page, isMobile }) => {
    const { llamadas } = await instalarApiSimulada(page);
    await page.goto('/');
    await ingresar(page, 'operador');

    await expect(page.getByRole('heading', { level: 1, name: 'Hola, Juan Operador' })).toBeVisible();
    const menu = await menuPrincipal(page, isMobile);
    await expect(menu.getByRole('link', { name: 'Ventas' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Auditoría' })).toHaveCount(0);
    await expect(menu.getByRole('link', { name: 'Ajustes' })).toHaveCount(0);

    const login = llamadas.find((l) => l.ruta === '/auth/login');
    expect(login.cabeceras['x-xsrf-token']).toBe('token-prueba');
    expect(login.cuerpo).toEqual({ usuario: 'operador', contrasena: CLAVE_VALIDA, recordarme: false });
  });

  test('un operativo que escribe la URL de auditoría ve "Acceso denegado" (CA-AUT-05)', async ({ page }) => {
    await instalarApiSimulada(page, { sesionInicial: 'operador' });
    await page.goto('/auditoria');
    await expect(page.getByRole('heading', { level: 1, name: 'Acceso denegado' })).toBeVisible();
  });

  test('el administrador ve las opciones exclusivas de su rol', async ({ page, isMobile }) => {
    await instalarApiSimulada(page);
    await page.goto('/ingresar');
    await ingresar(page, 'admin');
    await expect(page.getByRole('heading', { level: 1, name: 'Hola, Ana Administradora' })).toBeVisible();
    const menu = await menuPrincipal(page, isMobile);
    for (const opcion of ['Ajustes', 'Auditoría', 'Usuarios', 'Ventas']) {
      await expect(menu.getByRole('link', { name: opcion })).toBeVisible();
    }
  });

  test('credenciales inválidas muestran un mensaje genérico y vacían la contraseña (CA-AUT-02)', async ({ page }) => {
    await instalarApiSimulada(page);
    await page.goto('/ingresar');
    await ingresar(page, 'operador', 'Incorrecta99');
    await expect(page.getByRole('alert')).toHaveText('Usuario o contraseña incorrectos.');
    await expect(page.getByLabel('Contraseña', { exact: true })).toHaveValue('');
    await expect(page).toHaveURL(/\/ingresar/);
  });

  test('una cuenta bloqueada recibe el aviso de bloqueo (CA-AUT-08)', async ({ page }) => {
    await instalarApiSimulada(page);
    await page.goto('/ingresar');
    await ingresar(page, 'bloqueado');
    await expect(page.getByRole('alert')).toContainText('bloqueada temporalmente');
  });

  test('el formulario vacío muestra errores por campo y enfoca el primero (RNF-USA-04)', async ({ page }) => {
    await instalarApiSimulada(page);
    await page.goto('/ingresar');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByText('Este campo es obligatorio.')).toHaveCount(2);
    await expect(page.getByLabel('Usuario')).toBeFocused();
    await expect(page.getByLabel('Usuario')).toHaveAttribute('aria-invalid', 'true');
  });

  test('con "Recordarme" la sesión se restaura al volver a abrir la aplicación (CA-AUT-03)', async ({ page }) => {
    const { llamadas } = await instalarApiSimulada(page);
    await page.goto('/ingresar');
    await ingresar(page, 'operador', CLAVE_VALIDA, true);
    await expect(page.getByRole('heading', { level: 1, name: 'Hola, Juan Operador' })).toBeVisible();
    expect(llamadas.find((l) => l.ruta === '/auth/login').cuerpo.recordarme).toBe(true);

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Hola, Juan Operador' })).toBeVisible();
  });

  test('cerrar sesión vuelve al ingreso y protege las rutas (CA-AUT-06)', async ({ page }) => {
    await instalarApiSimulada(page, { sesionInicial: 'operador' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Menú de Juan Operador' }).click();
    await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/ingresar$/);
    await page.goto('/compras');
    await expect(page).toHaveURL(/\/ingresar\?volver=/);
  });

  test('con contraseña temporal se obliga a cambiarla antes de usar el sistema (RF-AUT-007)', async ({ page, isMobile }) => {
    await instalarApiSimulada(page);
    await page.goto('/ingresar');
    await ingresar(page, 'nuevo');
    await expect(page).toHaveURL(/\/cambiar-contrasena$/);
    await expect(page.getByRole('navigation', { name: 'Menú principal' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toHaveCount(0);
    await page.goto('/ventas');
    await expect(page).toHaveURL(/\/cambiar-contrasena$/);

    await page.getByLabel('Contraseña actual').fill(CLAVE_VALIDA);
    await page.getByLabel('Nueva contraseña', { exact: true }).fill('Ferreteria2026');
    await page.getByLabel('Confirmar nueva contraseña').fill('Otra2026');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await expect(page.getByText('La confirmación no coincide con la nueva contraseña.')).toBeVisible();

    await page.getByLabel('Confirmar nueva contraseña').fill('Ferreteria2026');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await expect(page.getByText('Tu contraseña se cambió correctamente.')).toBeVisible();
    await expect(await menuPrincipal(page, isMobile)).toBeVisible();
  });

  test('el error del backend se muestra en el campo correspondiente', async ({ page }) => {
    await instalarApiSimulada(page, { sesionInicial: 'operador' });
    await page.goto('/cambiar-contrasena');
    await page.getByLabel('Contraseña actual').fill('Equivocada1');
    await page.getByLabel('Nueva contraseña', { exact: true }).fill('Ferreteria2026');
    await page.getByLabel('Confirmar nueva contraseña').fill('Ferreteria2026');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await expect(page.getByText('La contraseña actual no es correcta.')).toBeVisible();
  });
});

test.describe('Idioma, accesibilidad y responsive', () => {
  test('el ingreso cambia a inglés y la preferencia se guarda tras iniciar sesión (CA-I18N-01)', async ({ page, isMobile }) => {
    const { llamadas } = await instalarApiSimulada(page);
    await page.goto('/ingresar');
    await page.getByRole('combobox', { name: 'Idioma / Language' }).click();
    await page.getByRole('option', { name: 'English' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.getByRole('combobox', { name: 'Idioma / Language' }).click();
    await page.getByRole('option', { name: 'Español' }).click();
    await ingresar(page, 'operador');
    await expect(page.getByRole('heading', { level: 1, name: 'Hola, Juan Operador' })).toBeVisible();

    // En móvil el selector de idioma está dentro del menú de usuario
    if (isMobile) await page.getByRole('button', { name: 'Menú de Juan Operador' }).click();
    await page.getByRole('combobox', { name: 'Idioma / Language' }).click();
    await page.getByRole('option', { name: 'English' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Hello, Juan Operador' })).toBeVisible();
    expect(llamadas.some((l) => l.ruta === '/auth/idioma' && l.cuerpo?.idioma === 'en')).toBe(true);
  });

  for (const [nombre, ruta, sesion] of [['ingreso', '/ingresar', undefined], ['inicio', '/', 'admin'],
    ['cambio de contraseña', '/cambiar-contrasena', 'operador']]) {
    test(`la pantalla de ${nombre} no tiene violaciones WCAG A/AA detectables (RNF-USA-03)`, async ({ page }) => {
      await instalarApiSimulada(page, { sesionInicial: sesion });
      await page.goto(ruta);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(resultado.violations).toEqual([]);
    });
  }

  test('en móvil el menú se abre con un botón y no hay desplazamiento horizontal (RNF-USA-02)', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Solo aplica al proyecto móvil');
    await instalarApiSimulada(page, { sesionInicial: 'operador' });
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Menú principal' })).toBeHidden();
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await page.getByRole('navigation', { name: 'Menú principal' }).getByRole('link', { name: 'Compras' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Compras' })).toBeVisible();
    const desborda = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(desborda).toBe(false);
  });
});
