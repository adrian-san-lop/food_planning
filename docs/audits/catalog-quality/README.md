# Auditoría de calidad de los catálogos de Menuki

**Estado vigente:** L1/L2 completadas como auditoría y L3 aplicada localmente por autorización expresa del propietario: correcciones comparables, documentación, automatización y pruebas. Catálogos 0.9.3; confirmaciones L4 en ADR-0045 y decisiones restantes documentadas, sin publicación. Véase [el resultado vigente](results/summary.md).
**Referencia inicial:** rama `dev`, consultada el 19/10/2026; catálogos `0.9.1`.  
**Alcance:** `data/foods.json`, `data/recipes.json` y sus dependencias de lectura/validación.

## Documentos

1. [`01-plan-auditoria.md`](01-plan-auditoria.md): objetivos, metodología, fuentes, controles, etapas y criterios de aceptación.
2. [`02-plantillas-resultados.md`](02-plantillas-resultados.md): formatos obligatorios de resultados, ejemplos de hallazgos y catálogo de decisiones.
3. [`03-encargo-codex.md`](03-encargo-codex.md): encargo ejecutable para Codex, limitado **a auditar y documentar**, no a corregir.

## Uso histórico del encargo inicial (L1/L2)

1. Desde una copia limpia y actualizada de `dev`, prepara una **rama de documentación** respetando [`AGENTS.md`](../../../AGENTS.md) y el procedimiento Git del proyecto.
2. Coloca esta carpeta en `docs/audits/catalog-quality/` dentro del repositorio.
3. Entrega a Codex el encargo de `03-encargo-codex.md` y pide **solo la fase de auditoría**.
4. Revisa los informes producidos por el agente en `results/`. Decide qué cambios autorizar **antes** de modificar los catálogos originales.
5. En otra tarea/PR, aplica únicamente correcciones aprobadas, conserva IDs y ejecuta pruebas de regresión.

> El análisis inicial es un punto de partida, no una verificación nutricional. Los recuentos y ejemplos deben recomputarse sobre el `HEAD` real de `dev` al iniciar Codex. Si la rama ha cambiado, prevalece el código actual.

## Herramientas de continuación L3

El encargo de `03-encargo-codex.md` conserva su alcance inicial de solo lectura. La petición posterior del propietario autoriza las correcciones L3 descritas en los resultados.

- Recopilación primaria: `python scripts/collect-nutrition-sources.py --refresh` (requiere red; no cambia catálogos).
- Impacto: `node scripts/catalog-audit.mjs --write`; sin `--write`, comprueba que el informe está vigente.
- CSV: `python scripts/update-catalog-audit.py` (sin red, idempotente, conserva historial L2).
- Regresión: `npm test`.

La selección de registros y campos corregibles es explícita en `results/source-data/source-plan.json`; ninguna herramienta adopta valores por simple proximidad numérica. Consulte los bloqueos y los cambios antes/después en los informes.

## Fuentes de verdad y dependencias

- [`data/foods.json`](../../../data/foods.json) y [`data/recipes.json`](../../../data/recipes.json): fuente canónica de los datos genéricos.
- [`data/foods.schema.json`](../../../data/foods.schema.json) y [`data/recipes.schema.json`](../../../data/recipes.schema.json): contratos estructurales.
- [`js/data/catalogs.js`](../../../js/data/catalogs.js) y [`tests/catalogs.test.js`](../../../tests/catalogs.test.js): validación y pruebas existentes.
- [`docs/planner/specification.md`](../../planner/specification.md), [`docs/open-questions.md`](../../open-questions.md), [`AGENTS.md`](../../../AGENTS.md): restricciones aceptadas y decisiones pendientes.

**No incluir datos personales, perfiles, historiales de comidas, secretos, tokens ni contenidos de Supabase en los resultados.**
