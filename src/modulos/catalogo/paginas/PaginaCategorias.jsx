/**
 * Nombre:                 PaginaCategorias.jsx
 * Descripción:            Pantalla de categorías del Administrador: alta, cambio de nombre y activación (RF-PRO-009).
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.4.0
 * @file
 */
import { useState } from 'react';
import { Box, Button, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import ToggleOnOutlined from '@mui/icons-material/ToggleOnOutlined';
import ToggleOffOutlined from '@mui/icons-material/ToggleOffOutlined';
import { useTranslation } from 'react-i18next';
import { useNotificar } from '../../../app/proveedores/ProveedorNotificaciones.jsx';
import { useListado } from '../../../compartido/hooks/useListado.js';
import { leerProblema } from '../../../servicios/api/problemas.js';
import { TablaPaginada } from '../../../compartido/componentes/tablas/TablaPaginada.jsx';
import { cambiarEstadoCategoria, listarCategoriasPaginadas } from '../servicios/catalogoServicio.js';
import { DialogoCategoria } from '../componentes/DialogoCategoria.jsx';

/**
 * Página de categorías.
 * @returns {import('react').JSX.Element} Gestión de categorías.
 */
export default function PaginaCategorias() {
  const { t } = useTranslation();
  const notificar = useNotificar();
  const listado = useListado(listarCategoriasPaginadas);
  const [edicion, setEdicion] = useState(null);

  const alternar = async (c) => {
    try {
      await cambiarEstadoCategoria(c.id, !c.activa);
      notificar(t(c.activa ? 'catalogo:avisos.categoriaDesactivada' : 'catalogo:avisos.categoriaActivada', { nombre: c.nombre }));
      listado.recargar();
    } catch (excepcion) {
      notificar(leerProblema(excepcion).detalle ?? t('estado.error'), 'error');
    }
  };

  const columnas = [
    { campo: 'nombre', encabezado: t('catalogo:campos.nombre') },
    {
      campo: 'estado', encabezado: t('catalogo:campos.estado'),
      render: (c) => (c.activa ? <Chip size="small" color="success" label={t('catalogo:estado.activa')} />
        : <Chip size="small" variant="outlined" label={t('catalogo:estado.inactiva')} />),
    },
  ];

  const acciones = (c) => {
    const etiqueta = c.activa ? t('catalogo:acciones.desactivar') : t('catalogo:acciones.activar');
    return (
      <>
        <Tooltip title={t('acciones.editar')}>
          <IconButton aria-label={`${t('acciones.editar')} ${c.nombre}`} onClick={() => setEdicion({ categoria: c })}>
            <EditOutlined />
          </IconButton>
        </Tooltip>
        <Tooltip title={etiqueta}>
          <IconButton aria-label={`${etiqueta} ${c.nombre}`} onClick={() => alternar(c)}>
            {c.activa ? <ToggleOnOutlined color="success" /> : <ToggleOffOutlined />}
          </IconButton>
        </Tooltip>
      </>
    );
  };

  return (
    <Stack spacing={3}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h1">{t('catalogo:categorias.titulo')}</Typography>
        <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setEdicion({ categoria: null })}>
          {t('catalogo:acciones.nuevaCategoria')}
        </Button>
      </Box>
      <Typography color="text.secondary">{t('catalogo:categorias.ayuda')}</Typography>
      <TablaPaginada titulo={t('catalogo:categorias.titulo')} columnas={columnas} listado={listado} acciones={acciones}
        mensajeVacio={t('catalogo:categorias.vacio')} />
      {edicion && (
        <DialogoCategoria categoria={edicion.categoria} onCerrar={() => setEdicion(null)}
          onGuardada={(guardada, esNueva) => {
            setEdicion(null);
            notificar(t(esNueva ? 'catalogo:avisos.categoriaCreada' : 'catalogo:avisos.categoriaActualizada', { nombre: guardada.nombre }));
            listado.recargar();
          }} />
      )}
    </Stack>
  );
}
