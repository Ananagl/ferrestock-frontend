/**
 * Nombre:                 esquemas.js
 * Descripción:            Esquemas Yup de los formularios de usuarios, con las mismas reglas que el backend.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.3.0
 * @file
 */
import * as yup from 'yup';

/**
 * Política de contraseña compartida con el backend (8 a 72 caracteres, letra y número).
 * @param {import('i18next').TFunction} t - Traducción.
 * @returns {yup.StringSchema} Esquema.
 */
function contrasena(t) {
  return yup.string().required(t('validacion:obligatorio'))
    .min(8, t('validacion:contrasenaInsegura')).max(72, t('validacion:contrasenaInsegura'))
    .matches(/\p{L}/u, t('validacion:contrasenaInsegura')).matches(/\d/, t('validacion:contrasenaInsegura'));
}

/**
 * @param {import('i18next').TFunction} t - Traducción.
 * @param {boolean} esNuevo - Alta (incluye nombre de usuario y contraseña) o edición.
 * @returns {yup.ObjectSchema<any>} Esquema.
 */
export function crearEsquemaUsuario(t, esNuevo) {
  const base = {
    nombreCompleto: yup.string().trim().required(t('validacion:obligatorio'))
      .min(2, t('validacion:longitud', { min: 2, max: 120 })).max(120, t('validacion:longitud', { min: 2, max: 120 })),
    rol: yup.string().oneOf(['ADMIN', 'OPERATIVO']).required(t('validacion:obligatorio')),
  };
  if (!esNuevo) return yup.object(base);
  return yup.object({
    nombreUsuario: yup.string().trim().required(t('validacion:obligatorio'))
      .matches(/^[A-Za-z0-9._-]{3,50}$/, t('usuarios:validacion.nombreUsuario')),
    ...base,
    contrasenaTemporal: contrasena(t),
  });
}

/**
 * @param {import('i18next').TFunction} t - Traducción.
 * @returns {yup.ObjectSchema<any>} Esquema del restablecimiento.
 */
export function crearEsquemaRestablecer(t) {
  return yup.object({ contrasenaTemporal: contrasena(t) });
}
