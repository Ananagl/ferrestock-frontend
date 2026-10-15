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
import { cantidadLinea, lineasSinRepetidos, productoLinea } from '../../../compartido/validacion/lineasDocumento.js';

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
