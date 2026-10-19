# Encargo para Codex: auditoría nutricional y culinaria de Menuki

**Propósito:** copiar el bloque siguiente en un chat nuevo de Codex abierto en el repositorio local `food_planning`. Es una **tarea de auditoría y documentación**, no de corrección automática.

## Prompt listo para pegar

```text
Actúa como auditor de calidad de datos alimentarios, revisión nutricional no clínica y arquitectura de catálogos JSON en el proyecto Menuki.

OBJETIVO
Audita íntegramente los catálogos existentes data/foods.json y data/recipes.json. Necesito un diagnóstico verificable de calidad nutricional, fuentes, unidades, formatos comerciales, recetas, duplicidades potenciales y riesgos de cambio. NO quiero recetas nuevas ni cambios en los catálogos todavía.

RAMA Y CONTEXTO
- Usa la rama dev actual como fuente de verdad, NO chore/legal-foundation. Recoge el commit de origen y la versión real de ambos catálogos.
- Lee primero AGENTS.md, README.md, context/context.md, docs/planner/specification.md, docs/open-questions.md, docs/roadmap.md y docs/audits/catalog-quality/README.md, 01-plan-auditoria.md y 02-plantillas-resultados.md.
- Inspecciona data/foods.schema.json, data/recipes.schema.json, js/data/catalogs.js y tests/catalogs.test.js.
- Respeta el flujo Git de AGENTS.md. Antes de cualquier operación sobre el checkout, inspecciona git status y la rama; no alteres cambios ajenos, no hagas stash, reset, rebase ni worktrees. Si el estado exige una decisión del propietario, indícalo antes de escribir.

MODO DE TRABAJO
1. Solo auditoría: NO edites data/foods.json, data/recipes.json, schemas, tests, código JS/HTML/CSS, Supabase, archivos personales o deploy.
2. Puedes CREAR exclusivamente los informes de texto/CSV en docs/audits/catalog-quality/results/ respetando el estado del checkout. No hagas commits, pushes, PRs ni merges sin una autorización posterior explícita.
3. Comprueba los contratos existentes antes de interpretar unidades. Está permitido usar 0.5 ud de fruta. El pan se mide en rebanadas enteras, hasta dos por comida. Mantén los IDs estables y la diferencia entre unit, recipeUnit y nutrition.basis.
4. No decidas sin permiso una nueva fuente global, nuevos umbrales nutricionales, nuevos campos JSON, nuevos tipos de alimento o una política de consolidación. Registra esas decisiones como pendientes.
5. Nunca inventes URLs, fuentes oficiales, identificadores de alimentos, cifras nutricionales o resultados de pruebas. Si no puedes consultar fuentes externas, marca pending_source/unverified y continúa con el análisis estático sin simular verificación.
6. Separa siempre hallazgos CONFIRMADOS, CANDIDATOS, SIN_EVIDENCIA y DECISION_PENDIENTE. No etiquetes como error una diferencia de 4/4/9 sin estudiar fibra, estado del alimento y base nutricional.
7. No introduzcas datos personales o confidenciales en los archivos de auditoría. No toques ni consultes registros privados de usuarios para determinar la calidad del catálogo.

PROCEDIMIENTO
A. Recuenta alimentos, recetas, referencias, tipos, fuentes actuales, unidades, descripciones y posibles duplicados. Reproduce y ajusta la fotografía preliminar del plan sobre el commit de dev actual.
B. Para CADA alimento (100 % de la lista): inventaría su fuente actual, estado nutricional, unidad de compra y de receta, base de cálculo, peso comestible y exposición en recetas. En ESTA primera pasada investiga fuentes externas comparables SOLO para un lote priorizado de 15–20 alimentos con mayor impacto; captura URL/ID/fecha/estado del alimento y cuestiones de licencia. Para todos los demás conserva la fila y marca pending_source/unverified: NO intentes 90 consultas externas de una vez. No sustituyas valores en los JSON.
C. Para CADA receta (100 %): reproduce determinísticamente kcal y macros de su ración base según los alimentos actuales; comprueba cantidades, unidades, nombres, pasos, tiempos, duplicados de ingredientes y variantes culinarias. Distingue la receta base de las raciones dinámicas del perfil de usuario.
D. Calcula priorización por impacto sobre recetas base (presencia de foodId, kcal y proteína aportadas, riesgo por unidades y calidad de fuente); no la presentes como frecuencia real de consumo.
E. Analiza los casos candidatos sugeridos en el plan (cocoa, cayenne, coffee, bread, bocadillos de pavo, avena nocturna, ensalada de gulas) y explica cuáles son problemas demostrados y cuáles no.
F. Ejecuta npm test si Node >=20 está disponible; registra comando, salida y cualquier limitación. No modifiques tests. Sugiere pruebas adicionales para una futura fase de corrección.
G. Genera docs/audits/catalog-quality/results/summary.md, foods-audit.csv, recipes-audit.csv, findings.md y decisions.md con EXACTAMENTE los contratos y criterios definidos en 02-plantillas-resultados.md. Usa rutas del repo y enlaces exactos a fuentes; incluye cobertura completa aunque existan fuentes pendientes.
H. Al finalizar, presenta un resumen corto: cobertura, número de hallazgos confirmados por prioridad, pendientes de contraste, 10 primeras acciones recomendadas y decisiones necesarias. DETENTE: no apliques los cambios.

CRITERIOS DE CALIDAD
- El informe no debe confundir datos declarados con fuentes verificadas.
- No inventar fuentes ni disfrazar como comprobada una búsqueda fallida.
- No sugerir eliminación/renombrado de un foodId/recipeId sin evaluar los históricos.
- No convertir todas las recetas a un objetivo fijo de kcal o proteína.
- No cambiar de forma implícita la norma de desayunos, frutas por piezas, pan por rebanadas o las unidades.
- No modificar el catálogo para 'arreglar' un problema que todavía es una mera hipótesis.
- En esta primera pasada NO es obligatorio verificar externamente los 90 alimentos: crea inventario completo y deja pendientes para lotes posteriores. Declara la cobertura REAL de verificación y no la confundas con cobertura de inventario.

Comienza comprobando el estado Git y las normas del repositorio. Después inspecciona los catálogos y produce únicamente los informes de auditoría.
```

## Instrucción para una segunda tarea (solo tras revisar los informes)

**No ejecutar ahora.** Una vez revisada la auditoría con el propietario, se redactará otro encargo que cite IDs de hallazgos **aprobados**, diffs propuestos, pruebas de impacto y actualización coordinada de `catalogVersion`. Antes de tocar valores nutricionales, analizar la repercusión sobre recetas, planificador, compra, despensa y compatibilidad histórica. Los cambios se revisarán en PRs pequeños contra `dev`, según `AGENTS.md`.

## Prompt de continuación para lotes posteriores (usar únicamente tras la primera pasada)

```text
Continúa la auditoría de calidad de Menuki sobre el mismo commit o, si la rama dev cambió, detecta el cambio y detente para reconciliarlo antes de actualizar resultados. Respeta AGENTS.md y los documentos de docs/audits/catalog-quality/.

Toma los resultados existentes y selecciona los próximos 15–20 alimentos con estado pending_source, priorizados por impacto calculado en recetas. Comprueba fuentes comparables con URL, identificador, fecha, base nutricional, estado crudo/cocinado y licencia; marca los que no puedas verificar. Actualiza SOLAMENTE los CSV e informes bajo docs/audits/catalog-quality/results/, manteniendo 90/90 alimentos y 112/112 recetas, sin cambiar los catálogos. Resume fuentes verificadas en este lote, cambios de interpretación, hallazgos nuevos y pendientes. No hagas commit ni push.
```
