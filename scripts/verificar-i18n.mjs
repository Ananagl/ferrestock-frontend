/**
 * Nombre:                 verificar-i18n.mjs
 * Descripción:            Compara las claves de traducción de español e inglés en cada namespace y termina con error
 *                         si falta alguna o si un texto está vacío (RNF-USA-01).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.1.0
 * @file
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = join(import.meta.dirname, '..', 'src', 'i18n', 'locales');
const IDIOMAS = ['es', 'en'];

/** Aplana un objeto JSON a claves con puntos: {a:{b:'x'}} -> {'a.b':'x'}. */
function aplanar(objeto, prefijo = '') {
  return Object.entries(objeto).reduce((acumulado, [clave, valor]) => {
    const ruta = prefijo ? `${prefijo}.${clave}` : clave;
    return typeof valor === 'object' && valor !== null
      ? { ...acumulado, ...aplanar(valor, ruta) }
      : { ...acumulado, [ruta]: valor };
  }, {});
}

let errores = 0;
const namespaces = new Set(IDIOMAS.flatMap((idioma) => readdirSync(join(RAIZ, idioma))));
for (const archivo of namespaces) {
  const porIdioma = Object.fromEntries(IDIOMAS.map((idioma) => {
    try {
      return [idioma, aplanar(JSON.parse(readFileSync(join(RAIZ, idioma, archivo), 'utf8')))];
    } catch {
      console.error(`Falta el archivo ${idioma}/${archivo}`);
      errores += 1;
      return [idioma, {}];
    }
  }));
  const todas = new Set(IDIOMAS.flatMap((idioma) => Object.keys(porIdioma[idioma])));
  for (const clave of todas) {
    for (const idioma of IDIOMAS) {
      const texto = porIdioma[idioma][clave];
      if (typeof texto !== 'string' || texto.trim() === '') {
        console.error(`[${idioma}/${archivo}] clave faltante o vacía: ${clave}`);
        errores += 1;
      }
    }
  }
}

if (errores > 0) {
  console.error(`Traducciones incompletas: ${errores}`);
  process.exit(1);
}
console.log(`Traducciones completas en ${namespaces.size} namespace(s).`);
