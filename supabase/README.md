# Supabase: base de datos de la aplicación

## Alcance

El HTML usa Supabase Auth para iniciar sesión y sincroniza los datos personales con las tablas relacionales existentes. Las propuestas de recetas forman un buzón compartido y separado del estado personal. Los catálogos genéricos `data/foods.json` y `data/recipes.json` permanecen en GitHub. Los JSON enviados a RPC son formatos de transporte: PostgreSQL no guarda el estado personal completo ni las propuestas como un documento JSON único.

Las credenciales pertenecen a Supabase Auth (`auth.users`). `public.profiles` guarda parámetros nutricionales y se relaciona con la cuenta mediante `user_id`; no almacena correo ni contraseña.

## Migraciones

Las siete migraciones iniciales de `migrations/` están aplicadas al proyecto desde **SQL Editor**. La quinta, `20261011120000_menuki_cloud_sync.sql`, añade metadatos de inicialización/revisión, identificadores de sesión del cliente y la función transaccional `sync_menuki_state`. La sexta, `20261011130000_menuki_cloud_reset.sql`, añade `reset_menuki_state` para las acciones confirmadas de reiniciar/restaurar. La séptima, `20261011150000_profile_confirmation.sql`, añade `profiles.profile_confirmed` y actualiza `sync_menuki_state`. La octava, `20261013120000_menuki_sync_conflict_http_409.sql`, prepara respuestas HTTP 409 ante conflictos de revisión y sigue pendiente. El propietario informa que la novena, `20261013160000_recipe_proposal_inbox.sql`, ya se ejecutó y que la cuenta admin ya se asignó; crea cuatro tablas de propuestas/administradores y tres RPCs acotados. La novena no altera las filas personales ni el RPC `sync_menuki_state`. En un proyecto nuevo, revisa el estado real antes de ejecutar migraciones; en el proyecto existente no vuelvas a ejecutar scripts que ya se hayan aplicado.

La migración crea `sync_menuki_state(jsonb, bigint)`: el cliente transmite el snapshot, la función obtiene el propietario mediante `auth.uid()`, guarda los registros en las tablas normalizadas y comprueba `sync_revision` para rechazar copias desactualizadas. La primera sincronización importa una sola vez el estado local si la cuenta no tiene ya registros; no sobrescribe silenciosamente filas remotas. La app no mantiene una cola offline.

La migración de propuestas define `submit_recipe_proposal`, que recibe campos simples, valida sus límites y guarda la cabecera, los ingredientes y los pasos en una transacción. Usa un identificador de cliente para que un reintento no duplique la misma propuesta. `is_menuki_admin` comprueba una lista privada de roles y `clear_recipe_proposals` permite al administrador borrar el buzón completo con control de recuento. El borrado bloquea altas simultáneas y falla si el número de propuestas cambió desde la confirmación de la interfaz.

### Asignar el administrador

Registra primero la cuenta admin normal en la app. Después, en **SQL Editor**, comprueba que Auth la conoce:

```sql
select id, email
from auth.users
where lower(email) = lower('correo-de-la-cuenta-admin@ejemplo.com');
```

Reemplaza el correo de ejemplo por el correo exacto de esa cuenta. Si la consulta devuelve una fila, asígnale el rol:

```sql
insert into public.menuki_admins (user_id)
select id
from auth.users
where lower(email) = lower('correo-de-la-cuenta-admin@ejemplo.com')
on conflict (user_id) do nothing;
```

No añadas la asignación de rol al HTML. Las cuentas normales no pueden leer ni cambiar `menuki_admins`; Supabase vuelve a comprobar el permiso en las políticas y funciones, aunque alguien altere la interfaz del navegador.

El reinicio y la restauración de una copia JSON son operaciones explícitas distintas: tras confirmarlas en la app, `reset_menuki_state` reemplaza los registros personales y guarda el nuevo snapshot dentro de la misma transacción. El reinicio no se ejecuta en sincronizaciones ordinarias.

Para revisar el esquema inicial, ejecuta `tests/001_schema_check.sql`. Es una comprobación estructural; no demuestra el aislamiento con dos sesiones autenticadas ni el recorrido completo de sincronización.

SQL Editor no mantiene el historial de los archivos del repositorio en la tabla de versiones de Supabase. Según el propietario, la novena migración ya se aplicó; la octava sigue pendiente. Antes de ejecutar SQL, compara el estado alojado y aplica solo la octava. No vuelvas a ejecutar migraciones ya aplicadas solo para registrarlas.

## Tablas utilizadas

- `profiles`: parámetros del perfil nutricional y estado de revisión, una fila por cuenta.
- `plan_cycles` y `planned_meals`: menús, ciclos, fechas y recetas.
- `meal_completions` y `meal_completion_ingredients`: comidas completadas/revertidas y cantidades consumidas como snapshots.
- `inventory_movements`: libro de entradas y salidas; el saldo se deriva de sus movimientos.
- `weight_logs`, `activity_sessions` y `training_logs`: pesos, sesiones reales y marcas heredadas.
- `prep_tasks`: preparación semanal.
- `shopping_sessions` y `shopping_session_items`: lista, cantidades de envases y elementos marcados.
- `user_settings`: copia registrada, inicialización y revisión de sincronización.
- `recipe_proposals`, `recipe_proposal_ingredients` y `recipe_proposal_steps`: buzón compartido con contenido en texto libre. Solo el administrador puede leer las filas; el envío se realiza por RPC.
- `menuki_admins`: cuentas con acceso administrativo, gestionadas por el propietario desde SQL Editor y sin permisos directos para el navegador.

Los IDs de alimentos y recetas se resuelven contra los catálogos JSON; no se duplican esos catálogos en tablas. Consulta [docs/supabase_db_model.md](../docs/supabase_db_model.md) para columnas, claves, relaciones y políticas.

## Pendiente de validar

- Aplicar la octava migración desde SQL Editor y publicar el HTML actualizado en GitHub Pages. La novena y la asignación admin se consideran aplicadas según confirmación del propietario.
- Validar con una cuenta normal y otra admin: envío, aislamiento de lectura, JSON admin conforme al esquema v1, permisos del botón de borrado, confirmación del recuento y borrado en cascada de ingredientes y pasos.
- Ejecutar la prueba de aislamiento con dos cuentas de Auth: lectura, inserción y referencias entre propietarios distintos.
- Probar en la web publicada los cambios desde PC y móvil, los conflictos y la recuperación ante un error de red.
- Definir una copia externa periódica y revisar el crecimiento de almacenamiento.

## Prueba de aislamiento entre usuarios (pendiente de ejecutar)

El control `tests/001_schema_check.sql` solo confirma que existen las tablas, RLS, políticas y permisos. No demuestra que una sesión real del usuario A quede aislada de la del usuario B.

Cuando Auth esté configurado, la prueba manual debe usar dos cuentas temporales y peticiones realizadas con la sesión autenticada de cada una:

1. Con A, crear filas sintéticas propias en las tablas personales y enlazar sus ciclos, comidas, snapshots y movimientos usando IDs de A.
2. Con B, consultar esas mismas tablas sin filtrar por propietario. No debe aparecer ninguna fila de A; B sí debe poder leer sus propias filas.
3. Con B, intentar insertar una fila indicando el `user_id` de A. RLS debe rechazarla.
4. Con B, intentar enlazar una fila propia con el ciclo/comida/sesión de A. La operación debe fallar por las políticas o las claves foráneas compuestas.
5. Cerrar sesión y comprobar que el rol no autenticado no puede leer ni modificar datos personales.
6. Repetir las verificaciones para todas las tablas y limpiar los datos y cuentas temporales.

Las peticiones de la prueba deben pasar por el cliente de Supabase con el JWT de cada usuario, no por un contexto administrativo que no represente esa sesión. Auth está configurado; queda ejecutar la prueba con dos sesiones.

La clave `publishable` y la URL del proyecto pueden utilizarse en cliente. Nunca colocar una clave `secret`/`service_role` ni la contraseña de base de datos en el HTML o en el repositorio.

## Retención y seguimiento de tamaño

Los snapshots de ingredientes no caducan y no hay una tarea programada que los borre. Se conservan mientras exista la comida completada y la cuenta; el borrado de la cuenta elimina sus datos relacionados en cascada. La retención es indefinida por antigüedad, no una promesa de conservar datos tras borrar la cuenta.

Al activar la sincronización multiusuario, toma una medida inicial y revisa el crecimiento mensualmente y tras importaciones grandes. Al acercarse a 350 MB del límite Free de 500 MB, revisa qué tablas ocupan más y decide una acción explícita; no se borran snapshots automáticamente. El umbral inicia una revisión, no una purga.

La lectura SQL anterior a la cuarta migración fue de **11.622.067 bytes** (aprox. 11 MB, con 12 tablas); el panel mostró **11 MB** redondeados después de la cuarta migración. Las migraciones quinta a séptima no importaron registros de la app. El propietario comunicó **27 MB** en el panel el 13 de octubre de 2026. Es una medida reportada, no una lectura independiente de esta revisión; queda por debajo del umbral de revisión de 350 MB. El tamaño puede cambiar con extensiones y uso de PostgreSQL.

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
