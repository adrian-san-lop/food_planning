# ADR-0049 — Cambiar el objetivo adapta el menú activo

- Estado: Aceptada e implementada localmente en la rama `fix/profile-goal-menu`
- Fecha: 2026-10-24
- Alcance: guardado del perfil y selección de recetas pendientes del ciclo activo

## Contexto

El objetivo principal modifica las necesidades energéticas y la distribución de nutrientes. Cambiar de pérdida de grasa a ganancia muscular, o corregir una selección equivocada, requiere que el menú también pueda ajustarse: recalcular únicamente las raciones deja las mismas recetas seleccionadas bajo otro objetivo. El usuario puede cambiar de objetivo en mitad del ciclo y quiere que las comidas que aún no ha hecho reflejen el cambio.

## Decisión

1. Guardar un cambio del objetivo principal genera una propuesta para las posiciones pendientes del ciclo activo usando el nuevo perfil y el generador común. El botón indica **Guardar y adaptar menú** cuando hay un ciclo activo. Se vuelve a seleccionar cada posición desbloqueada; una receta puede repetirse si sigue encajando con el objetivo y las restricciones, así que no se fuerza una sustitución total.
2. Las fechas anteriores al día actual y todas las comidas completadas quedan bloqueadas. Se conserva su receta y, en las completadas, el snapshot de cantidades consumidas. Solo se pueden sustituir recetas de comidas pendientes de hoy en adelante; sus cantidades se siguen calculando con el servicio nutricional y el nuevo perfil.
3. La propuesta utiliza las preferencias, restricciones de tiempo, disponibilidad proyectada y reglas de familiaridad vigentes. No crea movimientos de despensa ni de actividad. El ID, la fecha de inicio y el estado de las comidas completadas del ciclo permanecen iguales.
4. Si no quedan comidas pendientes, el perfil se guarda sin modificar el menú. Si no puede producirse una propuesta completa, se guarda el nuevo perfil, se conserva el menú anterior y se informa a la persona; no se confirma un menú parcial.
5. Sin ciclo activo o después de que el ciclo termine, el objetivo se aplicará al generar el siguiente menú. Editar otros campos del perfil conserva el comportamiento existente: actualiza el cálculo y las raciones, sin volver a seleccionar platos.
6. La acción guarda el perfil y el menú mediante la sincronización transaccional existente. No cambia el formato de estado, las RPC ni el esquema de Supabase; no requiere migración.

Esta es una excepción explícita a la regla general de ADR-0046 de no reemplazar un ciclo activo automáticamente: la persona lo solicita al cambiar el objetivo y pulsar Guardar. Cambiar preferencias de receta u otros datos no activa esta adaptación.

## Consecuencias

- Cambiar el objetivo durante un ciclo puede cambiar las recetas aún pendientes, además de sus raciones. Las comidas pasadas y completadas no se reescriben.
- Si las restricciones guardadas impiden un menú completo, perfil y menú pueden quedar temporalmente con objetivos distintos hasta que la persona modifique las restricciones o prepare el siguiente ciclo; la interfaz informa que conserva el menú anterior.
- La selección sigue siendo una propuesta práctica basada en el catálogo, el perfil y la despensa anotada. No garantiza un resultado clínico ni que todas las cantidades alcancen exactamente cada cifra.

## Verificación

Las pruebas automatizadas verifican que la nueva meta llega al generador, que solo se abren las posiciones pendientes, que se conservan las comidas pasadas/completadas y que un resultado incompleto no reemplaza el menú. Otras pruebas cubren el guardado directo del formulario, el campo de metabolismo en reposo opcional cuando se usa una ecuación y la validación antes de guardar. La verificación es local: no acredita una escritura en la cuenta Supabase ni una publicación.
