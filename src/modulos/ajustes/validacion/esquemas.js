/**
 * Nombre:                 esquemas.js
 * Descripción:            Esquema Yup del ajuste de inventario, con las mismas reglas que el backend (RF-AJU-001, CA-PRO-09).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.7.0
 * @file
 */
import * as yup from 'yup';
import { normalizarDecimal } from '../../../compartido/utilidades/formato.js';

/** Motivos frecuentes que el formulario ofrece como atajo. */
export const MOTIVOS_SUGERIDOS = Object.freeze(['inicial', 'conteo', 'danado', 'perdida']);

/**
 * @param {import('i18next').TFunction} t - Traducción.
 * @returns {yup.ObjectSchema<any>} Esquema del ajuste.
 */
export function crearEsquemaAjuste(t) {
  return yup.object({
    producto: yup.object().nullable().required(t('validacion:obligatorio')),
    tipo: yup.string().oneOf(['ENTRADA', 'SALIDA']).required(t('validacion:obligatorio')),
    cantidad: yup.string().required(t('validacion:obligatorio'))
      .test('formato', t('ajustes:validacion.cantidadFormato'),
        (v) => /^\d{1,11}(\.\d{1,3})?$/.test(normalizarDecimal(v)) && Number(normalizarDecimal(v)) > 0)
      .test('fraccion', t('ajustes:validacion.cantidadEntera'), function enteraSiCorresponde(v) {
        const { producto } = this.parent;
        return !producto || producto.permiteFraccion || Number.isInteger(Number(normalizarDecimal(v)));
      })
      .test('existencias', function alcanzanExistencias(v) {
        const { producto, tipo } = this.parent;
        if (!producto || tipo !== 'SALIDA' || Number(normalizarDecimal(v)) <= Number(producto.existencias)) return true;
        return this.createError({ message: t('ajustes:validacion.existencias', { disponibles: Number(producto.existencias) }) });
      }),
    costoUnitario: yup.string().when('tipo', {
      is: 'ENTRADA',
      then: (s) => s.required(t('ajustes:validacion.costoRequerido'))
        .test('formato', t('ajustes:validacion.costoFormato'), (v) => /^\d{1,12}(\.\d{1,4})?$/.test(normalizarDecimal(v))),
      otherwise: (s) => s.notRequired(),
    }),
    motivo: yup.string().trim().required(t('validacion:obligatorio'))
      .min(5, t('validacion:longitud', { min: 5, max: 300 })).max(300, t('validacion:longitud', { min: 5, max: 300 })),
  });
}
