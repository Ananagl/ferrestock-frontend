/**
 * Nombre:                 PaginaAjustes.jsx
 * Descripción:            Ajustes de inventario (solo ADMIN): historial filtrable por producto, tipo y fechas, con motivo y responsable, y registro de nuevos ajustes (RF-AJU).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.7.0
 * @file
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Button, Chip, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography,
} from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import { useTranslation } from 'react-i18next';
import { useNotificar } from '../../../app/proveedores/ProveedorNotificaciones.jsx';
import { useListado } from '../../../compartido/hooks/useListado.js';
import { formatoCantidad, formatoFechaHora, formatoMoneda } from '../../../compartido/utilidades/formato.js';
import { TablaPaginada } from '../../../compartido/componentes/tablas/TablaPaginada.jsx';
import { BuscadorProducto } from '../../catalogo/componentes/BuscadorProducto.jsx';
import { obtenerProducto } from '../../catalogo/servicios/catalogoServicio.js';
import { listarAjustes, TIPOS_AJUSTE } from '../servicios/ajustesServicio.js';
import { DialogoAjuste } from '../componentes/DialogoAjuste.jsx';

/**
 * Página de ajustes. Con {@code ?nuevo=<productoId>} abre el formulario con ese producto (enlace desde el kardex).
 * @returns {import('react').JSX.Element} Historial y registro de ajustes.
 */
export default function PaginaAjustes() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const notificar = useNotificar();
  const [parametros, setParametros] = useSearchParams();
  const listado = useListado(listarAjustes, { productoId: '', tipo: '', desde: '', hasta: '' });
  const { filtros, setFiltros } = listado;
  const [productoFiltro, setProductoFiltro] = useState(null);
  const [dialogo, setDialogo] = useState(null);

  const nuevoPara = parametros.get('nuevo');
  useEffect(() => {
    if (!nuevoPara) return;
    obtenerProducto(nuevoPara)
      .then((p) => setDialogo({ producto: p.estado === 'ACTIVO' ? p : null }))
      .catch(() => setDialogo({ producto: null }));
    setParametros({}, { replace: true });
  }, [nuevoPara, setParametros]);

  const columnas = [
    { campo: 'fecha', encabezado: t('ajustes:campos.fecha'), render: (a) => formatoFechaHora(a.fecha, idioma) },
    { campo: 'consecutivo', encabezado: t('ajustes:campos.consecutivo'), secundaria: true,
      render: (a) => <Box component="span" sx={{ whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{a.consecutivo}</Box> },
    { campo: 'producto', encabezado: t('ajustes:campos.producto'), render: (a) => (
      <>
        <Box component="span" sx={{ fontWeight: 600 }}>{a.productoCodigo}</Box>{' '}
        <Box component="span" sx={{ color: 'text.secondary' }}>{a.productoNombre}</Box>
      </>
    ) },
    { campo: 'tipo', encabezado: t('ajustes:campos.tipo'), render: (a) => (
      <Chip size="small" variant="outlined" color={a.tipo === 'ENTRADA' ? 'success' : 'warning'} label={t(`ajustes:tipos.${a.tipo}`)} />
    ) },
    { campo: 'cantidad', encabezado: t('ajustes:campos.cantidad'),
      render: (a) => `${a.tipo === 'ENTRADA' ? '+' : '−'}${formatoCantidad(a.cantidad, idioma)}` },
    { campo: 'costoUnitario', encabezado: t('ajustes:campos.costoUnitario'), secundaria: true,
      render: (a) => formatoMoneda(a.costoUnitario, idioma) },
    { campo: 'motivo', encabezado: t('ajustes:campos.motivo') },
    { campo: 'usuario', encabezado: t('ajustes:campos.usuario'), secundaria: true },
  ];

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h1">{t('ajustes:titulo')}</Typography>
          <Typography color="text.secondary">{t('ajustes:subtitulo')}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setDialogo({ producto: null })}>
          {t('ajustes:acciones.nuevo')}
        </Button>
      </Box>

      <Box component="search" aria-label={t('ajustes:filtros.etiqueta')}
        sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr' } }}>
        <BuscadorProducto id="filtro-producto" size="small" label={t('ajustes:campos.producto')} value={productoFiltro}
          onChange={(p) => { setProductoFiltro(p); setFiltros({ ...filtros, productoId: p?.id ?? '' }); }} />
        <FormControl size="small">
          <InputLabel id="filtro-tipo-etiqueta">{t('ajustes:campos.tipo')}</InputLabel>
          <Select labelId="filtro-tipo-etiqueta" id="filtro-tipo" label={t('ajustes:campos.tipo')} value={filtros.tipo}
            onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}>
            <MenuItem value="">{t('ajustes:filtros.todos')}</MenuItem>
            {TIPOS_AJUSTE.map((tipo) => <MenuItem key={tipo} value={tipo}>{t(`ajustes:tipos.${tipo}`)}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField type="date" size="small" label={t('ajustes:filtros.desde')} value={filtros.desde}
          onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField type="date" size="small" label={t('ajustes:filtros.hasta')} value={filtros.hasta}
          onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
      </Box>

      <TablaPaginada titulo={t('ajustes:historial')} columnas={columnas} listado={listado} mensajeVacio={t('ajustes:vacio')} />

      {dialogo && (
        <DialogoAjuste productoInicial={dialogo.producto} onCerrar={() => setDialogo(null)}
          onGuardado={(ajuste) => {
            setDialogo(null);
            notificar(t('ajustes:avisos.registrado', {
              consecutivo: ajuste.consecutivo, codigo: ajuste.productoCodigo,
              existencias: formatoCantidad(ajuste.existenciasResultantes, idioma),
            }));
            listado.recargar();
          }} />
      )}
    </Stack>
  );
}
