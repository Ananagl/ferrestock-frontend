/**
 * Nombre:                 App.jsx
 * Descripción:            Componente raíz con el enrutador: ruta pública de ingreso y rutas protegidas por sesión y rol, cargadas bajo demanda.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.7.0
 * @file
 */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RutaProtegida, RUTA_CAMBIO_CONTRASENA } from './app/rutas/RutaProtegida.jsx';
import { MENU } from './app/rutas/menu.js';
import { Plantilla } from './compartido/componentes/diseno/Plantilla.jsx';
import { Cargando } from './compartido/componentes/retroalimentacion/Cargando.jsx';

// Cada pantalla se descarga solo cuando se visita (divide el paquete por rutas)
const PaginaIngreso = lazy(() => import('./modulos/autenticacion/paginas/PaginaIngreso.jsx'));
const PaginaCambioContrasena = lazy(() => import('./modulos/autenticacion/paginas/PaginaCambioContrasena.jsx'));
const PaginaInicio = lazy(() => import('./modulos/inicio/paginas/PaginaInicio.jsx'));
const PaginaEnConstruccion = lazy(() => import('./modulos/inicio/paginas/PaginaEnConstruccion.jsx'));
const PaginaUsuarios = lazy(() => import('./modulos/usuarios/paginas/PaginaUsuarios.jsx'));
const PaginaProductos = lazy(() => import('./modulos/catalogo/paginas/PaginaProductos.jsx'));
const PaginaCategorias = lazy(() => import('./modulos/catalogo/paginas/PaginaCategorias.jsx'));
const PaginaTerceros = lazy(() => import('./modulos/terceros/paginas/PaginaTerceros.jsx'));
const PaginaInventario = lazy(() => import('./modulos/inventario/paginas/PaginaInventario.jsx'));
const PaginaKardex = lazy(() => import('./modulos/inventario/paginas/PaginaKardex.jsx'));
const PaginaAjustes = lazy(() => import('./modulos/ajustes/paginas/PaginaAjustes.jsx'));

/**
 * Rutas de la aplicación.
 * @returns {import('react').JSX.Element} Enrutador de la SPA.
 */
export default function App() {
  const pendientes = MENU.filter((opcion) => opcion.incremento);
  return (
    <BrowserRouter>
      <Suspense fallback={<Cargando />}>
        <Routes>
          <Route path="/ingresar" element={<PaginaIngreso />} />
          <Route element={<RutaProtegida />}>
            <Route element={<Plantilla />}>
              <Route index element={<PaginaInicio />} />
              <Route path={RUTA_CAMBIO_CONTRASENA} element={<PaginaCambioContrasena />} />
              <Route path="/productos" element={<PaginaProductos />} />
              <Route path="/terceros" element={<PaginaTerceros />} />
              <Route path="/inventario" element={<PaginaInventario />} />
              <Route path="/inventario/:productoId" element={<PaginaKardex />} />
              <Route element={<RutaProtegida roles={['ADMIN']} />}>
                <Route path="/usuarios" element={<PaginaUsuarios />} />
                <Route path="/categorias" element={<PaginaCategorias />} />
                <Route path="/ajustes" element={<PaginaAjustes />} />
              </Route>
              {pendientes.map((opcion) => (
                <Route key={opcion.ruta} element={<RutaProtegida roles={opcion.roles} />}>
                  <Route path={`${opcion.ruta}/*`} element={<PaginaEnConstruccion />} />
                </Route>
              ))}
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
