/**
 * Nombre:                 clienteHttp.js
 * Descripción:            Cliente HTTP central (Axios): base de la API, cookie de sesión, cabecera CSRF, idioma en
 *                         Accept-Language y aviso global cuando la sesión expira (401).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.1.0
 * @file
 */
import axios from 'axios';
import i18n from '../../i18n/configuracion.js';

/** Evento del navegador que se emite cuando el backend responde 401 (lo escucha el módulo de autenticación). */
export const EVENTO_SESION_EXPIRADA = 'fs:sesion-expirada';

/**
 * Instancia de Axios para todas las llamadas a la API REST.
 * La autenticación viaja en la cookie de sesión (no se guardan tokens en el navegador).
 */
export const clienteHttp = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '/api/v1',
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

clienteHttp.interceptors.request.use((config) => {
  config.headers['Accept-Language'] = i18n.resolvedLanguage ?? 'es';
  return config;
});

clienteHttp.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent(EVENTO_SESION_EXPIRADA));
    }
    return Promise.reject(error);
  },
);

/**
 * Consulta el endpoint público de salud del backend (fuera de /api/v1).
 * @returns {Promise<boolean>} true si el backend responde con estado UP.
 */
export async function backendDisponible() {
  const { data } = await axios.get('/actuator/health', { timeout: 5000 });
  return data?.status === 'UP';
}
