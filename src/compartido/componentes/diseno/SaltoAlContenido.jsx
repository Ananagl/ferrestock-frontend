/**
 * Nombre:                 SaltoAlContenido.jsx
 * Descripción:            Enlace "Saltar al contenido" visible al recibir foco con el teclado (accesibilidad).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.1.0
 * @file
 */
import { Link } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * Enlace al elemento con id "contenido".
 * @returns {import('react').JSX.Element} Enlace de salto.
 */
export function SaltoAlContenido() {
  const { t } = useTranslation();
  return (
    <Link
      href="#contenido"
      sx={{
        position: 'absolute', left: 8, top: -48, zIndex: 'tooltip', p: 1,
        bgcolor: 'background.paper', borderRadius: 1,
        '&:focus': { top: 8 },
      }}
    >
      {t('app.saltarContenido')}
    </Link>
  );
}
