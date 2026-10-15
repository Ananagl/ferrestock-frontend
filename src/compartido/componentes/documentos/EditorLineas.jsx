/**
 * Nombre:                 EditorLineas.jsx
 * Descripción:            Editor de líneas de documento (compras, ventas y devoluciones) enlazado a Formik: agrega y quita filas; en pantallas pequeñas cada línea se apila como tarjeta.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.8.0
 * @file
 */
import { Box, Button, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import AddOutlined from '@mui/icons-material/AddOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import { FieldArray, getIn, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';

/** Clave estable de cada línea nueva: con el índice como clave, al quitar una línea los buscadores conservarían el texto de otra. */
let ultimaClave = 0;

/**
 * @typedef {object} ColumnaLinea
 * @property {string} clave - Identificador de la columna.
 * @property {string} ancho - Ancho en la cuadrícula de escritorio (por ejemplo "2fr" o "8rem").
 * @property {(indice: number, linea: object) => import('react').ReactNode} render - Contenido de la celda.
 */

/**
 * @param {{name?: string, columnas: ColumnaLinea[], nuevaLinea: () => object, textoAgregar: string,
 *   etiqueta: string, maximo?: number, sinAgregar?: boolean}} props - Propiedades.
 * @returns {import('react').JSX.Element} Editor.
 */
export function EditorLineas({ name = 'lineas', columnas, nuevaLinea, textoAgregar, etiqueta, maximo = 100, sinAgregar = false }) {
  const { t } = useTranslation();
  const { values, errors, submitCount } = useFormikContext();
  const lineas = getIn(values, name) ?? [];
  const errorGeneral = typeof getIn(errors, name) === 'string' && submitCount > 0 ? getIn(errors, name) : null;
  const plantilla = { md: `${columnas.map((c) => c.ancho).join(' ')} auto` };
  return (
    <FieldArray name={name}>
      {({ push, remove }) => (
        <Box component="section" aria-label={etiqueta}>
          <Stack spacing={1}>
            {lineas.map((linea, indice) => (
              <Paper key={linea.clave ?? `inicial-${indice}`} variant="outlined" role="group" aria-label={t('documentos:lineas.linea', { numero: indice + 1 })}
                sx={{ p: 1.5, display: 'grid', gap: 1.5, alignItems: 'start', gridTemplateColumns: { xs: '1fr', ...plantilla } }}>
                {columnas.map((c) => <Box key={c.clave} sx={{ minWidth: 0 }}>{c.render(indice, linea)}</Box>)}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: { md: 1 } }}>
                  <Tooltip title={t('documentos:lineas.quitar')}>
                    <span>
                      <IconButton aria-label={t('documentos:lineas.quitarNumero', { numero: indice + 1 })}
                        onClick={() => remove(indice)} disabled={lineas.length <= 1}>
                        <DeleteOutlined />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Paper>
            ))}
          </Stack>
          {errorGeneral && <Typography color="error" role="alert" variant="body2" sx={{ mt: 1 }}>{errorGeneral}</Typography>}
          {!sinAgregar && (
            <Button startIcon={<AddOutlined />} onClick={() => { ultimaClave += 1; push({ ...nuevaLinea(), clave: ultimaClave }); }} disabled={lineas.length >= maximo} sx={{ mt: 1 }}>
              {textoAgregar}
            </Button>
          )}
        </Box>
      )}
    </FieldArray>
  );
}
