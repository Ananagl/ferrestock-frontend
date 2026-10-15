/**
 * Nombre:                 CampoTexto.jsx
 * Descripción:            Campo de texto enlazado a Formik, con etiqueta, ayuda y error asociados para lectores de pantalla.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.4.0
 * @file
 */
import { TextField } from '@mui/material';
import { useField } from 'formik';

/**
 * Campo de texto de formulario. El error se muestra cuando el campo fue tocado o tras enviar.
 * El espacio del texto de ayuda se reserva siempre: así, cuando aparece un error al perder el foco, el formulario
 * no cambia de alto y el botón que se está pulsando no se mueve (evita clics perdidos).
 * @param {{name: string, label: string, ayuda?: string} & import('@mui/material').TextFieldProps} props - Propiedades.
 * @returns {import('react').JSX.Element} Campo.
 */
export function CampoTexto({ name, label, ayuda, ...resto }) {
  const [campo, meta] = useField(name);
  const conError = Boolean(meta.touched && meta.error);
  return (
    <TextField
      {...campo}
      {...resto}
      id={name}
      label={label}
      error={conError}
      helperText={conError ? meta.error : (ayuda ?? ' ')}
      fullWidth
    />
  );
}
