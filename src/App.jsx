/**
 * Nombre:                 App.jsx
 * Descripción:            Componente raíz con el enrutador: ruta pública de ingreso y rutas protegidas por sesión y rol, cargadas bajo demanda.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
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
