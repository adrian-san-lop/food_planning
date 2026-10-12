# Arquitectura

Estado de referencia: 13 de octubre de 2026. El esquema y el cliente de sincronización están implementados. Las etapas de prioridad alta, media y baja de la modularización están implementadas; quedan pendientes la validación de los recorridos publicados y la prueba RLS con dos cuentas.

## Arquitectura actual

```text
Navegador
  └── GitHub Pages / HTML estático
        ├── index.html (redirección relativa)
        ├── menuki.html (shell HTML)
        ├── assets/
        │     └── css/app.css (estilos)
        ├── js/
        │     ├── main.js (entrada ES; UI y orquestación restante)
        │     ├── ui/html.js (escape HTML y validación de URL por origen permitido)
        │     ├── domain/dates.js (fecha civil Europe/Madrid)
        │     ├── domain/inventory-units.js (conversiones de unidades)
        │     ├── data/catalogs.js (carga y validación de JSON)
        │     ├── persistence/local-state.js (copia de trabajo local)
        │     └── persistence/supabase-transport.js (lecturas y RPC)
        └── data/*.json + esquemas JSON
              └── carga desde el módulo de catálogos

Supabase Auth + PostgreSQL con RLS (servicio externo)
```

El cliente de Supabase se carga desde jsDelivr con la versión exacta `@supabase/supabase-js@2.117.3`. Las pruebas automatizadas usan Node integrado; no añaden una dependencia de ejecución a la web publicada.

- `index.html` está en la raíz de publicación de GitHub Pages y redirige de forma relativa al shell `menuki.html`, también en la raíz. El shell carga CSS y JavaScript mediante rutas relativas.
- La primera etapa reunió en una hoja los estilos de los ocho bloques `<style>` y convirtió el bloque de aplicación en un módulo ES. `assets/css/app.css` organiza base, shell, controles y vistas, y concentra las reglas responsive al final. Las plantillas de `main.js` ya no generan atributos `style`; los indicadores usan `<progress>` y la portada coloca su foto mediante un `<img>`. Vistas, gran parte del dominio y la orquestación de Auth/sincronización siguen en `main.js`.
- Menuki guarda las fechas civiles como `YYYY-MM-DD`. `today()` resuelve el instante en `Europe/Madrid`; los objetos `Date` que se usan para operar con días representan medianoche UTC y solo son portadores de fecha. Los timestamps siguen siendo instantes ISO y se presentan en la zona de Madrid.
- `js/data/catalogs.js` carga los catálogos JSON de la misma publicación, valida su estructura y correspondencia entre unidades e ingredientes, y los adapta al modelo interno de la app.
- `js/ui/html.js` centraliza la codificación de texto y atributos y solo permite URL HTTPS de orígenes indicados explícitamente. Las vistas todavía usan plantillas HTML, pero escapan los valores variables del catálogo y del estado personal antes de insertarlos.
- Los indicadores de comidas completadas usan elementos `<progress>` con etiquetas accesibles en sus botones; el color y la disposición se definen en CSS.
- `npm test` ejecuta pruebas integradas para fechas, conversiones, validación de catálogos y codificación HTML/URL. Las pruebas de navegador con Auth, sincronización y RLS requieren cuentas y publicación y siguen pendientes.
- El menú fijo de 105 espacios sigue siendo el primer ciclo. La propuesta siguiente puede revisarse, guardarse y activarse en su fecha.
- En la primera visita, una guía breve recomienda revisar el perfil antes de confiar en objetivos calculados con valores de ejemplo. La marca se guarda localmente y en `profiles.profile_confirmed`.
- Cuando la copia local y Supabase divergen, la interfaz muestra el estado del perfil, el inicio del menú, comidas realizadas, movimientos de despensa, pesos, sesiones, artículos de compra y fechas de actualización. Explica que usar Supabase reemplaza la copia local pendiente; subir la local reemplaza perfil, menú y compra remotos e integra los registros por identificador. No elige ni reemplaza datos en silencio.
- Las comidas de fechas futuras se muestran como planificadas y no se pueden registrar como consumidas antes de que llegue ese día.
- `data/foods.json` y `data/recipes.json` son la fuente canónica de los catálogos genéricos. `js/data/catalogs.js` valida esos ficheros y deriva las estructuras en memoria que necesita la interfaz.
- Para datos personales, Supabase es la fuente canónica remota de una cuenta y `localStorage` es su copia de trabajo en el navegador. Los cambios se sincronizan automáticamente; el indicador muestra si están guardados, pendientes o en conflicto. La acción de reintento solo aparece tras un error.
- Los alimentos separan medida de receta (`recipeUnit`) y medida de inventario (`unit`). Frutas y verduras enteras se pesan en gramos en recetas y se cuentan por piezas en despensa y compra; una conversión por peso comestible aproximado conecta ambas.
- Las sesiones se registran después de realizarse. Su energía neta estimada se aplica solo a la fecha de la sesión y a comidas aún pendientes; no cambia días futuros ni cantidades ya registradas.
- Supabase conserva identidad en `auth.users` y los datos personales en sus tablas relacionales con RLS. El perfil se guarda en `profiles`; las credenciales no se copian a tablas públicas.
- La migración `20261011120000_menuki_cloud_sync.sql` añade la operación transaccional e idempotente de sincronización, control de revisión para evitar sobrescribir cambios recientes y metadatos de ciclos/sesiones. La migración `20261011150000_profile_confirmation.sql` añade la confirmación del perfil y actualiza la sincronización para guardarla sin borrar una confirmación al recibir clientes antiguos. No se almacena el estado completo como JSON en una columna.
- Reiniciar toda la cuenta o restaurar una copia JSON requiere una confirmación específica y usa `reset_menuki_state`, que reemplaza las filas propias en la misma transacción; la sincronización habitual no borra el historial.
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
| Gustos/restricciones | No hay sistema general implementado | Preferencias por persona fuera del catálogo; modelo pendiente |

No colocar datos personales o copias de seguridad en GitHub. Aunque un repositorio sea privado, GitHub Pages publica el sitio. Las tablas personales usan RLS; la clave pública del proyecto puede aparecer en el navegador, pero una clave `service_role` o cualquier otro secreto nunca debe incluirse ahí.

## Esquema remoto y conexión del HTML

El proyecto tiene tablas relacionales para perfiles, ciclos, comidas planificadas y realizadas, movimientos de inventario, peso, entrenamientos, preparación y listas de compra. El esquema se define en `supabase/migrations/`; la comprobación estructural y de permisos está en `supabase/tests/`. El catálogo genérico no requiere una tabla por alimento o receta.

Las trece tablas aplicadas son `profiles`, `plan_cycles`, `planned_meals`, `meal_completions`, `meal_completion_ingredients`, `inventory_movements`, `weight_logs`, `training_logs`, `prep_tasks`, `shopping_sessions`, `shopping_session_items`, `user_settings` y `activity_sessions`. `profiles.profile_confirmed` es una marca booleana; no añade otra tabla. `meal_completion_ingredients` conserva una fila por ingrediente realmente usado, sin caducidad temporal ni purga programada. `training_logs` y `profiles.training_bonus_kcal` quedan como tabla/campo heredados y no se usarán para el nuevo cálculo. Las siete migraciones están aplicadas desde SQL Editor; Supabase todavía no registra automáticamente el historial de esos archivos.

Cada ciclo futuro debería registrar la versión de catálogo usada. La decisión ADR-0008 define snapshots inmutables por ingrediente con cantidad y unidad de receta, mientras que los movimientos del inventario conservan las cantidades en unidades de inventario. El inventario debería poder reconstruirse a partir de movimientos con IDs únicos; las correcciones y reversos se registran como eventos nuevos.

Las tablas requieren Auth y aplican RLS por `auth.uid()`. La política aceptada en ADR-0009 es correo + contraseña, registro libre y sin confirmación del correo. El HTML ya integra Auth y sincronización relacional. La función `SECURITY DEFINER` toma el propietario de `auth.uid()`, aplica la sincronización de forma transaccional y verifica `sync_revision`; su ejecución está concedida solo a `authenticated`. La prueba de aislamiento con dos cuentas y la comprobación de PC/móvil siguen pendientes. La séptima migración está aplicada; publica el HTML actualizado antes de comprobar el recorrido en GitHub Pages. Revisar el tamaño global y por tabla conforme se incorporen usuarios; al acercarse a 350 MB, estudiar el crecimiento. No purgar snapshots automáticamente.

## Migración y recuperación

- Supabase sincroniza la cuenta entre dispositivos cuando se inicia sesión y hay conexión. Si una petición falla, la copia local se conserva y la interfaz permite reintentar. Los conflictos entre copias requieren una elección explícita.
- Aceptar v5 como primer archivo importable y v8 como estado actual; admitir v5-v8, sin importar v1-v4. Tratar el stock v5 como saldo de apertura y no sumar otra vez sobre él compras/comidas que ya estén reflejadas. Al actualizar v5, convertir las cantidades antiguas en gramos a unidades de inventario; al actualizar v6/v7, conservar movimientos y stock, y convertir los snapshots históricos de consumo a unidades de receta.
- La restauración de JSON personales es distinta de los catálogos de GitHub. No subir datos personales al repositorio.

## Versiones y operación

- El estado personal actual es v8; v5 es el primer formato de importación admitido. Se aceptan v5-v8; no implementar migraciones desde v1-v4.
- Los catálogos tienen versión propia (`catalogVersion`, actualmente `0.5.0`), independiente de la versión del estado personal. Incluyen 83 alimentos y 107 recetas y se cargan desde JSON. `food.unit` expresa inventario/compra y `food.recipeUnit` la unidad de receta. `recoveryTags` son marcadores cualitativos para selección de menú, no valores medidos de micronutrientes.
- La app requiere conexión y no mantiene cola offline. No afirmar que un cambio se guardó remotamente hasta que la función RPC responda con éxito.
- La vista de planificación permite proponer, editar, bloquear, regenerar y confirmar el menú del siguiente ciclo. La propuesta y el menú se sincronizan en `plan_cycles` y `planned_meals`.
- El historial de actividad describe sesiones ya realizadas; no es un calendario de previsiones ni un mecanismo de aprendizaje automático del perfil.
- En móvil, la navegación principal incluye Inicio, Menú, Compra y Despensa; Perfil, Peso, Recetas y Guía se agrupan bajo **Más**. La compra ofrece búsqueda y un resumen fijo con acceso a finalizar.
- El uso sin coste depende de los límites vigentes de GitHub Pages y del proveedor de base de datos; verificar límites oficiales antes de integrar o prometer capacidad.

## Referencias de implementación

- [Requisitos del producto](product/requirements.md)
- [Especificación del planificador](planner/specification.md)
- [Decisiones registradas](decisions/)
- [Decisión de ajuste por actividad realizada](decisions/0005-actual-activity-session-nutrition.md)
- [Decisión de separar las unidades de receta e inventario](decisions/0006-recipe-and-inventory-units.md)
- [Decisión de conservar snapshots de ingredientes completados](decisions/0008-meal-completion-ingredient-snapshots.md)
- [Decisión de sincronizar el estado personal con Supabase](decisions/0010-supabase-relational-state-sync.md)
- [Decisión de simplificar sincronización y uso móvil](decisions/0012-mobile-shopping-and-sync-ui.md)
- [Decisión de modularizar el cliente y fijar la fecha civil de Menuki](decisions/0013-front-end-modules-and-madrid-dates.md)
- [Decisión sobre fuentes canónicas de datos](decisions/0014-canonical-data-sources.md)
- [Decisión de fijar Supabase JS y reforzar comprobaciones del cliente](decisions/0015-medium-priority-client-hardening.md)
- [Decisión de organizar CSS y retirar estilos inline de las plantillas](decisions/0016-css-sections-and-template-presentation.md)
- [Auditoría front-end y back-end](front-end-audit.md)
- [Preguntas abiertas](open-questions.md)
