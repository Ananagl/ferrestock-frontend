/**
 * Nombre:                 PaginaNuevaCompra.jsx
 * Descripción:            Formulario de compra: proveedor y líneas con producto, cantidad y costo; muestra el total antes de registrar (RF-COM-001 a 003).
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
import { formatoMoneda, normalizarDecimal } from '../../../compartido/utilidades/formato.js';
import { CampoTexto } from '../../../compartido/componentes/formularios/CampoTexto.jsx';
import { CampoDinero } from '../../../compartido/componentes/formularios/CampoDinero.jsx';
import { EnfocarPrimerError } from '../../../compartido/componentes/formularios/EnfocarPrimerError.jsx';
import { EditorLineas } from '../../../compartido/componentes/documentos/EditorLineas.jsx';
import { CampoProducto, CampoTercero } from '../../../compartido/componentes/documentos/CamposDocumento.jsx';
import { registrarCompra } from '../servicios/comprasServicio.js';
import { crearEsquemaCompra } from '../validacion/esquemas.js';

const RENOMBRES = { productoId: 'producto', proveedorId: 'proveedor' };
const nuevaLinea = () => ({ producto: null, cantidad: '', costoUnitario: '' });

/**
 * @param {{producto: object|null, cantidad: string, costoUnitario: string}[]} lineas - Líneas del formulario.
 * @returns {number} Total estimado (el backend redondea cada subtotal a 2 decimales).
 */
function totalDe(lineas) {
  return lineas.reduce((suma, l) => {
    const valor = Number(normalizarDecimal(l.cantidad)) * Number(normalizarDecimal(l.costoUnitario));
    return suma + (Number.isFinite(valor) ? Math.round(valor * 100) / 100 : 0);
  }, 0);
}

/**
 * Página de registro de compra.
 * @returns {import('react').JSX.Element} Formulario.
 */
export default function PaginaNuevaCompra() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const navegar = useNavigate();
  const notificar = useNotificar();
  const [error, setError] = useState(null);
  const esquema = useMemo(() => crearEsquemaCompra(t), [t, i18n.resolvedLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  const enviar = async (valores, { setErrors, setSubmitting }) => {
    setError(null);
    try {
      const compra = await registrarCompra({
        proveedorId: valores.proveedor.id,
        observacion: valores.observacion.trim() || null,
        lineas: valores.lineas.map((l) => ({
          productoId: l.producto.id, cantidad: normalizarDecimal(l.cantidad), costoUnitario: normalizarDecimal(l.costoUnitario),
        })),
      });
      notificar(t('compras:avisos.registrada', { consecutivo: compra.consecutivo }));
      navegar(`/compras/${compra.id}`);
    } catch (excepcion) {
      const problema = leerProblema(excepcion);
      if (Object.keys(problema.errores).length > 0) setErrors(erroresFormik(problema.errores, RENOMBRES));
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
    { clave: 'costo', ancho: '1.4fr', render: (i) => <CampoDinero name={`lineas.${i}.costoUnitario`} label={t('compras:campos.costoUnitario')} /> },
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Button component={EnlaceRuta} to="/compras" startIcon={<ArrowBackOutlined />} sx={{ mb: 1 }}>{t('compras:acciones.volver')}</Button>
        <Typography variant="h1">{t('compras:nueva.titulo')}</Typography>
        <Typography color="text.secondary">{t('compras:nueva.ayuda')}</Typography>
      </Box>
      <Formik initialValues={{ proveedor: null, observacion: '', lineas: [nuevaLinea()] }} validationSchema={esquema} onSubmit={enviar}>
        {({ isSubmitting, values }) => (
          <Form noValidate>
            <EnfocarPrimerError />
            <Stack spacing={2}>
              {error && <Alert severity="error" role="alert">{error}</Alert>}
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
                <CampoTercero name="proveedor" rol="PROVEEDOR" label={t('compras:campos.proveedor')} />
                <CampoTexto name="observacion" label={t('compras:campos.observacion')} ayuda={t('compras:ayuda.observacion')} autoComplete="off" />
              </Box>
              <EditorLineas columnas={columnas} nuevaLinea={nuevaLinea} etiqueta={t('documentos:lineas.titulo')}
                textoAgregar={t('documentos:lineas.agregar')} />
              <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h2" component="p" data-testid="total-compra">
                  {t('documentos:campos.total')}: {formatoMoneda(totalDe(values.lineas), idioma)}
                </Typography>
                <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>{t('compras:acciones.registrar')}</Button>
              </Paper>
            </Stack>
          </Form>
        )}
      </Formik>
    </Stack>
  );
}
