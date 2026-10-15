/**
 * Nombre:                 DialogoAjuste.jsx
 * Descripción:            Formulario en diálogo para registrar un ajuste de entrada o salida, incluido el inventario inicial; muestra el efecto en las existencias antes de guardar.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.7.0
 * @file
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormHelperText,
  InputAdornment, Radio, RadioGroup, Stack, Typography,
} from '@mui/material';
import { Form, Formik, useField, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { formatoCantidad, formatoMoneda, normalizarDecimal } from '../../../compartido/utilidades/formato.js';
import { CampoTexto } from '../../../compartido/componentes/formularios/CampoTexto.jsx';
import { CampoDinero } from '../../../compartido/componentes/formularios/CampoDinero.jsx';
import { EnfocarPrimerError } from '../../../compartido/componentes/formularios/EnfocarPrimerError.jsx';
import { BuscadorProducto } from '../../catalogo/componentes/BuscadorProducto.jsx';
import { obtenerCosto } from '../../catalogo/servicios/catalogoServicio.js';
import { registrarAjuste } from '../servicios/ajustesServicio.js';
import { crearEsquemaAjuste, MOTIVOS_SUGERIDOS } from '../validacion/esquemas.js';

/** Campos del backend con otro nombre en el formulario. */
const CAMPOS_BACKEND = { productoId: 'producto' };

/** Producto enlazado a Formik. */
function CampoProducto() {
  const { t } = useTranslation();
  const [campo, meta, ayudante] = useField('producto');
  const conError = Boolean(meta.touched && meta.error);
  return (
    <BuscadorProducto id="producto" label={t('ajustes:campos.producto')} value={campo.value} soloActivos
      onChange={(p) => ayudante.setValue(p)} onBlur={() => ayudante.setTouched(true)}
      error={conError} helperText={conError ? meta.error : ' '} />
  );
}

/** Tipo de ajuste como grupo de opciones accesible. */
function CampoTipo() {
  const { t } = useTranslation();
  const [campo] = useField('tipo');
  return (
    <Box component="fieldset" sx={{ border: 0, p: 0, m: 0 }}>
      <Typography component="legend" variant="body2" color="text.secondary">{t('ajustes:campos.tipo')}</Typography>
      <RadioGroup row {...campo}>
        <FormControlLabel value="ENTRADA" control={<Radio />} label={t('ajustes:tipos.ENTRADA')} />
        <FormControlLabel value="SALIDA" control={<Radio />} label={t('ajustes:tipos.SALIDA')} />
      </RadioGroup>
    </Box>
  );
}

/**
 * Al elegir un producto para una entrada, sugiere su costo promedio vigente (03_inventario_y_costos.md, sección 2).
 * @param {{onCosto: (costo: string|null) => void}} props - Recibe el CPP del producto elegido.
 * @returns {null} Sin interfaz.
 */
function SugerirCosto({ onCosto }) {
  const { values, setFieldValue } = useFormikContext();
  const productoId = values.producto?.id;
  useEffect(() => {
    let vigente = true;
    if (!productoId) { onCosto(null); return undefined; }
    obtenerCosto(productoId).then((c) => {
      if (!vigente) return;
      onCosto(c.costoPromedio);
      if (Number(c.costoPromedio) > 0) setFieldValue('costoUnitario', String(Number(c.costoPromedio)), false);
    }).catch(() => vigente && onCosto(null));
    return () => { vigente = false; };
  }, [productoId, onCosto, setFieldValue]);
  return null;
}

/** Atajos de motivo; "Inventario inicial" además fija el tipo en entrada. */
function MotivosSugeridos() {
  const { t } = useTranslation();
  const { setFieldValue } = useFormikContext();
  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: -1 }} aria-label={t('ajustes:motivos.etiqueta')}
      role="group">
      {MOTIVOS_SUGERIDOS.map((clave) => (
        <Chip key={clave} size="small" variant="outlined" label={t(`ajustes:motivos.${clave}`)} onClick={() => {
          setFieldValue('motivo', t(`ajustes:motivos.${clave}`));
          if (clave === 'inicial') setFieldValue('tipo', 'ENTRADA');
          if (clave === 'danado' || clave === 'perdida') setFieldValue('tipo', 'SALIDA');
        }} />
      ))}
    </Stack>
  );
}

/** Vista previa del efecto: existencias actuales y resultantes. */
function Efecto() {
  const { t, i18n } = useTranslation();
  const { values } = useFormikContext();
  const { producto, tipo, cantidad } = values;
  const numero = Number(normalizarDecimal(cantidad));
  if (!producto || !(numero > 0)) return <FormHelperText>{t('ajustes:efecto.inmutable')}</FormHelperText>;
  const resultante = Number(producto.existencias) + (tipo === 'ENTRADA' ? numero : -numero);
  const unidad = t(`catalogo:unidades.${producto.unidadMedida}`);
  const idioma = i18n.resolvedLanguage;
  return (
    <Alert severity={resultante < 0 ? 'warning' : 'info'} data-testid="efecto-ajuste">
      {t('ajustes:efecto.existencias', {
        actuales: formatoCantidad(producto.existencias, idioma), resultantes: formatoCantidad(resultante, idioma), unidad,
      })}{' '}
      {t('ajustes:efecto.inmutable')}
    </Alert>
  );
}

/**
 * @param {{productoInicial?: object|null, onCerrar: () => void, onGuardado: (ajuste: object) => void}} props - Propiedades.
 * @returns {import('react').JSX.Element} Diálogo.
 */
export function DialogoAjuste({ productoInicial = null, onCerrar, onGuardado }) {
  const { t, i18n } = useTranslation();
  const [error, setError] = useState(null);
  const [costoVigente, setCostoVigente] = useState(null);
  const esquema = useMemo(() => crearEsquemaAjuste(t), [t, i18n.resolvedLanguage]); // eslint-disable-line react-hooks/exhaustive-deps
  const idioma = i18n.resolvedLanguage;

  const enviar = async (valores, { setErrors, setSubmitting }) => {
    setError(null);
    try {
      const guardado = await registrarAjuste({
        productoId: valores.producto.id,
        tipo: valores.tipo,
        cantidad: normalizarDecimal(valores.cantidad),
        costoUnitario: valores.tipo === 'ENTRADA' ? normalizarDecimal(valores.costoUnitario) : null,
        motivo: valores.motivo.trim(),
      });
      onGuardado(guardado);
    } catch (excepcion) {
      const problema = leerProblema(excepcion);
      const errores = Object.fromEntries(Object.entries(problema.errores).map(([c, m]) => [CAMPOS_BACKEND[c] ?? c, m]));
      if (Object.keys(errores).length > 0) setErrors(errores);
      else setError(problema.detalle ?? t('estado.error'));
      setSubmitting(false);
    }
  };

  const iniciales = { producto: productoInicial, tipo: 'ENTRADA', cantidad: '', costoUnitario: '', motivo: '' };

  return (
    <Dialog open onClose={onCerrar} fullWidth maxWidth="sm" aria-labelledby="dialogo-ajuste-titulo">
      <Formik initialValues={iniciales} validationSchema={esquema} onSubmit={enviar}>
        {({ isSubmitting, values }) => (
          <Form noValidate>
            <SugerirCosto onCosto={setCostoVigente} />
            <DialogTitle id="dialogo-ajuste-titulo">{t('ajustes:dialogo.titulo')}</DialogTitle>
            <DialogContent>
              <EnfocarPrimerError />
              <Stack spacing={2} sx={{ pt: 1 }}>
                {error && <Alert severity="error" role="alert">{error}</Alert>}
                <CampoProducto />
                <CampoTipo />
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: values.tipo === 'ENTRADA' ? '1fr 1fr' : '1fr' } }}>
                  <CampoTexto name="cantidad" label={t('ajustes:campos.cantidad')} autoComplete="off"
                    ayuda={values.producto && !values.producto.permiteFraccion ? t('ajustes:ayuda.entera') : undefined}
                    slotProps={{
                      htmlInput: { inputMode: 'decimal' },
                      input: values.producto ? {
                        endAdornment: <InputAdornment position="end">{t(`catalogo:unidades.${values.producto.unidadMedida}`)}</InputAdornment>,
                      } : undefined,
                    }} />
                  {values.tipo === 'ENTRADA' && (
                    <CampoDinero name="costoUnitario" label={t('ajustes:campos.costoUnitario')}
                      ayuda={costoVigente !== null ? t('ajustes:ayuda.costoVigente', { costo: formatoMoneda(costoVigente, idioma) }) : undefined} />
                  )}
                </Box>
                <CampoTexto name="motivo" label={t('ajustes:campos.motivo')} multiline minRows={2} autoComplete="off"
                  slotProps={{ htmlInput: { maxLength: 300 } }} />
                <MotivosSugeridos />
                <Efecto />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={onCerrar} disabled={isSubmitting}>{t('acciones.cancelar')}</Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>{t('ajustes:acciones.registrar')}</Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}
