/**
 * Nombre:                 PaginaCompras.jsx
 * Descripción:            Listado de compras con filtros por proveedor, estado y fechas (RF-COM-004).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.8.0
 * @file
 */
import { useState } from 'react';
import { Link as EnlaceRuta } from 'react-router-dom';
import { Box, Button, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Tooltip, Typography } from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { useTranslation } from 'react-i18next';
import { useListado } from '../../../compartido/hooks/useListado.js';
import { formatoFechaHora, formatoMoneda } from '../../../compartido/utilidades/formato.js';
import { TablaPaginada } from '../../../compartido/componentes/tablas/TablaPaginada.jsx';
import { ChipEstadoDocumento } from '../../../compartido/componentes/documentos/ChipEstadoDocumento.jsx';
import { BuscadorTercero } from '../../terceros/componentes/BuscadorTercero.jsx';
import { listarCompras } from '../servicios/comprasServicio.js';

/**
 * Página de compras.
 * @returns {import('react').JSX.Element} Listado de compras.
 */
export default function PaginaCompras() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const listado = useListado(listarCompras, { proveedorId: '', estado: '', desde: '', hasta: '' });
  const { filtros, setFiltros } = listado;
  const [proveedor, setProveedor] = useState(null);

  const columnas = [
    { campo: 'consecutivo', encabezado: t('documentos:campos.consecutivo'),
      render: (c) => <Box component="span" sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{c.consecutivo}</Box> },
    { campo: 'fecha', encabezado: t('documentos:campos.fecha'), render: (c) => formatoFechaHora(c.fecha, idioma) },
    { campo: 'proveedorNombre', encabezado: t('compras:campos.proveedor') },
    { campo: 'total', encabezado: t('documentos:campos.total'), render: (c) => formatoMoneda(c.total, idioma) },
    { campo: 'estado', encabezado: t('documentos:campos.estado'), render: (c) => <ChipEstadoDocumento estado={c.estado} /> },
    { campo: 'usuario', encabezado: t('documentos:campos.usuario'), secundaria: true },
  ];
  const acciones = (c) => (
    <Tooltip title={t('documentos:acciones.ver')}>
      <IconButton component={EnlaceRuta} to={`/compras/${c.id}`} aria-label={`${t('documentos:acciones.ver')} ${c.consecutivo}`}>
        <VisibilityOutlined />
      </IconButton>
    </Tooltip>
  );

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h1">{t('compras:titulo')}</Typography>
        <Button component={EnlaceRuta} to="/compras/nueva" variant="contained" startIcon={<AddOutlined />}>{t('compras:acciones.nueva')}</Button>
      </Box>
      <Box component="search" aria-label={t('compras:filtros')}
        sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr' } }}>
        <BuscadorTercero id="filtro-proveedor" size="small" rol="PROVEEDOR" soloActivos={false} label={t('compras:campos.proveedor')}
          value={proveedor} onChange={(x) => { setProveedor(x); setFiltros({ ...filtros, proveedorId: x?.id ?? '' }); }} />
        <FormControl size="small">
          <InputLabel id="filtro-estado-etiqueta">{t('documentos:campos.estado')}</InputLabel>
          <Select labelId="filtro-estado-etiqueta" id="filtro-estado" label={t('documentos:campos.estado')} value={filtros.estado}
            onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
            <MenuItem value="">{t('documentos:filtros.todos')}</MenuItem>
            <MenuItem value="REGISTRADA">{t('documentos:estados.REGISTRADA')}</MenuItem>
            <MenuItem value="ANULADA">{t('documentos:estados.ANULADA')}</MenuItem>
          </Select>
        </FormControl>
        <TextField type="date" size="small" label={t('documentos:filtros.desde')} value={filtros.desde}
          onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField type="date" size="small" label={t('documentos:filtros.hasta')} value={filtros.hasta}
          onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
      </Box>
      <TablaPaginada titulo={t('compras:titulo')} columnas={columnas} listado={listado} acciones={acciones}
        mensajeVacio={t('compras:vacio')} />
    </Stack>
  );
}
