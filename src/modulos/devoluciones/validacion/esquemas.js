/**
 * Nombre:                 esquemas.js
 * Descripción:            Esquema Yup de la devolución: motivo obligatorio, líneas sin repetir y, con venta, sin superar lo que queda por devolver (RF-DEV-001, 004).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.9.0
 * @file
 */
import * as yup from 'yup';
import { normalizarDecimal } from '../../../compartido/utilidades/formato.js';
import { cantidadLinea, lineasSinRepetidos, productoLinea } from '../../../compartido/validacion/lineasDocumento.js';

/**
 * @param {import('i18next').TFunction} t - Traducción.
 * @returns {yup.ObjectSchema<any>} Esquema de la devolución.
 */
export function crearEsquemaDevolucion(t) {
  return yup.object({
    cliente: yup.object().nullable().required(t('validacion:obligatorio')),
    motivo: yup.string().trim().required(t('validacion:obligatorio'))
      .min(5, t('validacion:longitud', { min: 5, max: 300 })).max(300, t('validacion:longitud', { min: 5, max: 300 })),
    lineas: lineasSinRepetidos(t, yup.object({
      producto: productoLinea(t),
      resultado: yup.string().oneOf(['ACEPTADA', 'RECHAZADA']).required(t('validacion:obligatorio')),
      cantidad: cantidadLinea(t).test('disponible', function alcanza(v) {
        const { disponible, resultado } = this.parent;
        if (disponible == null || resultado !== 'ACEPTADA' || Number(normalizarDecimal(v)) <= Number(disponible)) return true;
        return this.createError({ message: t('devoluciones:validacion.supera', { disponible: Number(disponible) }) });
      }),
    })),
  });
}
