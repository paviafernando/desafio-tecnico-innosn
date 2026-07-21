# CLAUDE.md — Instrucciones para Claude Code

Este archivo guía a Claude Code (y a cualquier persona que retome el proyecto) sobre cómo trabajar en este repositorio. Todo el contenido generado en este proyecto —código, comentarios, commits, documentación, nombres de variables cuando sea razonable— **debe estar en español**.

## Idioma y documentación

- Toda la documentación del proyecto se escribe en español (README, comentarios de código, mensajes de commit, PRs, este archivo, etc.).
- Los nombres de variables y funciones en el código pueden seguir convenciones técnicas en inglés cuando sea el estándar de la tecnología (ej. `useState`, `fetch`), pero los comentarios explicativos van en español.
- Los mensajes de commit se redactan en español, en modo imperativo (ej. "Agrega formulario de trámite", no "Agregado formulario").

## Sobre el proyecto

Este repositorio corresponde a un **desafío técnico** propuesto por la **Secretaría de Innovación y Ciudad Inteligente del Municipio de San Nicolás** (provincia de Buenos Aires), como parte de un proceso de selección para el equipo de desarrollo del área de Innovación y Tecnología.

El desafío consiste en construir una aplicación web que permita a los vecinos de la ciudad realizar un trámite municipal de forma online, tomando como referencia el listado de trámites disponible en https://www.sannicolasciudad.gob.ar/tramites. No es necesario replicar el trámite completo: se pueden omitir pasos o simplificar el flujo.

Ver el detalle completo del enunciado en [`docs/CONTEXTO.md`](docs/CONTEXTO.md) y el estado de las decisiones tomadas en [`docs/DECISIONES.md`](docs/DECISIONES.md). El historial de avance y aprendizajes de la sesión de trabajo con Claude se guarda en [`memory.md`](memory.md).

> **Nota para retomar sesión:** este archivo (`CLAUDE.md`) y `memory.md` resumen todo lo necesario para continuar el trabajo sin releer el código ni `docs/CONTEXTO.md` completos. Solo recurrir a esos documentos o al código fuente cuando se necesite el detalle exacto de una parte puntual que se va a modificar.

## Enfoque de producto: motor genérico de trámites

En lugar de resolver un único trámite hardcodeado, la aplicación implementa un **motor genérico de trámites configurables**: todos los trámites municipales comparten el mismo patrón funcional (carga por el vecino → bandeja de entrada del administrador → cambio de estado / comentarios / historial → notificación en tiempo real a ambas partes). Este patrón es equivalente al de un sistema de tickets/workflow (similar a mesas de ayuda o gestores de incidencias), y se aprovecha esa arquitectura ya validada en la industria en vez de reinventarla.

Como diferencial del desafío, los administradores pueden **crear y editar tipos de trámite** definiendo:
- Nombre y descripción del trámite.
- Esquema del formulario (campos, tipos, validaciones, cuál es de tipo archivo).
- Flujo de estados (máquina de estados propia por tipo de trámite).

El trámite de referencia tomado de https://www.sannicolasciudad.gob.ar/tramites se implementa como el primer tipo de trámite cargado en este motor, no como un flujo especial de código.

## Arquitectura del backend

Separación en capas simple, sin sobreingeniería (sin DDD/hexagonal completo, sin CQRS):

```
routes/controllers → services (lógica de negocio, máquina de estados) → repositorios (acceso a datos) → PostgreSQL
```

- Los controllers no contienen lógica de negocio; delegan en services.
- La máquina de estados (transiciones válidas por tipo de trámite) vive en la capa de services.
- Los repositorios encapsulan las queries; nada de SQL disperso en controllers.

### Notificaciones (email / WhatsApp / SMS)

Los cambios de estado disparan notificaciones a través de un **puerto `NotificationService`** (interfaz) con un adapter por canal:
- **Email:** adapter implementado con el envío real comentado/mockeado (se loguea el intento), listo para conectar un proveedor real (ej. SES, SendGrid).
- **WhatsApp y SMS:** adapters prototipados con la misma interfaz, dejando el punto de integración marcado para un proveedor real (ej. Twilio), sin credenciales ni envío real en el MVP.

Esto permite agregar canales o activarlos en producción sin tocar la lógica de negocio.

### Broker de mensajería para actualización de estados

Se evalúa desacoplar el disparo de notificaciones y la difusión en tiempo real (WebSockets) del cambio de estado en sí, usando un **event emitter interno** como abstracción mínima para el MVP, con interfaz preparada para reemplazarlo por un broker real (Redis pub/sub o similar) si el alcance lo justifica. La decisión final y su justificación se registran en `docs/DECISIONES.md`.

## Metodología de desarrollo: TDD

El desarrollo de la lógica de negocio (services, máquina de estados, validaciones) se hace con TDD: primero el test, después la implementación mínima que lo satisface. Esto evita endpoints o código sin uso desde el inicio y mantiene la cobertura alineada con el comportamiento real del sistema.

## Especificaciones técnicas obligatorias

- **Backend:** Node.js (JavaScript o TypeScript) + Express + PostgreSQL. Almacenamiento de archivos vía S3 o protocolo remoto equivalente.
- **Frontend:** React + TypeScript + Tailwind CSS.
- Se puede sumar cualquier otra tecnología que se considere necesaria, siempre documentando el motivo en `docs/DECISIONES.md`.

## Estructura sugerida del repositorio

```
Repo/
├── CLAUDE.md              # este archivo
├── memory.md              # memoria de la sesión / bitácora de trabajo
├── docs/
│   ├── CONTEXTO.md         # enunciado completo y contexto institucional
│   └── DECISIONES.md       # decisiones técnicas y de producto
├── backend/                # API Node.js + Express + PostgreSQL
├── frontend/                # App React + TypeScript + Tailwind
└── assets/                 # recursos gráficos del desafío (ya existentes)
```

Si el proyecto termina entregándose como dos repositorios separados (frontend/backend, tal como pide el enunciado), mantener esta carpeta como monorepo de trabajo/documentación y separar al momento de la entrega, o migrar `backend/` y `frontend/` a sus propios repositorios cuando estén listos.

## Funcionalidades a implementar

### Ciudadanos
- Crear un trámite completando un formulario (mínimo 8 campos, al menos uno de tipo archivo).
- Visualizar el estado del trámite.
- Consultar el historial de cambios del trámite.

### Administradores
- Visualizar todos los trámites.
- Cambiar el estado de un trámite.
- Agregar comentarios.
- Visualizar historial completo de acciones.

### Mejoras adicionales (elegir al menos 2)
1. Estados controlados (máquina de estados con transiciones válidas).
2. Actualización en tiempo real (WebSockets).
3. Historial de eventos / línea de tiempo.
4. Validaciones avanzadas (frontend y backend).
5. Búsqueda y filtros para administradores.

Registrar en `docs/DECISIONES.md` cuáles de estas mejoras se eligieron y por qué.

## Convenciones de trabajo con Claude Code

- Antes de empezar una tarea nueva, revisar `memory.md` para no repetir decisiones ya tomadas.
- Al finalizar una sesión de trabajo relevante, actualizar **tanto `memory.md` como este `CLAUDE.md`**: `memory.md` con el resumen de la sesión (qué se hizo, qué queda pendiente) y `CLAUDE.md` cuando cambie algo estructural (arquitectura, alcance, convenciones), para que la siguiente sesión no necesite releer el código.
- Cualquier decisión de arquitectura (elección de librerías, modelado de base de datos, estrategia de autenticación, etc.) se documenta en `docs/DECISIONES.md` antes o inmediatamente después de implementarla.
- Los commits deben ser atómicos y describir el cambio en español.
- Desarrollo guiado por tests (TDD) para la lógica de negocio: escribir el test antes que la implementación.
- Antes de dar por terminada una funcionalidad, verificar que cumple con los criterios de evaluación: calidad y organización del código, buenas prácticas, diseño de la base de datos, manejo de estados y lógica de negocio, experiencia de usuario, diseño de la página y claridad de la documentación.
- La documentación del repositorio (`CLAUDE.md`, `memory.md`, `docs/*`, mensajes de commit) describe decisiones técnicas de forma objetiva y profesional. No incluir valoraciones personales, dudas o limitaciones del autor: el foco es el criterio técnico aplicado en cada decisión.

## Entrega final

El desafío tiene un plazo de 10 días desde su inicio. La entrega debe incluir:
- Link al repositorio del frontend.
- Link al repositorio del backend.
- Un video breve (3 a 5 minutos) explicando el funcionamiento general y las decisiones técnicas tomadas.

Dejar registro de la fecha límite y el estado de la entrega en `memory.md`.
