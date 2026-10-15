/**
 * Nombre:                 problemas.js
 * Descripción:            Convierte las respuestas de error ProblemDetail del backend en datos fáciles de mostrar en formularios y avisos.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.8.0
 * @file
 */

/**
 * @typedef {object} Problema
 * @property {number} estado - Código HTTP (0 si no hubo respuesta).
 * @property {string} codigo - Código estable del backend o SIN_CONEXION.
 * @property {string|undefined} detalle - Mensaje traducido por el backend.
 * @property {Record<string,string>} errores - Mensajes por campo del formulario.
 * @property {string|undefined} correlacion - Identificador para reportar errores internos.
 */

/**
 * Lee un error de Axios.
 * @param {unknown} error - Error capturado.
 * @returns {Problema} Datos del problema.
 */
export function leerProblema(error) {
  const respuesta = /** @type {any} */ (error)?.response;
  const datos = respuesta?.data ?? {};
  return {
    estado: respuesta?.status ?? 0,
    codigo: datos.codigo ?? (respuesta ? 'ERROR_INTERNO' : 'SIN_CONEXION'),
    detalle: datos.detail,
    errores: Object.fromEntries((datos.errores ?? []).map((e) => [e.campo, e.mensaje])),
    correlacion: datos.correlacion,
  };
}

/**
 * Convierte los errores por campo del backend (por ejemplo {@code lineas[1].cantidad} o {@code proveedorId}) en el
 * objeto anidado que espera Formik, renombrando los campos que en el formulario se llaman distinto.
 * @param {Record<string,string>} errores - Errores planos de {@link leerProblema}.
 * @param {Record<string,string>} [renombres] - Último segmento del backend → nombre en el formulario (productoId → producto).
 * @returns {Record<string, any>} Errores anidados.
 */
export function erroresFormik(errores, renombres = {}) {
  const resultado = {};
  Object.entries(errores).forEach(([campo, mensaje]) => {
    const partes = campo.replace(/\[(\d+)\]/g, '.$1').split('.');
    const ultimo = partes.length - 1;
    partes[ultimo] = renombres[partes[ultimo]] ?? partes[ultimo];
    let nodo = resultado;
    partes.forEach((parte, i) => {
      if (i === ultimo) nodo[parte] = mensaje;
      else {
        nodo[parte] ??= /^\d+$/.test(partes[i + 1]) ? [] : {};
        nodo = nodo[parte];
      }
    });
  });
  return resultado;
}
