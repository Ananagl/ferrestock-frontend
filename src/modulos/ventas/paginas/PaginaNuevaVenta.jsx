/**
 * Nombre:                 PaginaNuevaVenta.jsx
 * Descripción:            Formulario de venta: cliente, líneas con precio vigente y subtotal, total, efectivo recibido y cambio (RF-VEN-001 a 004, RF-PAG-001 a 003).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.8.0
 * @file
 */
import { useMemo, useState } from 'react';
import { Link as EnlaceRuta, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import { Form, Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { useNotificar } from '../../../app/proveedores/ProveedorNotificaciones.jsx';
import { erroresFormik, leerProblema } from '../../../servicios/api/problemas.js';
import { formatoCantidad, formatoMoneda, normalizarDecimal } from '../../../compartido/utilidades/formato.js';
import { CampoTexto } from '../../../compartido/componentes/formularios/CampoTexto.jsx';
import { CampoDinero } from '../../../compartido/componentes/formularios/CampoDinero.jsx';
import { EnfocarPrimerError } from '../../../compartido/componentes/formularios/EnfocarPrimerError.jsx';
import { EditorLineas } from '../../../compartido/componentes/documentos/EditorLineas.jsx';
import { CampoProducto, CampoTercero } from '../../../compartido/componentes/documentos/CamposDocumento.jsx';
import { registrarVenta } from '../servicios/ventasServicio.js';
import { crearEsquemaVenta, totalVenta } from '../validacion/esquemas.js';

const RENOMBRES = { productoId: 'producto', clienteId: 'cliente', valorRecibido: 'valorRecibido' };
const nuevaLinea = () => ({ producto: null, cantidad: '' });

/**
 * Convierte los errores del backend: los del pago llegan como {@code pago.valorRecibido}.
 * @param {Record<string,string>} errores - Errores planos.
 * @returns {Record<string, any>} Errores para Formik.
 */
function erroresVenta(errores) {
  const anidados = erroresFormik(errores, RENOMBRES);
  if (anidados.pago) {
    if (anidados.pago.valorRecibido) anidados.valorRecibido = anidados.pago.valorRecibido;
    delete anidados.pago;
  }
  return anidados;
}

/**
 * Página de venta.
 * @returns {import('react').JSX.Element} Formulario.
 */
export default function PaginaNuevaVenta() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const navegar = useNavigate();
  const notificar = useNotificar();
  const [error, setError] = useState(null);
  const esquema = useMemo(() => crearEsquemaVenta(t), [t, i18n.resolvedLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  const enviar = async (valores, { setErrors, setSubmitting }) => {
    setError(null);
    try {
      const venta = await registrarVenta({
        clienteId: valores.cliente.id,
        lineas: valores.lineas.map((l) => ({ productoId: l.producto.id, cantidad: normalizarDecimal(l.cantidad) })),
        pago: { medio: 'EFECTIVO', valorRecibido: normalizarDecimal(valores.valorRecibido) },
      });
      notificar(t('ventas:avisos.registrada', { consecutivo: venta.consecutivo, cambio: formatoMoneda(venta.cambio, idioma) }));
      navegar(`/ventas/${venta.id}`);
    } catch (excepcion) {
      const problema = leerProblema(excepcion);
      if (Object.keys(problema.errores).length > 0) setErrors(erroresVenta(problema.errores));
      else setError(problema.detalle ?? t('estado.error'));
      setSubmitting(false);
    }
  };

  const columnas = [
    { clave: 'producto', ancho: '3fr', render: (i) => <CampoProducto name={`lineas.${i}.producto`} label={t('documentos:campos.producto')} /> },
    { clave: 'cantidad', ancho: '1fr', render: (i) => (
      <CampoTexto name={`lineas.${i}.cantidad`} label={t('documentos:campos.cantidad')} autoComplete="off"
        slotProps={{ htmlInput: { inputMode: 'decimal' } }} />
    ) },
    { clave: 'precio', ancho: '1.6fr', render: (_, l) => (
      <Box sx={{ pt: { md: 1 } }}>
        <Typography variant="body2" color="text.secondary">
          {l.producto ? `${t('ventas:campos.precio')}: ${formatoMoneda(l.producto.precioVenta, idioma)}` : ' '}
        </Typography>
        <Typography variant="body2">
          {l.producto ? t('ventas:campos.disponibles', { cantidad: formatoCantidad(l.producto.existencias, idioma) }) : ''}
        </Typography>
      </Box>
    ) },
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Button component={EnlaceRuta} to="/ventas" startIcon={<ArrowBackOutlined />} sx={{ mb: 1 }}>{t('ventas:acciones.volver')}</Button>
        <Typography variant="h1">{t('ventas:nueva.titulo')}</Typography>
      </Box>
      <Formik initialValues={{ cliente: null, lineas: [nuevaLinea()], valorRecibido: '' }} validationSchema={esquema} onSubmit={enviar}>
        {({ isSubmitting, values }) => {
          const total = totalVenta(values.lineas);
          const recibido = Number(normalizarDecimal(values.valorRecibido));
          const cambio = Number.isFinite(recibido) && recibido >= total ? recibido - total : null;
          return (
            <Form noValidate>
              <EnfocarPrimerError />
              <Stack spacing={2}>
                {error && <Alert severity="error" role="alert">{error}</Alert>}
                <Box sx={{ maxWidth: { md: '50%' } }}>
                  <CampoTercero name="cliente" rol="CLIENTE" label={t('ventas:campos.cliente')} />
                </Box>
                <EditorLineas columnas={columnas} nuevaLinea={nuevaLinea} etiqueta={t('documentos:lineas.titulo')}
                  textoAgregar={t('documentos:lineas.agregar')} />
                <Paper variant="outlined" component="section" aria-label={t('ventas:pago.titulo')}
                  sx={{ p: 2, display: 'grid', gap: 2, alignItems: 'center', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr auto' } }}>
                  <Typography variant="h2" component="p" data-testid="total-venta">{t('documentos:campos.total')}: {formatoMoneda(total, idioma)}</Typography>
                  <CampoDinero name="valorRecibido" label={t('ventas:pago.recibido')} ayuda={t('ventas:pago.soloEfectivo')} />
                  <Typography data-testid="cambio-venta" aria-live="polite">
                    {t('ventas:pago.cambio')}: <strong>{cambio === null ? '—' : formatoMoneda(cambio, idioma)}</strong>
                  </Typography>
                  <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>{t('ventas:acciones.confirmar')}</Button>
                </Paper>
              </Stack>
            </Form>
          );
        }}
      </Formik>
    </Stack>
  );
}
