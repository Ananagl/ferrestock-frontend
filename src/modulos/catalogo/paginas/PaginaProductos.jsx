/**
 * Nombre:                 PaginaProductos.jsx
 * Descripción:            Pantalla de productos: búsqueda, filtros por categoría y estado, alta, edición, cambio de precio y activación (RF-PRO, RF-PRE).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.6.0
 * @file
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import SellOutlined from '@mui/icons-material/SellOutlined';
import TimelineOutlined from '@mui/icons-material/TimelineOutlined';
import { Link as EnlaceRuta } from 'react-router-dom';
import ToggleOnOutlined from '@mui/icons-material/ToggleOnOutlined';
import ToggleOffOutlined from '@mui/icons-material/ToggleOffOutlined';
import { useTranslation } from 'react-i18next';
import { useNotificar } from '../../../app/proveedores/ProveedorNotificaciones.jsx';
import { useListado } from '../../../compartido/hooks/useListado.js';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { formatoCantidad, formatoMoneda } from '../../../compartido/utilidades/formato.js';
import { TablaPaginada } from '../../../compartido/componentes/tablas/TablaPaginada.jsx';
import { DialogoConfirmacion } from '../../../compartido/componentes/retroalimentacion/DialogoConfirmacion.jsx';
import { cambiarEstadoProducto, listarCategorias, listarProductos } from '../servicios/catalogoServicio.js';
import { DialogoProducto } from '../componentes/DialogoProducto.jsx';
import { DialogoPrecio } from '../componentes/DialogoPrecio.jsx';

/** Espera tras la última tecla antes de buscar. */
const ESPERA_BUSQUEDA_MS = 300;

/**
 * Página de productos.
 * @returns {import('react').JSX.Element} Catálogo de productos.
 */
export default function PaginaProductos() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const notificar = useNotificar();
  const consultar = useCallback((parametros) => listarProductos({ orden: 'nombre,asc', ...parametros }), []);
  const listado = useListado(consultar, { q: '', categoriaId: '', estado: '' });
  const { filtros, setFiltros } = listado;
  const [texto, setTexto] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [edicion, setEdicion] = useState(null);
  const [precio, setPrecio] = useState(null);
  const [aCambiarEstado, setACambiarEstado] = useState(null);

  useEffect(() => {
    listarCategorias().then(setCategorias).catch(() => setCategorias([]));
  }, []);

  useEffect(() => {
    const espera = setTimeout(() => {
      if (texto !== filtros.q) setFiltros({ ...filtros, q: texto });
    }, ESPERA_BUSQUEDA_MS);
    return () => clearTimeout(espera);
  }, [texto, filtros, setFiltros]);

  const columnas = [
    {
      campo: 'codigo', encabezado: t('catalogo:campos.codigo'),
      render: (p) => <Box component="span" sx={{ whiteSpace: 'nowrap' }}>{p.codigo}</Box>,
    },
    { campo: 'nombre', encabezado: t('catalogo:campos.nombre') },
    { campo: 'categoria', encabezado: t('catalogo:campos.categoria'), render: (p) => p.categoria.nombre, secundaria: true },
    { campo: 'unidad', encabezado: t('catalogo:campos.unidad'), render: (p) => t(`catalogo:unidades.${p.unidadMedida}`), secundaria: true },
    { campo: 'precio', encabezado: t('catalogo:campos.precioVenta'), render: (p) => formatoMoneda(p.precioVenta, idioma) },
    { campo: 'existencias', encabezado: t('catalogo:campos.existencias'), render: (p) => formatoCantidad(p.existencias, idioma) },
    {
      campo: 'estado', encabezado: t('catalogo:campos.estado'),
      render: (p) => (p.estado === 'ACTIVO'
        ? <Chip size="small" color="success" label={t('catalogo:estado.ACTIVO')} />
        : <Chip size="small" variant="outlined" label={t('catalogo:estado.INACTIVO')} />),
    },
  ];

  const acciones = (p) => {
    const activo = p.estado === 'ACTIVO';
    const etiquetaEstado = activo ? t('catalogo:acciones.desactivar') : t('catalogo:acciones.activar');
    return (
      <>
        <Tooltip title={t('acciones.editar')}>
          <IconButton aria-label={`${t('acciones.editar')} ${p.codigo}`} onClick={() => setEdicion({ producto: p })}>
            <EditOutlined />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('catalogo:acciones.precio')}>
          <IconButton aria-label={`${t('catalogo:acciones.precio')} ${p.codigo}`} onClick={() => setPrecio(p)}>
            <SellOutlined />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('inventario:acciones.kardex')}>
          <IconButton component={EnlaceRuta} to={`/inventario/${p.id}`} aria-label={`${t('inventario:acciones.kardex')} ${p.codigo}`}>
            <TimelineOutlined />
          </IconButton>
        </Tooltip>
        <Tooltip title={etiquetaEstado}>
          <IconButton aria-label={`${etiquetaEstado} ${p.codigo}`} onClick={() => setACambiarEstado(p)}>
            {activo ? <ToggleOnOutlined color="success" /> : <ToggleOffOutlined />}
          </IconButton>
        </Tooltip>
      </>
    );
  };

  const confirmarEstado = async () => {
    const p = aCambiarEstado;
    const nuevo = p.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await cambiarEstadoProducto(p.id, nuevo);
      notificar(t(nuevo === 'ACTIVO' ? 'catalogo:avisos.activado' : 'catalogo:avisos.desactivado', { codigo: p.codigo }));
      listado.recargar();
    } catch (excepcion) {
      notificar(leerProblema(excepcion).detalle ?? t('estado.error'), 'error');
    } finally {
      setACambiarEstado(null);
    }
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h1">{t('catalogo:productos.titulo')}</Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setEdicion({ producto: null })}>
          {t('catalogo:acciones.nuevoProducto')}
        </Button>
      </Box>

      <Box component="search" aria-label={t('catalogo:productos.filtros')}
        sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' } }}>
        <TextField label={t('catalogo:productos.buscar')} value={texto} onChange={(e) => setTexto(e.target.value)}
          type="search" size="small" />
        <FormControl size="small">
          <InputLabel id="filtro-categoria-etiqueta">{t('catalogo:campos.categoria')}</InputLabel>
          <Select labelId="filtro-categoria-etiqueta" id="filtro-categoria" label={t('catalogo:campos.categoria')}
            value={filtros.categoriaId} onChange={(e) => setFiltros({ ...filtros, categoriaId: e.target.value })}>
            <MenuItem value="">{t('catalogo:filtros.todas')}</MenuItem>
            {categorias.map((c) => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel id="filtro-estado-etiqueta">{t('catalogo:campos.estado')}</InputLabel>
          <Select labelId="filtro-estado-etiqueta" id="filtro-estado" label={t('catalogo:campos.estado')}
            value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
            <MenuItem value="">{t('catalogo:filtros.todos')}</MenuItem>
            <MenuItem value="ACTIVO">{t('catalogo:estado.ACTIVO')}</MenuItem>
            <MenuItem value="INACTIVO">{t('catalogo:estado.INACTIVO')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TablaPaginada titulo={t('catalogo:productos.titulo')} columnas={columnas} listado={listado} acciones={acciones}
        mensajeVacio={t('catalogo:productos.vacio')} />

      {edicion && (
        <DialogoProducto producto={edicion.producto} onCerrar={() => setEdicion(null)}
          onDesactualizado={() => { setEdicion(null); listado.recargar(); }}
          onGuardado={(guardado, esNuevo) => {
            setEdicion(null);
            notificar(t(esNuevo ? 'catalogo:avisos.creado' : 'catalogo:avisos.actualizado', { codigo: guardado.codigo }));
            listado.recargar();
          }} />
      )}
      {precio && (
        <DialogoPrecio producto={precio} onCerrar={() => setPrecio(null)}
          onGuardado={(guardado) => {
            setPrecio(null);
            notificar(t('catalogo:avisos.precio', { codigo: guardado.codigo, precio: formatoMoneda(guardado.precioVenta, idioma) }));
            listado.recargar();
          }} />
      )}
      <DialogoConfirmacion
        abierto={Boolean(aCambiarEstado)}
        titulo={aCambiarEstado?.estado === 'ACTIVO' ? t('catalogo:confirmar.tituloDesactivar') : t('catalogo:confirmar.tituloActivar')}
        mensaje={aCambiarEstado?.estado === 'ACTIVO'
          ? t('catalogo:confirmar.desactivar', { codigo: aCambiarEstado?.codigo })
          : t('catalogo:confirmar.activar', { codigo: aCambiarEstado?.codigo })}
        textoConfirmar={aCambiarEstado?.estado === 'ACTIVO' ? t('catalogo:acciones.desactivar') : t('catalogo:acciones.activar')}
        color={aCambiarEstado?.estado === 'ACTIVO' ? 'error' : 'primary'}
        onConfirmar={confirmarEstado}
        onCancelar={() => setACambiarEstado(null)} />
    </Stack>
  );
}
