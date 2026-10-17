# ADR-0008 — Guardar snapshots de ingredientes de comidas completadas

- Estado: Aceptada; retención indefinida sin purga automática. Migración aplicada en Supabase.
- Fecha: 2026-10-11
- Alcance: historial de comidas completadas y movimientos de despensa

## Contexto

`meal_completions` guarda el evento, la receta y la versión del catálogo, mientras que `inventory_movements` guarda cantidades consumidas en las unidades de inventario (`g`, `ml` o `ud`). Eso no conserva necesariamente el peso/volumen/piezas que la receta mostraba al registrarse. Por ejemplo, una receta puede consumir `250 g` de brócoli y descontar `0,63 ud` de la despensa.

Si cambia una receta o una etiqueta del catálogo, el historial debe poder mostrar las cantidades realmente registradas. Los movimientos de inventario deben seguir siendo la fuente del saldo y no deben convertirse ni volver a calcularse a partir del snapshot de receta.

## Decisión

- Añadir `meal_completion_ingredients`, con una fila por línea de ingrediente de cada comida completada.
- Guardar la referencia estable `food_id`, el nombre mostrado al registrar, el índice original de línea, la cantidad positiva realmente usada y la unidad de receta (`g`, `ml` o `ud`). El índice empieza en cero y permite conservar ingredientes repetidos del mismo alimento en líneas distintas.
- Relacionar cada línea con `meal_completions` mediante `(completion_id, user_id)`, con borrado en cascada si se elimina el evento padre. Cada usuario solo puede leer e insertar sus propias filas mediante RLS.
- Hacer los snapshots inmutables para el rol de la aplicación: sin permisos de UPDATE o DELETE. Revertir una comida modifica el evento y añade movimientos inversos; no elimina ni cambia las cantidades históricas.
- Conservar los snapshots sin caducidad temporal mientras exista la comida completada y la cuenta. No programar purgas por antigüedad. El borrado de una cuenta sigue eliminando sus datos relacionados en cascada.
- Vigilar manualmente el tamaño total y por tabla a medida que se incorporen usuarios. Revisar el crecimiento al alcanzar aproximadamente 350 MB del límite Free de 500 MB; ese umbral inicia una revisión, no un borrado automático.
- Mantener `inventory_movements` en unidades de inventario. La tabla de snapshots no es otra fuente de saldo.
- La decisión posterior ADR-0040 define que los movimientos de comida descuentan solo las existencias disponibles; los faltantes se conservan por separado y no se incorporan automáticamente a la compra.
- Crear el evento, las líneas de snapshot y los movimientos de inventario en una única operación transaccional e idempotente. La migración de sincronización implementa el guardado transaccional; eventos locales previos sin detalle de ingredientes permanecen sin cantidades inventadas.

## Consecuencias

- La migración aditiva `20261011100000_meal_completion_ingredient_snapshots.sql` crea la tabla, RLS y permisos mínimos. No modifica ni convierte las filas existentes.
- La migración es el cuarto archivo, después de `activity_sessions`; se aplicó al proyecto el 11 de octubre de 2026 y se verificaron tabla, RLS y permisos.
- La quinta migración `20261011120000_menuki_cloud_sync.sql` conecta esos snapshots con el cliente HTML mediante una transacción.
- Los registros completados antes de aplicar la migración no tendrán filas de ingredientes salvo que se planifique una importación histórica aparte.
