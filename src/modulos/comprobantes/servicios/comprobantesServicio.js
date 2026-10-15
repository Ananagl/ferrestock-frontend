/**
 * Nombre:                 comprobantesServicio.js
 * Descripción:            Llamadas a la API de comprobantes: búsqueda unificada y comprobante imprimible.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.10.0
 * @file
 */
import { clienteHttp } from '../../../servicios/api/clienteHttp.js';

/** Tipos de documento con comprobante. */
export const TIPOS_DOCUMENTO = Object.freeze(['VENTA', 'COMPRA', 'DEVOLUCION', 'AJUSTE']);

/**
 * @param {{tipo?: string, consecutivo?: string, desde?: string, hasta?: string, pagina: number, tamano: number}} parametros - Filtros.
 * @returns {Promise<{contenido: object[], totalElementos: number}>} Comprobantes.
 */
export async function buscarComprobantes(parametros) {
  const { data } = await clienteHttp.get('/comprobantes', { params: parametros });
  return data;
}

/** @param {string} tipo - Tipo. @param {string} consecutivo - Consecutivo. @returns {Promise<object>} Comprobante. */
export async function obtenerComprobante(tipo, consecutivo) {
  const { data } = await clienteHttp.get(`/comprobantes/${tipo}/${consecutivo}`);
  return data;
}
