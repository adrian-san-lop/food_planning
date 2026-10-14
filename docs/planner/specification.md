# Especificación del catálogo y del planificador

Estado: carga de catálogos y primera versión del planificador implementadas. Las reglas no aceptadas se identifican como propuestas; los umbrales exactos siguen abiertos.

## Objetivo del ciclo

Proponer un menú para los siguientes 21 días, con cinco espacios por día: desayuno, media mañana, comida, media tarde y cena. Son 105 comidas planificadas. La generación ocurre al preparar el siguiente ciclo; la instalación del mecanismo se hace una vez y la propuesta se repite en cada renovación. La persona revisa el resultado antes de confirmarlo.

La biblioteca puede incluir recetas ya utilizadas y recetas que no aparecieron en el menú activo. En la implementación, “no usada” se refiere al menú activo, no a la fecha de alta en el catálogo. Se permiten repeticiones; no hay un número mínimo garantizado.

## Catálogos actuales

Los catálogos son JSON genéricos e independientes de los datos personales:

- [`foods.json`](../../data/foods.json): 90 alimentos.
- [`recipes.json`](../../data/recipes.json): 112 recetas y 543 referencias de ingredientes.

Ambos catálogos usan actualmente `catalogVersion` `0.8.0`. Esta versión incorpora Ensalada templada de gulas y los alimentos `beetroot`, `cayenne`, `curedCheese`, `freshMozzarella` y `vinegar`; también actualiza la referencia genérica de `gulas` con la etiqueta del fabricante. La versión `0.7.0` añadió cuatro recetas revisadas desde la primera exportación del buzón, `garlic` y `chickenWings`.

Distribución actual de recetas por tipo:

| Tipo | Recetas actuales | Espacios por ciclo |
| --- | ---: | ---: |
| Desayuno | 18 | 21 |
| Media mañana (`media`) | 18 | 21 |
| Comida | 25 | 21 |
| Media tarde (`tarde`) | 20 | 21 |
| Cena | 26 | 21 |

La biblioteca permite variedad dentro de cada semana, pero no una receta diferente para cada espacio del ciclo completo en todos los tipos. Como se aceptan repeticiones, esto no bloquea el planificador. Las preferencias personales reducirán el conjunto elegible; por eso conviene ampliar la biblioteca según las carencias reales y no perseguir un número arbitrario.

## Contrato vigente de los ficheros

### Alimentos

Cada alimento usa un `id` estable, nombre, unidad de inventario (`unit`), unidad de receta (`recipeUnit`), datos nutricionales con base explícita, formato orientativo de compra y, si se compra por pieza pero se cocina por peso, peso comestible aproximado por pieza. Bases existentes: `per_100g`, `per_100ml` y `per_unit`. Las cifras heredadas del HTML son aproximadas. Las incorporaciones nutricionales de la versión 0.2.0 incluyen referencias genéricas de USDA FoodData Central; no representan marcas concretas y deben cotejarse con las etiquetas de los productos comprados. Los formatos de compra son también orientativos.

Algunos alimentos llevan `recoveryTags` (`calcium`, `vitamin_d`, `vitamin_c`) para marcar fuentes alimentarias relevantes cuando está activa la recuperación ósea. Son etiquetas cualitativas de selección: el catálogo no contiene cantidades de esos micronutrientes y la app no calcula objetivos ni ingestas de calcio o vitaminas.

El cálculo aplica los valores `per_100g` y `per_100ml` a cantidades en gramos y mililitros, respectivamente. Los valores `per_unit` se aplican directamente a cantidades de receta en `ud`; los alimentos que se cocinan por peso usan `per_100g`. Para piezas compradas por unidad, la receta se convierte a inventario usando su peso comestible aproximado, y la conversión inversa se usa para la compra planificada.

Unidades admitidas: `g`, `ml` y `ud`. Las frutas y verduras enteras de [requisitos](../product/requirements.md) usan `recipeUnit: g` y `unit: ud`; los huevos usan `ud` en ambas medidas; los líquidos usan `ml`. La leche se compra como 1 L; café molido se mide en gramos.

### Recetas

Cada receta incluye `id` estable, nombre, `mealType`, `baseServings` (actualmente 1), tiempo, ingredientes, pasos y notas. No contiene fotografía: la interfaz presenta platos e ingredientes sin imágenes de comida. Cada ingrediente referencia un `foodId` existente e incluye su cantidad base en la unidad `recipeUnit` del alimento. La app muestra el peso de receta, pero informa el stock y los faltantes en unidad de inventario. No se guardan alternativas por tipo de entrenamiento: el ajuste se calcula para el día completo desde las cantidades base. Los contratos estructurales están en [`foods.schema.json`](../../data/foods.schema.json) y [`recipes.schema.json`](../../data/recipes.schema.json); la app comprueba también las unidades entre ambos ficheros.

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
7. Al confirmar, guardar el menú siguiente, fecha y versión del catálogo en el estado local v8; el sincronizador lo persiste en `plan_cycles` y `planned_meals`. Se activa al llegar la fecha y archiva el ciclo anterior. Las comidas completadas conservan las cantidades registradas al consumirlas.

El menú fijo actual no cambia hasta que comience el ciclo confirmado. El menú confirmado se conserva en el estado local y se sincroniza con `plan_cycles` y `planned_meals` cuando la cuenta está conectada.

## Gustos y restricciones: propuesta pendiente

**No es una regla aceptada todavía.** Para personalizar sin modificar el catálogo compartido, guardar por persona sus gustos. Una posible escala es “me gusta”, “indiferente” y “prefiero evitar”. Las alergias/intolerancias podrían representarse por separado como exclusiones estrictas, nunca como una preferencia con una puntuación baja. Si no quedan recetas adecuadas, solicitar una decisión o ampliar el catálogo; no reintroducir en silencio un alimento excluido.

Al sustituir un plato, la opción inicial más fiable es escoger otra receta del mismo tipo. Sustituir ingredientes dentro de la receta requeriría equivalencias explícitas, comprobadas en unidades y nutrición.

Si se incorpora un menú compartido por varias personas, falta decidir cómo combinar preferencias y restricciones y cómo sumar raciones. La primera versión del producto sigue siendo para una sola persona.

## Datos y privacidad

El catálogo de recetas no contiene perfiles ni preferencias individuales. Los votos de gusto, menús generados, bloqueos, actividad, peso, consumo y despensa pertenecen al estado privado. El estado v8 conserva una copia local y se sincroniza con Supabase mediante tablas relacionales cuando la sesión está conectada. Véase [arquitectura](../architecture.md) y [preguntas abiertas](../open-questions.md).
