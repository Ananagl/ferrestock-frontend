/**
 * Nombre:                 PaginaUsuarios.jsx
 * Descripción:            Pantalla de gestión de usuarios del Administrador: búsqueda, filtros, alta, edición, activación y restablecimiento de contraseña (RF-AUT-006).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.3.0
 * @file
 */
import { useEffect, useState } from 'react';
import {
  Box, Button, Chip, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Tooltip, Typography,
} from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import LockResetOutlined from '@mui/icons-material/LockResetOutlined';
import ToggleOnOutlined from '@mui/icons-material/ToggleOnOutlined';
import ToggleOffOutlined from '@mui/icons-material/ToggleOffOutlined';
import { useTranslation } from 'react-i18next';
import { useSesion } from '../../../app/proveedores/ProveedorSesion.jsx';
import { useNotificar } from '../../../app/proveedores/ProveedorNotificaciones.jsx';
import { useListado } from '../../../compartido/hooks/useListado.js';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { TablaPaginada } from '../../../compartido/componentes/tablas/TablaPaginada.jsx';
import { DialogoConfirmacion } from '../../../compartido/componentes/retroalimentacion/DialogoConfirmacion.jsx';
import { cambiarEstadoUsuario, listarUsuarios } from '../servicios/usuariosServicio.js';
import { DialogoUsuario } from '../componentes/DialogoUsuario.jsx';
import { DialogoRestablecer } from '../componentes/DialogoRestablecer.jsx';

/** Espera tras la última tecla antes de buscar. */
const ESPERA_BUSQUEDA_MS = 300;

/**
 * Página de usuarios.
 * @returns {import('react').JSX.Element} Gestión de usuarios.
 */
export default function PaginaUsuarios() {
  const { t } = useTranslation();
  const { usuario: yo } = useSesion();
  const notificar = useNotificar();
  const listado = useListado(listarUsuarios, { q: '', rol: '', activo: '' });
  const [texto, setTexto] = useState('');
  const [edicion, setEdicion] = useState(/** @type {{usuario: object|null}|null} */ (null));
  const [aRestablecer, setARestablecer] = useState(null);
  const [aCambiarEstado, setACambiarEstado] = useState(null);
  const { setFiltros, filtros } = listado;

  useEffect(() => {
    const espera = setTimeout(() => {
      if (texto !== filtros.q) setFiltros({ ...filtros, q: texto });
    }, ESPERA_BUSQUEDA_MS);
    return () => clearTimeout(espera);
  }, [texto, filtros, setFiltros]);

  const columnas = [
    { campo: 'nombreUsuario', encabezado: t('usuarios:campos.nombreUsuario') },
    { campo: 'nombreCompleto', encabezado: t('usuarios:campos.nombreCompleto') },
    { campo: 'rol', encabezado: t('usuarios:campos.rol'), render: (u) => t(`rol.${u.rol}`) },
    {
      campo: 'estado',
      encabezado: t('usuarios:campos.estado'),
      render: (u) => (
        <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Chip size="small" label={u.activo ? t('usuarios:estado.activo') : t('usuarios:estado.inactivo')}
            color={u.activo ? 'success' : 'default'} variant={u.activo ? 'filled' : 'outlined'} />
          {u.bloqueado && <Chip size="small" color="warning" label={t('usuarios:estado.bloqueado')} />}
          {u.debeCambiarPassword && <Chip size="small" variant="outlined" label={t('usuarios:estado.temporal')} />}
        </Stack>
      ),
    },
  ];

  const acciones = (u) => {
    const propio = u.id === yo.id;
    const etiquetaEstado = u.activo ? t('usuarios:acciones.desactivar') : t('usuarios:acciones.activar');
    return (
      <>
        <Tooltip title={t('acciones.editar')}>
          <IconButton aria-label={`${t('acciones.editar')} ${u.nombreUsuario}`} onClick={() => setEdicion({ usuario: u })}>
            <EditOutlined />
          </IconButton>
        </Tooltip>
        <Tooltip title={propio ? t('usuarios:ayuda.propio') : etiquetaEstado}>
          <span>
            <IconButton aria-label={`${etiquetaEstado} ${u.nombreUsuario}`} disabled={propio}
              onClick={() => setACambiarEstado(u)}>
              {u.activo ? <ToggleOnOutlined color="success" /> : <ToggleOffOutlined />}
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={propio ? t('usuarios:ayuda.propio') : t('usuarios:acciones.restablecer')}>
          <span>
            <IconButton aria-label={`${t('usuarios:acciones.restablecer')} ${u.nombreUsuario}`} disabled={propio}
              onClick={() => setARestablecer(u)}>
              <LockResetOutlined />
            </IconButton>
          </span>
        </Tooltip>
      </>
    );
  };

  const confirmarEstado = async () => {
    const u = aCambiarEstado;
    try {
      await cambiarEstadoUsuario(u.id, !u.activo);
      notificar(u.activo ? t('usuarios:avisos.desactivado', { usuario: u.nombreUsuario })
        : t('usuarios:avisos.activado', { usuario: u.nombreUsuario }));
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
        <Typography variant="h1">{t('usuarios:titulo')}</Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setEdicion({ usuario: null })}>
          {t('usuarios:acciones.nuevo')}
        </Button>
      </Box>

      <Box component="search" aria-label={t('usuarios:filtros.etiqueta')}
        sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' } }}>
        <TextField label={t('usuarios:filtros.buscar')} value={texto} onChange={(e) => setTexto(e.target.value)}
          type="search" size="small" />
        <FormControl size="small">
          <InputLabel id="filtro-rol-etiqueta">{t('usuarios:campos.rol')}</InputLabel>
          <Select labelId="filtro-rol-etiqueta" id="filtro-rol" label={t('usuarios:campos.rol')} value={filtros.rol}
            onChange={(e) => setFiltros({ ...filtros, rol: e.target.value })}>
            <MenuItem value="">{t('usuarios:filtros.todos')}</MenuItem>
            <MenuItem value="ADMIN">{t('rol.ADMIN')}</MenuItem>
            <MenuItem value="OPERATIVO">{t('rol.OPERATIVO')}</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel id="filtro-estado-etiqueta">{t('usuarios:campos.estado')}</InputLabel>
          <Select labelId="filtro-estado-etiqueta" id="filtro-estado" label={t('usuarios:campos.estado')}
            value={filtros.activo} onChange={(e) => setFiltros({ ...filtros, activo: e.target.value })}>
            <MenuItem value="">{t('usuarios:filtros.todos')}</MenuItem>
            <MenuItem value="true">{t('usuarios:estado.activo')}</MenuItem>
            <MenuItem value="false">{t('usuarios:estado.inactivo')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TablaPaginada titulo={t('usuarios:titulo')} columnas={columnas} listado={listado} acciones={acciones}
        mensajeVacio={t('usuarios:vacio')} />

      {edicion && (
        <DialogoUsuario abierto usuario={edicion.usuario} esPropio={edicion.usuario?.id === yo.id}
          onCerrar={() => setEdicion(null)}
          onGuardado={(guardado, esNuevo) => {
            setEdicion(null);
            notificar(esNuevo ? t('usuarios:avisos.creado', { usuario: guardado.nombreUsuario })
              : t('usuarios:avisos.actualizado', { usuario: guardado.nombreUsuario }));
            listado.recargar();
          }} />
      )}

      <DialogoRestablecer usuario={aRestablecer} onCerrar={() => setARestablecer(null)}
        onHecho={() => {
          notificar(t('usuarios:avisos.restablecido', { usuario: aRestablecer.nombreUsuario }));
          setARestablecer(null);
          listado.recargar();
        }} />

      <DialogoConfirmacion
        abierto={Boolean(aCambiarEstado)}
        titulo={aCambiarEstado?.activo ? t('usuarios:confirmar.tituloDesactivar') : t('usuarios:confirmar.tituloActivar')}
        mensaje={aCambiarEstado?.activo
          ? t('usuarios:confirmar.desactivar', { usuario: aCambiarEstado?.nombreUsuario })
          : t('usuarios:confirmar.activar', { usuario: aCambiarEstado?.nombreUsuario })}
        textoConfirmar={aCambiarEstado?.activo ? t('usuarios:acciones.desactivar') : t('usuarios:acciones.activar')}
        color={aCambiarEstado?.activo ? 'error' : 'primary'}
        onConfirmar={confirmarEstado}
        onCancelar={() => setACambiarEstado(null)} />
    </Stack>
  );
}
