/**
 * Nombre:                 PaginaNuevaDevolucion.jsx
 * Descripción:            Formulario de devolución: cliente, venta opcional (carga lo que queda por devolver), motivo y líneas validadas como aceptadas o rechazadas (RF-DEV-001 a 004).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.9.0
 * @file
 */
import { useEffect, useMemo, useState } from 'react';
import { Link as EnlaceRuta, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Autocomplete, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import { Form, Formik, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { useNotificar } from '../../../app/proveedores/ProveedorNotificaciones.jsx';
import { erroresFormik, leerProblema } from '../../../servicios/api/problemas.js';
import { formatoCantidad, formatoFechaHora, formatoMoneda, normalizarDecimal } from '../../../compartido/utilidades/formato.js';
import { CampoTexto } from '../../../compartido/componentes/formularios/CampoTexto.jsx';
import { CampoSeleccion } from '../../../compartido/componentes/formularios/CampoSeleccion.jsx';
import { EnfocarPrimerError } from '../../../compartido/componentes/formularios/EnfocarPrimerError.jsx';
import { EditorLineas } from '../../../compartido/componentes/documentos/EditorLineas.jsx';
import { CampoProducto, CampoTercero } from '../../../compartido/componentes/documentos/CamposDocumento.jsx';
import { listarVentas, obtenerVenta } from '../../ventas/servicios/ventasServicio.js';
import { consultarDevolvible, registrarDevolucion } from '../servicios/devolucionesServicio.js';
import { crearEsquemaDevolucion } from '../validacion/esquemas.js';

const RENOMBRES = { productoId: 'producto', clienteId: 'cliente', ventaId: 'venta' };
const nuevaLinea = () => ({ producto: null, cantidad: '', resultado: 'ACEPTADA', disponible: null });
const VACIO = Object.freeze({ cliente: null, venta: null, motivo: '', lineas: [nuevaLinea()] });

/**
 * Venta de origen opcional: lista las ventas registradas del cliente elegido y, al escoger una, carga sus líneas
 * con lo que queda por devolver.
 * @returns {import('react').JSX.Element} Selector de venta.
 */
function CampoVenta() {
  const { t, i18n } = useTranslation();
  const { values, setFieldValue, errors } = useFormikContext();
  const [encontradas, setEncontradas] = useState({ clienteId: null, lista: [] });
  const clienteId = values.cliente?.id;
  const opciones = encontradas.clienteId === clienteId ? encontradas.lista : [];

  useEffect(() => {
    let vigente = true;
    if (!clienteId) return undefined;
    listarVentas({ clienteId, estado: 'REGISTRADA', pagina: 0, tamano: 50 })
      .then((p) => vigente && setEncontradas({ clienteId, lista: p.contenido }))
      .catch(() => vigente && setEncontradas({ clienteId, lista: [] }));
    return () => { vigente = false; };
  }, [clienteId]);

  // Si cambia el cliente, la venta elegida deja de corresponder
  useEffect(() => {
    if (values.venta && values.venta.clienteId !== clienteId) {
      setFieldValue('venta', null);
      setFieldValue('lineas', [nuevaLinea()]);
    }
  }, [clienteId, values.venta, setFieldValue]);

  const elegir = async (venta) => {
    setFieldValue('venta', venta);
    if (!venta) { setFieldValue('lineas', [nuevaLinea()]); return; }
    const lineas = await consultarDevolvible(venta.id);
    setFieldValue('lineas', lineas.filter((l) => Number(l.disponible) > 0).map((l, i) => ({
      clave: `venta-${venta.id}-${i}`,
      producto: { id: l.productoId, codigo: l.productoCodigo, nombre: l.productoNombre, permiteFraccion: l.permiteFraccion,
        existencias: l.disponible, unidadMedida: 'UNIDAD' },
      cantidad: '', resultado: 'ACEPTADA', disponible: l.disponible,
    })));
  };

  return (
    <Autocomplete id="venta" value={values.venta} options={opciones} disabled={!clienteId}
      onChange={(_, v) => elegir(v)} isOptionEqualToValue={(a, b) => a.id === b.id}
      getOptionLabel={(v) => `${v.consecutivo} — ${formatoFechaHora(v.fecha, i18n.resolvedLanguage)} — ${formatoMoneda(v.total, i18n.resolvedLanguage)}`}
      noOptionsText={t('devoluciones:venta.sinVentas')}
      renderInput={(params) => (
        <TextField {...params} label={t('devoluciones:campos.venta')} error={Boolean(errors.venta)}
          helperText={errors.venta ?? (clienteId ? t('devoluciones:venta.ayuda') : t('devoluciones:venta.eligeCliente'))} />
      )} />
  );
}

/**
 * Página de devolución. Con {@code ?venta=<id>} parte de esa venta (enlace desde el detalle de la venta).
 * @returns {import('react').JSX.Element} Formulario.
 */
export default function PaginaNuevaDevolucion() {
  const { t, i18n } = useTranslation();
  const navegar = useNavigate();
  const notificar = useNotificar();
  const [parametros] = useSearchParams();
  const [error, setError] = useState(null);
  const ventaInicial = parametros.get('venta');
  const [iniciales, setIniciales] = useState(() => (ventaInicial ? null : VACIO));
  const esquema = useMemo(() => crearEsquemaDevolucion(t), [t, i18n.resolvedLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ventaInicial) return;
    Promise.all([obtenerVenta(ventaInicial), consultarDevolvible(ventaInicial)]).then(([venta, devolvible]) => {
      setIniciales({
        cliente: { id: venta.clienteId, nombre: venta.clienteNombre, tipoDocumento: '', numeroDocumento: '' },
        venta, motivo: '',
        lineas: devolvible.filter((l) => Number(l.disponible) > 0).map((l, i) => ({
          clave: `venta-${venta.id}-${i}`,
          producto: { id: l.productoId, codigo: l.productoCodigo, nombre: l.productoNombre, permiteFraccion: l.permiteFraccion,
            existencias: l.disponible, unidadMedida: 'UNIDAD' },
          cantidad: '', resultado: 'ACEPTADA', disponible: l.disponible,
        })),
      });
    }).catch(() => setIniciales(VACIO));
  }, [ventaInicial]);

  const enviar = async (valores, { setErrors, setSubmitting }) => {
    setError(null);
    try {
      const devolucion = await registrarDevolucion({
        clienteId: valores.cliente.id,
        ventaId: valores.venta?.id ?? null,
        motivo: valores.motivo.trim(),
        lineas: valores.lineas.map((l) => ({ productoId: l.producto.id, cantidad: normalizarDecimal(l.cantidad), resultado: l.resultado })),
      });
      notificar(t('devoluciones:avisos.registrada', { consecutivo: devolucion.consecutivo }));
      navegar(`/devoluciones/${devolucion.id}`);
    } catch (excepcion) {
      const problema = leerProblema(excepcion);
      if (Object.keys(problema.errores).length > 0) setErrors(erroresFormik(problema.errores, RENOMBRES));
      else setError(problema.detalle ?? t('estado.error'));
      setSubmitting(false);
    }
  };

  const resultados = [
    { valor: 'ACEPTADA', texto: t('devoluciones:resultados.ACEPTADA') },
    { valor: 'RECHAZADA', texto: t('devoluciones:resultados.RECHAZADA') },
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Button component={EnlaceRuta} to="/devoluciones" startIcon={<ArrowBackOutlined />} sx={{ mb: 1 }}>{t('devoluciones:acciones.volver')}</Button>
        <Typography variant="h1">{t('devoluciones:nueva.titulo')}</Typography>
        <Typography color="text.secondary">{t('devoluciones:nueva.ayuda')}</Typography>
      </Box>
      {iniciales && (
        <Formik initialValues={iniciales} validationSchema={esquema} onSubmit={enviar}>
          {({ isSubmitting, values }) => {
            const conVenta = Boolean(values.venta);
            const columnas = [
              { clave: 'producto', ancho: '3fr', render: (i) => (
                <CampoProducto name={`lineas.${i}.producto`} label={t('documentos:campos.producto')} soloActivos={false} disabled={conVenta} />
              ) },
              { clave: 'cantidad', ancho: '1.2fr', render: (i, l) => (
                <CampoTexto name={`lineas.${i}.cantidad`} label={t('documentos:campos.cantidad')} autoComplete="off"
                  ayuda={l.disponible != null ? t('devoluciones:venta.disponible', { cantidad: formatoCantidad(l.disponible, i18n.resolvedLanguage) }) : undefined}
                  slotProps={{ htmlInput: { inputMode: 'decimal' } }} />
              ) },
              { clave: 'resultado', ancho: '1.4fr', render: (i) => (
                <CampoSeleccion name={`lineas.${i}.resultado`} label={t('devoluciones:campos.resultado')} opciones={resultados} />
              ) },
            ];
            return (
              <Form noValidate>
                <EnfocarPrimerError />
                <Stack spacing={2}>
                  {error && <Alert severity="error" role="alert">{error}</Alert>}
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                    <CampoTercero name="cliente" rol="CLIENTE" label={t('devoluciones:campos.cliente')} disabled={Boolean(ventaInicial)} />
                    <CampoVenta />
                  </Box>
                  {!conVenta && <Alert severity="info">{t('devoluciones:sinVentaAviso')}</Alert>}
                  <CampoTexto name="motivo" label={t('devoluciones:campos.motivo')} multiline minRows={2} autoComplete="off"
                    slotProps={{ htmlInput: { maxLength: 300 } }} />
                  <EditorLineas columnas={columnas} nuevaLinea={nuevaLinea} etiqueta={t('documentos:lineas.titulo')}
                    textoAgregar={t('documentos:lineas.agregar')} sinAgregar={conVenta} />
                  <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>{t('devoluciones:acciones.registrar')}</Button>
                  </Paper>
                </Stack>
              </Form>
            );
          }}
        </Formik>
      )}
    </Stack>
  );
}
