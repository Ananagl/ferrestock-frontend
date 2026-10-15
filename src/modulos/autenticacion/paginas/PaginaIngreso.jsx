/**
 * Nombre:                 PaginaIngreso.jsx
 * Descripción:            Pantalla de inicio de sesión con Recordarme, validación con Formik y Yup, mensajes genéricos de error y selector de idioma (CU-01).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
 * @file
 */
import { useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert, Box, Button, Card, CardContent, Checkbox, FormControlLabel, Stack, Typography,
} from '@mui/material';
import { Form, Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { useSesion } from '../../../app/proveedores/ProveedorSesion.jsx';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { crearEsquemaIngreso } from '../validacion/esquemas.js';
import { CampoTexto } from '../../../compartido/componentes/formularios/CampoTexto.jsx';
import { CampoContrasena } from '../../../compartido/componentes/formularios/CampoContrasena.jsx';
import { EnfocarPrimerError } from '../../../compartido/componentes/formularios/EnfocarPrimerError.jsx';
import { SelectorIdioma } from '../../../compartido/componentes/diseno/SelectorIdioma.jsx';
import { BotonTema } from '../../../compartido/componentes/diseno/BotonTema.jsx';
import { Cargando } from '../../../compartido/componentes/retroalimentacion/Cargando.jsx';

/**
 * Devuelve una ruta interna segura a la que volver tras ingresar (evita redirecciones a otros sitios).
 * @param {string|null} volver - Valor del parámetro "volver".
 * @returns {string} Ruta interna.
 */
function rutaSegura(volver) {
  return volver && volver.startsWith('/') && !volver.startsWith('//') ? volver : '/';
}

/**
 * Página de ingreso.
 * @returns {import('react').JSX.Element} Formulario de inicio de sesión.
 */
export default function PaginaIngreso() {
  const { t, i18n } = useTranslation();
  const { estado, iniciarSesion } = useSesion();
  const navegar = useNavigate();
  const [parametros] = useSearchParams();
  const [error, setError] = useState(null);
  const aviso = useRef(null);
  const esquema = useMemo(() => crearEsquemaIngreso(t), [t, i18n.resolvedLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  if (estado === 'cargando') return <Cargando />;
  if (estado === 'autenticado') return <Navigate to={rutaSegura(parametros.get('volver'))} replace />;

  const enviar = async (valores, { setSubmitting, setFieldValue, setFieldTouched, setErrors }) => {
    setError(null);
    try {
      const sesion = await iniciarSesion({ ...valores, usuario: valores.usuario.trim() });
      navegar(sesion.debeCambiarPassword ? '/cambiar-contrasena' : rutaSegura(parametros.get('volver')),
        { replace: true });
    } catch (excepcion) {
      const problema = leerProblema(excepcion);
      if (problema.estado === 400 && Object.keys(problema.errores).length > 0) {
        setErrors(problema.errores);
      } else {
        const claves = { 401: 'auth:errores.credenciales', 423: 'auth:errores.bloqueada', 0: 'auth:errores.sinConexion' };
        setError(t(claves[problema.estado] ?? 'auth:errores.inesperado'));
        setFieldValue('contrasena', '', false);
        setFieldTouched('contrasena', false, false);
        requestAnimationFrame(() => aviso.current?.focus());
      }
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Box component="header" sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, p: 2 }}>
        <SelectorIdioma />
        <BotonTema />
      </Box>
      <Box component="main" sx={{ flexGrow: 1, display: 'grid', placeItems: 'center', px: 2, pb: 6 }}>
        <Card variant="outlined" sx={{ width: '100%', maxWidth: 420 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography component="p" variant="h5" color="primary" sx={{ fontWeight: 700 }}>
              {t('app.nombre')}
            </Typography>
            <Typography variant="h1" sx={{ fontSize: '1.5rem', mt: 1, mb: 3 }}>{t('auth:ingreso.titulo')}</Typography>

            {error && (
              <Alert severity="error" role="alert" ref={aviso} tabIndex={-1} sx={{ mb: 2 }}>{error}</Alert>
            )}

            <Formik
              initialValues={{ usuario: '', contrasena: '', recordarme: false }}
              validationSchema={esquema}
              onSubmit={enviar}
            >
              {({ isSubmitting, values, handleChange }) => (
                <Form noValidate aria-describedby={error ? undefined : 'ayuda-ingreso'}>
                  <EnfocarPrimerError />
                  <Stack spacing={2}>
                    <CampoTexto name="usuario" label={t('auth:ingreso.usuario')} autoComplete="username"
                      autoFocus required />
                    <CampoContrasena name="contrasena" label={t('auth:ingreso.contrasena')}
                      autoComplete="current-password" />
                    <FormControlLabel
                      control={<Checkbox id="recordarme" name="recordarme" checked={values.recordarme}
                        onChange={handleChange} />}
                      label={t('auth:ingreso.recordarme')}
                    />
                    <Typography id="ayuda-ingreso" variant="body2" color="text.secondary">
                      {t('auth:ingreso.ayudaRecordarme')}
                    </Typography>
                    <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                      {isSubmitting ? t('auth:ingreso.ingresando') : t('auth:ingreso.boton')}
                    </Button>
                  </Stack>
                </Form>
              )}
            </Formik>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
