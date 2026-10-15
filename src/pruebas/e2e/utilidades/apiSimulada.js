/**
 * Nombre:                 apiSimulada.js
 * Descripción:            Backend simulado para las pruebas E2E: reproduce los contratos de autenticación y usuarios (04_api_rest.md) sin depender del servidor real.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.3.0
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
  // Tabla de usuarios para la pantalla de gestión (incremento 2)
  let siguienteId = 100;
  const tabla = Object.values(USUARIOS).map((u) => ({
    id: u.id, nombreUsuario: u.nombreUsuario, nombreCompleto: u.nombreCompleto, rol: u.rol, activo: true,
    bloqueado: Boolean(u.bloqueado), debeCambiarPassword: u.debeCambiarPassword,
  }));

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
    if (camino.startsWith('/usuarios')) return responderUsuarios(ruta, metodo, camino, cuerpo);
    return ruta.fulfill(problema(404, 'NO_ENCONTRADO', 'No encontrado'));
  });

  /** Simula la API de usuarios (solo ADMIN) sobre la tabla en memoria. */
  function responderUsuarios(ruta, metodo, camino, cuerpo) {
    if (actual?.rol !== 'ADMIN') return ruta.fulfill(problema(403, 'ACCESO_DENEGADO', 'Acceso denegado'));
    const url = new URL(ruta.request().url());
    const id = Number(camino.split('/')[2]);
    const usuario = tabla.find((u) => u.id === id);
    if (metodo === 'GET') {
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const rol = url.searchParams.get('rol');
      const activo = url.searchParams.get('activo');
      const pagina = Number(url.searchParams.get('pagina') ?? 0);
      const tamano = Number(url.searchParams.get('tamano') ?? 20);
      const filtrados = tabla
        .filter((u) => !q || u.nombreUsuario.includes(q) || u.nombreCompleto.toLowerCase().includes(q))
        .filter((u) => !rol || u.rol === rol)
        .filter((u) => !activo || String(u.activo) === activo)
        .sort((a, b) => a.nombreUsuario.localeCompare(b.nombreUsuario));
      return ruta.fulfill({ json: {
        contenido: filtrados.slice(pagina * tamano, (pagina + 1) * tamano), pagina, tamano,
        totalElementos: filtrados.length, totalPaginas: Math.ceil(filtrados.length / tamano),
      } });
    }
    if (metodo === 'POST' && camino === '/usuarios') {
      const nombre = cuerpo.nombreUsuario.toLowerCase();
      if (tabla.some((u) => u.nombreUsuario === nombre)) {
        return ruta.fulfill(problema(409, 'DUPLICADO', 'Ya existe un registro con ese valor.',
          { errores: [{ campo: 'nombreUsuario', mensaje: 'Ya existe un registro con ese valor.' }] }));
      }
      const nuevo = { id: siguienteId++, nombreUsuario: nombre, nombreCompleto: cuerpo.nombreCompleto, rol: cuerpo.rol,
        activo: true, bloqueado: false, debeCambiarPassword: true };
      tabla.push(nuevo);
      return ruta.fulfill({ status: 201, json: nuevo });
    }
    if (!usuario) return ruta.fulfill(problema(404, 'NO_ENCONTRADO', 'No encontrado'));
    if (usuario.id === actual.id && (camino.endsWith('/estado') || camino.endsWith('/restablecimiento'))) {
      return ruta.fulfill(problema(409, 'OPERACION_SOBRE_SI_MISMO', 'No puede hacerlo sobre sí mismo.'));
    }
    if (metodo === 'PUT') {
      Object.assign(usuario, { nombreCompleto: cuerpo.nombreCompleto, rol: cuerpo.rol });
      return ruta.fulfill({ json: usuario });
    }
    if (camino.endsWith('/estado')) {
      usuario.activo = cuerpo.activo;
      return ruta.fulfill({ json: usuario });
    }
    if (camino.endsWith('/restablecimiento')) {
      Object.assign(usuario, { bloqueado: false, debeCambiarPassword: true });
      return ruta.fulfill({ status: 204 });
    }
    return ruta.fulfill(problema(404, 'NO_ENCONTRADO', 'No encontrado'));
  }

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
