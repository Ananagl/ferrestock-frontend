/**
 * Nombre:                 ocultoVisual.js
 * Descripción:            Estilo para ocultar contenido visualmente sin ocultarlo a los lectores de pantalla.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.3.0
 * @file
 */

/** Estilo sx que oculta visualmente un elemento pero lo mantiene accesible. */
export const OCULTO_VISUAL = Object.freeze({
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
});
