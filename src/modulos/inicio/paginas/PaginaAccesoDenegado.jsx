/**
 * Nombre:                 PaginaAccesoDenegado.jsx
 * Descripción:            Aviso de acceso denegado cuando el rol no puede ver una pantalla.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
 * @file
 */
import { Link as EnlaceRuta } from 'react-router-dom';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Página de acceso denegado.
 * @returns {import('react').JSX.Element} Aviso.
 */
export function PaginaAccesoDenegado() {
  const { t } = useTranslation();
  return (
    <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
      <Typography variant="h1">{t('denegado.titulo')}</Typography>
      <Alert severity="warning">{t('denegado.mensaje')}</Alert>
      <Button component={EnlaceRuta} to="/" variant="outlined">{t('denegado.volver')}</Button>
    </Stack>
  );
}
