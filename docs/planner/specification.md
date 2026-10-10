# Especificación del catálogo y del planificador

Estado: carga de catálogos y primera versión del planificador implementadas. Las reglas no aceptadas se identifican como propuestas; los umbrales exactos siguen abiertos.

## Objetivo del ciclo

Proponer un menú para los siguientes 21 días, con cinco espacios por día: desayuno, media mañana, comida, media tarde y cena. Son 105 comidas planificadas. La generación ocurre al preparar el siguiente ciclo; la instalación del mecanismo se hace una vez y la propuesta se repite en cada renovación. La persona revisa el resultado antes de confirmarlo.

La biblioteca puede incluir recetas ya utilizadas y recetas que no aparecieron en el menú activo. En la implementación, “no usada” se refiere al menú activo, no a la fecha de alta en el catálogo. Se permiten repeticiones; no hay un número mínimo garantizado.

## Catálogos actuales

Los catálogos son JSON genéricos e independientes de los datos personales:

- [`foods.json`](../../data/foods.json): 83 alimentos.
- [`recipes.json`](../../data/recipes.json): 107 recetas y 512 referencias de ingredientes.

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

Cada alimento usa un `id` estable, nombre, unidad canónica, datos nutricionales con base explícita, formato orientativo de compra y, si es una pieza, peso comestible aproximado. Bases existentes: `per_100g`, `per_100ml` y `per_unit`. Las cifras heredadas del HTML son aproximadas. Los alimentos añadidos en la versión 0.2.0 incluyen referencias genéricas de USDA FoodData Central; no representan marcas concretas y deben cotejarse con las etiquetas de los productos comprados. Los formatos de compra son también orientativos.

Unidades admitidas: `g`, `ml` y `ud`. Huevos y la lista de frutas/verduras enteras de [requisitos](../product/requirements.md) usan `ud` fraccionables. La leche se compra como 1 L; café molido se mide en gramos.

### Recetas

Cada receta incluye `id` estable, nombre, `mealType`, `baseServings` (actualmente 1), tiempo, `photoKey`, ingredientes, pasos y notas. Cada ingrediente referencia un `foodId` existente e incluye cantidad y unidad canónica. `amountOnStrengthDay` conserva la alternativa de cantidad para días de fuerza cuando la receta la tiene. Los contratos estructurales están en [`foods.schema.json`](../../data/foods.schema.json) y [`recipes.schema.json`](../../data/recipes.schema.json); la app realiza además comprobaciones entre ambos ficheros.

Tipos actuales: `desayuno`, `media`, `comida`, `tarde` y `cena`. Al ampliar el contrato, mantener los IDs existentes o documentar una migración explícita; no renombrar IDs a la ligera.

## Reglas aceptadas para selección

1. Usar el cálculo nutricional y de raciones actual como punto de partida; optimizar hacia objetivos, aceptando pequeñas desviaciones.
2. Favorecer recetas que aprovechen existencias, pero no excluir una receta solo porque falte stock. La app debe poder mostrar lo que falta en la compra.
3. Buscar variedad y evitar repeticiones cercanas. Permitir repeticiones cuando el catálogo o las restricciones lo requieran.
4. Entregar una propuesta editable: revisar, sustituir una comida y bloquear comidas frente a una regeneración.
5. En ciclos nuevos, procurar introducir recetas que no estuvieron en el menú reciente; la cantidad y el período de referencia están pendientes.

Las cuatro primeras reglas fueron aceptadas explícitamente. La quinta recoge la intención de incluir recetas que no aparecieron en el menú activo; se favorecen, sin imponer un mínimo.

## Flujo implementado de generación

1. Cargar por HTTP(S) los dos JSON, comprobar versiones, IDs, unidades, referencias y tipos, y usar `catalogVersion` en la propuesta.
2. Generar los 105 espacios desde recetas del mismo tipo que cada espacio. Todas las categorías actuales tienen candidatos.
3. No se aplican filtros de gustos, alergias ni restricciones personales; ese modelo sigue pendiente.
4. Muestrear combinaciones y puntuarlas con la lógica nutricional/raciones actual, variedad, menor repetición reciente, recetas no usadas en el menú actual y cobertura del stock. El stock solo aporta preferencia; no elimina candidatos. Las ponderaciones son detalles iniciales de implementación, no umbrales aprobados.
5. Completar los cinco tipos de comida para 21 días. Se permiten repeticiones si la biblioteca lo requiere.
6. Revisar la propuesta, cambiar cada receta por otra del mismo tipo, bloquearla o desbloquearla y regenerar el resto. Una receta seleccionada manualmente queda bloqueada inicialmente.
7. Al confirmar, guardar el menú siguiente, fecha y versión del catálogo en `localStorage`. Se activa al llegar la fecha y archiva el ciclo anterior. Las comidas completadas conservan las cantidades registradas al consumirlas.

El menú fijo actual no cambia hasta que comience el ciclo confirmado. El estado de los catálogos y el menú sigue siendo local; esta función no implica copia remota ni sincronización.

## Gustos y restricciones: propuesta pendiente

**No es una regla aceptada todavía.** Para personalizar sin modificar el catálogo compartido, guardar por persona sus gustos. Una posible escala es “me gusta”, “indiferente” y “prefiero evitar”. Las alergias/intolerancias podrían representarse por separado como exclusiones estrictas, nunca como una preferencia con una puntuación baja. Si no quedan recetas adecuadas, solicitar una decisión o ampliar el catálogo; no reintroducir en silencio un alimento excluido.

Al sustituir un plato, la opción inicial más fiable es escoger otra receta del mismo tipo. Sustituir ingredientes dentro de la receta requeriría equivalencias explícitas, comprobadas en unidades y nutrición.

Si se incorpora un menú compartido por varias personas, falta decidir cómo combinar preferencias y restricciones y cómo sumar raciones. La primera versión del producto sigue siendo para una sola persona.

## Datos y privacidad

El catálogo de recetas no contiene perfiles ni preferencias individuales. Los votos de gusto, menús generados, bloqueos, peso, consumo y despensa pertenecen al estado privado. Hoy este estado usa `localStorage`; la persistencia remota está pendiente. Véase [arquitectura](../architecture.md) y [preguntas abiertas](../open-questions.md).
