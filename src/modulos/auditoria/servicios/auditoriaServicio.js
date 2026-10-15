/**
 * Nombre:                 auditoriaServicio.js
 * Descripción:            Llamadas a la API de auditoría (solo ADMIN).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.10.0
 * @file
 */
import { clienteHttp } from '../../../servicios/api/clienteHttp.js';

/**
 * @param {{usuarioId?: number, accion?: string, desde?: string, hasta?: string, q?: string, pagina: number, tamano: number}} parametros - Filtros.
 * @returns {Promise<{contenido: object[], totalElementos: number}>} Eventos paginados.
 */
export async function consultarAuditoria(parametros) {
  const { data } = await clienteHttp.get('/auditoria', { params: parametros });
  return data;
}
