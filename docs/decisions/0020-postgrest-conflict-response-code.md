# ADR-0020: Devolver conflictos de sincronización como HTTP 409

- **Fecha:** 13 de octubre de 2026
- **Estado:** Aceptada; corrección aplicada y problema resuelto en Supabase según confirmación del administrador comunicada el 17/10/2026
- **Alcance:** arquitectura de sincronización

## Contexto

`sync_menuki_state` y `reset_menuki_state` señalaban una revisión obsoleta con SQLSTATE `40001`. PostgREST 14 interpreta ese estado como un fallo transitorio de serialización y puede reintentar la transacción RPC repetidamente. El resultado observado fue una avalancha de errores `SYNC_CONFLICT` en los logs. Supabase documenta este comportamiento y recomienda `PT409` para un conflicto HTTP 409 ([guía de diagnóstico](https://supabase.com/docs/guides/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b)). El conflicto de revisión es una condición de aplicación que el cliente ya sabe conciliar; no es un fallo transitorio de serialización de PostgreSQL.

## Decisión

- Devolver el conflicto de revisión con SQLSTATE `PT409` y conservar el mensaje `SYNC_CONFLICT`.
- Aplicar el cambio tanto a `sync_menuki_state` como a `reset_menuki_state`, sin cambiar la comprobación `sync_revision`, la transacción, RLS, `auth.uid()` ni la conciliación del cliente.
- El cliente reconoce `PT409` y el mensaje `SYNC_CONFLICT`; conserva también el código `40001` para respuestas antiguas.
- Usar una nueva migración que sustituye únicamente la excepción de conflicto en las definiciones instaladas de ambas funciones. La migración no cambia tablas ni filas y conserva el resto de la lógica desplegada.

## Consecuencias

- PostgREST responde con HTTP 409 en vez de tratar el conflicto de revisión como un error transitorio que debe reintentar.
- El cliente sigue leyendo la revisión remota, conciliando las copias y reintentando de forma limitada.
- La corrección de `20261013120000_menuki_sync_conflict_http_409.sql` consta como aplicada y resuelta según el administrador (confirmación comunicada el 17/10/2026). SQL Editor no registra automáticamente los archivos locales; no repetir su ejecución por un listado documental antiguo.
- El recuento de errores de Postgres no representa el tamaño de la base de datos. La medida de 27 MB comunicada el 13 de octubre de 2026 queda por debajo del umbral interno de revisión de 350 MB.

## Estado y validación

El administrador confirma que el problema de conflictos HTTP 409 está resuelto en Supabase. Se registra esta confirmación sin atribuirle una verificación independiente de logs o del proyecto remoto. La prueba completa de conciliación desde el cliente publicado y entre dispositivos continúa pendiente de validación documentada.
