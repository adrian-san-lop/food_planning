# ADR-0040: mantener la despensa no negativa y separar los faltantes (histórica)

- Estado: Supersedida parcialmente por [ADR-0043](0043-record-full-meal-consumption-without-shortfall-history.md) el 18/10/2026. La regla de saldo no negativo y la reversión de lo descontado siguen vigentes; el almacenamiento y la presentación de faltantes quedan retirados. La migración de limpieza de Supabase está pendiente.
- Fecha: 2026-10-17
- Alcance: registro de comidas, despensa, compras, reversos y sincronización relacional.
- Sustituye la regla de permitir saldos negativos descrita en la guía de inventario.

## Contexto

La despensa representa existencias físicas. Un consumo mayor que el saldo anotado puede significar que el saldo o la porción estaban mal medidos, pero no que Menuki deba conservar una cantidad física negativa ni arrastrar esa diferencia a la compra siguiente.

## Decisión

- Conservar en el snapshot de la comida todo el uso de receta realmente registrado.
- Descontar de `inventory_movements` como máximo la existencia disponible; el saldo de despensa nunca baja de cero.
- Guardar la diferencia en `meal_completion_shortfalls`, en unidades de inventario, ligada a la comida completada. Es un registro informativo y no forma parte del saldo ni de las cantidades calculadas por Compra.
- Desmarcar una comida repone solo lo que se descontó originalmente. El faltante histórico de esa comida deja de contarse como activo al revertirla; los registros remotos permanecen para conservar la trazabilidad.
- Rechazar cantidades negativas en la edición manual de Despensa y limitar a cero las previsiones de stock del próximo ciclo.
- Migrar los estados locales compatibles desde v5, incluida la versión actual v10. Para los saldos históricos negativos, conservar los movimientos originales y añadir un ajuste de apertura determinista que deja el saldo disponible en cero; ajustar también el importe que un reverso futuro devuelve.
- En Supabase, copiar los faltantes históricos de `inventory_movements.shortfall_quantity`, regularizar una sola vez los saldos negativos y guardar faltantes nuevos en la tabla relacional mediante `sync_menuki_state`.
- Si no había stock, conservar el movimiento de comida con cantidad cero como marcador idempotente; no modifica el saldo y evita que un reintento posterior vuelva a consumir existencias.

## Consecuencias

- El historial distingue el consumo de receta, la salida física disponible y la cantidad que no estaba anotada en Despensa.
- La compra se calcula con las existencias no negativas y los menús pendientes del período elegido; los faltantes de comidas anteriores no se convierten por sí solos en una reposición.
- La definición remota confirmó que `inventory_movements_check1` aún exigía `quantity < 0` para cada movimiento meal; la primera migración había intentado eliminar `inventory_movements_check`, otro nombre. El propietario confirma que aplicó `20261017110000_fix_zero_quantity_meal_constraint.sql` y corrigió el error. La reparación conserva la regla `inventory_movements_check2` de referencias de reverso y reemplaza la regla de faltantes por una restricción nombrada. Esta aplicación es una confirmación del propietario, no una inspección independiente de Supabase.
- Los reintentos siguen siendo idempotentes por los identificadores de operaciones y la inserción transaccional de snapshots, faltantes y movimientos.
