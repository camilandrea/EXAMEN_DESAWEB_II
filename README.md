# Cashi API - Evaluacion Unidad 3

API REST de finanzas personales construida con Hono, Node.js, TypeScript, Prisma y PostgreSQL. Esta version agrega autenticacion con JWT, transacciones privadas por usuario y subida local de comprobantes.

## Stack

- Node.js
- TypeScript
- Hono
- Prisma
- PostgreSQL
- Docker Compose
- Zod
- bcryptjs
- jsonwebtoken
- Cloudflare R2
- Yarn

## Requisitos

- Node.js 20 o superior
- Yarn
- Docker Desktop

## Variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
copy .env.example .env
```

Contenido esperado:

```env
DATABASE_URL="postgresql://cashi:cashi@localhost:5432/cashi?schema=public"
PORT=3000
JWT_SECRET="cashi-dev-secret"
R2_ACCOUNT_ID="ca52f76daa3abcbc82b4ca9720feeff7"
R2_BUCKET_NAME="desaweb2-bucket"
R2_ENDPOINT="https://ca52f76daa3abcbc82b4ca9720feeff7.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="reemplazar_por_access_key_id"
R2_SECRET_ACCESS_KEY="reemplazar_por_secret_access_key"
R2_PUBLIC_BASE_URL="https://pub-7e000acc95024afc8cf4319802525457.r2.dev"
R2_RECEIPTS_PREFIX="receipts"
```

## Instalacion

```bash
yarn install
```

## Base de datos

Levanta PostgreSQL con Docker Compose:

```bash
docker compose up -d
```

Genera Prisma Client y aplica migraciones:

```bash
yarn prisma:generate
yarn prisma:deploy
```

se puede reiniciar la base de desarrollo:

```bash
yarn prisma migrate reset
```

## Ejecutar en desarrollo

```bash
yarn dev
```

La API queda disponible en:

```txt
http://localhost:3000
```

## Arquitectura

```txt
src/
  app.ts
  index.ts
  lib/
    jwt.ts
    load-env.ts
    prisma.ts
    prisma-error.ts
  middlewares/
    auth.middleware.ts
  routes/
    auth.routes.ts
    categories.routes.ts
    transactions.routes.ts
  controllers/
    auth.controller.ts
    categories.controller.ts
    transactions.controller.ts
    uploads.controller.ts
  repositories/
    categories.repository.ts
    transactions.repository.ts
    users.repository.ts
  schemas/
    auth.schema.ts
    categories.schema.ts
    transactions.schema.ts
  types/
    auth.ts
    category.ts
    transaction.ts
```

- `routes`: define las rutas HTTP.
- `controllers`: maneja requests, status codes y logica de negocio. El ownership check de transacciones vive aqui.
- `repositories`: accede a la base de datos mediante Prisma.
- `schemas`: valida entradas con Zod.
- `middlewares`: contiene el middleware centralizado de autenticacion JWT.

## Endpoints

### Auth

| Metodo | Ruta | Auth | Descripcion |
| --- | --- | --- | --- |
| POST | `/auth/register` | No | Crea cuenta y devuelve token |
| POST | `/auth/login` | No | Inicia sesion y devuelve token |

### Categories

Todas requieren:

```txt
Authorization: Bearer {token}
```

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/categories` | Lista todas las categorias |
| GET | `/categories/:id` | Obtiene una categoria |
| POST | `/categories` | Crea una categoria |
| PATCH | `/categories/:id` | Actualiza una categoria |
| DELETE | `/categories/:id` | Elimina una categoria |

### Transactions

Todas requieren:

```txt
Authorization: Bearer {token}
```

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/transactions` | Lista solo las transacciones del usuario autenticado |
| GET | `/transactions/:id` | Obtiene una transaccion si pertenece al usuario |
| POST | `/transactions` | Crea una transaccion asociada al usuario autenticado |
| PATCH | `/transactions/:id` | Actualiza una transaccion solo si es del usuario |
| DELETE | `/transactions/:id` | Elimina una transaccion solo si es del usuario |
| GET | `/transactions/balance` | Retorna el balance del usuario autenticado |
| POST | `/transactions/upload` | Sube comprobante a Cloudflare R2 y devuelve `receiptUrl` |

## Ejemplos

Registro:

```json
{
  "email": "camila@example.com",
  "password": "123456"
}
```

Crear categoria:

```json
{
  "name": "Sueldo"
}
```

Crear transaccion:

```json
{
  "amount": 850000,
  "type": "income",
  "description": "Pago de sueldo",
  "date": "2026-05-10",
  "categoryId": 1,
  "receiptUrl": "https://pub-7e000acc95024afc8cf4319802525457.r2.dev/receipts/comprobante.jpg",
  "latitude": -33.4489,
  "longitude": -70.6693
}
```

Upload de comprobante:

```txt
POST /transactions/upload
Content-Type: multipart/form-data
Campo: receipt
Tipos permitidos: JPEG, PNG, WebP
Tamano maximo: 5 MB
```

Respuesta:

```json
{
  "receiptUrl": "https://pub-7e000acc95024afc8cf4319802525457.r2.dev/receipts/uuid.jpg"
}
```

Los comprobantes se guardan en Cloudflare R2 dentro del prefijo definido por `R2_RECEIPTS_PREFIX`.

## Codigos HTTP

- `200`: solicitud correcta.
- `201`: recurso creado.
- `204`: recurso eliminado.
- `400`: datos invalidos.
- `401`: token ausente, invalido o expirado.
- `403`: transaccion existente pero perteneciente a otro usuario.
- `404`: recurso no encontrado.

## Bruno

La carpeta `bruno/` contiene una coleccion para probar la API. Tambien se incluye un JSON importable:

```txt
bruno/cashi-eva3.postman_collection.json
```

Flujo recomendado:

1. `Register`
2. `Login`
3. Copiar el `token`
4. Usar `Authorization: Bearer {token}` en las rutas protegidas
5. `Create Category`
6. `Upload Receipt`
7. `Create Transaction`
8. `Balance`

## Problemas presentados durante el desarrollo

- Al probar `POST /categories` en Bruno aparecio `Internal Server Error`, aunque `GET /` respondia correctamente. La causa fue que la API no estaba cargando el archivo `.env` antes de inicializar Prisma, por lo que `DATABASE_URL` no estaba disponible cuando se intentaba usar la base de datos. Se corrigio agregando una carga local de `.env` en `src/lib/load-env.ts` e importandola al inicio de `src/index.ts`.
- Health funcionaba porque ese endpoint no consulta PostgreSQL. El error aparecia recien al crear una categoria, que es la primera operacion que usa Prisma y la base de datos.
- Al pasar de EVA2 a EVA3 se agrego `userId` obligatorio a `Transaction`. Si ya existen transacciones antiguas sin usuario, la migracion puede fallar. En desarrollo se puede usar `yarn prisma migrate reset` para reiniciar la base, como permite el enunciado.
- Para integrar Cloudflare R2 se necesito habilitar una Public Development URL del bucket y crear un User API Token con permiso `Object Read & Write` solo para `desaweb2-bucket`. Las credenciales reales se dejaron en `.env` local y no deben subirse al repositorio.

## Uso de IA

Se uso ChatGPT/Codex como apoyo durante el desarrollo del proyecto. La ayuda se concentro en:

- Crear la carpeta `schemas/` y mover ahi las validaciones con Zod, evitando mezclar validaciones directamente en rutas o controllers.
- Implementar autenticacion con JWT y contrasenas hasheadas con bcrypt.
- Configurar la integracion con Cloudflare R2 Storage para subir comprobantes al bucket `desaweb2-bucket` y devolver una URL publica.
- Crear y actualizar la coleccion Bruno/Postman para probar los endpoints.

