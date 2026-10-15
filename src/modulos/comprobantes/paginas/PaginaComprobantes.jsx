/**
 * Nombre:                 PaginaComprobantes.jsx
 * Descripción:            Búsqueda de comprobantes por tipo, consecutivo y fechas para consultarlos y reimprimirlos (RF-DOC-005).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.10.0
 * @file
 */
import { useEffect, useState } from 'react';
import { Link as EnlaceRuta } from 'react-router-dom';
import { Box, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Tooltip, Typography } from '@mui/material';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import { useTranslation } from 'react-i18next';
import { useSesion } from '../../../app/proveedores/ProveedorSesion.jsx';
import { useListado } from '../../../compartido/hooks/useListado.js';
import { formatoFechaHora, formatoMoneda } from '../../../compartido/utilidades/formato.js';
import { TablaPaginada } from '../../../compartido/componentes/tablas/TablaPaginada.jsx';
import { ChipEstadoDocumento } from '../../../compartido/componentes/documentos/ChipEstadoDocumento.jsx';
import { buscarComprobantes, TIPOS_DOCUMENTO } from '../servicios/comprobantesServicio.js';

/**
 * Página de comprobantes.
 * @returns {import('react').JSX.Element} Búsqueda.
 */
export default function PaginaComprobantes() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const { usuario } = useSesion();
  const tipos = TIPOS_DOCUMENTO.filter((x) => x !== 'AJUSTE' || usuario.rol === 'ADMIN');
  const listado = useListado(buscarComprobantes, { tipo: '', consecutivo: '', desde: '', hasta: '' });
  const { filtros, setFiltros } = listado;
  const [texto, setTexto] = useState('');

  useEffect(() => {
    const espera = setTimeout(() => { if (texto !== filtros.consecutivo) setFiltros({ ...filtros, consecutivo: texto }); }, 300);
    return () => clearTimeout(espera);
  }, [texto, filtros, setFiltros]);

  const columnas = [
    { campo: 'consecutivo', encabezado: t('documentos:campos.consecutivo'),
      render: (c) => <Box component="span" sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{c.consecutivo}</Box> },
    { campo: 'tipo', encabezado: t('comprobantes:campos.tipo'), render: (c) => t(`comprobantes:tipos.${c.tipo}`) },
    { campo: 'fecha', encabezado: t('documentos:campos.fecha'), render: (c) => formatoFechaHora(c.fecha, idioma) },
    { campo: 'tercero', encabezado: t('comprobantes:campos.tercero'), secundaria: true },
    { campo: 'total', encabezado: t('documentos:campos.total'), render: (c) => (c.total ? formatoMoneda(c.total, idioma) : '—') },
    { campo: 'estado', encabezado: t('documentos:campos.estado'), render: (c) => <ChipEstadoDocumento estado={c.estado} /> },
  ];
  const acciones = (c) => (
    <Tooltip title={t('comprobantes:acciones.ver')}>
      <IconButton component={EnlaceRuta} to={`/comprobantes/${c.tipo}/${c.consecutivo}`} aria-label={`${t('comprobantes:acciones.ver')} ${c.consecutivo}`}>
        <ReceiptLongOutlined />
      </IconButton>
    </Tooltip>
  );

  return (
    <Stack spacing={3}>
      <Typography variant="h1">{t('comprobantes:titulo')}</Typography>
      <Box component="search" aria-label={t('comprobantes:filtros')}
        sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr' } }}>
        <TextField size="small" type="search" label={t('comprobantes:buscar')} value={texto} onChange={(e) => setTexto(e.target.value)} />
        <FormControl size="small">
          <InputLabel id="filtro-tipo-etiqueta">{t('comprobantes:campos.tipo')}</InputLabel>
          <Select labelId="filtro-tipo-etiqueta" id="filtro-tipo" label={t('comprobantes:campos.tipo')} value={filtros.tipo}
            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
            <MenuItem value="">{t('documentos:filtros.todos')}</MenuItem>
            {tipos.map((x) => <MenuItem key={x} value={x}>{t(`comprobantes:tipos.${x}`)}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField type="date" size="small" label={t('documentos:filtros.desde')} value={filtros.desde}
          onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField type="date" size="small" label={t('documentos:filtros.hasta')} value={filtros.hasta}
          onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
      </Box>
      <TablaPaginada titulo={t('comprobantes:titulo')} columnas={columnas} listado={listado} acciones={acciones} claveFila={(c) => `${c.tipo}-${c.consecutivo}`} mensajeVacio={t('comprobantes:vacio')} />
    </Stack>
  );
}
