# SAVE IT — Gestión de Lecciones Aprendidas (Construcción)

Plataforma **SAVE IT** (manual en `Documento3.pdf`) para capturar, validar y reutilizar conocimiento generado en obra.

## Stack

- **Next.js** (App Router)
- **TypeScript** (strict)
- **Better‑SQLite3** (persistencia local)
- **Tailwind CSS v4** + estilos personalizados con enfoque **BEM** (en `app/globals.css`)
- **Server Actions**: todas las mutaciones (auth, lecciones, perfil, validación)

## Cómo ejecutar

Instala dependencias:

```bash
npm install
```

Inicializa la base de datos (crea `./data/saveit.sqlite3` y `./public/uploads`):

```bash
npm run db:init
```

Arranca el proyecto:

```bash
npm run dev
```

Abre `http://localhost:3000`.

## Usuarios y roles

El sistema distingue 2 roles principales (según el manual):

- **ENGINEER**: registra lecciones y consulta la biblioteca.
- **RESIDENT**: revisor/validador (puede marcar **EN PROCESO**, **VALIDADO**, **DESCARTADO**).

Al correr `npm run db:init` se crea un usuario demo:

- **Residente**: `resident@saveit.local` / `Resident123!`

## Flujo funcional (resumen)

- **Registrar**: un Ingeniero crea una lección con: título, especialidad (Quality/Safety/Production), descripción, causa raíz, solución, impacto (Time/Cost) y evidencia (imagen opcional).
- **Validar (Residente)**: revisa y cambia estado:
  - **RECEIVED** (por defecto)
  - **IN_PROGRESS** (solicita actualización, comentario opcional)
  - **VALIDATED** (publica en biblioteca)
  - **DISCARDED** (no se publica)
- **Biblioteca**: búsqueda + filtro por especialidad, métricas básicas: **vistas** y **puntuación** (1–5).

## Estructura del proyecto

```
app/                 Rutas, páginas y layouts (App Router)
components/          Componentes UI atómicos y responsivos
lib/                 DB singleton, crypto, paths, sesión
services/            Acceso a datos (queries Better-SQLite3) siguiendo SOLID
actions/             Server Actions por dominio (auth, lessons, users)
types/               Tipos TS: dominio, modelos, ActionResult
init-db.ts           Script de inicialización/seed de la base de datos
```

### Puntos clave de arquitectura

- **Separación por capas**:
  - UI (React) → **Server Actions** → **Services** (SQL) → SQLite
- **Seguridad**:
  - La UI no “asume” permisos: cada Server Action valida **autenticación y rol**.
  - Sesión por cookie httpOnly (`saveit_session`) + tabla `sessions`.
- **Uploads**:
  - Evidencias de imagen se guardan en `public/uploads` y se registran en tabla `evidence`.

## Scripts útiles

- `npm run dev`: desarrollo
- `npm run db:init`: inicializa DB/seed
- `npm run lint`: lint

