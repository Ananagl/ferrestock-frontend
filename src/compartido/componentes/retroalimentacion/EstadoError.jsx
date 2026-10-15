/**
 * Nombre:                 EstadoError.jsx
 * Descripción:            Aviso de error de carga con botón para reintentar y código de correlación si existe.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.3.0
 * @file
 */
import { Alert, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * @param {{problema: import('../../../servicios/api/problemas.js').Problema|null, onReintentar: () => void}} props - Error.
 * @returns {import('react').JSX.Element} Aviso.
 */
export function EstadoError({ problema, onReintentar }) {
  const { t } = useTranslation();
  const mensaje = problema?.codigo === 'SIN_CONEXION' ? t('estado.sinConexion') : (problema?.detalle ?? t('estado.error'));
  return (
    <Alert severity="error" role="alert"
      action={<Button color="inherit" size="small" onClick={onReintentar}>{t('acciones.reintentar')}</Button>}>
      {mensaje}
      {problema?.correlacion && ` (${t('estado.codigo')}: ${problema.correlacion})`}
    </Alert>
  );
}
