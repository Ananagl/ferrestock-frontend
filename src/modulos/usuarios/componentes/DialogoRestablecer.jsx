/**
 * Nombre:                 DialogoRestablecer.jsx
 * Descripción:            Diálogo para asignar una contraseña temporal a otro usuario (desbloquea la cuenta y cierra sus sesiones).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.3.0
 * @file
 */
import { useMemo, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack } from '@mui/material';
import { Form, Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { restablecerContrasena } from '../servicios/usuariosServicio.js';
import { crearEsquemaRestablecer } from '../validacion/esquemas.js';
import { CampoContrasena } from '../../../compartido/componentes/formularios/CampoContrasena.jsx';
import { EnfocarPrimerError } from '../../../compartido/componentes/formularios/EnfocarPrimerError.jsx';

/**
 * @param {{usuario: import('../servicios/usuariosServicio.js').Usuario|null, onCerrar: () => void,
 *   onHecho: () => void}} props - Usuario a restablecer (nulo = cerrado).
 * @returns {import('react').JSX.Element} Diálogo.
 */
export function DialogoRestablecer({ usuario, onCerrar, onHecho }) {
  const { t, i18n } = useTranslation();
  const [error, setError] = useState(null);
  const esquema = useMemo(() => crearEsquemaRestablecer(t), [t, i18n.resolvedLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  const enviar = async (valores, { setErrors, setSubmitting }) => {
    setError(null);
    try {
      await restablecerContrasena(usuario.id, valores.contrasenaTemporal);
      onHecho();
    } catch (excepcion) {
      const problema = leerProblema(excepcion);
      if (Object.keys(problema.errores).length > 0) setErrors(problema.errores);
      else setError(problema.detalle ?? t('estado.error'));
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={Boolean(usuario)} onClose={onCerrar} fullWidth maxWidth="xs" aria-labelledby="restablecer-titulo"
      aria-describedby="restablecer-descripcion">
      <Formik initialValues={{ contrasenaTemporal: '' }} validationSchema={esquema} onSubmit={enviar}>
        {({ isSubmitting }) => (
          <Form noValidate>
            <DialogTitle id="restablecer-titulo">{t('usuarios:restablecer.titulo')}</DialogTitle>
            <DialogContent>
              <EnfocarPrimerError />
              <Stack spacing={2}>
                <DialogContentText id="restablecer-descripcion">
                  {t('usuarios:restablecer.descripcion', { usuario: usuario?.nombreUsuario })}
                </DialogContentText>
                {error && <Alert severity="error" role="alert">{error}</Alert>}
                <CampoContrasena name="contrasenaTemporal" label={t('usuarios:campos.contrasenaTemporal')}
                  autoComplete="new-password" ayuda={t('usuarios:ayuda.contrasenaTemporal')} />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={onCerrar} disabled={isSubmitting}>{t('acciones.cancelar')}</Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>{t('usuarios:restablecer.boton')}</Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}
