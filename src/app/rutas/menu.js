/**
 * Nombre:                 menu.js
 * Descripción:            Opciones del menú principal con los roles que pueden verlas (06_permisos_por_rol.md). Ocultar opciones es usabilidad: la autorización real está en el backend.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.7.0
 * @file
 */
import HomeOutlined from '@mui/icons-material/HomeOutlined';
import PointOfSaleOutlined from '@mui/icons-material/PointOfSaleOutlined';
import ShoppingCartOutlined from '@mui/icons-material/ShoppingCartOutlined';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import PeopleOutlined from '@mui/icons-material/PeopleOutlined';
import WarehouseOutlined from '@mui/icons-material/WarehouseOutlined';
import AssignmentReturnOutlined from '@mui/icons-material/AssignmentReturnOutlined';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import PolicyOutlined from '@mui/icons-material/PolicyOutlined';
import ManageAccountsOutlined from '@mui/icons-material/ManageAccountsOutlined';
import CategoryOutlined from '@mui/icons-material/CategoryOutlined';

/** Ambos roles. */
const TODOS = Object.freeze(['ADMIN', 'OPERATIVO']);
/** Solo administrador. */
const ADMIN = Object.freeze(['ADMIN']);

/**
 * @typedef {object} OpcionMenu
 * @property {string} ruta - Ruta de la pantalla.
 * @property {string} clave - Clave i18n del texto.
 * @property {import('react').ElementType} icono - Icono de MUI.
 * @property {readonly string[]} roles - Roles que la ven.
 * @property {number} [incremento] - Incremento de la Fase 4 que la implementa (si aún no existe).
 */

/** @type {readonly OpcionMenu[]} */
export const MENU = Object.freeze([
  { ruta: '/', clave: 'menu.inicio', icono: HomeOutlined, roles: TODOS },
  { ruta: '/ventas', clave: 'menu.ventas', icono: PointOfSaleOutlined, roles: TODOS, incremento: 8 },
  { ruta: '/compras', clave: 'menu.compras', icono: ShoppingCartOutlined, roles: TODOS, incremento: 7 },
  { ruta: '/productos', clave: 'menu.productos', icono: Inventory2Outlined, roles: TODOS },
  { ruta: '/categorias', clave: 'menu.categorias', icono: CategoryOutlined, roles: ADMIN },
  { ruta: '/terceros', clave: 'menu.terceros', icono: PeopleOutlined, roles: TODOS },
  { ruta: '/inventario', clave: 'menu.inventario', icono: WarehouseOutlined, roles: TODOS },
  { ruta: '/devoluciones', clave: 'menu.devoluciones', icono: AssignmentReturnOutlined, roles: TODOS, incremento: 9 },
  { ruta: '/comprobantes', clave: 'menu.comprobantes', icono: ReceiptLongOutlined, roles: TODOS, incremento: 10 },
  { ruta: '/ajustes', clave: 'menu.ajustes', icono: TuneOutlined, roles: ADMIN },
  { ruta: '/auditoria', clave: 'menu.auditoria', icono: PolicyOutlined, roles: ADMIN, incremento: 11 },
  { ruta: '/usuarios', clave: 'menu.usuarios', icono: ManageAccountsOutlined, roles: ADMIN },
]);

/**
 * @param {string|undefined} rol - Rol del usuario.
 * @returns {OpcionMenu[]} Opciones visibles para ese rol.
 */
export function opcionesPara(rol) {
  return MENU.filter((opcion) => opcion.roles.includes(rol));
}
