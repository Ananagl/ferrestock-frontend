/**
 * Nombre:                 ProveedorSesion.jsx
 * Descripción:            Estado global de la sesión: la recupera al abrir la aplicación (incluida la sesión persistente), inicia y cierra sesión y aplica el idioma preferido del usuario.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
 * @file
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import i18n from '../../i18n/configuracion.js';
import { EVENTO_SESION_EXPIRADA } from '../../servicios/api/clienteHttp.js';
import * as servicio from '../../modulos/autenticacion/servicios/autenticacionServicio.js';

/**
 * @typedef {object} ValorSesion
 * @property {'cargando'|'autenticado'|'anonimo'} estado - Estado de la sesión.
 * @property {import('../../modulos/autenticacion/servicios/autenticacionServicio.js').Sesion|null} usuario - Usuario.
 * @property {(datos: object) => Promise<object>} iniciarSesion - Inicia sesión.
 * @property {() => Promise<void>} cerrarSesion - Cierra sesión.
 * @property {() => Promise<void>} refrescar - Vuelve a leer la sesión del backend.
 * @property {(idioma: 'es'|'en') => void} cambiarIdioma - Cambia y guarda el idioma.
 */

const ContextoSesion = createContext(/** @type {ValorSesion|null} */ (null));

/**
 * Proveedor de la sesión. No guarda nada en el navegador: la permanencia la da la cookie del backend.
 * @param {{children: import('react').ReactNode}} props - Contenido.
 * @returns {import('react').JSX.Element} Proveedor.
 */
export function ProveedorSesion({ children }) {
  const [estado, setEstado] = useState('cargando');
  const [usuario, setUsuario] = useState(null);

  const aplicar = useCallback((datos) => {
    setUsuario(datos);
    setEstado('autenticado');
    if (datos.idioma && i18n.resolvedLanguage !== datos.idioma) {
      i18n.changeLanguage(datos.idioma);
    }
  }, []);

  const quedarAnonimo = useCallback(() => {
    setUsuario(null);
    setEstado('anonimo');
  }, []);

  // Al abrir la aplicación: token CSRF y sesión actual (puede restaurarse con "Recordarme")
  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        await servicio.prepararCsrf();
        const datos = await servicio.obtenerSesion();
        if (vigente) aplicar(datos);
      } catch {
        if (vigente) quedarAnonimo();
      }
    })();
    return () => { vigente = false; };
  }, [aplicar, quedarAnonimo]);

  // Cualquier 401 posterior significa que la sesión expiró
  useEffect(() => {
    window.addEventListener(EVENTO_SESION_EXPIRADA, quedarAnonimo);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, quedarAnonimo);
  }, [quedarAnonimo]);

  const valor = useMemo(() => ({
    estado,
    usuario,
    async iniciarSesion(datos) {
      const sesion = await servicio.iniciarSesion(datos);
      aplicar(sesion);
      return sesion;
    },
    async cerrarSesion() {
      try {
        await servicio.cerrarSesion();
      } finally {
        quedarAnonimo();
        await servicio.prepararCsrf().catch(() => {});
      }
    },
    async refrescar() {
      aplicar(await servicio.obtenerSesion());
    },
    cambiarIdioma(idioma) {
      i18n.changeLanguage(idioma);
      if (usuario) {
        setUsuario({ ...usuario, idioma });
        servicio.guardarIdioma(idioma).catch(() => {});
      }
    },
  }), [estado, usuario, aplicar, quedarAnonimo]);

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

/**
 * Acceso a la sesión desde cualquier componente.
 * @returns {ValorSesion} Valor del contexto.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useSesion() {
  const valor = useContext(ContextoSesion);
  if (!valor) throw new Error('useSesion debe usarse dentro de ProveedorSesion');
  return valor;
}
