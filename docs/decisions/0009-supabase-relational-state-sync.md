# ADR-0009 — Sincronizar el estado personal con Supabase

- Estado: Aceptada e implementada en el repositorio; migración aplicada el 11 de octubre de 2026
- Alcance: persistencia remota del perfil y del uso personal de Menuki

## Decisión

- Asociar cada fila personal con `auth.users.id` mediante `user_id`; las credenciales siguen exclusivamente en Supabase Auth. No duplicar contraseña ni correo en `public.profiles`.
- Guardar el perfil en `profiles`; los ciclos y huecos de menú en `plan_cycles` y `planned_meals`; las comidas registradas y sus ingredientes en `meal_completions` y `meal_completion_ingredients`; los saldos derivados en `inventory_movements`; y el resto de registros en sus tablas existentes (`weight_logs`, `activity_sessions`, `prep_tasks`, `shopping_sessions` y `shopping_session_items`).
- Mantener foods.json y recipes.json como catálogos genéricos públicos. El cuerpo JSON enviado al procedimiento es solo el formato de transporte; la base de datos no guarda un objeto completo de estado en una columna.
- Importar una sola vez el estado v8 del navegador a una cuenta sin registros remotos. No reemplazar filas remotas que ya existan si falta la marca de importación inicial.
- Sincronizar los cambios confirmados desde la sesión autenticada mediante `sync_menuki_state(jsonb, bigint)`, que valida el propietario con `auth.uid()`, aplica los cambios en una transacción y usa `sync_revision` para rechazar escrituras de una copia desactualizada.
- Conservar localStorage como copia de trabajo y recuperación ante errores. No mantener una cola offline. La interfaz solo declara una sincronización correcta tras recibir confirmación de Supabase; los conflictos conservan la copia local y permiten elegir la versión.
- Hacer que “Reiniciar todo” y restaurar una copia JSON soliciten confirmación y reemplacen el estado remoto en una transacción separada; las sincronizaciones ordinarias nunca purgan el historial.
- RLS sigue limitando las tablas personales al usuario autenticado. La clave pública puede estar en el cliente; nunca usar una clave `service_role` en GitHub Pages.

## Consecuencias

- Un mismo usuario puede abrir sus datos desde distintos dispositivos con conexión e iniciar sesión en cada uno. No se resuelven automáticamente escrituras simultáneas: la revisión detecta el conflicto y bloquea la escritura desactualizada.
- La primera sincronización importa el estado local del dispositivo donde ya se usaba la app. En otros dispositivos, una cuenta inicializada carga la copia remota.
- Cada comida conserva un evento idempotente, sus cantidades disponibles como snapshots de receta y los movimientos de inventario enlazados. Los eventos de inventario existentes no se borran al sincronizar.
- Se añaden columnas de inicialización/revisión a `user_settings`, metadata de recuperación a `plan_cycles` y `client_id` en `activity_sessions`; no se añade una tabla de estado JSON.
- `reset_menuki_state` queda limitado a la cuenta autenticada y verifica la misma revisión antes de borrar y volver a escribir.
- La prueba de aislamiento con dos cuentas y el recorrido real de sincronización en móvil/PC siguen pendientes de ejecutar. La migración se aplicó en Supabase; la versión del HTML aún debe publicarse para activar el flujo en GitHub Pages.

## Referencias

- Migración: `supabase/migrations/20261011120000_menuki_cloud_sync.sql`.
- Reinicio/restauración: `supabase/migrations/20261011130000_menuki_cloud_reset.sql`.
- Modelo relacional: `docs/supabase_db_model.md`.
- Acceso: [ADR-0008](0008-email-password-auth.md).
