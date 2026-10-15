/**
 * Nombre:                 DetalleDocumento.jsx
 * Descripción:            Presentación del detalle de un documento: datos generales, tabla de líneas (tarjetas en móvil) y totales.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.8.0
 * @file
 */
import { Box, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

/**
 * @param {{datos: {etiqueta: string, valor: import('react').ReactNode}[],
 *   columnas: {campo: string, encabezado: string, numerica?: boolean, render: (linea: object) => import('react').ReactNode}[],
 *   lineas: object[], titulo: string,
 *   totales: {etiqueta: string, valor: string, destacado?: boolean}[]}} props - Propiedades.
 * @returns {import('react').JSX.Element} Detalle.
 */
export function DetalleDocumento({ datos, columnas, lineas, titulo, totales }) {
  const tema = useTheme();
  const movil = useMediaQuery(tema.breakpoints.down('md'));
  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box component="dl" sx={{ m: 0, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
          {datos.map((d) => (
            <Box key={d.etiqueta}>
              <Typography component="dt" variant="body2" color="text.secondary">{d.etiqueta}</Typography>
              <Typography component="dd" sx={{ m: 0, overflowWrap: 'anywhere' }}>{d.valor}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>
      <Typography variant="h2">{titulo}</Typography>
      {movil ? (
        <Stack component="ul" aria-label={titulo} spacing={1} sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {lineas.map((l) => (
            <Paper component="li" key={l.id} variant="outlined" sx={{ p: 1.5 }}>
              {columnas.map((c) => (
                <Box key={c.campo} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">{c.encabezado}</Typography>
                  <Typography variant="body2" sx={{ textAlign: 'right', overflowWrap: 'anywhere' }}>{c.render(l)}</Typography>
                </Box>
              ))}
            </Paper>
          ))}
        </Stack>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label={titulo}>
            <TableHead>
              <TableRow>{columnas.map((c) => <TableCell key={c.campo} align={c.numerica ? 'right' : 'left'}>{c.encabezado}</TableCell>)}</TableRow>
            </TableHead>
            <TableBody>
              {lineas.map((l) => (
                <TableRow key={l.id}>{columnas.map((c) => <TableCell key={c.campo} align={c.numerica ? 'right' : 'left'}>{c.render(l)}</TableCell>)}</TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Paper variant="outlined" sx={{ p: 2, alignSelf: { md: 'flex-end' }, minWidth: { md: 320 } }}>
        {totales.map((x) => (
          <Box key={x.etiqueta} sx={{ display: 'flex', justifyContent: 'space-between', gap: 3 }}>
            <Typography sx={{ fontWeight: x.destacado ? 700 : 400 }}>{x.etiqueta}</Typography>
            <Typography sx={{ fontWeight: x.destacado ? 700 : 400 }} data-testid={x.destacado ? 'total-documento' : undefined}>{x.valor}</Typography>
          </Box>
        ))}
      </Paper>
    </Stack>
  );
}
