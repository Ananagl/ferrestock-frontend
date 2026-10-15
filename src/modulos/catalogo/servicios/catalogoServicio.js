/**
 * Nombre:                 catalogoServicio.js
 * Descripción:            Llamadas a la API de categorías, productos y precios.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.4.0
 * @file
 */
import { clienteHttp } from '../../../servicios/api/clienteHttp.js';

/**
 * @typedef {object} Categoria
 * @property {number} id
 * @property {string} nombre
 * @property {boolean} activa
 */

/**
 * @typedef {object} Producto
 * @property {number} id
 * @property {string} codigo
 * @property {string} nombre
 * @property {string|null} descripcion
 * @property {Categoria} categoria
 * @property {string} unidadMedida
 * @property {boolean} permiteFraccion
 * @property {string} precioVenta - Decimal como texto.
 * @property {string} existencias - Decimal como texto.
 * @property {'ACTIVO'|'INACTIVO'} estado
 * @property {number} version
 */

/** Unidades de medida admitidas por el backend. */
export const UNIDADES = Object.freeze(['UNIDAD', 'METRO', 'KILOGRAMO', 'LITRO', 'GALON', 'CAJA', 'PAQUETE', 'ROLLO']);

/**
 * @param {boolean} [activa] - Filtro de estado.
 * @returns {Promise<Categoria[]>} Categorías ordenadas por nombre.
 */
export async function listarCategorias(activa) {
  const { data } = await clienteHttp.get('/categorias', { params: activa === undefined ? {} : { activa } });
  return data;
}

/**
 * Adapta el listado completo de categorías al formato paginado de las tablas (paginación en el cliente).
 * @param {{pagina: number, tamano: number}} parametros - Página.
 * @returns {Promise<{contenido: Categoria[], totalElementos: number}>} Página.
 */
export async function listarCategoriasPaginadas({ pagina, tamano }) {
  const todas = await listarCategorias();
  return { contenido: todas.slice(pagina * tamano, (pagina + 1) * tamano), totalElementos: todas.length };
}

/** @param {string} nombre - Nombre. @returns {Promise<Categoria>} Creada. */
export async function crearCategoria(nombre) {
  const { data } = await clienteHttp.post('/categorias', { nombre });
  return data;
}

/** @param {number} id - Categoría. @param {string} nombre - Nombre. @returns {Promise<Categoria>} Actualizada. */
export async function renombrarCategoria(id, nombre) {
  const { data } = await clienteHttp.put(`/categorias/${id}`, { nombre });
  return data;
}

/** @param {number} id - Categoría. @param {boolean} activa - Estado. @returns {Promise<Categoria>} Actualizada. */
export async function cambiarEstadoCategoria(id, activa) {
  const { data } = await clienteHttp.patch(`/categorias/${id}/estado`, { activa });
  return data;
}

/**
 * @param {{q?: string, categoriaId?: number, estado?: string, pagina: number, tamano: number}} parametros - Filtros.
 * @returns {Promise<{contenido: Producto[], totalElementos: number}>} Página de productos.
 */
export async function listarProductos(parametros) {
  const { data } = await clienteHttp.get('/productos', { params: parametros });
  return data;
}

/** @param {object} datos - Producto nuevo. @returns {Promise<Producto>} Creado. */
export async function crearProducto(datos) {
  const { data } = await clienteHttp.post('/productos', datos);
  return data;
}

/** @param {number} id - Producto. @param {object} datos - Datos y versión. @returns {Promise<Producto>} Actualizado. */
export async function actualizarProducto(id, datos) {
  const { data } = await clienteHttp.put(`/productos/${id}`, datos);
  return data;
}

/** @param {number} id - Producto. @param {'ACTIVO'|'INACTIVO'} estado - Estado. @returns {Promise<Producto>} Actualizado. */
export async function cambiarEstadoProducto(id, estado) {
  const { data } = await clienteHttp.patch(`/productos/${id}/estado`, { estado });
  return data;
}

/** @param {number} id - Producto. @param {string} precioVenta - Decimal. @returns {Promise<Producto>} Actualizado. */
export async function cambiarPrecio(id, precioVenta) {
  const { data } = await clienteHttp.patch(`/productos/${id}/precio`, { precioVenta });
  return data;
}
