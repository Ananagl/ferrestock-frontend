/**
 * Nombre:                 PaginaBaseTecnica.jsx
 * Descripción:            Pantalla neutra de la Fase 3: confirma que la aplicación arranca, aplica el tema y el idioma,
 *                         y verifica la comunicación con el backend. Maneja los estados de carga, éxito y error.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.1.0
 * @file
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Alert, AppBar, Box, Button, Card, CardContent, CircularProgress, Container, IconButton, Stack, Toolbar, Tooltip,
  Typography,
} from '@mui/material';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import { useTranslation } from 'react-i18next';
import { backendDisponible } from '../../../servicios/api/clienteHttp.js';
import { SelectorIdioma } from '../../../compartido/componentes/diseno/SelectorIdioma.jsx';
import { SaltoAlContenido } from '../../../compartido/componentes/diseno/SaltoAlContenido.jsx';
import { useModoTema } from '../../../app/proveedores/ProveedorTema.jsx';

/**
 * Página inicial temporal de la base técnica.
 * @returns {import('react').JSX.Element} Página con el estado de conexión al backend.
 */
export function PaginaBaseTecnica() {
  const { t } = useTranslation();
  const { modo, alternarModo } = useModoTema();
  /** @type {['cargando'|'conectado'|'error', Function]} */
  const [estado, setEstado] = useState('cargando');

  const verificar = useCallback(async () => {
    setEstado('cargando');
    try {
      setEstado((await backendDisponible()) ? 'conectado' : 'error');
    } catch {
      setEstado('error');
    }
  }, []);

  useEffect(() => {
    // La verificación es asíncrona: el estado cambia cuando responde el backend
    // eslint-disable-next-line react-hooks/set-state-in-effect
    verificar();
  }, [verificar]);

  const etiquetaTema = modo === 'dark' ? t('tema.alternarClaro') : t('tema.alternarOscuro');

  return (
    <>
      <SaltoAlContenido />
      <AppBar position="static" color="default" elevation={0} component="header">
        <Toolbar sx={{ gap: 2, flexWrap: 'wrap', py: 1 }}>
          <Typography component="p" variant="h6" color="primary" sx={{ fontWeight: 700, flexGrow: 1 }}>
            {t('app.nombre')}
          </Typography>
          <SelectorIdioma />
          <Tooltip title={etiquetaTema}>
            <IconButton onClick={alternarModo} aria-label={etiquetaTema}>
              {modo === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container component="main" id="contenido" tabIndex={-1} maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h1" gutterBottom>{t('baseTecnica.titulo')}</Typography>
            <Typography color="text.secondary">{t('app.lema')}</Typography>
          </Box>
          <Typography>{t('baseTecnica.descripcion')}</Typography>

          <Card variant="outlined" component="section" aria-labelledby="titulo-estado">
            <CardContent>
              <Typography id="titulo-estado" variant="h2" gutterBottom>{t('baseTecnica.estadoBackend')}</Typography>
              <Box aria-live="polite" data-testid="estado-backend">
                {estado === 'cargando' && (
                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <CircularProgress size={24} aria-hidden="true" />
                    <Typography>{t('baseTecnica.verificando')}</Typography>
                  </Stack>
                )}
                {estado === 'conectado' && <Alert severity="success">{t('baseTecnica.conectado')}</Alert>}
                {estado === 'error' && (
                  <Alert
                    severity="error"
                    action={<Button color="inherit" size="small" onClick={verificar}>{t('baseTecnica.reintentar')}</Button>}
                  >
                    {t('baseTecnica.sinConexion')}
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </>
  );
}
