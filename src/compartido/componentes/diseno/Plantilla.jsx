/**
 * Nombre:                 Plantilla.jsx
 * Descripción:            Plantilla de las pantallas autenticadas: barra superior, menú lateral por rol (permanente en escritorio, desplegable en móvil), menú de usuario y área de contenido accesible.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
 * @file
 */
import { useEffect, useRef, useState } from 'react';
import { Link as EnlaceRuta, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar, Box, Divider, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem,
  Toolbar, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuOutlined from '@mui/icons-material/MenuOutlined';
import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined';
import { useTranslation } from 'react-i18next';
import { useSesion } from '../../../app/proveedores/ProveedorSesion.jsx';
import { opcionesPara } from '../../../app/rutas/menu.js';
import { RUTA_CAMBIO_CONTRASENA } from '../../../app/rutas/RutaProtegida.jsx';
import { SelectorIdioma } from './SelectorIdioma.jsx';
import { BotonTema } from './BotonTema.jsx';
import { SaltoAlContenido } from './SaltoAlContenido.jsx';

/** Ancho del menú lateral en escritorio. */
const ANCHO_MENU = 248;

/**
 * Plantilla principal.
 * @returns {import('react').JSX.Element} Estructura con menú y contenido.
 */
export function Plantilla() {
  const { t } = useTranslation();
  const tema = useTheme();
  const escritorio = useMediaQuery(tema.breakpoints.up('md'));
  const { usuario, cerrarSesion } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const contenido = useRef(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [anclaUsuario, setAnclaUsuario] = useState(null);
  const primeraCarga = useRef(true);

  const conMenu = !usuario.debeCambiarPassword;
  const opciones = conMenu ? opcionesPara(usuario.rol) : [];

  // Al cambiar de pantalla, el foco va al contenido (lectores de pantalla) y se cierra el menú móvil
  useEffect(() => {
    if (primeraCarga.current) {
      primeraCarga.current = false;
      return;
    }
    contenido.current?.focus();
    setMenuAbierto(false);
  }, [ubicacion.pathname]);

  const salir = async () => {
    setAnclaUsuario(null);
    await cerrarSesion();
    navegar('/ingresar', { replace: true });
  };

  const listaMenu = (
    <Box component="nav" aria-label={t('menu.etiqueta')}>
      <Toolbar />
      <List>
        {opciones.map(({ ruta, clave, icono: Icono }) => {
          const activa = ruta === '/' ? ubicacion.pathname === '/' : ubicacion.pathname.startsWith(ruta);
          return (
            <ListItem key={ruta} disablePadding>
              <ListItemButton component={EnlaceRuta} to={ruta} selected={activa}
                aria-current={activa ? 'page' : undefined}>
                <ListItemIcon><Icono /></ListItemIcon>
                <ListItemText primary={t(clave)} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <SaltoAlContenido />
      <AppBar position="fixed" color="default" elevation={1} component="header"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1 }}>
          {conMenu && !escritorio && (
            <IconButton edge="start" color="inherit" aria-label={t('menu.abrir')} aria-expanded={menuAbierto}
              aria-controls="menu-principal" onClick={() => setMenuAbierto(true)}>
              <MenuOutlined />
            </IconButton>
          )}
          <Typography component="p" variant="h6" color="primary" sx={{ fontWeight: 700, flexGrow: 1 }}>
            {t('app.nombre')}
          </Typography>
          {escritorio && <SelectorIdioma />}
          <BotonTema />
          <IconButton color="inherit" aria-label={t('usuario.menu', { nombre: usuario.nombreCompleto })}
            aria-haspopup="menu" aria-controls="menu-usuario" onClick={(e) => setAnclaUsuario(e.currentTarget)}>
            <AccountCircleOutlined />
          </IconButton>
          <Menu id="menu-usuario" anchorEl={anclaUsuario} open={Boolean(anclaUsuario)}
            onClose={() => setAnclaUsuario(null)}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography sx={{ fontWeight: 600 }}>{usuario.nombreCompleto}</Typography>
              <Typography variant="body2" color="text.secondary">{t(`rol.${usuario.rol}`)}</Typography>
            </Box>
            <Divider />
            {!escritorio && <Box sx={{ px: 2, py: 1 }}><SelectorIdioma alCambiar={() => setAnclaUsuario(null)} /></Box>}
            <MenuItem onClick={() => { setAnclaUsuario(null); navegar(RUTA_CAMBIO_CONTRASENA); }}>
              {t('usuario.cambiarContrasena')}
            </MenuItem>
            <MenuItem onClick={salir}>{t('usuario.cerrarSesion')}</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {conMenu && (
        <Drawer
          id="menu-principal"
          variant={escritorio ? 'permanent' : 'temporary'}
          open={escritorio || menuAbierto}
          onClose={() => setMenuAbierto(false)}
          sx={{ width: ANCHO_MENU, flexShrink: 0, '& .MuiDrawer-paper': { width: ANCHO_MENU, boxSizing: 'border-box' } }}
        >
          {listaMenu}
        </Drawer>
      )}

      <Box component="main" id="contenido" ref={contenido} tabIndex={-1}
        sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 4 }, outline: 'none' }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
