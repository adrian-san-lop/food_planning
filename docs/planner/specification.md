# Especificación del catálogo y del planificador

Estado: familiaridad y raciones prácticas implementadas; [generador común del paquete 3](package-3-common-generator.md) implementado y probado localmente (23/10/2026). Reglas aceptadas en ADR-0046 y ADR-0047; ponderaciones y límites son ajustes del producto, no garantías nutricionales.

Evolución aceptada el 22/10/2026, **en desarrollo por paquetes**: [ADR-0047](../decisions/0047-guided-first-use-and-personalized-planning.md) integra configuración inicial, primer ciclo generado, preferencias y revisión semanal. Los paquetes 1–4 están incorporados a `dev`; la persistencia del 4 está aplicada en Supabase con siete comprobaciones correctas según el propietario. El [paquete 5](package-5-preferences-and-weekly-review.md) implementa y prueba localmente controles de preferencias y revisión semanal con alcance de tres semanas o una comida, sin SQL nuevo. El primer arranque continúa con el menú fijo hasta el paquete 6. La validación funcional alojada y publicación siguen pendientes; véase el [plan de implementación](implementation-plan.md).

## Objetivo del ciclo

Proponer un menú para los siguientes 21 días, con cinco espacios por día: desayuno, media mañana, comida, media tarde y cena. Son 105 comidas planificadas. La generación ocurre al preparar el siguiente ciclo; la instalación del mecanismo se hace una vez y la propuesta se repite en cada renovación. La persona revisa el resultado antes de confirmarlo.

Se construye una semana base de siete días y cinco comidas, y se repiten sus recetas en las semanas segunda y tercera. La repetición facilita cocinar y comprar. Los cambios manuales y bloqueos pueden crear excepciones individuales. Se conserva un repertorio familiar entre ciclos; la biblioteca completa sigue disponible para sustituciones manuales.

## Catálogos actuales

Los catálogos son JSON genéricos e independientes de los datos personales:

- [`foods.json`](../../data/foods.json): 90 alimentos.
- [`recipes.json`](../../data/recipes.json): 112 recetas y 543 referencias de ingredientes.

Ambos catálogos usan actualmente `catalogVersion` `0.10.0`: añade políticas opcionales de ración sin cambiar cantidades base ni nutrición. La versión `0.9.3` fijó el huevo L y las descripciones de familias; `0.9.0` actualizó frutas enteras a piezas y pan de molde a rebanadas; `0.9.1` limita el pan a rebanadas enteras, máximo dos por comida. La versión `0.8.0` incorpora Ensalada templada de gulas y los alimentos `beetroot`, `cayenne`, `curedCheese`, `freshMozzarella` y `vinegar`; también actualiza la referencia genérica de `gulas` con la etiqueta del fabricante. La versión `0.7.0` añadió cuatro recetas revisadas desde la primera exportación del buzón, `garlic` y `chickenWings`.

Distribución actual de recetas por tipo:

| Tipo | Recetas actuales | Espacios por ciclo |
| --- | ---: | ---: |
| Desayuno | 19 | 21 |
| Media mañana (`media`) | 19 | 21 |
| Comida | 25 | 21 |
| Media tarde (`tarde`) | 20 | 21 |
| Cena | 29 | 21 |

La biblioteca ofrece alternativas manuales y renovación gradual. Su tamaño no obliga a utilizar el mayor número posible de recetas: el repertorio automático es deliberadamente reducido.

## Contrato vigente de los ficheros

### Alimentos

Cada alimento usa un `id` estable, nombre, unidad de inventario (`unit`), unidad de receta (`recipeUnit`), datos nutricionales con base explícita, formato orientativo de compra y, si la receta y el inventario usan unidades distintas, peso comestible aproximado por pieza o rebanada. Bases existentes: `per_100g`, `per_100ml` y `per_unit`. Las cifras heredadas del HTML son aproximadas. Las incorporaciones nutricionales de la versión 0.2.0 incluyen referencias genéricas de USDA FoodData Central; no representan marcas concretas y deben cotejarse con las etiquetas de los productos comprados. Los formatos de compra son también orientativos.

Algunos alimentos llevan `recoveryTags` (`calcium`, `vitamin_d`, `vitamin_c`) para marcar fuentes alimentarias relevantes cuando está activa la recuperación ósea. Son etiquetas cualitativas de selección: el catálogo no contiene cantidades de esos micronutrientes y la app no calcula objetivos ni ingestas de calcio o vitaminas.

La política `portion` define grupo de ajuste, mínimo, máximo y paso en unidades de receta por persona y comida. Es opcional salvo en recetas por piezas (`ud`), que deben declarar sus reglas. El validador comprueba su coherencia y las cantidades base por ración; los alimentos sin política mantienen su cantidad. Los 52 registros, límites concretos y criterios están en el [paquete 2](package-2-practical-portions.md). Las cantidades base en gramos no se reescriben por no coincidir con el paso; el redondeo solo se aplica al ajuste automático.

El cálculo aplica los valores `per_100g` y `per_100ml` a cantidades en gramos y mililitros, respectivamente. Los valores `per_unit` se aplican directamente a cantidades de receta en `ud`; los alimentos que se cocinan por peso usan `per_100g`. Para frutas con receta e inventario en `ud`, no hace falta conversión de saldo; la base por 100 g y el peso comestible aproximado estiman nutrientes por pieza. El pan de molde usa rebanadas enteras en receta, con máximo dos por comida, y convierte a gramos de inventario usando aproximadamente 25 g por rebanada.

Unidades admitidas: `g`, `ml` y `ud`. Las porciones de fruta entera de [requisitos](../product/requirements.md) usan `recipeUnit: ud` y `unit: ud`; las verduras troceadas mantienen `recipeUnit: g` y pueden usar `unit: ud`; el pan de molde usa `recipeUnit: ud` (rebanadas) y `unit: g`; los huevos usan `ud` en ambas medidas y los líquidos `ml`. La leche se compra como 1 L; café molido se mide en gramos.

### Recetas

Cada receta incluye `id` estable, nombre, `mealType`, `baseServings` (actualmente 1), tiempo, ingredientes, pasos y notas. No contiene fotografía: la interfaz presenta platos e ingredientes sin imágenes de comida. Cada ingrediente referencia un `foodId` existente e incluye su cantidad base en la unidad `recipeUnit` del alimento. La app muestra la cantidad en la unidad de receta, con la etiqueta «rebanada(s)» para el pan, e informa del stock actual en unidad de inventario. No registra déficits de una comida ya realizada. No se guardan alternativas por tipo de entrenamiento: el ajuste se calcula para el día completo desde las cantidades base. Los contratos estructurales están en [`foods.schema.json`](../../data/foods.schema.json) y [`recipes.schema.json`](../../data/recipes.schema.json); la app comprueba también las unidades entre ambos ficheros.

Tipos actuales: `desayuno`, `media`, `comida`, `tarde` y `cena`. Al ampliar el contrato, mantener los IDs existentes o documentar una migración explícita; no renombrar IDs a la ligera.

## Reglas aceptadas para selección

1. Mantener los servicios actuales de objetivos y raciones para los cuatro objetivos. Las cantidades completadas, sesiones y límites de porción conservan su comportamiento.
2. Favorecer existencias e ingredientes compartidos en la semana, sin excluir por falta de stock ni escribir movimientos de previsión.
3. Usar un repertorio orientativo de 2–3 desayunos, 2 medias mañanas, 4 comidas, 2 meriendas y 4 cenas. Son preferencias suaves: bloqueos, disponibilidad y ajuste razonable de raciones tienen prioridad. Repetir desayunos y tentempiés es normal; se espacian preferentemente comidas y cenas dentro de la semana.
4. Repetir las selecciones de la semana base tres veces. Un cambio manual afecta solo al espacio elegido y lo bloquea; regenerar conserva todos los bloqueos, aunque difieran entre semanas o excedan el repertorio. No se deducen gustos permanentes.
5. Con un ciclo anterior válido, conservar una parte mayoritaria del repertorio y buscar 2–3 preparaciones nuevas en todo el ciclo. Puede haber menos si no encajan; los cambios manuales no están limitados por ese presupuesto. Sin ciclo previo válido no se aplica una cuota de novedad.
6. Agrupar familias por el conjunto ordenado de `foodId`, ignorando cantidades y orden original. No se cambian IDs ni tipos: las variantes de ración siguen seleccionables y no cuentan como nuevas preparaciones. Familias y contadores son derivados, sin campos persistidos.

Estas reglas sustituyen la preferencia general por recetas ausentes del ciclo anterior de ADR-0002 y ADR-0004. Véase [ADR-0046](../decisions/0046-familiar-weekly-menu.md).

## Recuperación ósea

La casilla **Recuperación ósea activa** conserva el ajuste prudente de energía ya existente y cambia la puntuación de los menús que se generen o regeneren: favorece recetas que incorporen alimentos etiquetados como fuentes de calcio, vitamina D y vitamina C. La proteína sigue tratándose con el objetivo de macronutrientes ya existente. La revisión de la propuesta muestra en cuántos de los 21 días hay ingredientes etiquetados de cada tipo; esto indica presencia, no cantidades nutricionales ni cumplimiento de una recomendación diaria.

La estrategia se basa en orientación del NHS para fracturas y huesos sanos, y en las fichas de calcio y vitamina D de NIH ODS. Estas fuentes respaldan una dieta equilibrada con proteína, calcio y vitamina D, pero no permiten afirmar que un menú concreto acelere la consolidación de una fractura. La etiqueta de vitamina C añade variedad de frutas y verduras; no expresa una dosis ni un objetivo específico para la fractura. Obtener vitamina D solo de los alimentos puede ser difícil; la app no prescribe suplementos ni fija micronutrientes sin evaluación individual. El ciclo activo y las comidas ya registradas no se sustituyen al cambiar esta casilla. Véase [ADR-0007](../decisions/0007-bone-recovery-menu-preference.md).

## Gasto en reposo y movimiento habitual

El gasto en reposo se estima con la versión redondeada de [Mifflin–St Jeor](https://pubmed.ncbi.nlm.nih.gov/2305711/): `10 × peso_kg + 6,25 × altura_cm − 5 × edad + 5` para hombre o el mismo cálculo con `−161` para mujer. El perfil también permite introducir manualmente el gasto en reposo. El mantenimiento multiplica ese resultado por un factor de movimiento diario; después se aplica el objetivo elegido. La base del día tiene un mínimo de `1,10 × gasto en reposo`.

| Nivel | Factor | Referencia cotidiana para elegir |
| --- | ---: | --- |
| Muy sedentario | 1,10 | Casi todo el día sentado o tumbado, con muy pocos desplazamientos cotidianos. |
| Sedentario | 1,20 | Trabajo normalmente sentado, con recados y tareas habituales. |
| Ligera | 1,37 | Ratos frecuentes de pie o caminando durante el día. |
| Moderada | 1,55 | Gran parte del día en movimiento o trabajo físico moderado. |
| Intensa | 1,72 | Muchas horas de trabajo físico exigente, caminatas o cargas. |
| Muy intensa | 1,90 | Trabajo físico muy exigente durante casi toda la jornada. |

Estas descripciones se refieren a la jornada y las tareas habituales; no se cuentan las sesiones registradas en Menuki, que se añaden solo a su fecha según ADR-0005. Son multiplicadores orientativos usados por la aplicación, no categorías clínicas equivalentes a los intervalos PAL del [informe FAO/OMS/UNU](https://www.fao.org/4/y5686e/y5686e07.htm). Los ejemplos de gasto de la tabla de factores original no se usan para calcular el perfil: Menuki conserva Mifflin–St Jeor.

Los perfiles heredados se convierten en el nivel cuyo factor nuevo queda más cerca de su factor previo: `very_low` a `sedentary`, `low` y `medium` a `light`, y `high` a `moderate`. La migración `20261018140000_activity_movement_factors.sql` actualiza los perfiles existentes y amplía la restricción de Supabase; debe ejecutarse antes de sincronizar los nuevos valores. Véase [ADR-0044](../decisions/0044-activity-movement-factors.md).

## Ajuste nutricional por sesiones realizadas

El usuario registra la sesión después de realizarla, con fecha, actividad/esfuerzo y duración. Hay varias sesiones posibles en una fecha. No se planifican sesiones futuras ni se aprende automáticamente una agenda a partir del historial.

- El perfil define la actividad habitual del día sin ejercicio. El día sin sesiones usa el objetivo base.
- Para cada sesión se estima energía neta como `(MET − 1) × peso_kg × duración_horas`; el `1 MET` de reposo se resta porque ya está representado en el objetivo base. Las sesiones del mismo día se suman.
- La estimación se aplica únicamente a comidas aún pendientes de esa fecha. Las cantidades y el consumo de comidas ya registradas permanecen como snapshots y no se reescriben.
- El cálculo trata las comidas completadas como cantidades fijas y ajusta las pendientes para aproximarse al objetivo restante. Las metas diarias de proteína y grasa no aumentan por entrenar; la energía añadida se cubre principalmente ajustando porciones de hidratos, dentro de los límites existentes del escalado.
- Añadir o eliminar una sesión recalcula las comidas pendientes de esa fecha y la compra derivada. No modifica días futuros.
- Si se cambia el perfil o el peso utilizado, pueden recalcularse las comidas futuras pendientes; las completadas conservan sus cantidades guardadas.

Los MET de las actividades incluidas son estimaciones de categorías del [2024 Adult Compendium of Physical Activities](https://pacompendium.com/adult-compendium/), incluida su [herramienta de consulta](https://pacompendium.com/compendium-calculator/). El compendio se dirige a adultos de 19–59 años y no calcula el gasto individual exacto; para edades fuera de ese rango y para sesiones concretas, los valores son orientativos. El resultado no es una medición clínica.

## Raciones prácticas implementadas

`portionsForRecipes` toma los grupos del catálogo y aplica los márgenes relativos existentes junto con mínimos, máximos y pasos por alimento. Suma ingredientes repetidos antes de ajustar para limitar el total por comida. Los ingredientes fijos y sin política conservan sus cantidades; no se pierde ningún ingrediente cuantificado. Desactivar el ajuste conserva las bases exactas y las comidas completadas siempre conservan su snapshot.

`evaluateRecipePortions` reúne cantidades, totales, objetivo y diferencias firmadas (total menos objetivo) sin volver a escalar para cerrar el desfase. El planificador usa esta evaluación. La elección entre candidatos está implementada en el paquete 3; el paquete 5 muestra las diferencias y alternativas en la revisión local. No se introduce una nueva tolerancia aceptable de kcal.

## Flujo implementado de generación

1. Cargar y validar catálogos. `createMenuPlanner` recibe perfil confirmado, inicio explícito, preferencias opcionales, historial/bloqueos, saldo y fecha de referencia. La entrada común sirve también sin historial. El adaptador actual la usa para renovar y conserva los errores dentro del planificador.
2. Proyectar la despensa al inicio descontando solo comidas pendientes anteriores desde la fecha de referencia. Las completadas permanecen fijas; solo se incorpora actividad real de la fecha de referencia, sin prever sesiones futuras ni escribir movimientos.
3. Aplicar No proponer y máximos opcionales de comida/cena de lunes a viernes según las fechas reales. Conservar elecciones manuales y señalar sus excepciones. Si faltan alternativas, devolver posiciones incompletas y causas sin permitir confirmarlas. Las preferencias se editan en las fichas y el perfil y se guardan por la sincronización habitual.
4. Para cada candidato, derivar familias y repertorios pequeños, favoreciendo continuidad, ingredientes compartidos, saldo previsto, favoritas y recuperación cualitativa. Evaluar siete días con raciones reales y permitir alternativas familiares si mejoran el ajuste. No forzar cantidades para cerrar kcal.
5. Introducir dos o tres familias nuevas voluntarias cuando encajen, o menos. Las condiciones explícitas y los bloqueos pueden requerir más cambios; se señalan como renovación ampliada. No se eluden exclusiones por mantener una cuota.
6. Repetir la semana tres veces y aplicar todos los bloqueos. Una receta manual excluida en la primera semana no se convierte en elección automática de las demás. Comparar tres candidatos completos, incluidos sus bloqueos, por nutrición, distribución, repetición, preparación, ingredientes, preferencias y stock; elegir la menor puntuación sin declararla clínicamente adecuada.
7. Revisar una semana cada vez, cambiar tres semanas o una comida y conservar los demás bloqueos. Confirmar comprueba perfil confirmado y compatibilidad; conserva 3 × 7 × 5, fechas y versión del catálogo en el estado v12. Un resultado con huecos queda temporalmente en la revisión y no sustituye el último borrador completo ni se envía al RPC. No se guardan los análisis temporales. El ciclo activo y sus comidas completadas se conservan.

### Parámetros de ajuste, no garantías

El tamaño inicial usa 3/2/4/2/4 familias por tipo; el uso efectivo puede ser menor o mayor. Cada candidato prueba 28 combinaciones por día. La comparación común usa las raciones reales de sus 21 días; los pesos y métricas están en el [paquete 3](package-3-common-generator.md). La salida es heurística: no garantiza óptimo global, coste mínimo ni equivalencia nutricional exacta. La proyección interna del stock es una copia local no negativa.

El error de selección conserva la ponderación relativa de calorías/proteína/hidratos/grasa y utiliza las raciones reales del servicio. Una mejora de más de 0,20 en ese error permite salir del repertorio inicial. Para renovación voluntaria, una sustitución se acepta si aumenta el error medio como mucho 0,08 y ningún día más de 0,18. Estos valores son puntuaciones adimensionales de implementación, **no tolerancias clínicas ni porcentajes de calorías**. El objetivo aleatorio de novedad es dos o tres familias; condiciones y bloqueos prevalecen. El azar se inyecta en pruebas; no se guarda una semilla en datos personales.

El menú fijo actual no cambia hasta que comience el ciclo confirmado. El menú confirmado se conserva en el estado local y se sincroniza con `plan_cycles` y `planned_meals` cuando la cuenta está conectada.

### Presentación de la revisión

La revisión muestra siete días con cinco comidas por semana y pestañas para consultar las tres semanas. **Cambiar platos** conserva la regeneración de comidas no bloqueadas y **Confirmar menú** confirma solo una propuesta completa y compatible. La X permite cerrar; el contenido largo se desplaza dentro del diálogo. Los controles se compactan en móvil.

El resumen y la ayuda muestran fecha, duración, preparaciones, variantes y novedades. Cada día muestra energía estimada, objetivo y diferencia con las raciones prácticas del perfil actual, sin actividad futura prevista. Se señalan excepciones entre semanas, causas de posiciones incompletas y elecciones manuales fuera de las preferencias. Los cambios detectados de preferencias piden regenerar sin reemplazar silenciosamente el menú. La recuperación usada al generar se conserva en `recoveryFocus`; no se añaden campos persistidos.

«Cómo se prepara este menú» explica repetición, continuidad, familias, stock opcional, preferencias, cálculo y bloqueos. Conserva la cobertura cualitativa cuando se generó con recuperación ósea: días con ingredientes etiquetados, sin expresar cantidades ni objetivos de ingesta. El alcance inicial **Las tres semanas** cambia la misma posición de las tres semanas, preservando los bloqueos de las otras; **Solo esta comida** afecta una posición. Las posiciones modificadas quedan bloqueadas. Navegación, cambios y cierre de fichas conservan foco y desplazamiento cuando corresponde.

El nombre del plato abre su ficha. **Cambiar plato** ofrece hasta tres alternativas compatibles y el catálogo completo del tipo para una elección manual. **Ver receta** consulta una alternativa sin cambiar el plan; **Elegir esta receta** realiza la sustitución. La ficha calcula cantidades con el resto del día de la propuesta; si está incompleto, muestra cantidades base y lo explica. No ofrece registrar comidas. **Volver a la revisión**, la X y Escape cierran solo la ficha y restauran el foco. Todas las fichas incluyen **Normal / Favorita / No proponer**. Véanse los detalles y límites del [paquete 5](package-5-preferences-and-weekly-review.md).

### Renovación y compra anticipada

- La generación se puede iniciar antes de terminar el ciclo actual. Un borrador sigue pendiente de revisión; solo **Confirmar menú** confirma el próximo ciclo.
- Si el ciclo termina y no existe otro menú confirmado disponible, Inicio y Menú muestran un contenido bloqueado y un diálogo que abre el planificador o permite continuar el borrador. El resto de las páginas sigue disponible. Se retira el antiguo encargo para ChatGPT.
- Al recuperar un borrador cuya fecha ya pasó después de terminar el ciclo, la revisión propone comenzar hoy y exige confirmar de nuevo. No se activa un menú confirmado que ya haya terminado también.
- Compra ofrece **Ciclo actual / Próximo ciclo** únicamente con un próximo menú confirmado y entre uno y tres días antes de su inicio. El día de inicio se activa automáticamente y pasa a ser el actual. Los períodos de 3, 7, 14 días o resto del ciclo se calculan dentro del ciclo seleccionado, sin cruzar a otro.
- Para el próximo ciclo, estimar las existencias al inicio descontando solo las comidas pendientes del ciclo actual anteriores a esa fecha. Las comidas ya realizadas no se descuentan de nuevo. Esta previsión no escribe movimientos; las compras finalizadas sí aumentan el inventario real.
- Los carritos y extras de cada ciclo quedan separados. Al activarse el siguiente, su selección pendiente pasa a la lista actual. La confirmación de una compra no borra la selección del otro ciclo.

## Preferencias aceptadas y restricciones fuera de alcance

Según ADR-0047, se aceptan preferencias personales por receta **normal**, **favorita** y **No proponer**. El paquete 3 las aplica en el motor y el [paquete 4](package-4-persistence.md) incorpora su persistencia relacional, aplicada y comprobada estructuralmente según el propietario el 23/10/2026. El paquete 5 añade los controles en las fichas y **Mi perfil → Preferencias del menú**, con máximos opcionales y separados de comida y cena entre semana; vacío significa sin límite. Favorita favorece sin obligar a aparecer; No proponer excluye la selección automática pero permite una elección manual. Registrar una comida no es una valoración. Si no quedan alternativas se muestran causas; no se relajan las condiciones ni se confirma un ciclo incompleto. La validación funcional alojada sigue pendiente.

Las preferencias son privadas y no modifican el catálogo compartido ni reemplazan menús confirmados automáticamente. Las exclusiones de ingredientes y las alergias/intolerancias quedan fuera de esta entrega y requieren un diseño independiente; No proponer no es un filtro de alergias.

Al sustituir un plato, la opción inicial más fiable es escoger otra receta del mismo tipo. Sustituir ingredientes dentro de la receta requeriría equivalencias explícitas, comprobadas en unidades y nutrición.

Si se incorpora un menú compartido por varias personas, falta decidir cómo combinar preferencias y restricciones y cómo sumar raciones. La primera versión del producto sigue siendo para una sola persona.

## Datos y privacidad

El catálogo de recetas no contiene perfiles ni preferencias individuales. Los votos de gusto, menús generados, bloqueos, actividad, peso, consumo y despensa pertenecen al estado privado. El estado v12 conserva una copia de trabajo local y se sincroniza con Supabase mediante tablas relacionales cuando la sesión está conectada. Véase [arquitectura](../architecture.md) y [preguntas abiertas](../open-questions.md).


## Convenciones del catálogo confirmadas el 19/10/2026

Según [ADR-0045](../decisions/0045-generic-catalog-and-measurement-conventions.md), los alimentos representan genéricos, sin exigir marca. Las cantidades corresponden al peso en crudo antes de cocinar; conservas escurridas y alitas con hueso. Los alimentos ya comprados preparados conservan esa forma declarada. El huevo L se mide en unidades y su nutrición usa una estimación estándar de 60 g comestibles por unidad. Café y tiempos actuales permanecen. La instrucción final de cierre mantiene contabilizados todos los ingredientes cuantificados, incluidos aceite, cayena, salsa de soja y vinagre. Las especias opcionales sin cantidad definida quedan fuera del cálculo. No se omiten ingredientes cuantificados ni se ponen sus tablas a cero. Estas convenciones no modifican los IDs, cantidades ni pesos por pieza existentes.
