/**
 * Nombre:                 problemas.js
 * Descripción:            Convierte las respuestas de error ProblemDetail del backend en datos fáciles de mostrar en formularios y avisos.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
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
