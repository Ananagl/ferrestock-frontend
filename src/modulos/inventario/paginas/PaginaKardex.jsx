/**
 * Nombre:                 PaginaKardex.jsx
 * Descripción:            Kardex de un producto: movimientos con entradas, salidas y saldo, filtrables por tipo y fechas; el ADMIN ve costos (RF-INV-003).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.7.0
 * @file
 */
import { useCallback, useEffect, useState } from 'react';
import { Link as EnlaceRuta, useParams } from 'react-router-dom';
import {
  Alert, Box, Button, Chip, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography,
} from '@mui/material';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import { useTranslation } from 'react-i18next';
import { useSesion } from '../../../app/proveedores/ProveedorSesion.jsx';
import { useListado } from '../../../compartido/hooks/useListado.js';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { formatoCantidad, formatoFechaHora, formatoMoneda } from '../../../compartido/utilidades/formato.js';
import { TablaPaginada } from '../../../compartido/componentes/tablas/TablaPaginada.jsx';
import { Cargando } from '../../../compartido/componentes/retroalimentacion/Cargando.jsx';
import { obtenerProducto } from '../../catalogo/servicios/catalogoServicio.js';
import { consultarKardex, TIPOS_MOVIMIENTO } from '../servicios/inventarioServicio.js';

/**
 * Página del kardex.
 * @returns {import('react').JSX.Element} Movimientos del producto.
 */
export default function PaginaKardex() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const { productoId } = useParams();
  const { usuario } = useSesion();
  const esAdmin = usuario.rol === 'ADMIN';
  const [producto, setProducto] = useState(null);
  const [errorProducto, setErrorProducto] = useState(null);
  const consultar = useCallback((parametros) => consultarKardex(productoId, parametros), [productoId]);
  const listado = useListado(consultar, { tipo: '', desde: '', hasta: '' });
  const { filtros, setFiltros } = listado;

  useEffect(() => {
    obtenerProducto(productoId).then(setProducto).catch((e) => setErrorProducto(leerProblema(e)));
  }, [productoId]);

  if (errorProducto) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Typography variant="h1">{t('inventario:kardex.titulo')}</Typography>
        <Alert severity="error">{errorProducto.estado === 404 ? t('inventario:kardex.noExiste') : t('estado.error')}</Alert>
        <Button component={EnlaceRuta} to="/inventario" startIcon={<ArrowBackOutlined />}>{t('inventario:acciones.volver')}</Button>
      </Stack>
    );
  }
  if (!producto) return <Cargando />;

  const cantidadSi = (m, naturaleza) => (m.naturaleza === naturaleza ? formatoCantidad(m.cantidad, idioma) : '');
  const columnas = [
    { campo: 'fecha', encabezado: t('inventario:kardex.fecha'), render: (m) => formatoFechaHora(m.fecha, idioma) },
    { campo: 'tipo', encabezado: t('inventario:kardex.tipo'), render: (m) => (
      <Chip size="small" variant="outlined" color={m.naturaleza === 'ENTRADA' ? 'success' : 'warning'}
        label={t(`inventario:tipos.${m.tipo}`)} />
    ) },
    { campo: 'documento', encabezado: t('inventario:kardex.documento'), secundaria: true,
      render: (m) => `${t(`inventario:documentos.${m.documentoTipo}`)} #${m.documentoId}` },
    { campo: 'entrada', encabezado: t('inventario:kardex.entrada'), render: (m) => cantidadSi(m, 'ENTRADA') },
    { campo: 'salida', encabezado: t('inventario:kardex.salida'), render: (m) => cantidadSi(m, 'SALIDA') },
    { campo: 'saldo', encabezado: t('inventario:kardex.saldo'),
      render: (m) => <Box component="span" sx={{ fontWeight: 600 }}>{formatoCantidad(m.saldoResultante, idioma)}</Box> },
    { campo: 'usuario', encabezado: t('inventario:kardex.usuario'), secundaria: true },
    ...(esAdmin ? [
      { campo: 'costoUnitario', encabezado: t('inventario:kardex.costoUnitario'), render: (m) => formatoMoneda(m.costoUnitario, idioma) },
      { campo: 'cpp', encabezado: t('inventario:campos.costoPromedio'), secundaria: true,
        render: (m) => formatoMoneda(m.costoPromedioResultante, idioma) },
    ] : []),
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Button component={EnlaceRuta} to="/inventario" startIcon={<ArrowBackOutlined />} sx={{ mb: 1 }}>
          {t('inventario:acciones.volver')}
        </Button>
        <Typography variant="h1">{t('inventario:kardex.tituloProducto', { codigo: producto.codigo })}</Typography>
        <Typography color="text.secondary">{producto.nombre}</Typography>
        <Typography sx={{ mt: 1 }}>
          {t('inventario:kardex.existenciasActuales')}:{' '}
          <Box component="strong">{formatoCantidad(producto.existencias, idioma)} {t(`catalogo:unidades.${producto.unidadMedida}`)}</Box>
        </Typography>
        {esAdmin && producto.estado === 'ACTIVO' && (
          <Button component={EnlaceRuta} to={`/ajustes?nuevo=${producto.id}`} variant="outlined" startIcon={<TuneOutlined />}
            sx={{ mt: 2 }}>
            {t('inventario:acciones.ajustar')}
          </Button>
        )}
      </Box>

      <Box component="search" aria-label={t('inventario:kardex.filtros')}
        sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' } }}>
        <FormControl size="small">
          <InputLabel id="filtro-tipo-etiqueta">{t('inventario:kardex.tipo')}</InputLabel>
          <Select labelId="filtro-tipo-etiqueta" id="filtro-tipo" label={t('inventario:kardex.tipo')} value={filtros.tipo}
            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
            <MenuItem value="">{t('inventario:filtros.todos')}</MenuItem>
            {TIPOS_MOVIMIENTO.map((tipo) => <MenuItem key={tipo} value={tipo}>{t(`inventario:tipos.${tipo}`)}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField type="date" size="small" label={t('inventario:kardex.desde')} value={filtros.desde}
          onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField type="date" size="small" label={t('inventario:kardex.hasta')} value={filtros.hasta}
          onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
      </Box>

      <TablaPaginada titulo={t('inventario:kardex.titulo')} columnas={columnas} listado={listado}
        mensajeVacio={t('inventario:kardex.vacio')} />
    </Stack>
  );
}
