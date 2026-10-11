# Supabase: base de datos de la aplicación

## Alcance

El HTML todavía no está conectado a Supabase. Esta carpeta define el esquema relacional y las comprobaciones para revisarlos antes de integrar autenticación o modificar la aplicación.

Los catálogos genéricos `data/foods.json` y `data/recipes.json` permanecen en GitHub. La base remota está preparada para los datos de uso personal, pero todavía no contiene registros de la aplicación. No se guarda el estado completo en una sola columna JSON.

## Migraciones

Los cuatro archivos de `migrations/` ya se aplicaron al proyecto desde **SQL Editor**. La segunda migración revoca los permisos predeterminados y concede solo las operaciones necesarias. La tercera, `20261010140000_actual_activity_sessions.sql`, añadió `activity_sessions`; la cuarta, `20261011100000_meal_completion_ingredient_snapshots.sql`, añadió los snapshots de ingredientes, con RLS y retención indefinida sin purga automática. Para un proyecto nuevo, revisa y aplica los cuatro archivos en orden; no vuelvas a ejecutar ninguno en el proyecto existente.

Para revisar el esquema completo después de aplicar las cuatro migraciones, ejecuta `tests/001_schema_check.sql`. Si una tabla, política o permiso esperado falta, la consulta termina con un error. Este control estructural no crea usuarios ni demuestra el aislamiento entre dos sesiones autenticadas.

Las migraciones son aditivas y no contienen `DROP`, `TRUNCATE` ni borrados. No vuelvas a ejecutar un archivo ya aplicado: el SQL Editor no administra el historial de migraciones del repositorio.

## Estructura inicial

- `profiles`: parámetros escalares del perfil, una fila por usuario de Supabase Auth.
- `plan_cycles` y `planned_meals`: ciclos y sus 105 comidas; conservan estado, fechas y versión del catálogo.
- `meal_completions`: eventos de comidas marcadas y su reverso; la operación idempotente en la app queda pendiente.
- `meal_completion_ingredients`: aplicada; conserva una fila inmutable por ingrediente y cantidad real en unidad de receta. No altera el saldo de despensa y no caduca por antigüedad.
- `inventory_movements`: libro de movimientos append-only; el saldo se calcula sumando cantidades con signo.
- `weight_logs` y `prep_tasks`: seguimiento personal y preparación.
- `training_logs`: tabla heredada con una marca por fecha; no representa sesiones y no se usa para el cálculo actual.
- `activity_sessions`: tabla aplicada para guardar varias sesiones reales con fecha, actividad, duración y MET de referencia. Tiene RLS por usuario; el HTML todavía no la usa.
- `shopping_sessions` y `shopping_session_items`: selección de productos, envases y casillas de la compra para que también se conserve entre dispositivos.
- `user_settings`: fecha de la última copia de seguridad.

Los IDs de alimentos y recetas son texto y se resuelven contra los catálogos JSON; no se duplican esos catálogos en tablas.

Consulta [docs/supabase_db_model.md](../docs/supabase_db_model.md) para el diagrama entidad-relación, las columnas, claves, relaciones y políticas.

## Pendiente antes de conectar el HTML

- Configurar Auth según [ADR-0008](../docs/decisions/0008-email-password-auth.md): correo + contraseña, registro libre y sin confirmación de correo.
- Crear/probar cuentas de Auth y confirmar el aislamiento de cada tabla entre dos usuarios; sigue pendiente.
- Añadir operaciones de base de datos para registrar comidas, snapshots, reversos y compras de varias líneas de forma idempotente y transaccional; sigue pendiente.
- Importar una sola vez el estado local actual v8 (se aceptan copias v5-v8), evitando sobrescribir datos remotos o duplicar movimientos; sigue pendiente.
- Probar persistencia desde dos dispositivos/sesiones autenticadas antes de retirar `localStorage` como fuente principal; sigue pendiente.

## Prueba de aislamiento entre usuarios (pendiente de ejecutar)

El control `tests/001_schema_check.sql` solo confirma que existen las tablas, RLS, políticas y permisos. No demuestra que una sesión real del usuario A quede aislada de la del usuario B.

Cuando Auth esté configurado, la prueba manual debe usar dos cuentas temporales y peticiones realizadas con la sesión autenticada de cada una:

1. Con A, crear filas sintéticas propias en las tablas personales y enlazar sus ciclos, comidas, snapshots y movimientos usando IDs de A.
2. Con B, consultar esas mismas tablas sin filtrar por propietario. No debe aparecer ninguna fila de A; B sí debe poder leer sus propias filas.
3. Con B, intentar insertar una fila indicando el `user_id` de A. RLS debe rechazarla.
4. Con B, intentar enlazar una fila propia con el ciclo/comida/sesión de A. La operación debe fallar por las políticas o las claves foráneas compuestas.
5. Cerrar sesión y comprobar que el rol no autenticado no puede leer ni modificar datos personales.
6. Repetir las verificaciones para todas las tablas y limpiar los datos y cuentas temporales.

Las peticiones de la prueba deben pasar por el cliente de Supabase con el JWT de cada usuario, no por un contexto administrativo que no represente esa sesión. La prueba queda pendiente hasta decidir y configurar el flujo de Auth.

La clave `publishable` y la URL del proyecto pueden utilizarse en cliente. Nunca colocar una clave `secret`/`service_role` ni la contraseña de base de datos en el HTML o en el repositorio.

## Retención y seguimiento de tamaño

Los snapshots de ingredientes no caducan y no hay una tarea programada que los borre. Se conservan mientras exista la comida completada y la cuenta; el borrado de la cuenta elimina sus datos relacionados en cascada. La retención es indefinida por antigüedad, no una promesa de conservar datos tras borrar la cuenta.

Al activar la sincronización multiusuario, toma una medida inicial y revisa el crecimiento mensualmente y tras importaciones grandes. Al acercarse a 350 MB del límite Free de 500 MB, revisa qué tablas ocupan más y decide una acción explícita; no se borran snapshots automáticamente. El umbral inicia una revisión, no una purga.

La lectura SQL anterior a la cuarta migración fue de **11.622.067 bytes** (aprox. 11 MB, con 12 tablas). Después de aplicar la migración, el panel siguió mostrando **11 MB** redondeados. No hay datos de la app sincronizados todavía. Es una referencia inicial, no una garantía de espacio disponible: el tamaño también incluye estructuras del proyecto y puede cambiar con extensiones y uso de PostgreSQL.

Consulta global de solo lectura:

```sql
select
  sum(pg_database_size(datname))::bigint as database_bytes,
  pg_size_pretty(sum(pg_database_size(datname))) as database_size
from pg_database;
```

Desglose de las tablas públicas, incluidos índices y otros objetos asociados:

```sql
select
  relname as table_name,
  pg_total_relation_size(relid) as total_bytes,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size
from pg_catalog.pg_statio_user_tables
where schemaname = 'public'
order by pg_total_relation_size(relid) desc;
```

La primera consulta suma las bases PostgreSQL del proyecto y se puede comparar con Database Size en el panel. La segunda ayuda a localizar qué tablas crecen. Supabase actualiza las métricas del informe a diario; database size y disk usage son medidas distintas, porque el disco también incluye WAL y archivos del sistema. Consulta [Understanding Database and Disk Size](https://supabase.com/docs/guides/platform/database-size) para interpretar ambas.
