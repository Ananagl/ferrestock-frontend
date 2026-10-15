/**
 * Nombre:                 DialogoAnulacion.jsx
 * Descripción:            Diálogo para anular una compra o una venta con motivo obligatorio (DP-07); muestra el error del backend si la anulación está bloqueada.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.8.0
 * @file
 */
import { useMemo, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack } from '@mui/material';
import { Form, Formik } from 'formik';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { CampoTexto } from '../formularios/CampoTexto.jsx';

/**
 * @param {{titulo: string, mensaje: string, onAnular: (motivo: string) => Promise<void>, onCerrar: () => void}} props - Propiedades.
 * @returns {import('react').JSX.Element} Diálogo.
 */
export function DialogoAnulacion({ titulo, mensaje, onAnular, onCerrar }) {
  const { t, i18n } = useTranslation();
  const [error, setError] = useState(null);
  const esquema = useMemo(() => yup.object({
    motivo: yup.string().trim().required(t('validacion:obligatorio'))
      .min(5, t('validacion:longitud', { min: 5, max: 300 })).max(300, t('validacion:longitud', { min: 5, max: 300 })),
  }), [t, i18n.resolvedLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  const enviar = async ({ motivo }, { setSubmitting }) => {
    setError(null);
    try {
      await onAnular(motivo.trim());
    } catch (excepcion) {
      setError(leerProblema(excepcion).detalle ?? t('estado.error'));
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onClose={onCerrar} fullWidth maxWidth="sm" aria-labelledby="anulacion-titulo">
      <Formik initialValues={{ motivo: '' }} validationSchema={esquema} onSubmit={enviar}>
        {({ isSubmitting }) => (
          <Form noValidate>
            <DialogTitle id="anulacion-titulo">{titulo}</DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <DialogContentText>{mensaje}</DialogContentText>
                {error && <Alert severity="error" role="alert">{error}</Alert>}
                <CampoTexto name="motivo" label={t('documentos:anulacion.motivo')} multiline minRows={2} autoFocus
                  slotProps={{ htmlInput: { maxLength: 300 } }} />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={onCerrar} disabled={isSubmitting}>{t('acciones.cancelar')}</Button>
              <Button type="submit" color="error" variant="contained" disabled={isSubmitting}>{t('documentos:anulacion.confirmar')}</Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}
