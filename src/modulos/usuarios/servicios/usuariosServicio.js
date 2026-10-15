/**
 * Nombre:                 usuariosServicio.js
 * Descripción:            Llamadas a la API de gestión de usuarios (solo ADMIN).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.3.0
 * @file
 */
import { clienteHttp } from '../../../servicios/api/clienteHttp.js';

/**
 * @typedef {object} Usuario
 * @property {number} id
 * @property {string} nombreUsuario
 * @property {string} nombreCompleto
 * @property {'ADMIN'|'OPERATIVO'} rol
 * @property {boolean} activo
 * @property {boolean} bloqueado
 * @property {boolean} debeCambiarPassword
 */

/**
 * @param {{q?: string, rol?: string, activo?: boolean, pagina: number, tamano: number}} parametros - Filtros.
 * @returns {Promise<{contenido: Usuario[], totalElementos: number}>} Página de usuarios.
 */
export async function listarUsuarios(parametros) {
  const { data } = await clienteHttp.get('/usuarios', { params: { orden: 'nombreUsuario,asc', ...parametros } });
  return data;
}

/**
 * @param {{nombreUsuario: string, nombreCompleto: string, rol: string, contrasenaTemporal: string}} datos - Usuario.
 * @returns {Promise<Usuario>} Usuario creado.
 */
export async function crearUsuario(datos) {
  const { data } = await clienteHttp.post('/usuarios', datos);
  return data;
}

/**
 * @param {number} id - Usuario.
 * @param {{nombreCompleto: string, rol: string}} datos - Cambios.
 * @returns {Promise<Usuario>} Usuario actualizado.
 */
export async function actualizarUsuario(id, datos) {
  const { data } = await clienteHttp.put(`/usuarios/${id}`, datos);
  return data;
}

/**
 * @param {number} id - Usuario.
 * @param {boolean} activo - Nuevo estado.
 * @returns {Promise<Usuario>} Usuario actualizado.
 */
export async function cambiarEstadoUsuario(id, activo) {
  const { data } = await clienteHttp.patch(`/usuarios/${id}/estado`, { activo });
  return data;
}

/**
 * @param {number} id - Usuario.
 * @param {string} contrasenaTemporal - Nueva contraseña temporal.
 * @returns {Promise<void>}
 */
export async function restablecerContrasena(id, contrasenaTemporal) {
  await clienteHttp.post(`/usuarios/${id}/restablecimiento`, { contrasenaTemporal });
}
