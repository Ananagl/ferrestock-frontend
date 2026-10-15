/**
 * Nombre:                 PaginaAuditoria.jsx
 * Descripción:            Consulta de auditoría para el ADMIN con filtros por usuario, acción, fechas y texto (RF-AUD-002); los eventos no se pueden editar ni borrar.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.10.0
 * @file
 */
import { useEffect, useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useListado } from '../../../compartido/hooks/useListado.js';
import { formatoFechaHora } from '../../../compartido/utilidades/formato.js';
import { TablaPaginada } from '../../../compartido/componentes/tablas/TablaPaginada.jsx';
import { listarUsuarios } from '../../usuarios/servicios/usuariosServicio.js';
import { consultarAuditoria } from '../servicios/auditoriaServicio.js';

/** Acciones auditadas que se ofrecen como filtro (las demás se encuentran con el texto). */
const ACCIONES = Object.freeze([
  'LOGIN_EXITOSO', 'LOGIN_FALLIDO', 'CUENTA_BLOQUEADA', 'ACCESO_DENEGADO', 'USUARIO_CREADO', 'PRODUCTO_CREADO',
  'PRECIO_MODIFICADO', 'TERCERO_CREADO', 'AJUSTE_REGISTRADO', 'COMPRA_REGISTRADA', 'COMPRA_ANULADA', 'VENTA_REGISTRADA',
  'VENTA_ANULADA', 'DEVOLUCION_REGISTRADA', 'DEVOLUCION_SIN_VENTA',
]);

/**
 * Página de auditoría.
 * @returns {import('react').JSX.Element} Consulta de eventos.
 */
export default function PaginaAuditoria() {
  const { t, i18n } = useTranslation();
  const idioma = i18n.resolvedLanguage;
  const listado = useListado(consultarAuditoria, { usuarioId: '', accion: '', desde: '', hasta: '', q: '' });
  const { filtros, setFiltros } = listado;
  const [usuarios, setUsuarios] = useState([]);
  const [texto, setTexto] = useState('');

  useEffect(() => {
    listarUsuarios({ pagina: 0, tamano: 100 }).then((p) => setUsuarios(p.contenido)).catch(() => setUsuarios([]));
  }, []);
  useEffect(() => {
    const espera = setTimeout(() => { if (texto !== filtros.q) setFiltros({ ...filtros, q: texto }); }, 300);
    return () => clearTimeout(espera);
  }, [texto, filtros, setFiltros]);

  const columnas = [
    { campo: 'fecha', encabezado: t('auditoria:campos.fecha'), render: (e) => formatoFechaHora(e.fecha, idioma) },
    { campo: 'nombreUsuario', encabezado: t('auditoria:campos.usuario'), render: (e) => e.nombreUsuario ?? '—' },
    { campo: 'accion', encabezado: t('auditoria:campos.accion'),
      render: (e) => <Box component="span" sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{e.accion}</Box> },
    { campo: 'descripcion', encabezado: t('auditoria:campos.descripcion') },
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h1">{t('auditoria:titulo')}</Typography>
        <Typography color="text.secondary">{t('auditoria:subtitulo')}</Typography>
      </Box>
      <Box component="search" aria-label={t('auditoria:filtros')}
        sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr 1fr' } }}>
        <FormControl size="small">
          <InputLabel id="filtro-usuario-etiqueta">{t('auditoria:campos.usuario')}</InputLabel>
          <Select labelId="filtro-usuario-etiqueta" id="filtro-usuario" label={t('auditoria:campos.usuario')} value={filtros.usuarioId}
            onChange={(e) => setFiltros({ ...filtros, usuarioId: e.target.value })}>
            <MenuItem value="">{t('documentos:filtros.todos')}</MenuItem>
            {usuarios.map((u) => <MenuItem key={u.id} value={u.id}>{u.nombreUsuario}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel id="filtro-accion-etiqueta">{t('auditoria:campos.accion')}</InputLabel>
          <Select labelId="filtro-accion-etiqueta" id="filtro-accion" label={t('auditoria:campos.accion')} value={filtros.accion}
            onChange={(e) => setFiltros({ ...filtros, accion: e.target.value })}>
            <MenuItem value="">{t('documentos:filtros.todos')}</MenuItem>
            {ACCIONES.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField type="date" size="small" label={t('documentos:filtros.desde')} value={filtros.desde}
          onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField type="date" size="small" label={t('documentos:filtros.hasta')} value={filtros.hasta}
          onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField size="small" type="search" label={t('auditoria:buscar')} value={texto} onChange={(e) => setTexto(e.target.value)} />
      </Box>
      <TablaPaginada titulo={t('auditoria:titulo')} columnas={columnas} listado={listado} mensajeVacio={t('auditoria:vacio')} />
    </Stack>
  );
}
