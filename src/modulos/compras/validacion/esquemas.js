/**
 * Nombre:                 esquemas.js
 * Descripción:            Esquema Yup de la compra, con las mismas reglas que el backend (RF-COM-001, DP-19, CA-PRO-09).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.8.0
 * @file
 */
import * as yup from 'yup';
import { normalizarDecimal } from '../../../compartido/utilidades/formato.js';

/**
 * Cantidad de una línea: mayor que cero, hasta 3 decimales y entera si el producto no admite fracciones.
 * @param {import('i18next').TFunction} t - Traducción.
 * @returns {yup.StringSchema} Esquema.
 */
export function cantidadLinea(t) {
  return yup.string().required(t('validacion:obligatorio'))
    .test('formato', t('documentos:validacion.cantidadFormato'),
      (v) => /^\d{1,11}(\.\d{1,3})?$/.test(normalizarDecimal(v)) && Number(normalizarDecimal(v)) > 0)
    .test('fraccion', t('documentos:validacion.cantidadEntera'), function entera(v) {
      const { producto } = this.parent;
      return !producto || producto.permiteFraccion || Number.isInteger(Number(normalizarDecimal(v)));
    });
}

/**
 * Producto de una línea.
 * @param {import('i18next').TFunction} t - Traducción.
 * @returns {yup.ObjectSchema<any>} Esquema.
 */
export function productoLinea(t) {
  return yup.object().nullable().required(t('validacion:obligatorio'));
}

/**
 * Lista de líneas sin productos repetidos (DP-19): el error se marca en el producto de la línea repetida.
 * @param {import('i18next').TFunction} t - Traducción.
 * @param {yup.ObjectSchema<any>} linea - Esquema de cada línea.
 * @returns {yup.ArraySchema<any, any>} Esquema.
 */
export function lineasSinRepetidos(t, linea) {
  return yup.array().min(1, t('documentos:validacion.sinLineas')).of(linea)
    .test('repetidos', function sinRepetidos(lineas) {
      const vistos = new Set();
      const errores = [];
      (lineas ?? []).forEach((l, i) => {
        if (!l.producto) return;
        if (vistos.has(l.producto.id)) {
          errores.push(this.createError({ path: `${this.path}[${i}].producto`, message: t('documentos:validacion.repetido') }));
        }
        vistos.add(l.producto.id);
      });
      return errores.length === 0 || new yup.ValidationError(errores);
    });
}

/**
 * @param {import('i18next').TFunction} t - Traducción.
 * @returns {yup.ObjectSchema<any>} Esquema de la compra.
 */
export function crearEsquemaCompra(t) {
  return yup.object({
    proveedor: yup.object().nullable().required(t('validacion:obligatorio')),
    observacion: yup.string().max(300, t('validacion:longitudMaxima', { max: 300 })),
    lineas: lineasSinRepetidos(t, yup.object({
      producto: productoLinea(t),
      cantidad: cantidadLinea(t),
      costoUnitario: yup.string().required(t('validacion:obligatorio'))
        .test('formato', t('compras:validacion.costoFormato'), (v) => /^\d{1,12}(\.\d{1,4})?$/.test(normalizarDecimal(v))),
    })),
  });
}
