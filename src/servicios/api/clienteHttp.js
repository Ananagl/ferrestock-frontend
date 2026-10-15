/**
 * Nombre:                 clienteHttp.js
 * Descripción:            Cliente HTTP central (Axios): base de la API, cookie de sesión, cabecera CSRF (la obtiene si falta), idioma en Accept-Language y aviso global cuando la sesión expira (401).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
 * @file
 */
import axios from 'axios';
import i18n from '../../i18n/configuracion.js';

/** Evento del navegador que se emite cuando el backend responde 401 (lo escucha ProveedorSesion). */
export const EVENTO_SESION_EXPIRADA = 'fs:sesion-expirada';

/** Ruta base de la API REST (mismo origen, ADR-04). */
export const BASE_API = import.meta.env.VITE_API_BASE ?? '/api/v1';

const METODOS_QUE_MODIFICAN = ['post', 'put', 'patch', 'delete'];

/**
 * Instancia de Axios para todas las llamadas a la API REST.
 * La autenticación viaja en la cookie de sesión; no se guardan tokens en el navegador.
 */
export const clienteHttp = axios.create({
  baseURL: BASE_API,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

/** @returns {boolean} true si el navegador ya tiene la cookie XSRF-TOKEN. */
function hayTokenCsrf() {
  return document.cookie.split(';').some((cookie) => cookie.trim().startsWith('XSRF-TOKEN='));
}

/**
 * Pide al backend la cookie XSRF-TOKEN (necesaria antes de cualquier POST/PUT/PATCH/DELETE).
 * @returns {Promise<void>}
 */
export async function prepararCsrf() {
  await axios.get(`${BASE_API}/auth/csrf`, { withCredentials: true });
}

clienteHttp.interceptors.request.use(async (config) => {
  config.headers['Accept-Language'] = i18n.resolvedLanguage ?? 'es';
  if (METODOS_QUE_MODIFICAN.includes(config.method) && !hayTokenCsrf()) {
    await prepararCsrf();
  }
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
