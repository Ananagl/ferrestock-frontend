/**
 * Nombre:                 formato.js
 * Descripción:            Formato de moneda (COP) y cantidades según el idioma activo. Solo para mostrar: la aritmética de dinero la hace el backend.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.6.0
 * @file
 */

/** @param {string} idioma - es o en. @returns {string} Configuración regional para Intl. */
const region = (idioma) => (idioma?.startsWith('en') ? 'en-US' : 'es-CO');

/**
 * Formatea un monto en pesos colombianos; muestra decimales solo si el valor los tiene.
 * @param {string|number|null|undefined} valor - Monto (la API lo envía como texto).
 * @param {string} idioma - Idioma activo.
 * @returns {string} Monto formateado, o cadena vacía si no hay valor.
 */
export function formatoMoneda(valor, idioma) {
  if (valor === null || valor === undefined || valor === '') return '';
  const numero = Number(valor);
  return new Intl.NumberFormat(region(idioma), {
    style: 'currency', currency: 'COP', minimumFractionDigits: Number.isInteger(numero) ? 0 : 2, maximumFractionDigits: 2,
  }).format(numero);
}

/**
 * Formatea una cantidad (hasta 3 decimales, sin ceros sobrantes).
 * @param {string|number|null|undefined} valor - Cantidad.
 * @param {string} idioma - Idioma activo.
 * @returns {string} Cantidad formateada.
 */
export function formatoCantidad(valor, idioma) {
  if (valor === null || valor === undefined || valor === '') return '';
  return new Intl.NumberFormat(region(idioma), { maximumFractionDigits: 3 }).format(Number(valor));
}

/**
 * Normaliza un decimal escrito por el usuario (acepta coma o punto) al formato de la API.
 * @param {string} texto - Valor escrito.
 * @returns {string} Decimal con punto, sin espacios.
 */
export function normalizarDecimal(texto) {
  return String(texto ?? '').trim().replace(/\s/g, '').replace(',', '.');
}

/**
 * Formatea fecha y hora en la zona horaria del negocio (America/Bogota).
 * @param {string|null|undefined} instante - Fecha ISO-8601 (la API la envía en UTC).
 * @param {string} idioma - Idioma activo.
 * @returns {string} Fecha y hora legibles.
 */
export function formatoFechaHora(instante, idioma) {
  if (!instante) return '';
  return new Intl.DateTimeFormat(region(idioma), {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota',
  }).format(new Date(instante));
}
