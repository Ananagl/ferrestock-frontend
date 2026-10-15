/**
 * Nombre:                 esquemas.js
 * Descripción:            Esquema Yup del formulario de terceros: documento según el tipo de persona, dígito de verificación del NIT y al menos un rol.
 * Fecha de creación:      2026-10-15
 * Fecha de actualización: 2026-10-15
 * Autores:                Ana Sofía Nagles García, María Mercedes Rincón Valencia, Juan David Camacho Tapiero
 * Versión:                0.5.0
 * @file
 */
import * as yup from 'yup';
import { calcularDigitoNit } from '../../../compartido/utilidades/nit.js';

/**
 * @param {import('i18next').TFunction} t - Traducción.
 * @param {boolean} esNuevo - En el alta se valida el documento; al editar no se cambia.
 * @returns {yup.ObjectSchema<any>} Esquema.
 */
export function crearEsquemaTercero(t, esNuevo) {
  const contacto = {
    nombre: yup.string().trim().required(t('validacion:obligatorio'))
      .min(2, t('validacion:longitud', { min: 2, max: 150 })).max(150, t('validacion:longitud', { min: 2, max: 150 })),
    telefono: yup.string().trim().matches(/^[0-9 +()-]{7,20}$/, { message: t('terceros:validacion.telefono'), excludeEmptyString: true }),
    correo: yup.string().trim().email(t('terceros:validacion.correo')).max(120, t('validacion:longitudMaxima', { max: 120 })),
    direccion: yup.string().max(200, t('validacion:longitudMaxima', { max: 200 })),
    esCliente: yup.boolean().test('algun-rol', t('terceros:validacion.rol'),
      (valor, contexto) => Boolean(valor || contexto.parent.esProveedor)),
    esProveedor: yup.boolean(),
  };
  if (!esNuevo) return yup.object(contacto);
  return yup.object({
    tipoPersona: yup.string().oneOf(['NATURAL', 'JURIDICA']).required(t('validacion:obligatorio')),
    tipoDocumento: yup.string().required(t('validacion:obligatorio'))
      .test('juridica-nit', t('terceros:validacion.juridicaNit'),
        (valor, contexto) => contexto.parent.tipoPersona !== 'JURIDICA' || valor === 'NIT'),
    numeroDocumento: yup.string().trim().required(t('validacion:obligatorio'))
      .matches(/^\d{5,15}$/, t('terceros:validacion.numero')),
    digitoVerificacion: yup.string().trim().when('tipoDocumento', {
      is: 'NIT',
      then: (esquema) => esquema.required(t('validacion:obligatorio')).matches(/^\d$/, t('terceros:validacion.dvFormato'))
        .test('dv', t('terceros:validacion.dv'),
          (valor, contexto) => calcularDigitoNit(contexto.parent.numeroDocumento) === Number(valor)),
      otherwise: (esquema) => esquema.strip(),
    }),
    ...contacto,
  });
}
