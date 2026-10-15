/**
 * Nombre:                 apiSimulada.js
 * Descripción:            Backend simulado para las pruebas E2E: reproduce los contratos de autenticación, usuarios, catálogo y terceros (04_api_rest.md) sin depender del servidor real.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.5.0
 * @file
 */
import { calcularDigitoNit } from '../../../compartido/utilidades/nit.js';

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
  // Catálogo (incremento 3)
  const categorias = [
    { id: 1, nombre: 'Herramientas manuales', activa: true },
    { id: 2, nombre: 'Eléctricos', activa: true },
    { id: 3, nombre: 'Descontinuada', activa: false },
  ];
  const terceros = [
    { id: 20, tipoPersona: 'JURIDICA', tipoDocumento: 'NIT', numeroDocumento: '890903938', digitoVerificacion: '8',
      nombre: 'Distribuidora Antioquia SAS', telefono: '604 444 5566', correo: 'ventas@distrib.co', direccion: null,
      esCliente: false, esProveedor: true, activo: true },
    { id: 21, tipoPersona: 'NATURAL', tipoDocumento: 'CC', numeroDocumento: '1020304050', digitoVerificacion: null,
      nombre: 'Carlos Pérez', telefono: null, correo: null, direccion: null, esCliente: true, esProveedor: false, activo: true },
  ];
  const productos = [
    { id: 10, codigo: 'FER-001', nombre: 'Martillo de uña 16 oz', descripcion: null, categoria: categorias[0],
      unidadMedida: 'UNIDAD', permiteFraccion: false, precioVenta: '35000.00', existencias: '8.000', estado: 'ACTIVO', version: 0 },
    { id: 11, codigo: 'ELE-012', nombre: 'Cable eléctrico N.º 12', descripcion: 'Rollo de 100 m', categoria: categorias[1],
      unidadMedida: 'METRO', permiteFraccion: true, precioVenta: '2500.50', existencias: '87.500', estado: 'ACTIVO', version: 0 },
    { id: 12, codigo: 'FER-099', nombre: 'Serrucho antiguo', descripcion: null, categoria: categorias[0],
      unidadMedida: 'UNIDAD', permiteFraccion: false, precioVenta: '18000.00', existencias: '0.000', estado: 'INACTIVO', version: 0 },
  ];
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
    if (camino.startsWith('/categorias')) return responderCategorias(ruta, metodo, camino, cuerpo);
    if (camino.startsWith('/productos')) return responderProductos(ruta, metodo, camino, cuerpo);
    if (camino.startsWith('/terceros')) return responderTerceros(ruta, metodo, camino, cuerpo);
    return ruta.fulfill(problema(404, 'NO_ENCONTRADO', 'No encontrado'));
  });

  /** Simula la API de categorías: consulta para todos, gestión solo ADMIN. */
  function responderCategorias(ruta, metodo, camino, cuerpo) {
    if (metodo === 'GET') {
      const activa = new URL(ruta.request().url()).searchParams.get('activa');
      return ruta.fulfill({ json: categorias.filter((c) => activa === null || String(c.activa) === activa)
        .sort((a, b) => a.nombre.localeCompare(b.nombre)) });
    }
    if (actual?.rol !== 'ADMIN') return ruta.fulfill(problema(403, 'ACCESO_DENEGADO', 'Acceso denegado'));
    const id = Number(camino.split('/')[2]);
    if (metodo === 'POST' || metodo === 'PUT') {
      if (categorias.some((c) => c.id !== id && c.nombre.toLowerCase() === cuerpo.nombre.toLowerCase())) {
        return ruta.fulfill(problema(409, 'DUPLICADO', 'Ya existe un registro con ese valor.',
          { errores: [{ campo: 'nombre', mensaje: 'Ya existe un registro con ese valor.' }] }));
      }
      if (metodo === 'POST') {
        const nueva = { id: siguienteId++, nombre: cuerpo.nombre, activa: true };
        categorias.push(nueva);
        return ruta.fulfill({ status: 201, json: nueva });
      }
      const categoria = categorias.find((c) => c.id === id);
      categoria.nombre = cuerpo.nombre;
      return ruta.fulfill({ json: categoria });
    }
    const categoria = categorias.find((c) => c.id === id);
    categoria.activa = cuerpo.activa;
    return ruta.fulfill({ json: categoria });
  }

  /** Simula la API de productos (ADMIN y OPERATIVO) con bloqueo optimista por versión. */
  function responderProductos(ruta, metodo, camino, cuerpo) {
    const url = new URL(ruta.request().url());
    const id = Number(camino.split('/')[2]);
    const producto = productos.find((p) => p.id === id);
    if (metodo === 'GET' && camino === '/productos') {
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const categoriaId = url.searchParams.get('categoriaId');
      const estado = url.searchParams.get('estado');
      const pagina = Number(url.searchParams.get('pagina') ?? 0);
      const tamano = Number(url.searchParams.get('tamano') ?? 20);
      const filtrados = productos
        .filter((p) => !q || p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q))
        .filter((p) => !categoriaId || String(p.categoria.id) === categoriaId)
        .filter((p) => !estado || p.estado === estado)
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      return ruta.fulfill({ json: { contenido: filtrados.slice(pagina * tamano, (pagina + 1) * tamano), pagina, tamano,
        totalElementos: filtrados.length, totalPaginas: Math.ceil(filtrados.length / tamano) } });
    }
    if (metodo === 'POST') {
      const codigo = cuerpo.codigo.toUpperCase();
      if (productos.some((p) => p.codigo === codigo)) {
        return ruta.fulfill(problema(409, 'DUPLICADO', 'Ya existe un registro con ese valor.',
          { errores: [{ campo: 'codigo', mensaje: 'Ya existe un registro con ese valor.' }] }));
      }
      const nuevo = { ...cuerpo, id: siguienteId++, codigo, categoria: categorias.find((c) => c.id === cuerpo.categoriaId),
        precioVenta: Number(cuerpo.precioVenta).toFixed(2), existencias: '0.000', estado: 'ACTIVO', version: 0 };
      productos.push(nuevo);
      return ruta.fulfill({ status: 201, json: nuevo });
    }
    if (!producto) return ruta.fulfill(problema(404, 'NO_ENCONTRADO', 'No encontrado'));
    if (metodo === 'PUT') {
      if (cuerpo.version !== producto.version) {
        return ruta.fulfill(problema(409, 'VERSION_DESACTUALIZADA', 'Otra persona modificó este registro.'));
      }
      Object.assign(producto, { nombre: cuerpo.nombre, descripcion: cuerpo.descripcion, unidadMedida: cuerpo.unidadMedida,
        permiteFraccion: cuerpo.permiteFraccion, categoria: categorias.find((c) => c.id === cuerpo.categoriaId),
        version: producto.version + 1 });
      return ruta.fulfill({ json: producto });
    }
    if (camino.endsWith('/precio')) {
      producto.precioVenta = Number(cuerpo.precioVenta).toFixed(2);
      producto.version += 1;
      return ruta.fulfill({ json: producto });
    }
    if (camino.endsWith('/estado')) {
      producto.estado = cuerpo.estado;
      producto.version += 1;
      return ruta.fulfill({ json: producto });
    }
    return ruta.fulfill(problema(404, 'NO_ENCONTRADO', 'No encontrado'));
  }

  /** Simula la API de terceros con las reglas del backend (DV del NIT, duplicados, rol requerido). */
  function responderTerceros(ruta, metodo, camino, cuerpo) {
    const url = new URL(ruta.request().url());
    const id = Number(camino.split('/')[2]);
    const tercero = terceros.find((x) => x.id === id);
    if (metodo === 'GET' && camino === '/terceros') {
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const rol = url.searchParams.get('rol');
      const tipoPersona = url.searchParams.get('tipoPersona');
      const activo = url.searchParams.get('activo');
      const filtrados = terceros
        .filter((x) => !q || x.nombre.toLowerCase().includes(q) || x.numeroDocumento.includes(q))
        .filter((x) => !rol || (rol === 'CLIENTE' ? x.esCliente : x.esProveedor))
        .filter((x) => !tipoPersona || x.tipoPersona === tipoPersona)
        .filter((x) => !activo || String(x.activo) === activo)
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
      return ruta.fulfill({ json: { contenido: filtrados, pagina: 0, tamano: 20, totalElementos: filtrados.length, totalPaginas: 1 } });
    }
    const errorCampo = (status, codigo, campo, mensaje) => ruta.fulfill(problema(status, codigo, mensaje,
      { errores: [{ campo, mensaje }] }));
    if (metodo === 'POST' || metodo === 'PUT') {
      if (!cuerpo.esCliente && !cuerpo.esProveedor) return errorCampo(400, 'ROL_TERCERO_REQUERIDO', 'esCliente', 'Rol requerido');
    }
    if (metodo === 'POST') {
      if (cuerpo.tipoDocumento === 'NIT' && calcularDigitoNit(cuerpo.numeroDocumento) !== Number(cuerpo.digitoVerificacion)) {
        return errorCampo(400, 'DIGITO_VERIFICACION_INVALIDO', 'digitoVerificacion', 'El dígito de verificación no corresponde al NIT.');
      }
      if (terceros.some((x) => x.tipoDocumento === cuerpo.tipoDocumento && x.numeroDocumento === cuerpo.numeroDocumento)) {
        return errorCampo(409, 'DUPLICADO', 'numeroDocumento', 'Ya existe un registro con ese valor.');
      }
      const nuevo = { ...cuerpo, id: siguienteId++, activo: true };
      terceros.push(nuevo);
      return ruta.fulfill({ status: 201, json: nuevo });
    }
    if (!tercero) return ruta.fulfill(problema(404, 'NO_ENCONTRADO', 'No encontrado'));
    if (metodo === 'PUT') {
      Object.assign(tercero, cuerpo);
      return ruta.fulfill({ json: tercero });
    }
    if (actual?.rol !== 'ADMIN') return ruta.fulfill(problema(403, 'ACCESO_DENEGADO', 'Acceso denegado'));
    tercero.activo = cuerpo.activo;
    return ruta.fulfill({ json: tercero });
  }

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

  return {
    llamadas,
    /** Simula que otra persona editó el producto (sube su versión en el "servidor"). */
    modificarProductoPorOtro(id) {
      productos.find((p) => p.id === id).version += 1;
    },
  };
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
