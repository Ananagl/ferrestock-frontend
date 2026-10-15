/**
 * Nombre:                 EnfocarPrimerError.jsx
 * Descripción:            Lleva el foco al primer campo con error cuando se intenta enviar un formulario inválido (accesibilidad).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
 * @file
 */
import { useEffect } from 'react';
import { useFormikContext } from 'formik';

/**
 * Se coloca dentro de un formulario Formik. Tras cada intento de envío con errores, enfoca el primer campo
 * inválido según el orden del DOM.
 * @returns {null} No dibuja nada.
 */
export function EnfocarPrimerError() {
  const { submitCount, isValid, errors, isSubmitting } = useFormikContext();
  useEffect(() => {
    if (submitCount === 0 || isValid || isSubmitting) return;
    const campos = Object.keys(errors)
      .map((nombre) => document.getElementById(nombre))
      .filter(Boolean)
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    campos[0]?.focus();
  }, [submitCount, isValid, isSubmitting, errors]);
  return null;
}
