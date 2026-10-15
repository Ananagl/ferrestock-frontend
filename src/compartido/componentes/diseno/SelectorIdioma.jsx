/**
 * Nombre:                 SelectorIdioma.jsx
 * Descripción:            Selector accesible de idioma (español / inglés) con etiqueta visible; guarda la preferencia del usuario si hay sesión.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
 * @file
 */
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { IDIOMAS } from '../../../i18n/configuracion.js';
import { useSesion } from '../../../app/proveedores/ProveedorSesion.jsx';

/**
 * Permite cambiar el idioma de toda la interfaz.
 * @param {{alCambiar?: () => void}} props - Acción opcional tras cambiar el idioma (p. ej. cerrar un menú).
 * @returns {import('react').JSX.Element} Control de selección de idioma.
 */
export function SelectorIdioma({ alCambiar }) {
  const { t, i18n } = useTranslation();
  const { cambiarIdioma } = useSesion();
  const actual = i18n.resolvedLanguage ?? 'es';

  return (
    <FormControl size="small" sx={{ minWidth: 140 }}>
      <InputLabel id="selector-idioma-etiqueta">{t('idioma.etiqueta')}</InputLabel>
      <Select
        labelId="selector-idioma-etiqueta"
        id="selector-idioma"
        value={actual}
        label={t('idioma.etiqueta')}
        onChange={(evento) => {
          cambiarIdioma(evento.target.value);
          alCambiar?.();
        }}
      >
        {IDIOMAS.map((codigo) => (
          <MenuItem key={codigo} value={codigo} lang={codigo}>{t(`idioma.${codigo}`)}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
