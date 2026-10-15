# FerreStock — Frontend

| Campo | Valor |
|---|---|
| **Nombre** | README.md |
| **Descripción** | Requisitos, configuración, ejecución y pruebas del frontend de FerreStock. |
| **Fecha de creación** | 2026-10-15 |
| **Fecha de actualización** | 2026-10-15 |
| **Autores** | Ana Sofía Nagles García · María Mercedes Rincón Valencia · Juan David Camacho Tapiero |
| **Versión** | 0.1.0 |

SPA en **React 19 + Material UI 9** (Vite) con Formik + Yup, i18next (es/en), Axios, tokens de diseño propios, y pruebas con Playwright y Selenium. El diseño está en `../docs/fase-2-diseno/06_frontend.md`.

## Requisitos

- Node.js 20.19 o superior.
- El backend corriendo en `http://localhost:8080` (ver `../ferrestock-backend/README.md`).

## Configuración

Copie `.env.example` a `.env` si necesita cambiar algo. En desarrollo, Vite reenvía `/api` y `/actuator` al backend (`FS_BACKEND_DEV`), así el navegador trabaja con un solo origen y la cookie de sesión funciona sin CORS.

## Comandos

| Acción | Comando |
|---|---|
| Instalar dependencias | `npm ci` |
| Desarrollo (http://localhost:5173) | `npm run dev` |
| Build de producción (`dist/`) | `npm run build` |
| Lint + verificación de traducciones | `npm test` |
| Pruebas E2E (Playwright) | `npx playwright install chromium firefox` (solo la primera vez) y luego `npm run test:e2e` |
| Documentación JSDoc | `npm run docs` → `docs-generados/jsdoc` |

## Convenciones

- Los colores, la tipografía y el espaciado salen **solo** de `src/app/tema/tokens.js`; ESLint prohíbe los colores literales en los módulos.
- Todos los textos van en `src/i18n/locales/{es,en}`; `npm test` falla si falta una traducción.
- Las llamadas HTTP pasan por `src/servicios/api/clienteHttp.js`. No se guardan tokens en el navegador.
- Cada archivo inicia con el encabezado obligatorio (nombre, descripción, fechas, autores, versión). Los `.json` no admiten comentarios; sus metadatos están en este README.
