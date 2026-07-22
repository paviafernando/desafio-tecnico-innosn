# Memoria del proyecto

Bitácora de trabajo para retomar el contexto entre sesiones con Claude Code. Se actualiza al final de cada sesión relevante con un resumen breve de lo hecho, lo pendiente y cualquier decisión importante.

## 2026-07-20 — Preparación inicial del repositorio

- Se clonó el repositorio del desafío técnico desde `https://github.com/paviafernando/desafio-tecnico-innosn` a `~/work/inno-sn/desafio-tecnico/Repo`.
- Se leyó el `README.md` original con el enunciado completo del desafío (Secretaría de Innovación y Ciudad Inteligente, Municipio de San Nicolás).
- Se creó la estructura de documentación para trabajar con Claude Code:
  - `CLAUDE.md`: instrucciones generales del proyecto (idioma español obligatorio, especificaciones técnicas, estructura sugerida, convenciones de trabajo).
  - `docs/CONTEXTO.md`: copia curada del enunciado y contexto institucional.
  - `docs/DECISIONES.md`: registro de decisiones técnicas, con la lista de pendientes de definir antes de empezar a codear (trámite elegido, mejoras a implementar, modelo de datos, etc.).
  - `memory.md` (este archivo): bitácora de sesiones.
- **Aún no se creó código de la aplicación** (ni `backend/` ni `frontend/`). El repositorio solo tiene el README original, los assets, y esta documentación de preparación.
- **Aún no se hizo commit** de estos archivos nuevos — quedaron como cambios sin commitear en el working tree, a la espera de que se confirme el contenido antes de subirlos.

### Próximos pasos sugeridos (de la sesión anterior, superados parcialmente por la sesión de hoy)
1. ~~Definir el trámite a implementar~~ → resuelto hoy con el enfoque de motor genérico de trámites.
2. ~~Elegir las 2+ mejoras adicionales~~ → resuelto hoy (estados controlados, historial de eventos, tiempo real).
3. Diseñar el modelo de datos en PostgreSQL (sigue pendiente).
4. Scaffolding de `backend/` y `frontend/` (sigue pendiente, aún no hay código).
5. Commitear la documentación de preparación.

## 2026-07-20 (continuación) — Definición de arquitectura y alcance distintivo

- Se definió el enfoque de producto: en vez de un trámite hardcodeado, un **motor genérico de trámites** donde el administrador crea y edita tipos de trámite (nombre, descripción, esquema de formulario, flujo de estados). El trámite del enunciado se carga como el primer tipo de trámite del motor.
- Se definió arquitectura de backend en capas simples: routes/controllers → services (lógica de negocio y máquina de estados) → repositorios → PostgreSQL. Sin DDD/hexagonal completo ni CQRS.
- Se definieron las notificaciones como un puerto `NotificationService` con adapters por canal: email con el envío real comentado/mockeado, WhatsApp y SMS prototipados con la misma interfaz (sin credenciales ni envío real en el MVP).
- Se evaluó usar un broker de mensajería para desacoplar el disparo de notificaciones y la difusión en tiempo real del cambio de estado; se optó por un event emitter interno para el MVP, con interfaz preparada para migrar a un broker externo (Redis pub/sub) si hace falta escalar.
- Se adoptó TDD como metodología para la lógica de negocio (services, máquina de estados, validaciones): test antes que implementación.
- Todo lo anterior quedó registrado como decisiones formales en `docs/DECISIONES.md`, y resumido en `CLAUDE.md` para que una sesión nueva no necesite releer el código ni `docs/CONTEXTO.md` completos.
- **Aún no hay código de aplicación.** `backend/` y `frontend/` solo tienen su README stub.

### Próximos pasos
1. Definir el modelo de datos en PostgreSQL (tipos de trámite, instancias, estados, comentarios, historial, archivos).
2. Elegir framework de testing (backend y frontend) y dejarlo registrado en `docs/DECISIONES.md`.
3. Definir estrategia de autenticación/autorización para el rol Administrador.
4. Empezar el scaffolding de `backend/` con TDD desde la capa de services (máquina de estados de trámites).
5. Commitear la documentación (`CLAUDE.md`, `docs/`, `memory.md`) antes de iniciar el código.

### Entrega
- Plazo: 10 días desde el inicio del desafío (fecha de inicio a confirmar contra la fecha real de recepción del desafío).
- Estado: sin código aún, en etapa de definición de arquitectura y documentación.

## 2026-07-21 — Planificación final y arranque de implementación

- Se cerraron todas las definiciones pendientes de `docs/DECISIONES.md`:
  - **Modelo de datos:** `admins`, `tipos_tramite` (esquema de formulario y flujo de estados en jsonb), `tramites`, `archivos_tramite`, `comentarios`, `eventos_historial`.
  - **Auth vecino:** simulada mediante un "selector de identidad" que emite un JWT como si viniera de un proveedor externo (el login real de vecinos queda fuera del alcance de este proyecto), con todos los endpoints protegidos igual que en producción.
  - **Auth admin:** JWT real con tabla propia de administradores.
  - **Storage:** MinIO local para desarrollo, implementado con el SDK de S3 para que sea intercambiable con un bucket real de AWS solo cambiando variables de entorno en runtime (sin rebuild).
  - **Testing:** Jest + Supertest (backend), Vitest + React Testing Library (frontend).
- Se redefinió el plazo objetivo: **48-72 horas** de trabajo efectivo, en vez del margen completo de 10 días del enunciado.
- Se definió la dirección visual del frontend: cuidado tipo Apple, mobile first con diseño adaptativo para desktop.
- Se guardó un plan de implementación detallado (modelo de datos, orden de TDD por capas, roadmap por bloques) — ver el plan aprobado de esta sesión para el detalle completo si hace falta retomarlo.
- Se actualizó `docs/DECISIONES.md` con estas decisiones y se vació la lista de pendientes salvo dos ítems menores (alcance exacto del esquema de formulario configurable, y si se separan los repos de frontend/backend antes o después de la entrega).

### Próximos pasos
1. Crear `docker-compose.yml` (Postgres + MinIO).
2. Scaffolding de `backend/` (Express + TypeScript + Jest).
3. Empezar TDD por la máquina de estados genérica (primer service, sin dependencias de infraestructura).
4. Scaffolding de `frontend/` (Vite + React + TypeScript + Tailwind).

## 2026-07-21 (continuación) — Scaffolding inicial y primer ciclo TDD

- `docker-compose.yml` en la raíz: PostgreSQL 16 + MinIO, con variables de entorno para credenciales.
- `backend/`: Express + TypeScript + Jest + Supertest, estructura en capas (`domain/`, `services/`, `repositories/`, `adapters/{storage,notificaciones}/`, `controllers/`, `routes/`, `middleware/`, `realtime/`, `config/`). `.env.example` con la configuración de storage intercambiable MinIO/S3. Se usó `bcryptjs` en vez de `bcrypt` (evita una dependencia nativa con una vulnerabilidad crítica transitiva en `node-tar`); `npm audit` queda en 0 vulnerabilidades.
- Primer ciclo TDD completo: `src/domain/flujoEstados.ts` (máquina de estados genérica — `aplicarTransicion`, `esTransicionValida`, `TransicionInvalidaError`), con su test escrito primero (rojo confirmado sin la implementación) y luego la implementación mínima (verde, 6/6 tests).
- `frontend/`: scaffold con Vite (`react-ts`) + Tailwind CSS v4 (`@tailwindcss/vite`) + React Router + `socket.io-client`, y Vitest + React Testing Library para tests. Se limpió el boilerplate de landing page de `create-vite` y se armó la estructura de páginas (`pages/vecino/*`, `pages/admin/*`) con un componente compartido `PantallaCentrada` como base del estilo mobile-first tipo Apple. Test de routing (`App.test.tsx`) y build de TypeScript verificados en verde.
- **Estado:** hay scaffolding funcional en ambos proyectos, con la primera pieza de dominio (máquina de estados) probada. Falta implementar el resto de los services, la persistencia en PostgreSQL, la autenticación, el storage real contra MinIO, las notificaciones, WebSockets, y conectar las páginas del frontend a la API.

### Próximos pasos
1. Migraciones de PostgreSQL (tablas del modelo de datos ya definido).
2. TDD del servicio `TiposTramite` y luego `Tramites` (usa la máquina de estados ya implementada).
3. Autenticación admin (JWT) y el selector de identidad simulado para el vecino.
4. Adapter de storage (MinIO/S3) y adapters de notificación (email mockeado, WhatsApp/SMS prototipados).
5. Conectar el frontend a la API real (reemplazar los placeholders de cada página).

## 2026-07-21 (continuación) — Relevamiento de trámites y cierre del esquema de formulario configurable

- Se relevó el listado oficial de https://www.sannicolasciudad.gob.ar/tramites (18 categorías, ~90 trámites) y el detalle de 5 fichas representativas de distinta complejidad (Bromatología, Catastro, Habilitaciones, Deportes, Licencia de Conducir). Todas comparten el mismo patrón estructural: título, descripción, requisitos, pasos, archivos para descargar, costo, modalidad y contacto. El análisis completo queda en `docs/ANALISIS_TRAMITES.md`.
- Se cerró el pendiente del esquema de formulario configurable: tipos de campo soportados (`texto`, `texto_largo`, `numero`, `fecha`, `email`, `telefono`, `select`, `checkbox`, `archivo`) y metadata informativa adicional en `tipos_tramite` (requisitos, pasos, archivos de referencia, costo, modalidad, contacto), documentado en `docs/DECISIONES.md`.
- Se definió el trámite principal a cargar: **Inscripción a becas deportivas** (gratuito, 8 campos + 1 archivo, estado intermedio "documentación requerida"). Se dejaron 2 trámites secundarios opcionales (Certificado de vivienda única, Permiso para eventos culturales) para cargar solo si el tiempo lo permite.
- Se diseñó (sin implementar aún) el mecanismo de versionado/copia/aprobación de tipos de trámite pedido por el usuario: columnas `version`, `estado` (`borrador`/`publicado`/`archivado`), `tipo_tramite_origen_id`, `publicado_en`, `publicado_por` en `tipos_tramite`, sin tablas ni workflow nuevos. Detalle y reglas de comportamiento en `docs/DECISIONES.md` y `docs/ANALISIS_TRAMITES.md`.
- **Aún no hay código de este diseño implementado.** Sigue pendiente el scaffolding de migraciones y services listado arriba; este análisis alimenta directamente el diseño de la tabla `tipos_tramite` cuando se escriban las migraciones.

### Próximos pasos
1. Migraciones de PostgreSQL incorporando las columnas de metadata y versionado definidas hoy.
2. Seed de datos del tipo de trámite "Inscripción a becas deportivas".
3. TDD del servicio `TiposTramite` (incluyendo la regla de no editar in place un tipo publicado con instancias) y luego `Tramites`.
4. Autenticación admin (JWT) y el selector de identidad simulado para el vecino.
5. Adapter de storage (MinIO/S3) y adapters de notificación.

## 2026-07-21 (continuación) — Segundo y tercer ciclo TDD: esquema de formulario y `TiposTramiteService` con versionado

- `src/domain/esquemaFormulario.ts`: `validarEsquemaFormulario` (mínimo 8 campos, al menos uno de tipo `archivo`, ids únicos, `select` requiere opciones, patrón de `validacion` debe ser una regex válida). Tipos de campo alineados con `docs/ANALISIS_TRAMITES.md`: `texto`, `texto_largo`, `numero`, `fecha`, `email`, `telefono`, `select`, `checkbox`, `archivo` (se corrigieron nombres provisorios `textarea`/`seleccion` usados en el primer intento).
- `src/domain/flujoEstados.ts` sumó `validarFlujoEstados` (estado inicial debe existir en la lista de estados, transiciones solo entre estados declarados).
- `src/services/tiposTramite.ts`: `TiposTramiteService` con `crear` (arranca en `estado: "borrador"`, `version: 1`), `publicar` (borrador → publicado, solo desde borrador, registra `publicadoPor`/`publicadoEn`) y `editar`, que implementa la regla de versionado de `docs/ANALISIS_TRAMITES.md` — edita in place si está en borrador o publicado sin instancias, pero si está publicado y tiene trámites instanciados crea una fila nueva (`version + 1`, `estado: "borrador"`, `tipoTramiteOrigenId` apuntando al original) sin tocar la versión publicada. Rechaza editar un tipo archivado.
- Cada pieza se hizo con el ciclo rojo→verde confirmado (test que falla por falta de implementación, luego implementación mínima). Suite completa del backend: **29/29 tests en verde**.
- Metadata informativa de `tipos_tramite` (categoría, requisitos, pasos, archivos de referencia, costo, modalidad, contacto) todavía no se modeló en código — no tiene lógica de negocio que testear, se incorpora directamente al escribir las migraciones y el repositorio real de PostgreSQL.

### Próximos pasos
1. Migraciones de PostgreSQL (incluyendo metadata y columnas de versionado) y repositorio real de `tipos_tramite` sobre `pg`.
2. Seed de datos: "Inscripción a becas deportivas" (trámite principal) y, si el tiempo alcanza, los dos trámites secundarios.
3. TDD del servicio `Tramites` (creación validando contra el esquema del tipo, cambio de estado usando `aplicarTransicion`, comentarios, generación de eventos de historial).
4. Autenticación admin (JWT) y el selector de identidad simulado para el vecino.
5. Adapter de storage (MinIO/S3) y adapters de notificación.

## 2026-07-21 (continuación) — Migraciones de PostgreSQL

- Test faltante en `esquemaFormulario.test.ts`: se agregó el caso que cubre el tipo `checkbox` (la implementación ya lo soportaba pero no tenía test propio). Suite completa: 30/30 en verde.
- `backend/migrations/`: 6 archivos `.sql` numerados (`admins`, `tipos_tramite` con toda la metadata informativa y las columnas de versionado, `tramites`, `archivos_tramite`, `comentarios`, `eventos_historial`), uno por tabla, con los índices y foreign keys correspondientes.
- `backend/scripts/migrar.js`: runner propio sobre el cliente `pg` (sin sumar un framework de migraciones) — aplica en orden los archivos pendientes, cada uno en una transacción, registrando lo aplicado en una tabla de control `esquema_migraciones`. Expuesto como `npm run migrate`. Justificación completa en `docs/DECISIONES.md`.
- Se levantó PostgreSQL 16 vía `docker-compose` y se corrieron las 6 migraciones contra la base real: esquema verificado columna por columna, y se confirmó que una segunda corrida no reaplica nada (idempotente).
- Nota de entorno (no es una decisión de arquitectura): en esta máquina el puerto `5432` ya estaba tomado por un contenedor de otro proyecto (`driveprolink_postgres`), así que el Postgres de este repo quedó mapeado a `5433` en el host. `docker-compose.yml` y `backend/.env.example` se actualizaron acorde (`POSTGRES_PORT`, default `5433`).
- **Estado:** hay esquema real de base de datos funcionando, pero `TiposTramiteService` todavía usa el `RepositorioFake` de los tests — falta el repositorio real sobre `pg` que implemente `TiposTramiteRepositorio` contra estas tablas, y los campos de metadata informativa (requisitos, pasos, etc.) todavía no están en el modelo TypeScript del servicio, solo en la tabla.

### Próximos pasos
1. Repositorio real de `tipos_tramite` sobre `pg` que implemente `TiposTramiteRepositorio`, y decidir si la metadata informativa se suma ahora a `DatosTipoTramite`/`TipoTramite` o queda para después.
2. Seed de datos: "Inscripción a becas deportivas" (trámite principal) y, si el tiempo alcanza, los dos trámites secundarios.
3. TDD del servicio `Tramites` (creación validando contra el esquema del tipo, cambio de estado usando `aplicarTransicion`, comentarios, generación de eventos de historial).
4. Autenticación admin (JWT) y el selector de identidad simulado para el vecino.
5. Adapter de storage (MinIO/S3) y adapters de notificación.

## 2026-07-21 (continuación) — Resto de la capa de servicios/adapters cubierta con TDD (sesión en paralelo)

Trabajando en paralelo a las migraciones (sesión anterior), se completó con TDD todo lo que no depende de infraestructura real. Suite completa del backend: **86/86 tests en verde**. Nuevo por pieza:

- `src/domain/datosFormulario.ts` — `validarDatosFormulario`: valida los datos que carga el vecino contra el `esquema_formulario` de un tipo (obligatoriedad, `select` contra `opciones`, formato de `email`, patrón de `validacion` por campo).
- `src/services/tramites.ts` — `TramitesService` completo:
  - `crear`: rechaza si el tipo no existe o no está `publicado` (`TipoTramiteNoDisponibleError`), valida `datosFormulario` con lo anterior, crea el trámite en el estado inicial del `flujoEstados` del tipo, registra evento de historial `creacion` y emite `tramite.creado`.
  - `cambiarEstado`: reutiliza `aplicarTransicion` del dominio (ya no se reimplementa la máquina de estados), registra evento `cambio_estado` y emite `tramite.estado_cambiado`.
  - `agregarComentario`: valida que no esté vacío, registra evento `comentario` y emite `tramite.comentario_agregado`.
- `src/services/authAdmin.ts` — `AuthAdminService.login`: valida contra un repositorio de admins + un `HashService`, emite JWT vía un puerto `EmisorJwt`, lanza `CredencialesInvalidasError` de forma genérica (no distingue "no existe" de "contraseña incorrecta" en el mensaje, para no filtrar qué emails están registrados).
- `src/adapters/seguridad/jwtService.ts` y `bcryptHashService.ts` — implementaciones reales (no fakes) sobre `jsonwebtoken` y `bcryptjs`, testeadas directamente porque son deterministas y no requieren red.
- `src/middleware/autenticacion.ts` — `crearMiddlewareAutenticacion(verificador, rolesPermitidos?)`: mismo middleware para rutas de vecino y de admin, solo cambia qué roles acepta; 401 sin token o token inválido, 403 si el rol no está permitido.
- `src/services/selectorIdentidad.ts` — `SelectorIdentidadService` + `IDENTIDADES_DE_PRUEBA` (3 identidades mock): emite JWT con rol `ciudadano` representando el resultado de un login externo ya resuelto (ver decisión de auth de vecino en `docs/DECISIONES.md`).
- `src/adapters/storage/s3AlmacenamientoArchivos.ts` — `S3AlmacenamientoArchivos` sobre `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (URLs firmadas). Mismo cliente para MinIO y S3 real: el switch es la configuración (`endpoint`, `forcePathStyle`, credenciales) que ya estaba definida en `.env.example`. Testeado con un cliente fake para `subir`/`eliminar` y un `S3Client` real (sin red) para confirmar que la URL firmada sale bien formada.
- `src/adapters/notificaciones/` — `EmailNotificacionAdapter`, `WhatsAppNotificacionAdapter`, `SmsNotificacionAdapter`: misma interfaz `CanalNotificacion`, cada uno con el envío real comentado y un log del intento (email) o marcado como prototipo (WhatsApp/SMS), con el punto de integración de un proveedor real indicado en un comentario.
- `src/realtime/emisorEventosDominio.ts` — `EmisorEventosDominio`: wrapper sobre el `EventEmitter` de Node que implementa el puerto `EmisorEventos` que ya usaba `TramitesService`, más un método `suscribir` para los consumidores (notificaciones, WebSockets a futuro).
- `src/services/notificacionesTramites.ts` — conecta los eventos `tramite.creado`/`tramite.estado_cambiado` con el canal email (el único con envío real habilitado); sumar WhatsApp/SMS es agregar una llamada más por canal.
- Se sumó la metadata informativa de `tipos_tramite` (`categoria`, `requisitos`, `pasos`, `archivosReferencia`, `costo`, `modalidad`, `contacto`) al modelo TypeScript de `TipoTramite`/`DatosTipoTramite` (antes solo estaba en la tabla de la migración), con valores por defecto cuando no se especifican, para que el repositorio real que se está escribiendo en paralelo tenga el tipo completo contra el cual implementar.

### Coordinación con la sesión en paralelo (importante para quien retome)

Mientras esta sesión cubría lo de arriba, la otra sesión armó `backend/migrations/` (6 archivos SQL) y `backend/scripts/migrar.js`, y ya corrió las migraciones contra el Postgres real de `docker-compose` (confirmado con `\dt`: existen `admins`, `tipos_tramite`, `tramites`, `archivos_tramite`, `comentarios`, `eventos_historial`, `esquema_migraciones`). También creó las carpetas `src/config/`, `src/controllers/`, `src/repositories/` y `src/routes/` (vacías al momento de este corte).

**Para no pisarse:** esta sesión se detuvo antes de tocar `src/repositories/`, `src/controllers/`, `src/routes/` y `src/config/` porque son exactamente el terreno donde la otra sesión estaba a punto de escribir (repositorio real de `tipos_tramite` sobre `pg`, según sus propios "próximos pasos"). Todo lo que necesita esa capa ya está definido como puertos/interfaces en los services (`TiposTramiteRepositorio`, `TramitesRepositorio`, `AdminsRepositorio`, `TiposTramiteConsulta`, `TramitesConsulta`) — implementarlos contra `pg` es el siguiente paso natural, sin tener que tocar ninguno de los archivos que ya están en verde.

### Estado general del backend

**Cubierto y con TDD (86/86 tests en verde):** máquina de estados genérica, validación de esquema de formulario y de datos del vecino, `TiposTramiteService` completo (crear/publicar/editar con versionado), `TramitesService` completo (crear/cambiar estado/comentar + historial + eventos de dominio), autenticación admin (hash + JWT + middleware), selector de identidad simulada del vecino, storage S3/MinIO intercambiable, notificaciones (email real-mockeado + WhatsApp/SMS prototipados) conectadas vía event emitter interno.

**Hecho pero fuera de este set de tests (otra sesión):** esquema real de PostgreSQL migrado y corriendo.

## 2026-07-21 (continuación) — La otra sesión terminó: repositorios reales, bootstrap del server, subida de archivos y WebSockets

La otra sesión cerró con las migraciones aplicadas (ver arriba). A partir de ahí, en esta sesión:

- Se detectó un desajuste entre el modelo TypeScript y el esquema real: `tramites` solo tenía `ciudadano_id`, sin nombre/email para poder notificar al vecino (el `esquema_formulario` no sirve para eso porque puede referirse a otra persona, ej. el menor en "Inscripción a becas deportivas"). Se agregó la migración `007_agregar_contacto_ciudadano_a_tramites.sql` (`ciudadano_nombre`, `ciudadano_email`) y se renombró `Tramite.ciudadanoDni` a `ciudadanoId` en el modelo. Se completó también la metadata informativa de `tipos_tramite` en el `TiposTramiteService` (antes solo estaba en la migración). Detalle y justificación en `docs/DECISIONES.md`.
- **Repositorios reales sobre `pg`**, probados por integración contra el PostgreSQL real de `docker-compose` (no mocks): `TiposTramitePgRepositorio`, `TramitesPgRepositorio`, `AdminsPgRepositorio` — implementan exactamente los puertos que ya usaban los services, más algunos métodos de lectura simples (`listar`, `listarComentarios`, `listarHistorial`) para bandejas/detalle que no forman parte del puerto de negocio.
- **Composition root** (`src/config/contenedor.ts`): único lugar donde se instancian las implementaciones concretas (repos, `JwtService`, `BcryptHashService`, cliente S3, adapters de notificación, `EmisorEventosDominio`) e inyectan en los services.
- **API HTTP completa**: `src/app.ts`/`src/server.ts`, middleware de manejo de errores (`manejoErrores.ts`, traduce errores de los services a status HTTP por nombre de clase), controllers + routes para: login admin, selector de identidad del vecino, CRUD + publicación de tipos de trámite, crear/consultar/cambiar estado/comentar trámites, bandeja de administrador con filtros, y **subida real de archivos** (`multer` + el adapter de storage → `POST /api/archivos` devuelve una clave que se referencia en el campo tipo archivo del formulario).
- **Gateway de WebSockets** (`socket.io`) suscrito al mismo `EmisorEventosDominio`: salas por trámite y una sala `admin`, sin duplicar el flujo de eventos que ya usan las notificaciones.
- **Verificación real, no solo mocks:** se levantó MinIO vía `docker-compose` y se creó el bucket `tramites-archivos`; un test end-to-end con Supertest recorre el flujo completo contra Postgres y MinIO reales (login admin → crear y publicar tipo de trámite → identidades → sesión de vecino → **subir archivo real a MinIO** → crear trámite → 403 en trámite ajeno → cambiar estado → comentar → detalle con historial → bandeja filtrada), y se confirmó manualmente que `npm run dev` levanta el servidor y que el archivo subido queda en el bucket real.
- Nota de infra: los tests de integración corren en serie (`maxWorkers: 1` en `jest.config.js`) porque comparten el mismo Postgres real entre archivos — en paralelo se pisaban entre sí (TRUNCATE de un archivo carrera contra el fixture de otro).
- **Suite completa: 103/103 tests en verde** (unitarios + integración contra Postgres real + WebSockets real + end-to-end con Supertest).

### Estado general del backend (actualizado)

**Funcionando de punta a punta:** motor de trámites completo (crear tipo → publicar → cargar trámite → cambiar estado → comentar → historial), auth real de admin, identidad simulada de vecino, storage real (MinIO, intercambiable a S3 por config), notificaciones por email conectadas, WebSockets, todo servido por una API Express real y probado contra infraestructura real (no solo fakes).

## 2026-07-21 (continuación) — Seed de datos, validación con zod, decisión de monorepo y commit inicial

- **Seed** (`backend/scripts/seed.ts`, `npm run seed`): idempotente, crea el admin `admin@sannicolas.gob.ar` / `admin123` y publica "Inscripción a becas deportivas" con su esquema y flujo reales (usa los mismos services/repositorios de la app, no SQL a mano). Verificado corriéndolo dos veces seguidas (la segunda no duplica nada) y confirmando el login por API con esas credenciales.
- **Validación en el borde HTTP**: middleware genérico `validarBody(esquemaZod)` + esquemas centralizados en `src/routes/esquemasValidacion.ts`, aplicados a todos los endpoints que reciben body. Un body mal formado ahora responde 400 antes de llegar al service (agregado como caso al test end-to-end).
- Se detectó y corrigió una colisión de datos: los tests de integración usaban el mismo email `admin@sannicolas.gob.ar` que el seed real — se renombraron a `admin-test@sannicolas.gob.ar` en los tests para no pisarse con los datos de seed.
- **Se creó `backend/.gitignore`**, que no existía (riesgo de commitear `node_modules` y `.env` con credenciales, aunque sean de desarrollo).
- **Decisión de alcance:** el repositorio queda como monorepo también para la entrega final, no se separa en `frontend`/`backend` como repos independientes. Cierra el único pendiente que quedaba abierto en `docs/DECISIONES.md`.
- **Suite completa: 106/106 tests en verde.**
- Se hizo el primer commit y push del proyecto a `origin/main` (repo hasta ahora sin ningún commit propio, solo el README original heredado).

### Estado general del backend (actualizado, cierre de esta etapa)

**Funcionando de punta a punta y con datos reales cargados:** motor de trámites completo, auth real de admin, identidad simulada de vecino, storage real intercambiable MinIO/S3, notificaciones por email, WebSockets, validación de forma en el borde HTTP, seed de datos. Todo probado contra infraestructura real, no solo fakes.

**Falta:**
1. Conectar el frontend (hoy son pantallas placeholder) a la API real: login admin, selector de identidad, formulario dinámico de nuevo trámite (incluyendo la subida de archivo), bandeja de entrada con filtros, detalle con historial y actualización en tiempo real vía WebSocket, ABM de tipos de trámite.
2. Video de 3-5 minutos y armado final de la entrega, una vez que el frontend esté conectado.

## 2026-07-21 (continuación, sesión nocturna) — Frontend conectado por completo + 2 tipos de trámite adicionales + datos de ejemplo

Sesión larga, sin supervisión directa del usuario (se avisó que retomaría a las 8 AM). Resumen para retomar:

### Qué se hizo
- **Frontend conectado de punta a punta a la API real**, con TDD en cada pieza (53/53 tests en verde, Vitest + RTL): sesión persistida en `localStorage` vía `AuthProvider`/`useAuth`, guard de rutas por rol (`RequireAuth`), selector de identidad y login admin reales, "Mis trámites", formulario dinámico de nuevo trámite (con subida real de archivo a MinIO antes de crear el trámite), detalle del vecino con historial y actualización en tiempo real (WebSocket), bandeja de entrada del admin con filtro por estado y tiempo real, detalle del admin (cambiar estado respetando las transiciones del flujo del tipo, comentar, ver historial), y un ABM de tipos de trámite con un constructor de formulario/flujo de estados (campos dinámicos + grilla de transiciones válidas).
- **2 tipos de trámite adicionales** sembrados vía `backend/scripts/seed.ts` (ahora sembra 3 tipos, no 1): "Certificado de vivienda única o de no poseer bienes" (Catastro, formulario simple, flujo de 4 estados) y "Solicitud de permiso para eventos culturales" (Permisos y Solicitudes, formulario más denso, flujo de 5 estados con un paso de "intervención de seguridad"). Diseñados según `docs/ANALISIS_TRAMITES.md`.
- **7 trámites de ejemplo** repartidos entre los 3 vecinos de prueba (Juana Pérez, Martín Gómez, Lucía Fernández) y los 3 tipos de trámite, en distintos estados (pendiente, en_revisión, aprobado, rechazado), para que la bandeja del admin y "mis trámites" de cada vecino no arranquen vacíos. Se generan con `TramitesService`/`cambiarEstado` real (no INSERT a mano), así que también quedan sus eventos de historial correctos.
- Build de producción del frontend verificado (`npm run build`). Flujo verificado manualmente con `curl` contra ambos servidores corriendo en simultáneo (login admin, listar tipos de trámite, listar trámites de un vecino específico) — resultados reales confirmados, no solo tests.
- Commit y push del frontend (el backend ya se había subido en la sesión anterior).

### ⚠️ Cosas a las que prestar atención

1. **Correr `npm test` en `backend/` vuelve a dejar la base sin los datos de seed.** Los tests de integración (`src/repositories/*.test.ts`, `src/app.test.ts`) truncan `admins`/`tipos_tramite`/`tramites` contra el mismo PostgreSQL real de `docker-compose` que usa el seed — no hay una base separada para tests. Si volviste a correr la suite del backend, **corré `npm run seed` de nuevo antes de probar la app**, o vas a encontrar la bandeja del admin vacía y el login `admin@sannicolas.gob.ar` / `admin123` fallando. Esto es una limitación conocida, no un bug: separar bases de test/dev es la mejora natural si se sigue iterando (ver "Falta" más abajo).
2. **No se hizo verificación visual en un navegador real.** Este entorno no tiene una herramienta de automatización de browser disponible. La cobertura de UI es: tests con Vitest + React Testing Library (interacción simulada, DOM real vía jsdom) + verificación funcional de la API con `curl`. Antes de dar el flujo por "probado visualmente", conviene que el usuario lo recorra a mano en el navegador.
3. **Decisiones tomadas sin consulta directa (usando criterio propio), a revisar:**
   - El constructor de tipos de trámite en el admin carga los estados como texto libre separado por comas y las transiciones como una grilla de checkboxes, en vez de un editor visual de flujo — se priorizó cubrir el caso de uso sin construir un editor gráfico de grafos.
   - El campo de filtro de estado en la bandeja del admin es un input de texto libre (no un `<select>` con opciones fijas), porque los estados son distintos por cada tipo de trámite y no hay un catálogo único de estados posibles.
   - Se sacó el atributo HTML `required` del input de archivo (ver nota técnica en `docs/DECISIONES.md`) — la validación de "falta adjuntar el archivo" ahora es JavaScript propio, no nativa del navegador.
   - Los 7 trámites de ejemplo y sus datos (nombres, DNIs, fechas) son ficticios, inventados para la demo — no corresponden a personas reales.
4. Cómo levantar todo para probarlo: `docker compose up -d` (Postgres + MinIO, si no están corriendo), `cd backend && npm run dev`, `cd frontend && npm run dev`, entrar a `http://localhost:5173`. Login admin: `admin@sannicolas.gob.ar` / `admin123`.

### Estado general del proyecto (cierre de esta sesión)

**Funcionando de punta a punta, con frontend y backend conectados, datos de ejemplo reales cargados, y todo commiteado/pusheado.** Motor de trámites completo (3 tipos, 7 trámites de ejemplo), auth real de admin, identidad simulada de vecino, storage real MinIO, notificaciones por email, WebSockets, validación en el borde HTTP, frontend completo conectado a la API real.

### Falta
1. Separar la base de datos de test de la de desarrollo/seed (evitaría el problema del punto 1 de arriba) — mejora de infraestructura, no bloqueante.
2. Verificación visual manual en el navegador por parte del usuario.
3. Video de 3-5 minutos y armado final de la entrega.
4. Revisar las decisiones de criterio propio listadas arriba y ajustar si no coinciden con lo que el usuario tenía en mente.

## 2026-07-22 — Ronda de feedback tras la primera revisión visual

El usuario probó la app y pidió varios ajustes de UX/negocio. Se resolvieron todos:

1. **El mínimo de 8 campos + 1 archivo no debía ser una regla general del motor** (era del enunciado, para el trámite de referencia puntual). Se sacó de `validarEsquemaFormulario` (backend); ahora solo exige al menos 1 campo. Documentado en `docs/DECISIONES.md`.
2. **No se podían editar tipos de trámite desde la UI** (el backend ya lo soportaba vía `PATCH`, faltaba conectarlo). Se agregó, reutilizando `FormularioTipoTramite` en modo edición (prop `tipoExistente`).
3. **Creación/edición de tipos de trámite y carga de nuevo trámite pasaron a un modal** (componente `Modal` nuevo, reutilizado en ambos flujos — admin y vecino comparten el mismo patrón de interacción).
4. **Tema oscuro sacado por completo.** Se redefinió la variante `dark:` de Tailwind en `index.css` (`@custom-variant dark (&:where(.modo-oscuro-deshabilitado, .modo-oscuro-deshabilitado *))`) para que dependa de una clase que nunca se aplica, y además se limpiaron todas las clases `dark:` sueltas del resto de los componentes.
5. **La bandeja de entrada del admin no mostraba a qué tipo de trámite correspondía cada fila** (solo el ID y el vecino). Se agregó una columna "Tipo de trámite". Esto requirió un cambio de backend: `GET /api/tramites/:id`, `/api/tramites/mios` y `/api/admin/tramites` ahora devuelven `tipoTramiteNombre` (antes había que armar el nombre a mano desde el frontend con una consulta aparte).
6. **Faltaba un botón para volver del detalle de un trámite al listado**, tanto para el vecino como para el admin. Se agregó (`PantallaAncha` ahora acepta un prop `volverA`).
7. **El detalle de un trámite no mostraba qué trámite era** (solo el ID en el título). Ahora el título es el nombre del tipo de trámite, y debajo, en texto pequeño y en un gris más tenue, va "#id · Iniciado el [fecha]".

Verificación: **106/106 tests backend + 60/60 tests frontend en verde**, build de producción del frontend verificado, y se probó a mano por `curl` que ahora se puede crear un tipo de trámite con un solo campo (antes se rechazaba) y que la bandeja/mis-trámites devuelven `tipoTramiteNombre`. Se re-sembraron los datos después de correr la suite del backend (recordatorio: sigue siendo necesario después de cada `npm test` en `backend/`, ver nota de la sesión anterior).

### Estado
Todo lo pedido en esta ronda de feedback está resuelto y verificado. Pendiente: que el usuario lo revise visualmente en el navegador (esta sesión sigue sin esa herramienta disponible).

## 2026-07-22 (continuación) — Tercera ronda: modal, buscador único de la bandeja, y versionado completo

- **Modal**: tenía el título dentro del área con scroll (se volvía invisible al scrollear un formulario largo). Se separó en header fijo + cuerpo con scroll propio, y se agrandó (`max-w-3xl`, `max-h-[88vh]`).
- **`ListaTiposTramitePorCategoria`** (componente nuevo): agrupa tipos de trámite por categoría + buscador de texto libre. Reutilizado en "Nuevo trámite" (vecino) y "Tipos de trámite" (admin), tal como pidió el usuario.
- **Bandeja de entrada**: el filtro por estado era coincidencia exacta contra un solo campo (inútil — buscar "revi" no encontraba "en_revision"). Se reemplazó por un único buscador que filtra client-side por coincidencia parcial sobre estado, tipo de trámite, categoría, vecino y número de trámite. Requirió sumar `tipoTramiteCategoria` a las respuestas del backend.
- **Modalidad como select** (online/presencial/mixta) en vez de texto libre.
- **Versionado de tipos de trámite — vacío importante detectado y corregido**: el usuario notó que no había ningún indicio de que el versionado funcionara. Se encontraron dos huecos reales:
  1. Publicar una nueva versión no archivaba la versión anterior — podían quedar dos versiones "publicado" del mismo tipo simultáneamente (el vecino habría visto el mismo trámite duplicado en la lista para elegir). Corregido: `publicar()` archiva automáticamente el predecesor si seguía publicado.
  2. No había forma de saber contra qué versión de un tipo se creó un trámite ya cargado. Se agregó `tipoTramiteVersion` a las respuestas — **pero solo para el admin** (bandeja y detalle); el vecino no lo ve, ni siquiera en la respuesta HTTP cruda, porque el usuario fue explícito en que "eso no lo necesita saber el vecino, pero sí el administrador".
  - Se agregó también un aviso visible en el admin cuando una edición efectivamente crea una nueva versión (antes pasaba desapercibido).
  - Se decidió no construir un flujo de aprobación con más pasos (revisor distinto del editor, etc.) — el ciclo borrador→publicado ya cubre lo que pide el enunciado, y el usuario mismo dijo que estaba bien si esa parte no se complejizaba más.
- Verificado a mano contra la API real (no solo tests): se creó v1, se publicó, un vecino cargó un trámite, se editó v1 (creó v2), se publicó v2, se confirmó que v1 quedó `archivado` y que el trámite del vecino sigue mostrando `v1` al admin. Se limpiaron los datos de prueba generados durante la verificación.
- **107 tests backend + 72 tests frontend en verde**, build de producción verificado.

### Estado y pendientes
Todo lo pedido hasta ahora está resuelto, commiteado y pusheado. Sigue pendiente: verificación visual del usuario en el navegador, y — si en algún momento se corre `npm test` en `backend/` de nuevo — recordar re-sembrar con `npm run seed` porque los tests de integración truncan la misma base de desarrollo.

## 2026-07-21 (continuación) — Cuarta ronda: identidad visual institucional, resumen del vecino, barra de progreso

- **Colores de marca**: se reemplazó el negro de botones/links por el celeste institucional `#0095da` (el usuario dio el color exacto, tomado de la página real de trámites de San Nicolás). Definido en `index.css` como `--color-brand`/`--color-brand-dark` y aplicado en toda la app.
- **Header con el logo oficial**: se encontró que el logo ya estaba en el repo (`assets/sn-logo.png`, con exactamente el mismo celeste) — se copió a `frontend/public/` y se usa en el header (`PantallaAncha`) y en las pantallas de login/selector (`PantallaCentrada`). No hizo falta generar ni buscar un logo nuevo.
- **Botón "volver" faltante en "Tipos de trámite"** del admin — se había pasado por alto en la ronda anterior.
- **Resumen de lo que el vecino cargó**: el detalle del vecino solo mostraba estado + historial, sin ver sus propios datos. Se agregó un resumen con etiquetas legibles (no las claves internas del formulario) y valores amigables (Sí/No para checkbox, "Archivo adjunto" en vez de la clave de storage). Requirió que el backend agregue `tipoTramiteEsquemaFormulario`/`tipoTramiteFlujoEstados` al detalle de trámite (visibles para ambos roles, a diferencia de la versión que sigue siendo solo-admin). El mismo componente se reutilizó en el detalle del admin, que antes mostraba las claves crudas.
- **Barra de progreso ("camino feliz")**: el usuario pidió una barra con verde=completado, resaltado=actual, gris=pendiente, para los "estados posibles del caso positivo normal". Como el flujo de estados es un grafo genérico (con ramas de rechazo y estados de corrección que vuelven atrás), hizo falta un heurístico (`calcularCaminoFeliz`) para reconstruir ese camino: prefiere, en cada paso, la transición no-negativa que no vuelve a un estado ya visitado (así distingue un paso de corrección real, tipo "documentación requerida", de un paso de revisión adicional que sigue siempre hacia adelante, tipo "intervención de seguridad" en el permiso de eventos). Probado con los 3 flujos reales sembrados, da el resultado esperado en los tres casos.
- **107 tests backend + 88 tests frontend en verde**, build de producción verificado, y se confirmó a mano contra la API real que el logo se sirve y que el detalle de trámite trae el esquema/flujo del tipo.

### Estado
Todo lo pedido en esta ronda está resuelto, verificado y listo para commitear. Sigue pendiente que el usuario lo vea en el navegador (esta sesión sigue sin esa herramienta).

## 2026-07-21 (continuación) — Quinta ronda: pulido de layout a partir de capturas reales del usuario

Esta vez el usuario mandó screenshots reales de la app corriendo, lo que permitió ver bugs de layout que no salían de los tests:

- Badge de estado duplicado en el detalle del vecino (arriba y en la barra de progreso) → se sacó el de arriba, el estado ahora va en el subtítulo del header junto a la fecha.
- Header no quedaba fijo al scrollear → ahora es `sticky` en ambos roles.
- Poco aprovechamiento del ancho en pantallas grandes → contenedor más ancho (`max-w-7xl`) y una columna más en las grillas de tarjetas en pantallas extra anchas.
- En "Tipos de trámite", si el nombre del tipo era largo, los botones "Editar"/"Publicar" se corrían más abajo que en tarjetas con nombres cortos (inconsistente entre tarjetas de la misma fila). Se cambió a un layout de columna con los botones siempre pegados abajo de la tarjeta. Se aplicó el mismo cuidado defensivo a "mis trámites" (el badge de estado no se corre con nombres largos).
- 89 tests frontend en verde, sin cambios de backend esta vez.

### Nota para la próxima sesión
Esta es la primera ronda donde el feedback vino de capturas reales de la app corriendo, no solo de descripciones — varios de estos bugs (botones que se corren, header no fijo) son del tipo que solo se detecta mirando la UI real, no con tests automatizados. Si el usuario manda más capturas, priorizarlas como fuente de verdad por sobre lo que "deberían" verse los componentes según el código.

## 2026-07-21 (continuación) — Campanita de notificaciones

El usuario pidió: notificación para el vecino cuando su trámite cambia de estado, con el patrón habitual de campanita + badge de no leídas. Detalle completo de las decisiones técnicas en `docs/DECISIONES.md` ("Campanita de notificaciones"); acá el resumen de sesión:

- Backend: se enriquecieron los payloads de `tramite.creado`/`tramite.estado_cambiado`/`tramite.comentario_agregado` (agregan `ciudadanoId` y, salvo en comentarios, `tipoTramiteNombre`) y se agregó una sala de socket nueva (`ciudadano:<id>`) para que el vecino reciba eventos de todos sus trámites sin importar en qué pantalla esté.
- Frontend: `NotificacionesProvider` (contexto global montado en `main.tsx`, no un hook por-página como los ya existentes) + `CampanitaNotificaciones` en el header. Decisión de alcance sin confirmar explícitamente con el usuario pero razonada por sentido común: el vecino se notifica con cambios de estado y comentarios (los origina el admin, siempre es novedad); el admin se notifica solo con trámites nuevos (`tramite.creado`), no con sus propias acciones, para no auto-notificarse. Las notificaciones viven solo en memoria (no hay persistencia entre refrescos de página ni tabla en base de datos) — se consideró suficiente para el alcance.
- Verificado con 109 tests backend + 97 tests frontend en verde, y con un cliente de socket real contra la API corriendo (se restauraron los datos de demo a su estado original después de la prueba manual).

### Estado
Resuelto, verificado y listo para commitear. Sigue pendiente que el usuario lo vea en el navegador.

## 2026-07-21 (continuación) — Persistencia real de las notificaciones

El usuario preguntó qué significaba "en memoria" y señaló correctamente el problema: si el vecino no tenía la pestaña abierta en el momento exacto del cambio de estado, la notificación se perdía para siempre. Pidió persistencia real sin perder el tiempo real, y sacar el "Todavía" de "Todavía no tenés notificaciones".

- Tabla nueva `notificaciones` (migración `008`), con un listener nuevo (`registrarNotificacionesPersistentes`) sobre el mismo `EmisorEventosDominio` que ya alimenta emails y WebSockets — un cuarto consumidor del mismo evento, sin tocar `TramitesService`. Endpoints `GET /api/notificaciones` y `PATCH /api/notificaciones/marcar-leidas`.
- Los admins comparten una bandeja de notificaciones (no hay "leído por este admin en particular"), consistente con que ya comparten la sala de socket `admin`.
- El frontend arma el mismo texto del mensaje que el backend persiste, de forma duplicada a propósito: mostrar la notificación en tiempo real no puede esperar una vuelta a la base de datos. `NotificacionesProvider` ahora hidrata desde la API al iniciar sesión y sigue sumando en vivo por WebSocket.
- Detalle completo en `docs/DECISIONES.md` ("Persistencia real de las notificaciones").
- Nota técnica no trivial: agregar el fetch de hidratación rompió 6 archivos de test de página existentes, porque competían por el mismo mock secuencial de `apiFetch`. Se resolvió con un helper compartido (`frontend/src/test/apiFetchMock.ts`) que responde las rutas de notificaciones aparte, sin consumir la cola de respuestas de cada test.
- Verificado con 117 tests backend + 99 tests frontend en verde, y a mano contra la API real corriendo (se restauraron los datos de demo después).

### Estado
Resuelto, verificado y listo para commitear.

## 2026-07-21 (continuación) — Sexta ronda: compactar el resumen del formulario, aprovechar el ancho en el detalle del vecino

El usuario preguntó primero si se había perdido el seed (no era así — se verificó contra la base que los 3 tipos de trámite, los 7 trámites de ejemplo y el admin real seguían intactos; solo había quedado un admin de test de una corrida de Jest anterior sin limpiar, que se borró). Después mandó una captura señalando que en el detalle del vecino las etiquetas y valores del resumen quedaban "a 5 pueblos de distancia" (por el `justify-between` en pantallas anchas) y que sobraba mucho espacio en blanco a la derecha.

- `ResumenDatosFormulario` pasó de `flex justify-between` a un grid de dos columnas con la columna de etiqueta acotada — quedan próximos sin importar el ancho de pantalla.
- El detalle del vecino (que era una sola columna) pasó a la misma estructura de dos columnas que ya usaba el detalle del admin: barra de progreso arriba (ancho completo), resumen + comentarios a la izquierda, historial a la derecha.
- 99 tests frontend en verde, build de producción verificado.

### Estado
Resuelto, verificado. Sigue pendiente que el usuario lo vea en el navegador.

## 2026-07-21 (continuación) — Séptima ronda: botón volver fuera del header, campanita clicable, y en curso: documentos que sube el admin

Primero preguntó si se había perdido el seed (no era así, ver arriba). Después pidió: mover el botón "Volver a..." fuera del header (estaba arriba de todo, pegado al logo); y — en un mensaje intercalado mientras yo trabajaba en otra cosa — que las notificaciones de la campanita sean clicables y lleven al trámite, que se vea el código del trámite junto a la hora, y que el mensaje de comentario incluya el nombre del tipo de trámite.

- Botón volver: pasó de vivir dentro del `<header>` sticky a ser la primera línea del contenido de `<main>`.
- Campanita: cada notificación ahora es un botón que navega a `/mis-tramites/:id` o `/admin/tramites/:id` según el rol, además de marcar como leídas. Se agregó el código corto del trámite junto a la hora.
- Backend: `tramite.comentario_agregado` no llevaba `tipoTramiteNombre` (a diferencia de los otros dos eventos) — se agregó buscando el tipo en `agregarComentario`, mismo patrón que ya usa `cambiarEstado`.
- 128 tests backend + 100 tests frontend en verde, build de producción verificado.
- **Pedido en el mismo mensaje, todavía en curso**: que el admin pueda subir documentos (PDF o imagen) a un trámite como recurso descargable para que el vecino "lo tenga a mano". Diseño elegido: tabla nueva `recursos_tramite` (a diferencia de `archivos_tramite`, que quedó sin uso desde que se simplificó a guardar la clave de storage directo en `datos_formulario` — dato para limpiar más adelante si sobra tiempo), reutilizando el mismo adapter de storage S3/MinIO y su `obtenerUrlDescarga` (URL firmada, ya existía pero no se usaba en ningún lado). Falta: endpoint de subida, incluir `recursos` en el detalle del trámite, evento de dominio + notificación al vecino, y la UI (formulario de subida en el admin, listado de documentos en ambos roles).

### Estado
Fix de campanita/botón volver resuelto y commiteado. Documentos del admin: repositorio y validación de dominio ya con tests en verde; falta conectar el endpoint, el evento y la UI.

## 2026-07-21 (continuación) — Documentos que el admin sube para el vecino: feature completa

Se terminó lo que había quedado pendiente en la entrada anterior. Detalle técnico completo en `docs/DECISIONES.md` ("Documentos que el admin sube para el vecino"); resumen:

- Tabla nueva `recursos_tramite` (no se reutilizó `archivos_tramite`, que ya estaba muerta en el código — quedó documentada como candidata a limpieza si sobra tiempo).
- Se reutilizó `obtenerUrlDescarga` de `S3AlmacenamientoArchivos`, que existía desde el diseño inicial del storage pero nunca se había usado.
- Mismo patrón de siempre para el evento de dominio (`tramite.recurso_agregado`): WebSocket + notificación persistida al vecino.
- UI: selector de archivo en el detalle del admin (mismos tipos MIME que valida el backend: PDF/PNG/JPEG/WEBP), lista de documentos con descarga en ambos roles.
- 129 tests backend + 106 tests frontend en verde. Probado a mano de punta a punta contra la API real: se subió un archivo, se registró contra un trámite, se confirmó que la URL de descarga firmada realmente descarga el contenido (`curl`), y que un tipo de archivo no permitido devuelve 400.
- **Gotcha operativo nuevo, documentado**: correr `npx jest` (que usa múltiples workers en paralelo, cada uno truncando la misma base de desarrollo) puede dejar el seed en un estado parcial, porque el script de seed solo chequea "¿existe alguno?" no "¿existen los que se esperan". Si el conteo de trámites de ejemplo se ve raro después de correr tests, truncar todo (`TRUNCATE tramites, tipos_tramite, admins RESTART IDENTITY CASCADE`) y volver a correr `npm run seed` limpio, en vez de confiar en que el seed idempotente lo arregle solo.

### Estado
Resuelto, verificado y listo para commitear. Sigue pendiente que el usuario lo vea en el navegador.

## 2026-07-21 (continuación) — Octava ronda: cámara en móvil, logo de login, documentos de referencia del tipo, comentarios internos

Varios pedidos encadenados en la misma conversación (el usuario fue mandando mensajes mientras yo trabajaba en el anterior). Detalle técnico completo en `docs/DECISIONES.md` ("Octava ronda de feedback"); resumen:

- El vecino ahora puede elegir un archivo existente O tomar una foto con la cámara (Android/iPhone) en cualquier campo de tipo archivo — dos botones, dos inputs ocultos, uno con `capture="environment"`. Se decidió no usar `capture` sobre el único input porque eso le saca al usuario la opción de elegir de la galería.
- Logo de la pantalla de login agrandado (`h-10` → `h-16`/`h-20`).
- **Hallazgo importante**: `ArchivoReferencia { nombre, url }` en `TipoTramite` ya existía de punta a punta en el backend desde el diseño inicial pero nunca se había conectado a ninguna pantalla — quedó completamente sin usar hasta ahora (mismo patrón que `archivos_tramite`, ver ronda anterior: hay más de un pedazo de diseño inicial que quedó de lado cuando el alcance se simplificó). Se reutilizó para "documentos de referencia" que el admin sube al diseñar un tipo de trámite y el vecino puede ver/descargar.
- Comentarios del admin pasan a ser internos por defecto (checkbox "Visible para el vecino", destildado). Se filtra tanto la lista de comentarios como el historial (que también guardaba el texto del comentario en `detalle`, así que había que limpiarlo ahí también). Un comentario interno tampoco genera notificación ni evento en tiempo real hacia el vecino.
- 134 tests backend + 115 tests frontend en verde, build de producción verificado. Probado a mano: comentario interno vs visible sobre el mismo trámite, confirmado que el vecino solo ve el visible.

### Estado
Resuelto, verificado y listo para commitear.

## 2026-07-21 (continuación) — Novena ronda: reorden de layout, bug de pantalla en blanco (sin resolver), favicon

- Se movió el formulario de subida de documentos del admin (en el detalle de un trámite) para que quede entre "Cambiar estado" y "Agregar comentario" (antes estaba en la columna derecha, cerca del historial).
- **Bug reportado, sin resolver todavía**: al subir un documento de referencia mientras se edita un tipo de trámite existente (no al crear uno nuevo), la pantalla queda en blanco sin ningún error — ni en la UI ni en la consola del navegador (el usuario confirmó ambas cosas). Intenté reproducirlo con un test dirigido que replica el escenario exacto (editar un tipo con documentos ya cargados + subir uno nuevo) y no encontré el bug ahí — pasa limpio. Sin acceso a un navegador real en este entorno, no pude reproducirlo visualmente. Agregué un `ErrorBoundary` global (antes no existía ninguno) para que, si vuelve a pasar, quede al menos un mensaje visible con el error real en vez de una pantalla en blanco. **Falta pedirle al usuario en qué navegador/dispositivo pasa** (mobile Safari, Chrome Android, algún navegador embebido) para poder seguir investigando — sin eso no hay más pistas concretas.
- Favicon cambiado a `sn-sintesis.png` (ya estaba en `assets/`, se copió a `public/`), reemplazando el ícono default de Vite.

### Estado
Layout y favicon resueltos y verificados (118 tests frontend en verde, build ok). El bug de pantalla en blanco queda pendiente — necesita info del navegador/dispositivo del usuario para continuar.

## 2026-07-21 (continuación) — Décima ronda: bandeja de entrada con scroll infinito y búsqueda server-side

El usuario pidió que el listado de trámites del admin no traiga todo de una: mostrar los más recientes primero, y que el filtro se resuelva en la base de datos (no en el cliente), trayendo más resultados a medida que se hace scroll o se ajusta el filtro.

- `TramitesPgRepositorio.listar` ahora soporta `limite`/`offset` y `busqueda` (con JOIN a `tipos_tramite` para poder filtrar también por nombre/categoría del tipo).
- `GET /api/admin/tramites` cambia de contrato: devuelve `{ items, hayMas }` en vez de un array plano (pide una página de más para saber si hay siguiente, sin un COUNT aparte).
- Frontend: scroll infinito con `IntersectionObserver` sobre un centinela al final de la tabla, y búsqueda con debounce de 300ms que reinicia desde `offset=0`.
- Se agregó un polyfill mínimo de `IntersectionObserver` en el setup de tests (jsdom no lo trae).
- 137 tests backend + 117 tests frontend en verde, probado a mano contra la API real.

### Estado
Resuelto, verificado y listo para commitear.

## 2026-07-21 (continuación) — Documentación: README.md reescrito, revisión de docs/

El usuario pidió revisar toda la documentación y hacerla de calidad: completar el README.md (antes era literalmente el enunciado del desafío sin editar, tal cual vino del template) con una descripción de lo hecho e instrucciones de instalación local, y sumar más documentación donde hiciera falta.

- `README.md` reescrito por completo: descripción del proyecto (motor genérico, no un trámite hardcodeado), funcionalidades por rol, mejoras opcionales implementadas, stack técnico, estructura del repo, instrucciones paso a paso para correrlo localmente (docker compose, bucket de MinIO, migraciones, seed, credenciales de prueba, cómo correr los tests), y links a la documentación de detalle.
- Se verificaron las instrucciones contra el estado real del repo (`.env.example` vs `.env`, scripts de `package.json`, `docker-compose.yml`) para que sean exactas, no aproximadas.
- Revisión de `docs/CONTEXTO.md`: tenía una referencia desactualizada ("el enunciado completo está en el README.md de este repositorio"), que dejó de ser cierta al reescribir el README. Se corrigió para que apunte a sí mismo como fuente del enunciado original.
- `docs/ANALISIS_TRAMITES.md` y `docs/DECISIONES.md` ya estaban completos y actualizados de las rondas anteriores de esta sesión — no necesitaron cambios de fondo, solo se revisaron por consistencia.

### Estado
Resuelto. El README ahora sirve como punta de entrada real del proyecto para cualquiera que clone el repo (evaluador o desarrollador nuevo), no como el enunciado sin tocar.

## 2026-07-21 (continuación) — Script de carga (250 trámites) y "mis trámites" con el mismo scroll infinito

- `backend/scripts/seedCarga.ts` (`npm run seed:carga`): agrega 250 trámites sintéticos contra "Inscripción a becas deportivas" para poder probar el scroll infinito de la bandeja con volumen real. Re-ejecutable sin duplicar.
- El usuario notó, ya con volumen real cargado, que "mis trámites" del vecino también necesitaba scroll infinito y un buscador — la suposición original ("pocos trámites por persona, no se justifica paginar") no se sostenía. Se extrajo un helper común (`listarPaginado`) en `tramitesController.ts` compartido entre la bandeja del admin y "mis trámites", y se llevó `MisTramites.tsx` al mismo patrón que `BandejaEntrada.tsx` (scroll infinito + debounce).
- 137 tests backend + 120 tests frontend en verde, build de producción verificado, probado a mano contra la API real (paginación y búsqueda de "mis trámites" para un vecino real).

### Estado
Resuelto, verificado y listo para commitear.

## 2026-07-21 (continuación) — Contador de resultados, skeletons y 100 trámites para Juana Pérez

El usuario pidió: contador de resultados del filtro + total de trámites (admin y vecino), que uno de los 3 vecinos demo tenga 100 trámites propios (para poder probar scroll/filtro también desde "mis trámites"), y skeletons de carga.

- `TramitesPgRepositorio.contar` (mismo criterio de filtro que `listar`, sin paginar) + `total`/`totalSinFiltro` en la respuesta de la bandeja y de "mis trámites".
- `ContadorResultados` (compartido): "Mostrando X de Y trámites", con "(Z en total)" cuando la búsqueda filtra.
- `EsqueletoTabla`/`EsqueletoTarjetas`: reemplazan la pantalla en blanco de la carga inicial.
- `seedCarga.ts` extendido: además de los 250 sintéticos para el admin, ahora carga 100 trámites contra la identidad real de Juana Pérez, para probar "mis trámites" con volumen.
- 138 tests backend + 130 tests frontend en verde, probado a mano contra la API real (355 en la bandeja, 100 en "mis trámites" de Juana).

### Estado
Resuelto, verificado y listo para commitear.

## 2026-07-21 (continuación) — Ajuste al contador: solo el total

El usuario notó que "Mostrando 20 de 355" era confuso con scroll infinito (el 20 cambia a 40, 60... a medida que se scrollea, dando la sensación de que ese número importa cuando es solo un detalle de implementación). `ContadorResultados` pasa a mostrar solo el total, estable durante el scroll: "355 trámites" sin búsqueda, "2 resultados de 355 en total" con búsqueda activa. 138 tests backend + 132 tests frontend en verde.

### Estado
Resuelto, verificado y listo para commitear.
