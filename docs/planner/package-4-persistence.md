# Paquete 4: persistencia de preferencias y configuración

- Fecha: 23/10/2026.
- Estado: **Incorporado a dev; migración aplicada en Supabase según confirmación del propietario el 23/10/2026.** Se desarrolló en `chore/common-menu-generator`, conservando el paquete 3. El propietario comunica `Success` al ejecutar el SQL y `ready = true` en las siete comprobaciones; posteriormente incorporó ambos paquetes a `origin/dev`, comprobado antes de iniciar el 5 (`a3b6af28c0ea`). El paquete 7 añadió validación funcional con sesiones reales y el propietario confirmó el funcionamiento actual en PC y móvil.
- Alcance: [plan integrado](implementation-plan.md), paquete 4; [ADR-0047](../decisions/0047-guided-first-use-and-personalized-planning.md).

## Implementación y validación posterior

Se preparan la lectura y escritura relacionales de preferencias y borradores, la migración local v12, la conciliación y las validaciones del servidor. La renovación recibe las preferencias guardadas cuando se carga un esquema compatible. Cambiar preferencias no sustituye automáticamente ningún menú ni borrador: se aplican al regenerar explícitamente.

Al cerrar el paquete 4 no se añadían botones ni campos de tiempo. El [paquete 5](package-5-preferences-and-weekly-review.md) los implementa y prueba localmente, junto con la revisión semanal, sin SQL nuevo. El [paquete 6](package-6-guided-first-setup.md) implementa localmente los cuatro pasos y su activación para cuentas nuevas; conserva datos y menús de cuentas existentes.

El propietario confirmó el 23/10/2026 que aplicó la migración en SQL Editor y que las siete comprobaciones estructurales dieron `ready = true`. La ejecución y el diagnóstico del esquema quedan registrados como completados según esa confirmación, sin inspección remota independiente del agente. El cliente conserva además la compatibilidad con proyectos que todavía usen el esquema anterior.

## Contrato local y modelos

El estado vigente pasa de v11 a **v12**. Se conservan todas las migraciones v5-v11 y se añaden tres campos:

```js
{
  setupMode: 'legacy', // 'guided' únicamente cuando el nuevo recorrido opte por él
  setupDraft: { v: 1, profile: { /* campos tipados y personales null */ },
    preferencesReviewed: false, startDate: null },
  planningPreferences: {
    recipePreferences: {}, // normal | favorite | do_not_propose
    weekdayTimeLimits: { comida: null, cena: null }
  }
}
```

Migrar un estado antiguo no inventa preferencias ni cambia perfil, confirmación, menú, consumos o movimientos. Los valores nuevos se validan; un estado v12 inválido se conserva y produce un error explícito, sin reemplazarlo silenciosamente por una cuenta vacía. No hay migraciones v1-v4 ni restauración JSON.

`js/persistence/planning-state.js` concentra valores iniciales, validación, mapeo de las filas nuevas e inicialización. `initializeAccountState` conserva cuentas locales existentes y prepara una cuenta guiada nueva sin perfil ni ciclo. El paquete 6 activa `guidedSetup: true` para cuentas nuevas sin datos reales previos, con comprobación de capacidad del esquema. Un perfil incompleto solo pertenece al borrador; no se convierte en un perfil confirmado mediante valores de ejemplo.

## Tablas y SQL

Migración completa: [20261023120000_planning_preferences_and_setup.sql](../../supabase/migrations/20261023120000_planning_preferences_and_setup.sql).

| Objeto | Contenido y reglas |
| --- | --- |
| `profile_setup_drafts` | Una fila por cuenta, versión 1, campos personales tipados y nulables, booleanos, preferencias revisadas y fecha elegida. |
| `menu_preferences` | Máximos independientes para comida y cena entre semana: enteros de 1 a 1440 minutos o NULL para retirar el límite. |
| `recipe_preferences` | Clave `(user_id, recipe_id)` y valor normal/favorite/do_not_propose. Normal explícito conserva la intención de retirar otra preferencia. |
| `user_settings.setup_mode` | Legacy por compatibilidad o guided para el nuevo recorrido. No se puede degradar una cuenta guided mediante sincronización ordinaria. |
| `profiles.manual_rmr_kcal` | Admite NULL cuando el modo de cálculo no es manual; sigue siendo obligatorio y válido al confirmar un perfil manual. Los demás datos obligatorios del perfil no se relajan. |
| `menuki_state_capabilities()` | Devuelve `planning_contract: 1`; disponible solo para authenticated. No expone datos personales. |

Las tres tablas nuevas tienen RLS de lectura propia y permisos de solo lectura para el navegador; todas las escrituras pasan por `sync_menuki_state`. También se retiran los permisos directos de escritura de perfiles, ciclos, comidas planificadas y ajustes para impedir saltarse su validación.

Se incluyen definiciones completas de `sync_menuki_state` y `reset_menuki_state`, sin buscar ni sustituir fragmentos en el cuerpo desplegado. Se conservan `auth.uid()`, la transacción, el bloqueo de la revisión, los conflictos PT409, los identificadores y la idempotencia. Los RPC nuevos no insertan en `meal_completion_shortfalls`; se mantienen los triggers de inventario y la retirada ya aplicada.

El servidor valida tipos, límites y campos del perfil confirmado y de los borradores; rechaza ciclos incompletos (105 posiciones únicas por ciclo). Para aceptar un primer plan activo/programado del flujo guided requiere perfil confirmado válido y confirmación del plan. También valida una nueva confirmación enviada por el flujo legacy; los ciclos heredados y la plantilla inicial sin confirmación se conservan por compatibilidad. Esa excepción no equivale a haber terminado la nueva configuración.

Un reinicio total confirmado limpia además las preferencias y el borrador de esa cuenta dentro de la misma transacción. Las sincronizaciones normales no borran estos datos por omisión.

## Compatibilidad y conciliación

- El transporte consulta capacidades antes de leer tablas nuevas. Solo la ausencia del RPC (`PGRST202` o `42883`) activa el modo de esquema anterior; un error de permisos, conexión o una tabla ausente en un esquema anunciado como compatible se muestra como error real.
- Sin la migración, un estado legacy sin preferencias nuevas se envía mediante el contrato anterior, conservando la sincronización habitual. Si contiene preferencias o progreso que ese esquema no puede guardar, se informa y no se declara guardado remoto. No aparece un aviso de migración al cargar una cuenta normal.
- Las lecturas relacionales comparan la revisión antes y después de descargar las tablas. Si otro dispositivo guarda durante esa descarga, se reintenta hasta tres veces; no se devuelve una mezcla de revisiones.
- La integridad del menú se valida aparte de la hidratación de cuenta. Si falta una receta o una posición, o hay fechas/posiciones inválidas, el perfil, inventario, seguimiento y demás datos se cargan desde Supabase; el menú no se usa en la interfaz ni en la compra y no se pide revisarlo. No se sustituyen recetas ni se presentan cálculos incompletos como lista completa. ADR-0051 sustituye el archivado por omisión: se conservan las filas aunque el cliente no pueda mostrarlas. La migración del contrato 2, sus ocho comprobaciones y el funcionamiento en PC y móvil constan confirmados por el propietario el 25/10/2026 en [cuenta canónica](../backend/account-contract.md); la migración original de este paquete sigue confirmada. La consulta de solo lectura [menu_cycle_integrity.sql](../../supabase/diagnostics/menu_cycle_integrity.sql) permite comprobar casos antiguos. Véase [ADR-0050](../decisions/0050-account-load-independent-from-menu-integrity.md).
- Con la migración, perfil, borrador, preferencias, ciclos e inventario se escriben con la misma revisión y transacción. Un cliente antiguo que omite campos nuevos no los borra. Una cuenta guided requiere un cliente con el contrato nuevo para evitar que el arranque antiguo instale una plantilla por error.
- La conciliación conserva cambios independientes por receta, por límite de tiempo y por campo del borrador. Si dos dispositivos cambian el mismo valor, gana la revisión aceptada por Supabase. Se conservan `normal` y `null` como retiradas explícitas, no como omisiones.
- `state_initialized_at`, perfil confirmado y primer plan confirmado son hechos distintos. Una cuenta guided inicializada puede no tener fila de `profiles`: el mapeo recupera su borrador sin fabricar un perfil. Una cuenta legacy inicializada sin perfil sigue siendo una inconsistencia visible.

## Verificación

- `npm test`: **145 pruebas correctas**, con regresiones de catálogos, generación, raciones, inventario y sincronización, y casos nuevos de estado v12, preferencias, borradores, esquema antiguo y errores.
- PostgreSQL local temporal mediante PGlite 0.5.11: **18 comprobaciones correctas**. Se ejecutan todas las migraciones en orden y se repite la nueva; se prueban transacciones, 80 casos de equivalencia de validación de perfil, primera confirmación, ciclos de 105 comidas, PT409, omisiones de clientes antiguos, normal/null, inventario sin stock, reversos idempotentes, reinicio y permisos/RLS con dos identidades y el rol anónimo.
- Las identidades y roles son simulados en PostgreSQL local; esto no acredita Supabase Auth, PostgREST, dos dispositivos reales ni el proyecto alojado. La interfaz de favoritos y el recorrido guiado no se han validado aquí porque todavía no existen.

Para repetir la prueba SQL, instalar la herramienta temporal y ejecutar desde la raíz:

```powershell
npm install --prefix ./tmp/pglite-runtime --no-save --no-package-lock @electric-sql/pglite@0.5.11
npm run test:sql
```

La herramienta solo se utiliza en pruebas; no se carga en la web ni se publica. También puede indicarse una instalación externa con `node tests/sql/planning-persistence.mjs <ruta-a-pglite/dist/index.js>`. La base es efímera y no utiliza conexión, credenciales ni datos de Supabase.

## Aplicación en Supabase: confirmada el 23/10/2026

El propietario comunica: «Ha salido todo correcto, success y true todo». La confirmación corresponde a ejecutar [20261023120000_planning_preferences_and_setup.sql](../../supabase/migrations/20261023120000_planning_preferences_and_setup.sql) en SQL Editor y las siete consultas de [planning_persistence.sql](../../supabase/diagnostics/planning_persistence.sql), siguiendo las instrucciones de esta rama.

| Comprobación | Resultado comunicado |
| --- | --- |
| Ejecución de la migración | Success. |
| `three_new_tables_rls` | `ready = true`. |
| `planning_tables_read_only_for_browser` | `ready = true`. |
| `profile_and_plan_rpc_only` | `ready = true`. |
| `own_read_policies` | `ready = true`. |
| `capability_v1` | `ready = true`. |
| `transactional_sync_definition` | `ready = true`. |
| `rpc_grants` | `ready = true`. |

La aplicación de la migración y la comprobación estructural del esquema quedan cerradas **según la confirmación del propietario**, no por la existencia del archivo en Git ni por las pruebas locales. En ese cierre no se consultó independientemente el proyecto alojado. El paquete 7 añade comprobaciones funcionales Auth/PostgREST con dos cuentas; no ejecuta SQL administrativo ni acredita por sí solo la definición completa instalada. Las consultas de diagnóstico permanecen disponibles como comprobación de solo lectura.

## Cierre e integración posterior

- El [paquete 7](package-7-integration.md) comprobó con dos cuentas reales las preferencias, el progreso, los conflictos y el primer plan. El propietario confirmó que la versión actual funciona en PC y móvil y que las cuentas de prueba se eliminaron.
- La migración del paquete 4 no es una acción pendiente y no hay SQL nuevo para esta entrega. Los paquetes 1–7 están cerrados según el [plan integrado](implementation-plan.md).
