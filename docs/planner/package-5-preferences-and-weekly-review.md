# Paquete 5: preferencias visibles y revisión semanal

- Fecha: 23/10/2026.
- Estado: **Incorporado a dev** en `6c1d9ec62dc1`, comprobado antes del paquete 6. Se desarrolló y probó localmente en `chore/planner-preferences-review` desde dev limpio (`a3b6af28c0ea`). Los resultados de pruebas siguientes corresponden al cierre del 5; el 6 conecta posteriormente la configuración inicial.
- Alcance: [plan integrado](implementation-plan.md), paquete 5; [ADR-0047](../decisions/0047-guided-first-use-and-personalized-planning.md).

## Cómo ver los cambios en la aplicación

1. **Mi perfil → Preferencias del menú.** Abre un diálogo con máximos opcionales de minutos para comida y cena de lunes a viernes. Vacío significa sin límite. Guarda solo los tiempos editados y permite consultar las recetas marcadas o devolverlas a Normal.
2. **Abre cualquier ficha de receta**, desde el recetario, menú actual o propuesta. Ahora incluye **Normal**, **Favorita** y **No proponer**. La selección se actualiza al pulsar y usa la sincronización habitual de la cuenta. Normal retira la preferencia explícita anterior.
3. **Menú 3 semanas → Preparar próximo menú / Continuar revisión / Revisar menú guardado.** La propuesta muestra una semana de siete días, con pestañas para las tres semanas. **Confirmar menú** conserva la confirmación y activación existentes.
4. En **Cambiar plato**, consulta hasta tres sugerencias compatibles o el catálogo completo del tipo para una elección manual. **Ver receta** abre la ficha sin modificar el plan; **Elegir esta receta** realiza el cambio explícito.

El menú actual, los borradores, la compra y la despensa no se reemplazan al marcar una receta ni guardar tiempos. Para aplicar preferencias a la selección automática hay que generar o pulsar **Cambiar platos**. Los avisos indican cambios detectados durante la sesión y las condiciones que impiden confirmar; la ayuda recuerda cómo aplicar ajustes a menús ya guardados. No se persiste una copia histórica de preferencias por generación.

## Cambios para tres semanas o una comida

- **Las tres semanas** es el alcance inicial. Cambia ese mismo día y tipo de comida en las tres semanas y bloquea las posiciones modificadas.
- **Solo esta comida** cambia y bloquea una única posición de la semana visible.
- La posición que se está editando se puede cambiar explícitamente aunque esté bloqueada. Cualquier bloqueo de las otras semanas se conserva, incluso si su receta difiere; un mensaje cuenta los cambios y los bloqueos respetados.
- Cada semana conserva sus posiciones independientes. Se muestran las excepciones respecto a la base y se mantienen las 105 comidas del contrato.
- Regenerar conserva todos los bloqueos. Los cambios nunca se aplican a consumos ya registrados ni al ciclo activo.

## Preferencias, alternativas y cantidades

Favorita favorece sin garantizar una aparición. No proponer afecta a la selección automática; el catálogo completo permite elegirla conscientemente. Una elección manual que rebasa el tiempo, no tiene tiempo conocido o está marcada No proponer queda bloqueada y muestra su excepción. Desbloquearla vuelve a someterla a las condiciones automáticas y puede impedir confirmar hasta revisarla.

Las sugerencias usan la misma comprobación de elegibilidad que el generador, sin duplicar sus reglas: tipo de comida, exclusiones y tiempos conocidos cuando hay límite. Entre las compatibles se priorizan favoritas e ingredientes compartidos con ese día; se muestran hasta tres. No se inventan tiempos ni se interpreta cocinar una receta como valoración.

Las fichas de las alternativas calculan sus raciones con los otros platos de ese día; no cambian menús ni stock al consultarlas. Si el día aún está incompleto se muestran las cantidades base y se explica que las raciones se calcularán al completarlo. Nunca se ofrece registrar una comida desde la revisión.

La revisión muestra energía estimada del día, objetivo y diferencia con las cantidades prácticas vigentes. No introduce tolerancias numéricas nuevas, ni fuerza raciones para alcanzar una cifra exacta, ni presenta micronutrientes medidos. Se conservan frutas por piezas, pan en rebanadas enteras con máximo dos, conversiones a inventario, fórmulas de reposo y sesiones reales limitadas a su fecha.

## Propuestas incompletas y borradores

Si las condiciones dejan huecos, la revisión sigue disponible con causas por comida y acceso a preferencias o selección manual. **Confirmar menú** permanece desactivado y no se relajan condiciones automáticamente. Tampoco se puede bloquear un hueco.

Un resultado con huecos se mantiene temporalmente en la ventana de revisión y **no sustituye el último borrador completo** de la copia de trabajo ni se envía al RPC: este sigue requiriendo las 105 recetas. Al completar los huecos se conserva mediante el guardado habitual. Cerrar y recargar antes de completarlo recupera el último borrador completo, si existía; no se promete reanudar posiciones incompletas entre dispositivos.

Los borradores completos se siguen conservando al elegir platos y bloquear, sin confirmarlos. Los cambios de preferencias no fuerzan regeneración. Si llega una versión nueva del borrador desde la sincronización de la cuenta mientras se revisa, la vista adopta esa versión y mantiene la semana visible, el alcance, el desplazamiento y el foco cuando corresponde.

## Estructura del código y persistencia

| Módulo | Responsabilidad |
| --- | --- |
| `js/domain/menu-review.js` | Cambios inmutables de una o tres posiciones, respeto de bloqueos y selección de alternativas compatibles. Sin DOM, almacenamiento ni RPC. |
| `js/domain/menu-planner.js` | Exporta la comprobación de elegibilidad común, conservando el motor de generación y evaluación. |
| `js/ui/planner-review.js` | Vista semanal, alternativas, causas, excepciones, diferencias y conservación del foco y desplazamiento. Dependencias de recetas y nutrición inyectadas. |
| `js/ui/planning-preferences.js` | Controles de ficha, diálogo de preferencias y validación de cambios de tiempo. |
| `js/ui/planning-preferences-controller.js` | Edición del diálogo y preferencias; utiliza estado, guardado, avisos y capacidad de persistencia inyectados. |
| `js/main.js` | Conexión de los controles, orquestación del planificador y confirmación por la sincronización existente. La revisión HTML se extrae a su módulo. |

**No hay migración SQL nueva ni cambio del estado v12.** Se reutilizan las tablas y RPC del [paquete 4](package-4-persistence.md), cuya aplicación y siete comprobaciones estructurales confirmó el propietario el 23/10/2026. No se requiere repetir ese SQL. Los cambios de este paquete serán visibles en la web publicada cuando el propietario los publique.

La copia de trabajo sigue siendo `localStorage`; Supabase confirma el guardado remoto a través del estado compacto de sincronización. El aviso «Preferencias actualizadas» no afirma que Supabase haya aceptado una escritura. Si el esquema no admite preferencias, sus controles se deshabilitan sin impedir el uso del resto de la cuenta. Se mantienen RLS, revisión PT409, conciliación, retiradas normal/null e idempotencia; no se añaden escrituras de catálogo, colas offline ni controles manuales de sincronización.

## Comprobaciones y límites

- **162 pruebas Node correctas**: regresiones anteriores y casos nuevos de alcance, bloqueos cruzados, elecciones manuales, exclusiones y tiempos, vistas, controles, preferencias sin mutar planes/stock/historial, consulta de alternativas y protección del último borrador completo.
- Prueba por HTTP con el shell, módulos y catálogos reales, en el navegador integrado de Codex y con cuenta sintética. Se sustituyó el arranque de Auth únicamente en un servidor temporal local: sin login real, llamadas remotas ni cambios en la cuenta del propietario.
- Recorridos comprobados: tiempos separados; Favorita → No proponer; exclusión al regenerar; consulta y elección de alternativa; cambio de dos semanas respetando el bloqueo de una tercera; Solo esta comida y excepción manual; límites de un minuto con huecos y confirmación desactivada; ficha legible en un día incompleto; confirmación local y estado Confirmado.
- Revisión visual en marcos de **1366 × 768**, **1024 × 768**, **390 × 844** y **360 × 640**. Se conservan los desplazamientos interiores para contenidos largos y las acciones de cierre/confirmación. No son pruebas en dispositivos físicos ni una validación en Firefox/Edge.
- La validación alojada posterior está en el [paquete 7](package-7-integration.md): 14 comprobaciones con dos cuentas y recorrido en dos sesiones de navegador independientes. La prueba local de este paquete no se presenta como esa evidencia remota. Quedan publicación y dispositivos físicos.

Continuación: [paquete 6](package-6-guided-first-setup.md) implementado y [7](package-7-integration.md) con integración real comprobada; publicación autorizada pendiente.
