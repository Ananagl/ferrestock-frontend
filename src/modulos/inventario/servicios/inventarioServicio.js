/**
 * Nombre:                 inventarioServicio.js
 * Descripción:            Llamadas a la API de consulta de inventario: existencias, kardex, valorización y verificación.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.6.0
 * @file
 */
import { clienteHttp } from '../../../servicios/api/clienteHttp.js';

/** Tipos de movimiento del kardex. */
export const TIPOS_MOVIMIENTO = Object.freeze([
  'COMPRA', 'VENTA', 'DEVOLUCION', 'AJUSTE_ENTRADA', 'AJUSTE_SALIDA', 'ANULACION_COMPRA', 'ANULACION_VENTA',
]);

/**
 * @param {{q?: string, categoriaId?: number, soloConExistencias?: boolean, pagina: number, tamano: number}} parametros - Filtros.
 * @returns {Promise<{contenido: object[], totalElementos: number}>} Existencias paginadas.
 */
export async function listarExistencias(parametros) {
  const { data } = await clienteHttp.get('/inventario/existencias', { params: parametros });
  return data;
}

/**
 * @param {number} productoId - Producto.
 * @param {{desde?: string, hasta?: string, tipo?: string, pagina: number, tamano: number}} parametros - Filtros.
 * @returns {Promise<{contenido: object[], totalElementos: number}>} Movimientos paginados.
 */
export async function consultarKardex(productoId, parametros) {
  const { data } = await clienteHttp.get(`/productos/${productoId}/movimientos`, { params: parametros });
  return data;
}

/** @returns {Promise<{total: string, categorias: object[]}>} Valor del inventario (solo ADMIN). */
export async function consultarValorizacion() {
  const { data } = await clienteHttp.get('/inventario/valorizacion');
  return data;
}

/** @returns {Promise<object[]>} Productos inconsistentes con su kardex (vacío si todo coincide; solo ADMIN). */
export async function verificarConsistencia() {
  const { data } = await clienteHttp.get('/inventario/verificacion');
  return data;
}
