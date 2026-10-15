/**
 * Nombre:                 vite.config.js
 * Descripción:            Configuración de Vite: plugin de React y proxy de desarrollo que reenvía /api y /actuator
 *                         al backend, para que el navegador trabaje con un único origen (ADR-04).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.1.0
 * @file
 */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const entorno = loadEnv(mode, process.cwd(), '');
  const backend = entorno.FS_BACKEND_DEV || 'http://localhost:8080';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: backend, changeOrigin: false },
        '/actuator': { target: backend, changeOrigin: false },
      },
    },
    preview: { port: 4173 },
  };
});
