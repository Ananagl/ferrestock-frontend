/**
 * Nombre:                 BuscadorProducto.jsx
 * Descripción:            Selector de producto con búsqueda por código o nombre en el servidor; lo usan los ajustes y lo usarán compras y ventas.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.8.0
 * @file
 */
import { useEffect, useState } from 'react';
import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { formatoCantidad } from '../../../compartido/utilidades/formato.js';
import { listarProductos } from '../servicios/catalogoServicio.js';

const ESPERA_BUSQUEDA_MS = 300;
const RESULTADOS = 10;

/**
 * @param {{id: string, label: string, value: object|null, onChange: (producto: object|null) => void,
 *   soloActivos?: boolean, error?: boolean, helperText?: string, onBlur?: () => void, size?: 'small'|'medium',
 *   autoFocus?: boolean, disabled?: boolean}} props - Propiedades.
 * @returns {import('react').JSX.Element} Buscador.
 */
export function BuscadorProducto({ id, label, value, onChange, soloActivos = false, error, helperText, onBlur, size, autoFocus, disabled }) {
  const { t, i18n } = useTranslation();
  const [texto, setTexto] = useState('');
  const [opciones, setOpciones] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let vigente = true;
    const espera = setTimeout(async () => {
      setCargando(true);
      try {
        const pagina = await listarProductos({ q: texto || undefined, estado: soloActivos ? 'ACTIVO' : undefined, pagina: 0, tamano: RESULTADOS });
        if (vigente) setOpciones(pagina.contenido);
      } catch {
        if (vigente) setOpciones([]);
      } finally {
        if (vigente) setCargando(false);
      }
    }, ESPERA_BUSQUEDA_MS);
    return () => { vigente = false; clearTimeout(espera); };
  }, [texto, soloActivos]);

  return (
    <Autocomplete
      id={id}
      value={value}
      onChange={(_, nuevo) => onChange(nuevo)}
      inputValue={texto}
      onInputChange={(_, nuevo) => setTexto(nuevo)}
      options={value && !opciones.some((o) => o.id === value.id) ? [value, ...opciones] : opciones}
      filterOptions={(x) => x}
      getOptionLabel={(p) => `${p.codigo} — ${p.nombre}`}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      loading={cargando}
      loadingText={t('estado.cargando')}
      noOptionsText={t('catalogo:buscador.sinResultados')}
      size={size}
      disabled={disabled}
      onBlur={onBlur}
      renderOption={({ key, ...props }, p) => (
        <Box component="li" key={key} {...props} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <span><strong>{p.codigo}</strong> — {p.nombre}</span>
          <Typography component="span" variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            {formatoCantidad(p.existencias, i18n.resolvedLanguage)} {t(`catalogo:unidades.${p.unidadMedida}`)}
          </Typography>
        </Box>
      )}
      renderInput={(params) => (
        <TextField {...params} label={label} error={error} helperText={helperText} autoFocus={autoFocus}
          placeholder={t('catalogo:buscador.ayuda')} />
      )}
    />
  );
}
