# Modelo de datos de Supabase

Última revisión: 10 de octubre de 2026. Este documento describe el esquema relacional aplicado al proyecto Supabase. Las migraciones SQL son la fuente de verdad si hubiera diferencias con esta documentación.

El HTML todavía no está conectado a Supabase: los datos de uso siguen en localStorage y no se ha creado una cuenta de Auth para la app. La comprobación actual valida tablas, RLS, políticas y permisos; no sustituye una prueba de acceso con una sesión autenticada.

## Diagrama entidad-relación

El diagrama resume las once tablas de la aplicación, sus claves principales, referencias y relaciones centrales. La tabla auth.users pertenece a Supabase Auth. El detalle completo de columnas aparece debajo.

![Diagrama entidad-relación de la base de datos de Supabase](images/supabase_db_model.svg)

PK significa clave primaria y FK significa clave foránea. Las tablas de la aplicación incluyen user_id para aislar sus filas por propietario. Las líneas discontinuas muestran referencias recursivas de ciclo sustituido y reverso de inventario.

## Convenciones

- Todos los registros personales pertenecen a una fila de auth.users mediante user_id. La política RLS compara ese valor con auth.uid().
- Las referencias a ciclo, comida y sesión suelen incluir también user_id en una FK compuesta. Así se impide relacionar filas de usuarios distintos.
- TIMESTAMPTZ almacena marcas temporales con zona horaria. Los campos DATE representan fechas de calendario sin hora.
- Los campos updated_at tienen DEFAULT now() al insertar. No hay triggers que los actualicen automáticamente en cada modificación.
- Los IDs food_id y recipe_id son identificadores de los catálogos JSON. No tienen FK SQL porque esos catálogos no se duplican en PostgreSQL.
- Las cantidades de inventario y compra usan g, ml o ud. En el inventario, quantity lleva signo: entradas positivas y consumos/salidas negativas.
- La tabla de movimientos es append-only para el rol de la aplicación: puede leer e insertar, pero no actualizar ni borrar.

## Tablas y columnas

### auth.users

Tabla externa administrada por Supabase Auth. La aplicación no la crea ni la modifica mediante estas migraciones.

| Columna | Tipo | Nulable | Clave o regla |
| --- | --- | --- | --- |
| id | uuid | No | PK de Supabase Auth; referenciada por user_id en las tablas personales. |

### profiles

Una fila opcional por usuario con los parámetros usados por el cálculo nutricional.

| Columna | Tipo | Nulable | Clave o regla |
| --- | --- | --- | --- |
| user_id | uuid | No | PK y FK → auth.users.id; ON DELETE CASCADE. |
| sex | text | No | DEFAULT 'manual'; male, female o manual. |
| age | smallint | No | Entre 18 y 95. |
| height_cm | numeric(5,1) | No | Entre 125 y 220 cm. |
| reference_weight_kg | numeric(5,1) | No | Entre 35 y 250 kg. |
| activity_level | text | No | DEFAULT 'low'; very_low, low, medium o high. |
| training_bonus_kcal | smallint | No | DEFAULT 0; entre 0 y 400. |
| goal | text | No | DEFAULT 'maintain'; maintain, recomp, fat_loss o muscle_gain. |
| injury_recovery | boolean | No | DEFAULT false. |
| auto_portions | boolean | No | DEFAULT true. |
| follow_weight | boolean | No | DEFAULT false. |
| manual_rmr_kcal | smallint | No | DEFAULT 1600; entre 800 y 3500. |
| created_at | timestamptz | No | DEFAULT now(). |
| updated_at | timestamptz | No | DEFAULT now(); la base no lo actualiza automáticamente. |

### plan_cycles

Cada fila representa un menú de tres semanas, incluida su versión del catálogo. Puede enlazarse con el ciclo que sustituye.

| Columna | Tipo | Nulable | Clave o regla |
| --- | --- | --- | --- |
| id | uuid | No | PK; DEFAULT gen_random_uuid(). También participa en UNIQUE (id, user_id). |
| user_id | uuid | No | FK → auth.users.id; ON DELETE CASCADE. |
| start_date | date | No | Primer día del ciclo. |
| status | text | No | draft, scheduled, active, archived o superseded. |
| catalog_version | text | No | Versión de foods.json y recipes.json usada por el ciclo. |
| generated_at | timestamptz | Sí | Momento de generación, si se conoce. |
| confirmed_at | timestamptz | Sí | Momento de confirmación, si se conoce. |
| supersedes_cycle_id | uuid | Sí | Junto con user_id, FK → plan_cycles (id, user_id); ON DELETE RESTRICT. |
| created_at | timestamptz | No | DEFAULT now(). |

Índices únicos parciales: como máximo un ciclo draft, scheduled y active por usuario. También hay un índice por user_id y start_date descendente.

### planned_meals

Una fila representa un hueco de comida de un ciclo: fecha, posición diaria y receta asignada.

| Columna | Tipo | Nulable | Clave o regla |
| --- | --- | --- | --- |
| id | uuid | No | PK; DEFAULT gen_random_uuid(). También participa en UNIQUE (id, user_id). |
| user_id | uuid | No | FK → auth.users.id; ON DELETE CASCADE. |
| cycle_id | uuid | No | Junto con user_id, FK → plan_cycles (id, user_id); ON DELETE CASCADE. |
| meal_date | date | No | Fecha prevista. |
| slot | smallint | No | Entre 0 y 4. |
| recipe_id | text | No | ID estable de recipes.json; no es una FK SQL. |
| is_locked | boolean | No | DEFAULT false. |
| created_at | timestamptz | No | DEFAULT now(). |

Restricción UNIQUE (cycle_id, meal_date, slot): no puede haber dos recetas en el mismo hueco del ciclo.

### meal_completions

Conserva el evento de completar una comida, el ID de receta usado en ese momento y cuándo se revirtió. Los registros no se borran al desmarcar una comida.

| Columna | Tipo | Nulable | Clave o regla |
| --- | --- | --- | --- |
| id | uuid | No | PK; DEFAULT gen_random_uuid(). También participa en UNIQUE (id, user_id). |
| user_id | uuid | No | FK → auth.users.id; ON DELETE CASCADE. |
| planned_meal_id | uuid | No | Junto con user_id, FK → planned_meals (id, user_id); ON DELETE RESTRICT. |
| recipe_id_snapshot | text | No | ID de receta conservado como snapshot. |
| catalog_version | text | No | Versión del catálogo usada al registrar la comida. |
| operation_id | text | No | UNIQUE junto con user_id para evitar duplicar el mismo evento. |
| completed_at | timestamptz | No | DEFAULT now(). |
| reversed_at | timestamptz | Sí | Nulo mientras el evento no se haya revertido. |
| created_at | timestamptz | No | DEFAULT now(). |

Un índice único parcial permite como máximo una finalización no revertida por comida planificada y usuario. La lógica transaccional que crea o revierte el evento aún debe implementarse en la capa de aplicación o en funciones de base de datos.

### inventory_movements

Libro de entradas y salidas. El saldo de cada alimento se calcula sumando quantity; no existe una segunda columna de saldo autoritativo.

No hay una tabla purchases separada: cada línea comprada se representa como un movimiento con movement_kind = purchase y quantity positiva.

| Columna | Tipo | Nulable | Clave o regla |
| --- | --- | --- | --- |
| id | uuid | No | PK; DEFAULT gen_random_uuid(). También participa en UNIQUE (id, user_id). |
| user_id | uuid | No | FK → auth.users.id; ON DELETE CASCADE. |
| food_id | text | No | ID estable de foods.json; no es una FK SQL. |
| quantity | numeric(14,4) | No | Debe ser distinta de cero; el signo representa entrada o salida. |
| unit | text | No | g, ml o ud. |
| movement_kind | text | No | opening, purchase, meal, adjustment, waste o reversal. |
| operation_id | text | No | UNIQUE junto con user_id para idempotencia. |
| operation_group_id | text | Sí | Agrupa líneas de una misma operación. |
| source_completion_id | uuid | Sí | Junto con user_id, FK → meal_completions (id, user_id); ON DELETE RESTRICT. |
| reverses_movement_id | uuid | Sí | Junto con user_id, FK → inventory_movements (id, user_id); ON DELETE RESTRICT. |
| shortfall_quantity | numeric(14,4) | No | DEFAULT 0; entre 0 y abs(quantity). Solo se permite para consumos meal. |
| note | text | Sí | Nota opcional. |
| created_at | timestamptz | No | DEFAULT now(). |

Reglas principales: meal exige quantity negativa y source_completion_id; purchase y opening requieren quantity positiva; waste requiere quantity negativa; reversal debe tener reverses_movement_id y los demás tipos no. Un movimiento solo puede tener un reverso enlazado. La aplicación puede insertar el consumo completo y registrar el faltante aunque el saldo previo no alcance.

### weight_logs

| Columna | Tipo | Nulable | Clave o regla |
| --- | --- | --- | --- |
| id | uuid | No | PK; DEFAULT gen_random_uuid(). |
| user_id | uuid | No | FK → auth.users.id; ON DELETE CASCADE. |
| measured_on | date | No | UNIQUE junto con user_id: un peso diario por usuario. |
| weight_kg | numeric(5,2) | No | Entre 30 y 250 kg. |
| created_at | timestamptz | No | DEFAULT now(). |

### training_logs

| Columna | Tipo | Nulable | Clave o regla |
| --- | --- | --- | --- |
| id | uuid | No | PK; DEFAULT gen_random_uuid(). |
| user_id | uuid | No | FK → auth.users.id; ON DELETE CASCADE. |
| training_date | date | No | UNIQUE junto con user_id: un registro por fecha y usuario. |
| created_at | timestamptz | No | DEFAULT now(). |

### prep_tasks

| Columna | Tipo | Nulable | Clave o regla |
| --- | --- | --- | --- |
| user_id | uuid | No | FK → auth.users.id; ON DELETE CASCADE. |
| cycle_id | uuid | No | Junto con user_id, FK → plan_cycles (id, user_id); ON DELETE CASCADE. |
| week_index | smallint | No | Entre 0 y 2. |
| task_key | text | No | Clave estable de la tarea. |
| is_completed | boolean | No | DEFAULT false. |
| updated_at | timestamptz | No | DEFAULT now(); no se actualiza automáticamente. |

PK compuesta: (cycle_id, week_index, task_key).

### shopping_sessions

Representa la ventana de una lista de compra y su estado.

| Columna | Tipo | Nulable | Clave o regla |
| --- | --- | --- | --- |
| id | uuid | No | PK; DEFAULT gen_random_uuid(). También participa en UNIQUE (id, user_id). |
| user_id | uuid | No | FK → auth.users.id; ON DELETE CASCADE. |
| window_key | text | No | Identificador de la ventana de compra. |
| starts_on | date | No | Inicio de la ventana. |
| ends_on | date | No | Debe ser igual o posterior a starts_on. |
| status | text | No | DEFAULT 'open'; open, completed o cancelled. |
| created_at | timestamptz | No | DEFAULT now(). |

Un índice único parcial permite como máximo una sesión open por usuario.

### shopping_session_items

Guarda la selección, envase y estado marcado de cada artículo de la compra. La cantidad necesaria se deriva del menú y de la despensa; no se duplica aquí.

| Columna | Tipo | Nulable | Clave o regla |
| --- | --- | --- | --- |
| id | uuid | No | PK; DEFAULT gen_random_uuid(). |
| user_id | uuid | No | FK → auth.users.id; ON DELETE CASCADE. |
| session_id | uuid | No | Junto con user_id, FK → shopping_sessions (id, user_id); ON DELETE CASCADE. |
| item_key | text | No | UNIQUE junto con session_id. |
| food_id | text | No | ID estable de foods.json; no es una FK SQL. |
| item_kind | text | No | planned o extra. |
| is_checked | boolean | No | DEFAULT false. |
| package_count | numeric(12,3) | No | DEFAULT 0; debe ser mayor o igual que cero. |
| package_size | numeric(14,4) | No | Debe ser mayor que cero. |
| unit | text | No | g, ml o ud. |
| updated_at | timestamptz | No | DEFAULT now(); no se actualiza automáticamente. |

### user_settings

| Columna | Tipo | Nulable | Clave o regla |
| --- | --- | --- | --- |
| user_id | uuid | No | PK y FK → auth.users.id; ON DELETE CASCADE. |
| last_backup_at | timestamptz | Sí | Fecha de la última copia anotada. |
| updated_at | timestamptz | No | DEFAULT now(); no se actualiza automáticamente. |

## Relaciones

| Tabla origen | Tabla destino | Cardinalidad | Clave y significado |
| --- | --- | --- | --- |
| auth.users | profiles | 1 a 0..1 | profiles.user_id es PK y FK a auth.users.id. |
| auth.users | user_settings | 1 a 0..1 | user_settings.user_id es PK y FK a auth.users.id. |
| auth.users | plan_cycles, planned_meals, meal_completions, inventory_movements, weight_logs, training_logs, prep_tasks, shopping_sessions, shopping_session_items | 1 a N por tabla | Cada tabla tiene FK user_id → auth.users.id para propiedad y RLS. |
| plan_cycles | planned_meals | 1 a N | FK compuesta planned_meals (cycle_id, user_id). |
| plan_cycles | prep_tasks | 1 a N | FK compuesta prep_tasks (cycle_id, user_id). |
| plan_cycles | plan_cycles | 0..1 ciclo anterior a 0..N ciclos sucesores | FK compuesta (supersedes_cycle_id, user_id); el enlace es opcional. |
| planned_meals | meal_completions | 1 a N registros históricos | FK compuesta meal_completions (planned_meal_id, user_id); solo uno puede quedar sin revertir. |
| meal_completions | inventory_movements | 1 a N movimientos | FK compuesta inventory_movements (source_completion_id, user_id); se usa para los consumos de la comida. |
| inventory_movements | inventory_movements | 1 a 0..1 reverso | FK compuesta (reverses_movement_id, user_id) y un índice único por movimiento revertido. |
| shopping_sessions | shopping_session_items | 1 a N | FK compuesta shopping_session_items (session_id, user_id). |

Todas las FKs directas a auth.users usan ON DELETE CASCADE. Las relaciones de planned_meals/prep_tasks con ciclos y de shopping_session_items con sesiones usan ON DELETE CASCADE. Las FKs de comidas completadas, movimientos enlazados y ciclo sustituido usan ON DELETE RESTRICT para conservar la trazabilidad; una referencia restrictiva descendiente también puede impedir el borrado de un padre.

## Seguridad y estado de validación

- RLS está habilitado en las once tablas personales y sus políticas filtran por auth.uid() = user_id.
- El rol anon no tiene permisos de lectura, inserción, actualización ni borrado en estas tablas.
- El rol authenticated recibe solo los permisos de tabla previstos; inventory_movements permite lectura e inserción, sin actualización ni borrado.
- La migración estructural y la migración correctiva de permisos se aplicaron desde SQL Editor. La consulta estructural terminó sin errores y un resumen de catálogo mostró las once tablas con RLS activado.
- Aún no se ha probado el aislamiento entre dos sesiones reales de Auth. La conexión del HTML, el usuario de Auth y las funciones transaccionales/idempotentes para completar comidas, reversos y compras siguen pendientes.
- SQL Editor no registra por sí solo el historial de archivos de migración. Los archivos locales describen el orden aplicado, pero aún no existe una operación de Supabase CLI que los registre en su tabla de versiones.

## Fuente de verdad

- Esquema inicial: [20261010130000_initial_schema.sql](../supabase/migrations/20261010130000_initial_schema.sql).
- Permisos mínimos: [20261010131500_least_privilege_grants.sql](../supabase/migrations/20261010131500_least_privilege_grants.sql).
- Comprobación estructural: [001_schema_check.sql](../supabase/tests/001_schema_check.sql).
- Guía de Supabase: [supabase/README.md](../supabase/README.md).
