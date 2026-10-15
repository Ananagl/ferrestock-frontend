/**
 * Nombre:                 ventasServicio.js
 * Descripción:            Llamadas a la API de ventas: listado, detalle, confirmación con pago y anulación.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.8.0
 * @file
 */
import { clienteHttp } from '../../../servicios/api/clienteHttp.js';

/**
 * @param {{clienteId?: number, estado?: string, desde?: string, hasta?: string, pagina: number, tamano: number}} parametros - Filtros.
 * @returns {Promise<{contenido: object[], totalElementos: number}>} Ventas paginadas.
 */
export async function listarVentas(parametros) {
  const { data } = await clienteHttp.get('/ventas', { params: parametros });
  return data;
}

/** @param {number|string} id - Venta. @returns {Promise<object>} Venta con líneas y pago. */
export async function obtenerVenta(id) {
  const { data } = await clienteHttp.get(`/ventas/${id}`);
  return data;
}

/**
 * El precio no se envía: el servidor usa el precio vigente.
 * @param {{clienteId: number, lineas: {productoId: number, cantidad: string}[], pago: {medio: 'EFECTIVO', valorRecibido: string}}} datos - Venta.
 * @returns {Promise<object>} Venta confirmada.
 */
export async function registrarVenta(datos) {
  const { data } = await clienteHttp.post('/ventas', datos);
  return data;
}

/** @param {number} id - Venta. @param {string} motivo - Motivo. @returns {Promise<object>} Venta anulada. */
export async function anularVenta(id, motivo) {
  const { data } = await clienteHttp.post(`/ventas/${id}/anulacion`, { motivo });
  return data;
}
