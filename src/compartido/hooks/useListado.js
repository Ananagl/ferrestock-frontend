/**
 * Nombre:                 useListado.js
 * Descripción:            Hook para pantallas de listado: filtros, paginación, estados de carga y error, y recarga.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.3.0
 * @file
 */
import { useCallback, useEffect, useState } from 'react';
import { leerProblema } from '../../servicios/api/problemas.js';

/**
 * @template T
 * @typedef {object} EstadoListado
 * @property {{contenido: T[], totalElementos: number}|null} datos - Última página recibida.
 * @property {'cargando'|'listo'|'error'} estado - Estado de la consulta.
 * @property {import('../../servicios/api/problemas.js').Problema|null} problema - Error, si lo hubo.
 * @property {number} pagina - Página actual (desde 0).
 * @property {number} tamano - Tamaño de página.
 * @property {Record<string, any>} filtros - Filtros actuales.
 * @property {(pagina: number) => void} setPagina - Cambia de página.
 * @property {(tamano: number) => void} setTamano - Cambia el tamaño (vuelve a la página 0).
 * @property {(filtros: Record<string, any>) => void} setFiltros - Cambia filtros (vuelve a la página 0).
 * @property {() => void} recargar - Repite la consulta.
 */

/**
 * Gestiona una consulta paginada. Ignora respuestas que llegan tarde si los parámetros ya cambiaron.
 * @template T
 * @param {(parametros: object) => Promise<{contenido: T[], totalElementos: number}>} consultar - Llamada al servicio.
 * @param {Record<string, any>} [filtrosIniciales] - Filtros iniciales.
 * @returns {EstadoListado<T>} Estado y acciones del listado.
 */
export function useListado(consultar, filtrosIniciales = {}) {
  const [pagina, setPaginaInterna] = useState(0);
  const [tamano, setTamanoInterno] = useState(20);
  const [filtros, setFiltrosInternos] = useState(filtrosIniciales);
  const [version, setVersion] = useState(0);
  const [resultado, setResultado] = useState({ datos: null, estado: 'cargando', problema: null });

  useEffect(() => {
    let vigente = true;
    (async () => {
      setResultado((anterior) => ({ ...anterior, estado: 'cargando' }));
      try {
        const limpios = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== '' && v != null));
        const datos = await consultar({ ...limpios, pagina, tamano });
        if (vigente) setResultado({ datos, estado: 'listo', problema: null });
      } catch (error) {
        if (vigente) setResultado((anterior) => ({ ...anterior, estado: 'error', problema: leerProblema(error) }));
      }
    })();
    return () => { vigente = false; };
  }, [consultar, filtros, pagina, tamano, version]);

  return {
    ...resultado,
    pagina,
    tamano,
    filtros,
    setPagina: setPaginaInterna,
    setTamano: useCallback((nuevo) => { setTamanoInterno(nuevo); setPaginaInterna(0); }, []),
    setFiltros: useCallback((nuevos) => { setFiltrosInternos(nuevos); setPaginaInterna(0); }, []),
    recargar: useCallback(() => setVersion((v) => v + 1), []),
  };
}
