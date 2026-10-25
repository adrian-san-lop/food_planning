# ADR-0051 — Estado de cuenta confirmado por Supabase

- Fecha: 25 de octubre de 2026.
- Estado: aceptada por el propietario; implementada y probada localmente. Activación alojada pendiente.
- Sustituye el archivado por omisión de ADR-0050 y amplía ADR-0010, ADR-0014 y ADR-0017.

## Decisión

Una cuenta tiene un único estado confirmado en Supabase. Abrirla en otro dispositivo debe representar ese estado sin pedir elegir una copia, revisar el ciclo ni reconstruirlo con recetas actuales.

1. `get_menuki_state()` devuelve las filas personales y su revisión mediante una consulta SQL consistente y sin escrituras. Conserva almacenamiento relacional y RLS; JSON es el formato de transporte.
2. `apply_menuki_action` recibe únicamente campos o recursos modificados, revisión esperada y UUID de operación. Ejecuta las validaciones y movimientos existentes dentro de la misma transacción, devuelve el estado canónico y recuerda la operación mediante un hash y revisión. Un reintento tras perder la respuesta no repite el cambio.
3. La ausencia de un ciclo en una petición nunca significa archivarlo. Se requiere una transición explícita o una sustitución confirmada. Un cliente que no sabe mostrar una receta conserva sus filas remotas.
4. Se guardan versiones de las recetas usadas, ingredientes con datos alimentarios, cantidades de las 105 comidas y objetivos por fecha. La lectura utiliza esos resultados; no vuelve a generar ni ajustar el plan. Perfil, actividad o registro de comidas recalculan las cantidades pertinentes antes de confirmarlas transaccionalmente. Los cálculos siguen en los módulos de dominio compartidos del cliente; el servidor valida y persiste el resultado. No se introduce una segunda implementación nutricional SQL.
5. Los catálogos JSON siguen siendo la fuente editorial para nuevas propuestas. Una receta retirada puede permanecer en un plan confirmado. `data/recipe-history.json` recupera exclusivamente una receta antigua referenciada y sin snapshot; no la devuelve a la lista de propuestas. Los planes nuevos conservan sus propias recetas en Supabase.
6. El ciclo confirmado cuya fecha ya llegó es el ciclo efectivo calculado por la lectura del servidor, con su mismo ID. La lectura no modifica filas. La siguiente escritura asienta esa transición en su propia transacción, junto con el ámbito de compra; no se crea una instancia por dispositivo.
7. Durante el contrato 2, los datos personales y la base de conciliación viven en memoria de la sesión. El estado antiguo del navegador se conserva intacto para la transición. No se reimporta al abrir una cuenta ya migrada. El SDK conserva su propia sesión Auth. No hay cola offline ni exportación/restauración personal.
8. Las ediciones concurrentes en memoria se concilian automáticamente. Los valores aceptados remotamente ganan cuando se modifica el mismo dato; los cambios independientes se vuelven a enviar como una acción acotada. La interfaz preserva un formulario realmente editado, no una representación vieja del perfil.
9. Solo una respuesta aceptada puede producir mensajes de «Guardado». Ante un fallo se mantiene el borrador en la sesión y se ofrece reintento. Salir con cambios sin confirmar muestra la protección normal del navegador; cerrar sesión intenta guardar antes.

## Compatibilidad y despliegue

La migración anuncia `account_contract: 2` sin cambiar `planning_contract: 1`. Hasta aplicarla, el cliente conserva el transporte anterior y las migraciones locales v5–v12. La primera apertura del contrato 2 puede conciliar una vez cambios anteriores que tengan una base común conocida; una copia sin base no sustituye datos remotos. Se guarda únicamente una marca local de transición.

Después de la primera acción nueva de una cuenta, el escritor antiguo exige el contexto interno de `apply_menuki_action`. Un navegador antiguo debe actualizar la aplicación para escribir. Esto evita que invalide las cantidades confirmadas omitiendo sus tablas. El reinicio confirmado sigue pasando por `reset_menuki_state` dentro de la acción idempotente.

No se necesita cambiar de framework, servidor de alojamiento ni proyecto Supabase. La activación requiere ejecutar el SQL nuevo y publicar el cliente compatible. Instrucciones y límites de verificación: [contrato de cuenta](../backend/account-contract.md).
