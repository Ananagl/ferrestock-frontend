/**
 * Nombre:                 DialogoProducto.jsx
 * Descripción:            Formulario en diálogo para registrar o editar un producto, con categorías activas, aviso de versión desactualizada y errores del backend por campo.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.4.0
 * @file
 */
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from '@mui/material';
import { Form, Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { normalizarDecimal } from '../../../compartido/utilidades/formato.js';
import { actualizarProducto, crearProducto, listarCategorias, UNIDADES } from '../servicios/catalogoServicio.js';
import { crearEsquemaProducto } from '../validacion/esquemas.js';
import { CampoTexto } from '../../../compartido/componentes/formularios/CampoTexto.jsx';
import { CampoSeleccion } from '../../../compartido/componentes/formularios/CampoSeleccion.jsx';
import { CampoDinero } from '../../../compartido/componentes/formularios/CampoDinero.jsx';
import { CampoCasilla } from '../../../compartido/componentes/formularios/CampoCasilla.jsx';
import { EnfocarPrimerError } from '../../../compartido/componentes/formularios/EnfocarPrimerError.jsx';

/** Errores del backend que se muestran junto a un campo. */
const ERRORES_POR_CAMPO = { DUPLICADO: 'codigo', CATEGORIA_INACTIVA: 'categoriaId' };

/**
 * @param {{producto: import('../servicios/catalogoServicio.js').Producto|null, onCerrar: () => void,
 *   onGuardado: (producto: object, esNuevo: boolean) => void, onDesactualizado: () => void}} props - Si
 *   {@code producto} es nulo se registra uno nuevo.
 * @returns {import('react').JSX.Element} Diálogo.
 */
export function DialogoProducto({ producto, onCerrar, onGuardado, onDesactualizado }) {
  const { t, i18n } = useTranslation();
  const esNuevo = !producto;
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState(null);
  const [desactualizado, setDesactualizado] = useState(false);
  const esquema = useMemo(() => crearEsquemaProducto(t, esNuevo), [t, esNuevo, i18n.resolvedLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let vigente = true;
    listarCategorias(true)
      .then((activas) => {
        if (!vigente) return;
        // Al editar, la categoría actual se muestra aunque esté inactiva, para no cambiarla sin querer
        const actual = producto?.categoria;
        setCategorias(actual && !activas.some((c) => c.id === actual.id) ? [...activas, actual] : activas);
      })
      .catch(() => vigente && setError(t('estado.error')));
    return () => { vigente = false; };
  }, [producto, t]);

  const opcionesCategoria = categorias.map((c) => ({
    valor: c.id, texto: c.activa === false ? `${c.nombre} (${t('catalogo:estado.inactiva')})` : c.nombre,
  }));
  const opcionesUnidad = UNIDADES.map((u) => ({ valor: u, texto: t(`catalogo:unidades.${u}`) }));

  const enviar = async (valores, { setErrors, setSubmitting }) => {
    setError(null);
    try {
      const comunes = {
        nombre: valores.nombre.trim(), descripcion: valores.descripcion?.trim() || null, categoriaId: valores.categoriaId,
        unidadMedida: valores.unidadMedida, permiteFraccion: valores.permiteFraccion,
      };
      const guardado = esNuevo
        ? await crearProducto({ ...comunes, codigo: valores.codigo.trim(), precioVenta: normalizarDecimal(valores.precioVenta) })
        : await actualizarProducto(producto.id, { ...comunes, version: producto.version });
      onGuardado(guardado, esNuevo);
    } catch (excepcion) {
      const problema = leerProblema(excepcion);
      if (problema.codigo === 'VERSION_DESACTUALIZADA') {
        setDesactualizado(true);
      } else if (Object.keys(problema.errores).length > 0) {
        setErrors(problema.errores);
      } else if (ERRORES_POR_CAMPO[problema.codigo]) {
        setErrors({ [ERRORES_POR_CAMPO[problema.codigo]]: problema.detalle });
      } else {
        setError(problema.detalle ?? t('estado.error'));
      }
      setSubmitting(false);
    }
  };

  const iniciales = esNuevo
    ? { codigo: '', nombre: '', descripcion: '', categoriaId: '', unidadMedida: 'UNIDAD', permiteFraccion: false, precioVenta: '' }
    : {
      nombre: producto.nombre, descripcion: producto.descripcion ?? '', categoriaId: producto.categoria.id,
      unidadMedida: producto.unidadMedida, permiteFraccion: producto.permiteFraccion,
    };

  return (
    <Dialog open onClose={onCerrar} fullWidth maxWidth="sm" aria-labelledby="dialogo-producto-titulo">
      <Formik initialValues={iniciales} validationSchema={esquema} onSubmit={enviar}>
        {({ isSubmitting }) => (
          <Form noValidate>
            <DialogTitle id="dialogo-producto-titulo">
              {esNuevo ? t('catalogo:productos.dialogo.tituloNuevo')
                : t('catalogo:productos.dialogo.tituloEditar', { codigo: producto.codigo })}
            </DialogTitle>
            <DialogContent>
              <EnfocarPrimerError />
              <Stack spacing={2} sx={{ pt: 1 }}>
                {desactualizado && (
                  <Alert severity="warning" role="alert"
                    action={<Button color="inherit" size="small" onClick={onDesactualizado}>{t('catalogo:acciones.recargar')}</Button>}>
                    {t('catalogo:errores.version')}
                  </Alert>
                )}
                {error && <Alert severity="error" role="alert">{error}</Alert>}
                {esNuevo && (
                  <CampoTexto name="codigo" label={t('catalogo:campos.codigo')} ayuda={t('catalogo:ayuda.codigo')}
                    autoComplete="off" autoFocus />
                )}
                <CampoTexto name="nombre" label={t('catalogo:campos.nombre')} autoComplete="off" autoFocus={!esNuevo} />
                <CampoTexto name="descripcion" label={t('catalogo:campos.descripcion')} multiline minRows={2} />
                <CampoSeleccion name="categoriaId" label={t('catalogo:campos.categoria')} opciones={opcionesCategoria} />
                <CampoSeleccion name="unidadMedida" label={t('catalogo:campos.unidad')} opciones={opcionesUnidad} />
                <CampoCasilla name="permiteFraccion" label={t('catalogo:campos.permiteFraccion')}
                  ayuda={t('catalogo:ayuda.permiteFraccion')} />
                {esNuevo && <CampoDinero name="precioVenta" label={t('catalogo:campos.precioVenta')} />}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={onCerrar} disabled={isSubmitting}>{t('acciones.cancelar')}</Button>
              <Button type="submit" variant="contained" disabled={isSubmitting || desactualizado}>{t('acciones.guardar')}</Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
}
