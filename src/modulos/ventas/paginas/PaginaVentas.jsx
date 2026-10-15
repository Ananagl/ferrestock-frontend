/**
 * Nombre:                 PaginaVentas.jsx
 * Descripción:            Listado de ventas con filtros por cliente, estado y fechas (RF-VEN-005).
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
import { listarVentas } from '../servicios/ventasServicio.js';

/**
 * Página de ventas.
 * @returns {import('react').JSX.Element} Listado de ventas.
 */
export default function PaginaVentas() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const listado = useListado(listarVentas, { clienteId: '', estado: '', desde: '', hasta: '' });
  const { filtros, setFiltros } = listado;
  const [cliente, setCliente] = useState(null);

  const columnas = [
    { campo: 'consecutivo', encabezado: t('documentos:campos.consecutivo'),
      render: (v) => <Box component="span" sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{v.consecutivo}</Box> },
    { campo: 'fecha', encabezado: t('documentos:campos.fecha'), render: (v) => formatoFechaHora(v.fecha, idioma) },
    { campo: 'clienteNombre', encabezado: t('ventas:campos.cliente') },
    { campo: 'total', encabezado: t('documentos:campos.total'), render: (v) => formatoMoneda(v.total, idioma) },
    { campo: 'estado', encabezado: t('documentos:campos.estado'), render: (v) => <ChipEstadoDocumento estado={v.estado} /> },
    { campo: 'usuario', encabezado: t('documentos:campos.usuario'), secundaria: true },
  ];
  const acciones = (v) => (
    <Tooltip title={t('documentos:acciones.ver')}>
      <IconButton component={EnlaceRuta} to={`/ventas/${v.id}`} aria-label={`${t('documentos:acciones.ver')} ${v.consecutivo}`}>
        <VisibilityOutlined />
      </IconButton>
    </Tooltip>
  );

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h1">{t('ventas:titulo')}</Typography>
        <Button component={EnlaceRuta} to="/ventas/nueva" variant="contained" startIcon={<AddOutlined />}>{t('ventas:acciones.nueva')}</Button>
      </Box>
      <Box component="search" aria-label={t('ventas:filtros')}
        sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr' } }}>
        <BuscadorTercero id="filtro-cliente" size="small" rol="CLIENTE" soloActivos={false} label={t('ventas:campos.cliente')}
          value={cliente} onChange={(x) => { setCliente(x); setFiltros({ ...filtros, clienteId: x?.id ?? '' }); }} />
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
      <TablaPaginada titulo={t('ventas:titulo')} columnas={columnas} listado={listado} acciones={acciones} mensajeVacio={t('ventas:vacio')} />
    </Stack>
  );
}
