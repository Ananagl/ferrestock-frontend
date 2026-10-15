/**
 * Nombre:                 esquemas.js
 * Descripción:            Esquemas Yup de los formularios de autenticación. Se crean con la función de traducción para que los mensajes salgan en el idioma activo.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
 * @file
 */
import * as yup from 'yup';

/**
 * Esquema del formulario de ingreso.
 * @param {import('i18next').TFunction} t - Función de traducción.
 * @returns {yup.ObjectSchema<any>} Esquema.
 */
export function crearEsquemaIngreso(t) {
  return yup.object({
    usuario: yup.string().trim()
      .required(t('validacion:obligatorio'))
      .max(50, t('validacion:longitudMaxima', { max: 50 })),
    contrasena: yup.string()
      .required(t('validacion:obligatorio'))
      .max(72, t('validacion:longitudMaxima', { max: 72 })),
    recordarme: yup.boolean(),
  });
}

/**
 * Esquema del cambio de contraseña: misma política que el backend (8-72, letra y número), distinta de la actual
 * y confirmada. El backend vuelve a validar todo.
 * @param {import('i18next').TFunction} t - Función de traducción.
 * @returns {yup.ObjectSchema<any>} Esquema.
 */
export function crearEsquemaCambioContrasena(t) {
  return yup.object({
    actual: yup.string().required(t('validacion:obligatorio')).max(72, t('validacion:longitudMaxima', { max: 72 })),
    nueva: yup.string()
      .required(t('validacion:obligatorio'))
      .min(8, t('validacion:contrasenaInsegura'))
      .max(72, t('validacion:contrasenaInsegura'))
      .matches(/\p{L}/u, t('validacion:contrasenaInsegura'))
      .matches(/\d/, t('validacion:contrasenaInsegura'))
      .notOneOf([yup.ref('actual')], t('validacion:contrasenaRepetida')),
    confirmacion: yup.string()
      .required(t('validacion:obligatorio'))
      .oneOf([yup.ref('nueva')], t('validacion:contrasenaNoCoincide')),
  });
}
