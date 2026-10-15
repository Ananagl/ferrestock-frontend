/**
 * Nombre:                 crearTema.js
 * Descripción:            Convierte los tokens de diseño en un tema de Material UI claro u oscuro, con foco visible
 *                         accesible y respeto por la preferencia de movimiento reducido.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.1.0
 * @file
 */
import { createTheme } from '@mui/material/styles';
import { tokens } from './tokens.js';

/**
 * Crea el tema de la aplicación.
 * @param {'light'|'dark'} modo - Modo de color.
 * @returns {import('@mui/material/styles').Theme} Tema de MUI generado desde los tokens.
 */
export function crearTema(modo) {
  const oscuro = modo === 'dark';
  const { color, tipografia, radio, foco, movimiento } = tokens;
  const anilloFoco = `${foco.grosor}px solid ${color.foco}`;

  return createTheme({
    palette: {
      mode: modo,
      primary: {
        main: oscuro ? color.marca.principalClaro : color.marca.principal,
        dark: color.marca.principalOscuro,
        contrastText: oscuro ? color.acero[900] : color.marca.contraste,
      },
      secondary: { main: oscuro ? color.acero[300] : color.acero[700] },
      success: { main: color.estado.exito },
      warning: { main: color.estado.aviso },
      error: { main: color.estado.error },
      info: { main: color.estado.info },
      background: {
        default: oscuro ? color.superficie.fondoOscuro : color.superficie.fondoClaro,
        paper: oscuro ? color.superficie.oscuro : color.superficie.claro,
      },
      text: {
        primary: oscuro ? color.acero[50] : color.acero[900],
        secondary: oscuro ? color.acero[300] : color.acero[700],
      },
      divider: oscuro ? color.acero[700] : color.acero[300],
    },
    spacing: tokens.espacioBase,
    shape: { borderRadius: radio.m },
    typography: {
      fontFamily: tipografia.familia,
      fontSize: 14,
      htmlFontSize: tipografia.base,
      h1: { fontSize: '2rem', fontWeight: tipografia.pesos.fuerte },
      h2: { fontSize: '1.5rem', fontWeight: tipografia.pesos.fuerte },
      button: { textTransform: 'none', fontWeight: tipografia.pesos.medio },
    },
    transitions: {
      duration: { shortest: parseInt(movimiento.rapido, 10), standard: parseInt(movimiento.normal, 10) },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':focus-visible': { outline: anilloFoco, outlineOffset: foco.separacion },
          '@media (prefers-reduced-motion: reduce)': {
            '*, *::before, *::after': { animationDuration: '0.01ms !important', transitionDuration: '0.01ms !important' },
          },
        },
      },
      MuiButtonBase: {
        defaultProps: { disableRipple: false },
        styleOverrides: { root: { '&.Mui-focusVisible': { outline: anilloFoco, outlineOffset: foco.separacion } } },
      },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    },
  });
}
