/**
 * Nombre:                 PaginaInventario.jsx
 * Descripción:            Pantalla de existencias por producto; para el ADMIN incluye costo, valor del inventario por categoría y verificación de consistencia (RF-INV-001, RF-COS-002).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.6.0
 * @file
 */
import { useCallback, useEffect, useState } from 'react';
import { Link as EnlaceRuta } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Select, Stack,
  Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import TimelineOutlined from '@mui/icons-material/TimelineOutlined';
import { useTranslation } from 'react-i18next';
import { useSesion } from '../../../app/proveedores/ProveedorSesion.jsx';
import { useListado } from '../../../compartido/hooks/useListado.js';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { formatoCantidad, formatoMoneda } from '../../../compartido/utilidades/formato.js';
import { TablaPaginada } from '../../../compartido/componentes/tablas/TablaPaginada.jsx';
import { listarCategorias } from '../../catalogo/servicios/catalogoServicio.js';
import { consultarValorizacion, listarExistencias, verificarConsistencia } from '../servicios/inventarioServicio.js';

const ESPERA_BUSQUEDA_MS = 300;

/**
 * Resumen del valor del inventario y verificación de consistencia (solo ADMIN).
 * @returns {import('react').JSX.Element} Tarjeta de resumen.
 */
function ResumenAdministrador() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const [valorizacion, setValorizacion] = useState(null);
  const [verificacion, setVerificacion] = useState(null);
  const [verificando, setVerificando] = useState(false);

  useEffect(() => {
    consultarValorizacion().then(setValorizacion).catch(() => setValorizacion(false));
  }, []);

  const verificar = async () => {
    setVerificando(true);
    try {
      setVerificacion({ inconsistencias: await verificarConsistencia() });
    } catch (excepcion) {
      setVerificacion({ error: leerProblema(excepcion).detalle ?? t('estado.error') });
    } finally {
      setVerificando(false);
    }
  };

  return (
    <Card variant="outlined" component="section" aria-labelledby="titulo-valorizacion">
      <CardContent>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Typography id="titulo-valorizacion" component="h2" variant="h2">{t('inventario:valorizacion.titulo')}</Typography>
            {valorizacion && (
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 700 }} data-testid="valor-total">
                {formatoMoneda(valorizacion.total, idioma)}
              </Typography>
            )}
          </Box>
          {valorizacion === false && <Alert severity="error">{t('estado.error')}</Alert>}
          {valorizacion && valorizacion.categorias.length === 0 && (
            <Typography color="text.secondary">{t('inventario:valorizacion.vacio')}</Typography>
          )}
          {valorizacion && valorizacion.categorias.length > 0 && (
            <Table size="small" aria-labelledby="titulo-valorizacion">
              <TableHead>
                <TableRow>
                  <TableCell scope="col">{t('inventario:campos.categoria')}</TableCell>
                  <TableCell scope="col" align="right">{t('inventario:valorizacion.productos')}</TableCell>
                  <TableCell scope="col" align="right">{t('inventario:campos.valor')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {valorizacion.categorias.map((c) => (
                  <TableRow key={c.categoriaId}>
                    <TableCell>{c.nombre}</TableCell>
                    <TableCell align="right">{c.productos}</TableCell>
                    <TableCell align="right">{formatoMoneda(c.valor, idioma)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <Box aria-live="polite">
            <Button variant="outlined" onClick={verificar} disabled={verificando}>
              {t('inventario:verificacion.boton')}
            </Button>
            {verificacion?.inconsistencias?.length === 0 && (
              <Alert severity="success" sx={{ mt: 2 }}>{t('inventario:verificacion.ok')}</Alert>
            )}
            {verificacion?.inconsistencias?.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {t('inventario:verificacion.problemas', { cantidad: verificacion.inconsistencias.length })}{' '}
                {verificacion.inconsistencias.map((i) => i.codigo).join(', ')}
              </Alert>
            )}
            {verificacion?.error && <Alert severity="error" sx={{ mt: 2 }}>{verificacion.error}</Alert>}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

/**
 * Página de inventario.
 * @returns {import('react').JSX.Element} Existencias.
 */
export default function PaginaInventario() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const { usuario } = useSesion();
  const esAdmin = usuario.rol === 'ADMIN';
  const consultar = useCallback((parametros) => listarExistencias(parametros), []);
  const listado = useListado(consultar, { q: '', categoriaId: '', soloConExistencias: false });
  const { filtros, setFiltros } = listado;
  const [texto, setTexto] = useState('');
  const [categorias, setCategorias] = useState([]);

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
    { campo: 'codigo', encabezado: t('inventario:campos.codigo'),
      render: (e) => <Box component="span" sx={{ whiteSpace: 'nowrap' }}>{e.codigo}</Box> },
    { campo: 'nombre', encabezado: t('inventario:campos.nombre') },
    { campo: 'categoria', encabezado: t('inventario:campos.categoria'), secundaria: true },
    { campo: 'unidad', encabezado: t('inventario:campos.unidad'), secundaria: true,
      render: (e) => t(`catalogo:unidades.${e.unidadMedida}`) },
    { campo: 'existencias', encabezado: t('inventario:campos.existencias'),
      render: (e) => <Box component="span" sx={{ fontWeight: 600 }}>{formatoCantidad(e.existencias, idioma)}</Box> },
    ...(esAdmin ? [
      { campo: 'costo', encabezado: t('inventario:campos.costoPromedio'), render: (e) => formatoMoneda(e.costoPromedio, idioma) },
      { campo: 'valor', encabezado: t('inventario:campos.valor'), render: (e) => formatoMoneda(e.valorInventario, idioma) },
    ] : []),
  ];

  const acciones = (e) => (
    <Tooltip title={t('inventario:acciones.kardex')}>
      <IconButton component={EnlaceRuta} to={`/inventario/${e.productoId}`}
        aria-label={`${t('inventario:acciones.kardex')} ${e.codigo}`}>
        <TimelineOutlined />
      </IconButton>
    </Tooltip>
  );

  return (
    <Stack spacing={3}>
      <Typography variant="h1">{t('inventario:titulo')}</Typography>
      {esAdmin && <ResumenAdministrador />}
      <Box component="search" aria-label={t('inventario:filtros.etiqueta')}
        sx={{ display: 'grid', gap: 2, alignItems: 'center', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr auto' } }}>
        <TextField label={t('inventario:filtros.buscar')} value={texto} onChange={(e) => setTexto(e.target.value)}
          type="search" size="small" />
        <FormControl size="small">
          <InputLabel id="filtro-categoria-etiqueta">{t('inventario:campos.categoria')}</InputLabel>
          <Select labelId="filtro-categoria-etiqueta" id="filtro-categoria" label={t('inventario:campos.categoria')}
            value={filtros.categoriaId} onChange={(e) => setFiltros({ ...filtros, categoriaId: e.target.value })}>
            <MenuItem value="">{t('inventario:filtros.todas')}</MenuItem>
            {categorias.map((c) => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControlLabel label={t('inventario:filtros.soloConExistencias')}
          control={<Switch checked={filtros.soloConExistencias}
            onChange={(e) => setFiltros({ ...filtros, soloConExistencias: e.target.checked })} />} />
      </Box>
      <TablaPaginada titulo={t('inventario:titulo')} columnas={columnas} listado={listado} acciones={acciones}
        claveFila={(e) => e.productoId} mensajeVacio={t('inventario:vacio')} />
    </Stack>
  );
}
