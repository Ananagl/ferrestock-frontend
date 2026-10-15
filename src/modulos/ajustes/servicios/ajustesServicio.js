/**
 * Nombre:                 ajustesServicio.js
 * Descripción:            Llamadas a la API de ajustes de inventario (solo ADMIN).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.7.0
 * @file
 */
import { clienteHttp } from '../../../servicios/api/clienteHttp.js';

/** Tipos de ajuste. */
export const TIPOS_AJUSTE = Object.freeze(['ENTRADA', 'SALIDA']);

/**
 * @typedef {object} Ajuste
 * @property {number} id - Identificador.
 * @property {string} consecutivo - Número del documento (AJU-000001).
 * @property {string} fecha - Fecha ISO-8601 en UTC.
 * @property {number} productoId - Producto.
 * @property {string} productoCodigo - Código del producto.
 * @property {string} productoNombre - Nombre del producto.
 * @property {'ENTRADA'|'SALIDA'} tipo - Sentido del ajuste.
 * @property {string} cantidad - Cantidad (texto decimal).
 * @property {string} costoUnitario - Costo de la entrada o CPP con que salió.
 * @property {string} motivo - Motivo documentado.
 * @property {string} usuario - Responsable.
 * @property {string} [existenciasResultantes] - Solo en la respuesta al registrar.
 */

/**
 * @param {{productoId?: number, tipo?: string, desde?: string, hasta?: string, pagina: number, tamano: number}} parametros - Filtros.
 * @returns {Promise<{contenido: Ajuste[], totalElementos: number}>} Historial paginado.
 */
export async function listarAjustes(parametros) {
  const { data } = await clienteHttp.get('/ajustes', { params: parametros });
  return data;
}

/**
 * @param {{productoId: number, tipo: string, cantidad: string, costoUnitario: string|null, motivo: string}} datos - Ajuste.
 * @returns {Promise<Ajuste>} Ajuste registrado.
 */
export async function registrarAjuste(datos) {
  const { data } = await clienteHttp.post('/ajustes', datos);
  return data;
}
