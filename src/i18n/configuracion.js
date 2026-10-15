/**
 * Nombre:                 configuracion.js
 * Descripción:            Configuración de i18next: español por defecto e inglés, detección del idioma y
 *                         sincronización del atributo lang del documento (RNF-USA-01).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.6.0
 * @file
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import DetectorIdioma from 'i18next-browser-languagedetector';
import comunEs from './locales/es/comun.json';
import comunEn from './locales/en/comun.json';
import authEs from './locales/es/auth.json';
import authEn from './locales/en/auth.json';
import validacionEs from './locales/es/validacion.json';
import validacionEn from './locales/en/validacion.json';
import usuariosEs from './locales/es/usuarios.json';
import usuariosEn from './locales/en/usuarios.json';
import catalogoEs from './locales/es/catalogo.json';
import catalogoEn from './locales/en/catalogo.json';
import tercerosEs from './locales/es/terceros.json';
import tercerosEn from './locales/en/terceros.json';
import inventarioEs from './locales/es/inventario.json';
import inventarioEn from './locales/en/inventario.json';

/** Idiomas soportados por la aplicación. */
export const IDIOMAS = Object.freeze(['es', 'en']);

i18n
  .use(DetectorIdioma)
  .use(initReactI18next)
  .init({
    resources: {
      es: { comun: comunEs, auth: authEs, validacion: validacionEs, usuarios: usuariosEs, catalogo: catalogoEs, terceros: tercerosEs, inventario: inventarioEs },
      en: { comun: comunEn, auth: authEn, validacion: validacionEn, usuarios: usuariosEn, catalogo: catalogoEn, terceros: tercerosEn, inventario: inventarioEn },
    },
    supportedLngs: IDIOMAS,
    fallbackLng: 'es',
    nonExplicitSupportedLngs: true,
    defaultNS: 'comun',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'fs.idioma',
      caches: ['localStorage'],
    },
  });

/** Mantiene <html lang> alineado con el idioma activo, para lectores de pantalla. */
function sincronizarLang(idioma) {
  document.documentElement.lang = idioma?.startsWith('en') ? 'en' : 'es';
}
sincronizarLang(i18n.resolvedLanguage);
i18n.on('languageChanged', sincronizarLang);

export default i18n;
