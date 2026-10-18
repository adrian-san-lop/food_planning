# Especificación del catálogo y del planificador

Estado: carga de catálogos y primera versión del planificador implementadas. Las reglas no aceptadas se identifican como propuestas; los umbrales exactos siguen abiertos.

## Objetivo del ciclo

Proponer un menú para los siguientes 21 días, con cinco espacios por día: desayuno, media mañana, comida, media tarde y cena. Son 105 comidas planificadas. La generación ocurre al preparar el siguiente ciclo; la instalación del mecanismo se hace una vez y la propuesta se repite en cada renovación. La persona revisa el resultado antes de confirmarlo.

La biblioteca puede incluir recetas ya utilizadas y recetas que no aparecieron en el menú activo. En la implementación, “no usada” se refiere al menú activo, no a la fecha de alta en el catálogo. Se permiten repeticiones; no hay un número mínimo garantizado.

## Catálogos actuales

Los catálogos son JSON genéricos e independientes de los datos personales:

- [`foods.json`](../../data/foods.json): 90 alimentos.
- [`recipes.json`](../../data/recipes.json): 112 recetas y 543 referencias de ingredientes.

Ambos catálogos usan actualmente `catalogVersion` `0.9.1`. La versión `0.9.0` actualizó frutas enteras a piezas y pan de molde a rebanadas; `0.9.1` limita el pan a rebanadas enteras, máximo dos por comida. La versión `0.8.0` incorpora Ensalada templada de gulas y los alimentos `beetroot`, `cayenne`, `curedCheese`, `freshMozzarella` y `vinegar`; también actualiza la referencia genérica de `gulas` con la etiqueta del fabricante. La versión `0.7.0` añadió cuatro recetas revisadas desde la primera exportación del buzón, `garlic` y `chickenWings`.

Distribución actual de recetas por tipo:

| Tipo | Recetas actuales | Espacios por ciclo |
| --- | ---: | ---: |
| Desayuno | 19 | 21 |
| Media mañana (`media`) | 19 | 21 |
| Comida | 25 | 21 |
| Media tarde (`tarde`) | 20 | 21 |
| Cena | 29 | 21 |

La biblioteca permite variedad dentro de cada semana, pero no una receta diferente para cada espacio del ciclo completo en todos los tipos. Como se aceptan repeticiones, esto no bloquea el planificador. Las preferencias personales reducirán el conjunto elegible; por eso conviene ampliar la biblioteca según las carencias reales y no perseguir un número arbitrario.

## Contrato vigente de los ficheros

### Alimentos

Cada alimento usa un `id` estable, nombre, unidad de inventario (`unit`), unidad de receta (`recipeUnit`), datos nutricionales con base explícita, formato orientativo de compra y, si la receta y el inventario usan unidades distintas, peso comestible aproximado por pieza o rebanada. Bases existentes: `per_100g`, `per_100ml` y `per_unit`. Las cifras heredadas del HTML son aproximadas. Las incorporaciones nutricionales de la versión 0.2.0 incluyen referencias genéricas de USDA FoodData Central; no representan marcas concretas y deben cotejarse con las etiquetas de los productos comprados. Los formatos de compra son también orientativos.

Algunos alimentos llevan `recoveryTags` (`calcium`, `vitamin_d`, `vitamin_c`) para marcar fuentes alimentarias relevantes cuando está activa la recuperación ósea. Son etiquetas cualitativas de selección: el catálogo no contiene cantidades de esos micronutrientes y la app no calcula objetivos ni ingestas de calcio o vitaminas.

El cálculo aplica los valores `per_100g` y `per_100ml` a cantidades en gramos y mililitros, respectivamente. Los valores `per_unit` se aplican directamente a cantidades de receta en `ud`; los alimentos que se cocinan por peso usan `per_100g`. Para frutas con receta e inventario en `ud`, no hace falta conversión de saldo; la base por 100 g y el peso comestible aproximado estiman nutrientes por pieza. El pan de molde usa rebanadas enteras en receta, con máximo dos por comida, y convierte a gramos de inventario usando aproximadamente 25 g por rebanada.

Unidades admitidas: `g`, `ml` y `ud`. Las porciones de fruta entera de [requisitos](../product/requirements.md) usan `recipeUnit: ud` y `unit: ud`; las verduras troceadas mantienen `recipeUnit: g` y pueden usar `unit: ud`; el pan de molde usa `recipeUnit: ud` (rebanadas) y `unit: g`; los huevos usan `ud` en ambas medidas y los líquidos `ml`. La leche se compra como 1 L; café molido se mide en gramos.

### Recetas

Cada receta incluye `id` estable, nombre, `mealType`, `baseServings` (actualmente 1), tiempo, ingredientes, pasos y notas. No contiene fotografía: la interfaz presenta platos e ingredientes sin imágenes de comida. Cada ingrediente referencia un `foodId` existente e incluye su cantidad base en la unidad `recipeUnit` del alimento. La app muestra la cantidad en la unidad de receta, con la etiqueta «rebanada(s)» para el pan, e informa del stock actual en unidad de inventario. No registra déficits de una comida ya realizada. No se guardan alternativas por tipo de entrenamiento: el ajuste se calcula para el día completo desde las cantidades base. Los contratos estructurales están en [`foods.schema.json`](../../data/foods.schema.json) y [`recipes.schema.json`](../../data/recipes.schema.json); la app comprueba también las unidades entre ambos ficheros.

Tipos actuales: `desayuno`, `media`, `comida`, `tarde` y `cena`. Al ampliar el contrato, mantener los IDs existentes o documentar una migración explícita; no renombrar IDs a la ligera.

## Reglas aceptadas para selección

1. Usar el cálculo nutricional y de raciones actual como punto de partida; optimizar hacia objetivos, aceptando pequeñas desviaciones.
2. Favorecer recetas que aprovechen existencias, pero no excluir una receta solo porque falte stock. La app debe poder mostrar lo que falta en la compra.
3. Buscar variedad y evitar repeticiones cercanas. Permitir repeticiones cuando el catálogo o las restricciones lo requieran.
4. Entregar una propuesta editable: revisar, sustituir una comida y bloquear comidas frente a una regeneración.
5. En ciclos nuevos, procurar introducir recetas que no estuvieron en el menú reciente; la cantidad y el período de referencia están pendientes.

Las cuatro primeras reglas fueron aceptadas explícitamente. La quinta recoge la intención de incluir recetas que no aparecieron en el menú activo; se favorecen, sin imponer un mínimo.

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

## Flujo implementado de generación

1. Cargar por HTTP(S) los dos JSON, comprobar versiones, IDs, unidades, referencias y tipos, y usar `catalogVersion` en la propuesta.
2. Generar los 105 espacios desde recetas del mismo tipo que cada espacio. Todas las categorías actuales tienen candidatos.
3. No se aplican filtros de gustos, alergias ni restricciones personales; ese modelo sigue pendiente.
4. Muestrear combinaciones y puntuarlas con la lógica nutricional/raciones actual, variedad, menor repetición reciente, recetas no usadas en el menú actual y cobertura del stock. Si Recuperación ósea está activa, la puntuación también favorece las etiquetas cualitativas descritas arriba. El stock solo aporta preferencia; no elimina candidatos. Las ponderaciones son detalles iniciales de implementación, no umbrales aprobados.
5. Completar los cinco tipos de comida para 21 días. Se permiten repeticiones si la biblioteca lo requiere.
6. Revisar la propuesta, cambiar cada receta por otra del mismo tipo, bloquearla o desbloquearla y regenerar el resto. Una receta seleccionada manualmente queda bloqueada inicialmente.
7. Al confirmar, guardar el menú siguiente, fecha y versión del catálogo en el estado local v11; el sincronizador lo persiste en `plan_cycles` y `planned_meals`. Se activa al llegar la fecha y archiva el ciclo anterior. Las comidas completadas conservan las cantidades registradas al consumirlas.

El menú fijo actual no cambia hasta que comience el ciclo confirmado. El menú confirmado se conserva en el estado local y se sincroniza con `plan_cycles` y `planned_meals` cuando la cuenta está conectada.

### Presentación de la revisión

La cabecera mantiene «Revisa el siguiente ciclo» y, a su derecha, **Cambiar platos** y **Guardar**. Solo la lista central se desplaza; las acciones y la X siguen visibles. Se retira el botón inferior Cerrar. «Cambiar platos» conserva la regeneración de comidas no bloqueadas y explica esa acción con «Renueva únicamente los desbloqueados» al pasar el ratón o recibir foco de teclado.

El resumen muestra fecha de inicio, 21 días, 105 comidas y los indicadores de variedad. Las tarjetas laterales presentan el objetivo y el ajuste de raciones del perfil actual, que utiliza la vista previa de cantidades. La recuperación destacada corresponde a `recoveryFocus`, conservado al generar la propuesta; no se deduce retrospectivamente del perfil. Si ambas preferencias de recuperación difieren, un aviso visible pide usar «Cambiar platos» para aplicar el cambio conservando los bloqueos. No se añade ningún campo persistido.

«Cómo se prepara este menú» agrupa las explicaciones sobre stock, cálculo base sin sesiones previstas, bloqueo manual, ausencia de filtros personales y la presencia cualitativa de calcio/vitaminas. Esas cifras siguen contando días con ingredientes etiquetados; no expresan cantidades ni objetivos de ingesta. Los cambios de selector, bloqueo y regeneración conservan el desplazamiento y el foco del control. En móvil, las acciones se distribuyen debajo del título y el resumen se apila para mantener accesibles los controles.

### Renovación y compra anticipada

- La generación se puede iniciar antes de terminar el ciclo actual. Un borrador sigue pendiente de revisión; solo **Guardar** confirma el próximo ciclo.
- Si el ciclo termina y no existe otro menú confirmado disponible, Inicio y Menú muestran un contenido bloqueado y un diálogo que abre el planificador o permite continuar el borrador. El resto de las páginas sigue disponible. Se retira el antiguo encargo para ChatGPT.
- Al recuperar un borrador cuya fecha ya pasó después de terminar el ciclo, la revisión propone comenzar hoy y exige confirmar de nuevo. No se activa un menú confirmado que ya haya terminado también.
- Compra ofrece **Ciclo actual / Próximo ciclo** únicamente con un próximo menú confirmado y entre uno y tres días antes de su inicio. El día de inicio se activa automáticamente y pasa a ser el actual. Los períodos de 3, 7, 14 días o resto del ciclo se calculan dentro del ciclo seleccionado, sin cruzar a otro.
- Para el próximo ciclo, estimar las existencias al inicio descontando solo las comidas pendientes del ciclo actual anteriores a esa fecha. Las comidas ya realizadas no se descuentan de nuevo. Esta previsión no escribe movimientos; las compras finalizadas sí aumentan el inventario real.
- Los carritos y extras de cada ciclo quedan separados. Al activarse el siguiente, su selección pendiente pasa a la lista actual. La confirmación de una compra no borra la selección del otro ciclo.

## Gustos y restricciones: propuesta pendiente

**No es una regla aceptada todavía.** Para personalizar sin modificar el catálogo compartido, guardar por persona sus gustos. Una posible escala es “me gusta”, “indiferente” y “prefiero evitar”. Las alergias/intolerancias podrían representarse por separado como exclusiones estrictas, nunca como una preferencia con una puntuación baja. Si no quedan recetas adecuadas, solicitar una decisión o ampliar el catálogo; no reintroducir en silencio un alimento excluido.

Al sustituir un plato, la opción inicial más fiable es escoger otra receta del mismo tipo. Sustituir ingredientes dentro de la receta requeriría equivalencias explícitas, comprobadas en unidades y nutrición.

Si se incorpora un menú compartido por varias personas, falta decidir cómo combinar preferencias y restricciones y cómo sumar raciones. La primera versión del producto sigue siendo para una sola persona.

## Datos y privacidad

El catálogo de recetas no contiene perfiles ni preferencias individuales. Los votos de gusto, menús generados, bloqueos, actividad, peso, consumo y despensa pertenecen al estado privado. El estado v11 conserva una copia local y se sincroniza con Supabase mediante tablas relacionales cuando la sesión está conectada. Véase [arquitectura](../architecture.md) y [preguntas abiertas](../open-questions.md).
