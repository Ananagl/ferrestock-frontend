/**
 * Nombre:                 apiSimulada.js
 * Descripción:            Backend simulado para las pruebas E2E: reproduce los contratos de autenticación (04_api_rest.md) sin depender del servidor real.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
 * @file
 */

/** Contraseña válida de los usuarios simulados. */
export const CLAVE_VALIDA = 'Clave2026segura';

/**
 * Usuarios simulados.
 * @type {Record<string, {id:number,nombreUsuario:string,nombreCompleto:string,rol:string,idioma:string,debeCambiarPassword:boolean,bloqueado?:boolean}>}
 */
export const USUARIOS = {
  operador: { id: 1, nombreUsuario: 'operador', nombreCompleto: 'Juan Operador', rol: 'OPERATIVO', idioma: 'es', debeCambiarPassword: false },
  admin: { id: 2, nombreUsuario: 'admin', nombreCompleto: 'Ana Administradora', rol: 'ADMIN', idioma: 'es', debeCambiarPassword: false },
  nuevo: { id: 3, nombreUsuario: 'nuevo', nombreCompleto: 'María Nueva', rol: 'OPERATIVO', idioma: 'es', debeCambiarPassword: true },
  bloqueado: { id: 4, nombreUsuario: 'bloqueado', nombreCompleto: 'Cuenta Bloqueada', rol: 'OPERATIVO', idioma: 'es', debeCambiarPassword: false, bloqueado: true },
};

const problema = (status, codigo, detail, extra = {}) => ({
  status,
  contentType: 'application/problem+json',
  body: JSON.stringify({ status, codigo, detail, ...extra }),
});

/**
 * Instala el backend simulado en la página.
 * @param {import('@playwright/test').Page} page - Página de Playwright.
 * @param {{sesionInicial?: string}} [opciones] - Usuario con sesión ya iniciada (simula "Recordarme").
 * @returns {Promise<{llamadas: {metodo:string, ruta:string, cuerpo:any, cabeceras:Record<string,string>}[]}>} Llamadas.
 */
export async function instalarApiSimulada(page, opciones = {}) {
  let actual = opciones.sesionInicial ? { ...USUARIOS[opciones.sesionInicial] } : null;
  const llamadas = [];

  await page.context().addCookies([{ name: 'XSRF-TOKEN', value: 'token-prueba', url: 'http://localhost:5173' }]);

  await page.route('**/api/v1/**', async (ruta) => {
    const peticion = ruta.request();
    const camino = new URL(peticion.url()).pathname.replace('/api/v1', '');
    const metodo = peticion.method();
    let cuerpo;
    try {
      cuerpo = peticion.postDataJSON();
    } catch {
      cuerpo = null;
    }
    llamadas.push({ metodo, ruta: camino, cuerpo, cabeceras: peticion.headers() });

    if (camino === '/auth/csrf') return ruta.fulfill({ status: 204 });
    if (camino === '/auth/sesion') {
      return actual ? ruta.fulfill({ json: actual }) : ruta.fulfill(problema(401, 'NO_AUTENTICADO', 'Sesión requerida'));
    }
    if (camino === '/auth/login' && metodo === 'POST') {
      const usuario = USUARIOS[cuerpo?.usuario];
      if (usuario?.bloqueado) return ruta.fulfill(problema(423, 'CUENTA_BLOQUEADA', 'Bloqueada'));
      if (!usuario || cuerpo.contrasena !== CLAVE_VALIDA) {
        return ruta.fulfill(problema(401, 'CREDENCIALES_INVALIDAS', 'Usuario o contraseña incorrectos.'));
      }
      actual = { ...usuario };
      return ruta.fulfill({ json: actual });
    }
    if (camino === '/auth/logout') {
      actual = null;
      return ruta.fulfill({ status: 204 });
    }
    if (camino === '/auth/contrasena' && metodo === 'PUT') {
      if (cuerpo.actual !== CLAVE_VALIDA) {
        return ruta.fulfill(problema(400, 'CONTRASENA_ACTUAL_INCORRECTA', 'La contraseña actual no es correcta.',
          { errores: [{ campo: 'actual', mensaje: 'La contraseña actual no es correcta.' }] }));
      }
      actual = { ...actual, debeCambiarPassword: false };
      return ruta.fulfill({ status: 204 });
    }
    if (camino === '/auth/idioma') {
      actual = { ...actual, idioma: cuerpo.idioma };
      return ruta.fulfill({ status: 204 });
    }
    return ruta.fulfill(problema(404, 'NO_ENCONTRADO', 'No encontrado'));
  });

  return { llamadas };
}

/**
 * Completa y envía el formulario de ingreso.
 * @param {import('@playwright/test').Page} page - Página.
 * @param {string} usuario - Nombre de usuario.
 * @param {string} [clave] - Contraseña.
 * @param {boolean} [recordarme] - Marcar "Recordarme".
 */
export async function ingresar(page, usuario, clave = CLAVE_VALIDA, recordarme = false) {
  await page.getByLabel('Usuario').fill(usuario);
  await page.getByLabel('Contraseña', { exact: true }).fill(clave);
  if (recordarme) await page.getByLabel('Recordarme en este equipo').check();
  await page.getByRole('button', { name: 'Ingresar' }).click();
}
