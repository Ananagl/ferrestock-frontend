/**
 * Nombre:                 CampoContrasena.jsx
 * Descripción:            Campo de contraseña con botón accesible para mostrar u ocultar el texto.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
 * @file
 */
import { useState } from 'react';
import { IconButton, InputAdornment } from '@mui/material';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import { useTranslation } from 'react-i18next';
import { CampoTexto } from './CampoTexto.jsx';

/**
 * Campo de contraseña.
 * @param {{name: string, label: string, autoComplete: string, ayuda?: string}} props - Propiedades.
 * @returns {import('react').JSX.Element} Campo.
 */
export function CampoContrasena({ name, label, autoComplete, ayuda }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  return (
    <CampoTexto
      name={name}
      label={label}
      ayuda={ayuda}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setVisible((v) => !v)}
                edge="end"
                aria-label={visible ? t('formulario.ocultarContrasena') : t('formulario.mostrarContrasena')}
                aria-pressed={visible}
              >
                {visible ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
