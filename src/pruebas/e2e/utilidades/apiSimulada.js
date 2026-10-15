/**
 * Nombre:                 apiSimulada.js
 * Descripción:            Backend simulado para las pruebas E2E: reproduce los contratos de autenticación, usuarios, catálogo, terceros, inventario, ajustes y documentos (04_api_rest.md) sin depender del servidor real.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.8.0
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
  // Kardex de FER-001 (CA-INV-01): entrada de 10, venta de 3 y ajuste de salida de 1 → saldo 6... más 2 de compra = 8
  const kardex = {
    10: [
      { id: 4, fecha: '2026-10-15T14:00:00Z', tipo: 'COMPRA', naturaleza: 'ENTRADA', cantidad: '2.000', saldoResultante: '8.000',
        documentoTipo: 'COMPRA', documentoId: 2, usuario: 'operador', costoUnitario: '21000.0000', costoPromedioResultante: '20250.0000' },
      { id: 3, fecha: '2026-10-14T18:00:00Z', tipo: 'AJUSTE_SALIDA', naturaleza: 'SALIDA', cantidad: '1.000', saldoResultante: '6.000',
        documentoTipo: 'AJUSTE', documentoId: 1, usuario: 'admin', costoUnitario: '20000.0000', costoPromedioResultante: '20000.0000' },
      { id: 2, fecha: '2026-10-14T15:00:00Z', tipo: 'VENTA', naturaleza: 'SALIDA', cantidad: '3.000', saldoResultante: '7.000',
        documentoTipo: 'VENTA', documentoId: 1, usuario: 'operador', costoUnitario: '20000.0000', costoPromedioResultante: '20000.0000' },
      { id: 1, fecha: '2026-10-13T15:00:00Z', tipo: 'COMPRA', naturaleza: 'ENTRADA', cantidad: '10.000', saldoResultante: '10.000',
        documentoTipo: 'COMPRA', documentoId: 1, usuario: 'operador', costoUnitario: '20000.0000', costoPromedioResultante: '20000.0000' },
    ],
  };
  const costos = { 10: '20250.0000', 11: '1800.0000', 12: '0.0000' };
  const productos = [
    { id: 10, codigo: 'FER-001', nombre: 'Martillo de uña 16 oz', descripcion: null, categoria: categorias[0],
      unidadMedida: 'UNIDAD', permiteFraccion: false, precioVenta: '35000.00', existencias: '8.000', estado: 'ACTIVO', version: 0 },
    { id: 11, codigo: 'ELE-012', nombre: 'Cable eléctrico N.º 12', descripcion: 'Rollo de 100 m', categoria: categorias[1],
      unidadMedida: 'METRO', permiteFraccion: true, precioVenta: '2500.50', existencias: '87.500', estado: 'ACTIVO', version: 0 },
    { id: 12, codigo: 'FER-099', nombre: 'Serrucho antiguo', descripcion: null, categoria: categorias[0],
      unidadMedida: 'UNIDAD', permiteFraccion: false, precioVenta: '18000.00', existencias: '0.000', estado: 'INACTIVO', version: 0 },
  ];
  // Historial de ajustes (incremento 6): el ajuste de salida que aparece en el kardex de FER-001
  const ajustes = [
    { id: 1, consecutivo: 'AJU-000001', fecha: '2026-10-14T18:00:00Z', productoId: 10, productoCodigo: 'FER-001',
      productoNombre: 'Martillo de uña 16 oz', tipo: 'SALIDA', cantidad: '1.000', costoUnitario: '20000.0000',
      motivo: 'Unidad dañada en bodega', usuario: 'admin' },
  ];
  // Compras (incremento 7): las dos compras del kardex de FER-001
  const compras = [
    { id: 1, consecutivo: 'COM-000001', fecha: '2026-10-13T15:00:00Z', proveedorId: 20, proveedorNombre: 'Distribuidora Antioquia SAS',
      observacion: 'Factura FV-881', total: '200000.00', estado: 'REGISTRADA', motivoAnulacion: null, anuladaPor: null, anuladaEn: null,
      usuario: 'operador', lineas: [{ id: 1, productoId: 10, productoCodigo: 'FER-001', productoNombre: 'Martillo de uña 16 oz',
        cantidad: '10.000', costoUnitario: '20000.0000', subtotal: '200000.00' }] },
    { id: 2, consecutivo: 'COM-000002', fecha: '2026-10-15T14:00:00Z', proveedorId: 20, proveedorNombre: 'Distribuidora Antioquia SAS',
      observacion: null, total: '42000.00', estado: 'REGISTRADA', motivoAnulacion: null, anuladaPor: null, anuladaEn: null,
      usuario: 'operador', lineas: [{ id: 2, productoId: 10, productoCodigo: 'FER-001', productoNombre: 'Martillo de uña 16 oz',
        cantidad: '2.000', costoUnitario: '21000.0000', subtotal: '42000.00' }] },
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
    // El kardex (/productos/{id}/movimientos) se atiende antes que el resto de /productos
    if (camino.startsWith('/inventario') || /^\/productos\/\d+\/movimientos$/.test(camino)) return responderInventario(ruta, camino);
    if (camino.startsWith('/productos')) return responderProductos(ruta, metodo, camino, cuerpo);
    if (camino.startsWith('/terceros')) return responderTerceros(ruta, metodo, camino, cuerpo);
    if (camino.startsWith('/ajustes')) return responderAjustes(ruta, metodo, cuerpo);
    if (camino.startsWith('/compras')) return responderCompras(ruta, metodo, camino, cuerpo);
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
    if (metodo === 'GET' && camino.endsWith('/costo')) {
      if (actual?.rol !== 'ADMIN') return ruta.fulfill(problema(403, 'ACCESO_DENEGADO', 'Acceso denegado'));
      return ruta.fulfill({ json: { productoId: id, costoPromedio: costos[id] ?? '0.0000', existencias: producto.existencias,
        valor: (Number(producto.existencias) * Number(costos[id] ?? 0)).toFixed(2) } });
    }
    if (metodo === 'GET') return ruta.fulfill({ json: producto });
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

  /** Simula la API de consulta de inventario; los costos solo se envían al ADMIN (DP-15). */
  function responderInventario(ruta, camino) {
    const url = new URL(ruta.request().url());
    const admin = actual?.rol === 'ADMIN';
    if (camino === '/inventario/existencias') {
      const q = (url.searchParams.get('q') ?? '').toLowerCase();
      const solo = url.searchParams.get('soloConExistencias') === 'true';
      const contenido = productos
        .filter((p) => !q || p.codigo.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q))
        .filter((p) => !solo || Number(p.existencias) > 0)
        .map((p) => ({
          productoId: p.id, codigo: p.codigo, nombre: p.nombre, categoria: p.categoria.nombre, unidadMedida: p.unidadMedida,
          estado: p.estado, existencias: p.existencias,
          ...(admin ? { costoPromedio: costos[p.id] ?? '0.0000',
            valorInventario: (Number(p.existencias) * Number(costos[p.id] ?? 0)).toFixed(2) } : {}),
        }));
      return ruta.fulfill({ json: { contenido, pagina: 0, tamano: 20, totalElementos: contenido.length, totalPaginas: 1 } });
    }
    if (camino === '/inventario/valorizacion') {
      if (!admin) return ruta.fulfill(problema(403, 'ACCESO_DENEGADO', 'Acceso denegado'));
      return ruta.fulfill({ json: { total: '319500.00', categorias: [
        { categoriaId: 1, nombre: 'Herramientas manuales', productos: 1, valor: '162000.00' },
        { categoriaId: 2, nombre: 'Eléctricos', productos: 1, valor: '157500.00' },
      ] } });
    }
    if (camino === '/inventario/verificacion') {
      if (!admin) return ruta.fulfill(problema(403, 'ACCESO_DENEGADO', 'Acceso denegado'));
      return ruta.fulfill({ json: [] });
    }
    const id = Number(camino.split('/')[2]);
    if (!productos.some((p) => p.id === id)) return ruta.fulfill(problema(404, 'NO_ENCONTRADO', 'No encontrado'));
    const tipo = url.searchParams.get('tipo');
    const contenido = (kardex[id] ?? [])
      .filter((m) => !tipo || m.tipo === tipo)
      .map((m) => (admin ? m : { ...m, costoUnitario: undefined, costoPromedioResultante: undefined }));
    return ruta.fulfill({ json: { contenido, pagina: 0, tamano: 20, totalElementos: contenido.length, totalPaginas: 1 } });
  }

  /**
   * Simula la API de ajustes (solo ADMIN) con las reglas del backend: motivo, costo en las entradas, fracciones y
   * existencias suficientes; un ajuste válido mueve existencias, CPP y kardex.
   */
  function responderAjustes(ruta, metodo, cuerpo) {
    if (actual?.rol !== 'ADMIN') return ruta.fulfill(problema(403, 'ACCESO_DENEGADO', 'Acceso denegado'));
    const url = new URL(ruta.request().url());
    if (metodo === 'GET') {
      const productoId = url.searchParams.get('productoId');
      const tipo = url.searchParams.get('tipo');
      const contenido = [...ajustes].reverse()
        .filter((a) => !productoId || String(a.productoId) === productoId)
        .filter((a) => !tipo || a.tipo === tipo);
      return ruta.fulfill({ json: { contenido, pagina: 0, tamano: 20, totalElementos: contenido.length, totalPaginas: 1 } });
    }
    const enCampo = (estado, codigo, campo, mensaje) => ruta.fulfill(problema(estado, codigo, mensaje,
      { errores: [{ campo, mensaje }] }));
    const producto = productos.find((p) => p.id === cuerpo.productoId);
    if (!producto) return ruta.fulfill(problema(404, 'NO_ENCONTRADO', 'No encontrado'));
    if ((cuerpo.motivo ?? '').trim().length < 5) {
      return enCampo(400, 'VALIDACION', 'motivo', 'El motivo debe tener entre 5 y 300 caracteres.');
    }
    if (producto.estado !== 'ACTIVO') return enCampo(409, 'PRODUCTO_INACTIVO', 'productoId', 'El producto está inactivo.');
    const cantidad = Number(cuerpo.cantidad);
    if (!producto.permiteFraccion && !Number.isInteger(cantidad)) {
      return enCampo(400, 'CANTIDAD_FRACCIONARIA_NO_PERMITIDA', 'cantidad', 'El producto no se vende en fracciones.');
    }
    const entrada = cuerpo.tipo === 'ENTRADA';
    if (entrada && cuerpo.costoUnitario == null) {
      return enCampo(400, 'COSTO_UNITARIO_REQUERIDO', 'costoUnitario', 'Indique el costo unitario de la entrada.');
    }
    const existencias = Number(producto.existencias);
    if (!entrada && cantidad > existencias) {
      return enCampo(409, 'EXISTENCIAS_INSUFICIENTES', 'cantidad',
        `Existencias insuficientes para ${producto.codigo}: disponibles ${existencias}.`);
    }
    const cpp = Number(costos[producto.id] ?? 0);
    const costo = entrada ? Number(cuerpo.costoUnitario) : cpp;
    const saldo = existencias + (entrada ? cantidad : -cantidad);
    const nuevoCpp = entrada && saldo > 0 ? (existencias * cpp + cantidad * costo) / saldo : cpp;
    producto.existencias = saldo.toFixed(3);
    costos[producto.id] = nuevoCpp.toFixed(4);
    const ajuste = {
      id: ajustes.length + 1, consecutivo: `AJU-${String(ajustes.length + 1).padStart(6, '0')}`, fecha: new Date().toISOString(),
      productoId: producto.id, productoCodigo: producto.codigo, productoNombre: producto.nombre, tipo: cuerpo.tipo,
      cantidad: cantidad.toFixed(3), costoUnitario: costo.toFixed(4), motivo: cuerpo.motivo.trim(), usuario: actual.nombreUsuario,
    };
    ajustes.push(ajuste);
    (kardex[producto.id] ??= []).unshift({
      id: 100 + ajuste.id, fecha: ajuste.fecha, tipo: entrada ? 'AJUSTE_ENTRADA' : 'AJUSTE_SALIDA',
      naturaleza: entrada ? 'ENTRADA' : 'SALIDA', cantidad: ajuste.cantidad, saldoResultante: producto.existencias,
      documentoTipo: 'AJUSTE', documentoId: ajuste.id, usuario: actual.nombreUsuario, costoUnitario: ajuste.costoUnitario,
      costoPromedioResultante: costos[producto.id],
    });
    return ruta.fulfill({ status: 201, json: { ...ajuste, existenciasResultantes: producto.existencias,
      costoPromedioResultante: costos[producto.id] } });
  }

  /** Mueve existencias, CPP y kardex de un producto simulado, como MovimientoInventarioServicio. */
  function mover(producto, tipo, naturaleza, cantidad, costo, documentoTipo, documentoId, { pondera = false, restaurar = null } = {}) {
    const existencias = Number(producto.existencias);
    const cpp = Number(costos[producto.id] ?? 0);
    const saldo = existencias + (naturaleza === 'ENTRADA' ? cantidad : -cantidad);
    let nuevo = cpp;
    if (pondera) nuevo = existencias === 0 ? costo : (existencias * cpp + cantidad * costo) / saldo;
    if (restaurar !== null) nuevo = restaurar;
    producto.existencias = saldo.toFixed(3);
    costos[producto.id] = nuevo.toFixed(4);
    (kardex[producto.id] ??= []).unshift({
      id: Date.now(), fecha: new Date().toISOString(), tipo, naturaleza, cantidad: cantidad.toFixed(3), saldoResultante: producto.existencias,
      documentoTipo, documentoId, usuario: actual.nombreUsuario, costoUnitario: costo.toFixed(4), costoPromedioResultante: costos[producto.id],
    });
  }

  /** Respuesta paginada simple. */
  function pagina(ruta, contenido) {
    return ruta.fulfill({ json: { contenido, pagina: 0, tamano: 20, totalElementos: contenido.length, totalPaginas: 1 } });
  }

  /** Simula la API de compras: registro con recepción completa y anulación solo ADMIN (03_inventario_y_costos.md, 5.2). */
  function responderCompras(ruta, metodo, camino, cuerpo) {
    const url = new URL(ruta.request().url());
    const id = Number(camino.split('/')[2]);
    if (metodo === 'GET' && camino === '/compras') {
      const proveedorId = url.searchParams.get('proveedorId');
      const estado = url.searchParams.get('estado');
      return pagina(ruta, [...compras].reverse()
        .filter((c) => !proveedorId || String(c.proveedorId) === proveedorId)
        .filter((c) => !estado || c.estado === estado)
        .map((c) => ({ ...c, lineas: undefined })));
    }
    if (metodo === 'POST' && camino === '/compras') {
      const proveedor = terceros.find((x) => x.id === cuerpo.proveedorId);
      if (!proveedor?.esProveedor || !proveedor.activo) {
        return ruta.fulfill(problema(409, 'TERCERO_INACTIVO', 'El proveedor no está disponible.',
          { errores: [{ campo: 'proveedorId', mensaje: 'El proveedor no está disponible.' }] }));
      }
      const nueva = { id: compras.length + 1, consecutivo: `COM-${String(compras.length + 1).padStart(6, '0')}`,
        fecha: new Date().toISOString(), proveedorId: proveedor.id, proveedorNombre: proveedor.nombre, observacion: cuerpo.observacion,
        estado: 'REGISTRADA', motivoAnulacion: null, anuladaPor: null, anuladaEn: null, usuario: actual.nombreUsuario, lineas: [] };
      let total = 0;
      cuerpo.lineas.forEach((l, i) => {
        const producto = productos.find((p) => p.id === l.productoId);
        const cantidad = Number(l.cantidad);
        const costo = Number(l.costoUnitario);
        const subtotal = Math.round(cantidad * costo * 100) / 100;
        total += subtotal;
        nueva.lineas.push({ id: 100 + i, productoId: producto.id, productoCodigo: producto.codigo, productoNombre: producto.nombre,
          cantidad: cantidad.toFixed(3), costoUnitario: costo.toFixed(4), subtotal: subtotal.toFixed(2) });
        mover(producto, 'COMPRA', 'ENTRADA', cantidad, costo, 'COMPRA', nueva.id, { pondera: true });
      });
      nueva.total = total.toFixed(2);
      compras.push(nueva);
      return ruta.fulfill({ status: 201, json: nueva });
    }
    const compra = compras.find((c) => c.id === id);
    if (!compra) return ruta.fulfill(problema(404, 'NO_ENCONTRADO', 'No encontrado'));
    if (metodo === 'GET') return ruta.fulfill({ json: compra });
    if (actual?.rol !== 'ADMIN') return ruta.fulfill(problema(403, 'ACCESO_DENEGADO', 'Acceso denegado'));
    if (compras.some((c) => c.id > compra.id && c.estado === 'REGISTRADA'
      && c.lineas.some((l) => compra.lineas.some((x) => x.productoId === l.productoId)))) {
      return ruta.fulfill(problema(409, 'COMPRA_CON_MOVIMIENTOS_POSTERIORES',
        `Después de esta compra hubo otras entradas de ${compra.lineas[0].productoCodigo} que cambiaron su costo promedio.`));
    }
    compra.lineas.forEach((l) => {
      const producto = productos.find((p) => p.id === l.productoId);
      mover(producto, 'ANULACION_COMPRA', 'SALIDA', Number(l.cantidad), Number(l.costoUnitario), 'COMPRA', compra.id,
        { restaurar: 20000 });
    });
    Object.assign(compra, { estado: 'ANULADA', motivoAnulacion: cuerpo.motivo, anuladaPor: actual.nombreUsuario,
      anuladaEn: new Date().toISOString() });
    return ruta.fulfill({ json: compra });
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
