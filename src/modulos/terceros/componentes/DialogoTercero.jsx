/**
 * Nombre:                 DialogoTercero.jsx
 * Descripción:            Formulario en diálogo para registrar o editar un cliente o proveedor; el documento depende del tipo de persona y no se edita después del alta.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.5.0
 * @file
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormGroup, FormHelperText, Stack, Typography,
} from '@mui/material';
import { Form, Formik, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { formatoDocumento } from '../../../compartido/utilidades/nit.js';
import { actualizarTercero, crearTercero } from '../servicios/tercerosServicio.js';
import { crearEsquemaTercero } from '../validacion/esquemas.js';
import { CampoTexto } from '../../../compartido/componentes/formularios/CampoTexto.jsx';
import { CampoSeleccion } from '../../../compartido/componentes/formularios/CampoSeleccion.jsx';
import { CampoCasilla } from '../../../compartido/componentes/formularios/CampoCasilla.jsx';
import { EnfocarPrimerError } from '../../../compartido/componentes/formularios/EnfocarPrimerError.jsx';

/** Códigos del backend que se muestran junto a un campo. */
const ERRORES_POR_CAMPO = {
  DUPLICADO: 'numeroDocumento', PERSONA_DOCUMENTO_INCOMPATIBLE: 'tipoDocumento',
  DIGITO_VERIFICACION_INVALIDO: 'digitoVerificacion', ROL_TERCERO_REQUERIDO: 'esCliente',
};

/** Una persona jurídica solo puede tener NIT: al elegirla, el tipo de documento pasa a NIT. */
function SincronizarDocumento() {
  const { values, setFieldValue } = useFormikContext();
  useEffect(() => {
    if (values.tipoPersona === 'JURIDICA' && values.tipoDocumento !== 'NIT') setFieldValue('tipoDocumento', 'NIT');
  }, [values.tipoPersona, values.tipoDocumento, setFieldValue]);
  return null;
}

/** Grupo accesible de casillas de rol con su error. */
function CamposRol() {
  const { t } = useTranslation();
  const { errors, touched } = useFormikContext();
  const error = touched.esCliente && errors.esCliente;
  return (
    <Box component="fieldset" sx={{ border: 0, p: 0, m: 0 }} aria-describedby={error ? 'roles-error' : undefined}>
      <Typography component="legend" variant="body2" color="text.secondary">{t('terceros:campos.roles')}</Typography>
      <FormGroup row>
        <CampoCasilla name="esCliente" label={t('terceros:roles.cliente')} />
        <CampoCasilla name="esProveedor" label={t('terceros:roles.proveedor')} />
      </FormGroup>
      {error && <FormHelperText id="roles-error" error role="alert">{error}</FormHelperText>}
    </Box>
  );
}

/**
 * @param {{tercero: import('../servicios/tercerosServicio.js').Tercero|null, onCerrar: () => void,
 *   onGuardado: (tercero: object, esNuevo: boolean) => void}} props - Nulo para registrar uno nuevo.
 * @returns {import('react').JSX.Element} Diálogo.
 */
export function DialogoTercero({ tercero, onCerrar, onGuardado }) {
  const { t, i18n } = useTranslation();
  const esNuevo = !tercero;
  const [error, setError] = useState(null);
  const esquema = useMemo(() => crearEsquemaTercero(t, esNuevo), [t, esNuevo, i18n.resolvedLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  const enviar = async (valores, { setErrors, setSubmitting }) => {
    setError(null);
    const contacto = {
      nombre: valores.nombre.trim(), telefono: valores.telefono?.trim() || null, correo: valores.correo?.trim() || null,
      direccion: valores.direccion?.trim() || null, esCliente: valores.esCliente, esProveedor: valores.esProveedor,
    };
    try {
      const guardado = esNuevo
        ? await crearTercero({
          ...contacto, tipoPersona: valores.tipoPersona, tipoDocumento: valores.tipoDocumento,
          numeroDocumento: valores.numeroDocumento.trim(),
          digitoVerificacion: valores.tipoDocumento === 'NIT' ? valores.digitoVerificacion.trim() : null,
        })
        : await actualizarTercero(tercero.id, contacto);
      onGuardado(guardado, esNuevo);
    } catch (excepcion) {
      const problema = leerProblema(excepcion);
      if (Object.keys(problema.errores).length > 0) setErrors(problema.errores);
      else if (ERRORES_POR_CAMPO[problema.codigo]) setErrors({ [ERRORES_POR_CAMPO[problema.codigo]]: problema.detalle });
      else setError(problema.detalle ?? t('estado.error'));
      setSubmitting(false);
    }
  };

  const iniciales = esNuevo
    ? { tipoPersona: 'NATURAL', tipoDocumento: 'CC', numeroDocumento: '', digitoVerificacion: '', nombre: '', telefono: '',
      correo: '', direccion: '', esCliente: true, esProveedor: false }
    : { nombre: tercero.nombre, telefono: tercero.telefono ?? '', correo: tercero.correo ?? '', direccion: tercero.direccion ?? '',
      esCliente: tercero.esCliente, esProveedor: tercero.esProveedor };

  return (
    <Dialog open onClose={onCerrar} fullWidth maxWidth="sm" aria-labelledby="dialogo-tercero-titulo">
      <Formik initialValues={iniciales} validationSchema={esquema} onSubmit={enviar}>
        {({ isSubmitting, values }) => {
          const juridica = values.tipoPersona === 'JURIDICA';
          const documentos = (juridica ? ['NIT'] : ['CC', 'CE', 'NIT'])
            .map((d) => ({ valor: d, texto: t(`terceros:documentos.${d}`) }));
          return (
            <Form noValidate>
              {esNuevo && <SincronizarDocumento />}
              <DialogTitle id="dialogo-tercero-titulo">
                {esNuevo ? t('terceros:dialogo.tituloNuevo') : t('terceros:dialogo.tituloEditar', { nombre: tercero.nombre })}
              </DialogTitle>
              <DialogContent>
                <EnfocarPrimerError />
                <Stack spacing={2} sx={{ pt: 1 }}>
                  {error && <Alert severity="error" role="alert">{error}</Alert>}
                  {esNuevo ? (
                    <>
                      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                        <CampoSeleccion name="tipoPersona" label={t('terceros:campos.tipoPersona')} opciones={[
                          { valor: 'NATURAL', texto: t('terceros:personas.NATURAL') },
                          { valor: 'JURIDICA', texto: t('terceros:personas.JURIDICA') },
                        ]} />
                        <CampoSeleccion name="tipoDocumento" label={t('terceros:campos.tipoDocumento')} opciones={documentos}
                          ayuda={juridica ? t('terceros:ayuda.juridica') : undefined} />
                      </Box>
                      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: values.tipoDocumento === 'NIT' ? '1fr 6rem' : '1fr' }}>
                        <CampoTexto name="numeroDocumento" label={t('terceros:campos.numeroDocumento')}
                          ayuda={t('terceros:ayuda.numero')} autoComplete="off" slotProps={{ htmlInput: { inputMode: 'numeric' } }} />
                        {values.tipoDocumento === 'NIT' && (
                          <CampoTexto name="digitoVerificacion" label={t('terceros:campos.dv')} autoComplete="off"
                            slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 1 } }} />
                        )}
                      </Box>
                    </>
                  ) : (
                    <Typography>
                      <Box component="span" sx={{ color: 'text.secondary' }}>{t('terceros:campos.documento')}: </Box>
                      {formatoDocumento(tercero)} · {t(`terceros:personas.${tercero.tipoPersona}`)}
                    </Typography>
                  )}
                  <CampoTexto name="nombre" autoComplete="off"
                    label={(esNuevo ? juridica : tercero.tipoPersona === 'JURIDICA') ? t('terceros:campos.razonSocial') : t('terceros:campos.nombreCompleto')} />
                  <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
                    <CampoTexto name="telefono" label={t('terceros:campos.telefono')} autoComplete="off"
                      slotProps={{ htmlInput: { inputMode: 'tel' } }} />
                    <CampoTexto name="correo" label={t('terceros:campos.correo')} autoComplete="off" type="email" />
                  </Box>
                  <CampoTexto name="direccion" label={t('terceros:campos.direccion')} autoComplete="off" />
                  <CamposRol />
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={onCerrar} disabled={isSubmitting}>{t('acciones.cancelar')}</Button>
                <Button type="submit" variant="contained" disabled={isSubmitting}>{t('acciones.guardar')}</Button>
              </DialogActions>
            </Form>
          );
        }}
      </Formik>
    </Dialog>
  );
}
