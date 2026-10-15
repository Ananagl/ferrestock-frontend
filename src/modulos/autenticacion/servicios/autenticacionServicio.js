/**
 * Nombre:                 autenticacionServicio.js
 * Descripción:            Llamadas a la API de autenticación: sesión, ingreso, salida, contraseña e idioma.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
 * @file
 */
import { clienteHttp, prepararCsrf } from '../../../servicios/api/clienteHttp.js';

/**
 * @typedef {object} Sesion
 * @property {number} id
 * @property {string} nombreUsuario
 * @property {string} nombreCompleto
 * @property {'ADMIN'|'OPERATIVO'} rol
 * @property {'es'|'en'} idioma
 * @property {boolean} debeCambiarPassword
 */

export { prepararCsrf };

/** @returns {Promise<Sesion>} Sesión actual (rechaza con 401 si no hay). */
export async function obtenerSesion() {
  const { data } = await clienteHttp.get('/auth/sesion');
  return data;
}

/**
 * @param {{usuario: string, contrasena: string, recordarme: boolean}} credenciales - Datos del formulario.
 * @returns {Promise<Sesion>} Sesión iniciada.
 */
export async function iniciarSesion(credenciales) {
  const { data } = await clienteHttp.post('/auth/login', credenciales);
  return data;
}

/** @returns {Promise<void>} Cierra la sesión y la sesión persistente. */
export async function cerrarSesion() {
  await clienteHttp.post('/auth/logout');
}

/**
 * @param {{actual: string, nueva: string, confirmacion: string}} datos - Contraseñas.
 * @returns {Promise<void>}
 */
export async function cambiarContrasena(datos) {
  await clienteHttp.put('/auth/contrasena', datos);
}

/**
 * @param {'es'|'en'} idioma - Idioma preferido.
 * @returns {Promise<void>}
 */
export async function guardarIdioma(idioma) {
  await clienteHttp.put('/auth/idioma', { idioma });
}
