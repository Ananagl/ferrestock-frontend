/**
 * Nombre:                 DialogoUsuario.jsx
 * Descripción:            Formulario en diálogo para crear o editar un usuario, con validación Yup y errores del backend por campo.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.3.0
 * @file
 */
import { useMemo, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from '@mui/material';
import { Form, Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { actualizarUsuario, crearUsuario } from '../servicios/usuariosServicio.js';
import { crearEsquemaUsuario } from '../validacion/esquemas.js';
import { CampoTexto } from '../../../compartido/componentes/formularios/CampoTexto.jsx';
import { CampoContrasena } from '../../../compartido/componentes/formularios/CampoContrasena.jsx';
import { CampoSeleccion } from '../../../compartido/componentes/formularios/CampoSeleccion.jsx';
import { EnfocarPrimerError } from '../../../compartido/componentes/formularios/EnfocarPrimerError.jsx';

/**
 * @param {{abierto: boolean, usuario: import('../servicios/usuariosServicio.js').Usuario|null, esPropio: boolean,
 *   onCerrar: () => void, onGuardado: (usuario: object, esNuevo: boolean) => void}} props - Propiedades.
 *   Si {@code usuario} es nulo, el diálogo crea uno nuevo.
 * @returns {import('react').JSX.Element} Diálogo.
 */
export function DialogoUsuario({ abierto, usuario, esPropio, onCerrar, onGuardado }) {
  const { t, i18n } = useTranslation();
  const esNuevo = !usuario;
  const [error, setError] = useState(null);
  const esquema = useMemo(() => crearEsquemaUsuario(t, esNuevo), [t, esNuevo, i18n.resolvedLanguage]); // eslint-disable-line react-hooks/exhaustive-deps
  const roles = [{ valor: 'OPERATIVO', texto: t('rol.OPERATIVO') }, { valor: 'ADMIN', texto: t('rol.ADMIN') }];

  const enviar = async (valores, { setErrors, setSubmitting }) => {
    setError(null);
    try {
      const guardado = esNuevo
        ? await crearUsuario({ ...valores, nombreUsuario: valores.nombreUsuario.trim() })
        : await actualizarUsuario(usuario.id, { nombreCompleto: valores.nombreCompleto, rol: valores.rol });
      onGuardado(guardado, esNuevo);
    } catch (excepcion) {
      const problema = leerProblema(excepcion);
      if (problema.codigo === 'DUPLICADO') {
        setErrors({ nombreUsuario: t('usuarios:errores.duplicado') });
      } else if (Object.keys(problema.errores).length > 0) {
        setErrors(problema.errores);
      } else {
        setError(problema.detalle ?? t('estado.error'));
      }
      setSubmitting(false);
    }
  };

  const iniciales = esNuevo
    ? { nombreUsuario: '', nombreCompleto: '', rol: 'OPERATIVO', contrasenaTemporal: '' }
    : { nombreCompleto: usuario.nombreCompleto, rol: usuario.rol };

  return (
    <Dialog open={abierto} onClose={onCerrar} fullWidth maxWidth="sm" aria-labelledby="dialogo-usuario-titulo">
      <Formik initialValues={iniciales} validationSchema={esquema} onSubmit={enviar} enableReinitialize>
        {({ isSubmitting }) => (
          <Form noValidate>
            <DialogTitle id="dialogo-usuario-titulo">
              {esNuevo ? t('usuarios:dialogo.tituloNuevo') : t('usuarios:dialogo.tituloEditar', { usuario: usuario.nombreUsuario })}
            </DialogTitle>
            <DialogContent>
              <EnfocarPrimerError />
              <Stack spacing={2} sx={{ pt: 1 }}>
                {error && <Alert severity="error" role="alert">{error}</Alert>}
                {esNuevo && (
                  <CampoTexto name="nombreUsuario" label={t('usuarios:campos.nombreUsuario')} autoComplete="off"
                    ayuda={t('usuarios:ayuda.nombreUsuario')} autoFocus />
                )}
                <CampoTexto name="nombreCompleto" label={t('usuarios:campos.nombreCompleto')} autoComplete="off"
                  autoFocus={!esNuevo} />
                <CampoSeleccion name="rol" label={t('usuarios:campos.rol')} opciones={roles} disabled={esPropio}
                  ayuda={esPropio ? t('usuarios:ayuda.rolPropio') : t('usuarios:ayuda.rol')} />
                {esNuevo && (
                  <CampoContrasena name="contrasenaTemporal" label={t('usuarios:campos.contrasenaTemporal')}
                    autoComplete="new-password" ayuda={t('usuarios:ayuda.contrasenaTemporal')} />
                )}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={onCerrar} disabled={isSubmitting}>{t('acciones.cancelar')}</Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>{t('acciones.guardar')}</Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}
