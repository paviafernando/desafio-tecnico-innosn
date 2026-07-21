import { z } from "zod";

const tipoCampoFormularioSchema = z.enum([
  "texto",
  "texto_largo",
  "numero",
  "fecha",
  "email",
  "telefono",
  "select",
  "checkbox",
  "archivo",
]);

const validacionCampoSchema = z
  .object({
    patron: z.string().optional(),
    mensaje: z.string().optional(),
    tiposPermitidos: z.array(z.string()).optional(),
    tamanioMaximoMB: z.number().positive().optional(),
  })
  .optional();

const campoFormularioSchema = z.object({
  id: z.string().min(1),
  etiqueta: z.string().min(1),
  tipo: tipoCampoFormularioSchema,
  requerido: z.boolean(),
  opciones: z.array(z.string()).optional(),
  validacion: validacionCampoSchema,
});

const esquemaFormularioSchema = z.object({
  campos: z.array(campoFormularioSchema),
});

const flujoEstadosSchema = z.object({
  inicial: z.string().min(1),
  estados: z.array(z.string().min(1)),
  transiciones: z.record(z.string(), z.array(z.string())),
});

const archivoReferenciaSchema = z.object({
  nombre: z.string().min(1),
  url: z.string().min(1),
});

const contactoSchema = z.object({
  email: z.string().email().optional(),
  whatsapp: z.string().optional(),
  telefono: z.string().optional(),
});

export const loginAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const emitirSesionSchema = z.object({
  dni: z.string().min(1),
});

export const crearTipoTramiteSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().min(1),
  esquemaFormulario: esquemaFormularioSchema,
  flujoEstados: flujoEstadosSchema,
  categoria: z.string().optional(),
  requisitos: z.array(z.string()).optional(),
  pasos: z.array(z.string()).optional(),
  archivosReferencia: z.array(archivoReferenciaSchema).optional(),
  costo: z.string().optional(),
  modalidad: z.string().optional(),
  contacto: contactoSchema.optional(),
});

export const editarTipoTramiteSchema = crearTipoTramiteSchema.partial();

export const crearTramiteSchema = z.object({
  tipoTramiteId: z.string().min(1),
  datosFormulario: z.record(z.string(), z.unknown()),
});

export const cambiarEstadoSchema = z.object({
  nuevoEstado: z.string().min(1),
});

export const comentarioSchema = z.object({
  texto: z.string().min(1),
});
