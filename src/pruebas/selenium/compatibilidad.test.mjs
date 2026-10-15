/**
 * Nombre:                 compatibilidad.test.mjs
 * Descripción:            Pruebas de compatibilidad con Selenium WebDriver (Edge en CI, Chrome en local): ingreso, cambio de idioma, pantalla de venta y cierre de sesión contra la aplicación real.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.11.0
 * @file
 *
 * Uso: FS_USUARIO=… FS_CLAVE=… [FS_URL=http://localhost:5173] [NAVEGADOR=MicrosoftEdge] npm run test:selenium
 * Requiere el frontend y el backend en ejecución (a diferencia de Playwright, no simula la API).
 */
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import edge from 'selenium-webdriver/edge.js';

const URL_BASE = process.env.FS_URL ?? 'http://localhost:5173';
const NAVEGADOR = process.env.NAVEGADOR ?? 'chrome';
const ESPERA_MS = 15000;

/** @type {import('selenium-webdriver').WebDriver} */
let driver;

/**
 * @param {string} texto - Texto visible del encabezado h1.
 * @returns {Promise<void>} Espera a que aparezca.
 */
async function esperarTitulo(texto) {
  await driver.wait(until.elementLocated(By.xpath(`//h1[normalize-space()='${texto}']`)), ESPERA_MS);
}

before(async () => {
  assert.ok(process.env.FS_USUARIO && process.env.FS_CLAVE, 'Defina FS_USUARIO y FS_CLAVE');
  const argumentos = ['--headless=new', '--window-size=1280,900'];
  driver = await new Builder().forBrowser(NAVEGADOR)
    .setChromeOptions(new chrome.Options().addArguments(...argumentos))
    .setEdgeOptions(new edge.Options().addArguments(...argumentos))
    .build();
});

after(async () => {
  await driver?.quit();
});

test('la pantalla de ingreso carga y cambia a inglés (RNF-USA-01)', async () => {
  await driver.get(`${URL_BASE}/ingresar`);
  await driver.wait(until.elementLocated(By.id('usuario')), ESPERA_MS);
  await driver.executeScript("localStorage.setItem('fs.idioma', 'en')");
  await driver.navigate().refresh();
  await driver.wait(until.elementLocated(By.xpath("//button[normalize-space()='Sign in']")), ESPERA_MS);
  assert.equal(await driver.executeScript('return document.documentElement.lang'), 'en');
  await driver.executeScript("localStorage.setItem('fs.idioma', 'es')");
  await driver.navigate().refresh();
  await driver.wait(until.elementLocated(By.xpath("//button[normalize-space()='Ingresar']")), ESPERA_MS);
});

test('ingresa con un usuario real y abre la pantalla de nueva venta (RF-AUT-001, RF-VEN-001)', async () => {
  await driver.findElement(By.id('usuario')).sendKeys(process.env.FS_USUARIO);
  await driver.findElement(By.id('contrasena')).sendKeys(process.env.FS_CLAVE);
  await driver.findElement(By.xpath("//button[normalize-space()='Ingresar']")).click();
  await driver.wait(until.urlIs(`${URL_BASE}/`), ESPERA_MS);
  await driver.get(`${URL_BASE}/ventas/nueva`);
  await esperarTitulo('Nueva venta');
  assert.ok(await driver.findElement(By.xpath("//button[normalize-space()='Confirmar venta']")).isDisplayed());
});

test('la sesión persiste al recargar y una ruta protegida sin sesión lleva al ingreso (RF-AUT-004)', async () => {
  await driver.navigate().refresh();
  await esperarTitulo('Nueva venta');
  await driver.manage().deleteAllCookies();
  await driver.get(`${URL_BASE}/ventas`);
  await driver.wait(until.urlContains('/ingresar'), ESPERA_MS);
});
