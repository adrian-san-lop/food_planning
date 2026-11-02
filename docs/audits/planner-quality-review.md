# Cierre de revisión de raciones y semanas

Fecha: **02/11/2026**. Rama `fix/culinary-portions-weekly-quality`, desde `dev` limpio en `1f8401f`, comprobado igual a `origin/dev` tras actualizar referencias. Resultado local, sin commit, push, merge, publicación ni escrituras en cuentas reales.

## Qué se ha corregido

El ajuste anterior podía dejar un sándwich cerrado con una sola rebanada, reducir la tortilla de un wrap a la mitad manteniendo todas sus verduras y modificar la avena ligante mientras sus huevos seguían fijos. Se conserva la cantidad base de esos ingredientes concretos; el resto del plato y del día continúa ajustándose con las reglas existentes.

| Receta | Ingrediente estructural | Cantidad conservada |
| --- | --- | ---: |
| bocadillo_pavo | Pan | 2 rebanadas |
| bocadillo_pavo_peq | Pan | 2 rebanadas |
| mini_pavo_tomate | Pan | 2 rebanadas |
| fajitas_pollo | Tortilla integral | 70 g |
| wrap_pavo | Tortilla integral | 70 g |
| tortitas_atun | Avena ligante | 25 g |

Es una decisión culinaria acotada a seis recetas, no una afirmación de que todos los wraps deban pesar 70 g ni de que se haya validado una masa cocinándola. No se bloquea el pan que acompaña otros platos ni se imponen proporciones universales. No cambian cantidades base, alimentos, nutrientes, IDs o unidades: cambia lo que propone el escalado en esas recetas.

El indicador opcional `keepBaseAmount` se valida en el esquema y cargador. Los cálculos consideran esa cantidad como parte fija del plato antes de distribuir el resto del objetivo. Los consumos completados prevalecen incluso si contienen cantidades antiguas, y desactivar el ajuste conserva la receta base exacta.

## Efecto nutricional de las nuevas cantidades

Las 111 recetas base mantienen sus cuatro totales. Las propuestas escaladas sí pueden cambiar: conservar su estructura tiene prioridad sobre reducir una cobertura para acercarse más a las kcal. Los límites previos siguen aplicándose al resto de ingredientes y se mantiene visible la diferencia real con el objetivo.

Ejemplo reproducible de un **día sintético** con perfil femenino de 45 kg, 150 cm y 60 años, objetivo perder grasa y actividad habitual sedentaria. No es una recomendación personal. Se compara el mismo día activando/desactivando solo la política nueva:

| Receta examinada | Cantidad anterior → nueva | Delta del día: kcal / proteína / hidratos / grasa |
| --- | --- | --- |
| Los tres sándwiches, por separado | Pan 1 → 2 rebanadas | +62,5 / +2,25 g / +11,25 g / +1 g |
| Fajitas o wrap, por separado | Tortilla 35 → 70 g | +103,25 / +2,8 g / +17,5 g / +2,1 g |
| Tortitas de atún | Avena 15 → 25 g | +37 / +1,3 g / +5,9 g / +0,7 g |

Estos efectos pertenecen a ese día y perfil, no son incrementos universales: el algoritmo puede compensar con otros hidratos cuando hay margen. No cambian las fórmulas de gasto, los cuatro objetivos, la actividad neta ni los objetivos de proteína y grasa. El informe JSON conserva los totales antes/después y el perfil sintético.

## Revisión de la semana completa

La selección incorpora una preferencia suave por que comida y cena no compartan demasiados ingredientes principales; aceite y condimentos comunes no cuentan como semejanza. No exige una frecuencia dietética nueva ni prohíbe una combinación cultural.

Además, intenta espaciar los platos ya elegidos mediante intercambios de días completos compatibles, sin añadir recetas o ingredientes a esa semana. No mueve un día con alguna posición bloqueada en cualquiera de las semanas. Revalida preferencias y tiempos en el destino y contempla también el enlace domingo/lunes del ciclo repetido. No modifica planes guardados al leerlos.

Comparación con los mismos perfiles, semillas, cuatro objetivos y escenarios de stock. Hay 32 escenarios con primer ciclo y renovación: **64 ciclos completos** en cada ejecución.

| Medida | Antes | Después |
| --- | ---: | ---: |
| Ciclos completos de 105 comidas | 64/64 | 64/64 |
| Ciclos con la misma semana base repetida tres veces | 64/64 | 64/64 |
| Repeticiones consecutivas de la misma preparación en comida/cena dentro de las semanas base, acumuladas | 71 | 37 |
| Solapamiento medio de ingredientes principales entre comida y cena (0–1) | 0,1634 | 0,1426 |
| Ingredientes distintos por semana, media | 29,66 | 30,30 |
| Preparaciones por semana, media | 13,47 | 13,56 |
| Máximo de familias nuevas observado en renovación | 3 | 3 |

Mejora la separación de platos, pero **no se afirma que la compra disminuya**: en esta muestra sube unos 0,64 ingredientes distintos. El intercambio de días por sí solo conserva los ingredientes y las necesidades totales de la semana completa; una compra de tres días sí puede cambiar al cambiar su orden. La diferencia de ingredientes semanales procede de las selecciones nuevas, incluidas las cantidades estructurales y la comparación comida/cena. Son heurísticas, no una garantía de óptimo o tolerancias nutricionales.

## Cobertura del escalado

111 recetas × cuatro objetivos × dos perfiles sintéticos × seis niveles de actividad × dos escenarios de sesión (0/600 kcal netas estimadas): **10.656 días de cinco comidas evaluados**. El escenario de sesión es una prueba aislada del ajuste de su fecha; el generador no anticipa sesiones.

En las seis recetas estructurales hay 576 comparaciones: 171 alteraciones de su cantidad estructural antes y cero después. No se detectan cantidades no finitas o no positivas. Esta cobertura añade coherencia estructural a los tests previos de límites y redondeos; no demuestra sabor, textura, saciedad ni adecuación clínica.

## Planes guardados y persistencia

Los planes confirmados mantienen sus recetas, alimentos y cantidades guardadas, incluidas recetas genéricas ya retiradas. No se reconstruyen con el catálogo nuevo al abrir la cuenta. Las cantidades completadas permanecen inmutables. Al editar explícitamente el perfil o registrar actividad se aplican las reglas existentes de recálculo de las fechas pertinentes, respetando pasado y completados.

La política se guarda como dato opcional dentro del `food_snapshot` existente de cada ingrediente, para conservarse al cambiar de dispositivo. No se altera el esquema SQL, RLS, los RPC ni el estado v12. `PLAN_CALCULATION_VERSION` avanza a `2026-11-02.1`; las fechas reutilizadas conservan su versión. Se actualizan las referencias de módulos para evitar mezclar código anterior en caché. No se han efectuado escrituras en Supabase.

## Cebolla de la ensalada de gulas

**Cerrada: revisada sin cambio por confirmación del propietario (02/11/2026).** El propietario responde: «Sí, mantener los 180 g». Se conserva la cantidad de cebolla cruda por ración y se cierra la decisión pendiente sin modificar ingredientes, cantidades ni nutrientes. El peso documentado del conjunto es 673,5 g de ingredientes sólidos más 5 ml de vinagre antes de cocinar; no se presenta como peso final servido.

Es una decisión confirmada por el propietario, no una prueba de cocina o de sabor realizada por el agente. No quedan decisiones abiertas de esta revisión local. La publicación sigue requiriendo autorización.

## Validación y reproducción

- **237/237 pruebas Node correctas**; incluye políticas por receta, límites anteriores, ajuste desactivado, cantidades completadas, snapshot de seis políticas, guardado/lectura de planes, selección y espaciado.
- **21 comprobaciones PostgreSQL locales correctas** con el transporte, mapper y normalizador reales. La prueba portátil incluye sándwich y wrap y comprueba que food_snapshot.portion_policy persista y se recupere en otro dispositivo, junto con cambios de perfil, RLS, idempotencia, consumos y reversos.
- Ambos catálogos y esquemas validados con JSON Schema Draft 2020-12. Comparación contra HEAD: los 90 alimentos son idénticos; las 111 fichas son idénticas salvo los seis indicadores keepBaseAmount y los metadatos de versión/estado de los documentos. No hay cambios en textos, unidades, cantidades base ni nutrientes.
- Ambos comandos de comprobación de impacto nutricional histórico pasan sin regenerar informes. Sus diferencias acumuladas pertenecen a la auditoría anterior, no a estas políticas.
- 10.656 días y 64 ciclos simulados antes/después; resultados guardados en JSON. Sin prueba de cocina, navegador autenticado nuevo o validación alojada.
- Diff revisado y git diff --check sin errores. Los cambios de módulos periféricos solo actualizan sus referencias de caché; no se altera su lógica funcional.

Las recetas de planes anteriores que no tenían esta política conservan su versión: no se enriquecen ni recalculan silenciosamente al leerlas. La nueva política se incorpora a nuevas recetas de plan y se conserva a partir de entonces en sus snapshots.

Los resultados completos se guardan en [la evidencia JSON](planner-quality-review.json). Se reproducen los resultados actuales con `node scripts/review-menu-quality.mjs --output <ruta>`; el antes corresponde al commit indicado en el JSON. La comparación pareada nutricional desactiva únicamente la política de ingrediente sobre el mismo día.

La batería inicial tenía un fallo previo en la prueba de actualización remota: faltaba simular `planningPreferencesController.closeRecipeMenu`. Se añade únicamente ese colaborador al entorno de prueba, sin cambiar el comportamiento de actualización de la aplicación.
