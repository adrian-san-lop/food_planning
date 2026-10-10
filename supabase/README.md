# Supabase: base de datos de la aplicación

## Alcance

El HTML todavía no está conectado a Supabase. Esta carpeta define el esquema relacional y las comprobaciones para revisarlos antes de integrar autenticación o modificar la aplicación.

Los catálogos genéricos `data/foods.json` y `data/recipes.json` permanecen en GitHub. La base remota está preparada para los datos de uso personal, pero todavía no contiene registros de la aplicación. No se guarda el estado completo en una sola columna JSON.

## Migraciones

Los dos primeros archivos de `migrations/` se aplicaron al proyecto configurado desde **SQL Editor**. La segunda migración revoca primero los permisos predeterminados de Supabase y luego concede únicamente las operaciones necesarias. La tercera migración, `20261010140000_actual_activity_sessions.sql`, está preparada pero **pendiente de aplicar**; añade el registro de varias sesiones realizadas por fecha y conserva las tablas/filas anteriores. Para un proyecto nuevo, revisa y aplica los tres archivos en orden.

Para repetir el control estructural, ejecuta `tests/001_schema_check.sql`. Si una tabla, política o permiso esperado falta, la consulta termina con un error. Estas comprobaciones no crean usuarios ni insertan datos personales.

Las migraciones son aditivas y no contienen `DROP`, `TRUNCATE` ni borrados. No vuelvas a ejecutar un archivo ya aplicado: el SQL Editor no administra el historial de migraciones del repositorio.

## Estructura inicial

- `profiles`: parámetros escalares del perfil, una fila por usuario de Supabase Auth.
- `plan_cycles` y `planned_meals`: ciclos y sus 105 comidas; conservan estado, fechas y versión del catálogo.
- `meal_completions`: eventos de comidas marcadas y su reverso; la operación idempotente en la app queda pendiente.
- `inventory_movements`: libro de movimientos append-only; el saldo se calcula sumando cantidades con signo.
- `weight_logs` y `prep_tasks`: seguimiento personal y preparación.
- `training_logs`: tabla heredada con una marca por fecha; no representa sesiones y no se usa para el cálculo actual.
- `activity_sessions`: migración pendiente para guardar varias sesiones reales con fecha, actividad, duración y MET de referencia. Tiene RLS por usuario; no se usa desde el HTML mientras no exista integración remota.
- `shopping_sessions` y `shopping_session_items`: selección de productos, envases y casillas de la compra para que también se conserve entre dispositivos.
- `user_settings`: fecha de la última copia de seguridad.

Los IDs de alimentos y recetas son texto y se resuelven contra los catálogos JSON; no se duplican esos catálogos en tablas.

Consulta [docs/supabase_db_model.md](../docs/supabase_db_model.md) para el diagrama entidad-relación, las columnas, claves, relaciones y políticas.

## Pendiente antes de conectar el HTML

- Crear/probar la cuenta única de Auth y confirmar que cada tabla solo permite filas de `auth.uid()`.
- Añadir operaciones de base de datos para registrar comidas, reversos y compras de varias líneas de forma idempotente y transaccional.
- Aplicar la tercera migración antes de sincronizar sesiones. Importar una sola vez el estado local v7 (se aceptan copias v5-v7), evitando sobrescribir datos remotos o duplicar movimientos.
- Probar persistencia desde dos dispositivos/sesiones autenticadas antes de retirar `localStorage` como fuente principal.

La clave `publishable` y la URL del proyecto pueden utilizarse en cliente. Nunca colocar una clave `secret`/`service_role` ni la contraseña de base de datos en el HTML o en el repositorio.
