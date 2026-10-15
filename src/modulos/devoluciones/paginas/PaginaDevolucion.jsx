/**
 * Nombre:                 PaginaDevolucion.jsx
 * Descripción:            Detalle de una devolución: cliente, venta de origen, motivo, quién validó y el resultado de cada línea (RF-DEV-005).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.10.0
 * @file
 */
import { useEffect, useState } from 'react';
import { Link as EnlaceRuta, useParams } from 'react-router-dom';
import { Alert, Box, Button, Chip, Link, Stack, Typography } from '@mui/material';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import { useTranslation } from 'react-i18next';
import { useSesion } from '../../../app/proveedores/ProveedorSesion.jsx';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { formatoCantidad, formatoFechaHora, formatoMoneda } from '../../../compartido/utilidades/formato.js';
import { Cargando } from '../../../compartido/componentes/retroalimentacion/Cargando.jsx';
import { DetalleDocumento } from '../../../compartido/componentes/documentos/DetalleDocumento.jsx';
import { obtenerDevolucion } from '../servicios/devolucionesServicio.js';

/**
 * Página de detalle de devolución.
 * @returns {import('react').JSX.Element} Detalle.
 */
export default function PaginaDevolucion() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const { id } = useParams();
  const { usuario } = useSesion();
  const [devolucion, setDevolucion] = useState(null);
  const [problema, setProblema] = useState(null);

  useEffect(() => {
    obtenerDevolucion(id).then(setDevolucion).catch((e) => setProblema(leerProblema(e)));
  }, [id]);

  const volver = <Button component={EnlaceRuta} to="/devoluciones" startIcon={<ArrowBackOutlined />} sx={{ mb: 1 }}>{t('devoluciones:acciones.volver')}</Button>;
  if (problema) {
    return <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>{volver}<Alert severity="error">{problema.estado === 404 ? t('documentos:noExiste') : t('estado.error')}</Alert></Stack>;
  }
  if (!devolucion) return <Cargando />;

  const datos = [
    { etiqueta: t('devoluciones:campos.cliente'), valor: devolucion.clienteNombre },
    { etiqueta: t('devoluciones:campos.venta'), valor: devolucion.ventaId
      ? <Link component={EnlaceRuta} to={`/ventas/${devolucion.ventaId}`}>{devolucion.ventaConsecutivo}</Link>
      : t('devoluciones:sinVenta') },
    { etiqueta: t('documentos:campos.fecha'), valor: formatoFechaHora(devolucion.fecha, idioma) },
    { etiqueta: t('devoluciones:campos.validadaPor'), valor: devolucion.validadaPor },
    { etiqueta: t('devoluciones:campos.motivo'), valor: devolucion.motivo },
  ];
  const columnas = [
    { campo: 'producto', encabezado: t('documentos:campos.producto'), render: (l) => `${l.productoCodigo} — ${l.productoNombre}` },
    { campo: 'cantidad', encabezado: t('documentos:campos.cantidad'), numerica: true, render: (l) => formatoCantidad(l.cantidad, idioma) },
    { campo: 'resultado', encabezado: t('devoluciones:campos.resultado'), render: (l) => (
      <Chip size="small" variant="outlined" color={l.resultado === 'ACEPTADA' ? 'success' : 'default'} label={t(`devoluciones:resultados.${l.resultado}`)} />
    ) },
    ...(usuario.rol === 'ADMIN' ? [{ campo: 'costo', encabezado: t('devoluciones:campos.costo'), numerica: true,
      render: (l) => (l.costoUnitario ? formatoMoneda(l.costoUnitario, idioma) : '—') }] : []),
  ];

  return (
    <Stack spacing={3}>
      <Box>
        {volver}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h1">{t('devoluciones:detalle.titulo', { consecutivo: devolucion.consecutivo })}</Typography>
          <Button component={EnlaceRuta} to={`/comprobantes/DEVOLUCION/${devolucion.consecutivo}`} variant="outlined" startIcon={<ReceiptLongOutlined />}>{t('comprobantes:acciones.ver')}</Button>
        </Box>
      </Box>
      <DetalleDocumento datos={datos} columnas={columnas} lineas={devolucion.lineas} titulo={t('documentos:lineas.titulo')}
        totales={[
          { etiqueta: t('devoluciones:resultados.ACEPTADA'), valor: String(devolucion.aceptadas), destacado: true },
          { etiqueta: t('devoluciones:resultados.RECHAZADA'), valor: String(devolucion.rechazadas) },
        ]} />
    </Stack>
  );
}
