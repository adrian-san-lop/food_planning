# ADR-0046 — Semana base, familiaridad y renovación gradual

- Estado: Aceptada e implementada localmente
- Fecha: 2026-10-21
- Alcance: selección de propuestas futuras y su resumen; sustituye la política de variedad/novedad de ADR-0002 y ADR-0004

Actualización (23/10/2026): [ADR-0047](0047-guided-first-use-and-personalized-planning.md) extiende este diseño. El paquete 3 incorpora motor común, preferencias, tiempos, candidatos y previsión de despensa; el 4 añade persistencia y el [5](../planner/package-5-preferences-and-weekly-review.md) implementa localmente controles y revisión semanal con cambios por defecto a tres semanas. La nueva configuración inicial queda para el 6. Este registro conserva el fundamento del selector: familiaridad, repetición y renovación gradual. Restricciones y bloqueos prevalecen sobre el presupuesto suave de novedad.

## Contexto

Menuki debe reducir el trabajo de decidir, cocinar y comprar. El generador anterior premiaba cada receta ausente del ciclo activo y penalizaba varias veces la repetición, tendiendo a recorrer demasiado catálogo. Una biblioteca amplia es útil para escoger alternativas, pero no obliga a renovar todo el menú.

Se revisaron los cinco PDF de `docs/nutritional-plan-example` como referencia organizativa: tablas semanales por momentos del día, desayunos y tentempiés repetidos, platos reconocibles conservados entre entregas y alternativas añadidas progresivamente. No se incorporan sus cantidades, horarios, restricciones personales, equivalencias ni instrucciones de entrenamiento. La repetición exacta de siete días durante tres semanas y los tamaños siguientes son decisiones expresas del propietario, no reglas extraídas de esos documentos.

## Decisión

1. Construir una semana de siete días y cinco comidas, y repetir sus selecciones tres veces. Las raciones se calculan con el servicio nutricional vigente.
2. Favorecer un repertorio de 2–3 desayunos, 2 medias mañanas, 4 comidas, 2 meriendas y 4 cenas. Son preferencias suaves; disponibilidad, raciones razonables y bloqueos tienen prioridad. La repetición es normal; se busca separar las comidas/cenas repetidas dentro de la semana.
3. Con un ciclo previo válido, conservar gran parte del repertorio e introducir solo 2–3 preparaciones nuevas en todo el ciclo, o menos si no encajan. Las elecciones manuales prevalecen y pueden superar esa cifra.
4. Una familia es el conjunto de IDs de alimentos, sin considerar cantidades, orden ni ID de receta. Los tipos y recetas originales permanecen. La agrupación es derivada y no modifica catálogos, esquemas ni persistencia.
5. Favorecer ingredientes compartidos y despensa disponible. Simular con copias de saldo; nunca escribir movimientos por generar o prever compras. Generar también con despensa vacía.
6. Según la ampliación de ADR-0047, implementada en el paquete 5, cambiar una receta afecta por defecto a esa posición en las tres semanas, preservando bloqueos de las otras; Solo esta comida afecta una posición. Las posiciones modificadas quedan bloqueadas y regenerar conserva todos los bloqueos. No se infieren gustos de los consumos; las preferencias son explícitas. El catálogo completo del tipo sigue disponible para elección manual.
7. Mantener los cuatro objetivos, actividad registrada por fecha, snapshots, unidades, límites de porción y contabilidad de todos los ingredientes cuantificados. La recuperación ósea conserva su preferencia cualitativa.
8. Aplicar solo al generar/regenerar propuestas futuras mediante los controles existentes. No reemplazar automáticamente menús activos, confirmados, borradores existentes ni comidas completadas. Sin migraciones ni cambios en Supabase.

## Implementación y límites

`js/domain/menu-generator.js` es un módulo de selección sin efectos externos. Recibe evaluación nutricional, conversiones, preferencias de recuperación y azar inyectables. `main.js` continúa coordinando revisión, cambios y guardado con el contrato existente de 3 × 7 × 5. El resumen diferencia preparaciones, variantes adicionales, novedades respecto al ciclo actual y excepciones entre semanas. Una propuesta antigua sigue abriéndose tal como estaba; solo «Cambiar platos» aplica el generador nuevo conservando sus bloqueos.

El tamaño inicial 3/2/4/2/4, las 28 combinaciones diarias y las puntuaciones de separación, stock e ingredientes son parámetros de ajuste. Se permite salir del repertorio por mejora nutricional material y se evalúan sustituciones para la renovación. Las tolerancias adimensionales se documentan en la [especificación](../planner/specification.md#parámetros-de-ajuste-no-garantías). No representan tolerancias clínicas. No se garantiza un óptimo global, compra de coste mínimo, número exacto de platos ni que todas las personas alcancen su objetivo con esos límites.

Compartir ingredientes es una aproximación a simplificar la compra: no se optimizan caducidades, envases o precios. Dos preparaciones con los mismos ingredientes pero técnicas distintas pertenecen a la misma familia por la regla aceptada.

## Verificación

Pruebas automatizadas con azar reproducible y datos sintéticos/catálogos reales cubren 105 comidas compatibles, repetición semanal, independencia de arrays, bloqueos conflictivos y abundantes, continuidad entre ciclos, variantes, alternativas inadecuadas, despensa vacía y cálculo existente de los cuatro objetivos. Se ejecuta también la batería anterior de inventario, unidades, snapshots, sincronización y catálogos. La comprobación local no acredita publicación ni sincronización en una cuenta real.

Resultado del 21/10/2026: **68/68 pruebas correctas**, incluidas 17 del nuevo generador. La renovación con catálogo real se comprobó durante tres ciclos sucesivos para cada uno de los cuatro objetivos. También pasan la comprobación de sintaxis de `main.js` y `git diff --check`.

La revisión por HTTP usó una página temporal con el renderizador y los manejadores reales del planificador, catálogo real y estado sintético; el guardado estuvo sustituido por una función sin efectos. Se verificaron 105 selectores, tres semanas iguales, sustitución individual, bloqueo automático y conservación de dos bloqueos distintos al regenerar. La revisión visual a 798 px y en un marco de 390 × 844 px mostró el resumen legible; se ajustó la distribución de tarjetas entre 721 y 900 px para evitar palabras partidas. No se probó Auth ni una escritura en una cuenta real. La página temporal se retiró después de la comprobación.

Corrección posterior del 21/10/2026: «Continuar revisión» fallaba antes de abrir el diálogo con `ReferenceError: cleanCyclePlan is not defined`. La función existía dentro del normalizador, pero faltaba devolverla y conectarla en `main.js`. Se expone la misma función, sin cambiar el formato ni las reglas de normalización, y se actualizan las versiones de carga del módulo y la entrada. La prueba visual anterior empezaba con el editor abierto y no cubría esta ruta. Cuatro pruebas de regresión ejecutan ahora la conexión y el manejador de apertura reales con límites DOM/guardado simulados: borrador con 105 comidas y bloqueos, menú confirmado, propuesta nueva y borrador caducado. Fallaban con el error comunicado antes de la corrección; después pasan y la batería completa queda en **72/72**. No se modificaron datos de cuentas ni Supabase; no requiere migración.


## Consulta de recetas desde la revisión (21/10/2026)

Se acepta e implementa **Ver receta** en cada comida de la propuesta, reutilizando la ficha existente sobre el diálogo del planificador. Presenta descripción cuando existe, ingredientes con las raciones calculadas para ese día de la propuesta, pasos, tiempo y macros estimados. No usa consumos del ciclo activo ni prevé sesiones. No permite registrar comidas desde esta vista y consultar no cambia ni bloquea el borrador.

El botón **Volver a la revisión**, la X y Escape cierran solo la ficha. El diálogo inferior permanece abierto, conserva el desplazamiento y recupera el foco en el botón de origen. Los selectores y bloqueos mantienen sus acciones; se distingue el botón al restaurar foco tras un cambio. En móvil, el acceso a la ficha queda bajo el selector junto a las calorías.

Tres pruebas de regresión cubren receta y día seleccionados, cantidades personalizadas frente al menú activo, ausencia de mutaciones y compatibilidad de las fichas normales. Se verificó por HTTP con catálogo real y estado sintético la apertura desde «Continuar revisión», la superposición, el cierre por botón y Escape y el retorno al mismo desplazamiento (también al final de la tercera semana). Se revisó el diseño a 1280 px y en un marco de 390 px. Sin acceso a datos de cuentas ni escrituras remotas. Batería completa: **75/75 pruebas correctas**.
