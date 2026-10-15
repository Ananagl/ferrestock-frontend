/**
 * Nombre:                 SelectorIdioma.jsx
 * Descripción:            Selector accesible de idioma (español / inglés) con etiqueta visible.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.1.0
 * @file
 */
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { IDIOMAS } from '../../../i18n/configuracion.js';

/**
 * Permite cambiar el idioma de toda la interfaz.
 * @returns {import('react').JSX.Element} Control de selección de idioma.
 */
export function SelectorIdioma() {
  const { t, i18n } = useTranslation();
  const actual = i18n.resolvedLanguage ?? 'es';

  return (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel id="selector-idioma-etiqueta">{t('idioma.etiqueta')}</InputLabel>
      <Select
        labelId="selector-idioma-etiqueta"
        id="selector-idioma"
        value={actual}
        label={t('idioma.etiqueta')}
        onChange={(evento) => i18n.changeLanguage(evento.target.value)}
      >
        {IDIOMAS.map((codigo) => (
          <MenuItem key={codigo} value={codigo} lang={codigo}>{t(`idioma.${codigo}`)}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
