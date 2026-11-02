# Cierre de hallazgos vigente — 19/10/2026

Iteración cerrada tras comprobaciones finales, sin nueva investigación ni nuevos CSV. Estos estados sustituyen los estados operativos de las secciones históricas inferiores. «Corregido» describe el problema concreto; no certifica todos los nutrientes, productos ni preparaciones.

| ID | Estado final | Justificación / límite |
| --- | --- | --- |
| F-001 | Pendiente por falta de evidencia | Origen individual de estimaciones heredadas no reconstruido; no prueba que todas sean erróneas. |
| F-002 | Pendiente por falta de evidencia | Mejora parcial: referencias identificadas incorporadas; seis búsquedas aún no sustentan una equivalencia adoptada. |
| F-003 | Corregido | Destino de aceite/salsa explícito en las 16 recetas detectadas; prueba documental. |
| F-004 | Revisado sin cambio | Tiempos conservados según propietario; no cronometrados. |
| F-005 | Corregido | Ocho fichas de tres preparaciones: descripciones ahora distinguen cantidades; IDs, ingredientes y macros intactos. |
| F-006 | Revisado sin cambio | Peso genérico de rebanada 25 g conservado; ejemplo comercial no demuestra error ni valida cada rebanada. |
| F-007 | Revisado sin cambio | Café conservado por decisión expresa, sin pretender verificación de su convención nutricional. |
| F-008 | Revisado sin cambio | Residual 4/4/9 no demuestra error; condimentos cuantificados se siguen sumando. |
| F-009 | Revisado sin cambio | Volumen/complejidad culinaria de gulas no demuestran incoherencia; sin prueba de cocina. |
| F-010 | Pendiente por falta de evidencia | Representación energética/formato del aceite sin error demostrado; se conserva fuente y aporte. |
| F-011 | Revisado sin cambio | Descripciones vacías restantes válidas por contrato; ocho descripciones de variantes corregidas dentro del alcance. |
| F-012 | Corregido | Tres alternativas detectadas aclaradas sin equiparar su composición. |
| F-013 | Pendiente por falta de evidencia | Cobertura no equivale a validación exacta: 73 close, cinco no comparables y 12 pendientes; sin continuar investigación. |
| F-014 | Revisado sin cambio | Ejemplos de marca no sustituyen automáticamente genéricos. |
| F-015 | Pendiente por falta de evidencia | Forma de uso confirmada; algunas densidades, mermas y pesos aproximados no están validados externamente. |
| F-016 | Revisado sin cambio | Referencias cercanas contrastadas conservan diferencias; no se convierten en sustituciones sin equivalencia suficiente. |
| F-017 | Corregido | Huevo L de 60 g comestibles aproximados, un único registro crudo para kcal/P/C/G y 16 deltas comprobados. |
| F-018 | Pendiente por falta de evidencia | Alubias blancas escurridas confirmadas como uso, pero falta fuente con denominador explícito comparable. |
| F-019 | Corregido | Cinco correcciones USDA previas conservadas y comprobadas frente a evidencia guardada. |
| F-020 | Corregido | Trazabilidad, cálculo de impacto y regresión incorporados; alcance de fuentes contrastadas explícito. |

Condimentos: todos los ingredientes cuantificados se mantienen contabilizados, incluidos aceite, cayena, salsa de soja y vinagre. Se cierra la antigua petición de excluirlos; no requiere modificación del runtime.

Límite del historial: sus cantidades y movimientos permanecen intactos, pero las kcal/macros mostradas se recalculan con tablas actuales. Congelar valores históricos sería un encargo funcional separado; no se modifica aquí.

No se eleva ninguna fuente no contrastada a verificada. Se reutiliza la evidencia primaria ya guardada; no se han consultado ni validado nuevas fuentes durante el cierre.

---

## Historial previo al cierre

# Estado vigente L4 — 19/10/2026

- **F-017 resuelto en representación y estimación:** huevo L confirmado; 60 g comestibles estándar de fuente identificada y referencia cruda USDA. Corrección por unidad documentada en summary.md, sin exigir pesado al usuario.
- **F-018 y F-015 parcialmente aclarados:** conservas escurridas y alitas con hueso confirmadas como uso; la confirmación no valida las tablas escurridas ni todos los rendimientos/densidades.
- **Variantes:** tres familias de ingredientes coincidentes / ocho fichas ahora tienen descripción coherente. El criterio del propietario está aceptado; no se han eliminado IDs ni alterado cantidades para unificar presentación.
- **Condimentos:** preferencia de exclusión aceptada pero no implementada para ingredientes cuantificados; requiere lógica funcional fuera del encargo. Las tablas reales no se ponen a cero. Café y tiempos se conservan por decisión del propietario.
- Estado acumulado y límites vigentes en [summary.md](summary.md); las fichas inferiores quedan como historial. Cero exact respecto del producto comprado; 73 close, cinco no comparables y 12 pendientes.

---

## Historial anterior a las confirmaciones L4

# Estado vigente de hallazgos — L3, 19/10/2026

Correcciones locales ejecutadas por petición expresa del propietario; catálogo 0.9.2. Las fichas L1/L2 se conservan debajo como historial. El [resumen vigente](summary.md) y el manifiesto `source-data/catalog-changes.json` delimitan exactamente los cambios.

| Hallazgo previo | Estado tras L3 |
| --- | --- |
| F-001, procedencia heredada | Sigue abierto: las 62 fuentes heredadas no se reconstruyen por encontrar un genérico cercano. |
| F-002, búsquedas USDA sin ID | Parcialmente corregido: se incorporan 14 identificadores nuevos y se sustituye la búsqueda de ajo por su ficha. Quedan seis búsquedas sin una equivalencia adoptable: tofuFirm, blackBeans, soyProteinTextured, beefSirloin, tahini y soySauce. Las alternativas consultadas sí quedan identificadas en evidencia. |
| F-003, destino de ingredientes | **Corregido documentalmente en las 16 recetas**: 15 con aceite y una con salsa de soja. Sin cantidades nuevas. Prueba automática sobre todas las recetas y caso negativo. |
| F-012, alternativas de composición | **Aclaradas las tres recetas**: versión con filetes del antiguo nombre hamburguesa (ID conservado, nombre Bocadillo de pavo con patatas), pavo loncheado y sustitución de trucha. No se equiparan sus macros a alternativas. |
| F-013/F-016, cobertura y contrastes | 72 close, 6 no comparables, 12 pendientes; 16 con fuente integrada y 56 close retenidos sin prueba de error. No declarar exactitud del producto comprado. |
| F-017/F-018, huevos/alubias | Siguen pendientes por peso de unidad/base escurrida. |
| Otros hallazgos/decisiones | No se convierten las propuestas en aprobaciones. Tiempos, variantes, descripciones, densidades y rendimientos conservan sus reservas. |

## [F-019] Cinco inconsistencias de referencia USDA corregidas

- **Estado de evidencia:** CONFIRMADO, corregido localmente; prioridad P2, sin interpretación clínica.
- **Objetos:** edamame, redLentilsDry, porkTenderloin, turkeyMince y cornCanned.
- **Evidencia:** extracción CSV primaria USDA SR Legacy, FDC 168411, 174284, 168312, 172850 y 169214, por 100 g comestibles; fecha de consulta 19/10/2026, NDB y filas de nutrientes en `source-data/usda-records.json`.
- **Problemas:** proteína de edamame no reproducible ni como redondeo; lenteja roja con mezcla de genérico y ficha roja; solomillo con proteína ajena a su referencia cruda; pavo picado mezclaba 93 % magro con macros del registro genérico; maíz de otra preparación frente a sólidos escurridos.
- **Acción ejecutada:** solo campos documentados en el manifiesto. Fuentes explícitas y correcciones comparables, sin adoptar marcas ni nuevos supuestos de unidades. Otros redondeos conservados.
- **Impacto calculado:** 10 recetas, entre −9,5 y +3,6 kcal por ración base; mayor reducción de proteína −2,325 g. Las 112 se recalculan antes/después, sin cambios de cantidades.
- **Pruebas:** referencia-campo, contrato contra baseline, cálculo independiente frente a runtime e impacto actual. IDs y unidades intactos.

## [F-020] Trazabilidad y control automático incorporados

- **Estado de evidencia:** CONFIRMADO, mejora local ejecutada; prioridad P2.
- **Acción:** 76 fichas primarias extraídas de dos archivos oficiales, plan explícito para 90 alimentos, 16 fuentes integradas (cinco correcciones y once redondeos conservados), histórico L2 y baseline preservados. Herramientas reproducibles de recopilación, comparación, impacto e informes; sin sustituciones automáticas por cercanía numérica.
- **Límite:** 72 comparaciones close no equivalen a 72 alimentos validados exactamente. Dieciocho siguen sin comparación suficiente y otros 56 close no sustentan cambiar su composición. Etiquetas de fabricante con derechos reservados, sin licencia masiva aclarada. BEDCA solo permite abrir el índice consultado, no la tabla concreta de queso curado.
- **Validación:** 45 pruebas correctas y ambos JSON Schema originales correctos. No se ha validado cocción, tiempos ni composición analítica del producto comprado.

---

## Historial de fichas L1/L2

# Hallazgos de auditoría de catálogos

**Lectura vigente tras L2 (19/10/2026):** F-001 a F-015 se conservan a continuación como evidencia histórica del lote L1. La [ampliación L2](#lote2) actualiza F-010/F-013 y añade F-016 a F-018. Las cifras antiguas de cobertura no son el estado vigente. Total actual: 3 fichas CONFIRMADO (todas P2), 8 CANDIDATO, 3 SIN_EVIDENCIA y 4 DECISION_PENDIENTE. Ningún nuevo error nutricional P0/P1 demostrado.

Origen dev, c630973d2656f9e0b74a777aef10fe7ba60ebc6f; 2026-10-19. Solo informes. Tres fichas confirmadas P2; ninguna P0/P1.

## CONFIRMADO

### [F-001] 62 estimaciones heredadas sin procedencia individual

- **Ámbito:** food
- **Objeto:** 62 foodId legacy; data/foods.json#/foods
- **Prioridad:** P2
- **Estado de evidencia:** CONFIRMADO
- **Confianza:** alta
- **Dato actual:** 62 nutritionSource declaran estimación heredada y no incluyen registro ni URL individual.
- **Contraste externo:** No requerido para constatar ausencia; cuatro comparaciones nuevas close no reconstruyen la fuente original.
- **Problema/hipótesis:** Falta trazabilidad, sin demostrar que sus cifras sean erróneas.
- **Impacto:** 109 recetas con al menos un alimento heredado; exposición por ID en foods-audit.csv.
- **Acción propuesta (no ejecutada):** Identificar fuentes por lotes, empezando por mayor energía/proteína.
- **Riesgo de regresión:** Modificar cifras afecta menús futuros, raciones y compra; conservar IDs y snapshots.
- **Pruebas recomendadas:** Comprobar forma/base/porción de cada referencia y regresión numérica.
- **Decisión requerida:** Sí: D-01/D-08 para adoptar referencias o criterios de cambio.

### [F-002] 20 referencias USDA remiten a búsquedas sin registro declarado

- **Ámbito:** food
- **Objeto:** 20 foodId con food-search y sin NDB; data/foods.json
- **Prioridad:** P2
- **Estado de evidencia:** CONFIRMADO
- **Confianza:** alta
- **Dato actual:** 21 fuentes incluyen food-search; garlic sí declara NDB 11215. Otras 20 no fijan un FDC/NDB individual.
- **Contraste externo:** La [documentación USDA](https://fdc.nal.usda.gov/data-documentation/) distingue tipos de datos y sus versiones; no se abrió individualmente cada fuente fuera del lote.
- **Problema/hipótesis:** Una búsqueda no fija corte, preparación o registro; no se afirma que esas cifras estén mal.
- **Impacto:** 20 alimentos; IDs identificables por filtro de source_text en foods-audit.csv.
- **Acción propuesta (no ejecutada):** Documentar registro individual y forma antes de contrastar valores.
- **Riesgo de regresión:** Usar otra forma cruda/cocida o base g/ml podría alterar nutrientes y compra.
- **Pruebas recomendadas:** Validar identidad del registro, fecha y cuatro nutrientes en base comparable.
- **Decisión requerida:** Sí: D-01/D-04; no se aprueban nuevos campos.

### [F-003] 16 recetas no indican expresamente el destino de un ingrediente cuantificado

- **Ámbito:** recipe
- **Objeto:** 15 recetas oliveoil y cena_pavo_alubias_lombarda soySauce; data/recipes.json
- **Prioridad:** P2
- **Estado de evidencia:** CONFIRMADO
- **Confianza:** alta
- **Dato actual:** Quince recetas incluyen aceite medido sin mención aceite/aliña en steps. La cena de pavo/alubias incluye 4 ml de soja sin instrucción de uso.
- **Contraste externo:** No aplica: comparación documental íntegra de ingredients/steps.
- **Problema/hipótesis:** Falta destino explícito. Saltear puede implicar aceite: no demuestra que la persona lo omita ni que las kcal calculadas sean erróneas.
- **Impacto:** 16 recetas; tabla de evidencia debajo. Todos esos nutrientes sí se incluyen en el cálculo.
- **Acción propuesta (no ejecutada):** Aclarar uso/reparto de lo cuantificado, sin añadir ni quitar cantidades.
- **Riesgo de regresión:** Una redacción que añada aceite extra duplicaría aportes; conservar cantidades.
- **Pruebas recomendadas:** Revisión manual con sinónimos; macros idénticos si solo cambia texto.
- **Decisión requerida:** Autorización posterior para editar catálogos; D-07 para convenciones.

## CANDIDATO

### [F-004] Reposo y tiempo activo requieren una semántica acordada

- **Ámbito:** recipe
- **Objeto:** avena_nocturna_chia; tarde_skyr_chia_pasass; data/recipes.json
- **Prioridad:** P2
- **Estado de evidencia:** CANDIDATO
- **Confianza:** media
- **Dato actual:** Avena: 5 min con reposo frío nocturno. Skyr/chía: 3 min con reposo de unos minutos.
- **Contraste externo:** No se cronometró ni se inventó un tiempo total.
- **Problema/hipótesis:** 5 min son coherentes como trabajo activo; no queda una semántica global inequívoca para timeMinutes.
- **Impacto:** 2 recetas. Avena distribuye correctamente leche 100+120=220 ml.
- **Acción propuesta (no ejecutada):** Definir tiempo activo/total y aclarar espera antes de cambiar valores o esquema.
- **Riesgo de regresión:** Cambiar tiempo afecta selección informativa de receta más rápida; nuevos campos requieren compatibilidad.
- **Pruebas recomendadas:** Casos activo/espera/horno y precalentado con validación culinaria.
- **Decisión requerida:** Sí: D-04.

### [F-005] Tres grupos cercanos conservan cantidades o tipos distintos

- **Ámbito:** recipe
- **Objeto:** DG-01/DG-02/DG-03; 8 recipeId en data/recipes.json
- **Prioridad:** P2
- **Estado de evidencia:** CANDIDATO
- **Confianza:** alta
- **Dato actual:** Cuatro bocadillos pan/pavo/tomate, dos yogures con plátano y dos con fruta de temporada; cantidades diferentes.
- **Contraste externo:** Comparación de conjuntos foodId y vectores de cantidades actuales; tabla debajo.
- **Problema/hipótesis:** Un conjunto igual no demuestra duplicación funcional. Ningún vector de cantidades completo es idéntico.
- **Impacto:** 8 recetas. Los cuatro bocadillos usan 2 rebanadas, cambiando rellenos. Puede haber referencias en planes/históricos no consultados.
- **Acción propuesta (no ejecutada):** Conservar IDs y evaluar si nombres explican cada variante.
- **Riesgo de regresión:** Eliminar o renombrar recipeId puede romper plantilla, planes e históricos.
- **Pruebas recomendadas:** Análisis informativo de duplicados, nunca borrado ni rechazo automático.
- **Decisión requerida:** Sí: D-02 antes de cualquier consolidación.

### [F-006] Rebanada genérica y peso comercial necesitan una equivalencia explícita

- **Ámbito:** food
- **Objeto:** bread; data/foods.json; 35 recetas
- **Prioridad:** P2
- **Estado de evidencia:** CANDIDATO
- **Confianza:** alta
- **Dato actual:** 250 kcal/100 g; 25 g/rebanada; compra orientativa 400 g. Dos rebanadas actuales=50 g=125 kcal. Todas cumplen entero y máximo dos.
- **Contraste externo:** [Bimbo Libra](https://www.bimbo.es/marcas/bimbo/bimbo-libra-100-integral), 2026-10-19: 235 kcal, P9.6 C38 F3.5 por 100 g, 450 g/15 rebanadas=30 g/rebanada. close.
- **Problema/hipótesis:** La conversión interna es válida. Un ejemplo de 30 g no invalida la aproximación genérica de 25 g.
- **Impacto:** 35 recetas, 4000 kcal y 144 g proteína sumadas. Dos rebanadas de esa marca serían 141 kcal, ejemplo condicional.
- **Acción propuesta (no ejecutada):** Elegir aproximación genérica o producto/peso concretos antes de cambiar.
- **Riesgo de regresión:** Peso por rebanada cambia nutrientes y saldo en gramos; preservar significado histórico.
- **Pruebas recomendadas:** Una/dos rebanadas enteras, conversión a g y reversos; no cambiar norma de máximo dos.
- **Decisión requerida:** Sí: D-06.

### [F-008] Cacao y cayena: residual 4/4/9 sin error demostrado

- **Ámbito:** food
- **Objeto:** cocoa/cayenne; data/foods.json
- **Prioridad:** P2
- **Estado de evidencia:** CANDIDATO
- **Confianza:** alta aritmética; baja causal
- **Dato actual:** Cocoa: 330 vs257 kcal (residual +73). Cayenne: 318 vs429.99 (residual -111.99) por 100 g.
- **Contraste externo:** Ficha cacao MAPA devolvió404; FDC170932 Internal Error. [USDA FAQ](https://fdc.nal.usda.gov/faq/) explica factores específicos y carbohidratos por diferencia; [anexo XIV UE](https://www.boe.es/buscar/doc.php?id=DOUE-L-2011-82311) incluye fibra 2 kcal/g.
- **Problema/hipótesis:** Faltan fibra, forma y factores. No se atribuye a una causa concreta ni se fuerzan kcal a 4/4/9.
- **Impacto:** Cocoa: 2 recetas/52.8 kcal sumadas; cayenne: 1 receta/0.5 g/1.59 kcal. Exposición baja frente a pan/aceite/yogur.
- **Acción propuesta (no ejecutada):** Contrastar ficha comparable, fibra y preparación antes de sustituir datos.
- **Riesgo de regresión:** Forzar aritmética simplificada podría empeorar valores o contradecir su metodología.
- **Pruebas recomendadas:** Alertas informativas con revisión manual; no rechazos automáticos por residual.
- **Decisión requerida:** Sí para política de alertas: D-08.

### [F-009] Gulas: volumen y complejidad son candidatos culinarios

- **Ámbito:** recipe
- **Objeto:** ensalada_templada_gulas; data/recipes.json
- **Prioridad:** P2
- **Estado de evidencia:** CANDIDATO
- **Confianza:** media
- **Dato actual:** 12 ingredientes, 15 min, 1 ración; 673.5 g sólidos+5 ml vinagre, 180 g cebolla cruda, 100 g gulas, 60 g mozzarella y 20 g curado.
- **Contraste externo:** Sin preparación cronometrada. Etiquetas declaradas de gulas/mozzarella quedan fuera del lote externo de 20.
- **Problema/hipótesis:** No demuestra tiempo imposible, ración incorrecta ni necesidad de reducir ingredientes.
- **Impacto:** Una receta; macros completos en recipes-audit.csv. Cayena se contabiliza entera aunque el tip permite retirarla.
- **Acción propuesta (no ejecutada):** Validar corte, porción y secuencia preparando la receta, sin cambiar cantidades por intuición.
- **Riesgo de regresión:** Alterar ración afecta energía, compra y la propuesta original.
- **Pruebas recomendadas:** Suma por componente, revisión de pasos y medición de trabajo activo.
- **Decisión requerida:** Sí para cambios de ración; sin umbral universal.

### [F-012] Alternativas textuales no garantizan la composición del ID base

- **Ámbito:** recipe
- **Objeto:** hamburguesa_pavo/snack_pavo_tostada/trucha_patatas; data/recipes.json
- **Prioridad:** P2
- **Estado de evidencia:** CANDIDATO
- **Confianza:** alta
- **Dato actual:** Filete/picado con turkey; pavo fresco alternativo a turkeySlice; dorada/merluza alternativos a trout.
- **Contraste externo:** No hay contraste de equivalencia de cada alternativa. El tip de trucha ya advierte ajustar kcal.
- **Problema/hipótesis:** Macro base calculado para ID original; sustitución culinaria puede cambiar composición/rendimiento.
- **Impacto:** Tres recetas; hamburguesa también aparece en F-003 y snack en DG-01. No sumar recuentos sin deduplicar.
- **Acción propuesta (no ejecutada):** Aclarar alcance de alternativas o proponer variantes tras autorización.
- **Riesgo de regresión:** Cambiar foodId afecta fuente, nutrientes y compra; conservar snapshots.
- **Pruebas recomendadas:** Comparación independiente turkey/turkeyMince, sin convertir texto en equivalencia nutricional.
- **Decisión requerida:** Sí: D-07.

### [F-014] Cuatro productos próximos difieren del genérico

- **Ámbito:** food
- **Objeto:** bread/skyr/rice/milk; data/foods.json
- **Prioridad:** P2
- **Estado de evidencia:** CANDIDATO
- **Confianza:** alta lectura; media equivalencia
- **Dato actual:** kcal catálogo/referencia: 250/235, 64/51, 360/349, 50/45; misma base por par.
- **Contraste externo:** Fuentes abiertas2026-10-19: Bimbo Libra, Danone Skyr, Brillante Oro y Central Lechera Asturiana. URLs/identidad en foods-audit.csv.
- **Problema/hipótesis:** close significa categoría comparable, no marca/variedad exacta. Las diferencias no demuestran error del genérico.
- **Impacto:** 95 líneas combinadas, con recetas solapadas; 11008.4 kcal atribuidas en el conjunto de raciones base.
- **Acción propuesta (no ejecutada):** Elegir alimento representado antes de adoptar cifras; deltas de cuatro nutrientes en matriz.
- **Riesgo de regresión:** Adoptar una marca puede sesgar representación de otras marcas y formatos.
- **Pruebas recomendadas:** Forma/base iguales, etiqueta vigente y peso de porción; sin tolerancia universal nueva.
- **Decisión requerida:** Sí: D-01/D-06.

## SIN_EVIDENCIA

### [F-013] 86 alimentos sin cierre de contraste comparable

- **Ámbito:** food
- **Objeto:** Todos salvo bread/skyr/rice/milk; data/foods.json
- **Prioridad:** P2
- **Estado de evidencia:** SIN_EVIDENCIA
- **Confianza:** alta sobre alcance
- **Dato actual:** 20 investigados: 4 close, 3 no comparables, 13 sin contraste válido; 70 no consultados. Total83 pending_source+3 not_comparable.
- **Contraste externo:** URLs e intentos reales en summary.md; campos reference_* vacíos cuando falló el acceso fiable.
- **Problema/hipótesis:** No demuestra error en esos86 alimentos. Un extracto o fuente declarada no es cotejo.
- **Impacto:** 112 recetas aún tienen energía de ingredientes sin contraste comparable completo.
- **Acción propuesta (no ejecutada):** Recuperar accesos y continuar lotes por impacto; no sustituir valores usando búsquedas fallidas.
- **Riesgo de regresión:** Falsa verificación llevaría a cambios injustificados.
- **Pruebas recomendadas:** Alinear estados de fila, fechas, fuentes abiertas y numeradores de cobertura.
- **Decisión requerida:** No para registrar limitación; D-01/D-08 antes de adoptar políticas.

### [F-015] Rendimientos y conversiones aproximadas pendientes

- **Ámbito:** food
- **Objeto:** chickenWings/soySauce/vinegar; data/foods.json
- **Prioridad:** P2
- **Estado de evidencia:** SIN_EVIDENCIA
- **Confianza:** alta declaración; baja exactitud
- **Dato actual:** Alitas convierten254 kcal comestibles x 0.34 a 86.4 kcal/100 g comprados; salsa/vinagre declaran aproximaciones por volumen.
- **Contraste externo:** Fuentes declaradas en source_text; estos3 alimentos fuera del lote externo, sin contraste en vivo.
- **Problema/hipótesis:** No tratar alitas como100 g comestibles ni aplicar0.34 dos veces. No asumir g=ml en líquidos.
- **Impacto:** Una receta de alitas, 7 líneas de salsa y 1 de vinagre.
- **Acción propuesta (no ejecutada):** Contrastar registro, rendimiento y densidad en lote posterior; no cambiar modelo ahora.
- **Riesgo de regresión:** Cambiar base sin cantidades alteraría macros, compra y significado histórico.
- **Pruebas recomendadas:** Alitas300 g comprados=259.2 kcal actuales; verificar rendimiento sin duplicarlo.
- **Decisión requerida:** Sí para cambios de modelo/esquema: D-04/D-06.

## DECISION_PENDIENTE

### [F-007] Café mezcla compra seca y estimación de bebida

- **Ámbito:** food
- **Objeto:** coffee; data/foods.json; 20 recetas
- **Prioridad:** P2
- **Estado de evidencia:** DECISION_PENDIENTE
- **Confianza:** alta
- **Dato actual:** Café molido g/per_100 g con cuatro ceros; 7 g por receta. Los pasos preparan café, sin ordenar ingerir el sólido.
- **Contraste externo:** [Nestlé Intenso](https://www.nestleprofessional.es/cafe-bebidas-hosteleria/cafe-en-grano-alta-calidad/nescafe-intenso-cafe-en-grano-1kg), código 8445290465993, 2026-10-19: grano, sin tabla de infusión comparable.
- **Problema/hipótesis:** La convención descuenta seco pero no describe literalmente su nutrición. No imputar automáticamente kcal del café seco como ingerido.
- **Impacto:** 20 recetas, 140 g secos sumados, 0 kcal por convención actual. Volumen/extracción y residuos no conocidos.
- **Acción propuesta (no ejecutada):** Acordar modelo de bebida y compra; conservar convención hasta decisión.
- **Riesgo de regresión:** Imputar sólido ingerido alteraría todos los desayunos; cambio de unidades afecta inventario.
- **Pruebas recomendadas:** 7 g de compra por preparación, leche contabilizada aparte y sin duplicados.
- **Decisión requerida:** Sí: D-05.

### [F-010] Aceite: fuente por volumen incompatible y presentación contradictoria

- **Ámbito:** food
- **Objeto:** oliveoil; data/foods.json
- **Prioridad:** P2
- **Estado de evidencia:** DECISION_PENDIENTE
- **Confianza:** alta
- **Dato actual:** 900 kcal/100 g, 100 g grasa; envase orientativo500 g; 53 recetas.
- **Contraste externo:** [La Española 1 L](https://tienda.laespanolaaceites.com/products/aceite-de-oliva-virgen-extra-1-litro?pr_prod_strat=copurchase&pr_rec_id=ebd7ff1d0&pr_rec_pid=7169629388955&pr_ref_pid=7634872926363&pr_seq=uniform), 2026-10-19: 822 kcal/91.4 g grasa por 100 ml y segunda sección contradictoria900 Kcal/3700 kj con etiquetas invertidas.
- **Problema/hipótesis:** No comparar g con ml sin densidad validada; la contradicción externa tampoco demuestra fallo del catálogo.
- **Impacto:** 53 recetas y 3753 kcal sumadas; confundir500 g y 500 ml afectaría envases e inventario.
- **Acción propuesta (no ejecutada):** Contrastar etiqueta/ficha coherente y decidir equivalencia comercial.
- **Riesgo de regresión:** Cambiar unit/recipeUnit requiere conversión histórica y pruebas.
- **Pruebas recomendadas:** Densidad justificada, compras por envase, descuento y reversos.
- **Decisión requerida:** Sí: D-06.

### [F-011] Descripciones vacías son una opción de contenido

- **Ámbito:** recipe
- **Objeto:** 112 description vacíos; data/recipes.json
- **Prioridad:** P3
- **Estado de evidencia:** DECISION_PENDIENTE
- **Confianza:** alta
- **Dato actual:** 112 description vacíos y 1 tip vacío (media_manzana_cafe_leche). Los schemas permiten ambos.
- **Contraste externo:** No aplica.
- **Problema/hipótesis:** No hay incumplimiento contractual; completar solo si aporta utilidad.
- **Impacto:** 112 fichas; sin efecto aritmético.
- **Acción propuesta (no ejecutada):** Decidir utilidad de descripciones; no rellenar texto redundante.
- **Riesgo de regresión:** Contenido innecesario o beneficios no respaldados.
- **Pruebas recomendadas:** Intro vacía y esquema; evitar mínimos arbitrarios de longitud.
- **Decisión requerida:** Sí: D-03.

## Evidencia F-003

| recipeId | Ingrediente | Cantidad base | kcal incluidas |
| --- | --- | ---: | ---: |
| crema_tortilla | oliveoil | 10 g | 90.0000 |
| pavo_arroz_tomate | oliveoil | 10 g | 90.0000 |
| wok_pollo_fideos | oliveoil | 10 g | 90.0000 |
| pollo_esparragos | oliveoil | 10 g | 90.0000 |
| arroz_gambas_guisantes | oliveoil | 10 g | 90.0000 |
| crema_calabaza_pavo | oliveoil | 10 g | 90.0000 |
| cuscus_pollo | oliveoil | 10 g | 90.0000 |
| huevos_alubias | oliveoil | 5 g | 45.0000 |
| wrap_pavo | oliveoil | 10 g | 90.0000 |
| hamburguesa_pavo | oliveoil | 10 g | 90.0000 |
| alubias_revuelto | oliveoil | 10 g | 90.0000 |
| comida_soja_berenjena_arroz | oliveoil | 5 g | 45.0000 |
| comida_guiso_lenteja_roja | oliveoil | 5 g | 45.0000 |
| cena_berenjena_rellena_ternera | oliveoil | 5 g | 45.0000 |
| cena_crema_coliflor_lenteja | oliveoil | 5 g | 45.0000 |
| cena_pavo_alubias_lombarda | soySauce | 4 ml | 2.1200 |

## Evidencia F-005

| Grupo | recipeId | Tipo | Cantidades | kcal | Proteína g |
| --- | --- | --- | --- | ---: | ---: |
| DG-01 | bocadillo_pavo | media | bread 2 ud; turkeySlice 80 g; tomato 80 g | 221.8000 | 19.7000 |
| DG-01 | bocadillo_pavo_peq | media | bread 2 ud; turkeySlice 80 g; tomato 60 g | 218.2000 | 19.5000 |
| DG-01 | mini_pavo_tomate | media | bread 2 ud; turkeySlice 50 g; tomato 80 g | 190.9000 | 14.3000 |
| DG-01 | snack_pavo_tostada | tarde | bread 2 ud; turkeySlice 85 g; tomato 80 g | 226.9500 | 20.6000 |
| DG-02 | snack_yogur_platano | tarde | skyr 190 g; banana 1 ud | 229.6000 | 20.3200 |
| DG-02 | yogur_platano_simple | media | skyr 170 g; banana 1 ud | 216.8000 | 18.3200 |
| DG-03 | yogur_fruta | tarde | skyr 170 g; seasonFruit 1 ud | 191.3000 | 17.7500 |
| DG-03 | yogur_fruta_ligero | tarde | skyr 140 g; seasonFruit 1 ud | 172.1000 | 14.7500 |

## Duplicidad de alimentos y diversidad

Cero IDs o nombres exactos repetidos; cero ingredientes repetidos dentro de receta; cero vectores idénticos foodId/cantidad/unidad entre recetas. Posibles solapamientos semánticos no equivalen a duplicados: beans/blackBeans (tipo), lentils/redLentilsDry (cocido/seco), turkey/turkeyMince/turkeySlice (preparación), skyr/greek/cottageCheese (lácteos distintos), cod/hake y trout (especies y denominaciones amplias). No se recomienda consolidar sin revisar formas, referencias y D-02. peanuts es el único alimento no referenciado en recetas; no se consultaron compras/despensas privadas para inferir desuso.

La distribución por tipo y concentración de ingredientes aparecen en summary.md. No se impone un número arbitrario de recetas ni se exige que las105 comidas sean distintas.


<a id="lote2"></a>

## Ampliación vigente — Lote L2, 19/10/2026

### Ampliación de F-010: nutrición por masa disponible; formato comercial abierto

La referencia oficial USDA FDC 171413 (NDB 04053), aceite de oliva genérico, permite contraste close por 100 g: 884 kcal/P0/C0/G100 frente a 900/P0/C0/G100. Se leyó el [archivo CSV primario](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip), no una ficha web inaccesible.

Esto supera para el contraste nutricional el bloqueo anterior de g/ml; no valida identidad AOVE, densidad ni envase 500 g. La sección comercial contradictoria de La Española queda solo en el historial L1. F-010 mantiene DECISION_PENDIENTE/P2 para D-06, sin convertir g a ml. El método energético puede diferir: no se demuestra que900 sea erróneo ni que884 deba sustituirlo.

### Ampliación de F-013: cobertura acumulada

- Diez alimentos revisados de nuevo, ocho nuevas comparaciones close y dos fuentes identificadas aún sin homologación.
- Acumulado:12 close, 75 pending_source, 3 not_comparable (eggs/beans/tuna), 0 exact.
- Los78 sin comparación close/exact no se clasifican como erróneos. Se actualizaron68 indicadores de incertidumbre por receta, sin cambiar macros.
- L2 retoma diez alimentos del lote anterior:20 alimentos distintos investigados en total, no30. F-013 mantiene SIN_EVIDENCIA/P2 para la cobertura pendiente.

### [F-016] Ocho referencias primarias próximas permiten estudiar diferencias

- **Ámbito:** food
- **Objeto:** potato/turkey/chicken/oats/salmon/sweetpotato/walnuts/oliveoil; data/foods.json y filas correspondientes de foods-audit.csv.
- **Prioridad:** P2
- **Estado de evidencia:** CANDIDATO
- **Confianza:** alta para lectura e identificación; media para equivalencia alimentaria; no validación exacta.
- **Dato actual:** respectivamente, por 100 g, kcal77/108/110/370/205/86/650/900. Valores actuales de los cuatro nutrientes y referencias completos en summary.md y foods-audit.csv.
- **Contraste externo:** USDA SR Legacy, consulta 2026-10-19, FDC 170026/174515/171077/173904/175167/168482/170187/171413 respectivamente. [Archivo CSV oficial leído](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip); kcal referencia77/114/120/379/208/86/654/884. Release 04/2018, publication_date FDC 2019-04-01; datos históricos, no muestras 2026. NDB y row IDs de nutrientes en reason.
- **Problema/hipótesis:** las diferencias nominales no prueban error del genérico. Patata tiene piel en la referencia; pavo/pollo solo carne cruda; salmón es atlántico de acuicultura; aceite es oliva genérico por masa. La definición heredada de hidratos no consta: no se homologa a carbohydrate by difference en patata/avena/boniato/nueces.
- **Impacto:**103 líneas de ingredientes, 68 recetas distintas, 11718.7 kcal de aporte base sumadas. Estos son datos del recetario, no frecuencia real de consumo. No se recalculó la dieta con cifras sustituidas.
- **Acción propuesta (no ejecutada):** estudiar corte, preparación, variedad/origen y método de energía/hidratos; evaluar después si mantener, documentar o cambiar un valor. Patata/boniato coinciden en kcal, lo que no certifica el resto.
- **Riesgo de regresión:** adoptar producto/estado distintos cambia porciones futuras y compra; cambios en piezas o unidades afectarían inventario y snapshots. Ningún ID, cantidad o peso se ha cambiado.
- **Pruebas recomendadas:** datos por 100 g, estado crudo/seco y porción comestible; energía1008 frente a proteína1003/grasa1004/carbohidratos1005; sin rechazo por 4/4/9 ni umbral universal. No mezclar redondeos del JSON y CSV.
- **Decisión requerida:** sí, D-01/D-04/D-06/D-08 según representación, metadatos y criterios; siguen propuestas.

### [F-017] Huevo identificado, pero su unidad de catálogo sigue sin tamaño

- **Ámbito:** food
- **Objeto:** eggs; data/foods.json#/foods/10; 16 líneas de ingredientes en data/recipes.json.
- **Prioridad:** P2
- **Estado de evidencia:** DECISION_PENDIENTE
- **Confianza:** alta para referencia y falta de peso; equivalencia per_unit sin establecer.
- **Dato actual:** per_unit72 kcal/P6.3/C0.4/G5; compra6 ud; sin approximateEdibleWeight_g_per_unit.
- **Contraste externo:** FDC 171287/NDB 01123, Egg, whole, raw, fresh, SR Legacy; [CSV oficial](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip), consulta 2026-10-19. Por 100 g comestibles:143 kcal/P12.56/C0.72/G9.51. Porciones food_portion88374=large50 g, 88378=medium44 g; también38/56/63 g para otros tamaños.
- **Problema/hipótesis:** no se puede comparar automáticamente72/ud con 143/100 g. Que50 g produzca71.5 kcal/P6.28/C0.36/G4.755 es un escenario documentado, no el peso elegido para Menuki. Medium44 g produciría62.92 kcal; no son pesos con cáscara ni equivalencia implícita de un calibre comercial europeo.
- **Impacto:**16 recetas, 26 huevos en suma de raciones base, 1872 kcal actuales atribuibles; ninguna conversión ni nutriente cambiado.
- **Acción propuesta (no ejecutada):** acordar qué unidad representa el catálogo y cómo se documenta; conservar per_unit y las cantidades mientras se decide.
- **Riesgo de regresión:** cambiar masa supuesta altera todas las recetas con huevo; cambiar unit a gramos alteraría compras y consumos.
- **Pruebas recomendadas:** porciones de distintos tamaños, consumo por unidad y distinción cáscara/porción comestible. Mantener vacíos deltas de bases no homologadas.
- **Decisión requerida:** sí, D-06; cualquier nuevo metadato requiere D-04. Registro exacto identificado, alimento Menuki no validado exactamente.

### [F-018] Alubias: origen legible sin garantía suficiente de peso escurrido

- **Ámbito:** food
- **Objeto:** beans; data/foods.json#/foods/49; 4 recetas.
- **Prioridad:** P2
- **Estado de evidencia:** SIN_EVIDENCIA
- **Confianza:** alta para contenido de las fuentes; baja para equiparar preparación/base.
- **Dato actual:** alubias cocidas escurridas, per_100g110 kcal/P7/C17/G0.5; bote orientativo400 g escurridos.
- **Contraste externo:** FDC 175204/NDB 16051, Beans, white, mature seeds, canned, SR Legacy; [CSV oficial](https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip), consulta 2026-10-19. Por 100 g:114 kcal/P7.26/C21.2/G0.29, fibra4.8; descripción canned y taza262 g no acreditan drained. FDC 175203 hervida sin sal no identifica conserva escurrida.
- **Problema/hipótesis:** la proximidad de 114/110 no homologa estado. [Gvtarra](https://www.gvtarra.com/nuestros-productos/la-mejor-legumbre/alubias-blancas/) declara400 g escurridos pero no fija denominador de su tabla ni base escurrida; [JJJ código 7002](https://conservasjjj.com/wp-content/uploads/2023/06/Alubias-Blancas-3KG-1.pdf), revisión 14/05/2025, dice por 100 g producto y grasa<0.5, sin aclarar escurrido; [ficha Luengo EAN8410505271010](https://amh.es/wp-content/uploads/2024/04/ALUBIA-BLANCA-COCIDA-LUENGO-570-GR_806020062.pdf), Rev9 noviembre 2021, está en un distribuidor y no fija denominador de la tabla. No se inventa garantía faltante ni se atribuye etiqueta vigente.
- **Impacto:**4 recetas, 913 kcal y58.1 g proteína sumadas actuales; la incertidumbre no se elimina en recipes-audit.csv.
- **Acción propuesta (no ejecutada):** obtener ficha/etiqueta primaria explícita por 100 g escurridos del producto elegido, con fecha e identidad. No usar variedad seca, hervida o con caldo por su similitud numérica.
- **Riesgo de regresión:** cambiar entre peso neto/escurrido altera aporte, envases y cantidades; importar fichas comerciales requiere revisar condiciones de reutilización.
- **Pruebas recomendadas:** verificar denominador, drenaje, forma, variedad y nutrientes; no convertir cifras con signo< en ceros exactos ni deducir densidad/rendimiento.
- **Decisión requerida:** D-01/D-06 para representación de producto; la base escurrida es evidencia que falta, no se resuelve solo por elección del propietario.

## Trazabilidad del lote L2

El CSV conserva en cada una de las diez filas el reason original bajo L1 HISTORICO y un objeto con los campos de referencia/estado previos. L2 VIGENTE contiene FDC/NDB, tipo, publicación, consulta, row IDs, valores oficiales y deltas válidos. Las otras80 filas de alimentos se conservan. En68 recetas se conserva el indicador anterior en reason y se actualizan únicamente trazabilidad e incertidumbre; los nutrientes base y las conclusiones culinarias no se reescriben.

Se leyeron dos formatos oficiales y se utilizó consistentemente el CSV por su precisión: huevo12.56 g proteína en CSV frente 12.6 en JSON; avena13.15 frente 13.2. Una coincidencia de ID exacto del registro no se etiqueta match_quality=exact para un genérico Menuki. La descarga primaria evita depender de resultados de búsqueda; su contenido sí se abrió mediante lectura HTTPS en memoria. SR Legacy incluye valores analíticos/calculados/imputados; no todas las cifras son análisis de una única muestra. No se ha inferido una causa del residual4/4/9.

Licencia USDA: dominio público/CC0 según [sitio oficial](https://fdc.nal.usda.gov/), consultado19/10/2026; se conserva atribución. No se adopta como fuente global ni se aprueba D-01. Las condiciones comerciales de las fichas de alubias no se han dado por resueltas.
