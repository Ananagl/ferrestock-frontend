/**
 * Nombre:                 tercerosServicio.js
 * Descripción:            Llamadas a la API de clientes y proveedores.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.5.0
 * @file
 */
import { clienteHttp } from '../../../servicios/api/clienteHttp.js';

/**
 * @typedef {object} Tercero
 * @property {number} id
 * @property {'NATURAL'|'JURIDICA'} tipoPersona
 * @property {'CC'|'CE'|'NIT'} tipoDocumento
 * @property {string} numeroDocumento
 * @property {string|null} digitoVerificacion
 * @property {string} nombre
 * @property {string|null} telefono
 * @property {string|null} correo
 * @property {string|null} direccion
 * @property {boolean} esCliente
 * @property {boolean} esProveedor
 * @property {boolean} activo
 */

/**
 * @param {{q?: string, rol?: string, tipoPersona?: string, activo?: boolean, pagina: number, tamano: number}} parametros - Filtros.
 * @returns {Promise<{contenido: Tercero[], totalElementos: number}>} Página.
 */
export async function listarTerceros(parametros) {
  const { data } = await clienteHttp.get('/terceros', { params: { orden: 'nombre,asc', ...parametros } });
  return data;
}

/** @param {object} datos - Tercero nuevo. @returns {Promise<Tercero>} Creado. */
export async function crearTercero(datos) {
  const { data } = await clienteHttp.post('/terceros', datos);
  return data;
}

/** @param {number} id - Tercero. @param {object} datos - Nombre, contacto y roles. @returns {Promise<Tercero>} Actualizado. */
export async function actualizarTercero(id, datos) {
  const { data } = await clienteHttp.put(`/terceros/${id}`, datos);
  return data;
}

/** @param {number} id - Tercero. @param {boolean} activo - Estado. @returns {Promise<Tercero>} Actualizado. */
export async function cambiarEstadoTercero(id, activo) {
  const { data } = await clienteHttp.patch(`/terceros/${id}/estado`, { activo });
  return data;
}
