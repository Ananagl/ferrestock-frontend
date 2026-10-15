/**
 * Nombre:                 PaginaDevoluciones.jsx
 * Descripción:            Listado de devoluciones con filtros por cliente y fechas, y el resultado de su validación (RF-DEV-005).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.9.0
 * @file
 */
import { useState } from 'react';
import { Link as EnlaceRuta } from 'react-router-dom';
import { Box, Button, Chip, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { useTranslation } from 'react-i18next';
import { useListado } from '../../../compartido/hooks/useListado.js';
import { formatoFechaHora } from '../../../compartido/utilidades/formato.js';
import { TablaPaginada } from '../../../compartido/componentes/tablas/TablaPaginada.jsx';
import { BuscadorTercero } from '../../terceros/componentes/BuscadorTercero.jsx';
import { listarDevoluciones } from '../servicios/devolucionesServicio.js';

/**
 * Página de devoluciones.
 * @returns {import('react').JSX.Element} Listado.
 */
export default function PaginaDevoluciones() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const listado = useListado(listarDevoluciones, { clienteId: '', desde: '', hasta: '' });
  const { filtros, setFiltros } = listado;
  const [cliente, setCliente] = useState(null);

  const columnas = [
    { campo: 'consecutivo', encabezado: t('documentos:campos.consecutivo'),
      render: (d) => <Box component="span" sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{d.consecutivo}</Box> },
    { campo: 'fecha', encabezado: t('documentos:campos.fecha'), render: (d) => formatoFechaHora(d.fecha, idioma) },
    { campo: 'clienteNombre', encabezado: t('devoluciones:campos.cliente') },
    { campo: 'venta', encabezado: t('devoluciones:campos.venta'), secundaria: true, render: (d) => d.ventaConsecutivo ?? t('devoluciones:sinVenta') },
    { campo: 'resultado', encabezado: t('devoluciones:campos.resultado'), render: (d) => (
      <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {d.aceptadas > 0 && <Chip size="small" color="success" variant="outlined" label={t('devoluciones:aceptadas', { count: d.aceptadas })} />}
        {d.rechazadas > 0 && <Chip size="small" variant="outlined" label={t('devoluciones:rechazadas', { count: d.rechazadas })} />}
      </Stack>
    ) },
    { campo: 'validadaPor', encabezado: t('devoluciones:campos.validadaPor'), secundaria: true },
  ];
  const acciones = (d) => (
    <Tooltip title={t('documentos:acciones.ver')}>
      <IconButton component={EnlaceRuta} to={`/devoluciones/${d.id}`} aria-label={`${t('documentos:acciones.ver')} ${d.consecutivo}`}>
        <VisibilityOutlined />
      </IconButton>
    </Tooltip>
  );

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h1">{t('devoluciones:titulo')}</Typography>
        <Button component={EnlaceRuta} to="/devoluciones/nueva" variant="contained" startIcon={<AddOutlined />}>{t('devoluciones:acciones.nueva')}</Button>
      </Box>
      <Box component="search" aria-label={t('devoluciones:filtros')}
        sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' } }}>
        <BuscadorTercero id="filtro-cliente" size="small" rol="CLIENTE" soloActivos={false} label={t('devoluciones:campos.cliente')}
          value={cliente} onChange={(x) => { setCliente(x); setFiltros({ ...filtros, clienteId: x?.id ?? '' }); }} />
        <TextField type="date" size="small" label={t('documentos:filtros.desde')} value={filtros.desde}
          onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField type="date" size="small" label={t('documentos:filtros.hasta')} value={filtros.hasta}
          onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
      </Box>
      <TablaPaginada titulo={t('devoluciones:titulo')} columnas={columnas} listado={listado} acciones={acciones}
        mensajeVacio={t('devoluciones:vacio')} />
    </Stack>
  );
}
