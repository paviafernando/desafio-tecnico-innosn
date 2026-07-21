# Backend

API del motor genérico de trámites municipales — Node.js + Express + TypeScript + PostgreSQL.

Ver `docs/DECISIONES.md` y `CLAUDE.md` en la raíz del repositorio para el modelo de datos, la arquitectura en capas y las convenciones del proyecto.

## Uso

```bash
cp .env.example .env
npm install
npm run migrate # aplica el esquema de PostgreSQL (backend/migrations/*.sql)
npm run seed    # carga un admin de prueba y el tipo de trámite de referencia
npm test        # tests (Jest) — incluye integración contra PostgreSQL/MinIO reales
npm run dev     # servidor en modo desarrollo
```

Requiere PostgreSQL y MinIO corriendo (ver `docker-compose.yml` en la raíz del repositorio: `docker compose up -d`). MinIO además necesita el bucket creado una vez (`STORAGE_BUCKET` en `.env`):

```bash
docker exec repo-minio-1 mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec repo-minio-1 mc mb local/tramites-archivos
```

`npm run seed` es idempotente y crea:
- Admin: `admin@sannicolas.gob.ar` / `admin123`
- Tipo de trámite publicado: "Inscripción a becas deportivas"

## Estructura

```
src/
├── domain/         # lógica de dominio pura (ej. máquina de estados)
├── services/        # lógica de negocio, orquesta domain + repositorios + adapters
├── repositories/     # acceso a datos (PostgreSQL)
├── adapters/         # implementaciones concretas de puertos (storage, notificaciones)
├── controllers/       # traducen HTTP ↔ services
├── routes/           # definición de endpoints Express
├── middleware/        # auth (JWT), validación, manejo de errores
├── realtime/          # gateway de WebSockets
└── config/            # configuración leída de variables de entorno
```
