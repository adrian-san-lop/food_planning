# Plantillas de salida y registro de hallazgos

**Uso:** formatos para el trabajo **de solo auditoría**. Codex creará los archivos en la subcarpeta `results/` después de inspeccionar el `HEAD` real de `dev`. Los ejemplos siguientes **no son correcciones aprobadas**.

## A. `results/summary.md`: resumen ejecutivo

Usar esta estructura:

```markdown
# Informe de auditoría de catálogos Menuki

Fecha de análisis: AAAA-MM-DD
Repositorio: adrian-san-lop/food_planning
Rama de origen: dev
Commit de origen: <SHA_REAL>
Versión foods / recipes: <VERSIONES>
Alcance: solo inventario/auditoría, sin cambios en catálogos.

## Resumen
- Total de alimentos, recetas, referencias de ingredientes.
- Alimentos con fuente contrastada, estimación heredada, fuente no comparable y pendiente.
- Recetas auditadas, recetas con incidencias confirmadas y candidatos a revisión.
- Riesgos más relevantes y nivel de confianza de los resultados.

## Hallazgos principales
| ID | Tipo | Prioridad | Estado | Objeto | Evidencia | Propuesta |

## Métricas de cobertura
| Métrica | Numerador | Denominador | % / Estado | Método de obtención |

## Análisis de impacto
- Qué alimentos aparecen con más frecuencia.
- Qué alimentos aportan mayor proporción de energía/proteína en las recetas base.
- Qué recetas se verían afectadas por los cambios propuestos.
- Aclarar que NO se trata de frecuencia real de consumo en los usuarios.

## Fuentes no disponibles y limitaciones
- URL/identificador no verificable; pendientes de consulta.
- Restricciones de licencia, ambigüedad de equivalencias, datos faltantes.
- Separar hallazgos demostrados de opiniones o hipótesis.

## Plan de corrección recomendado (SIN IMPLEMENTAR)
- Lotes pequeños y pruebas sugeridas.
- Decisiones que debe tomar el propietario.

## Pruebas ejecutadas
- Comandos y resultado literal de cada uno.
- Si no se ejecutaron, indicar el motivo.
```

## B. `results/foods-audit.csv`: una fila por cada `food.id`

Cabecera obligatoria (UTF-8, separador `,`, comillas CSV estándar):

```csv
food_id,name,current_unit,current_recipe_unit,current_nutrition_basis,current_kcal,current_protein_g,current_carbohydrates_g,current_fat_g,current_edible_weight_g_per_unit,current_purchase_quantity,current_purchase_unit,source_text,source_class,reference_name,reference_id,reference_url,accessed_at,reference_form,reference_basis,reference_kcal,reference_protein_g,reference_carbohydrates_g,reference_fat_g,match_quality,delta_kcal_absolute,delta_kcal_percent,recipe_occurrences,recipe_energy_share_percent,review_status,evidence_status,priority,proposed_action,reason
```

Interpretación de los campos clave:

| Campo | Significado y regla |
| --- | --- |
| `source_class` | `legacy`, `USDA`, `BEDCA`, `manufacturer`, `other`, `unknown`; depende del texto actual, sin presuponer verificación |
| `reference_name`, `reference_id`, `reference_url` | Identidad **consultada**, no inferida. Si no hay acceso fiable, dejar vacíos |
| `reference_form` | `raw`, `cooked`, `dry`, `drained`, `prepared`, `packaged`, `other` o vacío; describir en `reason` |
| `match_quality` | `exact`, `close`, `not_comparable`, `unverified` |
| `delta_kcal_*` | Calcular **solo** para fuentes comparables y la misma base; dejar vacío si falta comparación válida |
| `recipe_occurrences` | Número de líneas de ingredientes que utilizan el ID en recetas, no frecuencia de consumo real |
| `recipe_energy_share_percent` | Porción de las kcal teóricas sumadas de las recetas base atribuible a ese alimento |
| `review_status` | `verified_keep`, `verified_candidate_change`, `pending_source`, `review_needed`, `not_comparable` |
| `evidence_status` | `CONFIRMADO`, `CANDIDATO`, `SIN_EVIDENCIA`, `DECISION_PENDIENTE` |
| `priority` | `P0`, `P1`, `P2`, `P3` o vacío cuando no hay hallazgo |
| `proposed_action` | `keep`, `consider_change`, `investigate`, `document`, `none` |

No rellenar valores futuros inventados para obtener una matriz aparentemente completa. Deben aparecer **todos** los alimentos, aunque existan campos de contraste vacíos.

## C. `results/recipes-audit.csv`: una fila por cada `recipe.id`

```csv
recipe_id,name,meal_type,base_servings,time_minutes,ingredient_count,steps_count,description_present,tip_present,base_kcal,base_protein_g,base_carbohydrates_g,base_fat_g,estimated_energy_from_unverified_foods_percent,unverified_food_ids,missing_food_ids,unit_problems,portion_or_preparation_questions,steps_ingredient_consistency,time_interpretation,duplicate_group,culinary_review_status,evidence_status,priority,proposed_action,reason
```

Criterios de uso:

- `base_*`: cálculos **por ración base** a partir del catálogo actual, sin actividad ni adaptación personalizada; documentar método y redondeo.
- `estimated_energy_from_unverified_foods_percent`: porcentaje de energía aportada por alimentos sin **contraste externo realizado**, no limitarse a detectar texto `heredada`. Si no se han verificado todas las fuentes, indicarlo.
- `missing_food_ids`: debe quedar vacío si se cumple el contrato; si no, registrar IDs concretos.
- `unit_problems`: incompatible según esquema y lógica real, **no** marcar media pieza de fruta como error (está permitida).
- `duplicate_group`: etiqueta estable del grupo de recetas candidatas. No implica eliminación ni prioridad alta.
- `culinary_review_status`: `reviewed_ok`, `review_needed`, `not_reviewed`, `needs_expert_review`.
- `time_interpretation`: `active`, `elapsed`, `ambiguous` o vacío según evidencia. No inventar minutos si faltan.

## D. `results/findings.md`: fichas de anomalías priorizadas

Una ficha por incidencia:

```markdown
### [F-001] Título descriptivo
- **Ámbito:** food / recipe / contract / documentation
- **Objeto:** `food_id` o `recipe_id` (y ruta exacta)
- **Prioridad:** P1 | P2 | P3 (P0 solo con justificación excepcional)
- **Estado de evidencia:** CONFIRMADO | CANDIDATO | SIN_EVIDENCIA | DECISION_PENDIENTE
- **Confianza:** alta | media | baja
- **Dato actual:** cifra, unidad, forma del alimento y evidencia de código
- **Contraste externo:** URL, ID, fecha, datos y condiciones de comparabilidad (o pendiente)
- **Problema/hipótesis:** explicación precisa
- **Impacto:** ingredientes/recetas afectados; riesgo nutricional/de compra/UX
- **Acción propuesta (no ejecutada):** corrección candidata o investigación necesaria
- **Riesgo de regresión:** catálogo, planificador, compra, inventario, históricos
- **Pruebas recomendadas:** casos reproducibles
- **Decisión requerida:** sí/no y en qué consiste
```

### Ejemplos de candidatos iniciales

| Código propuesto | Ámbito | Motivo | Qué NO hacer |
| --- | --- | --- | --- |
| F-cocoa | `cocoa` | Diferencia de kcal respecto a 4/4/9 en la cifra actual | No sustituir kcal usando solo macros; investigar fibra/base |
| F-cayenne | `cayenne` | Diferencia mayor respecto a 4/4/9 | No asumir error; comprobar componentes y fuente USDA exacta |
| F-coffee | `coffee` | Café molido en gramos y cifra energética de bebida casi nula | No imputar automáticamente kcal del café seco |
| F-bread | `bread` | 25 g/rebanada; conversión y envases en gramos | No modificar sin evaluar compras y despensa |
| R-turkey | Variantes de bocadillo de pavo | Comparten conjunto de ingredientes | No eliminar IDs ni fusionar automáticamente |
| R-oats | `avena_nocturna_chia` | Tiempo registrado como preparación activa y hay reposo | No inventar tiempo total sin comprobar intención |
| R-gulas | `ensalada_templada_gulas` | 12 ingredientes y tiempo de 15 min | Complejidad no demuestra que el tiempo sea incorrecto |

Estas entradas son **semillas para comprobación**, no resultados de una auditoría cerrada. Si un dato resulta adecuado, dejarlo documentado como `verified_keep`.

## E. `results/decisions.md`: decisiones reservadas al propietario

Formato:

```markdown
# Decisiones pendientes de la auditoría

| ID | Cuestión | Opciones | Recomendación y motivo | Impacto | Decisión del propietario | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| D-01 | Fuente de referencia prioritaria | Genérico / fabricante / criterio por alimento | Por determinar | Nutrición/licencias | Pendiente | Propuesto |
| D-02 | Política de variantes cercanas de recetas | Conservar / etiquetar / consolidar con migración | Por determinar | Menús e históricos | Pendiente | Propuesto |
| D-03 | Enriquecimiento de descripciones | Completar útiles / mantener vacías | Por determinar | Contenido y UX | Pendiente | Propuesto |
| D-04 | Metadatos adicionales de fuente y tiempos | Archivo auxiliar / evolución de esquema | Por determinar | Compatibilidad | Pendiente | Propuesto |
```

No trasladar estas preguntas a `docs/decisions/` como aceptadas mientras el propietario no haya elegido una opción. Su existencia no autoriza refactors ni cambios de esquema.

## F. Control de completitud de entregables

- [ ] `summary.md` tiene commit, fecha, versiones, conteos y limitaciones.
- [ ] `foods-audit.csv` tiene **una fila por alimento**, IDs únicos y cabeceras exactas.
- [ ] `recipes-audit.csv` tiene **una fila por receta**, IDs únicos y cabeceras exactas.
- [ ] `findings.md` separa anomalías confirmadas de hipótesis.
- [ ] `decisions.md` recoge propuestas no aprobadas.
- [ ] Se identifican explícitamente las fuentes inaccesibles y las comparaciones no válidas.
- [ ] No se ha modificado `data/`, ni runtime, schemas, tests, Supabase o menús personales.
- [ ] No se ha hecho commit ni push sin autorización.
