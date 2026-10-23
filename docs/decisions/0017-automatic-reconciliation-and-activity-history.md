# ADR-0017: Conciliación automática entre dispositivos y acceso al historial de actividad

- **Fecha:** 13 de octubre de 2026
- **Estado:** Aceptada e implementada en el cliente local; publicación y validación real pendientes
- **Alcance:** sincronización de estado personal, navegación móvil e historial de sesiones

## Contexto

La sincronización transaccional ya rechazaba escrituras con una revisión antigua, pero el cliente convertía ese control en una pantalla que pedía elegir entre la copia local y Supabase. Al pasar del móvil al ordenador, un usuario podía encontrarse con esa decisión aunque solo quisiera seguir usando la cuenta. Además, la página de seguimiento mezclaba actividad y peso, quedaba bajo **Más** en móvil y ofrecía un botón de borrado solo con icono.

## Decisiones

1. Consultar `user_settings.sync_revision` cada 15 segundos mientras la página está visible y al volver al foco, regresar a la pestaña o recuperar la conexión. Descargar el estado completo solo cuando cambie la revisión.
2. Ante una escritura con revisión obsoleta, leer el estado remoto más reciente y conciliarlo con la última base común y la copia local mediante `js/domain/state-reconciliation.js`. Combinar cambios independientes y eventos por identificador. Si ambos lados cambiaron el mismo valor, conservar el valor de la revisión que Supabase aceptó más recientemente. Reintentar la escritura con la nueva revisión; limitar los reintentos y mostrar el error habitual de sincronización si continúan las escrituras concurrentes.
3. No mostrar elecciones entre copias durante el cambio normal de dispositivo. Mantener `sync_revision`, la transacción RPC, RLS, `auth.uid()` e idempotencia existentes. No añadir colas offline, controles de sincronización manual ni notificaciones.
4. Mantener **Reiniciar todo** como acción separada con confirmación explícita. La restauración JSON que contemplaba esta decisión fue retirada por ADR-0029 y no forma parte de la interfaz vigente. Si Supabase avanzó desde la confirmación hasta el envío, actualizar la revisión y reintentar la acción ya confirmada mediante `reset_menuki_state`; no pedir una elección de copias.
5. La decisión inicial situó **Actividad** en la barra inferior móvil; ADR-0028 sustituye esta ubicación y la lleva al menú superior de cuenta como **Actividad y peso**. En la vista **Actividad y peso**, mostrar primero el historial, identificar el borrado de cada sesión con icono y texto «Eliminar sesión», y permitir cargar más de las 12 filas iniciales.

## Consecuencias

- Al usar Menuki en otro dispositivo con conexión, la app recoge cambios remotos automáticamente mientras permanece abierta o cuando vuelve a primer plano.
- Cambios locales independientes se conservan al reconciliarse con cambios remotos. Para cambios simultáneos sobre el mismo valor, la revisión remota aceptada más reciente determina el valor conservado.
- El borrado de una sesión continúa usando su ID estable y la lista `deleted_activity_ids` del RPC; no requiere cambios de esquema.
- El reinicio total puede reemplazar los datos personales porque el usuario confirma explícitamente esa acción. No forma parte del cambio normal de dispositivo; la restauración JSON ya no se ofrece (ADR-0029).
- Este cambio no modificó migraciones. El [paquete 7](../planner/package-7-integration.md) comprueba después HTTP 409, aislamiento personal con dos cuentas, recuperación/actualización automática en dos orígenes de navegador y el RPC de reinicio en cuentas de prueba. Quedan publicación y PC/móvil físicos, errores de red en esos dispositivos y el recorrido del reinicio confirmado desde la interfaz.

## Decisiones sustituidas

Esta ADR sustituye la elección explícita entre copias descrita en ADR-0010, ADR-0011, ADR-0012 y ADR-0014. El resto de esas decisiones sigue vigente.
