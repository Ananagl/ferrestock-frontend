/**
 * Nombre:                 main.jsx
 * Descripción:            Punto de entrada del frontend: carga la tipografía, la internacionalización y los proveedores,
 *                         y monta la aplicación.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.1.0
 * @file
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/700.css';
import './i18n/configuracion.js';
import { ProveedorTema } from './app/proveedores/ProveedorTema.jsx';
import App from './App.jsx';

createRoot(document.getElementById('raiz')).render(
  <StrictMode>
    <ProveedorTema>
      <App />
    </ProveedorTema>
  </StrictMode>,
);
