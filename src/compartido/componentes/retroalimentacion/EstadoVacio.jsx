/**
 * Nombre:                 EstadoVacio.jsx
 * Descripción:            Mensaje accesible para listados sin resultados.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.3.0
 * @file
 */
import { Box, Typography } from '@mui/material';
import InboxOutlined from '@mui/icons-material/InboxOutlined';

/**
 * @param {{mensaje: string}} props - Texto a mostrar.
 * @returns {import('react').JSX.Element} Estado vacío.
 */
export function EstadoVacio({ mensaje }) {
  return (
    <Box role="status" sx={{ py: 6, display: 'grid', placeItems: 'center', gap: 1, color: 'text.secondary' }}>
      <InboxOutlined fontSize="large" aria-hidden="true" />
      <Typography>{mensaje}</Typography>
    </Box>
  );
}
