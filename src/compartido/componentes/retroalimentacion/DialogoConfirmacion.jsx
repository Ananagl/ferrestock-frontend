/**
 * Nombre:                 DialogoConfirmacion.jsx
 * Descripción:            Diálogo accesible de confirmación para acciones importantes; el foco inicia en Cancelar.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.3.0
 * @file
 */
import { useRef, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useTranslation } from 'react-i18next';

/**
 * @param {{abierto: boolean, titulo: string, mensaje: string, textoConfirmar: string,
 *   color?: 'primary'|'error', onConfirmar: () => Promise<void>|void, onCancelar: () => void}} props - Propiedades.
 * @returns {import('react').JSX.Element} Diálogo.
 */
export function DialogoConfirmacion({ abierto, titulo, mensaje, textoConfirmar, color = 'primary', onConfirmar, onCancelar }) {
  const { t } = useTranslation();
  const [procesando, setProcesando] = useState(false);
  const botonCancelar = useRef(null);
  const confirmar = async () => {
    setProcesando(true);
    try {
      await onConfirmar();
    } finally {
      setProcesando(false);
    }
  };
  return (
    <Dialog open={abierto} onClose={procesando ? undefined : onCancelar} aria-labelledby="confirmacion-titulo"
      aria-describedby="confirmacion-mensaje"
      // El foco va a Cancelar cuando termina de abrirse, para que Enter no confirme por accidente
      slotProps={{ transition: { onEntered: () => botonCancelar.current?.focus() } }}>
      <DialogTitle id="confirmacion-titulo">{titulo}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirmacion-mensaje">{mensaje}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancelar} ref={botonCancelar} disabled={procesando}>{t('acciones.cancelar')}</Button>
        <Button onClick={confirmar} color={color} variant="contained" disabled={procesando}>{textoConfirmar}</Button>
      </DialogActions>
    </Dialog>
  );
}
