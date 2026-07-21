# Contexto del proyecto

## Institución

**Municipio de San Nicolás** (provincia de Buenos Aires, Argentina) — **Secretaría de Innovación y Ciudad Inteligente**.

Este desafío técnico es parte de un proceso de selección para sumarse al equipo de desarrollo del área de Innovación y Tecnología del municipio. El objetivo del área es digitalizar y facilitar el acceso de los vecinos a los trámites y servicios municipales.

## Enunciado original del desafío

> Deberás realizar una aplicación web que permita a los vecinos de nuestra ciudad realizar un trámite de forma online.

El trámite a implementar queda a elección de quien resuelve el desafío, pudiendo tomarse como referencia el listado disponible en:
https://www.sannicolasciudad.gob.ar/tramites

No es necesario replicar el trámite en su totalidad: pueden omitirse pasos o simplificarse el flujo.

### Funcionalidades principales

**Ciudadanos**
- Crear un trámite completando un formulario (mínimo 8 campos).
- Al menos uno de los campos debe ser de tipo archivo.
- Visualizar el estado del trámite.
- Consultar el historial de cambios del trámite.

**Administradores**
- Visualizar todos los trámites.
- Cambiar el estado de un trámite.
- Agregar comentarios.
- Visualizar historial completo de acciones.

### Requerimientos adicionales (elegir al menos 2)

1. **Estados controlados**: sistema de estados con transiciones válidas (ej. pendiente → en revisión → aprobado/rechazado), evitando cambios inválidos.
2. **Actualización en tiempo real**: cuando cambia el estado de un trámite, el usuario debe verlo sin recargar la página (WebSockets).
3. **Historial de eventos**: registrar cada acción sobre un trámite (creación, cambios de estado, comentarios) en una línea de tiempo.
4. **Validaciones avanzadas**: en frontend y backend (tipos de archivo, tamaños, campos obligatorios, etc.).
5. **Búsqueda y filtros**: para que los administradores busquen y filtren trámites por estado, fecha u otros criterios.

### Especificaciones técnicas

**Backend**
- Node.js (JavaScript o TypeScript)
- Express
- Base de datos PostgreSQL
- Almacenamiento de archivos vía protocolo S3 o remoto

**Frontend**
- React / TypeScript
- Tailwind CSS

Se puede sumar cualquier otra tecnología que se considere necesaria.

### Criterios de evaluación

- Calidad y organización del código
- Buenas prácticas
- Diseño de la base de datos
- Manejo de estados y lógica de negocio
- Experiencia de usuario
- Diseño de la página web
- Claridad en la documentación

### Formato de entrega

Plazo: 10 días desde el inicio del desafío.

Al finalizar, se debe enviar:
- Link al repositorio del frontend.
- Link al repositorio del backend.
- Un video breve (3-5 minutos) explicando el funcionamiento general y las decisiones técnicas tomadas.

## Fuente

Enunciado completo en el `README.md` de este repositorio, clonado de:
https://github.com/paviafernando/desafio-tecnico-innosn
