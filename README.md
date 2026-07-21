# Trámites municipales — San Nicolás

<img src="./assets/repository-header.jpg">

Motor genérico de trámites municipales online, desarrollado como desafío técnico para la **Secretaría de Innovación y Ciudad Inteligente** del Municipio de San Nicolás de los Arroyos.

En vez de resolver un único trámite hardcodeado, la aplicación implementa un **motor configurable**: los administradores crean y editan tipos de trámite (formulario, flujo de estados, metadata institucional) y todos comparten el mismo patrón de carga → bandeja de entrada → cambio de estado / comentarios / historial → notificación en tiempo real. El trámite tomado como referencia del [listado oficial](https://www.sannicolasciudad.gob.ar/tramites) — **Inscripción a becas deportivas** — es simplemente el primer tipo cargado en ese motor, no un flujo especial de código.

El enunciado completo del desafío está en [`docs/CONTEXTO.md`](docs/CONTEXTO.md); las decisiones técnicas y de producto, con su justificación, en [`docs/DECISIONES.md`](docs/DECISIONES.md).

## Funcionalidades

**Vecino**
- Selector de identidad (simula el login de un proveedor externo de identidad, fuera del alcance del desafío).
- Iniciar un trámite completando el formulario dinámico del tipo elegido, con carga de archivos (elegir uno existente o tomar una foto desde el celular).
- Ver el estado del trámite con una barra de progreso, el historial completo y los documentos que el admin haya dejado disponibles.
- Campanita de notificaciones en tiempo real (cambios de estado, comentarios visibles, documentos nuevos).

**Administrador**
- Bandeja de entrada de todos los trámites, con scroll infinito y búsqueda contra la base de datos (estado, tipo, categoría, vecino, número de trámite).
- Cambiar el estado de un trámite respetando las transiciones válidas del tipo, agregar comentarios (internos por defecto, o marcados como visibles para el vecino) y subir documentos para que el vecino los descargue.
- Crear y editar tipos de trámite: nombre, formulario, flujo de estados, documentos de referencia. Un tipo publicado con trámites en curso no se edita in place: se versiona.

### Mejoras adicionales implementadas

Del listado de mejoras opcionales del enunciado, se implementaron:
1. **Estados controlados** — máquina de estados con transiciones válidas por tipo de trámite.
2. **Actualización en tiempo real** — WebSockets (Socket.IO) para cambios de estado, comentarios, documentos y notificaciones.
3. **Historial de eventos / línea de tiempo** — cada acción sobre un trámite queda registrada y visible.
4. **Validaciones avanzadas** — en frontend y backend (esquema de formulario, tipos de archivo permitidos, transiciones de estado).
5. **Búsqueda y filtros** — bandeja del admin con búsqueda server-side y paginada.

Ver el detalle y la justificación de cada una en [`docs/DECISIONES.md`](docs/DECISIONES.md).

## Stack técnico

| | |
|---|---|
| **Backend** | Node.js + TypeScript + Express + PostgreSQL |
| **Frontend** | React + TypeScript + Tailwind CSS + Vite |
| **Storage de archivos** | Protocolo S3 (`@aws-sdk/client-s3`), MinIO en desarrollo — intercambiable con un bucket real de AWS solo cambiando variables de entorno, sin rebuild |
| **Tiempo real** | Socket.IO |
| **Testing** | Jest + Supertest (backend), Vitest + React Testing Library (frontend) |
| **Metodología** | TDD para la lógica de negocio (servicios, máquina de estados, validaciones) |

## Estructura del repositorio

```
Repo/
├── backend/            API Node.js + Express + PostgreSQL
├── frontend/           App React + TypeScript + Tailwind
├── docs/
│   ├── CONTEXTO.md          enunciado completo del desafío
│   ├── DECISIONES.md        decisiones técnicas y de producto, con justificación
│   └── ANALISIS_TRAMITES.md relevamiento de trámites reales usado para modelar el esquema
├── memory.md            bitácora de las sesiones de trabajo
└── docker-compose.yml   PostgreSQL + MinIO para desarrollo local
```

## Cómo correrlo localmente

### Requisitos

- Node.js 20 o superior
- Docker y Docker Compose (para PostgreSQL y MinIO)

### 1. Levantar PostgreSQL y MinIO

```bash
docker compose up -d
```

Esto expone PostgreSQL en `localhost:5433` y MinIO en `localhost:9000` (API S3) / `localhost:9001` (consola web).

Crear el bucket que va a usar el storage (una sola vez): entrar a la consola de MinIO en [http://localhost:9001](http://localhost:9001) (usuario/contraseña `minioadmin` / `minioadmin` por defecto) y crear un bucket llamado `tramites-archivos`. También se puede crear con el cliente `mc`:

```bash
docker run --rm --network host minio/mc \
  alias set local http://localhost:9000 minioadmin minioadmin && \
  docker run --rm --network host minio/mc mb local/tramites-archivos
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # los valores por defecto ya apuntan al docker-compose local
npm run migrate        # crea las tablas
npm run seed           # admin + tipos de trámite + trámites de ejemplo
npm run dev            # http://localhost:4000
```

El seed deja un admin de prueba: **`admin@sannicolas.gob.ar` / `admin123`**, tres tipos de trámite publicados, y varios trámites de ejemplo en distintos estados. El seed es idempotente: correrlo de nuevo no duplica datos.

> Los tests de integración (`npm test`) truncan las mismas tablas que usa el seed. Si corrés la suite del backend, volvé a correr `npm run seed` para restaurar los datos de demo.

### 3. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

Por defecto apunta a `http://localhost:4000`; para apuntar a otro backend, definir `VITE_API_URL` en un `.env` dentro de `frontend/`.

### Probar la aplicación

- **Vecino**: entrar a `http://localhost:5173`, elegir una identidad de prueba del selector (no requiere contraseña, simula un proveedor externo), iniciar un trámite.
- **Administrador**: entrar a `http://localhost:5173/admin`, loguearse con las credenciales del seed.

### Tests

```bash
cd backend && npm test    # Jest — requiere PostgreSQL y MinIO corriendo (docker compose up -d)
cd frontend && npm test   # Vitest
```

### Producción / storage con S3 real

Cambiar de MinIO a un bucket real de AWS S3 es solo actualizar las variables `STORAGE_*` del backend (ver comentarios en `backend/.env.example`) y reiniciar el proceso — no requiere rebuild ni cambios de código.

## Documentación

- [`docs/CONTEXTO.md`](docs/CONTEXTO.md) — enunciado completo del desafío y contexto institucional.
- [`docs/DECISIONES.md`](docs/DECISIONES.md) — decisiones de arquitectura, modelo de datos y producto, con su justificación; se actualiza en cada ronda de trabajo.
- [`docs/ANALISIS_TRAMITES.md`](docs/ANALISIS_TRAMITES.md) — relevamiento de trámites reales del municipio usado para diseñar el esquema configurable.
- [`memory.md`](memory.md) — bitácora de las sesiones de trabajo (qué se hizo, qué queda pendiente).
