# Paquete 7: integración real y preparación de publicación

- Fecha: 23/10/2026.
- Estado: **Integración comprobada; publicación pendiente de autorización.** Se continúa en `chore/guided-first-setup`, junto al paquete 6, por indicación del propietario. No se ha hecho commit, push ni publicación.
- Alcance: [plan integrado](implementation-plan.md), [paquete 6](package-6-guided-first-setup.md) y [ADR-0047](../decisions/0047-guided-first-use-and-personalized-planning.md).

## Correcciones del cliente

1. Una conciliación después de HTTP 409 actualiza también la pantalla visible. El progreso o primer menú confirmado en otra sesión ya no deja una vista anterior en pantalla. Una confirmación ordinaria de guardado conserva el formulario que se está editando.
2. Las lecturas, detección de capacidades, preparación y envío de snapshots quedan vinculados a la cuenta que inició la operación. Si cambia la sesión, se descartan las respuestas anteriores antes de reconocer datos o modificar la revisión y copia de trabajo de la nueva cuenta. Se programa el guardado pendiente de esta última cuando corresponde.

Se modifican `js/persistence/supabase-transport.js` y la coordinación de sincronización de `js/main.js`; `menuki.html` renueva la referencia de carga. No cambia el contrato v12, los catálogos ni las fórmulas nutricionales. Las regresiones nuevas están en `tests/sync-orchestration.test.js` y `tests/supabase-transport.test.js`.

## Comprobación alojada

El propietario autorizó crear dos cuentas dedicadas a esta prueba. Se utilizó el proyecto configurado `vkcedxvnmbmrmwvanznx` con su clave pública y sesiones normales de Supabase Auth, sin permisos administrativos ni acceso a cuentas personales. El registro automático no enviaba correos de confirmación. Cada cuenta lleva la etiqueta privada de la ejecución.

**14 comprobaciones reales correctas** mediante Auth, PostgREST y los RPC de la aplicación:

- Dos identidades distintas y capacidad `planning_contract: 1`.
- Acceso anónimo bloqueado a datos personales y RPC.
- Borrador parcial, favorita y tiempo opcional recuperables sin perfil de ejemplo ni ciclo automático.
- Reanudación desde una segunda sesión de contraseña de la misma cuenta.
- HTTP 409 / PT409 ante revisión obsoleta, sin alterar el estado aceptado.
- Perfil inválido rechazado y cambios parciales revertidos en la misma transacción.
- Primer plan rechazado sin perfil confirmado.
- Primera confirmación y reintento con un ciclo activo y 105 comidas; rechazo de un plan incompleto.
- Guardado y lectura de los seis niveles de movimiento actuales.
- Normal y NULL retiran una preferencia concreta y un límite de tiempo.
- Lecturas entre propietarios sin exposición en las 16 tablas personales activas; escritura directa rechazada en las siete tablas protegidas por el contrato de planificación, también para el propio propietario.
- Identidad falsificada rechazada por RPC y progreso de la segunda cuenta ligado a `auth.uid()`.
- Compra de 50 g, consumo de 250 g y otro consumo sin stock: saldo cero, snapshot completo y reverso de solo 50 g, sin duplicados al reintentar.
- Cero filas de faltantes tras esos consumos, con lectura HTTP 200 de la tabla heredada.

Los resultados sanitizados, incluida la incidencia inicial y la repetición correcta, están en [la evidencia de integración](validation/package-7-20261023.json). No contienen contraseñas ni tokens. La ejecución optativa y sus precauciones se explican en [tests/live](../../tests/live/README.md); no forma parte de `npm test`.

## Navegador real

Se sirvió el código estático sin sustituir Auth ni el arranque, en dos orígenes locales independientes: `127.0.0.1:8767` y `127.0.0.1:8768`. Ambos usaron la cuenta A y el Supabase real, con copias de trabajo distintas.

Se comprobó formulario vacío, guardado de edad parcial, recuperación en la segunda sesión, confirmación del perfil, avance automático de la primera sesión, omisión de preferencias, generación y revisión del primer menú, favorita desde su ficha, Empezar mi plan y recarga sin repetir configuración. La confirmación produjo un único ciclo activo con 105 comidas. El borrador previo queda como ciclo `superseded`; no es otro plan activo.

Con la despensa vacía se registró un desayuno: cinco ingredientes completos, cinco marcadores de consumo de cantidad cero y ningún faltante. La primera sesión actualizó automáticamente la comida registrada; ambas mostraron Sincronizado con Supabase. La consola de la segunda sesión no mostró avisos ni errores. Se retiraron las copias locales y sesiones de los dos orígenes y se cerraron las pestañas de prueba.

Son dos sesiones con almacenamiento independiente en el navegador integrado, **no dos dispositivos físicos ni una validación de Firefox/Edge o del cliente publicado**. La compatibilidad antigua y los tamaños de pantalla conservan las pruebas locales de paquetes anteriores.

Tras completar las protecciones de cambio de cuenta se repitió el acceso con la cuenta B: Sincronizado con Supabase, Paso 1 y edad/altura/peso vacíos, sin avisos ni errores de consola. Se retiró también esa copia local.

## Retirada de faltantes: incidencia y resolución

La primera batería encontró dos filas nuevas en `meal_completion_shortfalls`, pertenecientes exclusivamente a la cuenta de prueba. Se separó este resultado de la confirmación estructural comunicada el 22/10/2026: el comportamiento alojado de esa primera ejecución no cumplía ADR-0043. No se deduce desde la clave pública qué definición o cambio remoto produjo la discrepancia.

El propietario volvió a ejecutar `supabase/migrations/20261018120000_retire_meal_shortfalls.sql` y respondió **Success** el 23/10/2026. Después se repitieron el consumo desde la interfaz y la batería de RPC: en ambos casos la tabla siguió vacía para la cuenta de prueba. Queda verificada funcionalmente la supresión de nuevas escrituras, además de la confirmación de aplicación. No se ha aplicado SQL alojado desde el agente ni se ha creado una migración nueva para este paquete.

La prueba de los seis niveles confirma además que el servidor admite sus IDs actuales; ya no corresponde pedir al propietario la migración de movimiento como requisito pendiente para este proyecto. Esto verifica el comportamiento y no inspecciona el historial de migraciones de SQL Editor.

## Limpieza y entrega

- **184 pruebas Node** y **18 comprobaciones PostgreSQL local** correctas; las segundas incluyen 80 casos de perfil y dos roles simulados. Son evidencia separada de las 14 comprobaciones alojadas.
- El RPC de reinicio limpió exclusivamente el estado de las dos cuentas creadas para esta ejecución, comprobando antes sus IDs y etiqueta Auth. No quedan sus perfiles, ciclos, comidas, movimientos, pesos ni sesiones de actividad. Permanecen las filas vacías de inicialización que crea el propio RPC.
- Las dos cuentas de Auth permanecen hasta que el propietario ejecute, si desea retirarlas, [el SQL de limpieza acotado](../../tests/live/cleanup/20261023-package7-test-accounts.sql). Exige coincidencia de IDs, correo reservado y etiqueta de ejecución y excluye administradores; no es una migración ni una purga general. No se han eliminado cuentas desde el agente.
- Contraseñas y tokens solo se utilizaron en archivos temporales privados fuera del repositorio y del servidor HTTP; se eliminan al terminar las comprobaciones. No se incorporan al informe ni a Git.
- **Siguiente paso:** revisión de estos cambios, commit/push y PR a `dev` únicamente con autorización del propietario. Después comprobar el recorrido en GitHub Pages y en PC/móvil físicos. La integración local contra el servicio real no acredita esa publicación.
