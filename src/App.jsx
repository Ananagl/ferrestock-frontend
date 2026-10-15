/**
 * Nombre:                 App.jsx
 * Descripción:            Componente raíz con el enrutador. En la Fase 3 solo existe la pantalla neutra de la base técnica.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.1.0
 * @file
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { PaginaBaseTecnica } from './modulos/inicio/paginas/PaginaBaseTecnica.jsx';

/**
 * Rutas de primer nivel de la aplicación.
 * @returns {import('react').JSX.Element} Enrutador de la SPA.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PaginaBaseTecnica />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
