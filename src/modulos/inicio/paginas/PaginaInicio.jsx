/**
 * Nombre:                 PaginaInicio.jsx
 * Descripción:            Pantalla de inicio tras ingresar: saludo, rol y accesos rápidos según el menú del rol.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.2.0
 * @file
 */
import { useState } from 'react';
import { Link as EnlaceRuta, useLocation } from 'react-router-dom';
import { Alert, Card, CardActionArea, CardContent, Grid, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSesion } from '../../../app/proveedores/ProveedorSesion.jsx';
import { opcionesPara } from '../../../app/rutas/menu.js';

/**
 * Página de inicio.
 * @returns {import('react').JSX.Element} Bienvenida y accesos.
 */
export default function PaginaInicio() {
  const { t } = useTranslation();
  const { usuario } = useSesion();
  const ubicacion = useLocation();
  const [aviso] = useState(ubicacion.state?.aviso ?? null);
  const accesos = opcionesPara(usuario.rol).filter((opcion) => opcion.ruta !== '/');

  return (
    <Stack spacing={3}>
      {aviso && <Alert severity="success" role="status">{t(aviso)}</Alert>}
      <div>
        <Typography variant="h1" gutterBottom>{t('inicio.titulo', { nombre: usuario.nombreCompleto })}</Typography>
        <Typography color="text.secondary">{t('inicio.rol', { rol: t(`rol.${usuario.rol}`) })}</Typography>
      </div>
      <Typography component="h2" variant="h2">{t('inicio.accesos')}</Typography>
      <Grid container spacing={2} component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {accesos.map(({ ruta, clave, icono: Icono }) => (
          <Grid key={ruta} size={{ xs: 12, sm: 6, lg: 4 }} component="li">
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardActionArea component={EnlaceRuta} to={ruta} sx={{ height: '100%' }}>
                <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Icono color="primary" aria-hidden="true" />
                  <Typography sx={{ fontWeight: 600 }}>{t(clave)}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
