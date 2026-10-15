/**
 * Nombre:                 BuscadorTercero.jsx
 * Descripción:            Selector de cliente o proveedor activo con búsqueda por nombre o documento en el servidor.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.9.0
 * @file
 */
import { useEffect, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { formatoDocumento } from '../../../compartido/utilidades/nit.js';
import { listarTerceros } from '../servicios/tercerosServicio.js';

const ESPERA_BUSQUEDA_MS = 300;

/**
 * @param {{id: string, label: string, rol: 'CLIENTE'|'PROVEEDOR', value: object|null,
 *   onChange: (tercero: object|null) => void, soloActivos?: boolean, error?: boolean, helperText?: string,
 *   onBlur?: () => void, size?: 'small'|'medium', disabled?: boolean}} props - Propiedades.
 * @returns {import('react').JSX.Element} Buscador.
 */
export function BuscadorTercero({ id, label, rol, value, onChange, soloActivos = true, error, helperText, onBlur, size, disabled }) {
  const { t } = useTranslation();
  const [texto, setTexto] = useState('');
  const [opciones, setOpciones] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let vigente = true;
    const espera = setTimeout(async () => {
      setCargando(true);
      try {
        const pagina = await listarTerceros({ q: texto || undefined, rol, activo: soloActivos ? true : undefined, pagina: 0, tamano: 10 });
        if (vigente) setOpciones(pagina.contenido);
      } catch {
        if (vigente) setOpciones([]);
      } finally {
        if (vigente) setCargando(false);
      }
    }, ESPERA_BUSQUEDA_MS);
    return () => { vigente = false; clearTimeout(espera); };
  }, [texto, rol, soloActivos]);

  return (
    <Autocomplete
      id={id}
      value={value}
      onChange={(_, nuevo) => onChange(nuevo)}
      inputValue={texto}
      onInputChange={(_, nuevo) => setTexto(nuevo)}
      options={value && !opciones.some((o) => o.id === value.id) ? [value, ...opciones] : opciones}
      filterOptions={(x) => x}
      // Un tercero precargado (por ejemplo, desde una venta) puede no traer el documento: se muestra solo el nombre
      getOptionLabel={(x) => (x.numeroDocumento ? `${x.nombre} — ${formatoDocumento(x)}` : x.nombre)}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      loading={cargando}
      loadingText={t('estado.cargando')}
      noOptionsText={t('terceros:buscador.sinResultados')}
      size={size}
      disabled={disabled}
      onBlur={onBlur}
      renderInput={(params) => (
        <TextField {...params} label={label} error={error} helperText={helperText} placeholder={t('terceros:buscador.ayuda')} />
      )}
    />
  );
}
