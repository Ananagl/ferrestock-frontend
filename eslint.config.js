/**
 * Nombre:                 eslint.config.js
 * Descripción:            Reglas de calidad del código: recomendadas de JS, hooks de React y prohibición de colores
 *                         literales en los módulos (deben venir de los tokens del tema, RNF-USA-05).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.1.0
 * @file
 */
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'docs-generados', 'playwright-report', 'test-results'] },
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Las variables usadas solo en JSX no las detecta no-unused-vars sin el plugin de React
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },
  {
    // Los módulos y componentes compartidos solo usan colores del tema
    files: ['src/modulos/**/*.{js,jsx}', 'src/compartido/**/*.{js,jsx}'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: 'Literal[value=/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
        message: 'Use colores del tema (theme.palette.*), no literales hexadecimales.',
      }],
    },
  },
];
