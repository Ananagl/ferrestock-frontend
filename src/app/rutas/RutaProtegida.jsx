/**
 * Nombre:                 RutaProtegida.jsx
 * Descripción:            Protege rutas: exige sesión, fuerza el cambio de contraseña temporal y comprueba el rol (solo usabilidad; el backend autoriza).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
 * @file
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSesion } from '../proveedores/ProveedorSesion.jsx';
import { Cargando } from '../../compartido/componentes/retroalimentacion/Cargando.jsx';
import { PaginaAccesoDenegado } from '../../modulos/inicio/paginas/PaginaAccesoDenegado.jsx';

/** Ruta del cambio de contraseña, permitida aunque el cambio esté pendiente. */
export const RUTA_CAMBIO_CONTRASENA = '/cambiar-contrasena';

/**
 * Envoltorio de rutas protegidas.
 * @param {{roles?: readonly string[]}} props - Roles permitidos (todos si se omite).
 * @returns {import('react').JSX.Element} Contenido, redirección o acceso denegado.
 */
export function RutaProtegida({ roles }) {
  const { estado, usuario } = useSesion();
  const ubicacion = useLocation();

  if (estado === 'cargando') return <Cargando />;
  if (estado === 'anonimo') {
    const volver = encodeURIComponent(ubicacion.pathname + ubicacion.search);
    return <Navigate to={`/ingresar?volver=${volver}`} replace />;
  }
  if (usuario.debeCambiarPassword && ubicacion.pathname !== RUTA_CAMBIO_CONTRASENA) {
    return <Navigate to={RUTA_CAMBIO_CONTRASENA} replace />;
  }
  if (roles && !roles.includes(usuario.rol)) return <PaginaAccesoDenegado />;
  return <Outlet />;
}
