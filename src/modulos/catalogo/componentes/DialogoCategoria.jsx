/**
 * Nombre:                 DialogoCategoria.jsx
 * Descripción:            Diálogo para crear o renombrar una categoría (solo ADMIN, RF-PRO-009).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.4.0
 * @file
 */
import { useMemo, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from '@mui/material';
import { Form, Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { crearCategoria, renombrarCategoria } from '../servicios/catalogoServicio.js';
import { crearEsquemaCategoria } from '../validacion/esquemas.js';
import { CampoTexto } from '../../../compartido/componentes/formularios/CampoTexto.jsx';
import { EnfocarPrimerError } from '../../../compartido/componentes/formularios/EnfocarPrimerError.jsx';

/**
 * @param {{categoria: import('../servicios/catalogoServicio.js').Categoria|null, onCerrar: () => void,
 *   onGuardada: (categoria: object, esNueva: boolean) => void}} props - Nula para crear una nueva.
 * @returns {import('react').JSX.Element} Diálogo.
 */
export function DialogoCategoria({ categoria, onCerrar, onGuardada }) {
  const { t, i18n } = useTranslation();
  const esNueva = !categoria;
  const [error, setError] = useState(null);
  const esquema = useMemo(() => crearEsquemaCategoria(t), [t, i18n.resolvedLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  const enviar = async ({ nombre }, { setErrors, setSubmitting }) => {
    setError(null);
    try {
      const guardada = esNueva ? await crearCategoria(nombre.trim()) : await renombrarCategoria(categoria.id, nombre.trim());
      onGuardada(guardada, esNueva);
    } catch (excepcion) {
      const problema = leerProblema(excepcion);
      if (problema.codigo === 'DUPLICADO') setErrors({ nombre: t('catalogo:errores.categoriaDuplicada') });
      else if (Object.keys(problema.errores).length > 0) setErrors(problema.errores);
      else setError(problema.detalle ?? t('estado.error'));
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onClose={onCerrar} fullWidth maxWidth="xs" aria-labelledby="categoria-titulo">
      <Formik initialValues={{ nombre: categoria?.nombre ?? '' }} validationSchema={esquema} onSubmit={enviar}>
        {({ isSubmitting }) => (
          <Form noValidate>
            <DialogTitle id="categoria-titulo">
              {esNueva ? t('catalogo:categorias.tituloNueva') : t('catalogo:categorias.tituloEditar')}
            </DialogTitle>
            <DialogContent>
              <EnfocarPrimerError />
              <Stack spacing={2} sx={{ pt: 1 }}>
                {error && <Alert severity="error" role="alert">{error}</Alert>}
                <CampoTexto name="nombre" label={t('catalogo:campos.nombre')} autoFocus autoComplete="off" />
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
