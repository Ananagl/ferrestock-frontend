/**
 * Nombre:                 nit.js
 * Descripción:            Dígito de verificación del NIT (algoritmo módulo 11 de la DIAN), igual al del backend (ValidadorNit).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.5.0
 * @file
 */

const FACTORES = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

/**
 * Calcula el dígito de verificación de un NIT.
 * @param {string} numero - NIT sin dígito de verificación (1 a 15 dígitos).
 * @returns {number|null} Dígito de 0 a 9, o null si el número no es válido.
 */
export function calcularDigitoNit(numero) {
  if (!/^\d{1,15}$/.test(numero ?? '')) return null;
  const suma = [...numero].reverse().reduce((total, digito, i) => total + Number(digito) * FACTORES[i], 0);
  const residuo = suma % 11;
  return residuo < 2 ? residuo : 11 - residuo;
}

/**
 * Formatea un documento para mostrarlo: "NIT 890903938-8" o "CC 1020304050".
 * @param {{tipoDocumento: string, numeroDocumento: string, digitoVerificacion?: string|null}} tercero - Tercero.
 * @returns {string} Documento formateado.
 */
export function formatoDocumento({ tipoDocumento, numeroDocumento, digitoVerificacion }) {
  return `${tipoDocumento} ${numeroDocumento}${digitoVerificacion ? `-${digitoVerificacion}` : ''}`;
}
