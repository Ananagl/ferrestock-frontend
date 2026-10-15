/**
 * Nombre:                 PaginaComprobante.jsx
 * Descripción:            Comprobante imprimible con encabezado del negocio, datos, líneas, totales y la leyenda de documento simulado; al imprimir se oculta la interfaz (RF-DOC-002 a 004).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.10.0
 * @file
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, GlobalStyles, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import PrintOutlined from '@mui/icons-material/PrintOutlined';
import { useTranslation } from 'react-i18next';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { formatoCantidad, formatoFechaHora, formatoMoneda } from '../../../compartido/utilidades/formato.js';
import { Cargando } from '../../../compartido/componentes/retroalimentacion/Cargando.jsx';
import { obtenerComprobante } from '../servicios/comprobantesServicio.js';

/** Al imprimir solo queda el comprobante (sin menú, encabezado ni botones). */
const ESTILOS_IMPRESION = {
  '@media print': {
    'header, nav, .no-imprimir': { display: 'none !important' },
    body: { background: 'white' },
    main: { padding: '0 !important', margin: '0 !important' },
  },
};

/**
 * Página del comprobante.
 * @returns {import('react').JSX.Element} Comprobante imprimible.
 */
export default function PaginaComprobante() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const { tipo, consecutivo } = useParams();
  const navegar = useNavigate();
  const [comprobante, setComprobante] = useState(null);
  const [problema, setProblema] = useState(null);

  useEffect(() => {
    obtenerComprobante(tipo, consecutivo).then(setComprobante).catch((e) => setProblema(leerProblema(e)));
  }, [tipo, consecutivo, i18n.resolvedLanguage]);

  const volver = (
    <Button className="no-imprimir" onClick={() => navegar(-1)} startIcon={<ArrowBackOutlined />}>{t('comprobantes:acciones.volver')}</Button>
  );
  if (problema) {
    const mensaje = problema.estado === 404 ? t('documentos:noExiste') : problema.detalle ?? t('estado.error');
    return <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>{volver}<Alert severity="error">{mensaje}</Alert></Stack>;
  }
  if (!comprobante) return <Cargando />;

  const c = comprobante;
  const conValores = c.lineas.some((l) => l.valorUnitario != null);
  return (
    <Stack spacing={2}>
      <GlobalStyles styles={ESTILOS_IMPRESION} />
      <Box className="no-imprimir" sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        {volver}
        <Button variant="contained" startIcon={<PrintOutlined />} onClick={() => window.print()}>{t('comprobantes:acciones.imprimir')}</Button>
      </Box>
      <Paper variant="outlined" component="article" aria-labelledby="comprobante-titulo" sx={{ p: { xs: 2, md: 4 }, maxWidth: 820, width: '100%', mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.15rem' }}>{c.negocio.nombre}</Typography>
            <Typography variant="body2">NIT {c.negocio.nit}</Typography>
            <Typography variant="body2">{c.negocio.direccion}</Typography>
          </Box>
          <Box sx={{ textAlign: { sm: 'right' } }}>
            <Typography variant="h1" id="comprobante-titulo" sx={{ fontSize: '1.4rem' }}>
              {t(`comprobantes:tipos.${c.tipo}`)} {c.consecutivo}
            </Typography>
            <Typography variant="body2">{formatoFechaHora(c.fecha, idioma)}</Typography>
            {c.estado === 'ANULADA' && <Typography color="error" sx={{ fontWeight: 700 }}>{t('documentos:estados.ANULADA')}</Typography>}
          </Box>
        </Box>
        <Alert severity="warning" icon={false} data-testid="leyenda" sx={{ mb: 2, fontWeight: 700, justifyContent: 'center', textAlign: 'center' }}>
          {c.leyenda}
        </Alert>
        <Box component="dl" sx={{ m: 0, mb: 2, display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          {c.tercero && (
            <Box><Typography component="dt" variant="body2" color="text.secondary">{t(`comprobantes:tercero.${c.tipo}`)}</Typography>
              <Typography component="dd" sx={{ m: 0 }}>{c.tercero.nombre} — {c.tercero.documento}</Typography></Box>
          )}
          <Box><Typography component="dt" variant="body2" color="text.secondary">{t('comprobantes:campos.usuario')}</Typography>
            <Typography component="dd" sx={{ m: 0 }}>{c.usuario}</Typography></Box>
          {c.referencia && (
            <Box><Typography component="dt" variant="body2" color="text.secondary">{t(`comprobantes:referencia.${c.tipo}`)}</Typography>
              <Typography component="dd" sx={{ m: 0 }}>{c.referencia}</Typography></Box>
          )}
          {c.motivo && (
            <Box><Typography component="dt" variant="body2" color="text.secondary">{t('comprobantes:campos.motivo')}</Typography>
              <Typography component="dd" sx={{ m: 0 }}>{c.motivo}</Typography></Box>
          )}
        </Box>
        {/* Contenedor desplazable alcanzable con el teclado (WCAG 2.1.1): en móvil la tabla puede ser más ancha que la pantalla */}
        <Box sx={{ overflowX: 'auto' }} tabIndex={0} role="region" aria-label={t('documentos:lineas.titulo')}>
          <Table size="small" aria-label={t('documentos:lineas.titulo')}>
            <TableHead>
              <TableRow>
                <TableCell>{t('documentos:campos.producto')}</TableCell>
                <TableCell align="right">{t('documentos:campos.cantidad')}</TableCell>
                {conValores && <TableCell align="right">{t(`comprobantes:valor.${c.tipo}`)}</TableCell>}
                {c.total != null && <TableCell align="right">{t('documentos:campos.subtotal')}</TableCell>}
                {c.lineas.some((l) => l.detalle) && <TableCell>{t('comprobantes:campos.detalle')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {c.lineas.map((l) => (
                <TableRow key={l.codigo}>
                  <TableCell>{l.codigo} — {l.descripcion}</TableCell>
                  <TableCell align="right">{formatoCantidad(l.cantidad, idioma)}</TableCell>
                  {conValores && <TableCell align="right">{formatoMoneda(l.valorUnitario, idioma)}</TableCell>}
                  {c.total != null && <TableCell align="right">{formatoMoneda(l.subtotal, idioma)}</TableCell>}
                  {c.lineas.some((x) => x.detalle) && <TableCell>{t(`comprobantes:detalle.${l.detalle}`)}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        {c.total != null && (
          <Box sx={{ mt: 2, ml: 'auto', maxWidth: 320 }}>
            {[[t('documentos:campos.total'), c.total, true], [t('comprobantes:pago.recibido'), c.valorRecibido], [t('comprobantes:pago.cambio'), c.cambio]]
              .filter(([, valor]) => valor != null)
              .map(([etiqueta, valor, destacado]) => (
                <Box key={etiqueta} sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: destacado ? 700 : 400 }}>
                  <span>{etiqueta}</span><span data-testid={destacado ? 'total-comprobante' : undefined}>{formatoMoneda(valor, idioma)}</span>
                </Box>
              ))}
          </Box>
        )}
      </Paper>
    </Stack>
  );
}
