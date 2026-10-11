# Supabase: base de datos de la aplicación

## Alcance

El HTML todavía no está conectado a Supabase. Esta carpeta define el esquema relacional y las comprobaciones para revisarlos antes de integrar autenticación o modificar la aplicación.

Los catálogos genéricos `data/foods.json` y `data/recipes.json` permanecen en GitHub. La base remota está preparada para los datos de uso personal, pero todavía no contiene registros de la aplicación. No se guarda el estado completo en una sola columna JSON.

## Migraciones

Los tres primeros archivos de `migrations/` ya se aplicaron al proyecto desde **SQL Editor**. La segunda migración revoca los permisos predeterminados y concede solo las operaciones necesarias. La tercera, `20261010140000_actual_activity_sessions.sql`, añadió `activity_sessions` y se comprobó que tenga RLS y permisos mínimos. La cuarta, `20261011100000_meal_completion_ingredient_snapshots.sql`, crea los snapshots de ingredientes y sigue **pendiente de aplicar**. Para un proyecto nuevo, revisa y aplica los cuatro archivos en orden; para el proyecto existente, aplica solo la cuarta después de comprobar el estado real.

Para revisar el esquema completo después de aplicar las cuatro migraciones, ejecuta `tests/001_schema_check.sql`. Si una tabla, política o permiso esperado falta, la consulta termina con un error. Este control estructural no crea usuarios ni demuestra el aislamiento entre dos sesiones autenticadas.

Las migraciones son aditivas y no contienen `DROP`, `TRUNCATE` ni borrados. No vuelvas a ejecutar un archivo ya aplicado: el SQL Editor no administra el historial de migraciones del repositorio.

## Estructura inicial

- `profiles`: parámetros escalares del perfil, una fila por usuario de Supabase Auth.
- `plan_cycles` y `planned_meals`: ciclos y sus 105 comidas; conservan estado, fechas y versión del catálogo.
- `meal_completions`: eventos de comidas marcadas y su reverso; la operación idempotente en la app queda pendiente.
- `meal_completion_ingredients`: migración pendiente con una fila inmutable por ingrediente y cantidad real en unidad de receta. No altera el saldo de despensa.
- `inventory_movements`: libro de movimientos append-only; el saldo se calcula sumando cantidades con signo.
- `weight_logs` y `prep_tasks`: seguimiento personal y preparación.
- `training_logs`: tabla heredada con una marca por fecha; no representa sesiones y no se usa para el cálculo actual.
- `activity_sessions`: tabla aplicada para guardar varias sesiones reales con fecha, actividad, duración y MET de referencia. Tiene RLS por usuario; el HTML todavía no la usa.
- `shopping_sessions` y `shopping_session_items`: selección de productos, envases y casillas de la compra para que también se conserve entre dispositivos.
- `user_settings`: fecha de la última copia de seguridad.

Los IDs de alimentos y recetas son texto y se resuelven contra los catálogos JSON; no se duplican esos catálogos en tablas.

Consulta [docs/supabase_db_model.md](../docs/supabase_db_model.md) para el diagrama entidad-relación, las columnas, claves, relaciones y políticas.

## Pendiente antes de conectar el HTML

- Decidir el método de acceso y si el registro será abierto o por invitación; sigue pendiente.
- Crear/probar cuentas de Auth y confirmar el aislamiento de cada tabla entre dos usuarios; sigue pendiente.
- Añadir operaciones de base de datos para registrar comidas, snapshots, reversos y compras de varias líneas de forma idempotente y transaccional; sigue pendiente.
- Aplicar la cuarta migración antes de sincronizar snapshots de comidas.
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
