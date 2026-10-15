/**
 * Nombre:                 DialogoPrecio.jsx
 * Descripción:            Diálogo para cambiar el precio de venta de un producto; el cambio queda auditado (RF-PRE-001, RF-PRE-002).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.4.0
 * @file
 */
import { useMemo, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack } from '@mui/material';
import { Form, Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { formatoMoneda, normalizarDecimal } from '../../../compartido/utilidades/formato.js';
import { cambiarPrecio } from '../servicios/catalogoServicio.js';
import { crearEsquemaPrecio } from '../validacion/esquemas.js';
import { CampoDinero } from '../../../compartido/componentes/formularios/CampoDinero.jsx';
import { EnfocarPrimerError } from '../../../compartido/componentes/formularios/EnfocarPrimerError.jsx';

/**
 * @param {{producto: import('../servicios/catalogoServicio.js').Producto, onCerrar: () => void,
 *   onGuardado: (producto: object) => void}} props - Producto a modificar.
 * @returns {import('react').JSX.Element} Diálogo.
 */
export function DialogoPrecio({ producto, onCerrar, onGuardado }) {
  const { t, i18n } = useTranslation();
  const [error, setError] = useState(null);
  const esquema = useMemo(() => crearEsquemaPrecio(t), [t, i18n.resolvedLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  const enviar = async (valores, { setErrors, setSubmitting }) => {
    setError(null);
    try {
      onGuardado(await cambiarPrecio(producto.id, normalizarDecimal(valores.precioVenta)));
    } catch (excepcion) {
      const problema = leerProblema(excepcion);
      if (Object.keys(problema.errores).length > 0) setErrors(problema.errores);
      else setError(problema.detalle ?? t('estado.error'));
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onClose={onCerrar} fullWidth maxWidth="xs" aria-labelledby="precio-titulo" aria-describedby="precio-descripcion">
      <Formik initialValues={{ precioVenta: '' }} validationSchema={esquema} onSubmit={enviar}>
        {({ isSubmitting }) => (
          <Form noValidate>
            <DialogTitle id="precio-titulo">{t('catalogo:precio.titulo', { codigo: producto.codigo })}</DialogTitle>
            <DialogContent>
              <EnfocarPrimerError />
              <Stack spacing={2}>
                <DialogContentText id="precio-descripcion">
                  {t('catalogo:precio.actual', { precio: formatoMoneda(producto.precioVenta, i18n.resolvedLanguage) })}
                  {' '}{t('catalogo:precio.nota')}
                </DialogContentText>
                {error && <Alert severity="error" role="alert">{error}</Alert>}
                <CampoDinero name="precioVenta" label={t('catalogo:precio.nuevo')} autoFocus />
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
