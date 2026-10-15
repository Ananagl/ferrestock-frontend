/**
 * Nombre:                 esquemas.js
 * Descripción:            Esquemas Yup de categorías, productos y precios, con las mismas reglas que el backend.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.4.0
 * @file
 */
import * as yup from 'yup';
import { normalizarDecimal } from '../../../compartido/utilidades/formato.js';
import { UNIDADES } from '../servicios/catalogoServicio.js';

/**
 * Monto en COP: hasta 12 enteros y 2 decimales (coma o punto), mayor que cero.
 * @param {import('i18next').TFunction} t - Traducción.
 * @returns {yup.StringSchema} Esquema.
 */
function precio(t) {
  return yup.string().required(t('validacion:obligatorio'))
    .test('formato', t('catalogo:validacion.precioFormato'), (v) => /^\d{1,12}(\.\d{1,2})?$/.test(normalizarDecimal(v)))
    .test('positivo', t('catalogo:validacion.precioPositivo'), (v) => Number(normalizarDecimal(v)) > 0);
}

/**
 * @param {import('i18next').TFunction} t - Traducción.
 * @param {boolean} esNuevo - Alta (incluye código y precio) o edición.
 * @returns {yup.ObjectSchema<any>} Esquema del producto.
 */
export function crearEsquemaProducto(t, esNuevo) {
  const base = {
    nombre: yup.string().trim().required(t('validacion:obligatorio'))
      .min(2, t('validacion:longitud', { min: 2, max: 120 })).max(120, t('validacion:longitud', { min: 2, max: 120 })),
    descripcion: yup.string().max(500, t('validacion:longitudMaxima', { max: 500 })),
    categoriaId: yup.number().typeError(t('validacion:obligatorio')).required(t('validacion:obligatorio')),
    unidadMedida: yup.string().oneOf(UNIDADES).required(t('validacion:obligatorio')),
    permiteFraccion: yup.boolean(),
  };
  if (!esNuevo) return yup.object(base);
  return yup.object({
    codigo: yup.string().trim().required(t('validacion:obligatorio'))
      .matches(/^[A-Za-z0-9-]{2,30}$/, t('catalogo:validacion.codigo')),
    ...base,
    precioVenta: precio(t),
  });
}

/**
 * @param {import('i18next').TFunction} t - Traducción.
 * @returns {yup.ObjectSchema<any>} Esquema del cambio de precio.
 */
export function crearEsquemaPrecio(t) {
  return yup.object({ precioVenta: precio(t) });
}

/**
 * @param {import('i18next').TFunction} t - Traducción.
 * @returns {yup.ObjectSchema<any>} Esquema de la categoría.
 */
export function crearEsquemaCategoria(t) {
  return yup.object({
    nombre: yup.string().trim().required(t('validacion:obligatorio'))
      .min(2, t('validacion:longitud', { min: 2, max: 60 })).max(60, t('validacion:longitud', { min: 2, max: 60 })),
  });
}
