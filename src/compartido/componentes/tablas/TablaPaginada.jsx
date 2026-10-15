/**
 * Nombre:                 TablaPaginada.jsx
 * Descripción:            Tabla paginada accesible y responsive: tabla con caption en pantallas medianas y grandes, tarjetas apiladas en móvil, con estados de carga, error y vacío.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.3.0
 * @file
 */
import {
  Box, Card, CardActions, CardContent, LinearProgress, Paper, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TablePagination, TableRow, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { EstadoVacio } from '../retroalimentacion/EstadoVacio.jsx';
import { EstadoError } from '../retroalimentacion/EstadoError.jsx';
import { OCULTO_VISUAL } from '../../utilidades/ocultoVisual.js';

/**
 * @typedef {object} Columna
 * @property {string} campo - Clave única de la columna.
 * @property {string} encabezado - Texto del encabezado.
 * @property {(fila: any) => import('react').ReactNode} [render] - Contenido de la celda (por defecto fila[campo]).
 */

/**
 * @param {{titulo: string, columnas: Columna[], listado: import('../../hooks/useListado.js').EstadoListado<any>,
 *   claveFila?: (fila: any) => string|number, acciones?: (fila: any) => import('react').ReactNode,
 *   mensajeVacio: string}} props - Propiedades.
 * @returns {import('react').JSX.Element} Tabla o tarjetas.
 */
export function TablaPaginada({ titulo, columnas, listado, claveFila = (f) => f.id, acciones, mensajeVacio }) {
  const { t } = useTranslation();
  const tema = useTheme();
  const movil = useMediaQuery(tema.breakpoints.down('sm'));
  const filas = listado.datos?.contenido ?? [];
  const celda = (columna, fila) => (columna.render ? columna.render(fila) : fila[columna.campo]);

  const paginacion = (
    <TablePagination
      component="div"
      count={listado.datos?.totalElementos ?? 0}
      page={listado.pagina}
      rowsPerPage={listado.tamano}
      rowsPerPageOptions={[10, 20, 50, 100]}
      onPageChange={(_e, pagina) => listado.setPagina(pagina)}
      onRowsPerPageChange={(e) => listado.setTamano(Number(e.target.value))}
      labelRowsPerPage={t('tabla.filasPorPagina')}
      labelDisplayedRows={({ from, to, count }) => t('tabla.rango', { desde: from, hasta: to, total: count })}
      getItemAriaLabel={(tipo) => t(`tabla.ir.${tipo}`)}
    />
  );

  if (listado.estado === 'error') {
    return <EstadoError problema={listado.problema} onReintentar={listado.recargar} />;
  }

  return (
    <Box aria-busy={listado.estado === 'cargando'}>
      {listado.estado === 'cargando' && <LinearProgress aria-label={t('estado.cargando')} />}
      {listado.datos && filas.length === 0 && listado.estado !== 'cargando' && <EstadoVacio mensaje={mensajeVacio} />}

      {filas.length > 0 && (movil ? (
        <Stack component="ul" spacing={2} aria-label={titulo} sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {filas.map((fila) => (
            <Card component="li" key={claveFila(fila)} variant="outlined">
              <CardContent>
                <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 2, rowGap: 0.5 }}>
                  {columnas.map((columna) => (
                    <Box key={columna.campo} sx={{ display: 'contents' }}>
                      <Typography component="dt" variant="body2" color="text.secondary">{columna.encabezado}</Typography>
                      <Typography component="dd" variant="body2" sx={{ m: 0, minWidth: 0, overflowWrap: 'anywhere' }}>
                        {celda(columna, fila)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
              {acciones && <CardActions sx={{ flexWrap: 'wrap' }}>{acciones(fila)}</CardActions>}
            </Card>
          ))}
        </Stack>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <Box component="caption" sx={OCULTO_VISUAL}>{titulo}</Box>
            <TableHead>
              <TableRow>
                {columnas.map((columna) => <TableCell key={columna.campo} scope="col">{columna.encabezado}</TableCell>)}
                {acciones && <TableCell scope="col" align="right">{t('tabla.acciones')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filas.map((fila) => (
                <TableRow key={claveFila(fila)} hover>
                  {columnas.map((columna) => <TableCell key={columna.campo}>{celda(columna, fila)}</TableCell>)}
                  {acciones && <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{acciones(fila)}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ))}
      {(listado.datos?.totalElementos ?? 0) > 0 && paginacion}
    </Box>
  );
}
