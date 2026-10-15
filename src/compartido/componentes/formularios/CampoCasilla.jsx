/**
 * Nombre:                 CampoCasilla.jsx
 * Descripción:            Casilla de verificación enlazada a Formik con texto de ayuda asociado.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.4.0
 * @file
 */
import { Checkbox, FormControlLabel, FormHelperText, Box } from '@mui/material';
import { useField } from 'formik';

/**
 * @param {{name: string, label: string, ayuda?: string}} props - Propiedades.
 * @returns {import('react').JSX.Element} Casilla.
 */
export function CampoCasilla({ name, label, ayuda }) {
  const [campo] = useField({ name, type: 'checkbox' });
  const idAyuda = `${name}-ayuda`;
  return (
    <Box>
      <FormControlLabel
        control={<Checkbox {...campo} id={name} slotProps={{ input: { 'aria-describedby': ayuda ? idAyuda : undefined } }} />}
        label={label}
      />
      {ayuda && <FormHelperText id={idAyuda} sx={{ mt: -0.5, ml: 4 }}>{ayuda}</FormHelperText>}
    </Box>
  );
}
