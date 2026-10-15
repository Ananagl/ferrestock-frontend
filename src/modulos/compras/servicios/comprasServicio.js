/**
 * Nombre:                 comprasServicio.js
 * Descripción:            Llamadas a la API de compras: listado, detalle, registro y anulación.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.8.0
 * @file
 */
import { clienteHttp } from '../../../servicios/api/clienteHttp.js';

/**
 * @param {{proveedorId?: number, estado?: string, desde?: string, hasta?: string, pagina: number, tamano: number}} parametros - Filtros.
 * @returns {Promise<{contenido: object[], totalElementos: number}>} Compras paginadas.
 */
export async function listarCompras(parametros) {
  const { data } = await clienteHttp.get('/compras', { params: parametros });
  return data;
}

/** @param {number|string} id - Compra. @returns {Promise<object>} Compra con líneas. */
export async function obtenerCompra(id) {
  const { data } = await clienteHttp.get(`/compras/${id}`);
  return data;
}

/**
 * @param {{proveedorId: number, observacion: string|null, lineas: {productoId: number, cantidad: string, costoUnitario: string}[]}} datos - Compra.
 * @returns {Promise<object>} Compra registrada.
 */
export async function registrarCompra(datos) {
  const { data } = await clienteHttp.post('/compras', datos);
  return data;
}

/** @param {number} id - Compra. @param {string} motivo - Motivo. @returns {Promise<object>} Compra anulada. */
export async function anularCompra(id, motivo) {
  const { data } = await clienteHttp.post(`/compras/${id}/anulacion`, { motivo });
  return data;
}
