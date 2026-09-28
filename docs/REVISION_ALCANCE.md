# Revisión del alcance solicitado

Fecha: 27 de septiembre de 2026.

Se tomó el cierre del Bloque 8 (`391b21e`) como base funcional y se conservaron
las cinco migraciones actuales, el esquema y el seed sin modificaciones.
No se reescribió el historial Git ni se modificó la base principal.

## Correspondencia con el encargo

| Requisito | Implementación conservada |
| --- | --- |
| TypeScript | NestJS y Prisma |
| Ciclo HTTP y responsabilidades | DTO, ValidationPipe, controlador, servicio, puerto, adaptador Prisma y filtro global |
| Clave, relación y restricción | Product/Category, PK, FK obligatoria, UNIQUE y CHECK en PostgreSQL |
| Migraciones versionadas y SQL | Cinco migraciones en prisma/migrations, conservadas íntegramente |
| Transformación sin perder datos | Historial expandir, migrar datos y contraer; evidencias históricas en PROJECT_PROGRESS.md |
| Seed reproducible | Upsert por SKU y nombre de categoría |
| Reconstrucción desde vacío | scripts/verify-fresh-database.ps1: historial completo, doble seed y pruebas sobre base temporal |
| Desarrollo frente a despliegue | README: migrate dev / --create-only frente a migrate deploy |

## Simplificación realizada

- Se retiraron GET /products, GET /products/:id, GET /categories y POST /categories,
  junto con sus servicios, puertos, reglas y pruebas específicas.
- POST /products vuelve a recibir categoryName obligatorio y crear o reutilizar
  la categoría dentro de la transacción del repositorio. No recibe categoryId.
- Se eliminaron Vitest, Vite, SWC y Testcontainers de las dependencias directas,
  sus configuraciones y las suites adicionales. Jest conserva pruebas unitarias,
  HTTP y de integración PostgreSQL. El lockfile corresponde al manifiesto.
- Se retiró el workflow de GitHub Actions dependiente de esas herramientas.
  No se modificó ningún repositorio remoto.
- Se eliminaron documentos de la ampliación posterior que describían otro alcance.
  Se conservan dos documentos históricos, identificados como tales, y este informe.
- Se reescribió README con instalación, contrato, arquitectura, migraciones y pruebas.
- El script temporal restaura variables y limpia su propio entorno en finally.

La restricción stock <= 1000 permanece: eliminar una migración aplicada haría
inconsistente el historial. El DTO conserva ese límite y la precisión máxima de
precio; la conversión numérica rechaza booleanos y cadenas vacías.

## Verificación actual

| Comprobación | Resultado |
| --- | --- |
| npm run build | Correcto |
| npm test -- --runInBand | 35 pruebas aprobadas, 7 suites, 0 fallidas |
| npm run lint | Correcto |
| npm run format:check | Correcto |
| npm run prisma:validate | Esquema válido |
| npx tsc --noEmit | Correcto, incluidas las pruebas de integración |
| Análisis sintáctico de PowerShell | Correcto |
| package.json y package-lock.json | Dependencias coincidentes |
| git diff --check | Correcto |
| Migraciones, esquema y seed | Sin cambios frente a HEAD inicial |
| .env y .env.verify | Ignorados por Git |
| npm run verify:fresh-db | Correcto: cinco migraciones desde base vacía, doble seed con 4 productos y 3 categorías, invariantes 0,0,0 |
| Integración PostgreSQL | 5 pruebas aprobadas; total de la reconstrucción: 40 aprobadas, 0 fallidas |
| Limpieza temporal | Contenedor y red eliminados; comando finalizó con código 0 |

Las pruebas HTTP utilizan un repositorio simulado; la integración se ejecutó
contra PostgreSQL real en una base temporal inicialmente vacía.
No se verificó la salud ni el contenido actual de la base principal.
Los resultados de septiembre 20 conservados en los documentos históricos no se
presentan como una ejecución actual. No se recalculó cobertura.

Tras iniciar Docker, el puerto 5434 estaba ocupado por el contenedor de otro
proyecto, `lensegua-postgres`. Se cambió únicamente VERIFY_DB_PORT en el archivo
local ignorado `.env.verify` a 55434 y se repitió `npm run verify:fresh-db`
exitosamente, incluyendo rollback y restricciones reales. No se detuvieron
contenedores de otros proyectos ni se modificaron migraciones.
