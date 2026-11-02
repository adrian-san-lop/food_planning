# Cierre de la iteración nutricional — 19/10/2026

**Comprobaciones finales completadas.** Catálogos 0.9.3; 90 alimentos, 112 recetas y 543 referencias. Sin nueva auditoría, nuevas fuentes, nuevos CSV ni cambios funcionales. Rama de cierre `fix/catalog-iteration-closure`.

## Estado Git y diff revisado

Al empezar el cierre, el checkout estaba limpio en `dev`, HEAD `527e5d9` (`fix/fodd-catalogue`), que ya contenía los cambios anteriores. Se revisa ese commit contra `c630973` y el diff local de cierre. Tras actualizar referencias, dev y origin/dev coincidían; se creó la rama con el script del repositorio. No se ha hecho commit, push, merge, PR ni publicación durante este cierre. La existencia previa del commit no es una operación realizada por este cierre ni prueba del estado del despliegue.

## Huevo L: coherencia de las cuatro magnitudes

Las cuatro cifras salen del mismo registro **USDA SR Legacy FDC 171287 / NDB 01123, huevo entero crudo fresco**, por 100 g comestibles. Se multiplican por 0,6 y se redondean a dos decimales:

| Magnitud | Fuente por 100 g | Cálculo por 60 g | Catálogo por unidad L |
| --- | ---: | ---: | ---: |
| kcal | 143 | 85,8 | 85,8 |
| Proteína (g) | 12,56 | 7,536 | 7,54 |
| Hidratos (g) | 0,72 | 0,432 | 0,43 |
| Grasa (g) | 9,51 | 5,706 | 5,71 |

La guía del Instituto del Huevo respalda la aproximación de 60 g comestibles de clase L; no se toma de ella una energía independiente ni se mezclan tablas para los macros. Las cuatro magnitudes se calculan exclusivamente desde USDA. Ambas fuentes ya habían sido contrastadas y documentadas; este cierre comprueba coherencia sobre esa evidencia, no afirma una nueva verificación online. Los 60 g son una referencia aproximada, no una medición de cada unidad.

La prueba final comprueba las 112 recetas y detecta exactamente **16 con huevo**. Para cada nutriente, el delta es `huevos / baseServings × (valor nuevo − anterior)`. Incremento por huevo: +13,8 kcal, +1,24 g proteína, +0,03 g hidratos y +0,71 g grasa. Hasta +27,6 kcal en las recetas de dos huevos. Los dos informes JSON de impacto existentes siguen vigentes sin regenerarlos.

Recetas afectadas por el huevo:

- `huevos_pan_kiwi`.
- `lentejas_huevo`.
- `tortilla_atun`.
- `crema_tortilla`.
- `alubias_huevo`.
- `tortilla_patata_atun`.
- `crema_calabaza_pavo`.
- `huevos_alubias`.
- `alubias_revuelto`.
- `tortitas_atun`.
- `tostada_huevo_pavo`.
- `tostada_aguacate_huevo`.
- `snack_tostada_huevo`.
- `huevo_fruta`.
- `tostada_tofu_revuelto`.
- `desayuno_tostada_aguacate_pavo_huevo`.

## Ocho fichas similares

Se corrige únicamente la descripción para expresar las cantidades reales de cada ración. Se mantienen ingredientes, cantidades, tipos de comida, IDs y los cuatro totales nutricionales frente a L3:

| ID | Descripción final |
| --- | --- |
| `bocadillo_pavo` | 2 rebanadas de pan integral con 80 g de pavo loncheado y 80 g de tomate fresco. |
| `bocadillo_pavo_peq` | 2 rebanadas de pan integral con 80 g de pavo loncheado y 60 g de tomate fresco. |
| `yogur_fruta` | 170 g de yogur natural alto en proteínas con 1 pieza de fruta de temporada. |
| `yogur_platano_simple` | 170 g de yogur natural alto en proteínas con 1 plátano. |
| `snack_pavo_tostada` | 2 rebanadas de pan integral con 85 g de pavo loncheado y 80 g de tomate fresco. |
| `snack_yogur_platano` | 190 g de yogur natural alto en proteínas con 1 plátano. |
| `mini_pavo_tomate` | 2 rebanadas de pan integral con 50 g de pavo loncheado y 80 g de tomate fresco. |
| `yogur_fruta_ligero` | 140 g de yogur natural alto en proteínas con 1 pieza de fruta de temporada. |

No se fusionan ni eliminan recetas. La prueba exige ocho fichas, descripciones distintas dentro de cada preparación y cantidades descritas iguales a las cantidades JSON. Se actualiza el manifiesto existente; no se crean nuevos CSV ni se modifica ninguna tabla nutricional durante este cierre.

## Condimentos, compra, despensa y planificación

Aceite, cayena, salsa de soja y vinagre cuantificados conservan su aporte. Una prueba explícita pasa cada cantidad real por el cargador y servicio nutricional de la aplicación y compara los cuatro nutrientes. Los opcionales sin cantidad definida siguen fuera del cálculo. Se elimina de la documentación vigente la tarea de excluir condimentos cuantificados.

El diff de la iteración no cambia `js/`, HTML, CSS, esquemas ni Supabase. Todos los IDs, unidades de compra/receta, pesos por pieza, paquetes y cantidades de ingredientes coinciden con el baseline original. Por ello no cambia la conversión física ni se introducen migraciones de compra/despensa. Las estimaciones corregidas sí pueden modificar raciones propuestas por el ajuste automático existente; es el efecto esperado de mejorar sus tablas, no una modificación del algoritmo. Las comidas registradas conservan sus cantidades fijadas.

**Límite comprobado del historial:** `recipeUsage`, `dayCalc` y `completedDayCalc` usan las cantidades guardadas y la tabla FOOD vigente. Los IDs, cantidades y movimientos históricos no se reescriben, pero sus kcal/macros mostrados pueden cambiar tras corregir el catálogo. No existe snapshot inmutable de los cuatro totales. Una prueba documenta que una cantidad histórica de dos huevos sigue siendo dos huevos y se muestra con 171,6 kcal, frente a las antiguas 144. Si se exige congelar la nutrición histórica, hace falta otro cambio funcional con sus snapshots; no se ha alterado aquí ni se declara resuelto.

## Verificación de cierre

- `npm test`: **50/50 pruebas superadas**, sin fallos ni omisiones. Incluye inventario, reversos idempotentes, conciliación, snapshots relacionales, cantidades fijas, contratos y los nuevos controles de cierre.
- Ambos catálogos cumplen sus JSON Schema originales con `jsonschema`.
- `node scripts/catalog-audit.mjs` y `node scripts/catalog-audit.mjs --since-l3`: informes existentes vigentes; 26 recetas cambian acumuladamente desde 0.9.1 y 16 desde L3.
- Diff y cambios de objetos comprobados contra el baseline: solo campos documentados, sin modificaciones de runtime ni datos personales. Comprobación de espacios del diff correcta.

## Cambios y pendientes reales

En el cierre no se cambian valores de `foods.json`. Se confirman los seis alimentos corregidos durante la iteración: huevo L, edamame, lenteja roja seca, solomillo de cerdo, pavo picado y maíz escurrido. Acumulado: 17 fuentes integradas, 25 recetas mejoradas documentalmente y 26 con diferencias nutricionales. Las ocho descripciones corregidas aquí no añaden cambios numéricos.

Los estados finales de F-001 a F-020 están en [findings.md](findings.md): corregido, revisado sin cambio o pendiente por falta de evidencia. No se convierten los 73 close en validaciones exactas. Las fuentes sin equivalencia suficiente, rendimientos/densidades no contrastados y procedencias heredadas se conservan como límites de evidencia; no disparan nuevas búsquedas ni requieren marcas al propietario para cerrar esta iteración.

No hay una aprobación por alimento pendiente. Solo haría falta un encargo separado si se pretende congelar los totales nutricionales históricos o fusionar físicamente las fichas de recetas preservando referencias. Ninguna de esas tareas bloquea el cierre documental y de datos actual.

## Archivos modificados en este cierre

- `data/recipes.json`.
- `tests/catalog-audit.test.js`.
- `docs/audits/catalog-quality/results/source-data/catalog-changes.json`.
- `docs/audits/catalog-quality/results/summary.md`.
- `docs/audits/catalog-quality/results/findings.md`.
- `docs/audits/catalog-quality/results/decisions.md`.
- `docs/decisions/0045-generic-catalog-and-measurement-conventions.md`.
- `docs/planner/specification.md`.
- `docs/open-questions.md`.
- `context/context.md`.

La iteración anterior, ya presente en el commit 527e5d9, afectó estos archivos (incluye evidencias y snapshots estáticos):

- `README.md`.
- `context/context.md`.
- `data/foods.json`.
- `data/recipes.json`.
- `docs/audits/catalog-quality/README.md`.
- `docs/audits/catalog-quality/results/automation-status.json`.
- `docs/audits/catalog-quality/results/decisions.md`.
- `docs/audits/catalog-quality/results/findings.md`.
- `docs/audits/catalog-quality/results/foods-audit.csv`.
- `docs/audits/catalog-quality/results/recipe-impact-l4.json`.
- `docs/audits/catalog-quality/results/recipe-impact.json`.
- `docs/audits/catalog-quality/results/recipes-audit.csv`.
- `docs/audits/catalog-quality/results/source-data/baseline-catalogs.json`.
- `docs/audits/catalog-quality/results/source-data/catalog-changes.json`.
- `docs/audits/catalog-quality/results/source-data/l2-foods-audit.csv`.
- `docs/audits/catalog-quality/results/source-data/l2-recipes-audit.csv`.
- `docs/audits/catalog-quality/results/source-data/l3-state.json`.
- `docs/audits/catalog-quality/results/source-data/source-plan.json`.
- `docs/audits/catalog-quality/results/source-data/usda-records.json`.
- `docs/audits/catalog-quality/results/summary.md`.
- `docs/decisions/0045-generic-catalog-and-measurement-conventions.md`.
- `docs/open-questions.md`.
- `docs/planner/specification.md`.
- `docs/roadmap.md`.
- `scripts/catalog-audit.mjs`.
- `scripts/collect-nutrition-sources.py`.
- `scripts/update-catalog-audit.py`.
- `tests/catalog-audit.test.js`.
- `tests/catalogs.test.js`.
- `tests/run.js`.

SHA256 vigentes:

- `data/foods.json`: `c09b5ed6baa04643b7388cecfdc665216930342977075abe3692e223ad85d5be`.
- `data/recipes.json`: `265fa3f264be152b0c200d473f233afb73b5de16c7da6a8576679dce39a6be1a`.

---

## Historial anterior al cierre — estados y hashes históricos

# Actualización vigente L4 — confirmaciones aplicadas, 19/10/2026

Catálogos **0.9.3 local**, misma rama `docs/catalog-quality-audit`. El propietario confirma catálogo genérico, huevo L, pesos en crudo, conservas escurridas y alitas con hueso; café y tiempos actuales se conservan. No se necesitan marcas. Véase [ADR-0045](../../../decisions/0045-generic-catalog-and-measurement-conventions.md) y [decisiones vigentes](decisions.md). Los apartados L3/L2/L1 inferiores son historial y sus estados pendientes ya no sustituyen estas confirmaciones.

## Aplicado en esta continuación

- **Huevo L por unidad:** antes 72 kcal / 6,3 g proteína / 0,4 g hidratos / 5 g grasa; ahora **85,8 / 7,54 / 0,43 / 5,71**. Se usa FDC 171287 crudo por 100 g × 0,6, redondeado a dos decimales. El Instituto de Estudios del Huevo documenta aproximadamente 60 g comestibles para clase L, en la p. 16 impresa de [su guía](https://www.institutohuevo.com/wp-content/uploads/2021/10/Manejo-del-huevo-y-los-ovoproductos-en-la-cocina.pdf). No equivale a afirmar que cada huevo pesa exactamente eso ni a usar los 50 g de la porción large USDA. La compra y receta siguen en unidades, sin cambiar pesos por pieza preexistentes.
- **Tres preparaciones coincidentes, ocho fichas:** pan con pavo loncheado y tomate (cuatro); yogur con fruta de temporada (dos); yogur con plátano (dos). Se añaden descripciones comunes dentro de cada preparación y distintas entre ingredientes diferentes. Mantienen sus IDs y cantidades. No se han eliminado recetas ni fusionado referencias de menús o históricos: una única presentación por preparación necesitaría cambios de compatibilidad fuera de esta corrección de datos.
- **Convenciones documentadas:** crudo antes de cocinar, conservas escurridas, alitas con hueso; alimentos ya comprados preparados mantienen esa forma. Café y tiempos intactos. Representación genérica, sin pedir información de marcas al propietario.

## Impacto y validación

La nueva estimación del huevo afecta **16 recetas**, con +13,8 kcal por huevo y hasta **+27,6 kcal por ración base**. El antes/después de esta continuación está en [recipe-impact-l4.json](recipe-impact-l4.json), con baseline L3 preservado en `source-data/l3-state.json`. Puede reproducirse con `node scripts/catalog-audit.mjs --since-l3 --write` y comprobarse sin `--write`.

Acumulado desde 0.9.1: **6 alimentos con cambios numéricos, 17 textos de fuente mejorados, 25 recetas con mejoras documentales y 26 recetas con diferencias nutricionales**. Se mantienen 90 alimentos, 112 recetas y 543 referencias. Cobertura: **73 close**, cinco no comparables y 12 sin fuente suficiente; cero exact respecto de un producto comprado. 53 recetas conservan energía de alimentos sin contraste suficiente. Los 56 close que no sustentan sustitución no pasan a ser datos certificados por aceptar genéricos.

**47/47 pruebas superadas**, incluidos los contratos completos y cálculo independiente de las 112 recetas, conversión explícita del huevo, familias por ingredientes y los dos informes de impacto. Ambos JSON Schema originales correctos. Cantidades, unidades, pesos existentes, lógica del planificador y Supabase intactos.

## Límites concretos

- **Condimentos:** la preferencia del propietario es omitirlos. Las especias opcionales no cuantificadas ya están fuera del cálculo. Cayena, salsa de soja y vinagre sí son ingredientes cuantificados y el runtime los suma. Omitirlos requiere modificar la lógica funcional, excluida del encargo; no se ha modificado ni se han falsificado sus tablas nutricionales a cero. Esta preferencia está registrada como aceptada, pendiente de implementación. El aceite sigue siendo un ingrediente energético cuantificado.
- La confirmación de escurrido/hueso elimina la duda de uso, pero no certifica un rendimiento de compra concreto ni una tabla por peso escurrido que la fuente no especifique.
- Los ejemplos de marcas no definen el catálogo. Donde no existe una referencia genérica comparable se conserva el valor y su incertidumbre, sin requerir al propietario una compra concreta.
- La consolidación visual de recetas coincidentes permanece separada de la identificación documental para conservar IDs y cantidades. D-08 no se ha convertido en una tolerancia universal aprobada.

SHA256 vigentes:

- `data/foods.json`: `c09b5ed6baa04643b7388cecfdc665216930342977075abe3692e223ad85d5be`.
- `data/recipes.json`: `066da82f7f979090cc9e83fe0a7af8ffc703b1abdbb7b71f6d86d11a878c6bf0`.

Sin commit, push, merge, PR ni publicación.

---

## Historial L3 y anteriores

# Mejora comprobada de los catálogos — fase L3

**Estado vigente: 19/10/2026, versión 0.9.2 local.** Se ha ejecutado la petición del propietario de corregir errores demostrados y documentación culinaria. Esta autorización sustituye el alcance de solo lectura de L1/L2 para estas correcciones concretas; D-01 a D-08 siguen propuestas pendientes.

La rama sigue siendo `docs/catalog-quality-audit`, HEAD `c630973d2656f9e0b74a777aef10fe7ba60ebc6f`. Al empezar solo estaban pendientes los cinco informes sin seguimiento de la misma auditoría. Se han preservado. No se ha hecho commit, push, merge, PR ni publicación.

## Resultado aplicado

- Se conservan 90 alimentos, 112 recetas y 543 referencias, todos los IDs, unidades, bases nutricionales, pesos por pieza, formatos de compra, cantidades y raciones base.
- Cinco alimentos corregidos con registros genéricos USDA de preparación suficientemente equivalente y fuente previa USDA. Once alimentos más conservan sus cifras, que reproducen redondeos de registros ahora identificados. Dieciséis textos `nutritionSource` mejorados.
- Dieciocho recetas con documentación mejorada; 16 resuelven destinos de aceite/salsa de soja. Tres aclaraciones sobre alternativas se solapan en una de esas 16.
- Diez recetas cambian de composición por las correcciones de alimentos. No se ajustan cantidades ni objetivos del planificador.

## Qué valores han cambiado y por qué

Por 100 g comestibles; vector **kcal / proteína / hidratos / grasa**, los tres últimos en gramos. Solo se sustituyen los campos del manifiesto; se conservan otros redondeos aproximados.

| Alimento | Antes | Ahora | Registro y justificación |
| --- | --- | --- | --- |
| Edamame sin vaina cocido (congelado) (`edamame`) | 121 / 12.1 / 8.9 / 5.2 | 121 / 11.91 / 8.9 / 5.2 | [FDC 168411](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip), NDB 11212. Preparado congelado sin vaina; proteína 12,1 no coincide con 11,91 ni su redondeo a un decimal. |
| Lentejas rojas secas (`redLentilsDry`) | 352 / 24.6 / 63.1 / 1.1 | 358 / 23.91 / 63.1 / 2.17 | [FDC 174284](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip), NDB 16144. Lenteja roja seca: tabla previa combina aproximaciones de lenteja genérica con hidratos del registro rojo. |
| Solomillo de cerdo fresco (`porkTenderloin`) | 120 / 22.2 / 0 / 3.5 | 120 / 20.65 / 0 / 3.5 | [FDC 168312](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip), NDB 10218. Misma preparación y energía/grasa de 168312; proteína previa 22,2 no reproducible frente a 20,65. |
| Pavo picado magro crudo (`turkeyMince`) | 150 / 19.7 / 0 / 7.7 | 150 / 18.73 / 0 / 8.34 | [FDC 172850](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip), NDB 5665. Fuente declarada 93% magro; proteína/grasa previas reproducen otro registro (171505), no el 172850 declarado. |
| Maíz dulce en conserva, escurrido (`cornCanned`) | 86 / 3.2 / 19 / 1.2 | 67 / 2.29 / 14.34 / 1.22 | [FDC 169214](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip), NDB 11172. Forma explícita conserva escurrida; 86 kcal/19 g no corresponden al registro de sólidos escurridos. |

Edamame: 12,1 no es el redondeo a un decimal de 11,91 (sería 11,9). Pavo picado: proteína 19,7 y grasa 7,7 reproducían aproximadamente el registro genérico 171505, mientras la fuente declaraba 93 % magro (172850); se conserva esa representación ya declarada. Solomillo: se usa carne magra y grasa separables crudas, coherente con la referencia previa, sin sustituir por carne magra sola. Lenteja roja: se adopta la ficha específica roja seca, sin mezclar su hidrato con energía/macros de lenteja genérica. Maíz: se usa sólido escurrido en conserva, sin convertir peso con líquido ni maíz fresco.

USDA expresa los hidratos por diferencia, que pueden incluir fibra. No se restan fibras ni se armoniza automáticamente con hidratos disponibles de etiquetas UE. Estas correcciones reparan la trazabilidad de alimentos que ya declaraban USDA; no establecen una política nutricional global.

## Referencias identificadas

**16 alimentos con fuente integrada en el catálogo:** Tempeh (`tempeh`, FDC 174272), Edamame sin vaina cocido (congelado) (`edamame`, FDC 168411), Lentejas rojas secas (`redLentilsDry`, FDC 174284), Solomillo de cerdo fresco (`porkTenderloin`, FDC 168312), Pavo picado magro crudo (`turkeyMince`, FDC 172850), Berenjena fresca (`eggplant`, FDC 169228), Coliflor fresca (`cauliflower`, FDC 169986), Lombarda fresca (`redCabbage`, FDC 169977), Puerro fresco (`leek`, FDC 169246), Apio fresco (`celery`, FDC 169988), Maíz dulce en conserva, escurrido (`cornCanned`, FDC 169214), Semillas de chía (`chiaSeeds`, FDC 170554), Pipas de calabaza peladas (`pumpkinSeeds`, FDC 170556), Queso cottage bajo en grasa (`cottageCheese`, FDC 328841), Ajo fresco (`garlic`, FDC 169230), Remolacha cocida en tiras (`beetroot`, FDC 169146).

La equivalencia se refiere al genérico y su preparación, no a una garantía analítica sobre el producto comprado. Los once sin cambio numérico tienen una prueba de redondeo decimal campo por campo; no se aplica una tolerancia nutricional universal.

- Revisión de los 90 IDs frente al plan semántico explícito. Archivos oficiales accesibles: **7.793 registros SR Legacy y 363 Foundation**; extracción seleccionada de **76 fichas primarias (74 SR Legacy y 2 Foundation; 73 referencias principales y tres alternativas explicativas)**, con FDC, NDB cuando existe, preparación, tipo, publicación, nutrientes, unidades e identificadores de las filas.
- **72 alimentos disponen de contraste comparable close**, frente a 12 en L2. De ellos, 16 sustentan una corrección o redondeos existentes; los otros 56 conservan incertidumbres. **0 exact** respecto del producto comprado: no confundir fuente identificada con exactitud del catálogo.
- **6 no comparables** y **12 sin referencia suficientemente identificable**. No se certifica la búsqueda de estos 18 como verificación nutricional.
- Se reutilizan las fichas L1 de Danone, CLA y Bimbo sin repetir búsquedas. El contraste Brillante se conserva en el histórico y se añade arroz genérico USDA como alternativa cercana; no se cambia el arroz.
- Mozzarella fresca: [Galbani](https://galbani.es/quesos-galbani/galbani-mozzarella-fresca-bola-100g-y-125g/) coincide con 220/17/2/16. Gulas: [La Gula del Norte Natural](https://laguladelnorte.es/producto/natural/) coincide con 163/9,5/7,8/10. Son ejemplos de marca, no equivalencia exacta del genérico; se conservan valores y no se sustituyen otras marcas.
- USDA: datos de dominio público/CC0, atribución USDA ARS. Etiquetas de fabricante y BEDCA: derechos reservados; no se ha aclarado reutilización masiva y no se construye con ellas un catálogo de marcas. El índice BEDCA abre, pero no permite verificar la ficha de queso curado; la fuente secundaria no la sustituye.

Las páginas de detalle FDC 168411 y 174284 no fueron accesibles con el visor web; no se han tratado como fichas web leídas. Los valores se comprobaron directamente en el archivo oficial descargable, que sí fue accesible, con sus identificadores de fila. Los enlaces de referencia de los CSV apuntan al archivo efectivamente leído. Las descargas, fecha/hora UTC de lectura y SHA256 están en [usda-records.json](source-data/usda-records.json); SR Legacy es la edición final de abril de 2018, publicada en FDC en 2019, no datos nuevos de 2026. Foundation corresponde al archivo de abril de 2026 y conserva la publicación individual. [Documentación de tipos USDA](https://fdc.nal.usda.gov/data-documentation/) y [descargas oficiales](https://fdc.nal.usda.gov/download-datasets/).

## Recetas mejoradas

- `crema_tortilla`: Se explicita el destino del aceite o de la salsa ya cuantificados.
- `pavo_arroz_tomate`: Se explicita el destino del aceite o de la salsa ya cuantificados.
- `wok_pollo_fideos`: Se explicita el destino del aceite o de la salsa ya cuantificados.
- `pollo_esparragos`: Se explicita el destino del aceite o de la salsa ya cuantificados.
- `arroz_gambas_guisantes`: Se explicita el destino del aceite o de la salsa ya cuantificados.
- `crema_calabaza_pavo`: Se explicita el destino del aceite o de la salsa ya cuantificados.
- `cuscus_pollo`: Se explicita el destino del aceite o de la salsa ya cuantificados.
- `huevos_alubias`: Se explicita el destino del aceite o de la salsa ya cuantificados.
- `trucha_patatas`: Se aclara la alternativa sin darla por equivalente.
- `wrap_pavo`: Se explicita el destino del aceite o de la salsa ya cuantificados.
- `hamburguesa_pavo`: Se explicita el destino del aceite o de la salsa ya cuantificados. El nombre pasa de «Hamburguesa de pavo con patata y ensalada» a «Bocadillo de pavo con patatas» para corresponder a los filetes del ingrediente canónico; ID intacto.
- `alubias_revuelto`: Se explicita el destino del aceite o de la salsa ya cuantificados.
- `snack_pavo_tostada`: Se aclara la alternativa sin darla por equivalente.
- `comida_soja_berenjena_arroz`: Se explicita el destino del aceite o de la salsa ya cuantificados.
- `comida_guiso_lenteja_roja`: Se explicita el destino del aceite o de la salsa ya cuantificados.
- `cena_berenjena_rellena_ternera`: Se explicita el destino del aceite o de la salsa ya cuantificados.
- `cena_crema_coliflor_lenteja`: Se explicita el destino del aceite o de la salsa ya cuantificados.
- `cena_pavo_alubias_lombarda`: Se explicita el destino del aceite o de la salsa ya cuantificados.

Los textos antes/después están en [catalog-changes.json](source-data/catalog-changes.json). La revisión es documental; no se ha cocinado ni cronometrado cada receta.

## Efecto nutricional por ración base

Se recalculan las 112 recetas completas antes y después. Se muestran las diez con cambios; las otras 102 conservan sus cuatro totales. Los cambios solo de instrucciones tienen impacto numérico cero.

| Receta | Δ kcal | Δ proteína (g) | Δ hidratos (g) | Δ grasa (g) |
| --- | ---: | ---: | ---: | ---: |
| `media_edamame_soja` | +0.000 | -0.228 | +0.000 | +0.000 |
| `comida_guiso_lenteja_roja` | +3.600 | -0.414 | +0.000 | +0.642 |
| `comida_solomillo_coliflor_arroz` | +0.000 | -2.325 | +0.000 | +0.000 |
| `comida_bowl_tofu_edamame` | +0.000 | -0.133 | +0.000 | +0.000 |
| `comida_quinoa_alubias_maiz` | -9.500 | -0.455 | -2.330 | +0.010 |
| `tarde_tempeh_edamame` | +0.000 | -0.095 | +0.000 | +0.000 |
| `cena_solomillo_lombarda_boniato` | +0.000 | -2.170 | +0.000 | +0.000 |
| `cena_crema_coliflor_lenteja` | +2.400 | -0.276 | +0.000 | +0.428 |
| `cena_wok_tempeh_edamame` | +0.000 | -0.095 | +0.000 | +0.000 |
| `cena_pavo_alubias_lombarda` | -7.600 | -1.528 | -1.864 | +0.776 |

Los totales absolutos antes/después para cada receta y cada nutriente están en [recipe-impact.json](recipe-impact.json). Las kcal cambian entre −9,5 y +3,6 por ración; la mayor reducción de proteína es −2,325 g. Son efectos sobre recetas base futuras, no sobre comidas ya registradas ni un resultado clínico. No se ha tocado estado personal ni Supabase.

## Lo que sigue pendiente

- **6 bloqueos de base:** huevos (peso/tamaño), alubias blancas (conserva sin garantía de escurrido), café (sólido comprado frente a infusión), salsa de soja y vinagre (masa frente a volumen/densidad), alitas (rendimiento de compra con hueso frente a porción cocinada comestible). Mantienen valores y unidades.
- **12 sin fuente suficiente:** queso fresco, granola, tortilla integral, pavo loncheado, merluza, tomate triturado, frutos rojos, fruta de temporada, bacalao desalado/pescado blanco, fideos integrales, soja texturizada y queso curado. Se documenta el motivo individual en [source-plan.json](source-data/source-plan.json). Las mezclas y productos envasados requieren una formulación o etiqueta; no se puede deducirla por búsqueda numérica.
- **56 contrastes close conservados:** diferencias de variedad, especie, corte, formulación, grasa, cocción o método de hidratos impiden declarar errores. Incluyen alimentos relevantes como pollo, pavo en filetes, avena, salmón, aceite, nueces y patata. Referencia cercana no obliga a sustituirlos.
- **D-01 a D-08 continúan pendientes.** Requieren criterio del propietario: representación de genéricos/marcas, mezclas, variantes, pesos/tamaño, café, tiempos y condimentos opcionales. No se eliminan duplicados, rellenan descripciones vacías ni cambian tiempos por intuición.
- La cobertura de contraste no certifica todos los totales: **60 recetas** conservan energía de alimentos sin comparación válida; incluso las restantes usan genéricos/close.

La fase de corrección automática termina aquí con cambios comprobados y bloqueos explícitos. El siguiente avance requiere datos del propietario sobre los productos y convenciones pendientes; no otra tanda repetitiva de búsquedas de los mismos genéricos.

## Automatización y comprobaciones

- `python scripts/collect-nutrition-sources.py --refresh`: descarga oficial, extracción por IDs revisados, hashes y comprobación de nutrientes. Solo actualiza evidencia; nunca el catálogo. Sin credenciales ni búsquedas por coincidencia de cifras.
- `node scripts/catalog-audit.mjs --write`: recalcula y guarda impacto. Sin `--write` comprueba que el informe sigue vigente.
- `python scripts/update-catalog-audit.py`: reconstruye los CSV vigentes desde el histórico L2, el plan y los catálogos; conserva filas, IDs, cabeceras y el motivo histórico. Idempotente; nunca modifica los catálogos.
- `npm test`: **45/45 pruebas superadas**, 38 existentes y 7 nuevas. Cubren contratos completos contra baseline, cifras corregidas frente a fuente, redondeos explícitos, uso documental de condimentos con caso de fallo, conversiones por pieza/ración y acuerdo de los 112 cálculos con el cargador y servicio nutricional reales.
- `jsonschema`: ambos catálogos cumplen sus esquemas originales. Esquemas y lógica de aplicación intactos.
- 90 filas únicas de alimentos, 112 de recetas y 543 referencias comprobadas; informe de impacto vigente.

## Trazabilidad y alcance

Se conservan debajo todos los apartados L1/L2 como historia fechada. Sus estados «solo informes», cifras de cobertura y hashes describen aquellas fases. Los CSV originales L2 completos están en `source-data/l2-foods-audit.csv` y `source-data/l2-recipes-audit.csv`; el baseline íntegro de ambos catálogos está en `source-data/baseline-catalogs.json`. No contienen datos personales.

SHA256 actuales:

- `data/foods.json`: `bf6f0e130c5a6ce0a8a650a4e7f016c585d55ea8cad26922b1da16f6fd0fb925`.
- `data/recipes.json`: `2a66a5b546c173d4ed700aee03170091b6e18956b23811022d5befdfdffacec0`.

---

## Historial conservado L1/L2 — no representa el estado vigente

# Informe de auditoría de catálogos Menuki

Fecha de análisis: 2026-10-19
Repositorio: adrian-san-lop/food_planning
Rama de origen: dev
Commit de origen: c630973d2656f9e0b74a777aef10fe7ba60ebc6f
Versión foods / recipes: 0.9.1 / 0.9.1
Alcance: solo inventario/auditoría, sin cambios en catálogos.

Rama de informes: docs/catalog-quality-audit. Checkout inicial limpio, incluidos no seguidos. Tras git fetch origin, dev y origin/dev coincidían en el SHA de origen. El script de nueva rama se ejecutó desde ese dev. El primer fetch y creación de rama fallaron por permisos de .git; los reintentos autorizados funcionaron. No commit/push/PR/merge/stash/reset/rebase/worktree.

SHA256:
- data/foods.json: 1938d282eecb01b014e83b55a1a49005657f5b826cb77c23619e6b3351d54b6e
- data/recipes.json: eea5a7d1006b956fc8cd2eb7305bca010996c46608f28c81888469cbfad0d165

Contratos leídos: AGENTS.md, README.md, context/context.md, docs/planner/specification.md, docs/open-questions.md, docs/roadmap.md, docs/audits/catalog-quality/README.md, 01-plan-auditoria.md, 02-plantillas-resultados.md; data/foods.schema.json, data/recipes.schema.json, js/data/catalogs.js, tests/catalogs.test.js. Cálculo contrastado con js/domain/nutrition.js.

## Resumen

**Actualización vigente: lote L2, 19/10/2026.** Esta continuación conserva la rama y el commit de origen. Los cinco informes anteriores eran los únicos archivos pendientes; estaban sin seguimiento y se han actualizado dentro de la misma auditoría por autorización expresa. No se ha creado otra rama ni se han descartado cambios. D-01 a D-08 siguen Pendiente/Propuesto.

- Lote: **10 alimentos revisados de nuevo**, todos pertenecientes a los 20 investigados en L1; acumulado **20 alimentos distintos**, no 30.
- **Ocho avanzan a comparación close por masa:** patata, pavo, pechuga de pollo, avena seca, salmón, boniato, nueces y aceite.
- **Dos avanzan en identificación de fuente, sin comparación suficiente:** huevos por falta de tamaño/peso de la unidad y alubias por falta de garantía de base escurrida. Sus cifras de referencia no se restan de las actuales.
- Estado acumulado: **12 close (13, 3333% de 90), 75 pending_source y 3 not_comparable** (huevos, alubias y atún). **Ninguna coincidencia exact** ni validación exacta de la procedencia heredada.
- Se mantienen los **3 hallazgos confirmados P2** de L1; no hay nuevo error nutricional P0/P1 demostrado. Nuevas fichas: F-016 CANDIDATO, F-017 DECISION_PENDIENTE y F-018 SIN_EVIDENCIA.
- Inventario intacto: 90 alimentos, 112 recetas, 543 referencias; versiones 0.9.1. Las kcal/macros base, cantidades y revisión culinaria no cambian.
- Se actualiza la incertidumbre de **68 recetas** usando el mismo significado de L1: contraste comparable realizado, no certificación del valor actual. 111 recetas siguen con energía de ingredientes sin contraste comparable; yogur_nueces es la única con todos sus ingredientes contrastados close. Esto no constituye validación exacta de su nutrición.

## Hallazgos principales

| ID | Tipo | Prioridad | Estado | Objeto | Evidencia | Propuesta |
| --- | --- | --- | --- | --- | --- | --- |
| F-016 | food | P2 | CANDIDATO | Ocho comparaciones close del lote | Registros FDC/NDB y cuatro nutrientes leídos del archivo oficial CSV | Estudiar diferencias tras fijar forma y método; no sustituir datos |
| F-017 | food | P2 | DECISION_PENDIENTE | eggs | FDC 171287 por 100 g; porciones identificadas, unidad Menuki sin peso | Resolver tamaño de unidad con D-06; conservar 72 kcal/ud |
| F-018 | food | P2 | SIN_EVIDENCIA | beans | FDC 175204 canned sin garantía drained y fabricantes con denominador/base insuficiente | Obtener tabla explícita por 100 g escurridos |
| F-010, ampliación | food | P2 | DECISION_PENDIENTE | oliveoil | Nueva referencia por masa supera bloqueo g/ml para nutrición | Envase, densidad y representación AOVE siguen abiertos |
| F-013, ampliación | food | P2 | SIN_EVIDENCIA | Cobertura | 78 alimentos sin comparación close/exact, frente a 86 en L1 | Continuar lotes; no convertir trazabilidad en certeza |

Las fichas completas y la ampliación de F-010/F-013 están en [findings.md](findings.md#lote2). F-001 a F-015 se conservan como historial L1: las cifras de cobertura antiguas están fechadas y no son el estado vigente.

## Métricas de cobertura

| Métrica | Numerador | Denominador | % / Estado | Método de obtención |
| --- | ---: | ---: | --- | --- |
| Alimentos inventariados | 90 | 90 | 100% | IDs y filas conservados |
| Recetas inventariadas y recalculadas en L1 | 112 | 112 | 100% | Valores base conservados y contrastados en controles documentales L2 |
| Referencias de ingredientes | 543 | 543 | 100% | JSON original intacto |
| Alimentos revisados en L2 | 10 | 10 | 100% del lote | Diez registros SR Legacy identificados |
| Nuevas comparaciones close | 8 | 10 | 80% del lote | Misma base de masa; límites por forma/definición explícitos |
| Contrastes close acumulados | 12 | 90 | 13.3333% | 4 de L1 + 8 de L2 |
| Coincidencias exact | 0 | 90 | 0% | Registro exacto no equivale a alimento Menuki exacto |
| pending_source | 75 | 90 | 83.3333% | Estados vigentes de foods-audit.csv |
| not_comparable | 3 | 90 | 3.3333% | eggs/beans/tuna |
| Alimentos investigados distintos L1∪L2 | 20 | 90 | 22.2222% | L2 retoma10 de los20 anteriores |
| Recetas con indicador de incertidumbre actualizado | 68 | 112 | 60.7143% | Nuevos ocho close; mismo cálculo por ingrediente |
| Energía cubierta por contrastes close | 48.172009 | 100 | % de kcal base | Se suma aporte de 12 alimentos; no frecuencia de consumo |
| Recetas con energía sin contraste comparable | 111 | 112 | 99.1071% | yogur_nueces pasa a 0% de energía pendiente, sin validación exacta |
| Tests existentes | 38 | 38 | PASS histórico L1 | No se repite npm test por documentación; no se afirma nueva ejecución |

Los 12 close siguen siendo comparaciones cercanas. Los formatos comerciales y pesos por pieza no quedan verificados porque se haya leído un registro de composición por 100 g. El contador de páginas abiertas de L1 se conserva solo históricamente: el lote actual usa un archivo oficial compartido con diez registros, no diez páginas web supuestamente abiertas.

## Análisis de impacto

Se conserva el conjunto de una ración base de cada receta: **47179.06 kcal y3433.90165 g proteína**. Se mantienen presencia, aportes, score descriptivo y denominadores de L1. El lote prioriza alta exposición energética/proteica y problemas de unidad/preparación. No representa frecuencia real de consumo.

### Valores actuales y de referencia del lote

Orden de vectores: **kcal / proteína g / hidratos g / grasa g**. Todas las referencias se extraen de la descarga primaria enlazada abajo. Los números se muestran tal como figuran en el CSV, sin convertir la ración ni sobrescribir el catálogo.

| foodId | FDC / NDB | Base actual | Actual kcal/P/C/G | Base referencia | Referencia kcal/P/C/G | Comparabilidad |
| --- | --- | --- | --- | --- | --- | --- |
| eggs | 171287 / 01123 | per_unit | 72/6.3/0.4/5 | per_100g | 143/12.56/0.72/9.51 | not_comparable |
| potato | 170026 / 11352 | per_100g | 77/2/17/0 | per_100g | 77/2.05/17.49/0.09 | close |
| turkey | 174515 / 05710 | per_100g | 108/24/0/1.5 | per_100g | 114/23.34/0/2.33 | close |
| chicken | 171077 / 05062 | per_100g | 110/23/0/2 | per_100g | 120/22.5/0/2.62 | close |
| oats | 173904 / 08120 | per_100g | 370/13/59/7 | per_100g | 379/13.15/67.7/6.52 | close |
| salmon | 175167 / 15236 | per_100g | 205/20/0/13 | per_100g | 208/20.42/0/13.42 | close |
| sweetpotato | 168482 / 11507 | per_100g | 86/1.6/20/0.1 | per_100g | 86/1.57/20.12/0.05 | close |
| beans | 175204 / 16051 | per_100g | 110/7/17/0.5 | per_100g | 114/7.26/21.2/0.29 | not_comparable |
| walnuts | 170187 / 12155 | per_100g | 650/15/14/65 | per_100g | 654/15.23/13.71/65.21 | close |
| oliveoil | 171413 / 04053 | per_100g | 900/0/0/100 | per_100g | 884/0/0/100 | close |


### Diferencias válidas y límites

Δ=actual−referencia; porcentaje=100×Δ/referencia. Signos negativos indican cifra actual menor que la referencia elegida; no significan déficit nutricional ni error demostrado. El CSV conserva delta_kcal_absolute y delta_kcal_percent como magnitudes absolutas, según su contrato; los deltas firmados están en reason.

| foodId | Δ kcal | Δ kcal % ref | Δ proteína g (% ref) | Δ hidratos g (% ref) | Δ grasa g (% ref) |
| --- | ---: | ---: | --- | --- | --- |
| potato | +0.0000 | +0.0000% | -0.0500 (-2.4390%) | n/c | -0.0900 (-100.0000%) |
| turkey | -6.0000 | -5.2632% | +0.6600 (+2.8278%) | +0.0000 (n/d: referencia cero) | -0.8300 (-35.6223%) |
| chicken | -10.0000 | -8.3333% | +0.5000 (+2.2222%) | +0.0000 (n/d: referencia cero) | -0.6200 (-23.6641%) |
| oats | -9.0000 | -2.3747% | -0.1500 (-1.1407%) | n/c | +0.4800 (+7.3620%) |
| salmon | -3.0000 | -1.4423% | -0.4200 (-2.0568%) | +0.0000 (n/d: referencia cero) | -0.4200 (-3.1297%) |
| sweetpotato | +0.0000 | +0.0000% | +0.0300 (+1.9108%) | n/c | +0.0500 (+100.0000%) |
| walnuts | -4.0000 | -0.6116% | -0.2300 (-1.5102%) | n/c | -0.2100 (-0.3220%) |
| oliveoil | +16.0000 | +1.8100% | +0.0000 (n/d: referencia cero) | +0.0000 (n/d: referencia cero) | +0.0000 (+0.0000%) |


n/c significa comparación no homologada; n/d, denominador cero. En patata, avena, boniato y nueces no se calcula delta de hidratos como si ambas definiciones fueran equivalentes: USDA usa carbohydrate by difference, con fibra; el origen de los hidratos heredados de Menuki no está documentado. Se conservan los dos valores visibles, sin restar fibra ni inventar una normalización. Las diferencias de proteína y grasa se presentan como comparación nominal de esas definiciones, con la limitación de producto/forma y de método analítico. En aceite, proteína/hidratos/grasa son iguales y la diferencia de energía puede depender del método; no imponer900 ni884 automáticamente.

Patata y boniato coinciden en kcal, pero eso no valida macros, peso por pieza ni variedad. El pavo y pollo se comparan crudos y solo carne; el salmón se compara expresamente con atlántico de acuicultura, no con una mezcla indefinida de especies/orígenes.

### Cambios de estado y recomendación individual

| Alimento | Estado L1 → L2 | Recomendación y límite |
| --- | --- | --- |
| eggs | pending_source → not_comparable | Registro completo identificado, pero catálogo per_unit sin peso/calibre. USDA por 100 g y porciones comestibles de 38/44/50/56/63 g no fijan la unidad Menuki. Escenario ilustrativo large 50 g: 71.5 kcal, P6.28 C0.36 F4.755, NO adoptado ni usado para deltas o cobertura comparable. D-06 sigue pendiente. |
| potato | pending_source → verified_candidate_change | Comparación close con patata cruda, pulpa y piel. El catálogo no fija variedad/pelado y algunos pasos pelan; no equivale a validación exacta de la materia preparada. Porción USDA medium 213 g no valida ni sustituye 200 g/ud de compra. Hidratos por diferencia: definición del catálogo no documentada. |
| turkey | pending_source → verified_candidate_change | Pechuga de pavo de venta minorista, solo carne, cruda, sin added solution en denominación. Filetes del catálogo no fijan corte/piel explícitos: close, no exact. Elegido FDC 174515 por presentación retail, no por cercanía numérica. Alternativa whole breast FDC 171098 y productos con solución documentados en summary. |
| chicken | not_comparable → verified_candidate_change | Pechuga sin piel/hueso, solo carne, cruda; no se usa pollo entero de L1 ni carne cocida. Catálogo no explicita piel/hueso: close condicionado. No demuestra que el dato actual sea erróneo. |
| oats | pending_source → verified_candidate_change | Copos/cereal de avena regular/rápida, sin fortificar y seco. Descartadas avena cocida, instantánea fortificada y barras; no se usa marca QUAKER como genérico. C1005 es carbohydrate by difference, fibra10.1 g: no homologar a hidrato disponible ni restar fibra automáticamente. |
| salmon | pending_source → verified_candidate_change | Salmón atlántico de acuicultura crudo como comparación explícita, no identificación del salmón genérico. Alternativa atlántico salvaje FDC 173686 tiene otra composición; no se elige acuicultura por coincidencia de kcal. Especie/origen/peso antes o después de cocción siguen por definir. |
| sweetpotato | pending_source → verified_candidate_change | Boniato crudo sin preparar; close por alimento/base, variedad/pelado no fijados. Porción USDA de 5 pulgadas=130 g no valida250 g/ud del catálogo. Hidratos por diferencia y fibra3 g; sin homologación automática. |
| beans | pending_source → not_comparable | FDC 175204 conserva de alubia blanca, SIN garantía explícita de base escurrida en descripción/porción. No se equipara a beans escurridas. FDC 175203 hervida tampoco identifica la conserva. Fabricantes consultados ofrecen tablas con base o denominador insuficiente; sin deltas. F-018. D-01/D-06 pendientes. |
| walnuts | pending_source → verified_candidate_change | Nuez de nogal común en porción comestible, sin cáscara para la comparación por masa. El catálogo no define variedad/tostado: close, no exact. USDA carbohydrate by difference y fibra6.7 g; no homologar a hidratos disponibles. |
| oliveoil | not_comparable → verified_candidate_change | Aceite de oliva genérico por masa, no identificación de virgen extra ni envase 500 g. Se supera el bloqueo g/ml de L1 para contraste nutricional, sin convertir volúmenes ni validar envase. 884 frente 900 kcal no prueba error: no forzar4/4/9. D-06 comercial sigue pendiente. |


**Huevos:** USDA large50 g comestibles produce71.5 kcal, P6.28 C0.36 G4.755 por unidad de esa referencia; medium44 g produce62.92 kcal. Son escenarios documentados, no el peso elegido para Menuki. No se añaden deltas per_unit al CSV ni se cambia su peso/calibre. **Alubias:** no se compara 110 kcal escurridas con 114 canned mientras la preparación no esté homologada.

## Fuentes no disponibles y limitaciones

### Fuente primaria leída y reproducibilidad

- [Página oficial de descargas](https://fdc.nal.usda.gov/download-datasets/), consultada19/10/2026: SR Legacy release 04/2018.
- [Archivo CSV oficial efectivamente leído](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip): **6074592 bytes**, SHA256 **b80817294b8850530aaedf2e515c02593b1824f763a0ff356e5c2081643e6fd0**.
- [Archivo JSON oficial leído para comprobar formato](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_json_2018-04.zip): **13456312 bytes**, SHA256 **0fe8ae486a2c8eb42cb96413f058deb51863a46c8fb8eeb4b1fb45006dd338ef**. Miembro FoodData_Central_sr_legacy_food_json_2018-04.json.
- Archivos procesados en memoria, sin guardarlos ni importarlos al repositorio. Se filtran entradas de los diez alimentos y variantes pertinentes, no se investiga individualmente el resto del catálogo.
- Unir food.csv.fdc_id con sr_legacy_food.csv.fdc_id (NDB_number) y food_nutrient.csv.fdc_id. Filtrar nutrient_id1008 energía kcal, 1003 proteína g, 1005 hidratos por diferencia g, 1004 grasa g y1079 fibra g. Cada row ID de nutrientes queda conservado en foods-audit.reason junto al FDC, fecha y limitaciones.
- [Descripción oficial de campos](https://fdc.nal.usda.gov/docs/Download_Field_Descriptions_Oct2020.pdf), sección food_nutrient: amount por 100 g; [documentación SR](https://www.ars.usda.gov/ARSUserFiles/80400525/Data/SR-Legacy/SR-Legacy_Doc.pdf), sección4.5: valores por 100 g de porción comestible. Porciones de food_portion no son peso comprado con cáscara/hueso ni envase comercial equivalente.
- Las diez filas food.csv muestran publication_date2019-04-01: no confundir publicación/mapeo FDC con release 2018 ni con fecha de análisis del alimento. SR Legacy es histórico; esta auditoría no presume vigencia analítica2026.
- CSV tiene más precisión que JSON en algunos nutrientes: huevos P12.56/12.6, pavo P23.34/23.3, avena P13.15/13.2, nueces P15.23/15.2. Se usa **CSV de forma consistente**, sin seleccionar por conveniencia cifras de formatos distintos.

### Selección de variantes, sin buscar la cifra más cercana

- Pavo principal FDC 174515, retail breast meat only raw:114/P23.34/C0/G2.33. Whole breast FDC 171098:114/P23.66/C0.14/G1.48; con solución añadida FDC 174513:111/P21.99/C0/G2.53. No son intercambiables por proximidad numérica.
- Salmón de acuicultura FDC 175167:208/P20.42/C0/G13.42; salvaje atlántico FDC 173686:142/P19.84/C0/G6.34. La procedencia no está fijada por el ID salmon. Ninguna fila cocinada se usa para comparar gramos crudos.
- Avena principal FDC 173904 representa cereal seco regular/rápido sin fortificar; no se usan cereal cocido, grano genérico o barras.
- Alubias FDC 175204 canned:114/P7.26/C21.2/G0.29. FDC 175203 boiled without salt:139/P9.73/C25.09/G0.35, tampoco demuestra composición de conserva escurrida.

### Accesos y fuentes insuficientes

El navegador rechazó ZIP por contenido application/zip; eso es una limitación del visor, no fuente inaccesible. La lectura HTTPS local inicial falló por conexión restringida; la consulta autorizada leyó ambos archivos y el CSV permite comprobar los datos sin depender de extractos. Un intento de ruta web de huevo devolvió404 y no se usa como evidencia de contenido; reference_url apunta al ZIP que sí se leyó.

Para alubias se abrieron estas fuentes, sin conceder comparación válida:
- [Gvtarra, Alubias Blancas](https://www.gvtarra.com/nuestros-productos/la-mejor-legumbre/alubias-blancas/):400 g escurridos declarados y tabla114 kcal/P7.3/C16/G0, pero el texto no fija denominador100 g ni que esa tabla sea del peso escurrido.
- [Conservas JJJ, código 7002/EAN8427754070028](https://conservasjjj.com/wp-content/uploads/2023/06/Alubias-Blancas-3KG-1.pdf): ficha revisada14/05/2025, por 100 g de producto82 kcal/P5.5/C11/G<0.5; no identifica expresamente la base escurrida. No convertir <0.5 en0 ni usarla como marca genérica.
- [Ficha LUENGO, Rev9 noviembre 2021, EAN8410505271010](https://amh.es/wp-content/uploads/2024/04/ALUBIA-BLANCA-COCIDA-LUENGO-570-GR_806020062.pdf):570 g netos/400 g escurridos; 81 kcal/P5.3/C12/G0 en tabla sin denominador explícito. Documento atribuido al fabricante alojado por distribuidor; no se asume como etiqueta vigente.

[USDA](https://fdc.nal.usda.gov/) declara dominio público/CC0 y pide atribución. Esta condición se ha vuelto a consultar: no hay bloqueo de reutilización identificado para los datos USDA citados. Eso no aprueba D-01 ni garantiza equivalencia. Gvtarra muestra derechos reservados; no se han aclarado licencias de integración de las otras fichas comerciales y no se importan datos. Los fallos MAPA/PepsiCo y la fuente por volumen de L1 permanecen en el anexo; no se han vuelto a etiquetar como verificados por encontrar otra fuente.

## Plan de corrección recomendado (SIN IMPLEMENTAR)

1. Revisar la representación de pavo/pollo y distinguir corte, piel, adición de solución y peso crudo.
2. Fijar especie/origen y estado del salmón antes de adoptar una referencia.
3. Aclarar definición de hidratos y energía; no corregir avena por la resta simple con fibra.
4. Resolver tamaño de huevo mediante D-06; conservar por ahora sus72 kcal/ud.
5. Conseguir una etiqueta/ficha de alubias que diga explícitamente por 100 g escurridos.
6. Estudiar las diferencias de grasa del pollo/pavo y energía de aceite sin imponer tolerancias universales.
7. Mantener aproximaciones de pieza y formatos comerciales hasta validación independiente.
8. Conservar cantidades base, IDs, snapshots y pruebas de regresión para cualquier fase autorizada.

**Siguiente lote prioritario, hasta10:** cerrar eggs y beans; después granola, tuna, turkeySlice, hummus, lentils, chickpeas, coffee y banana. Se propone, no se ha investigado como lote nuevo en esta continuación. Las decisiones necesarias siguen D-01 (representación/fuente), D-04 (metadatos), D-05 (café), D-06 (unidad/forma/formatos) y D-08 (criterios). D-02/D-03/D-07 también siguen pendientes; ninguna se convierte en aceptada.

## Pruebas ejecutadas

En L2 se ejecutan controles documentales: cabeceras exactas, 90/112 filas e IDs, delta calculado con misma base, referencias oficiales identificadas, incertidumbre de recetas, preservación de macros base y huellas de catálogos. Se registra la salida tras la validación final.

No se ejecuta de nuevo npm test: las38 pruebas aprobadas son evidencia de L1. No cambia código, tests, schemas, datos originales ni Supabase.



### Validación documental L2

Se ejecutó Python mediante stdin para comparar las cabeceras con02-plantillas-resultados.md, recalcular nutrientes e incertidumbre desde los JSON originales, comprobar deltas e identidades FDC, verificar hashes y delimitar el estado Git. Resumen de los controles ejecutados, exit 0:

~~~text
Headers: exact; food rows: 90; recipe rows: 112
States: verified_candidate_change=12; pending_source=75; not_comparable=3
Recipe nutrients: 112 recomputed, unchanged
Uncertainty: 111 positive; yogur_nueces 0%, close only
Catalog hashes: PASS
Git scope: PASS; same branch and HEAD; only five reports pending
Changed rows: 10 foods / 68 recipes; untouched rows: 80 foods / 44 recipes
~~~

Los digests de filas anteriores se compararon antes/después: solo cambian los diez alimentos previstos y68 filas de trazabilidad de recetas. Se conservan cabeceras, orden e IDs. Las ocho decisiones mantienen Pendiente/Propuesto. Los campos reference_* vigentes de esos diez alimentos se acompañan de la referencia/estado L1 íntegros en reason. No hay nuevas recetas, migraciones, operaciones Supabase, commits, pushes, merges ni PR.

Comprobación reproducible de la fuente: leer la descarga CSV en memoria; verificar su SHA256; abrir food.csv, sr_legacy_food.csv, food_nutrient.csv y food_portion.csv; filtrar los FDC registrados. El archivo ZIP no necesita abrirse en el visor web para que su contenido sea verificable. Las cifras se transcriben del CSV con sus identificadores y unidades; no se han usado agregadores ni extractos como prueba de los nutrientes.

# Anexo histórico — Lote L1 (primera pasada conservada)

Los siguientes resultados y comandos son históricos. En cobertura, estados y comparaciones prevalece L2.

## Resumen

- Inventario **90 alimentos, 112 recetas, 543 referencias**, igual a la fotografía inicial; versión 0.9.1. Cero IDs/nombres exactos repetidos, huérfanos, unidades incompatibles o ingredientes repetidos dentro de receta.
- Fuentes declaradas: **62 legacy, 25 USDA, 2 manufacturer, 1 BEDCA**. Clasificación textual, no verificación.
- Lote externo **20**: **4 close, 3 no comparables, 13 sin contraste válido**; otros 70 no consultados individualmente. Total **83 pending_source y 3 not_comparable**.
- verified_candidate_change significa referencia comparable consultada y diferencia que revisar, **no error demostrado ni cambio aprobado**. Cero verified_keep/exact; ninguna procedencia original quedó exactamente validada.
- Recálculo/revisión documental **112/112**. **16** recetas con ausencia de destino explícito de ingrediente medido; **12** con candidato como estado principal. Hay 13 con algún candidato culinario al incluir hamburguesa_pavo, ya contada en confirmadas; unión **28 recetas distintas**.
- **3 fichas CONFIRMADO: P0=0, P1=0, P2=3, P3=0**. Tratan trazabilidad e instrucciones; ningún error nutricional significativo demostrado.
- Resto: **7 CANDIDATO, 2 SIN_EVIDENCIA, 3 DECISION_PENDIENTE**. Fichas y objetos afectados son magnitudes diferentes.
- Alta confianza en estructura/recuentos/cálculo; limitada en producto real, pesos, preparación, conservación y tiempos. No se cocinaron recetas ni se consultaron datos privados.
- 112 descripciones vacías válidas; un tip vacío; peanuts único alimento sin referencias en recetas. No se recomienda eliminar IDs.

## Hallazgos principales

| ID | Tipo | Prioridad | Estado | Objeto | Evidencia | Propuesta |
| --- | --- | --- | --- | --- | --- | --- |
| [F-001](findings.md) | food | P2 | CONFIRMADO | 62 foodId legacy; data/foods.json#/foods | 62 nutritionSource declaran estimación heredada y no incluyen registro ni URL individual. | Identificar fuentes por lotes, empezando por mayor energía/proteína. |
| [F-002](findings.md) | food | P2 | CONFIRMADO | 20 foodId con food-search y sin NDB; data/foods.json | 21 fuentes incluyen food-search; garlic sí declara NDB 11215. Otras 20 no fijan un FDC/NDB individual. | Documentar registro individual y forma antes de contrastar valores. |
| [F-003](findings.md) | recipe | P2 | CONFIRMADO | 15 recetas oliveoil y cena_pavo_alubias_lombarda soySauce; data/recipes.json | Quince recetas incluyen aceite medido sin mención aceite/aliña en steps. La cena de pavo/alubias incluye 4 ml de soja sin instrucción de uso. | Aclarar uso/reparto de lo cuantificado, sin añadir ni quitar cantidades. |
| [F-004](findings.md) | recipe | P2 | CANDIDATO | avena_nocturna_chia; tarde_skyr_chia_pasass; data/recipes.json | Avena: 5 min con reposo frío nocturno. Skyr/chía: 3 min con reposo de unos minutos. | Definir tiempo activo/total y aclarar espera antes de cambiar valores o esquema. |
| [F-005](findings.md) | recipe | P2 | CANDIDATO | DG-01/DG-02/DG-03; 8 recipeId en data/recipes.json | Cuatro bocadillos pan/pavo/tomate, dos yogures con plátano y dos con fruta de temporada; cantidades diferentes. | Conservar IDs y evaluar si nombres explican cada variante. |
| [F-006](findings.md) | food | P2 | CANDIDATO | bread; data/foods.json; 35 recetas | 250 kcal/100 g; 25 g/rebanada; compra orientativa 400 g. Dos rebanadas actuales=50 g=125 kcal. Todas cumplen entero y máximo dos. | Elegir aproximación genérica o producto/peso concretos antes de cambiar. |
| [F-007](findings.md) | food | P2 | DECISION_PENDIENTE | coffee; data/foods.json; 20 recetas | Café molido g/per_100 g con cuatro ceros; 7 g por receta. Los pasos preparan café, sin ordenar ingerir el sólido. | Acordar modelo de bebida y compra; conservar convención hasta decisión. |
| [F-008](findings.md) | food | P2 | CANDIDATO | cocoa/cayenne; data/foods.json | Cocoa: 330 vs257 kcal (residual +73). Cayenne: 318 vs429.99 (residual -111.99) por 100 g. | Contrastar ficha comparable, fibra y preparación antes de sustituir datos. |
| [F-009](findings.md) | recipe | P2 | CANDIDATO | ensalada_templada_gulas; data/recipes.json | 12 ingredientes, 15 min, 1 ración; 673.5 g sólidos+5 ml vinagre, 180 g cebolla cruda, 100 g gulas, 60 g mozzarella y 20 g curado. | Validar corte, porción y secuencia preparando la receta, sin cambiar cantidades por intuición. |
| [F-010](findings.md) | food | P2 | DECISION_PENDIENTE | oliveoil; data/foods.json | 900 kcal/100 g, 100 g grasa; envase orientativo500 g; 53 recetas. | Contrastar etiqueta/ficha coherente y decidir equivalencia comercial. |
| [F-011](findings.md) | recipe | P3 | DECISION_PENDIENTE | 112 description vacíos; data/recipes.json | 112 description vacíos y 1 tip vacío (media_manzana_cafe_leche). Los schemas permiten ambos. | Decidir utilidad de descripciones; no rellenar texto redundante. |
| [F-012](findings.md) | recipe | P2 | CANDIDATO | hamburguesa_pavo/snack_pavo_tostada/trucha_patatas; data/recipes.json | Filete/picado con turkey; pavo fresco alternativo a turkeySlice; dorada/merluza alternativos a trout. | Aclarar alcance de alternativas o proponer variantes tras autorización. |
| [F-013](findings.md) | food | P2 | SIN_EVIDENCIA | Todos salvo bread/skyr/rice/milk; data/foods.json | 20 investigados: 4 close, 3 no comparables, 13 sin contraste válido; 70 no consultados. Total83 pending_source+3 not_comparable. | Recuperar accesos y continuar lotes por impacto; no sustituir valores usando búsquedas fallidas. |
| [F-014](findings.md) | food | P2 | CANDIDATO | bread/skyr/rice/milk; data/foods.json | kcal catálogo/referencia: 250/235, 64/51, 360/349, 50/45; misma base por par. | Elegir alimento representado antes de adoptar cifras; deltas de cuatro nutrientes en matriz. |
| [F-015](findings.md) | food | P2 | SIN_EVIDENCIA | chickenWings/soySauce/vinegar; data/foods.json | Alitas convierten254 kcal comestibles x 0.34 a 86.4 kcal/100 g comprados; salsa/vinagre declaran aproximaciones por volumen. | Contrastar registro, rendimiento y densidad en lote posterior; no cambiar modelo ahora. |


## Métricas de cobertura

| Métrica | Numerador | Denominador | % / Estado | Método de obtención |
| --- | ---: | ---: | --- | --- |
| Inventario alimentos | 90 | 90 | 100% | Una fila por food.id |
| Revisión documental y recálculo recetas | 112 | 112 | 100% | Lectura ingredientes/pasos/tips y suma por ración |
| Referencias resueltas/unidades compatibles | 543 | 543 | 100% | Schemas y runtime |
| Investigados en lote externo | 20 | 90 | 22.2222% | Incluye aperturas fallidas |
| Páginas abiertas con contenido útil | 11 | 90 | 12.2222% | 4 close+3 no comparables+4 metadatos parciales |
| Contrastes comparables close | 4 | 90 | 4.4444% | bread/skyr/rice/milk |
| Coincidencias exact | 0 | 90 | 0% | No se identificó producto exacto del genérico |
| Procedencias originales exactamente validadas | 0 | 90 | 0% | Nuevas referencias close no validan origen heredado |
| pending_source | 83 | 90 | 92.2222% | 13 lote+70 fuera de lote |
| not_comparable | 3 | 90 | 3.3333% | chicken/oliveoil/tuna |
| Recetas con incidencia confirmada | 16 | 112 | 14.2857% | F-003 documental; no error de macros |
| Recetas con candidato como estado principal | 12 | 112 | 10.7143% | Sin doble contar confirmadas |
| Recetas con algún ingrediente legacy | 109 | 112 | 97.3214% | Clasificación textual de fuente |
| Recetas con energía no contrastada en parte | 112 | 112 | 100% | Todos los foodId sin referencia comparable |
| Descripciones vacías válidas | 112 | 112 | 100% | Schema permite vacío |
| Tests existentes aprobados | 38 | 38 | 100% | npm test; Node24.19.0; exit0 |


Inventario100% no equivale a contraste externo4.4444%. Una fila reviewed_ok significa revisión culinaria documental sin contradicción principal observada; puede coexistir con SIN_EVIDENCIA por fuentes pendientes. El estado principal no borra motivos adicionales de reason.

Tipos: desayuno19, media19, comida25, tarde20, cena29. El ciclo admite repeticiones; no se exigen105 recetas distintas.
Unidades inventario/receta/base: g/g/per_100g 68; ud/g/per_100g 10; ud/ud/per_100g 7; ml/ml/per_100ml 3; g/ud/per_100g 1; ud/ud/per_unit 1. Compra positiva y compatible con unit en 90/90; no equivale a validación de 90 envases reales.
recoveryTags tiene valores únicos/admitidos, pero son marcadores cualitativos; no se verificaron dosis de micronutrientes.

## Análisis de impacto

Se suma **una ración base por receta**, todas baseServings=1: **47179.060000 kcal y 3433.901650 g proteína**. No representa una dieta ni frecuencia real de consumo de usuarios.

Mayor presencia: oliveoil 53, bread 35, skyr 30, tomato 26; milk/coffee/onion 20. Mayor energía: bread 4000, oliveoil 3753, skyr 3670.4, rice 2088, eggs 1872 kcal. Mayor proteína: skyr 573.5, turkey 318, chicken 297.85, eggs 163.8, bread 144, tuna 143.75 g.

Score descriptivo de auditoría:
S=líneas/max_líneas+kcal/max_kcal+proteína/max_proteína+riesgo_unidad+riesgo_fuente.
Máximos observados: 53, 4000, 573.5. riesgo_unidad=1 si unit!=recipeUnit, recipeUnit=ud, o ID coffee/oliveoil (semántica/base comercial); 0 en otro caso. riesgo_fuente=1 para legacy; 0 para otra procedencia declarada. No supone que otras fuentes estén validadas. Empate por foodId. Es una herramienta descriptiva de ordenación, no umbral nutricional ni ponderación aprobada del planificador.

Lote20: bread, oliveoil, skyr, rice, eggs, potato, turkey, chicken, milk, oats, salmon, pasta, beans, sweetpotato, granola, walnuts, coffee, cocoa, cayenne, tuna. Combina diez candidatos iniciales de alta exposición, otros de alta energía/proteína y semillas cocoa/cayenne/coffee. Es selección priorizada multivariable; no son necesariamente los primeros20 de un único ranking. Se justifica investigar semillas de baja exposición para resolver hipótesis concretas.

Los cuatro close cubren23.333233% de energía del conjunto; el resto carece de contraste comparable. No mide precisión de cifras. El impacto por alimento incluye todas las recetas base, sin datos de uso.

| foodId | Líneas | kcal sumadas | % energía | Proteína g | % proteína | Score | Rango |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| oliveoil | 53 | 3753.0000 | 7.9548 | 0.0000 | 0.0000 | 3.938250 | 1 |
| bread | 35 | 4000.0000 | 8.4783 | 144.0000 | 4.1935 | 3.911467 | 2 |
| skyr | 30 | 3670.4000 | 7.7797 | 573.5000 | 16.7011 | 3.483638 | 3 |
| eggs | 16 | 1872.0000 | 3.9679 | 163.8000 | 4.7701 | 3.055501 | 4 |
| tomato | 26 | 471.6000 | 0.9996 | 26.2000 | 0.7630 | 2.654150 | 5 |
| potato | 10 | 1478.4000 | 3.1336 | 38.4000 | 1.1183 | 2.625237 | 6 |
| onion | 20 | 554.0000 | 1.1742 | 15.2350 | 0.4437 | 2.542423 | 7 |
| pepper | 17 | 431.9000 | 0.9154 | 15.4250 | 0.4492 | 2.455626 | 8 |
| coffee | 20 | 0.0000 | 0.0000 | 0.0000 | 0.0000 | 2.377358 | 9 |
| sweetpotato | 5 | 864.3000 | 1.8320 | 16.0800 | 0.4683 | 2.338453 | 10 |
| apple | 8 | 618.8000 | 1.3116 | 3.5700 | 0.1040 | 2.311868 | 11 |
| zucchini | 11 | 266.4000 | 0.5647 | 17.7600 | 0.5172 | 2.305115 | 12 |
| carrot | 10 | 340.0000 | 0.7207 | 7.6500 | 0.2228 | 2.287018 | 13 |
| banana | 5 | 540.0000 | 1.1446 | 6.6000 | 0.1922 | 2.240848 | 14 |
| avocado | 5 | 416.0000 | 0.8817 | 5.2000 | 0.1514 | 2.207407 | 15 |
| kiwi | 6 | 329.4000 | 0.6982 | 5.9400 | 0.1730 | 2.205915 | 16 |
| pear | 4 | 387.6000 | 0.8216 | 2.7200 | 0.0792 | 2.177115 | 17 |
| cucumber | 6 | 87.0000 | 0.1844 | 4.0600 | 0.1182 | 2.142037 | 18 |
| orange | 3 | 253.8000 | 0.5380 | 4.8600 | 0.1415 | 2.128528 | 19 |
| seasonFruit | 3 | 247.5000 | 0.5246 | 2.2500 | 0.0655 | 2.122402 | 20 |
| mandarin | 3 | 211.5000 | 0.4483 | 3.6000 | 0.1048 | 2.115756 | 21 |
| turkey | 8 | 1431.0000 | 3.0331 | 318.0000 | 9.2606 | 2.063183 | 22 |
| broccoli | 1 | 85.0000 | 0.1802 | 7.0000 | 0.2038 | 2.052324 | 23 |
| chicken | 8 | 1424.5000 | 3.0193 | 297.8500 | 8.6738 | 2.026423 | 24 |
| milk | 20 | 1250.0000 | 2.6495 | 85.0000 | 2.4753 | 1.838071 | 25 |
| rice | 10 | 2088.0000 | 4.4257 | 40.6000 | 1.1823 | 1.781473 | 26 |
| tuna | 6 | 632.5000 | 1.3406 | 143.7500 | 4.1862 | 1.521986 | 27 |
| oats | 8 | 1054.5000 | 2.2351 | 37.0500 | 1.0789 | 1.479172 | 28 |
| salmon | 3 | 1004.5000 | 2.1291 | 98.0000 | 2.8539 | 1.478609 | 29 |
| shrimp | 4 | 568.0000 | 1.2039 | 127.8000 | 3.7217 | 1.440314 | 30 |
| turkeySlice | 7 | 509.8500 | 1.0807 | 89.1000 | 2.5947 | 1.414900 | 31 |
| beans | 4 | 913.0000 | 1.9352 | 58.1000 | 1.6920 | 1.405029 | 32 |
| tomatoSauce | 12 | 485.1000 | 1.0282 | 23.5200 | 0.6849 | 1.388701 | 33 |
| pasta | 4 | 948.7500 | 2.0110 | 35.7500 | 1.0411 | 1.374996 | 34 |
| walnuts | 8 | 708.5000 | 1.5017 | 16.3500 | 0.4761 | 1.356578 | 35 |
| granola | 6 | 814.0000 | 1.7253 | 18.5000 | 0.5387 | 1.348966 | 36 |
| chickpeas | 3 | 687.5000 | 1.4572 | 38.5000 | 1.1212 | 1.295610 | 37 |
| hummus | 5 | 661.5000 | 1.4021 | 14.7000 | 0.4281 | 1.285347 | 38 |
| almonds | 5 | 556.8000 | 1.1802 | 20.1600 | 0.5871 | 1.268692 | 39 |
| noodles | 3 | 665.0000 | 1.4095 | 22.8000 | 0.6640 | 1.262610 | 40 |
| spinach | 9 | 187.2000 | 0.3968 | 22.6200 | 0.6587 | 1.256053 | 41 |
| mackerel | 2 | 480.0000 | 1.0174 | 55.2000 | 1.6075 | 1.253987 | 42 |
| cheese | 4 | 417.6000 | 0.8851 | 41.4000 | 1.2056 | 1.252060 | 43 |
| lentils | 2 | 509.6000 | 1.0801 | 40.0400 | 1.1660 | 1.234953 | 44 |
| berries | 7 | 360.0000 | 0.7631 | 7.2000 | 0.2097 | 1.234630 | 45 |
| hake | 2 | 303.4000 | 0.6431 | 62.9000 | 1.8317 | 1.223263 | 46 |
| cod | 2 | 287.0000 | 0.6083 | 63.0000 | 1.8346 | 1.219338 | 47 |
| lettuce | 9 | 120.6000 | 0.2556 | 6.7000 | 0.1951 | 1.211644 | 48 |
| couscous | 2 | 456.2500 | 0.9671 | 15.0000 | 0.4368 | 1.177954 | 49 |
| quinoa | 2 | 404.8000 | 0.8580 | 15.4000 | 0.4485 | 1.165789 | 50 |
| tortilla | 2 | 413.0000 | 0.8754 | 11.2000 | 0.3262 | 1.160515 | 51 |
| trout | 1 | 268.2500 | 0.5686 | 38.8500 | 1.1314 | 1.153672 | 52 |
| mushroom | 4 | 98.4000 | 0.2086 | 12.3000 | 0.3582 | 1.121519 | 53 |
| sardines | 1 | 184.5000 | 0.3911 | 21.6000 | 0.6290 | 1.102656 | 54 |
| pumpkin | 2 | 198.0000 | 0.4197 | 6.6000 | 0.1922 | 1.098744 | 55 |
| peas | 2 | 160.0000 | 0.3391 | 10.0000 | 0.2912 | 1.095173 | 56 |
| greek | 1 | 204.0000 | 0.4324 | 12.0000 | 0.3495 | 1.090792 | 57 |
| greenbeans | 2 | 141.0000 | 0.2989 | 8.4600 | 0.2464 | 1.087737 | 58 |
| raisins | 3 | 96.0000 | 0.2035 | 0.9600 | 0.0280 | 1.082278 | 59 |
| cocoa | 2 | 52.8000 | 0.1119 | 3.2000 | 0.0932 | 1.056516 | 60 |
| asparagus | 1 | 39.6000 | 0.0839 | 4.3200 | 0.1258 | 1.036301 | 61 |
| peanuts | 0 | 0.0000 | 0.0000 | 0.0000 | 0.0000 | 1.000000 | 62 |
| tempeh | 3 | 422.4000 | 0.8953 | 44.6600 | 1.3006 | 0.240076 | 63 |
| porkTenderloin | 2 | 348.0000 | 0.7376 | 64.3800 | 1.8748 | 0.236994 | 64 |
| edamame | 4 | 350.9000 | 0.7438 | 35.0900 | 1.0219 | 0.224382 | 65 |
| tofuFirm | 2 | 316.8000 | 0.6715 | 38.0600 | 1.1084 | 0.183300 | 66 |
| gulas | 2 | 407.5000 | 0.8637 | 23.7500 | 0.6916 | 0.181023 | 67 |
| redLentilsDry | 2 | 352.0000 | 0.7461 | 24.6000 | 0.7164 | 0.168630 | 68 |
| tahini | 4 | 261.8000 | 0.5549 | 7.4800 | 0.2178 | 0.153964 | 69 |
| soySauce | 7 | 20.6700 | 0.0438 | 3.1200 | 0.0909 | 0.142683 | 70 |
| cottageCheese | 2 | 210.0000 | 0.4451 | 27.5000 | 0.8008 | 0.138187 | 71 |
| chickenWings | 1 | 259.2000 | 0.5494 | 24.3000 | 0.7076 | 0.126039 | 72 |
| chiaSeeds | 4 | 140.9400 | 0.2987 | 4.7850 | 0.1393 | 0.119050 | 73 |
| beefSirloin | 1 | 171.6000 | 0.3637 | 27.0000 | 0.7863 | 0.108847 | 74 |
| turkeyMince | 1 | 180.0000 | 0.3815 | 23.6400 | 0.6884 | 0.105088 | 75 |
| blackBeans | 2 | 182.0000 | 0.3858 | 12.0000 | 0.3495 | 0.104160 | 76 |
| soyProteinTextured | 1 | 147.1500 | 0.3119 | 23.1750 | 0.6749 | 0.096065 | 77 |
| redCabbage | 3 | 96.1000 | 0.2037 | 4.3400 | 0.1264 | 0.088196 | 78 |
| cauliflower | 2 | 100.0000 | 0.2120 | 7.6000 | 0.2213 | 0.075988 | 79 |
| freshMozzarella | 1 | 132.0000 | 0.2798 | 10.2000 | 0.2970 | 0.069653 | 80 |
| celery | 3 | 25.2000 | 0.0534 | 1.2600 | 0.0367 | 0.065101 | 81 |
| eggplant | 2 | 85.0000 | 0.1802 | 3.4000 | 0.0990 | 0.064914 | 82 |
| cornCanned | 2 | 77.4000 | 0.1641 | 2.8800 | 0.0839 | 0.062108 | 83 |
| leek | 2 | 61.0000 | 0.1293 | 1.5000 | 0.0437 | 0.055601 | 84 |
| curedCheese | 1 | 89.6000 | 0.1899 | 7.1540 | 0.2083 | 0.053742 | 85 |
| garlic | 2 | 8.9400 | 0.0189 | 0.3816 | 0.0111 | 0.040636 | 86 |
| pumpkinSeeds | 1 | 44.7200 | 0.0948 | 2.4160 | 0.0704 | 0.034261 | 87 |
| beetroot | 1 | 22.0000 | 0.0466 | 0.8400 | 0.0245 | 0.025833 | 88 |
| cayenne | 1 | 1.5900 | 0.0034 | 0.0600 | 0.0017 | 0.019370 | 89 |
| vinegar | 1 | 0.9500 | 0.0020 | 0.0000 | 0.0000 | 0.019105 | 90 |


Las recetas con pan 35/aceite 53/skyr 30 se solapan: no sumarlas como recetas distintas. Un cambio futuro afectaría los IDs utilizados; las matrices permiten identificar exposición sin proponer una migración.

### Método reproducible

Por ingrediente: per_100 g con g=amount/100; per_100 ml con ml=amount/100; per_unit con ud=amount; per_100 g con ud=amount*peso_comestible/100. Sumar nutrientes y dividir por baseServings. CSV redondeado al final a 6 decimales; sin redondeo intermedio.

Comparación112 recetas con loadCatalogs/getMacro: diferencia máxima1.1368683772161603e-13 por coma flotante. No se aplicaron perfiles, sesiones ni raciones dinámicas.

Dos recetas usan0.5 ud manzana válido (85 g aproximados): skyr_chia_manzana y media_tostada_tahini_manzana. Pan siempre entero<=2, 25 g/rebanada para inventario; no se exige pan en gramos de receta. Verduras g/compra ud no multiplican por peso de pieza para nutrientes. Huevos per_unit no requieren peso para sumar, pero su tamaño real está sin verificar. Alitas ya expresan peso comprado con hueso: no aplicar0.34 de nuevo.

recipe_energy_share_percent=aporte_kcal_alimento/47179.060000*100. recipe_occurrences cuenta líneas de ingredientes. estimated_energy_from_unverified_foods_percent suma kcal de TODOS los IDs sin contraste comparable, incluso fuentes declaradas USDA/fabricante y no comparables. Un contraste close cuenta como realizado, sin certificar valor vigente.

En foods-audit.reason se conservan forma declarada, recoveryTags, compra completa (tienda/sección/etiqueta), peso aproximado, kcal/proteína sumadas, proporción proteica, score/rango y limitaciones. No se amplían cabeceras. Deltas kcal: magnitud absoluta y porcentaje absoluto respecto a referencia. Deltas firmados de cuatro nutrientes y porcentajes en reason; porcentaje no definido cuando referencia=0. No calcular deltas para no comparable/unverified.

Se leyeron nombre/tipo, porción, ingredientes, pasos, tiempo, tip y descripción de 112 recetas. Se revisaron coherencia principal, cantidades, utensilios mencionados, variantes, reposo/cocción y avisos de conservación. Extras de limón/ajo/especias/soja sin cantidad se anotan por fila; no se añaden a macros/compra. Falta acordar D-07, sin asumir que todo condimento deba convertirse en alimento nuevo.

Los tiempos son interpretación documental, sin cronómetro. Avena se interpreta active por reposo nocturno fuera de 5 min; alitas elapsed por 45 min con 35-40 de horno. En otros casos ambiguous evita inventar alcance de timeMinutes. Conservación e inocuidad no se certifican; se registra que algunos pasos exigen cocción completa y alitas74°C, sin tratarlo como validación clínica.

No se impone un mínimo universal de kcal/proteína ni se evalúan porciones como si fueran objetivos diarios fijos.

## Fuentes no disponibles y limitaciones

Fecha de consulta externa2026-10-19. Solo20 alimentos investigados; fuentes metodológicas generales no amplían ese número. Una búsqueda localiza documentos pero no cuenta como contraste completo. reference_* queda vacío si falló acceso fiable; URLs de intentos aquí.

| Alimento | URL/consulta | Resultado real |
| --- | --- | --- |
| bread | [Bimbo Libra 100% Integral](https://www.bimbo.es/marcas/bimbo/bimbo-libra-100-integral) | close: comparación numérica válida, producto no exacto. 450 g / 15 rebanadas: 30 g por rebanada; no identifica el pan genérico comprado. Copyright Bimbo, sin licencia abierta identificada. |
| oliveoil | [La Española AOVE botella 1 L](https://tienda.laespanolaaceites.com/products/aceite-de-oliva-virgen-extra-1-litro?pr_prod_strat=copurchase&pr_rec_id=ebd7ff1d0&pr_rec_pid=7169629388955&pr_ref_pid=7634872926363&pr_seq=uniform) | not_comparable. Tabla 822 kcal/100 ml y otra sección contradictoria 900 Kcal/3700 kj con etiquetas invertidas. No convertir a 100 g sin densidad validada. Copyright, sin licencia abierta identificada. |
| skyr | [Danone Skyr Natural x 4](https://www.danone.es/producto/skyr-natural-x4/) | close: comparación numérica válida, producto no exacto. Leche fermentada desnatada, 4x100 g; categoría próxima al yogur alto en proteínas genérico, no marca declarada en catálogo. Todos los derechos reservados; reutilización masiva no evaluada. |
| rice | [Brillante Calidad de Oro](https://www.brillante.es/productos/brillante-calidad-oro/) | close: comparación numérica válida, producto no exacto. Arroz seco tratado con vapor, envase 1 kg; variedad no especificada en catálogo. Comparación orientativa de producto seco, no equivalencia exacta. Copyright Brillante, sin licencia abierta identificada. |
| eggs | Búsqueda sin ficha íntegra comparable | pending_source/unverified. Búsqueda site.mapa.gob.es huevo gallina composición nutricional pdf: sin ficha íntegra comparable por unidad; tamaño/peso comestible sin definir. |
| potato | [Localizada](https://www.mapa.gob.es/es/ministerio/servicios/informacion/patata_tcm30-102520.pdf) | pending_source/unverified. Búsqueda localizó ficha; dos aperturas fallaron: Internal Error / not accessible. Extracto no contado como contraste. |
| turkey | [Localizada](https://www.mapa.gob.es/va/ministerio/servicios/informacion/pavo_tcm39-102821.pdf) | pending_source/unverified. Ficha localizada; dos aperturas fallaron: Internal Error / not accessible. Extracto no contado como contraste. |
| chicken | [MAPA/FEN Pollo](https://www.mapa.gob.es/es/ministerio/servicios/informacion/pollo_tcm30-103080.pdf) | not_comparable. Pollo genérico, rendimiento entero 70%, sin corte equivalente a pechuga fresca. Tabla Moreiras 2013: no asumir licencia abierta por estar alojada en ministerio. No extrapolar a pechuga. |
| milk | [Central Lechera Asturiana: valor medio leche semidesnatada](https://www.centrallecheraasturiana.es/es/productos/leche/) | close: comparación numérica válida, producto no exacto. Página del fabricante con base expresa 100 ml y brik 1 L; valores medios de gama, sin EAN individual. Copyright CAPSA, sin licencia abierta identificada. |
| oats | [Localizada](https://www.pepsico.es/docs/librariesprovider18/brand-nutrition-information/quaker/1709-ficha-t%C3%A9cnica-quaker-avena-bolsa-500g.pdf?sfvrsn=7f099cd_2) | pending_source/unverified. Ficha localizada; apertura Internal Error y reintento 403 Forbidden. No importar valores del extracto. |
| salmon | [Localizada](https://www.mapa.gob.es/es/ministerio/servicios/informacion/salmon_tcm30-102435.pdf) | pending_source/unverified. Ficha localizada; apertura Internal Error y reintento 400 Timeout fetching. |
| pasta | [Gallo Spaghetti integral](https://www.pastasgallo.es/productos/spaghetti-integral/) | pending_source/unverified: sin tabla comparable. Fabricante confirma sémola integral seca; tabla nutricional remitida al envase y no accesible en texto. Licencia de datos no identificada. |
| beans | [Luengo Alubia Blanca cocida](https://legumbresluengo.com/productos/alubia-blanca-cocida/) | pending_source/unverified: sin tabla comparable. Página de producto sin tabla accesible ni peso escurrido verificable. Licencia de datos no identificada. |
| sweetpotato | [Localizada](https://www.mapa.gob.es/eu/ministerio/servicios/informacion/batata_tcm35-102417.pdf) | pending_source/unverified. Ficha localizada; dos aperturas Internal Error / not accessible. |
| granola | [Kellogg nota de prensa W.K. Kellogg 2018](https://www.kelloggs.es/content/dam/europe/kelloggs_es/pdf/NdP_NP_Nueva_gama_de_cereales_WKK_09032018.pdf) | pending_source/unverified: sin tabla comparable. Describe varias granolas sin azúcar añadido; no aporta tabla ni identifica mezcla del catálogo. Documento antiguo, no prueba disponibilidad actual. Licencia de datos no identificada. |
| walnuts | [Localizada](https://www.mapa.gob.es/es/ministerio/servicios/informacion/nuez_tcm30-103047.pdf) | pending_source/unverified. Ficha localizada; dos aperturas Internal Error / not accessible. |
| coffee | [Nestlé Professional NESCAFÉ Intenso grano](https://www.nestleprofessional.es/cafe-bebidas-hosteleria/cafe-en-grano-alta-calidad/nescafe-intenso-cafe-en-grano-1kg) | pending_source/unverified: sin tabla comparable. Café en grano 1 kg; sin tabla de infusión comparable. No valida ceros ni gramos secos ingeridos. Licencia de datos no identificada. |
| cocoa | [Localizada](https://www.mapa.gob.es/es/ministerio/servicios/informacion/cacao_tcm30-102347.pdf) | pending_source/unverified. Búsqueda de etiqueta Valor sin fuente primaria íntegra adecuada; ficha MAPA localizada devolvió 404. No usar cifras de agregadores. |
| cayenne | [Localizada](https://fdc.nal.usda.gov/fdc-app.html#/food-details/170932/nutrients) | pending_source/unverified. Apertura USDA devolvió Internal Error; identificación escrita FDC 170932 no contrastada. No usar agregadores como verificación USDA. |
| tuna | [Calvo Filetes de atún al natural](https://calvo.es/producto/filetes-de-atun-al-natural-pescados-uno-a-uno/) | not_comparable. La página dice Neto y añade extracto de levadura; catálogo exige escurrido. No calcular diferencias ni asumir idéntico producto. Copyright Calvo; sin licencia abierta identificada. |


Metodología y derechos:
- [USDA](https://fdc.nal.usda.gov/) declara dominio público/CC0 y solicita atribución; no garantiza equivalencia de cualquier alimento.
- [Documentación](https://fdc.nal.usda.gov/data-documentation/) y [FAQ](https://fdc.nal.usda.gov/faq/): tipos de datos, factores Atwater y carbohidratos por diferencia.
- [Anexo XIV UE1169/2011](https://www.boe.es/buscar/doc.php?id=DOUE-L-2011-82311): incluye fibra 2 kcal/g. No implica fibra concreta en cacao/cayena.
- Bimbo/Danone/CAPSA/Brillante muestran copyright; no se identificó licencia abierta para importar datos masivamente. MAPA aloja tablas Moreiras: no se presume licencia abierta por dominio institucional. Estos informes documentan comparaciones limitadas; no se importó información a catálogos.
- BEDCA y el enlace secundario de curedCheese se conservan como declaraciones sin verificar ficha ni derechos en este lote. Open Food Facts no se usa como fuente de cifras; evaluar sus condiciones si se propone después.
- Sin producto comprado, peso real de pieza, rendimiento y fibra no procede convertir incertidumbres en errores. No se mezclan automáticamente carbohidratos de etiquetas UE con tablas estadounidenses.

## Plan de corrección recomendado (SIN IMPLEMENTAR)

1. Resolver representación genérica/producto de bread/skyr/rice/milk y su procedencia (F-006/F-014; D-01).
2. Contrastar huevos, patata, pavo y pechuga de pollo: unidad, corte, piel y peso comestible.
3. Recuperar fichas íntegras de avena, salmón, boniato y nueces; no importar extractos de búsqueda.
4. Acordar café seco/infusión antes de modificar ceros (F-007; D-05).
5. Validar aceite por masa/volumen y formato, descartando presentación externa contradictoria (F-010).
6. Proponer texto para los16 destinos explícitos de ingredientes que faltan, sin cambiar cantidades (F-003).
7. Definir tiempo activo/total y aclarar reposos; validar con cocina real (F-004; D-04).
8. Revisar los3 grupos de variantes y las alternativas de pavo/pescado conservando IDs (F-005/F-012).
9. Contrastar fibra y forma de cacao/cayena y revisar ración de gulas sin forzar4/4/9 (F-008/F-009).
10. Continuar lotes por impacto, incluyendo alitas/salsa/vinagre; preparar pruebas de corrección tras aprobar decisiones.

Decisiones D-01 aD-08 en decisions.md: fuente, variantes, descripciones, metadatos/tiempos, café, pesos/formatos, condimentos/alternativas, criterios de aceptación. Ninguna aceptada.

Pruebas futuras propuestas:
- Identidad de fuente, forma/base y fechas; alertas de plausibilidad sin rechazo por 4/4/9.
- Media fruta, huevo, 1/2 rebanadas enteras, verduras g->ud, leche 1 L, aceite solo con densidad validada.
- Alitas sin doble rendimiento; condimentos opcionales y destinos de ingredientes medidos.
- Reposo frente a trabajo activo; duplicados como aviso informativo.
- IDs y referencias de plantilla, porciones futuras, compra, consumo/reverso; preservar snapshots y movimientos anteriores.
No se añadieron ni cambiaron tests.

## Pruebas ejecutadas

1. git status --short / git branch --show-current: salida inicial de estado vacía; rama dev.
2. git fetch origin: primer intento Permission denied en .git/FETCH_HEAD; reintento autorizado exit0 sin salida. git rev-parse dev origin/dev imprimió dos veces c630973d2656f9e0b74a777aef10fe7ba60ebc6f.
3. .\scripts\new-branch.ps1 -Name 'docs/catalog-quality-audit': primer intento Permission denied en .git/index.lock; reintento autorizado exit0; rama final docs/catalog-quality-audit.
4. node --version: v24.19.0, cumple>=20.
5. npm test, exit0. Extracto literal de salida (se omiten38 líneas de casos individuales aprobados):

~~~text
> test
> node tests/run.js

ℹ tests 38
ℹ suites 0
ℹ pass 38
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 110.8951
~~~

6. jsonschema.Draft202012Validator(schema).validate(document), Python por stdin, exit0. Salida literal:

~~~text
foods: JSON Schema 2020-12 PASS; SHA256 1938d282eecb01b014e83b55a1a49005657f5b826cb77c23619e6b3351d54b6e
recipes: JSON Schema 2020-12 PASS; SHA256 eea5a7d1006b956fc8cd2eb7305bca010996c46608f28c81888469cbfad0d165
~~~

Código equivalente para repetir validación sin crear archivos:

~~~powershell
@'
import json,jsonschema
from pathlib import Path
for name in ['foods','recipes']:
    d=json.loads(Path('data/'+name+'.json').read_text(encoding='utf-8'))
    s=json.loads(Path('data/'+name+'.schema.json').read_text(encoding='utf-8'))
    jsonschema.Draft202012Validator(s).validate(d)
    print(name,'PASS')
'@ | python -
~~~

7. node --input-type=module por stdin: recálculo independiente vs runtime, exit0. Salida literal:

~~~json
{"recipes":112,"max_absolute_difference":1.1368683772161603e-13,"status":"PASS"}
~~~

Código usado:

~~~javascript
import { readFile } from 'node:fs/promises';
import { loadCatalogs } from './js/data/catalogs.js';
import { createNutritionService } from './js/domain/nutrition.js';
globalThis.fetch = async url => ({ok:true,json:async()=>JSON.parse(await readFile(url,'utf8'))});
const c=await loadCatalogs({slotTypes:['desayuno','media','comida','tarde','cena'],recoveryTags:['calcium','vitamin_d','vitamin_c']});
const service=createNutritionService({getFood:()=>c.foods});
const raw=JSON.parse(await readFile('data/recipes.json','utf8'));let max=0;
for(const r of c.recipes){
 const calc=service.getMacro(Object.fromEntries(r.ingredients.map(i=>[i.id,i.rest])));
 const a=raw.recipes.find(x=>x.id===r.id);const sum=[0,0,0,0];
 for(const i of a.ingredients){
  const f=c.foodMeta[i.foodId];
  const q=i.amount/a.baseServings*(f.nutrition.basis==='per_unit'?1:i.unit==='ud'?f.approximateEdibleWeight_g_per_unit/100:.01);
  ['kcal','protein_g','carbohydrates_g','fat_g'].forEach((key,n)=>sum[n]+=f.nutrition[key]*q);
 }
 Object.values(calc).forEach((v,n)=>max=Math.max(max,Math.abs(v-sum[n])));
}
console.log(JSON.stringify({recipes:c.recipes.length,max_absolute_difference:max,status:max<1e-9?'PASS':'FAIL'}));
~~~

8. Validación final de informes: cabeceras exactas, una fila por ID, valores recalculados, estados permitidos, huellas y ámbito de escritura. Resultado se registra tras ejecutarla.

Las pruebas estructurales/locales no demuestran exactitud nutricional externa, seguridad culinaria, tiempos reales ni funcionamiento publicado.

### Validación final de entregables

Salida literal de los controles ejecutados por Python mediante stdin, exit 0:

~~~text
foods-audit.csv: exact headers / complete unique IDs PASS (90)
recipes-audit.csv: exact headers / complete unique IDs PASS (112)
112 recipe calculations / uncertainty percentages PASS
90 source states / energy shares / empty invalid deltas PASS
Catalog bytes identical to dev; tracked files unchanged; exactly five authorized reports PASS
primary recipe states {'SIN_EVIDENCIA': 84, 'CANDIDATO': 12, 'CONFIRMADO': 16}
~~~

También comprobados: 112 vectores de cantidades únicos, 109 recetas con fuente heredada y 111 tips no vacíos. Revisión final de CSV sin columnas extra, IDs únicos y porcentajes/deltas coherentes. Solo se han creado los cinco archivos solicitados dentro de results/; ningún archivo seguido cambia. Catálogos idénticos byte a byte a dev. Sin commits ni publicación.

## Selección culinaria posterior — 23/10/2026

La revisión [de las 112 recetas](../../recipe-culinary-quality.md) conserva finalmente 111 recetas y 537 referencias. Después de confirmar fajitas, tostas de sardinas y wrap de pavo, el propietario acepta reconsiderar las otras once eliminaciones: diez se recuperan por su coherencia culinaria y solo permanece eliminado hamburguesa_pavo. No se descarta por origen o formato ni se utilizan utensilios como criterio. Siete fichas reciben aclaraciones de nombre, pasos o consejo, trazadas en [el manifiesto](../../recipe-culinary-changes.json). No cambian ingredientes, cantidades, tiempos, unidades ni nutrientes.

Los resultados nutricionales de 112 recetas siguen siendo evidencia histórica: no se regeneran sus CSV o informes ni se afirman nuevas verificaciones. Se comparan por ID las cifras de las 111 fichas aún presentes, manteniendo los nombres históricos de los informes; el cambio editorial de nombre se comprueba por separado. Las 16 recetas con huevo vuelven a estar presentes. Los pendientes por falta de evidencia no se cierran. El propietario acepta invalidar menús de prueba; no hay fichas ocultas ni mecanismos de retirada, y no se toca Supabase.

### Revisión posterior de recetas base — misma iteración

Se revisan las 111 fichas y se mejoran documentalmente 52 adicionales: 33 comidas/cenas y 19 desayunos/tentempiés. La fase baseRecipeReview del manifiesto conserva las decisiones y cambios previos. No se tocan nutrientes, ingredientes, cantidades, raciones, unidades, tiempos o tipos. El cálculo independiente antes/después de las 111 fichas da cero diferencias en kcal, proteína, hidratos y grasa. Los informes nutricionales históricos no se regeneran ni se validan fuentes nuevas. Se conserva pendiente la valoración culinaria de 180 g de cebolla cruda en la ensalada de gulas, sin sustituir esa cantidad por intuición. La revisión de porciones escaladas y semana completa se hará después; no forma parte de esta modificación de recetas base. La validación actual se recoge en el inventario (194 tests y ambos esquemas).
