/**
 * Nombre:                 ProveedorNotificaciones.jsx
 * Descripción:            Notificaciones breves (Snackbar) anunciadas a lectores de pantalla tras guardar o cambiar datos.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.3.0
 * @file
 */
import { createContext, useCallback, useContext, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';

const ContextoNotificaciones = createContext(/** @type {(mensaje: string, severidad?: string) => void} */ (() => {}));

/**
 * @param {{children: import('react').ReactNode}} props - Contenido.
 * @returns {import('react').JSX.Element} Proveedor.
 */
export function ProveedorNotificaciones({ children }) {
  const [aviso, setAviso] = useState(null);
  const notificar = useCallback((mensaje, severidad = 'success') => setAviso({ mensaje, severidad, clave: Date.now() }), []);
  const cerrar = (_evento, motivo) => {
    if (motivo !== 'clickaway') setAviso(null);
  };
  return (
    <ContextoNotificaciones.Provider value={notificar}>
      {children}
      <Snackbar key={aviso?.clave} open={Boolean(aviso)} autoHideDuration={5000} onClose={cerrar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {aviso ? (
          <Alert onClose={cerrar} severity={aviso.severidad} variant="filled" role="status" sx={{ width: '100%' }}>
            {aviso.mensaje}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ContextoNotificaciones.Provider>
  );
}

/**
 * @returns {(mensaje: string, severidad?: 'success'|'info'|'warning'|'error') => void} Función para notificar.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useNotificar() {
  return useContext(ContextoNotificaciones);
}
