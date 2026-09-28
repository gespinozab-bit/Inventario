# Inventario: API y evolución del esquema

Proyecto académico en TypeScript con NestJS, Prisma y PostgreSQL. Demuestra el
registro de un producto y la evolución de una categoría de texto a una entidad
relacionada, conservando los datos mediante expandir → migrar → contraer.

## Alcance

- `POST /products`: valida y transforma la entrada, crea o reutiliza la categoría
  por nombre y guarda el producto en una transacción.
- `GET /health`: comprueba la conexión con PostgreSQL.
- Errores uniformes: 400 por validación, 409 por SKU duplicado, 404 por ruta
  inexistente y 500 sin detalles internos.

```text
Solicitud HTTP → ValidationPipe / CreateProductDto → ProductsController
→ CreateProductService → ProductRepository → PrismaProductRepository → PostgreSQL
```

El controlador delega al servicio. El servicio depende del puerto del repositorio;
el adaptador Prisma maneja las consultas y la transacción. El filtro global
traduce errores a respuestas HTTP.

## Preparación local

Requisitos: Node.js 22, npm y Docker Desktop con contenedores Linux activo.
En PowerShell puede usarse `npm.cmd` o `npx.cmd` si la política bloquea los `.ps1`.

```powershell
npm ci
Copy-Item .env.example .env
# Configurar credenciales locales y DATABASE_URL antes de continuar.
docker compose up -d postgres
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev
```

Crea `.env` solo si no existe. Mantén su puerto, usuario, contraseña y base
sincronizados con Compose. No publiques este archivo.

Ejemplo de cuerpo JSON para `POST http://localhost:3000/products`:

```json
{
  "sku": " demo-001 ",
  "name": " Martillo ",
  "price": "25.50",
  "stock": "3",
  "categoryName": " Herramientas "
}
```

La respuesta 201 incluye SKU `DEMO-001`, textos recortados y `categoryName`
obtenido de la relación. `description` es opcional. Precio positivo con máximo
2 decimales; stock entero entre 0 y 1000. Los campos desconocidos se rechazan.

## Modelo y migraciones

`Product.id` y `Category.id` son claves primarias. `Product.categoryId` es
obligatorio y referencia `Category.id`, con `ON DELETE RESTRICT`. PostgreSQL
protege SKU único, categoría única, precio positivo y stock entre 0 y 1000.

El historial versionado en `prisma/migrations` contiene:

1. Creación de Product con categoría en texto y restricciones iniciales.
2. Expansión: Category y relación opcional, sin eliminar el campo anterior.
3. Migración de datos: categorías deduplicadas y asignación de categoryId.
4. Contracción: validaciones previas, relación obligatoria y retiro del texto
   redundante. El nombre se conserva en Category.
5. Restricción de stock máximo 1000. Se conserva porque forma parte del historial
   aplicado; valida los datos existentes y aborta si alguno incumple, sin borrarlo.

Cada SQL debe revisarse antes de aplicarse. Las evidencias históricas de
conservación de datos están en [PROJECT_PROGRESS](docs/PROJECT_PROGRESS.md).
El seed usa upsert por claves únicas para poder repetirse sin duplicar registros.

## Desarrollo y despliegue

En **desarrollo**, para un nuevo cambio de esquema, modifica `schema.prisma`,
genera SQL con `npx prisma migrate dev --create-only --name nombre_del_cambio`,
revísalo y después aplica con `npx prisma migrate dev`. Cuando haya datos que
transformar, planifica expansión, migración de datos y contracción antes de
eliminar columnas. Versiona los archivos de migración junto al código.

En un **entorno no orientado al desarrollo**, aplica exclusivamente el historial
revisado con `npx prisma migrate deploy`; no genera migraciones ni requiere shadow
database. Genera Prisma Client durante la preparación de la aplicación. El seed
es un paso explícito de inicialización, no parte automática del despliegue.
No edites migraciones aplicadas, ni uses `db push` o `migrate reset` para desplegar.

## Verificación

```powershell
npm run build
npm run lint
npm run format:check
npm test -- --runInBand
npm run test:cov
npm run prisma:validate
```

Jest ejecuta pruebas unitarias y HTTP con repositorio simulado. Las pruebas de
integración usan PostgreSQL real únicamente en la base temporal protegida.

Para demostrar reconstrucción desde cero, crea `.env.verify` a partir de
`.env.verify.example` si aún no existe, configura credenciales temporales y ejecuta:

```powershell
npm run verify:fresh-db
```

El script exige un contenedor nuevo, un nombre de base que contenga `verification`
y un puerto distinto del principal 5433. Comprueba que no existan tablas, aplica
las cinco migraciones, ejecuta el seed dos veces y compara conteos, verifica
relaciones y duplicados, compila y ejecuta las pruebas unitarias, HTTP e integración.
Activa `ALLOW_TEST_DATABASE=true` solo para las pruebas temporales. Al finalizar,
incluso si hay un fallo, elimina el entorno que creó y restaura las variables.
No aplica seeds ni migraciones a la base principal durante esta verificación.

La integración también verifica rollback, unicidad, NOT NULL, FK, RESTRICT y
checks de precio y stock. No ejecutes `test:integration` contra la base principal.

## Evidencias

- [Revisión del alcance y verificación actual](docs/REVISION_ALCANCE.md).
- [Progreso histórico y conservación de datos](docs/PROJECT_PROGRESS.md).
- [Verificación histórica del Bloque 8](docs/ACCEPTANCE_EVIDENCE.md).
