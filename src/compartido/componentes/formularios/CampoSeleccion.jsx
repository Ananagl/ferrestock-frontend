/**
 * Nombre:                 CampoSeleccion.jsx
 * Descripción:            Lista desplegable enlazada a Formik con etiqueta y error accesibles.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.3.0
 * @file
 */
import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from '@mui/material';
import { useField } from 'formik';

/**
 * @param {{name: string, label: string, opciones: {valor: string, texto: string}[], ayuda?: string,
 *   disabled?: boolean}} props - Propiedades.
 * @returns {import('react').JSX.Element} Campo de selección.
 */
export function CampoSeleccion({ name, label, opciones, ayuda, disabled }) {
  const [campo, meta] = useField(name);
  const conError = Boolean(meta.touched && meta.error);
  const idEtiqueta = `${name}-etiqueta`;
  const idAyuda = `${name}-ayuda`;
  return (
    <FormControl fullWidth error={conError} disabled={disabled}>
      <InputLabel id={idEtiqueta}>{label}</InputLabel>
      <Select {...campo} labelId={idEtiqueta} id={name} label={label}
        SelectDisplayProps={{ 'aria-describedby': conError || ayuda ? idAyuda : undefined }}>
        {opciones.map((o) => <MenuItem key={o.valor} value={o.valor}>{o.texto}</MenuItem>)}
      </Select>
      {(conError || ayuda) && <FormHelperText id={idAyuda}>{conError ? meta.error : ayuda}</FormHelperText>}
    </FormControl>
  );
}
