/**
 * Nombre:                 PaginaVenta.jsx
 * Descripción:            Detalle de una venta con líneas, pago y cambio; el ADMIN ve el costo y puede anularla con motivo (RF-VEN-005, RF-VEN-006).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.9.0
 * @file
 */
import { useEffect, useState } from 'react';
import { Link as EnlaceRuta, useParams } from 'react-router-dom';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import AssignmentReturnOutlined from '@mui/icons-material/AssignmentReturnOutlined';
import { useTranslation } from 'react-i18next';
import { useSesion } from '../../../app/proveedores/ProveedorSesion.jsx';
import { useNotificar } from '../../../app/proveedores/ProveedorNotificaciones.jsx';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { formatoCantidad, formatoFechaHora, formatoMoneda } from '../../../compartido/utilidades/formato.js';
import { Cargando } from '../../../compartido/componentes/retroalimentacion/Cargando.jsx';
import { ChipEstadoDocumento } from '../../../compartido/componentes/documentos/ChipEstadoDocumento.jsx';
import { DialogoAnulacion } from '../../../compartido/componentes/documentos/DialogoAnulacion.jsx';
import { DetalleDocumento } from '../../../compartido/componentes/documentos/DetalleDocumento.jsx';
import { anularVenta, obtenerVenta } from '../servicios/ventasServicio.js';

/**
 * Página de detalle de venta.
 * @returns {import('react').JSX.Element} Detalle.
 */
export default function PaginaVenta() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const { id } = useParams();
  const { usuario } = useSesion();
  const esAdmin = usuario.rol === 'ADMIN';
  const notificar = useNotificar();
  const [venta, setVenta] = useState(null);
  const [problema, setProblema] = useState(null);
  const [anulando, setAnulando] = useState(false);

  useEffect(() => {
    obtenerVenta(id).then(setVenta).catch((e) => setProblema(leerProblema(e)));
  }, [id]);

  const volver = <Button component={EnlaceRuta} to="/ventas" startIcon={<ArrowBackOutlined />} sx={{ mb: 1 }}>{t('ventas:acciones.volver')}</Button>;
  if (problema) {
    return <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>{volver}<Alert severity="error">{problema.estado === 404 ? t('documentos:noExiste') : t('estado.error')}</Alert></Stack>;
  }
  if (!venta) return <Cargando />;

  const conDevoluciones = venta.lineas.some((l) => Number(l.cantidadDevuelta) > 0);
  const datos = [
    { etiqueta: t('ventas:campos.cliente'), valor: venta.clienteNombre },
    { etiqueta: t('documentos:campos.fecha'), valor: formatoFechaHora(venta.fecha, idioma) },
    { etiqueta: t('documentos:campos.usuario'), valor: venta.usuario },
    { etiqueta: t('ventas:pago.medio'), valor: t('ventas:pago.efectivo') },
  ];
  const columnas = [
    { campo: 'producto', encabezado: t('documentos:campos.producto'), render: (l) => `${l.productoCodigo} — ${l.productoNombre}` },
    { campo: 'cantidad', encabezado: t('documentos:campos.cantidad'), numerica: true, render: (l) => formatoCantidad(l.cantidad, idioma) },
    { campo: 'precio', encabezado: t('ventas:campos.precio'), numerica: true, render: (l) => formatoMoneda(l.precioUnitario, idioma) },
    { campo: 'subtotal', encabezado: t('documentos:campos.subtotal'), numerica: true, render: (l) => formatoMoneda(l.subtotal, idioma) },
    { campo: 'devuelta', encabezado: t('ventas:campos.devuelta'), numerica: true, render: (l) => formatoCantidad(l.cantidadDevuelta, idioma) },
    ...(esAdmin ? [{ campo: 'costo', encabezado: t('ventas:campos.costo'), numerica: true, render: (l) => formatoMoneda(l.costoUnitario, idioma) }] : []),
  ];

  return (
    <Stack spacing={3}>
      <Box>
        {volver}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Typography variant="h1">{t('ventas:detalle.titulo', { consecutivo: venta.consecutivo })}</Typography>
            <ChipEstadoDocumento estado={venta.estado} />
          </Stack>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {venta.estado === 'REGISTRADA' && (
              <Button component={EnlaceRuta} to={`/devoluciones/nueva?venta=${venta.id}`} variant="outlined" startIcon={<AssignmentReturnOutlined />}>
                {t('devoluciones:acciones.desdeVenta')}
              </Button>
            )}
            {esAdmin && venta.estado === 'REGISTRADA' && (
              <Button color="error" variant="outlined" startIcon={<BlockOutlined />} onClick={() => setAnulando(true)}>
                {t('documentos:acciones.anular')}
              </Button>
            )}
          </Stack>
        </Box>
      </Box>
      {venta.estado === 'ANULADA' && (
        <Alert severity="warning">
          {t('documentos:anulacion.resumen', { usuario: venta.anuladaPor, fecha: formatoFechaHora(venta.anuladaEn, idioma), motivo: venta.motivoAnulacion })}
        </Alert>
      )}
      <DetalleDocumento datos={datos} columnas={columnas} lineas={venta.lineas} titulo={t('documentos:lineas.titulo')}
        totales={[
          { etiqueta: t('documentos:campos.total'), valor: formatoMoneda(venta.total, idioma), destacado: true },
          { etiqueta: t('ventas:pago.recibido'), valor: formatoMoneda(venta.valorRecibido, idioma) },
          { etiqueta: t('ventas:pago.cambio'), valor: formatoMoneda(venta.cambio, idioma) },
        ]} />
      {anulando && (
        <DialogoAnulacion titulo={t('ventas:anular.titulo', { consecutivo: venta.consecutivo })}
          mensaje={conDevoluciones ? t('ventas:anular.conDevoluciones') : t('ventas:anular.mensaje')}
          onCerrar={() => setAnulando(false)}
          onAnular={async (motivo) => {
            const anulada = await anularVenta(venta.id, motivo);
            setVenta(anulada);
            setAnulando(false);
            notificar(t('ventas:avisos.anulada', { consecutivo: anulada.consecutivo }));
          }} />
      )}
    </Stack>
  );
}
