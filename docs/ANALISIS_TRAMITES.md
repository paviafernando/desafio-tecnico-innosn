# Análisis de trámites municipales y diseño del esquema genérico

Este documento respalda con evidencia concreta las decisiones de modelado de `tipos_tramite` registradas en `docs/DECISIONES.md`. Releerlo solo si hace falta el detalle o la fuente de una decisión puntual.

## 1. Relevamiento del listado oficial

Fuente: https://www.sannicolasciudad.gob.ar/tramites

El sitio agrupa los trámites en 18 categorías (Bromatología, Catastro, Comercios, Deportes, Discapacidad, Firma Digital, Habilitaciones, Inmuebles, Juzgado de Faltas, Libre Deuda, Licencia de Conducir, Mesa de Entradas, Obras Privadas, OMIC, Pago de Tasas, Patentes y Rodados, Permisos y Solicitudes, Proveedores, Transporte), con un total aproximado de 90 trámites individuales.

Se inspeccionó en detalle la ficha de 5 trámites representativos de distinta complejidad y categoría:

| Trámite | Categoría | Complejidad |
|---|---|---|
| Carnet de Manipulador de Alimentos | Bromatología | Media (capacitación + examen) |
| Certificado de vivienda única o de no poseer bienes | Catastro | Baja (1 requisito, formulario simple) |
| Habilitación, anexo o transferencia de comercio o industria | Habilitaciones | Alta (múltiples sub-flujos, documentación variable por rubro) |
| Inscripción a becas deportivas | Deportes | Baja (gratuito, un solo archivo) |
| Licencia de conducir original | Licencia de Conducir | Media (costo fijo, examen, turno presencial) |

## 2. Patrón estructural común

Las 5 fichas, pese a pertenecer a áreas municipales distintas, comparten exactamente las mismas secciones, en el mismo orden:

1. **Título** del trámite.
2. **Descripción** breve (1-2 oraciones, en segunda persona: "Tenés que...").
3. **Requisitos**: lista de condiciones o documentación previa que el vecino debe tener antes de iniciar (no son campos de formulario — son prerrequisitos informativos).
4. **Pasos a seguir**: lista numerada del flujo esperado (a veces incluye pasos que no son parte del formulario, como "presentarse en el día/horario agendado").
5. **Archivos para descargar**: adjuntos de referencia provistos por el municipio (instructivos, manuales, formularios PDF, ordenanzas) — distintos de los archivos que el vecino sube.
6. **Costo**: texto libre. Varía entre "gratuito", un monto fijo ("$35.745"), o una remisión a "Ordenanza Fiscal y Tarifaria vigente".
7. **Modalidad / dónde se realiza**: online, presencial, o mixto (ej. Licencia de Conducir: gestión inicial por WhatsApp + presentación presencial obligatoria).
8. **Contacto**: email, WhatsApp, teléfono y dirección física — siempre presentes, con la misma dirección institucional (Av. Pte. Illia 1130) como constante en la mayoría de los trámites.
9. **CTA / enlace de inicio**: en varios casos deriva a un sistema externo propio (ej. `msn.habilitaciones.net`) en lugar de un formulario embebido — confirma que hoy no existe una plataforma unificada, que es exactamente el vacío que este proyecto cubre.

No se observó ningún trámite que se salga de este patrón. La variación entre trámites está en el **contenido** de cada sección (cuántos requisitos, cuántos pasos, qué campos), no en su **estructura**.

## 3. Estructura propuesta para `tipos_tramite`

Se traduce el patrón relevado en dos grupos de datos:

### a) Metadata informativa del trámite (no son inputs del vecino)

Justificación: son baratos de modelar (columnas de texto/jsonb) y elevan sustancialmente el realismo y la utilidad del panel de administración, permitiendo que un tipo de trámite se autodocumente igual que en el sitio real.

```
nombre                text
descripcion           text
categoria             text            -- agrupación libre, no requiere tabla propia
requisitos            jsonb           -- ["DNI original", "Ficha médica completa", ...]
pasos                 jsonb           -- ["Completar formulario", "Validación...", ...]
archivos_referencia   jsonb           -- [{ "nombre": "Instructivo...", "url": "..." }]
costo                 text            -- libre: "Gratuito" | "$35.745" | "Según ordenanza vigente"
modalidad             text            -- "online" | "presencial" | "mixta"
contacto              jsonb           -- { "email": "...", "whatsapp": "...", "telefono": "..." }
```

### b) Esquema del formulario (los campos que completa el vecino)

Tipos de campo identificados como suficientes para cubrir todo el relevamiento (DNI, fechas, direcciones, adjuntos, opciones cerradas, declaraciones juradas):

```json
{
  "campos": [
    { "id": "dni", "etiqueta": "DNI", "tipo": "texto", "requerido": true,
      "validacion": { "patron": "^[0-9]{7,8}$", "mensaje": "DNI inválido" } },
    { "id": "fecha_nacimiento", "etiqueta": "Fecha de nacimiento", "tipo": "fecha", "requerido": true },
    { "id": "email", "etiqueta": "Email de contacto", "tipo": "email", "requerido": true },
    { "id": "club", "etiqueta": "Club o deporte", "tipo": "select", "requerido": true,
      "opciones": ["Fútbol", "Básquet", "Natación", "Otro"] },
    { "id": "declaracion_jurada", "etiqueta": "Declaro que los datos son correctos", "tipo": "checkbox", "requerido": true },
    { "id": "ficha_medica", "etiqueta": "Ficha médica", "tipo": "archivo", "requerido": true,
      "validacion": { "tiposPermitidos": ["application/pdf", "image/jpeg", "image/png"], "tamanioMaximoMB": 15 } }
  ]
}
```

Tipos de campo soportados en el MVP: `texto`, `texto_largo`, `numero`, `fecha`, `email`, `telefono`, `select`, `checkbox`, `archivo`. Cubren el 100% de los campos observados en las fichas relevadas.

Esto cierra el pendiente abierto en `docs/DECISIONES.md` ("alcance exacto del esquema de formulario configurable").

## 4. Trámites propuestos para cargar en el motor

### Trámite principal (el "de referencia" pedido por el enunciado)

**Inscripción a becas deportivas** (categoría Deportes).

Justificación de la elección:
- Es gratuito y de bajo riesgo institucional (no involucra pagos, tasas ni habilitaciones legales), lo que simplifica la máquina de estados sin restarle realismo.
- Tiene un único archivo requerido (ficha médica), que cubre el requisito mínimo del enunciado.
- Se puede modelar naturalmente con 8+ campos sin forzar información artificial: datos del menor (nombre, apellido, DNI, fecha de nacimiento), datos de contacto de un adulto responsable (nombre, teléfono, email), club/deporte de interés, y declaración jurada — más el archivo.
- Flujo de estados simple y con semántica clara: `pendiente → en revisión → aprobado / rechazado`, con posibilidad de `documentación requerida` como estado intermedio (para pedir corrección de la ficha médica), que además sirve de demo de un estado no lineal para validar la máquina de estados.

Esquema de formulario propuesto (8 campos + 1 archivo):
1. Nombre y apellido del menor (texto)
2. DNI del menor (texto, con validación de patrón)
3. Fecha de nacimiento (fecha)
4. Nombre y apellido del adulto responsable (texto)
5. Teléfono de contacto (teléfono)
6. Email de contacto (email)
7. Club o deporte de interés (select)
8. Declaro que los datos son correctos (checkbox / declaración jurada)
9. Ficha médica (archivo)

### Trámites secundarios (para demostrar la genericidad del motor con datos de seed)

Se sugiere cargar además, sin desarrollarlos con la misma profundidad, 2 tipos más para que la demo/video muestre que el motor no está atado a un único caso:

- **Certificado de vivienda única o de no poseer bienes** (Catastro): formulario mínimo (2-3 campos + 1 archivo), útil para mostrar que el motor también sirve para trámites triviales sin sobrecargar el formulario.
- **Solicitud de permiso para eventos culturales** (Permisos y Solicitudes): formulario más denso (fecha del evento, lugar, descripción, cantidad de asistentes, responsable, plano/documentación del evento como archivo), útil para mostrar un flujo de estados con más pasos de revisión (ej. intervención de más de un área).

Estos dos son opcionales y de menor prioridad frente al trámite principal; se cargan solo si el tiempo restante del plazo de 48-72 horas lo permite.

## 5. Versionado, copia y aprobación de tipos de trámite (diseño, no implementado en el MVP)

Contexto: se evalúa que los tipos de trámite deban poder versionarse (simplificar/complejizar sin romper trámites en curso), copiarse (para arrancar un tipo nuevo desde una plantilla), y eventualmente pasar por un flujo de revisión/aprobación antes de publicarse. El objetivo es dejar la puerta abierta con el menor costo de modelado posible, sin construir infraestructura que el desafío no requiere.

Diseño propuesto (agregar a `tipos_tramite`, sin tablas nuevas):

```
version                 int        default 1
estado                  text       'borrador' | 'publicado' | 'archivado'
tipo_tramite_origen_id  uuid null  -- referencia a sí misma
publicado_en            timestamp null
publicado_por           uuid null  -- referencia a admins
```

Reglas de comportamiento:

- **Inmutabilidad tras publicar**: una vez que un tipo de trámite pasa a `publicado` y tiene al menos un trámite instanciado, no se edita in place — se crea una fila nueva con `version = version_anterior + 1` y `tipo_tramite_origen_id` apuntando a la fila anterior. Los trámites ya iniciados conservan la referencia a la versión con la que fueron creados (`tramites.tipo_tramite_id` no se reescribe), así que un cambio de formulario nunca rompe un trámite en curso. Las nuevas instancias siempre usan la última versión en estado `publicado` de ese tipo.
- **Copiar como plantilla**: es la misma operación técnica que "nueva versión" (duplicar `esquema_formulario`, `flujo_estados` y metadata como punto de partida), pero sin heredar `tipo_tramite_origen_id` ni el nombre — es un tipo de trámite nuevo e independiente, no una iteración del original. La diferencia es de intención en la UI del admin ("crear nueva versión" vs. "usar como plantilla"), no de modelo de datos.
- **Aprobación simplificada vía `estado`**: el ciclo `borrador → publicado` ya funciona como un flujo de aprobación mínimo — un admin edita libremente en `borrador` (no visible para vecinos, no instanciable), y "publicar" es el punto de control antes de exponerlo. Si en el futuro se necesita que la publicación la apruebe una persona distinta de quien edita (four-eyes), alcanza con exigir que `publicado_por` sea un admin distinto del último editor en el endpoint de publicación — sin agregar una tabla de solicitudes de aprobación ni un workflow propio.

Qué **no** se modela en el MVP (y por qué no hace falta todavía): historial campo a campo de cada edición de un tipo de trámite (para eso alcanza con la fila anterior completa vía `tipo_tramite_origen_id`, no un diff), y una tabla de aprobaciones con múltiples revisores — ambos son extensiones directas de las columnas de arriba si en algún momento se necesitan, no un cambio de arquitectura.
