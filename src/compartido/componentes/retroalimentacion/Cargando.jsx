/**
 * Nombre:                 Cargando.jsx
 * Descripción:            Indicador de carga de página completa, anunciado a lectores de pantalla.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
 * @file
 */
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Indicador de carga centrado.
 * @returns {import('react').JSX.Element} Indicador.
 */
export function Cargando() {
  const { t } = useTranslation();
  return (
    <Box role="status" sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center', gap: 2 }}>
      <CircularProgress aria-hidden="true" />
      <Typography>{t('estado.cargando')}</Typography>
    </Box>
  );
}
