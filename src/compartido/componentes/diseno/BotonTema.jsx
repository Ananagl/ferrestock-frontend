/**
 * Nombre:                 BotonTema.jsx
 * Descripción:            Botón accesible para alternar entre tema claro y oscuro.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
 * @file
 */
import { IconButton, Tooltip } from '@mui/material';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import { useTranslation } from 'react-i18next';
import { useModoTema } from '../../../app/proveedores/ProveedorTema.jsx';

/**
 * Alterna el modo de color.
 * @returns {import('react').JSX.Element} Botón.
 */
export function BotonTema() {
  const { t } = useTranslation();
  const { modo, alternarModo } = useModoTema();
  const etiqueta = modo === 'dark' ? t('tema.alternarClaro') : t('tema.alternarOscuro');
  return (
    <Tooltip title={etiqueta}>
      <IconButton onClick={alternarModo} aria-label={etiqueta} color="inherit">
        {modo === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
      </IconButton>
    </Tooltip>
  );
}
