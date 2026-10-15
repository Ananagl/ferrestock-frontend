/**
 * Nombre:                 devolucionesServicio.js
 * Descripción:            Llamadas a la API de devoluciones y de lo que queda por devolver de una venta.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.9.0
 * @file
 */
import { clienteHttp } from '../../../servicios/api/clienteHttp.js';

/** Resultados de validación de una línea. */
export const RESULTADOS = Object.freeze(['ACEPTADA', 'RECHAZADA']);

/**
 * @param {{clienteId?: number, ventaId?: number, desde?: string, hasta?: string, pagina: number, tamano: number}} parametros - Filtros.
 * @returns {Promise<{contenido: object[], totalElementos: number}>} Devoluciones paginadas.
 */
export async function listarDevoluciones(parametros) {
  const { data } = await clienteHttp.get('/devoluciones', { params: parametros });
  return data;
}

/** @param {number|string} id - Devolución. @returns {Promise<object>} Devolución con líneas. */
export async function obtenerDevolucion(id) {
  const { data } = await clienteHttp.get(`/devoluciones/${id}`);
  return data;
}

/**
 * @param {{clienteId: number, ventaId: number|null, motivo: string, lineas: {productoId: number, cantidad: string, resultado: string}[]}} datos - Devolución.
 * @returns {Promise<object>} Devolución registrada.
 */
export async function registrarDevolucion(datos) {
  const { data } = await clienteHttp.post('/devoluciones', datos);
  return data;
}

/**
 * @param {number} ventaId - Venta.
 * @returns {Promise<{ventaLineaId: number, productoId: number, productoCodigo: string, productoNombre: string,
 *   permiteFraccion: boolean, vendida: string, devuelta: string, disponible: string}[]>} Lo que queda por devolver.
 */
export async function consultarDevolvible(ventaId) {
  const { data } = await clienteHttp.get(`/ventas/${ventaId}/devolvible`);
  return data;
}
