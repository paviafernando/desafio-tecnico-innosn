# Registro de decisiones técnicas y de producto

Este documento registra las decisiones tomadas durante el desarrollo del desafío técnico, junto con su justificación. Se actualiza a medida que avanza el proyecto.

Formato sugerido por entrada:

```
## [Fecha] Título de la decisión
- Contexto: por qué había que decidir esto.
- Opciones consideradas: alternativas evaluadas.
- Decisión: qué se eligió.
- Justificación: por qué se eligió esa opción.
```

---

## 2026-07-20 Motor genérico de trámites en lugar de un trámite único

- Contexto: el enunciado pide implementar un trámite puntual, pero todos los trámites del listado municipal comparten el mismo patrón funcional (carga del vecino → bandeja del administrador → cambio de estado/comentarios/historial → notificación en tiempo real).
- Opciones consideradas: (a) implementar un único trámite hardcodeado tal como lo pide el enunciado de forma literal; (b) construir un motor genérico donde el administrador define tipo de trámite, formulario y flujo de estados, y el primer trámite cargado es el de referencia del enunciado.
- Decisión: opción (b). Se adopta el patrón ya validado por sistemas de tickets/workflow (mesas de ayuda, gestores de incidencias) en vez de reinventar uno ad hoc.
- Justificación: cubre el requisito del enunciado (un trámite funcional de punta a punta) y además demuestra una solución reutilizable para cualquier trámite futuro, sin aumentar significativamente la complejidad respecto de un CRUD de estados fijo.

## 2026-07-20 Separación en capas en el backend

- Contexto: se busca código organizado y testeable sin incurrir en sobreingeniería para un desafío de 10 días.
- Opciones consideradas: (a) todo en controllers (rápido pero difícil de testear); (b) arquitectura hexagonal/DDD completa (sobredimensionada para el alcance); (c) capas simples routes/controllers → services → repositorios.
- Decisión: opción (c).
- Justificación: permite testear la lógica de negocio (services, máquina de estados) de forma aislada con TDD, sin la sobrecarga de puertos/adaptadores de una arquitectura hexagonal completa.

## 2026-07-20 Notificaciones como puerto con adapters (email / WhatsApp / SMS)

- Contexto: el enunciado no pide notificaciones externas, pero el cambio de estado de un trámite es un evento natural para avisar al vecino por otros canales además de la propia UI.
- Opciones consideradas: (a) no contemplar notificaciones externas; (b) implementar un envío real de email como parte del MVP; (c) definir una interfaz `NotificationService` con un adapter por canal, implementando el envío real solo donde no requiere credenciales de terceros y dejando el resto prototipado.
- Decisión: opción (c). El adapter de email queda con el punto de envío real comentado (logueando el intento); los adapters de WhatsApp y SMS quedan prototipados con la misma interfaz, marcando el punto de integración con un proveedor real (ej. Twilio).
- Justificación: deja la extensibilidad a múltiples canales resuelta a nivel de diseño sin depender de credenciales o servicios de terceros durante el desarrollo del desafío.

## 2026-07-20 Evaluación de broker de mensajería para actualización de estados

- Contexto: el cambio de estado de un trámite dispara múltiples efectos (notificación al vecino, notificación al administrador, difusión en tiempo real). Desacoplar esos efectos del flujo síncrono de la request evita lógica de negocio acoplada a side effects.
- Opciones consideradas: (a) invocar los side effects directamente desde el service (acoplado pero simple); (b) un broker externo (Redis pub/sub o similar); (c) un event emitter interno al proceso, con la misma interfaz que tendría un broker externo, para poder reemplazarlo sin tocar los consumidores del evento.
- Decisión: opción (c) para el alcance del MVP, dejando la interfaz preparada para migrar a (b) si el volumen o la necesidad de múltiples instancias lo justifica.
- Justificación: evita la complejidad operativa de correr un broker externo para el alcance de un desafío técnico, sin cerrar la puerta a escalar el diseño.

## 2026-07-20 TDD como metodología de desarrollo

- Contexto: se prioriza velocidad de desarrollo sin perder solidez, evitando además endpoints o código sin uso.
- Decisión: la lógica de negocio (services, transiciones de estado, validaciones) se desarrolla con TDD: test primero, implementación mínima después.
- Justificación: mantiene el alcance del código acotado a comportamiento verificado y facilita refactors seguros durante el desarrollo del desafío.

## 2026-07-21 Modelo de datos en PostgreSQL

- Contexto: definido el motor genérico de trámites, hacía falta el esquema concreto de tablas.
- Decisión: `admins`, `tipos_tramite` (con `esquema_formulario` y `flujo_estados` en columnas jsonb), `tramites` (referencia a `tipos_tramite`, datos del formulario en jsonb, identificador del ciudadano tomado del JWT sin tabla propia), `archivos_tramite` (metadata + referencia al objeto en el storage), `comentarios` y `eventos_historial` (línea de tiempo y disparador de notificaciones/tiempo real).
- Justificación: `jsonb` para `esquema_formulario` y `flujo_estados` permite que cada tipo de trámite tenga su propio formulario y máquina de estados sin migraciones nuevas por cada tipo que se agregue. No se modela una tabla de ciudadanos porque esa identidad la posee un proveedor de identidad externo al proyecto (ver decisión de autenticación de vecino).

## 2026-07-21 Autenticación del vecino: JWT simulando un proveedor externo

- Contexto: el login de los vecinos de la ciudad, en un sistema real, se resuelve mediante un proveedor de identidad externo a este proyecto. El desafío no pide implementar ese proveedor, pero sí requiere que el flujo de trámites esté protegido igual que en producción.
- Opciones consideradas: (a) no proteger las rutas del vecino, asumiendo que la auth llegaría después; (b) implementar un registro/login de vecinos propio del proyecto; (c) simular la emisión del JWT (un "selector de identidad" que representa el resultado de un login externo ya resuelto) y exigir ese JWT en todos los endpoints igual que se exigiría en producción.
- Decisión: opción (c).
- Justificación: deja el contrato de seguridad completo (ningún endpoint accesible sin sesión válida) sin construir un sistema de cuentas de vecinos que no es responsabilidad de este proyecto ni se pidió en el enunciado. El punto de integración con el proveedor externo real queda claramente aislado en el módulo de emisión del JWT.

## 2026-07-21 Autenticación del administrador: JWT con tabla propia

- Contexto: a diferencia del vecino, el rol administrador sí es parte del alcance de este proyecto.
- Decisión: tabla `admins` con contraseña hasheada, login que emite JWT, middleware de verificación para las rutas administrativas.
- Justificación: es un flujo de autenticación real y autocontenido, consistente con las buenas prácticas esperadas para el rol que si maneja este sistema.

## 2026-07-21 Storage de archivos: MinIO local, intercambiable con S3 sin rebuild

- Contexto: el enunciado pide almacenamiento de archivos vía S3 o protocolo remoto equivalente.
- Opciones consideradas: (a) S3 real de AWS; (b) MinIO local (compatible con el protocolo S3).
- Decisión: MinIO local para desarrollo, implementado con el SDK oficial de S3 (`@aws-sdk/client-s3`) para que el mismo código funcione contra un bucket real de AWS. El proveedor (endpoint, credenciales, bucket, path-style) se configura por variables de entorno leídas en runtime, de forma que cambiar entre MinIO y S3 sea solo actualizar esas variables y reiniciar el proceso, sin recompilar ni tocar código.
- Justificación: no depender de credenciales de AWS durante el desarrollo, y a la vez demostrar una integración real y productiva del protocolo S3 pedido, portable a un proveedor real con un cambio de configuración.

## 2026-07-21 Framework de testing

- Contexto: se necesitaba fijar el stack de testing para poder empezar TDD.
- Decisión: Jest + Supertest en el backend (unit tests de services y tests de integración de endpoints); Vitest + React Testing Library en el frontend.
- Justificación: Jest es el estándar más extendido en proyectos Node/Express y tiene la mejor integración con TypeScript vía `ts-jest`; Vitest se integra nativamente con el tooling de Vite que se usa para el frontend.

## 2026-07-21 Plazo de entrega: 48-72 horas

- Contexto: el enunciado otorga 10 días de plazo, pero se decidió no usar ese margen completo.
- Decisión: apuntar a completar el desafío en un rango de 48 a 72 horas de trabajo efectivo.
- Justificación: demuestra capacidad de priorización y ejecución bajo un plazo ajustado, sin resignar los criterios de evaluación del enunciado.

## Mejoras adicionales elegidas

Del listado de mejoras opcionales del enunciado, se eligen (mínimo 2 requeridos):
1. **Estados controlados** (máquina de estados con transiciones válidas) — necesario para el motor genérico de trámites.
3. **Historial de eventos / línea de tiempo** — necesario para el historial de acciones que pide el enunciado.
2. **Actualización en tiempo real** (WebSockets) — para reflejar cambios de estado sin recargar, tanto a administradores como a vecinos.

## 2026-07-21 Esquema configurable de `tipos_tramite`, trámites a implementar y versionado

- Contexto: hacía falta cerrar el alcance exacto del esquema de formulario configurable, y definir con qué trámites concretos se carga el motor. Se relevó en detalle el listado oficial de https://www.sannicolasciudad.gob.ar/tramites (18 categorías, ~90 trámites) y la ficha de 5 trámites representativos de distinta complejidad. Ver el detalle completo del relevamiento y la justificación en `docs/ANALISIS_TRAMITES.md`.
- Decisión (esquema): además de `esquema_formulario` (campos que completa el vecino: tipos `texto`, `texto_largo`, `numero`, `fecha`, `email`, `telefono`, `select`, `checkbox`, `archivo`, cada uno con `requerido` y `validacion` propia), `tipos_tramite` suma metadata informativa que replica el patrón real relevado: `descripcion`, `categoria`, `requisitos`, `pasos`, `archivos_referencia`, `costo`, `modalidad`, `contacto`.
- Decisión (trámite principal): **Inscripción a becas deportivas** (categoría Deportes) como trámite de referencia — gratuito, un solo archivo requerido (ficha médica), 8 campos de formulario naturales sin forzar datos artificiales, y una máquina de estados con un estado intermedio (`documentación requerida`) que sirve de demo de transición no lineal.
- Decisión (trámites secundarios, opcionales según tiempo disponible): **Certificado de vivienda única o de no poseer bienes** (formulario mínimo, muestra el motor con un caso trivial) y **Solicitud de permiso para eventos culturales** (formulario más denso, muestra un flujo de revisión más largo).
- Decisión (versionado/copia/aprobación de tipos de trámite): se deja la puerta abierta con columnas adicionales en `tipos_tramite` (`version`, `estado` con `borrador`/`publicado`/`archivado`, `tipo_tramite_origen_id` auto-referenciado, `publicado_en`, `publicado_por`) sin tablas nuevas ni workflow propio. Un tipo publicado con trámites instanciados no se edita in place: una nueva versión es una fila nueva enlazada por `tipo_tramite_origen_id`, y los trámites en curso conservan la versión con la que fueron creados. "Copiar como plantilla" es la misma operación de clonar `esquema_formulario`/`flujo_estados` sin heredar el origen. El ciclo `borrador → publicado` funciona como aprobación mínima; un flujo con revisor distinto del editor es una extensión directa de estas columnas, no un cambio de arquitectura.
- Justificación: cierra el modelado de datos pendiente con evidencia real del dominio en vez de campos supuestos, y resuelve el pedido de versionado/copia/aprobación con el menor costo de modelado posible, sin construir infraestructura que el desafío no requiere.

## 2026-07-21 Runner de migraciones propio (sin framework de migraciones)

- Contexto: hacía falta versionar y aplicar el esquema de PostgreSQL (`admins`, `tipos_tramite`, `tramites`, `archivos_tramite`, `comentarios`, `eventos_historial`) definido en las decisiones anteriores.
- Opciones consideradas: (a) un framework de migraciones (`node-pg-migrate`, `knex`, etc.); (b) archivos `.sql` numerados aplicados por un script propio y mínimo sobre el cliente `pg` ya usado en el proyecto.
- Decisión: opción (b). `backend/migrations/*.sql` con un archivo por tabla, y `backend/scripts/migrar.js` que aplica en orden los archivos pendientes dentro de una transacción cada uno, registrando lo aplicado en una tabla de control `esquema_migraciones`. Se expone como `npm run migrate`.
- Justificación: el volumen de migraciones de este proyecto no justifica sumar una dependencia y su curva de aprendizaje; un runner de ~50 líneas sobre `pg` cubre exactamente lo necesario (orden, idempotencia, transacción por archivo) sin ceremonia adicional.
- Verificación: se corrieron las 6 migraciones contra una instancia real de PostgreSQL 16 levantada con `docker-compose` (confirmado esquema resultante columna por columna) y se verificó que una segunda corrida no reaplica nada.
- Nota de entorno: en la máquina de desarrollo el puerto `5432` ya estaba tomado por un contenedor de otro proyecto ajeno a este repo, así que el Postgres de `docker-compose.yml` mapea a `5433` en el host (`POSTGRES_PORT`, con default `5433`); `DATABASE_URL` en `.env.example` se actualizó acorde. No es una decisión de arquitectura, solo una adaptación al entorno local.

## 2026-07-21 Metadata de `TiposTramiteService` completa y `tramites` desnormaliza contacto del ciudadano

- Contexto: al escribir el repositorio real sobre PostgreSQL había dos pendientes: si la metadata informativa de `tipos_tramite` (`requisitos`, `pasos`, `archivos_referencia`, `costo`, `modalidad`, `contacto`) se sumaba ya al modelo TypeScript del servicio, y cómo notificar al vecino tras un cambio de estado sin tabla propia de ciudadanos.
- Decisión (metadata): se incorporó completa a `TipoTramite`/`DatosTipoTramite` en `tiposTramite.ts`, con valores por defecto (`[]`/`{}`/`null`) cuando no se especifica, para no dejar el modelo del servicio más pobre que la tabla real.
- Contexto (contacto del vecino): `tramites.ciudadano_id` (el `sub` del JWT, sin tabla propia) alcanza para vincular el trámite a quien lo creó, pero no para contactarlo — y el `esquema_formulario` no sirve para eso porque puede referirse a otra persona (ej. "Inscripción a becas deportivas" pide datos del menor, no del adulto que lo carga vía el selector de identidad).
- Decisión (contacto): se desnormalizan `ciudadano_nombre` y `ciudadano_email` directamente en `tramites` (migración `007_agregar_contacto_ciudadano_a_tramites.sql`), tomados del JWT en el momento de crear el trámite. `Tramite.ciudadanoDni` se renombró a `ciudadanoId` en el modelo TypeScript para reflejar que es el identificador de sesión, no necesariamente un DNI validado.
- Justificación: evita acoplar las notificaciones a una convención de nombres de campo del formulario (que rompería la genericidad del motor) sin necesidad de crear una tabla de ciudadanos, que el proyecto decidió no tener.

## 2026-07-21 Bootstrap del backend: composition root, subida de archivos y WebSockets

- Contexto: con los repositorios reales sobre `pg` ya escritos y probados por integración, faltaba levantar la API HTTP completa (Express + rutas + auth + manejo de errores) y las dos mejoras elegidas que dependen de infraestructura (subida real de archivos, tiempo real).
- Decisión (composition root): `src/config/contenedor.ts` es el único lugar donde se instancian las implementaciones concretas (repos `pg`, `JwtService`, `BcryptHashService`, cliente S3, adapters de notificación, `EmisorEventosDominio`) y se inyectan en los services. Controllers y rutas dependen solo del `Contenedor` (tipado), nunca de una clase concreta directamente — mantiene la separación en capas ya decidida sin un framework de DI.
- Decisión (manejo de errores): un único middleware (`manejoErrores.ts`) traduce los errores ya lanzados por los services (por nombre de clase) a status HTTP; los controllers no hacen `try/catch` propio, solo delegan vía un `asyncHandler`. Cualquier error no mapeado responde 500 sin filtrar el mensaje interno.
- Decisión (subida de archivos): `multer` con storage en memoria (sin escribir a disco local) y límite de 15 MB, en un endpoint (`POST /api/archivos`) separado de la creación del trámite — el vecino sube el archivo primero, recibe una `claveAlmacenamiento`, y la referencia esa clave como valor del campo tipo `archivo` al crear el trámite. Mantiene `TramitesService` ajeno a HTTP/multipart: solo recibe strings en `datosFormulario`.
- Decisión (tiempo real): gateway de WebSockets (`socket.io`) suscrito al mismo `EmisorEventosDominio` que usan las notificaciones — salas por `tramite:<id>` (para el vecino que mira su propio trámite) y una sala `admin` (para la bandeja de entrada). No introduce un flujo de datos paralelo: reenvía los mismos eventos de dominio que ya disparan los emails.
- Verificación: suite completa en verde (**103/103 tests** — unitarios, de integración contra PostgreSQL real, y un test end-to-end con Supertest que recorre el flujo completo: login admin → crear y publicar tipo de trámite → listar identidades → sesión de vecino → subir archivo real a MinIO → crear trámite → acceso denegado a un trámite ajeno → cambiar estado → comentar → detalle con historial → bandeja filtrada). Se verificó además que `npm run dev` levanta el servidor real y responde en `/health` y `/api/ciudadano/identidades`, y que el archivo subido en el test queda efectivamente en el bucket de MinIO.

## 2026-07-21 Seed de datos y validación de forma en el borde HTTP

- Contexto: faltaban dos pendientes menores antes de conectar el frontend: cargar el trámite de referencia como dato real (no solo en tests) y validar la forma de los payloads antes de que lleguen a los services.
- Decisión (seed): `backend/scripts/seed.ts` (vía `npm run seed`, corrido con `ts-node` reutilizando los mismos services/repositorios reales, no SQL a mano) crea un admin de prueba y publica "Inscripción a becas deportivas" con su esquema y flujo completos. Es idempotente: si el admin o el tipo de trámite ya existen (por nombre/email), no los duplica.
- Decisión (validación): un middleware genérico `validarBody(esquemaZod)` valida el `body` contra un esquema de `zod` antes del controller, devolviendo 400 con el detalle si no matchea; los esquemas están centralizados en `src/routes/esquemasValidacion.ts`. Los services siguen siendo la fuente de verdad de las reglas de negocio (ej. "el esquema debe tener 8 campos"); este middleware solo evita que lleguen tipos de dato incorrectos o campos faltantes.
- Justificación: separa "¿el request tiene la forma correcta?" (capa HTTP, `zod`) de "¿el contenido es válido según las reglas del dominio?" (capa de servicio, ya cubierta con TDD), sin duplicar validaciones entre ambas capas.

## 2026-07-21 Frontend conectado a la API real

- Contexto: el frontend tenía solo pantallas placeholder; había que conectar cada una a la API ya funcional del backend.
- Decisión (sesión): un `AuthProvider` (React Context) persiste la sesión activa (token + rol + datos) en `localStorage`, sin librería de manejo de estado externa — alcanza para el volumen de estado global de esta app (una sesión a la vez). Un componente `RequireAuth` redirige según rol antes de renderizar cada ruta protegida.
- Decisión (cliente HTTP): `apiFetch`/`apiSubirArchivo` son wrappers finos sobre `fetch` nativo (sin Axios), con un `ApiError` tipado que expone el status y el mensaje que ya devuelve el backend. No se duplica lógica de reintentos/caché (no la pedía el alcance).
- Decisión (formulario dinámico): `CampoFormularioDinamico` traduce cada `tipo` de campo del `esquemaFormulario` a su input HTML nativo correspondiente; el frontend no reimplementa las reglas de negocio del backend (mínimo de campos, patrón de validación, etc.) — solo estructura la carga y deja que el service las aplique, mostrando el error que ya devuelve la API si falla.
- Decisión (ABM de tipos de trámite): en vez de un editor visual de flujo de estados, los estados se cargan como texto separado por comas y las transiciones válidas como una grilla de checkboxes generada dinámicamente a partir de esos estados. Cubre el caso de uso sin construir un editor gráfico de grafos, que excede el alcance del desafío.
- Decisión (tiempo real): dos hooks (`useEventosTramite`, `useEventosAdmin`) encapsulan la suscripción/desuscripción a `socket.io-client`, usados para refrescar el detalle del vecino, el detalle del admin y la bandeja de entrada cuando llega un evento relevante — sin duplicar la lógica de conexión en cada página.
- Nota técnica menor: el input de tipo archivo no lleva el atributo HTML `required` — jsdom (entorno de test) no refleja correctamente la validez de un `FileList` asignado programáticamente, lo que bloqueaba los tests de submit. Se optó por validar la presencia del archivo requerido en JavaScript antes de enviar (ya se mostraba un error propio de todos modos), en vez de depender de la validación nativa del navegador para ese campo puntual.
- Verificación: **53/53 tests en verde** (Vitest + React Testing Library) cubriendo sesión, guard de rutas, formulario dinámico, subida de archivo, detalle con historial, bandeja con filtros, y el ABM de tipos de trámite. Build de producción (`npm run build`) verificado. Flujo completo verificado manualmente vía `curl` contra la API real (login admin, listar tipos, listar trámites de un vecino) con ambos servidores (`npm run dev` en `backend/` y `frontend/`) corriendo en simultáneo. No se hizo una verificación visual en navegador real (no hay herramienta de automatización de browser disponible en este entorno) — la cobertura de UI es vía RTL + verificación funcional de la API por `curl`.

## 2026-07-22 El mínimo de 8 campos + 1 archivo no es una regla del motor, es del trámite de referencia

- Contexto: el enunciado del desafío pide que **el trámite implementado** tenga un formulario de mínimo 8 campos con al menos uno de tipo archivo. `validarEsquemaFormulario` aplicaba esa regla a **cualquier** tipo de trámite que un admin creara, lo cual no tiene sentido para el motor genérico: un tipo de trámite legítimo puede tener 1 solo campo (ej. algo muy simple) sin dejar de ser válido.
- Decisión: se saca la validación de mínimo de campos y de campo-archivo-obligatorio de `validarEsquemaFormulario`; solo queda la regla mínima de sentido común (al menos 1 campo) más las validaciones estructurales ya existentes (ids únicos, `select` con opciones, patrón de regex válido). El requisito del enunciado queda satisfecho por el trámite de referencia sembrado ("Inscripción a becas deportivas", que tiene 8 campos + 1 archivo), no por una regla de la plataforma.
- Justificación: una regla de negocio del enunciado para un trámite puntual no debe convertirse en una restricción estructural del motor genérico — haría inutilizable crear tipos de trámite simples.

## Frontend: ajustes de UX tras la primera revisión

- **Tema claro forzado**: se sacó el soporte de modo oscuro (`dark:` de Tailwind) — feedback directo de que a los usuarios no técnicos no les gusta, y el público objetivo (vecinos y administrativos municipales) no es técnico.
- **Edición de tipos de trámite**: no existía manera de editar un tipo ya creado desde la UI (el backend ya lo soportaba). Se agregó, reutilizando el mismo formulario de creación en modo edición.
- **Creación/edición en modal**: tanto el alta de tipos de trámite (admin) como la carga de un nuevo trámite (vecino) pasaron de reemplazar el contenido de la página a abrirse en un modal — mismo patrón de interacción en ambos roles, evita la navegación completa para una tarea puntual.
- **Bandeja de entrada con el nombre del tipo de trámite**: la tabla solo mostraba el ID del trámite y el vecino, no qué tipo de trámite era — se agregó la columna correspondiente.
- **Botón "volver al listado"** en el detalle de trámite, tanto para el vecino como para el admin — faltaba una forma de volver sin usar el botón "atrás" del navegador.

## Segunda ronda de feedback: modal, búsqueda unificada de la bandeja, componentes reutilizables

- **Modal con header fijo**: el modal original scrolleaba el título junto con el contenido (quedaba invisible al scrollear el formulario). Se separó en dos regiones: un header fijo (`shrink-0`) con el título y el botón de cerrar, y un cuerpo con su propio `overflow-y-auto` y `max-h-[88vh]` — el título siempre queda visible. También se agrandó (`max-w-3xl`) para aprovechar más superficie de pantalla.
- **`ListaTiposTramitePorCategoria`**: componente nuevo y reutilizable que agrupa tipos de trámite por `categoria` (con un grupo "Otros" para los que no tienen) y ofrece un buscador de texto libre sobre nombre y categoría. Se usa tanto en "Nuevo trámite" del vecino (para elegir qué trámite iniciar) como en "Tipos de trámite" del admin (para encontrar un tipo existente) — la razón de ser del componente es exactamente evitar duplicar esa lógica entre ambas pantallas.
- **Buscador único en la bandeja de entrada, no un filtro exacto por campo**: el filtro anterior (`?estado=`) hacía una coincidencia exacta contra un solo campo, lo cual era inútil para un vecino que escribe "revi" esperando encontrar "en_revision". Se reemplazó por un único campo de búsqueda que filtra client-side por coincidencia parcial (substring, case-insensitive) contra estado, tipo de trámite, categoría del tipo, nombre del vecino y número de trámite a la vez. Esto requirió que el backend devuelva también `tipoTramiteCategoria` en `GET /api/tramites/:id`, `/mios` y `/admin/tramites` (ya devolvía `tipoTramiteNombre`) para poder buscar por categoría sin una consulta aparte.
- **Modalidad de tipo de trámite como select**: era un input de texto libre; se acotó a un `<select>` con las tres opciones ya usadas en el dominio (`online`, `presencial`, `mixta`), evitando que un admin escriba una modalidad con un valor arbitrario.

Verificación: 106 tests backend + 71 tests frontend en verde, build de producción verificado, y probado a mano por `curl` que `tipoTramiteCategoria` viaja correctamente en la bandeja.

## Versionado de tipos de trámite: se cierra un vacío (faltaba archivar la versión anterior) y se lo hace visible para el admin

- Contexto: el diseño de versionado (ver más arriba, sección de `TiposTramiteService`) ya funcionaba a nivel de datos — editar un tipo publicado con trámites en curso crea una fila nueva (`version + 1`, `estado: "borrador"`) sin tocar la versión publicada. Pero faltaban dos cosas: (a) nada archivaba la versión anterior al publicar la nueva, así que podían quedar dos versiones "publicado" al mismo tiempo (el vecino vería el mismo trámite duplicado al elegir qué iniciar); y (b) no había forma de saber, mirando un trámite ya cargado, contra qué versión del tipo se creó.
- Decisión (a): `TiposTramiteService.publicar` ahora archiva automáticamente la versión anterior (`tipoTramiteOrigenId`) si todavía estaba `publicado`, antes de publicar la nueva. Como cada versión solo puede tener un predecesor directo, alcanza con mirar un salto atrás en cada publicación — no hace falta recorrer toda la cadena de versiones.
- Decisión (b): `GET /api/tramites/:id`, `/admin/tramites` (bandeja) y `/tramites/mios` ahora pueden incluir `tipoTramiteVersion`, pero **solo si quien pregunta es un admin** — el vecino no necesita saber si su trámite se inició contra la v1 o la v2, así que ese campo se omite explícitamente en `/mios` y quien accede a `/tramites/:id` como ciudadano. En el frontend, la versión se muestra como una etiqueta chica y tenue (`v1`, `v2`) junto al nombre del tipo, solo en las pantallas de admin (bandeja y detalle).
- Decisión (c), UX: cuando un admin edita un tipo publicado con instancias y el guardado efectivamente crea una nueva versión (en vez de editar in place), se lo avisa con un mensaje explícito ("Se creó la versión v2 en borrador…") — sin esto, la creación de una nueva versión pasaba desapercibida y parecía que la edición no había tenido efecto.
- Se evaluó construir un flujo de aprobación con más pasos (ej. que publicar requiera un revisor distinto del editor) pero se decidió no hacerlo: el enunciado no lo pide, y el ciclo `borrador → publicado` ya es la aprobación mínima que necesitaba este alcance (ver la nota correspondiente en `docs/ANALISIS_TRAMITES.md`).
- Verificación: nuevo test de integración (`TiposTramiteService`, "al publicar una nueva versión, archiva la versión anterior") y test end-to-end actualizado que confirma que `tipoTramiteVersion` viaja en la bandeja/detalle del admin y no viaja en `/mios` del vecino. Se probó además a mano contra la API real: se creó una v1, se publicó, un vecino cargó un trámite contra ella, se editó (creó v2), se publicó v2, y se confirmó que v1 pasó a `archivado` y que el trámite del vecino sigue mostrando `v1` para el admin.

## Pendientes de definir

- [ ] Si el repositorio se separará en `frontend` y `backend` como dos repos independientes antes de la entrega, o se dividirá recién al final. **Actualización 2026-07-21: decidido que no — el repositorio queda como monorepo también para la entrega final.**
