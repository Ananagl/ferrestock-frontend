/**
 * Nombre:                 PaginaTerceros.jsx
 * Descripción:            Pantalla de clientes y proveedores: búsqueda, filtros, alta, edición y, para el ADMIN, activación (RF-TER).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.5.0
 * @file
 */
import { useEffect, useState } from 'react';
import {
  Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import ToggleOnOutlined from '@mui/icons-material/ToggleOnOutlined';
import ToggleOffOutlined from '@mui/icons-material/ToggleOffOutlined';
import { useTranslation } from 'react-i18next';
import { useSesion } from '../../../app/proveedores/ProveedorSesion.jsx';
import { useNotificar } from '../../../app/proveedores/ProveedorNotificaciones.jsx';
import { useListado } from '../../../compartido/hooks/useListado.js';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { formatoDocumento } from '../../../compartido/utilidades/nit.js';
import { TablaPaginada } from '../../../compartido/componentes/tablas/TablaPaginada.jsx';
import { DialogoConfirmacion } from '../../../compartido/componentes/retroalimentacion/DialogoConfirmacion.jsx';
import { cambiarEstadoTercero, listarTerceros } from '../servicios/tercerosServicio.js';
import { DialogoTercero } from '../componentes/DialogoTercero.jsx';

const ESPERA_BUSQUEDA_MS = 300;

/**
 * Lista desplegable de filtro.
 * @param {{id: string, etiqueta: string, valor: string, onCambio: (v: string) => void,
 *   opciones: {valor: string, texto: string}[]}} props - Propiedades.
 * @returns {import('react').JSX.Element} Filtro.
 */
function Filtro({ id, etiqueta, valor, onCambio, opciones }) {
  return (
    <FormControl size="small">
      <InputLabel id={`${id}-etiqueta`}>{etiqueta}</InputLabel>
      <Select labelId={`${id}-etiqueta`} id={id} label={etiqueta} value={valor} onChange={(e) => onCambio(e.target.value)}>
        {opciones.map((o) => <MenuItem key={o.valor} value={o.valor}>{o.texto}</MenuItem>)}
      </Select>
    </FormControl>
  );
}

/**
 * Página de clientes y proveedores.
 * @returns {import('react').JSX.Element} Gestión de terceros.
 */
export default function PaginaTerceros() {
  const { t } = useTranslation();
  const { usuario } = useSesion();
  const esAdmin = usuario.rol === 'ADMIN';
  const notificar = useNotificar();
  const listado = useListado(listarTerceros, { q: '', rol: '', tipoPersona: '', activo: '' });
  const { filtros, setFiltros } = listado;
  const [texto, setTexto] = useState('');
  const [edicion, setEdicion] = useState(null);
  const [aCambiarEstado, setACambiarEstado] = useState(null);

  useEffect(() => {
    const espera = setTimeout(() => {
      if (texto !== filtros.q) setFiltros({ ...filtros, q: texto });
    }, ESPERA_BUSQUEDA_MS);
    return () => clearTimeout(espera);
  }, [texto, filtros, setFiltros]);

  const todos = { valor: '', texto: t('terceros:filtros.todos') };
  const columnas = [
    { campo: 'documento', encabezado: t('terceros:campos.documento'),
      render: (x) => <Box component="span" sx={{ whiteSpace: 'nowrap' }}>{formatoDocumento(x)}</Box> },
    { campo: 'nombre', encabezado: t('terceros:campos.nombre') },
    { campo: 'tipoPersona', encabezado: t('terceros:campos.tipoPersona'), secundaria: true,
      render: (x) => t(`terceros:personas.${x.tipoPersona}`) },
    {
      campo: 'roles', encabezado: t('terceros:campos.roles'),
      render: (x) => (
        <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {x.esCliente && <Chip size="small" color="info" variant="outlined" label={t('terceros:roles.cliente')} />}
          {x.esProveedor && <Chip size="small" color="secondary" variant="outlined" label={t('terceros:roles.proveedor')} />}
        </Stack>
      ),
    },
    { campo: 'contacto', encabezado: t('terceros:campos.contacto'), secundaria: true,
      render: (x) => [x.telefono, x.correo].filter(Boolean).join(' · ') || '—' },
    { campo: 'estado', encabezado: t('terceros:campos.estado'),
      render: (x) => (x.activo ? <Chip size="small" color="success" label={t('terceros:estado.activo')} />
        : <Chip size="small" variant="outlined" label={t('terceros:estado.inactivo')} />) },
  ];

  const acciones = (x) => {
    const etiquetaEstado = x.activo ? t('terceros:acciones.desactivar') : t('terceros:acciones.activar');
    return (
      <>
        <Tooltip title={t('acciones.editar')}>
          <IconButton aria-label={`${t('acciones.editar')} ${x.nombre}`} onClick={() => setEdicion({ tercero: x })}>
            <EditOutlined />
          </IconButton>
        </Tooltip>
        {esAdmin && (
          <Tooltip title={etiquetaEstado}>
            <IconButton aria-label={`${etiquetaEstado} ${x.nombre}`} onClick={() => setACambiarEstado(x)}>
              {x.activo ? <ToggleOnOutlined color="success" /> : <ToggleOffOutlined />}
            </IconButton>
          </Tooltip>
        )}
      </>
    );
  };

  const confirmarEstado = async () => {
    const x = aCambiarEstado;
    try {
      await cambiarEstadoTercero(x.id, !x.activo);
      notificar(t(x.activo ? 'terceros:avisos.desactivado' : 'terceros:avisos.activado', { nombre: x.nombre }));
      listado.recargar();
    } catch (excepcion) {
      notificar(leerProblema(excepcion).detalle ?? t('estado.error'), 'error');
    } finally {
      setACambiarEstado(null);
    }
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h1">{t('terceros:titulo')}</Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setEdicion({ tercero: null })}>
          {t('terceros:acciones.nuevo')}
        </Button>
      </Box>

      <Box component="search" aria-label={t('terceros:filtros.etiqueta')}
        sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr' } }}>
        <TextField label={t('terceros:filtros.buscar')} value={texto} onChange={(e) => setTexto(e.target.value)}
          type="search" size="small" />
        <Filtro id="filtro-rol" etiqueta={t('terceros:campos.rol')} valor={filtros.rol}
          onCambio={(v) => setFiltros({ ...filtros, rol: v })}
          opciones={[todos, { valor: 'CLIENTE', texto: t('terceros:roles.clientes') }, { valor: 'PROVEEDOR', texto: t('terceros:roles.proveedores') }]} />
        <Filtro id="filtro-persona" etiqueta={t('terceros:campos.tipoPersona')} valor={filtros.tipoPersona}
          onCambio={(v) => setFiltros({ ...filtros, tipoPersona: v })}
          opciones={[todos, { valor: 'NATURAL', texto: t('terceros:personas.NATURAL') }, { valor: 'JURIDICA', texto: t('terceros:personas.JURIDICA') }]} />
        <Filtro id="filtro-estado" etiqueta={t('terceros:campos.estado')} valor={filtros.activo}
          onCambio={(v) => setFiltros({ ...filtros, activo: v })}
          opciones={[todos, { valor: 'true', texto: t('terceros:estado.activo') }, { valor: 'false', texto: t('terceros:estado.inactivo') }]} />
      </Box>

      <TablaPaginada titulo={t('terceros:titulo')} columnas={columnas} listado={listado} acciones={acciones}
        mensajeVacio={t('terceros:vacio')} />

      {edicion && (
        <DialogoTercero tercero={edicion.tercero} onCerrar={() => setEdicion(null)}
          onGuardado={(guardado, esNuevo) => {
            setEdicion(null);
            notificar(t(esNuevo ? 'terceros:avisos.creado' : 'terceros:avisos.actualizado', { nombre: guardado.nombre }));
            listado.recargar();
          }} />
      )}
      <DialogoConfirmacion
        abierto={Boolean(aCambiarEstado)}
        titulo={aCambiarEstado?.activo ? t('terceros:confirmar.tituloDesactivar') : t('terceros:confirmar.tituloActivar')}
        mensaje={aCambiarEstado?.activo ? t('terceros:confirmar.desactivar', { nombre: aCambiarEstado?.nombre })
          : t('terceros:confirmar.activar', { nombre: aCambiarEstado?.nombre })}
        textoConfirmar={aCambiarEstado?.activo ? t('terceros:acciones.desactivar') : t('terceros:acciones.activar')}
        color={aCambiarEstado?.activo ? 'error' : 'primary'}
        onConfirmar={confirmarEstado}
        onCancelar={() => setACambiarEstado(null)} />
    </Stack>
  );
}
