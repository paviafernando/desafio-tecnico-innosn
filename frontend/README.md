# Frontend

Aplicación web del motor genérico de trámites municipales — React + TypeScript + Tailwind CSS (v4, vía `@tailwindcss/vite`).

Ver `docs/DECISIONES.md` y `CLAUDE.md` en la raíz del repositorio para el modelo de datos, la dirección visual (mobile first, diseño adaptativo) y las convenciones del proyecto.

## Uso

```bash
npm install
npm test        # tests (Vitest + React Testing Library)
npm run dev     # servidor de desarrollo (Vite)
```

## Estructura

```
src/
├── pages/
│   ├── vecino/    # selector de identidad, mis trámites, nuevo trámite, detalle
│   └── admin/     # login, bandeja de entrada, detalle, ABM de tipos de trámite
├── components/     # componentes de UI compartidos
├── hooks/          # hooks compartidos (ej. cliente WebSocket)
├── lib/            # cliente HTTP, utilidades
└── types/          # tipos compartidos con el backend (esquema de formulario, flujo de estados)
```
