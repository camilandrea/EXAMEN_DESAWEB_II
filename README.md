# Cashi API - Examen transversal

API REST para gestionar finanzas personales, construida con Hono, Node.js,
TypeScript, Prisma y PostgreSQL. Incluye autenticación JWT, transacciones privadas
por usuario y almacenamiento de comprobantes en Cloudflare R2.

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Hono-4-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)

## Contenido

- [Producción](#producción)
- [Tecnologías](#tecnologías)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Arquitectura](#arquitectura)
- [Endpoints](#endpoints)
- [Ejemplos](#ejemplos)
- [Colección Bruno](#colección-bruno)

## Producción

La API está desplegada en Render:

**URL base:** [https://api-cashi.onrender.com](https://api-cashi.onrender.com)

Para comprobar que el servicio está activo:

```http
GET https://api-cashi.onrender.com/
```

## Tecnologías

| Área | Tecnología | Uso |
| --- | --- | --- |
| Runtime | Node.js + TypeScript | Ejecución y tipado de la API |
| Framework HTTP | Hono | Rutas, middleware y respuestas HTTP |
| Persistencia | PostgreSQL + Prisma | Base de datos, modelos y migraciones |
| Validación | Zod | Validación de parámetros y cuerpos JSON |
| Seguridad | JWT + bcryptjs | Autenticación y hash de contraseñas |
| Archivos | Cloudflare R2 | Almacenamiento de comprobantes |
| Desarrollo | Docker Compose + Yarn | Base local y gestión del proyecto |

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

## Instalación y ejecución

### Instalar dependencias

```bash
yarn install
```

### Preparar la base de datos

Levanta PostgreSQL con Docker Compose:

```bash
docker compose up -d
```

Genera Prisma Client y aplica migraciones:

```bash
yarn prisma:generate
yarn prisma:deploy
```

Opcionalmente, puedes reiniciar la base de desarrollo:

```bash
yarn prisma migrate reset
```

### Iniciar la API

```bash
yarn dev
```

La API local queda disponible en:

```txt
http://localhost:3000
```

Para consumir el servicio desplegado, usa `https://api-cashi.onrender.com` como URL base en lugar de la URL local.

## Arquitectura

La aplicación sigue una arquitectura por capas. Las rutas reciben las
solicitudes, los controladores coordinan cada caso de uso y los repositorios
concentran el acceso a PostgreSQL mediante Prisma.

```mermaid
flowchart LR
    Client["Cliente / Bruno"] --> Routes["Routes"]
    Routes --> Auth["Middleware JWT"]
    Auth --> Controllers["Controllers"]
    Controllers --> Schemas["Schemas Zod"]
    Controllers --> Repositories["Repositories"]
    Repositories --> Prisma["Prisma Client"]
    Prisma --> PostgreSQL[(PostgreSQL)]
    Controllers --> R2["Cloudflare R2"]
```

### Flujo de una solicitud protegida

1. La ruta recibe la solicitud HTTP.
2. El middleware verifica el token JWT y obtiene el usuario autenticado.
3. El controlador valida los datos mediante un esquema Zod.
4. El repositorio ejecuta la operación correspondiente con Prisma.
5. El controlador devuelve la respuesta HTTP.

### Estructura del proyecto

```txt
src/
├── app.ts                       # Configuración de Hono y rutas principales
├── index.ts                     # Punto de entrada del servidor
├── controllers/                 # Casos de uso y respuestas HTTP
│   ├── auth.controller.ts
│   ├── categories.controller.ts
│   ├── transactions.controller.ts
│   └── uploads.controller.ts
├── lib/                         # Clientes y utilidades compartidas
│   ├── jwt.ts
│   ├── load-env.ts
│   ├── prisma.ts
│   ├── prisma-error.ts
│   └── r2.ts
├── middlewares/
│   └── auth.middleware.ts       # Protección de rutas mediante JWT
├── repositories/                # Acceso a datos mediante Prisma
│   ├── categories.repository.ts
│   ├── transactions.repository.ts
│   └── users.repository.ts
├── routes/                       # Definición de endpoints
│   ├── auth.routes.ts
│   ├── categories.routes.ts
│   └── transactions.routes.ts
├── schemas/                      # Validaciones con Zod
│   ├── auth.schema.ts
│   ├── categories.schema.ts
│   └── transactions.schema.ts
└── types/                        # Tipos TypeScript del dominio
    ├── auth.ts
    ├── category.ts
    └── transaction.ts
```

| Capa | Responsabilidad |
| --- | --- |
| `routes` | Define métodos, rutas y controladores asociados. |
| `middlewares` | Verifica el JWT y expone el usuario autenticado. |
| `controllers` | Gestiona solicitudes, respuestas, permisos y lógica de negocio. |
| `schemas` | Valida y transforma los datos de entrada con Zod. |
| `repositories` | Encapsula las operaciones de base de datos con Prisma. |
| `lib` | Centraliza clientes y utilidades de JWT, Prisma, R2 y entorno. |
| `types` | Declara los tipos TypeScript compartidos del dominio. |

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

## Colección Bruno

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

- Había 2 schemas de transacciones con la misma lógica pero solo 1 se utilizaba en el proyecto.
- No hubo cambios relevantes entre la EVA3 y el Examen ya que ya tenía la implementación del R2 Storage y el
despliegue en Render.

## Uso de IA

Se uso ChatGPT/Codex como apoyo durante el desarrollo del proyecto. La ayuda se concentro en:

- Redactar README


