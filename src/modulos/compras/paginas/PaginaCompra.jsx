/**
 * Nombre:                 PaginaCompra.jsx
 * Descripción:            Detalle de una compra con sus líneas; el ADMIN puede anularla con motivo (RF-COM-004, RF-COM-005).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.8.0
 * @file
 */
import { useEffect, useState } from 'react';
import { Link as EnlaceRuta, useParams } from 'react-router-dom';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import BlockOutlined from '@mui/icons-material/BlockOutlined';
import { useTranslation } from 'react-i18next';
import { useSesion } from '../../../app/proveedores/ProveedorSesion.jsx';
import { useNotificar } from '../../../app/proveedores/ProveedorNotificaciones.jsx';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { formatoCantidad, formatoFechaHora, formatoMoneda } from '../../../compartido/utilidades/formato.js';
import { Cargando } from '../../../compartido/componentes/retroalimentacion/Cargando.jsx';
import { ChipEstadoDocumento } from '../../../compartido/componentes/documentos/ChipEstadoDocumento.jsx';
import { DialogoAnulacion } from '../../../compartido/componentes/documentos/DialogoAnulacion.jsx';
import { DetalleDocumento } from '../../../compartido/componentes/documentos/DetalleDocumento.jsx';
import { anularCompra, obtenerCompra } from '../servicios/comprasServicio.js';

/**
 * Página de detalle de compra.
 * @returns {import('react').JSX.Element} Detalle.
 */
export default function PaginaCompra() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const { id } = useParams();
  const { usuario } = useSesion();
  const notificar = useNotificar();
  const [compra, setCompra] = useState(null);
  const [problema, setProblema] = useState(null);
  const [anulando, setAnulando] = useState(false);

  useEffect(() => {
    obtenerCompra(id).then(setCompra).catch((e) => setProblema(leerProblema(e)));
  }, [id]);

  const volver = <Button component={EnlaceRuta} to="/compras" startIcon={<ArrowBackOutlined />} sx={{ mb: 1 }}>{t('compras:acciones.volver')}</Button>;
  if (problema) {
    return <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>{volver}<Alert severity="error">{problema.estado === 404 ? t('documentos:noExiste') : t('estado.error')}</Alert></Stack>;
  }
  if (!compra) return <Cargando />;

  const datos = [
    { etiqueta: t('compras:campos.proveedor'), valor: compra.proveedorNombre },
    { etiqueta: t('documentos:campos.fecha'), valor: formatoFechaHora(compra.fecha, idioma) },
    { etiqueta: t('documentos:campos.usuario'), valor: compra.usuario },
    ...(compra.observacion ? [{ etiqueta: t('compras:campos.observacion'), valor: compra.observacion }] : []),
  ];
  const columnas = [
    { campo: 'producto', encabezado: t('documentos:campos.producto'), render: (l) => `${l.productoCodigo} — ${l.productoNombre}` },
    { campo: 'cantidad', encabezado: t('documentos:campos.cantidad'), numerica: true, render: (l) => formatoCantidad(l.cantidad, idioma) },
    { campo: 'costoUnitario', encabezado: t('compras:campos.costoUnitario'), numerica: true, render: (l) => formatoMoneda(l.costoUnitario, idioma) },
    { campo: 'subtotal', encabezado: t('documentos:campos.subtotal'), numerica: true, render: (l) => formatoMoneda(l.subtotal, idioma) },
  ];

  return (
    <Stack spacing={3}>
      <Box>
        {volver}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Typography variant="h1">{t('compras:detalle.titulo', { consecutivo: compra.consecutivo })}</Typography>
            <ChipEstadoDocumento estado={compra.estado} />
          </Stack>
          {usuario.rol === 'ADMIN' && compra.estado === 'REGISTRADA' && (
            <Button color="error" variant="outlined" startIcon={<BlockOutlined />} onClick={() => setAnulando(true)}>
              {t('documentos:acciones.anular')}
            </Button>
          )}
        </Box>
      </Box>
      {compra.estado === 'ANULADA' && (
        <Alert severity="warning">
          {t('documentos:anulacion.resumen', { usuario: compra.anuladaPor, fecha: formatoFechaHora(compra.anuladaEn, idioma), motivo: compra.motivoAnulacion })}
        </Alert>
      )}
      <DetalleDocumento datos={datos} columnas={columnas} lineas={compra.lineas} titulo={t('documentos:lineas.titulo')}
        totales={[{ etiqueta: t('documentos:campos.total'), valor: formatoMoneda(compra.total, idioma), destacado: true }]} />
      {anulando && (
        <DialogoAnulacion titulo={t('compras:anular.titulo', { consecutivo: compra.consecutivo })} mensaje={t('compras:anular.mensaje')}
          onCerrar={() => setAnulando(false)}
          onAnular={async (motivo) => {
            const anulada = await anularCompra(compra.id, motivo);
            setCompra(anulada);
            setAnulando(false);
            notificar(t('compras:avisos.anulada', { consecutivo: anulada.consecutivo }));
          }} />
      )}
    </Stack>
  );
}
