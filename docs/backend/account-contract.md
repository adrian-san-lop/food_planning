# Cuenta canónica y sincronización entre dispositivos

Estado: implementación local en `dev`, 25/10/2026. La migración alojada no consta aplicada. [ADR-0051](../decisions/0051-server-authoritative-account-state.md).

## Activación en Supabase

1. Publicar el cliente de esta entrega cuando el propietario autorice el commit y publicación. Es compatible con el esquema previo mientras la migración siga pendiente. GitHub Pages publica `dev`; editar el checkout local no publica sus archivos.
2. En **Supabase → SQL Editor**, ejecutar **todo** [20261025120000_server_authoritative_accounts.sql](../../supabase/migrations/20261025120000_server_authoritative_accounts.sql). Esperado: **Success**. La migración crea cinco tablas, amplía ajustes y define los RPC completos; no vacía cuentas ni inventario. No ejecutar de nuevo las migraciones anteriores después de esta, porque volverían a definir escritores antiguos.
3. Ejecutar [account_authority.sql](../../supabase/diagnostics/account_authority.sql). Debe devolver **ocho filas con `ready = true`**. Son comprobaciones estructurales de solo lectura; no alteran una cuenta ni sustituyen una prueba funcional.
4. Recargar Menuki en ambos dispositivos. La primera edición confirmada marca esa cuenta con contrato 2. Los navegadores que todavía ejecuten código anterior deben recargar la aplicación para guardar.

Los archivos SQL del repositorio no se aplican automáticamente en Supabase. La clave pública del cliente no puede ejecutar esta migración; se requiere el acceso de propietario al SQL Editor. Al documentar su aplicación, distinguir la confirmación del propietario de una inspección independiente.

## Lectura

`get_menuki_state()` selecciona perfil, configuración, ciclos, comidas, movimientos, seguimiento, compra y snapshots mediante una única consulta SQL y devuelve la revisión correspondiente. Todos los filtros se vinculan a `auth.uid()`. Se conservan tablas relacionales; no existe una columna con toda la cuenta como JSON.

El cliente carga los datos al abrir la cuenta, al volver a la página y al recuperar la conexión. Consulta la revisión cada 15 segundos mientras está visible. Una actualización forzada también lee el estado cuando la revisión no cambió, porque el cambio de fecha puede hacer efectivo un sucesor ya confirmado. No hay avisos push ni sincronización manual ordinaria.

Un sucesor cuya fecha llegó se devuelve como activo, con el mismo ID, y su predecesor como archivado en la proyección de lectura. No hay escritura al abrir. En la siguiente acción, el servidor asienta esa transición y mueve el carrito correspondiente en la misma transacción. Los extras conservan identidades distintas; el historial de sesiones de compra completadas no se modifica.

## Acciones y confirmación

`createAccountAction` compara el estado deseado con la base canónica de memoria. Envía solo campos de perfil, preferencias, registros o artículos modificados. Un ciclo editado es una unidad de 105 posiciones completas. La sustitución/retirada de ciclos es explícita; la omisión de un ciclo ilegible no lo archiva.

`apply_menuki_action(p_action, p_expected_revision, p_operation_id)` bloquea la revisión propia, rechaza escrituras obsoletas, combina parches con los campos que conserva el servidor y llama a los escritores transaccionales existentes. Las compras, consumos y reversos siguen sujetos a los triggers de inventario y sus identificadores. El UUID y el hash de la acción permiten repetir la petición exacta cuando se perdió su respuesta. Reutilizarlo para otra petición se rechaza.

La respuesta contiene el estado confirmado, incluidas las deducciones reales de despensa. El navegador lo adopta; si hubo otra edición mientras esperaba, conserva solamente esa edición pendiente. Los conflictos de dos dispositivos usan la base de sesión: gana Supabase sobre el mismo valor y se conservan cambios independientes. No se muestra una elección de copias.

El estado compacto distingue guardado pendiente, confirmado y error. Los mensajes de éxito personal esperan la confirmación. Un fallo conserva los cambios únicamente en la sesión abierta; cerrar o recargar no equivale a guardarlos. La protección del navegador avisa si se intenta salir mientras siguen pendientes. No hay cola offline persistida.

## Recetas y raciones reproducibles

| Tabla nueva | Contenido |
| --- | --- |
| `plan_recipe_snapshots` | Receta usada por un ciclo: ID, nombre, tipo, tiempo, descripción, consejo y pasos ordenados. |
| `plan_recipe_ingredients` | Ingrediente, cantidad base, unidad y snapshot genérico del alimento: nutrición, conversión, política de ración y compra. |
| `planned_meal_portions` | Cantidad efectiva de cada ingrediente en cada comida planificada. |
| `plan_day_targets` | Objetivo por fecha, versión del cálculo y firmas de sus entradas. |
| `menuki_account_operations` | Metadatos internos de idempotencia: cuenta, UUID, hash y revisión aceptada. No guarda el cuerpo de la acción. |

Todas tienen RLS. Las cuatro primeras permiten lectura propia; ninguna permite escrituras directas del navegador. La tabla de operaciones tampoco permite lectura directa. Las claves compuestas impiden adjuntar snapshots a ciclos/comidas de otra cuenta.

El catálogo actual sigue decidiendo qué recetas se pueden proponer. Los snapshots permiten mostrar un plan aunque se retire una receta o cambie el catálogo publicado. `data/recipe-history.json` contiene la versión previa de `hamburguesa_pavo`, recuperada del commit anterior a su retirada; se consulta solo si una cuenta referencia ese ID y no tiene snapshot. No se propone en nuevos menús y no cambia las 111 recetas del catálogo.

Las cuentas antiguas sin snapshots conservan sus filas y pueden mostrarse con el catálogo/histórico disponible. Los snapshots se materializan en una edición posterior; abrir la cuenta no crea ni modifica el ciclo. Si una referencia no es recuperable, se conserva la cuenta y se limita el cálculo de ese menú, sin inventar posiciones ni archivarlo. Esta protección no repara una corrupción administrativa arbitraria de los datos.

Las reglas nutricionales y de inventario no cambian. Los días pasados y las cantidades completadas se conservan al cambiar el perfil; una sesión anotada para otra fecha ajusta solo sus comidas pendientes. Las cantidades completadas también se protegen en el servidor. Las propuestas y la revisión pueden usar los snapshots guardados. Los cambios explícitos se calculan en los módulos JS existentes y el resultado se valida y guarda; no se ha trasladado el generador a una Edge Function.

## Copia anterior y transición

El contrato 2 mantiene el estado personal y su base completa en memoria. No actualiza la copia personal ni las huellas antiguas de `localStorage`; la sesión Auth del SDK conserva su almacenamiento. Una marca por cuenta evita reimportar repetidamente datos anteriores. Las migraciones locales v5–v12 siguen disponibles para instalaciones anteriores y la transición.

En la primera apertura puede aplicarse una sola conciliación de cambios pendientes antiguos cuando existe una base conocida. Si la copia es corrupta o no hay base, la lectura de Supabase continúa y los bytes antiguos permanecen intactos; no sustituyen la cuenta remota. La inicialización de cuentas realmente nuevas sigue usando el recorrido guiado sin perfil ni menú de ejemplo.

## Verificación local

- `npm test`: **228 pruebas pasan**. Incluyen cantidades guardadas, cambios de objetivo, actividad por fecha, acciones acotadas, lectura RPC, transición local y coordinación real de guardados, errores y respuestas de otras cuentas.
- `npm run test:sql`: batería previa de 18 comprobaciones PostgreSQL.
- `npm run test:sql:accounts`: **21 comprobaciones pasan**, con dos identidades y dos clientes independientes que usan transporte, mapeador y normalizador reales. Incluye las ocho verificaciones del diagnóstico, distinto catálogo entre clientes, consumo sin stock suficiente, reintento idempotente, reversión, cantidades completadas, sucesor por fecha sin alterar compras completadas, RLS y reinicio.

En el navegador integrado, una página HTTP aislada en `127.0.0.1:8872` usa el shell, módulos y catálogos reales con Auth/RPC simulados y datos sintéticos. Carga la cuenta; guardar edad muestra primero «Guardando cambios…» y después la confirmación, conserva el valor y deshabilita Guardar sin «Cambios sin guardar». Cambiar a ganar músculo guarda el objetivo, adapta las comidas pendientes y permite abrir Menú 3 semanas sin errores de consola. No se usa la sesión personal ni se envían datos a Supabase desde esta prueba.

Las bases son PGlite temporales y no usan cuentas ni datos de Supabase. Herramienta de pruebas: `npm install --prefix ./tmp/pglite-runtime --no-save --no-package-lock @electric-sql/pglite@0.5.11`. El directorio y los logs temporales no forman parte de la publicación. Los resultados locales no acreditan aplicación alojada, Supabase Auth/PostgREST ni un teléfono físico.
