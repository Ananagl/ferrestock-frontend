/**
 * Nombre:                 PaginaCambioContrasena.jsx
 * Descripción:            Pantalla de cambio de contraseña, obligatoria tras recibir una contraseña temporal (RF-AUT-007).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
 * @file
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Paper, Stack, Typography } from '@mui/material';
import { Form, Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { useSesion } from '../../../app/proveedores/ProveedorSesion.jsx';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { cambiarContrasena } from '../servicios/autenticacionServicio.js';
import { crearEsquemaCambioContrasena } from '../validacion/esquemas.js';
import { CampoContrasena } from '../../../compartido/componentes/formularios/CampoContrasena.jsx';
import { EnfocarPrimerError } from '../../../compartido/componentes/formularios/EnfocarPrimerError.jsx';

/**
 * Página de cambio de contraseña.
 * @returns {import('react').JSX.Element} Formulario.
 */
export default function PaginaCambioContrasena() {
  const { t, i18n } = useTranslation();
  const { usuario, refrescar } = useSesion();
  const navegar = useNavigate();
  const [error, setError] = useState(null);
  const esquema = useMemo(() => crearEsquemaCambioContrasena(t), [t, i18n.resolvedLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  const enviar = async (valores, { setErrors, setSubmitting }) => {
    setError(null);
    try {
      await cambiarContrasena(valores);
      await refrescar();
      navegar('/', { replace: true, state: { aviso: 'auth:cambio.exito' } });
    } catch (excepcion) {
      const problema = leerProblema(excepcion);
      if (Object.keys(problema.errores).length > 0) {
        setErrors(problema.errores);
      } else {
        setError(problema.detalle ?? t('auth:errores.inesperado'));
      }
      setSubmitting(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 4 }, maxWidth: 520 }}>
      <Typography variant="h1" gutterBottom sx={{ fontSize: '1.75rem' }}>{t('auth:cambio.titulo')}</Typography>
      {usuario.debeCambiarPassword && (
        <Alert severity="info" sx={{ mb: 2 }}>{t('auth:cambio.obligatorio')}</Alert>
      )}
      {error && <Alert severity="error" role="alert" sx={{ mb: 2 }}>{error}</Alert>}
      <Formik initialValues={{ actual: '', nueva: '', confirmacion: '' }} validationSchema={esquema} onSubmit={enviar}>
        {({ isSubmitting }) => (
          <Form noValidate>
            <EnfocarPrimerError />
            <Stack spacing={2}>
              <CampoContrasena name="actual" label={t('auth:cambio.actual')} autoComplete="current-password" />
              <CampoContrasena name="nueva" label={t('auth:cambio.nueva')} autoComplete="new-password"
                ayuda={t('auth:cambio.politica')} />
              <CampoContrasena name="confirmacion" label={t('auth:cambio.confirmacion')} autoComplete="new-password" />
              <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ alignSelf: 'flex-start' }}>
                {t('auth:cambio.boton')}
              </Button>
            </Stack>
          </Form>
        )}
      </Formik>
    </Paper>
  );
}
