# Plan de auditoría de `foods.json` y `recipes.json`

**Producto:** Menuki — Mi Plan Saludable  
**Estado:** especificación propuesta para trabajo **de solo auditoría**  
**Rama base:** `dev` (ignorar `chore/legal-foundation`)  
**Referencia observada:** 19/10/2026, `catalogVersion` 0.9.1; volver a verificar al comenzar.

## 1. Objetivo y límites

Conseguir catálogos de alimentos y recetas **trazables, nutricionalmente plausibles, consistentes con las unidades y útiles en la cocina y la compra**, antes de introducir nuevas recetas o automatizar su generación.

**Incluye:** inventario completo de alimentos/recetas, calidad de fuentes, contraste nutricional, bases de medida, pesos comestibles, formato de compra, coherencia de recetas, duplicados y controles automáticos recomendados.

**No incluye ni autoriza:** sustituir JSON, cambiar `js/main.js`, el planificador, Supabase o las migraciones; añadir nuevos campos al esquema; generar nuevas recetas; renombrar/eliminar IDs; publicar cambios; cambiar políticas de menú, preferencias o parámetros médicos. El primer resultado son **informes de auditoría**, no una nueva versión de los catálogos.

## 2. Línea base preliminar que debe reproducirse

En la consulta de `dev` del 19/10/2026:

| Indicador | Observado | Comentario |
| --- | ---: | --- |
| Versión de ambos catálogos | `0.9.1` | Verificar coincidencia |
| Alimentos | 90 | `data/foods.json` |
| Recetas | 112 | `data/recipes.json` |
| Referencias a ingredientes en recetas | 543 | Suma de `ingredients.length` |
| Alimentos con `nutritionSource` de estimación heredada | 62 | Clasificación textual; no implica valor incorrecto |
| Alimentos con otra fuente identificada | 28 | 25 USDA, 2 fabricante, 1 BEDCA/AESAN según texto; **no** verificados externamente |
| Recetas con `description` vacío | 112 | Campo válido y opcional en contenido aunque figure en el esquema |
| Ingredientes sin uso en recetas | 1 | `peanuts` (crema de cacahuete); puede ser intencionado |
| Grupos de recetas con el mismo conjunto de `foodId` | 3 | No demuestra duplicidad funcional |
| Recetas con al menos un ingrediente de fuente heredada | 109 | Cálculo preliminar; requiere reproducción |

Las recetas se distribuyen en 19 desayunos, 19 medias mañanas, 25 comidas, 20 medias tardes y 29 cenas. Un ciclo de 21 días tiene 105 espacios y **se permiten repeticiones**. No exigir 105 recetas distintas por ciclo.

**Hallazgos candidatos, nunca cambios automáticos:** `cocoa` y `cayenne` muestran diferencias al comparar kcal declaradas con 4/4/9; la fibra y otros componentes pueden explicarlas. `coffee` figura con 0 kcal por 100 g de café molido para modelar la bebida preparada; revisar el criterio antes de tocarlo. Hay cuatro bocadillos de pavo con igual conjunto de ingredientes, pero podrían representar porciones diferentes. La avena reposada puede declarar tiempo activo en vez del tiempo total de espera.

La clasificación y los recuentos son una **fotografía inicial**, no hallazgos confirmados. Cada uno debe poder reproducirse desde el fichero actual.

## 3. Reglas de preservación obligatorias

1. **IDs estables:** no renombrar/eliminar IDs de alimentos ni recetas; pueden existir referencias en menús e históricos. Solo considerar migraciones explícitas si se autorizan en otra fase.
2. **Dos JSON canónicos:** `foods.json` define nutrientes y unidades; `recipes.json` contiene ingredientes referenciados por `foodId`. No duplicar tablas nutricionales ni insertar datos personales.
3. **Unidades:** `unit` se refiere a inventario/compra; `recipeUnit` a ingredientes de receta. `nutrition.basis` admite `per_100g`, `per_100ml` y `per_unit`.
4. **Porciones existentes en dev:** frutas enteras en `ud`, permitiendo **medias piezas**; pan de molde en rebanadas enteras con máximo de **dos por comida** y conversión orientativa de 25 g por rebanada; verduras troceadas en gramos de receta (pueden comprarse por unidad); huevo en `ud`, líquidos en `ml`.
5. **No universalizar preferencias actuales:** el desayuno requiere café y excluye queso por regla vigente del catálogo; auditarlas como reglas del producto, no como recomendaciones nutricionales universales.
6. **Fuentes y etiquetas:** `recoveryTags` son marcadores cualitativos de calcio/vitaminas, **no cantidades de micronutrientes** ni tratamiento.
7. **Estado y privacidad:** no modificar perfiles, consumos ni snapshots históricos por el mero hecho de auditar o actualizar un valor genérico.
8. **Decisiones pendientes:** la prioridad global de fuentes nutricionales está abierta en `docs/open-questions.md`. La auditoría propone criterios, pero **no los aprueba**.

## 4. Método de auditoría de alimentos (90/90)

### 4.1 Cobertura y control estructural

Para cada alimento, inventariar `id`, nombre, `unit`, `recipeUnit`, `nutrition.basis`, cuatro cifras nutricionales, `purchase`, `nutritionSource`, `approximateEdibleWeight_g_per_unit` (si existe), `recoveryTags` y número de recetas donde aparece. Comprobar esquema, IDs únicos, valores finitos/no negativos, compatibilidad entre base y unidad, etiquetas, formatos de compra y pesos de conversión; identificar excepciones justificadas.

### 4.2 Selección y contraste de fuentes

No escoger un número solo porque coincide con la expectativa. Para cada ingrediente determinar **qué alimento real representa** y contrastar una fuente **que describa esa misma forma de alimento** (crudo/cocinado; seco/hidratado; escurrido/con líquido; pelado/con merma; marca genérica o producto envasado):

1. Para productos comercializados concretos, preferir la **etiqueta verificable de ese producto** si la receta y el catálogo lo representan así; registrar marca, referencia y fecha.
2. Para alimentos genéricos, buscar fuentes de composición con identificación de registro, p. ej. USDA FoodData Central. Considerar si el dato en EE. UU. representa razonablemente el alimento empleado en España.
3. Consultar BEDCA/AESAN cuando sea pertinente; **verificar las condiciones de reutilización** antes de importar o redistribuir datos.
4. Usar Open Food Facts para etiquetas de productos solo si su registro es adecuado, la cifra está contrastada y se han evaluado las **obligaciones ODbL** sobre bases de datos derivadas. No mezclar masivamente sus datos con otras bases sin evaluar la licencia.
5. Si falta coincidencia fiable o la fuente no se puede consultar: **`pending_source`**. No inventar enlaces, identificadores ni valores. No reemplazar un dato heredado por otro de menor calidad.

Registrar identificación, URL, fecha de consulta, tipo de fuente, estado de preparación, unidad de referencia, porción comestible y grado de coincidencia (`exact`, `close`, `not_comparable`, `unverified`). No considerar una referencia escrita en `nutritionSource` como contrastada hasta abrir la fuente.

### 4.3 Criterios nutricionales

- Calcular diferencia absoluta y relativa de kcal, proteínas, hidratos y grasas respecto a una **referencia comparable**; si no es comparable, dejar diferencias vacías y justificar.
- Revisar densidad energética y plausibilidad física, pero **no corregir automáticamente** una diferencia respecto a `4 proteína + 4 hidratos + 9 grasas`. La fibra puede aportar 2 kcal/g en el etiquetado de la UE, y existen otros factores, además de redondeos y distintas definiciones de carbohidratos.
- Para alimentos medidos en `ud`, verificar el **peso comestible**, el tamaño habitual de pieza y si procede usar `per_unit` o `per_100g` + peso. Las medias piezas permitidas requieren conversiones consistentes.
- Distinguir aceite en gramos de compra frente a envases que se venden por mililitros; si se propone una conversión, justificar la densidad e impacto sobre compra/despensa.
- Revisar la conveniencia del modelo de café molido (comprado/consumido en la receta versus infusión bebida) sin imponer que sus cifras nutricionales correspondan a 7 g ingeridos de café seco.
- Evitar falsas precisiones y reflejar la variabilidad entre marcas, rendimientos y tamaños de porción.

### 4.4 Prioridad por impacto

Priorizar la revisión de un alimento por **(a) extensión a recetas, (b) contribución energética y/o proteica en recetas base, (c) riesgo de error por unidades o equivalencia, (d) calidad de fuente**. No tratar una diferencia pequeña del aceite como equivalente a una gran diferencia del alimento proteico más usado sin medir el impacto.

Se recomienda empezar por `bread`, `oliveoil`, `skyr`, `rice`, `eggs`, `potato`, `chicken`, `turkey`, `milk` y `oats`, sujetos a los resultados al recomputar `dev`. Son **candidatos de alta exposición**, no alimentos declarados erróneos.

## 5. Método de auditoría de recetas (112/112)

### 5.1 Cálculos derivados (sin alterar el producto)

Reproducir, para **una ración base**, la suma de los nutrientes por ingrediente, usando exactamente los factores del código y `baseServings`:

- `per_100g` con receta `g`: `amount / 100`.
- `per_100ml` con receta `ml`: `amount / 100`.
- `per_unit` con receta `ud`: `amount`.
- `per_100g` con receta `ud`: `amount * approximateEdibleWeight_g_per_unit / 100`.

Dividir los totales por `baseServings`. **No** mezclar el cálculo de receta base con las raciones personalizadas del planificador, las sesiones deportivas o las comidas ya registradas.

Asignar a la receta trazabilidad de sus ingredientes: porcentaje estimado de energía proveniente de alimentos aún sin fuente contrastada; registrar fuentes faltantes por ID. Es un indicador de incertidumbre, no un error aritmético.

### 5.2 Revisión culinaria

Para cada receta verificar: nombre y `mealType`; cantidad base razonable y porción representada; ingredientes mencionados en los pasos y viceversa; tiempos **activos** frente a **espera/reposo/horneado**; utensilios/pasos ejecutables; conservación, seguridad alimentaria cuando corresponda; definición de pesos crudos, cocidos, escurridos o comestibles; observaciones de presentación; y descripción cuando aporte utilidad real.

No asignar un objetivo mínimo universal de proteínas/kcal a todas las cenas o snacks. Evaluar cada receta dentro de su tipo y de la naturaleza de Menuki, que adapta las porciones al perfil y al resto del día. No afirmar beneficios clínicos ni seguridad frente a alergias sin un sistema de datos apropiado.

### 5.3 Duplicados y diversidad

Buscar coincidencia exacta del conjunto de `foodId` y similitud de nombre/cantidades para crear **grupos de revisión**, no para borrar automáticamente. Conservar variantes que tengan propósito claro (porción ligera/completa, ingredientes/técnicas diferentes). Proponer consolidación solo con justificación y análisis de IDs históricos.

Analizar distribución por categoría, repetición de ingredientes dominantes, recetas extremadamente complejas para el tiempo declarado, variedad real y datos incompletos. **No imponer objetivos arbitrarios** de número de recetas.

## 6. Riesgo, clasificación y evidencia

Distinguir siempre:

- `CONFIRMADO`: discrepancia comprobada contra el contrato o una fuente comparable y documentada.
- `CANDIDATO`: anomalía estadística, repetición aparente o posible dificultad culinaria pendiente de validar.
- `SIN_EVIDENCIA`: no se pudo comprobar el dato; fuente inaccesible, identificación ambigua o licencia no clara.
- `DECISION_PENDIENTE`: hay varias políticas razonables; requiere decisión del propietario (y revisión profesional cuando afecte a salud).

Prioridades:

- **P0:** incoherencia que puede causar consumo inseguro o corrupción grave de datos si se demuestra; justificar y no etiquetar como P0 por mera intuición.
- **P1:** error confirmado con impacto significativo en macros, unidades, compra o recetas usadas.
- **P2:** problema acotado de calidad, trazabilidad, coherencia culinaria o UX informativa.
- **P3:** mejora opcional de contenido/metadatos.

Registrar siempre: ID, ubicación, evidencia actual, fuente externa (si aplica), comparación, tipo/estado, impacto, recomendación, riesgo de regresión, confianza y pregunta/decisión requerida.

## 7. Fases y entregables

| Etapa | Trabajo | Resultado | Aprobación necesaria |
| --- | --- | --- | --- |
| 0 | Verificar `dev`, estado del repositorio, docs y versión | Contexto reproducible y alcance | No para lectura; respetar `AGENTS.md` para la rama |
| 1 | Auditoría automatizable 90/90 y 112/112 | Inventarios y métricas reproducibles | No |
| 2 | Contrastar fuentes **por lotes**, comenzando por los 15–20 alimentos con mayor exposición | Matrices con URLs y confianza; resto marcado pendiente | No; marcar pendientes sin inventar |
| 3 | Priorizar y sintetizar | Hallazgos P0-P3, preguntas y pruebas propuestas | No |
| 4 | Decisión del propietario | Lista de cambios aprobados/rechazados | **Sí** |
| 5 | Correcciones en tarea/PR independiente | Diffs pequeños, regresión y catálogo versionado | **Sí** |

**Entregables de la etapa 1-3:** `results/summary.md`, `results/foods-audit.csv`, `results/recipes-audit.csv`, `results/findings.md`, `results/decisions.md`; formatos en [`02-plantillas-resultados.md`](02-plantillas-resultados.md). No es necesario comprobar 90 fuentes externas en una sola ejecución: comenzar por un lote de 15–20 alimentos de mayor exposición y completar los restantes de forma incremental. Registrar qué filas tienen `pending_source` y no presentar la verificación externa como completa antes de terminar todas.

## 8. Pruebas de regresión propuestas para una futura corrección

Primero ejecutar `npm test` (Node.js >=20), observar la validación actual de `js/data/catalogs.js` y revisar `tests/catalogs.test.js`. **No modificar tests durante la fase read-only de auditoría.** Registrar los controles que sería útil añadir después:

- Carga válida de ambos esquemas y `catalogVersion` idéntica.
- IDs y `foodId` estables, referencias sin huérfanos, unidades y bases compatibles.
- Conversión de `ud` a gramos y viceversa, medias frutas y rebanadas de pan, compra/despensa y cantidades por ración.
- Comprobación de valores finitos/no negativos y alertas de plausibilidad con **revisión manual**, sin rechazos basados únicamente en 4/4/9.
- Análisis de duplicados **informativo**, no bloqueante.
- Pruebas de impacto sobre valores mostrados, menús planificados, porciones y consumos históricos si llega a aprobarse una modificación.

## 9. Criterios de cierre de la auditoría

- Inventario íntegro: **90/90 alimentos y 112/112 recetas o sus cantidades actualizadas** en el commit auditado, sin filas omitidas.
- Cada alimento clasificado por fuente y grado de coincidencia; las fuentes no accesibles permanecen explícitamente pendientes.
- Cada receta evaluada en números y coherencia culinaria, con prioridad al menos provisional y evidencia enlazada.
- Tabla de métricas iniciales reproducibles, de anomalías confirmadas y de candidatos, separadas sin confusión.
- Registro claro de las decisiones no aceptadas (prioridad global de fuentes, umbrales, cambios de esquema).
- **Ningún** cambio en `data/`, runtime, schemas, tests, base de datos o despliegue durante esta fase; no commits ni push sin autorización.

## 10. Referencias para contraste (no decisiones aprobadas)

- USDA FoodData Central: https://fdc.nal.usda.gov/ y descargas: https://fdc.nal.usda.gov/download-datasets/
- BEDCA, base española: https://www.bedca.net/ (verificar derechos de reutilización de datos)
- Open Food Facts, licencia y condiciones de base de datos: https://openfoodfacts.github.io/openfoodfacts-server/api/tutorials/license-be-on-the-legal-side/
- Reglamento (UE) 1169/2011, anexo XIV sobre factores energéticos: https://www.boe.es/buscar/doc.php?id=DOUE-L-2011-82311

Estas referencias sirven para localizar y validar datos y su metodología. **No** autorizan copiar en bloque datos con licencias incompatibles, ni convierten una comparación teórica en diagnóstico clínico.
