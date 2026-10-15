/**
 * Nombre:                 PaginaEnConstruccion.jsx
 * Descripción:            Marcador para los módulos que se implementan en incrementos posteriores de la Fase 4.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
 * @file
 */
import { useLocation } from 'react-router-dom';
import { Alert, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MENU } from '../../../app/rutas/menu.js';

/**
 * Página temporal de un módulo aún no implementado.
 * @returns {import('react').JSX.Element} Aviso con el incremento previsto.
 */
export default function PaginaEnConstruccion() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const opcion = MENU.find((o) => o.ruta !== '/' && pathname.startsWith(o.ruta));
  return (
    <Stack spacing={2}>
      <Typography variant="h1">{opcion ? t(opcion.clave) : t('app.nombre')}</Typography>
      <Alert severity="info">{t('construccion.mensaje', { incremento: opcion?.incremento ?? '-' })}</Alert>
    </Stack>
  );
}
