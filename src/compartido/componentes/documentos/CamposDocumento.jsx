/**
 * Nombre:                 CamposDocumento.jsx
 * Descripción:            Campos de Formik para documentos: tercero y producto con búsqueda en el servidor.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.8.0
 * @file
 */
import { useField } from 'formik';
import { BuscadorTercero } from '../../../modulos/terceros/componentes/BuscadorTercero.jsx';
import { BuscadorProducto } from '../../../modulos/catalogo/componentes/BuscadorProducto.jsx';

/**
 * @param {{name: string, label: string, rol: 'CLIENTE'|'PROVEEDOR', disabled?: boolean}} props - Propiedades.
 * @returns {import('react').JSX.Element} Tercero enlazado a Formik.
 */
export function CampoTercero({ name, label, rol, disabled }) {
  const [campo, meta, ayudante] = useField(name);
  const conError = Boolean(meta.touched && meta.error);
  return (
    <BuscadorTercero id={name} label={label} rol={rol} value={campo.value} disabled={disabled}
      onChange={(x) => ayudante.setValue(x)} onBlur={() => ayudante.setTouched(true)}
      error={conError} helperText={conError ? meta.error : ' '} />
  );
}

/**
 * @param {{name: string, label: string, soloActivos?: boolean, onElegir?: (producto: object|null) => void,
 *   disabled?: boolean}} props - Propiedades.
 * @returns {import('react').JSX.Element} Producto enlazado a Formik.
 */
export function CampoProducto({ name, label, soloActivos = true, onElegir, disabled }) {
  const [campo, meta, ayudante] = useField(name);
  const conError = Boolean(meta.touched && meta.error);
  return (
    <BuscadorProducto id={name} label={label} value={campo.value} soloActivos={soloActivos} disabled={disabled}
      onChange={(p) => { ayudante.setValue(p); onElegir?.(p); }} onBlur={() => ayudante.setTouched(true)}
      error={conError} helperText={conError ? meta.error : ' '} />
  );
}
