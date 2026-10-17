# Arquitectura

## Estilo de la aplicación

La actualización visual del 16 de octubre de 2026 centraliza los colores de la aplicación y del acceso en un único `:root` de `assets/css/app.css`. Roboto variable se sirve desde `assets/fonts/roboto-latin-wght-normal.woff2`, precargada por `menuki.html`; su licencia SIL OFL está en la misma carpeta. Los componentes y la gráfica de peso consumen los mismos roles de color. Se mantienen la hoja CSS nativa y el flujo responsive existente. La landing pública usa su hoja separada. Véase [ADR-0016](decisions/0016-css-sections-and-template-presentation.md).

Estado documental actualizado: 17 de octubre de 2026. El administrador confirma que la corrección HTTP 409 de `20261013120000_menuki_sync_conflict_http_409.sql` está aplicada y el problema asociado está resuelto en Supabase. El propietario ya había confirmado la aplicación de las migraciones del buzón y del mantenimiento admin, la asignación del rol y el funcionamiento del borrado individual. Estas son confirmaciones comunicadas, no una nueva verificación en vivo. La corrección de purga global continúa pendiente de confirmación; las pruebas completas de aislamiento y sincronización entre dispositivos siguen abiertas.

## Arquitectura actual

```text
Navegador
  └── GitHub Pages / HTML estático
        ├── index.html (landing pública responsive)
        ├── menuki.html (shell HTML)
        ├── assets/
        │     ├── css/app.css (estilos de la aplicación)
        │     └── css/landing.css (landing pública)
        ├── js/
        │     ├── main.js (entrada ES; UI y orquestación restante)
        │     ├── landing.js (interacciones de la landing pública)
        │     ├── ui/html.js (escape HTML y validación de URL por origen permitido)
        │     ├── domain/dates.js (fecha civil Europe/Madrid)
        │     ├── domain/cycle-shopping.js (fin de ciclo, confirmación, ventana de compra y fechas de cobertura)
        │     ├── domain/inventory-units.js (conversiones de unidades)
        │     ├── domain/state-reconciliation.js (conciliación de cambios de estado)
        │     ├── data/catalogs.js (carga y validación de JSON)
        │     ├── persistence/local-state.js (copia de trabajo local)
        │     ├── persistence/recipe-proposals.js (envío, consulta, edición y limpieza del buzón)
        │     └── persistence/supabase-transport.js (lecturas y RPC)
        └── data/*.json + esquemas JSON
              └── carga desde el módulo de catálogos

Supabase Auth + PostgreSQL con RLS (servicio externo)
```

El cliente de Supabase se carga desde jsDelivr con la versión exacta `@supabase/supabase-js@2.117.3`. Las pruebas automatizadas usan Node integrado; no añaden una dependencia de ejecución a la web publicada.

Actualización del 15 de octubre de 2026: el planificador interno gestiona la renovación, con bloqueo de Inicio y Menú cuando termina el ciclo sin otro confirmado disponible. La compra del siguiente solo se ofrece con confirmación y de uno a tres días antes del inicio. La previsión de despensa se calcula sobre una copia del saldo, sin movimientos. Las selecciones y extras se separan por ciclo: los artículos planificados mantienen el alimento después del primer `:` de `item_key`, y los extras del próximo codifican su ámbito en la misma clave existente. La lectura relacional y la conciliación conservan ese ámbito; no se añade ninguna tabla, columna ni migración.

- `index.html` es la landing pública en la raíz de GitHub Pages; `menuki.html` conserva el shell autenticado. Las acciones de acceso y registro abren un diálogo que reutiliza el formulario de `menuki.html` en un iframe del mismo origen; al completar el acceso se navega a la aplicación. Sin JavaScript o sin soporte de diálogo, los enlaces relativos abren el acceso independiente; `menuki.html?auth=signup` preselecciona el registro. La landing usa rutas relativas, una cabecera fija, diseño responsive y movimiento reducido cuando así lo prefiere el dispositivo.
- La primera etapa reunió en una hoja los estilos de los ocho bloques `<style>` y convirtió el bloque de aplicación en un módulo ES. `assets/css/app.css` organiza base, shell, controles y vistas, y concentra las reglas responsive al final. Las plantillas de `main.js` ya no generan atributos `style`; los indicadores usan `<progress>`. Las recetas se muestran sin fotografías de platos; las imágenes de marca se mantienen en la interfaz. Vistas, gran parte del dominio y la orquestación de Auth/sincronización siguen en `main.js`.
- Menuki guarda las fechas civiles como `YYYY-MM-DD`. `today()` resuelve el instante en `Europe/Madrid`; los objetos `Date` que se usan para operar con días representan medianoche UTC y solo son portadores de fecha. Los timestamps siguen siendo instantes ISO y se presentan en la zona de Madrid.
- `js/data/catalogs.js` carga los catálogos JSON de la misma publicación, valida su estructura y correspondencia entre unidades e ingredientes, y los adapta al modelo interno de la app.
- `js/ui/html.js` centraliza la codificación de texto y atributos y solo permite URL HTTPS de orígenes indicados explícitamente. Las vistas todavía usan plantillas HTML, pero escapan los valores variables del catálogo y del estado personal antes de insertarlos.
- Los indicadores de comidas completadas usan elementos `<progress>` con etiquetas accesibles en sus botones; el color y la disposición se definen en CSS.
- `npm test` ejecuta pruebas integradas para fechas, conversiones, validación de catálogos y codificación HTML/URL. Las pruebas de navegador con Auth, sincronización y RLS requieren cuentas y publicación y siguen pendientes.
- El menú fijo de 105 espacios sigue siendo el primer ciclo. La propuesta siguiente puede revisarse, guardarse y activarse en su fecha.
- En Inicio, el acceso a revisar el perfil se muestra hasta que la persona confirma sus datos. Una guía rápida opcional de tres pasos explica perfil y fecha, menú y registro de comidas, compra/despensa y seguimiento. La guía también se puede abrir desde Guía, que conserva el recorrido completo. El paso de fecha reutiliza el editor existente; si no hay ciclo, remite al selector global. La guía no guarda un indicador de onboarding. La confirmación del perfil sigue sincronizada mediante la columna profile_confirmed.
- El cliente consulta `user_settings.sync_revision` mientras la página está visible cada 15 segundos y al volver al foco o recuperar la conexión. Solo descarga el estado completo si la revisión cambió.
- `js/domain/state-reconciliation.js` aplica una conciliación de tres vías entre la base común guardada en la copia de trabajo, el estado local y el estado remoto. Combina cambios independientes; si ambos dispositivos modifican el mismo valor, prevalece la revisión que Supabase aceptó más recientemente. La existencia, el identificador, la fecha y el menú del ciclo activo se resuelven juntos. Cada nueva instancia del ciclo usa un ID propio, conservado al archivarlo. Si se elige una fecha con un ciclo archivado, Menuki lo reactiva con el mismo ID y menú, desmarca sus comidas completadas mediante movimientos inversos de despensa y conserva los eventos con su marca de reversión para sincronizarlos. Las sesiones, pesos y movimientos usan identificadores o tombstones para evitar duplicados y propagar eliminaciones.
- Los RPC devuelven conflictos de revisión como `PT409` con mensaje `SYNC_CONFLICT`. La migración `20261013120000_menuki_sync_conflict_http_409.sql` sustituye el antiguo `40001`, que PostgREST 14 interpretaba como fallo transitorio y reintentaba, generando errores repetidos.
- Las comidas de fechas futuras se muestran como planificadas y no se pueden registrar como consumidas antes de que llegue ese día.
- `data/foods.json` y `data/recipes.json` son la fuente canónica de los catálogos genéricos. `js/data/catalogs.js` valida esos ficheros y deriva las estructuras en memoria que necesita la interfaz.
- Para datos personales, Supabase es la fuente canónica remota de una cuenta y `localStorage` es su copia de trabajo en el navegador. Los cambios se sincronizan automáticamente; el indicador muestra si están guardados, pendientes o si hubo un error. La acción de reintento solo aparece tras un error. Cambiar de dispositivo no muestra una elección de copias.
- Los alimentos separan medida de receta (`recipeUnit`) y medida de inventario (`unit`). Las raciones de fruta entera usan piezas en receta y despensa; las verduras cocinadas o troceadas siguen en gramos en receta y piezas en despensa. El pan de molde se expresa en rebanadas en receta y en gramos en despensa/compra. El peso aproximado por pieza o rebanada permite convertir y calcular nutrición.
- Las sesiones se registran después de realizarse. Su energía neta estimada se aplica solo a la fecha de la sesión y a comidas aún pendientes; no cambia días futuros ni cantidades ya registradas.
- Supabase conserva identidad en `auth.users` y los datos personales en sus tablas relacionales con RLS. El perfil se guarda en `profiles`; las credenciales no se copian a tablas públicas.
- La migración `20261011120000_menuki_cloud_sync.sql` añade la operación transaccional e idempotente de sincronización, control de revisión para evitar sobrescribir cambios recientes y metadatos de ciclos/sesiones. La migración `20261011150000_profile_confirmation.sql` añade la confirmación del perfil y actualiza la sincronización para guardarla sin borrar una confirmación al recibir clientes antiguos. No se almacena el estado completo como JSON en una columna.
- El reinicio total requiere una confirmación específica y usa reset_menuki_state, que reemplaza las filas propias en la misma transacción. Si la revisión cambia antes de ejecutar la acción confirmada, el cliente actualiza la revisión y reintenta; el reinicio queda fuera de la conciliación habitual.
- El primer acceso de una cuenta sin inicializar importa su estado local una sola vez. Los dispositivos siguientes leen el estado remoto. No hay cola offline; la app requiere conexión para sincronizar y muestra cuándo conserva cambios locales pendientes.
- Los snapshots de ingredientes mantienen retención indefinida y no se purgan automáticamente. Vigilar el crecimiento de la base al añadir usuarios, con revisión alrededor de 350 MB.

## Sincronización de datos personales

```text
Móvil / ordenador
       │
       ▼
GitHub Pages (HTML, JavaScript y catálogos genéricos JSON)
       │
       ├── lectura de foods.json y recipes.json para proponer ciclos
       └── sesión Auth + API ──────► PostgreSQL privado + RLS
```

Los catálogos comunes se versionan junto al código. El estado personal (perfil, peso, ciclos, comidas, compras, despensa y sesiones) se mantiene fuera de esos JSON y se guarda en sus tablas relacionales, siempre con `user_id = auth.uid()`. El JSON enviado al procedimiento solo transporta datos entre el navegador y la función; PostgreSQL no conserva una columna con el estado completo.

## Separación de datos

| Dominio | Fuente canónica | Uso o copia de trabajo |
| --- | --- | --- |
| Alimentos, nutrición aproximada y formato de compra | `data/foods.json`, descrito por `foods.schema.json` | Modelo en memoria derivado al cargar el catálogo |
| Recetas e ingredientes | `data/recipes.json`, descrito por `recipes.schema.json` | Modelo en memoria derivado con referencias a IDs estables de alimentos |
| Menú fijo inicial | Plantilla de IDs de receta en `js/main.js` | Se usa para inicializar el primer ciclo personal; no duplica las recetas |
| Ciclos y comidas personales | `plan_cycles` y `planned_meals` en Supabase | `localStorage` mantiene la copia de trabajo del navegador |
| Perfil, peso, actividad, comidas realizadas e inventario | Tablas relacionales de Supabase vinculadas por `user_id` | `localStorage` mantiene la copia de trabajo del navegador |
| Preparación y compra | `prep_tasks`, `shopping_sessions` y `shopping_session_items` en Supabase | `localStorage` mantiene la copia de trabajo del navegador |
| Ideas de recetas enviadas | `recipe_proposals` y sus tablas de ingredientes/pasos en Supabase; novena migración aplicada según el propietario | Texto de propuesta; el admin descarga JSON v1 para revisión, no se mezcla con el estado personal ni se publica automáticamente |
| Gustos/restricciones | No hay sistema general implementado | Preferencias por persona fuera del catálogo; modelo pendiente |

No colocar datos personales o copias de seguridad en GitHub. Aunque un repositorio sea privado, GitHub Pages publica el sitio. Las tablas personales usan RLS; la clave pública del proyecto puede aparecer en el navegador, pero una clave `service_role` o cualquier otro secreto nunca debe incluirse ahí.

## Esquema remoto y conexión del HTML

El esquema personal describe tablas relacionales para perfiles, ciclos, comidas planificadas y realizadas, movimientos de inventario, faltantes de comidas, peso, entrenamientos, preparación y listas de compra. La migración que añade faltantes y la corrección `20261017110000_fix_zero_quantity_meal_constraint.sql` constan como aplicadas en Supabase según el propietario el 17/10/2026. Esta última elimina la regla antigua `inventory_movements_check1`, que rechazaba el marcador idempotente meal con cantidad cero. El esquema se define en `supabase/migrations/`; la comprobación estructural y de permisos del estado existente está en `supabase/tests/`. El catálogo genérico no requiere una tabla por alimento o receta.

Las catorce tablas personales son `profiles`, `plan_cycles`, `planned_meals`, `meal_completions`, `meal_completion_ingredients`, `meal_completion_shortfalls`, `inventory_movements`, `weight_logs`, `training_logs`, `prep_tasks`, `shopping_sessions`, `shopping_session_items`, `user_settings` y `activity_sessions`. `profiles.profile_confirmed` es una marca booleana; no añade otra tabla. `meal_completion_ingredients` conserva una fila por ingrediente realmente usado y `meal_completion_shortfalls` conserva la parte no cubierta por las existencias. La tabla nueva y el RPC ampliado están definidos en `20261017100000_nonnegative_inventory_shortfalls.sql`; la corrección de movimientos de cantidad cero está en `20261017110000_fix_zero_quantity_meal_constraint.sql`. El propietario confirma que ambas se aplicaron en Supabase el 17/10/2026 y que el error de sincronización quedó corregido. `training_logs` y `profiles.training_bonus_kcal` quedan como tabla/campo heredados. La corrección HTTP 409 de la octava migración está aplicada y resuelta según confirmación del administrador del 17/10/2026. El propietario confirma que la novena (`20261013160000_recipe_proposal_inbox.sql`) ya se aplicó y creó `menuki_admins`, `recipe_proposals`, `recipe_proposal_ingredients` y `recipe_proposal_steps`. Supabase todavía no registra automáticamente el historial de esos archivos.

Las propuestas son ideas genéricas, no datos nutricionales ni recetas publicadas. `submit_recipe_proposal` recibe el tipo, el nombre, los ingredientes libres y los pasos como datos de transporte, valida los límites y los guarda en tres tablas relacionales dentro de una transacción. La clave de cliente hace idempotentes los reintentos. No se guardan cantidades, kcal o nutrientes estimados por el usuario.

El navegador consulta `is_menuki_admin()` al iniciar sesión. El administrador puede leer el buzón mediante RLS, corregir una propuesta mediante `update_recipe_proposal`, descartar una propuesta mediante `delete_recipe_proposal` y descargar el paquete JSON v1 definido en `docs/schemas/recipe-proposal-export.schema.json`. Las RPC de edición y borrado comprueban de nuevo el rol admin, bloquean la fila y comparan el contenido esperado con el actual para rechazar una acción sobre una copia desactualizada. Las cuentas normales solo pueden enviar propuestas; no pueden leer otras propuestas, descargar el buzón, modificar roles ni escribir directamente en sus tablas. `menuki_admins` no se expone al cliente. El propietario asigna el rol en SQL Editor después de que exista la cuenta de Auth. La web no contiene una contraseña administrativa ni una clave de escritura de GitHub.

El administrador descarga el paquete solo cuando actualiza el buzón. Codex recibe ese fichero en un chat con acceso al repositorio, consulta el esquema y los catálogos actuales, detecta posibles duplicados y prepara un diff revisable. La IA verifica los alimentos y su base nutricional, añade primero los alimentos nuevos a `data/foods.json`, completa la receta en `data/recipes.json` para una persona y no publica cambios por sí sola. El campo de formulario `snack` se asigna a `media` o `tarde` cuando se incorpora al catálogo actual. La descarga no modifica Supabase ni registra propuestas como procesadas.

`delete_recipe_proposal(id, expected)` elimina una sola propuesta con sus ingredientes y pasos en cascada; el navegador pide confirmación y no altera otras propuestas. La edición reemplaza el texto de la cabecera y las listas ordenadas de ingredientes y pasos en una transacción. Ambas funciones rechazan cambios si el contenido esperado ya no coincide con el servidor. `clear_recipe_proposals(expected_count)` sigue siendo una RPC aparte para limpiar todo el buzón después de publicar los catálogos; confirma el recuento y bloquea altas concurrentes. Supabase rechaza `DELETE` sin predicado, así que la migración correctiva `20261013180000_recipe_proposal_purge_where_clause.sql` usa `WHERE id IS NOT NULL`; como `id` es clave primaria, conserva la limpieza completa. La eliminación hace que PostgreSQL pueda reutilizar ese espacio; no garantiza que el tamaño total informado baje inmediatamente.

Cada ciclo generado registra la versión de catálogo usada. ADR-0008 define snapshots inmutables por ingrediente con cantidad y unidad de receta; ADR-0040 define faltantes separados y movimientos de consumo limitados al stock disponible. El saldo nunca es negativo y se reconstruye a partir de movimientos con IDs únicos; correcciones y reversos se registran como eventos nuevos.

Las tablas requieren Auth y aplican RLS. La política aceptada en ADR-0009 es correo + contraseña, registro libre y sin confirmación del correo. La sincronización del estado personal toma el propietario de `auth.uid()`, aplica cambios de forma transaccional y verifica `sync_revision`; su ejecución está concedida solo a `authenticated`. Las propuestas usan RPCs separadas y limitadas, porque son contenido compartido y no parte del estado personal. El propietario informa que aplicó las migraciones novena y décima; la migración undécima `20261013180000_recipe_proposal_purge_where_clause.sql` corrige la limpieza global y todavía debe aplicarse. La corrección HTTP 409 está confirmada por el administrador; las pruebas RLS con dos cuentas y del cliente publicado entre dispositivos siguen pendientes de validación documentada. Revisar el tamaño global y por tabla conforme se incorporen usuarios; al acercarse a 350 MB, estudiar el crecimiento. No purgar snapshots personales automáticamente.

## Migración y recuperación

- Supabase sincroniza la cuenta entre dispositivos cuando hay conexión. Al detectar una revisión nueva, el cliente carga el estado remoto y combina cualquier cambio local pendiente. Si una petición falla, la copia local se conserva y la interfaz permite reintentar. No hay cola offline.
- Mantener la lectura y migración de estados locales v5-v10, con v10 como estado actual. No se ofrecen importación ni restauración personal desde archivo; no se añaden migraciones v1-v4. Tratar el stock v5 como saldo de apertura y no sumar otra vez sobre él compras/comidas que ya estén reflejadas. Al actualizar v5, convertir las cantidades antiguas en gramos a unidades de inventario; al actualizar v6/v7, conservar movimientos y stock, y convertir los snapshots históricos de consumo a unidades de receta. Al migrar desde v8, separar del consumo realmente descontado cualquier faltante histórico y regularizar los saldos negativos sin borrar movimientos.
- La app no permite importar ni restaurar archivos JSON de estado personal. Los catálogos JSON del repositorio contienen datos genéricos y no deben incluir datos personales.

## Versiones y operación

- El estado personal actual es v10; las instalaciones existentes pueden migrar estados locales v5-v10. No implementar migraciones desde v1-v4 ni ofrecer restauración personal JSON.
- Los catálogos tienen versión propia (`catalogVersion`, actualmente `0.9.1`), independiente de la versión del estado personal. Incluyen 90 alimentos, 112 recetas y 543 referencias de ingredientes y se cargan desde JSON. `food.unit` expresa inventario/compra y `food.recipeUnit` la unidad de receta. El pan de molde usa rebanadas enteras, hasta dos por comida. `recoveryTags` son marcadores cualitativos para selección de menú, no valores medidos de micronutrientes. Las recetas no contienen claves ni fotografías de platos.
- La app requiere conexión y no mantiene cola offline. No afirmar que un cambio se guardó remotamente hasta que la función RPC responda con éxito.
- La vista de planificación permite proponer, editar, bloquear, regenerar y confirmar el menú del siguiente ciclo. La propuesta y el menú se sincronizan en `plan_cycles` y `planned_meals`.
- El historial de actividad describe sesiones ya realizadas; no es un calendario de previsiones ni un mecanismo de aprendizaje automático del perfil.
- En móvil, la barra inferior incluye Inicio, Menú, Compra y Más. Despensa, Recetas, Proponer receta y, para administradores, Revisar propuestas se agrupan bajo **Más**. Perfil, Aprende a usar Menuki, Actividad y peso y Cerrar sesión están en el menú superior de cuenta. La vista **Actividad y peso** muestra el historial al principio, con acciones de borrado etiquetadas y carga progresiva de sesiones.
- El uso sin coste depende de los límites vigentes de GitHub Pages y del proveedor de base de datos; verificar límites oficiales antes de integrar o prometer capacidad.

## Referencias de implementación

- [Requisitos del producto](product/requirements.md)
- [Especificación del planificador](planner/specification.md)
- [Decisiones registradas](decisions/)
- [Decisión de exportación de propuestas para Codex](decisions/0022-admin-recipe-proposal-export.md)
- [Decisión de edición y borrado individual de propuestas](decisions/0023-admin-recipe-proposal-review-actions.md)
- [Decisión de ajuste por actividad realizada](decisions/0005-actual-activity-session-nutrition.md)
- [Decisión de reutilización de ciclos y reversión automática de comidas](decisions/0027-cycle-date-reuse-and-meal-reversal.md)
- [Decisión de separar las unidades de receta e inventario](decisions/0006-recipe-and-inventory-units.md)
- [Decisión de conservar snapshots de ingredientes completados](decisions/0008-meal-completion-ingredient-snapshots.md)
- [Decisión de sincronizar el estado personal con Supabase](decisions/0010-supabase-relational-state-sync.md)
- [Decisión de simplificar sincronización y uso móvil](decisions/0012-mobile-shopping-and-sync-ui.md)
- [Decisión de modularizar el cliente y fijar la fecha civil de Menuki](decisions/0013-front-end-modules-and-madrid-dates.md)
- [Decisión sobre fuentes canónicas de datos](decisions/0014-canonical-data-sources.md)
- [Decisión de fijar Supabase JS y reforzar comprobaciones del cliente](decisions/0015-medium-priority-client-hardening.md)
- [Decisión de organizar CSS y retirar estilos inline de las plantillas](decisions/0016-css-sections-and-template-presentation.md)
- [Decisión de conciliación automática y acceso al historial de actividad](decisions/0017-automatic-reconciliation-and-activity-history.md)
- [Decisión de devolver conflictos de sincronización como HTTP 409](decisions/0020-postgrest-conflict-response-code.md)
- [Auditoría front-end y back-end](front-end-audit.md)
- [Preguntas abiertas](open-questions.md)
