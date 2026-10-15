/**
 * Nombre:                 ChipEstadoDocumento.jsx
 * Descripción:            Chip con el estado de un documento: registrada o anulada.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.8.0
 * @file
 */
import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * @param {{estado: 'REGISTRADA'|'ANULADA'}} props - Estado del documento.
 * @returns {import('react').JSX.Element} Chip.
 */
export function ChipEstadoDocumento({ estado }) {
  const { t } = useTranslation();
  return estado === 'ANULADA'
    ? <Chip size="small" color="error" variant="outlined" label={t('documentos:estados.ANULADA')} />
    : <Chip size="small" color="success" variant="outlined" label={t('documentos:estados.REGISTRADA')} />;
}
