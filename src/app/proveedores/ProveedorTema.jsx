/**
 * Nombre:                 ProveedorTema.jsx
 * Descripción:            Proveedor del tema claro/oscuro. Usa la preferencia guardada por el usuario o, si no existe,
 *                         la del sistema operativo (prefers-color-scheme).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.1.0
 * @file
 */
import { createContext, useContext, useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import { crearTema } from '../tema/crearTema.js';

/** Clave de localStorage para la preferencia de tema (única preferencia guardada en el navegador). */
const CLAVE_TEMA = 'fs.tema';

const ContextoTema = createContext({ modo: 'light', alternarModo: () => {} });

/** Lee la preferencia guardada, tolerando navegadores que bloquean localStorage. */
function leerPreferencia() {
  try {
    return localStorage.getItem(CLAVE_TEMA);
  } catch {
    return null;
  }
}

/**
 * Envuelve la aplicación con el tema de MUI.
 * @param {{children: import('react').ReactNode}} props - Contenido de la aplicación.
 * @returns {import('react').JSX.Element} Proveedor de tema.
 */
export function ProveedorTema({ children }) {
  const sistemaOscuro = useMediaQuery('(prefers-color-scheme: dark)');
  const [elegido, setElegido] = useState(leerPreferencia);
  const modo = elegido ?? (sistemaOscuro ? 'dark' : 'light');
  const tema = useMemo(() => crearTema(modo), [modo]);

  const valor = useMemo(() => ({
    modo,
    alternarModo: () => {
      const siguiente = modo === 'dark' ? 'light' : 'dark';
      setElegido(siguiente);
      try {
        localStorage.setItem(CLAVE_TEMA, siguiente);
      } catch {
        // Sin almacenamiento disponible: la preferencia dura solo esta visita
      }
    },
  }), [modo]);

  return (
    <ContextoTema.Provider value={valor}>
      <ThemeProvider theme={tema}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ContextoTema.Provider>
  );
}

/**
 * Acceso al modo de color actual y a la función para alternarlo.
 * @returns {{modo: 'light'|'dark', alternarModo: () => void}} Estado del tema.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useModoTema() {
  return useContext(ContextoTema);
}
