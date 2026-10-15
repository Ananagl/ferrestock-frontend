/**
 * Nombre:                 CampoDinero.jsx
 * Descripción:            Campo de monto en COP enlazado a Formik, con teclado numérico en móviles.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.4.0
 * @file
 */
import { InputAdornment } from '@mui/material';
import { CampoTexto } from './CampoTexto.jsx';

/**
 * @param {{name: string, label: string, ayuda?: string, autoFocus?: boolean}} props - Propiedades.
 * @returns {import('react').JSX.Element} Campo de dinero.
 */
export function CampoDinero({ name, label, ayuda, autoFocus }) {
  return (
    <CampoTexto
      name={name}
      label={label}
      ayuda={ayuda}
      autoFocus={autoFocus}
      autoComplete="off"
      slotProps={{
        htmlInput: { inputMode: 'decimal' },
        input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
      }}
    />
  );
}
