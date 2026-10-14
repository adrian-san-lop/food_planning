# ADR-0027: Reutilizar ciclos archivados y revertir sus comidas al volver a la fecha

- Estado: aceptada
- Fecha: 2026-10-14

## Contexto

Cambiar la fecha de inicio a un ciclo usado podía crear otra instancia para las mismas fechas. Si se reutilizaba la instancia archivada sin más, sus comidas completadas volvían a aparecer marcadas y no se podía registrar de nuevo una comida de ese ciclo.

## Decisión

- Al seleccionar una fecha que corresponde a un ciclo archivado disponible, Menuki reactiva ese ciclo conservando su ID, menú y datos de preparación.
- Antes de activarlo, revierte de forma automática cada comida que aún conste como completada. La operación añade movimientos compensatorios a la despensa y no elimina la comida, su snapshot de ingredientes ni los movimientos originales.
- Las comidas reactivadas quedan pendientes y pueden registrarse otra vez. La nueva finalización usa un identificador de operación distinto.
- Se conservan los eventos ya revertidos en `reversedDone`; `sync_menuki_state` propaga `reversed_at` y los movimientos inversos de forma idempotente.
- Los ciclos que no estén en los seis archivos locales recientes pueden recuperarse desde el índice en memoria cargado de los ciclos archivados de la cuenta de Supabase. La cuenta queda aislada por `user_id` y el índice se sustituye al cargar una revisión remota.

## Consecuencias

- Volver a una fecha archivada repondrá el stock de las comidas que Menuki desmarque automáticamente. Esto es equivalente a desmarcar cada comida manualmente; no debe interpretarse como que los alimentos se hayan recuperado físicamente.
- El historial relacional permanece auditable: las finalizaciones y consumos originales se conservan y se enlazan con sus reversiones.
- Se reutilizan el ciclo y sus comidas planificadas cuando están disponibles, evitando insertar otra copia para esa fecha y menú.
- Si una comida se registra de nuevo después de reactivar el ciclo, el nuevo evento queda activo y el anterior permanece revertido.

## Implementación

La cliente identifica ciclos archivados de la propia cuenta, reutiliza su UUID, convierte sus finalizaciones en reversiones y las sincroniza con las tablas `meal_completions` e `inventory_movements`. No se necesita una migración de Supabase: el esquema ya admite `reversed_at` y movimientos compensatorios idempotentes.
