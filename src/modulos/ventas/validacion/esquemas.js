/**
 * Nombre:                 esquemas.js
 * Descripción:            Esquema Yup de la venta con pago en efectivo, con las mismas reglas que el backend (RF-VEN-001, 002; RF-PAG-001, 002).
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
 * Total de la venta con los precios vigentes (cada subtotal redondeado a 2 decimales, como el backend).
 * @param {{producto: object|null, cantidad: string}[]} lineas - Líneas del formulario.
 * @returns {number} Total.
 */
export function totalVenta(lineas) {
  return lineas.reduce((suma, l) => {
    const valor = Number(normalizarDecimal(l.cantidad)) * Number(l.producto?.precioVenta ?? 0);
    return suma + (Number.isFinite(valor) ? Math.round(valor * 100) / 100 : 0);
  }, 0);
}

/**
 * @param {import('i18next').TFunction} t - Traducción.
 * @returns {yup.ObjectSchema<any>} Esquema de la venta.
 */
export function crearEsquemaVenta(t) {
  return yup.object({
    cliente: yup.object().nullable().required(t('validacion:obligatorio')),
    lineas: lineasSinRepetidos(t, yup.object({
      producto: productoLinea(t),
      cantidad: cantidadLinea(t).test('existencias', function alcanzan(v) {
        const { producto } = this.parent;
        if (!producto || Number(normalizarDecimal(v)) <= Number(producto.existencias)) return true;
        return this.createError({ message: t('ventas:validacion.existencias', { disponibles: Number(producto.existencias) }) });
      }),
    })),
    valorRecibido: yup.string().required(t('validacion:obligatorio'))
      .test('formato', t('ventas:validacion.valorFormato'), (v) => /^\d{1,12}(\.\d{1,2})?$/.test(normalizarDecimal(v)))
      .test('cubre', function cubreTotal(v) {
        const total = totalVenta(this.parent.lineas ?? []);
        if (Number(normalizarDecimal(v)) >= total) return true;
        return this.createError({ message: t('ventas:validacion.pagoInsuficiente') });
      }),
  });
}
