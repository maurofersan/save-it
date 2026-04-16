# SAVE IT — Gestión de Lecciones Aprendidas (Construcción)

Plataforma **SAVE IT** (manual en `Documento3.pdf`) para capturar, validar y reutilizar conocimiento generado en obra.

## Stack

- **Next.js** (App Router)
- **TypeScript** (strict)
- **MongoDB Atlas** (driver oficial `mongodb`)
- **Tailwind CSS v4** + estilos personalizados con enfoque **BEM** (en `app/globals.css`)
- **Server Actions**: mutaciones (auth, lecciones, perfil, validación)

## Configuración local

1. Copia variables de entorno:

   ```bash
   cp .env.example .env.local
   ```

2. Completa **`MONGODB_URI`** (cadena SRV de Atlas) y **`MONGODB_DB=saveit`**.

3. Instala dependencias:

   ```bash
   npm install
   ```

4. Seed en MongoDB (especialidades + usuario residente demo):

   ```bash
   npm run db:seed
   ```

5. Arranca el proyecto:

   ```bash
   npm run dev
   ```

Abre `http://localhost:3000`.

## Usuarios y roles

- **ENGINEER**: registra lecciones y consulta la biblioteca.
- **RESIDENT**: revisor/validador (puede marcar **EN PROCESO**, **VALIDADO**, **DESCARTADO**).

Tras `npm run db:seed` existe un usuario demo:

- **Residente**: `resident@saveit.local` / `Resident123!`

## Flujo funcional (resumen)

- **Registrar**: lección con título, especialidad, descripción, causa, solución, impacto, fecha de suceso y evidencia (imagen opcional vía Cloudinary).
- **Validar (Residente)**: estados `RECEIVED`, `IN_PROGRESS`, `VALIDATED`, `DISCARDED`.
- **Biblioteca**: búsqueda, filtro por especialidad, vistas y puntuación (1–5).

## Estructura del proyecto

```
app/                 Rutas y páginas (App Router)
components/          UI
lib/                 mongo client, crypto, objectId helpers, sesión
services/            Acceso a datos (MongoDB)
actions/             Server Actions
types/               Dominio y modelos
scripts/mongo-seed.ts   Seed Atlas (especialidades + usuario demo)
```

## Scripts

- `npm run dev` — desarrollo
- `npm run db:seed` — seed en MongoDB (requiere `MONGODB_URI`)
- `npm run lint` — lint

## Deploy en Vercel

1. Crea el proyecto en Vercel enlazado al repo.
2. En **Settings → Environment Variables** añade:
   - **`MONGODB_URI`**: tu connection string de Atlas (usuario/contraseña; no subas secretos al repo).
   - **`MONGODB_DB`**: `saveit` (o el nombre que uses en Atlas).
   - Variables de **Cloudinary** si subes evidencias (`CLOUDINARY_*` según tu `lib/cloudinary`).
3. **Build**: `npm run build` (por defecto en Vercel).
4. Atlas: en **Network Access** permite IPs de Vercel (a menudo `0.0.0.0/0` en desarrollo; en producción restringe si puedes).
5. Ejecuta **`npm run db:seed`** una vez contra tu cluster (desde tu máquina con `.env.local`, o un job CI con secretos) para tener especialidades y el usuario demo.

Los IDs en la API son **ObjectId en hex (24 caracteres)**, por ejemplo en URLs `/library/[id]`.
