/**
 * Nombre:                 tokens.js
 * Descripción:            Tokens de diseño de FerreStock: única fuente de colores, tipografía, espaciado, radios,
 *                         sombras y tiempos de animación (RNF-USA-05). Identidad: naranja óxido sobre grises acero.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.1.0
 * @file
 */

/**
 * Tokens de diseño. Los componentes no los usan directamente: pasan por el tema de MUI (crearTema.js).
 * Contrastes verificados (WCAG AA): marca.principal sobre blanco ≈ 5,0:1; blanco sobre marca.principal ≈ 5,0:1.
 * @type {const}
 */
export const tokens = Object.freeze({
  color: {
    marca: {
      principal: '#B45309',
      principalOscuro: '#92400E',
      principalClaro: '#F59E0B',
      contraste: '#FFFFFF',
    },
    acero: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      300: '#CBD5E1',
      500: '#64748B',
      700: '#334155',
      900: '#0F172A',
    },
    estado: {
      exito: '#15803D',
      aviso: '#A16207',
      error: '#B91C1C',
      info: '#1D4ED8',
    },
    superficie: {
      claro: '#FFFFFF',
      fondoClaro: '#F8FAFC',
      oscuro: '#111827',
      fondoOscuro: '#0B1120',
    },
    foco: '#2563EB',
  },
  tipografia: {
    familia: '"Inter", "Roboto", system-ui, -apple-system, "Segoe UI", sans-serif',
    base: 16,
    pesos: { normal: 400, medio: 500, fuerte: 700 },
  },
  /** Unidad de espaciado en píxeles (escala de 8). */
  espacioBase: 8,
  radio: { s: 4, m: 8, l: 12 },
  sombra: { tarjeta: '0 1px 3px rgba(15, 23, 42, 0.12)' },
  movimiento: { rapido: '120ms', normal: '200ms' },
  foco: { grosor: 3, separacion: 2 },
});
