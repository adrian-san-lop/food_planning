# Cierre vigente de decisiones — 19/10/2026

La instrucción final del propietario sustituye la preferencia anterior de D-07: **contabilizar todos los ingredientes cuantificados**, incluidos aceite, cayena, salsa de soja y vinagre. Opcionales sin cantidad definida permanecen fuera. El comportamiento existente satisface esta decisión y se ha probado; no queda una exclusión funcional pendiente.

Se cierra esta iteración sin abrir investigación general. D-01/D-05 mantienen genéricos y café actual; D-02/D-03 conservan las ocho fichas con descripciones de sus raciones; D-04 conserva tiempos. D-06 valida la convención aproximada de huevo L de 60 g comestibles, sin certificar todas las conversiones. D-08 se revisa sin imponer tolerancias universales. La falta de fuentes comparables se conserva como incertidumbre, no como requisito de nuevas búsquedas.

El único límite funcional material identificado es que el historial recalcula nutrición con tablas actuales; congelar esos totales exigiría otro encargo. Cantidades registradas, IDs y movimientos permanecen intactos.

---

## Historial de decisiones previo al cierre

# Confirmaciones vigentes del propietario — L4, 19/10/2026

Fuente de autoridad: respuesta explícita en este chat a los cinco bloques de validación. Registro aceptado en [ADR-0045](../../../decisions/0045-generic-catalog-and-measurement-conventions.md). La aceptación de criterio se distingue de su implementación.

| ID | Decisión vigente | Estado de aplicación |
| --- | --- | --- |
| D-01 | Alimentos genéricos; no solicitar marcas. Bases reconocidas identificables, etiquetas solo como ejemplos. | Aceptada. No obliga a cambiar cifras sin equivalencia suficiente. |
| D-02 | Mismos ingredientes = misma preparación; ingrediente diferente = describir diferencia. | Criterio aceptado. Tres familias / ocho fichas descritas; conservar IDs y cantidades. Unificar presentación requiere compatibilidad posterior. |
| D-03 | Descripciones para explicar preparaciones y diferencias reales. | Aplicación dirigida a ocho fichas. No se rellenan automáticamente todas las recetas. |
| D-04 | Obviar trabajo adicional de reposos y conservar tiempos actuales. | Resuelta esa parte. Nuevos metadatos/esquemas no autorizados ni necesarios ahora. |
| D-05 | Café como hasta ahora. | Resuelta: se conserva la convención y cantidades existentes. |
| D-06 | Huevo L, cantidades en crudo, conservas escurridas y alitas con hueso. | Aceptada. Huevo estándar aproximado de 60 g comestibles con referencia; demás rendimientos/densidades siguen sin validación universal. Preparados comprados cocidos conservan su forma. |
| D-07 | Condimentos/especias sin aporte en el modelo. | Preferencia aceptada; opcionales no cuantificados ya omitidos. Omitir cayena/soja/vinagre cuantificados requiere lógica excluida del encargo: pendiente de implementación. Aceite cuantificado conserva aporte. |
| D-08 | No se ha acordado una tolerancia nutricional universal. | Se mantiene revisión por evidencia/caso; decisión general pendiente. |

No se piden marcas ni aprobaciones por alimento. Catálogo 0.9.3 local; sin commit, push, PR ni publicación.

---

## Historial de decisiones anterior a estas confirmaciones

# Alcance de autorización L3 — 19/10/2026

**D-01 a D-08 continúan Pendiente/Propuesto.** La petición posterior «Finalización y mejora automatizada del catálogo» autoriza correcciones concretas con evidencia suficientemente comparable, aclaraciones documentales, automatización y pruebas, sin aprobación individual por alimento. Se ha aplicado esa autorización a cinco alimentos y 18 recetas. No implica aceptar una fuente global, una tolerancia universal ni las decisiones anteriores.

Los bloqueos humanos conservan el valor actual y están separados de los cambios ejecutados en [summary.md](summary.md). El texto de solo lectura y de autorización posterior conservado debajo corresponde a L1/L2; dicha autorización posterior existe para el alcance L3 documentado. No se autoriza publicación ni operaciones Git.

---

## Historial de decisiones L1/L2

# Decisiones pendientes de la auditoría

| ID | Cuestión | Opciones | Recomendación y motivo | Impacto | Decisión del propietario | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| D-01 | Fuente de referencia prioritaria | Por alimento / fabricante / base genérica | Proponer criterio por forma y producto; no adoptar fuente global automáticamente | Nutrición/licencias | Pendiente | Propuesto |
| D-02 | Política de variantes cercanas | Conservar / diferenciar nombres / consolidar con migración | Conservar por ahora: cantidades/tipos distintos e IDs con posibles referencias | Menús e históricos | Pendiente | Propuesto |
| D-03 | Descripciones | Mantener vacías / completar contenido útil | Evitar relleno automático de 112 campos válidos | Contenido/UX | Pendiente | Propuesto |
| D-04 | Metadatos de fuente, forma y tiempo | Archivo auxiliar / evolución de esquema / texto actual | Acordar timeMinutes y trazabilidad antes de añadir campos | Contratos/runtime/tests | Pendiente | Propuesto |
| D-05 | Café comprado seco frente a bebida | Convención documentada / modelo diferenciado futuro | Conservar7 g de compra; no suponer ingesta del sólido | 20 recetas/inventario | Pendiente | Propuesto |
| D-06 | Pesos comestibles y formatos comerciales | Genéricos / producto concreto / equivalencias explícitas | Validar rebanada, huevo, densidad aceite y mermas antes de cambiar | Raciones/compra/snapshots | Pendiente | Propuesto |
| D-07 | Condimentos y alternativas textuales | Opcionales documentados / cuantificar relevantes / variantes independientes | Acordar cobertura de compra/macros; no añadir ingredientes sin revisión | Coherencia culinaria | Pendiente | Propuesto |
| D-08 | Aceptación de diferencias y alertas | Por caso / tolerancias por categoría / alertas informativas | Sin umbral universal nuevo; revisar fibra/Atwater/base/redondeo | Nutrición y pruebas | Pendiente | Propuesto |

Todas son DECISION_PENDIENTE. No son ADR aceptadas ni autorizan correcciones. El score descriptivo de summary.md no es un umbral del planificador. Para corregir catálogos hace falta autorización posterior explícita y revisión del diff.


## Evidencia adicional L2 — 19/10/2026

**D-01 a D-08 siguen Pendiente/Propuesto, sin aprobación.** Este lote selecciona referencias para investigación; no decide una fuente global ni altera la política del catálogo.

| Decisión existente | Evidencia nueva | Qué sigue sin decidir |
| --- | --- | --- |
| D-01 | Ocho referencias USDA close por masa, con FDC/NDB y archivo identificado | Qué producto, variedad, corte y forma representa cada genérico; no adoptar números automáticamente |
| D-04 | CSV y JSON oficiales tienen distinta precisión en algunos nutrientes; se registró release 2018/publicación 2019/consulta 2026 | Si se usará archivo auxiliar o esquema futuro para fuente, preparación, método y porciones |
| D-06 | Huevos poseen porciones comestibles USDA de 38 a 63 g, pero Menuki no fija tamaño; patata/boniato mantienen pesos aproximados no validados | Unidad de huevo y validación de pesos; AOVE frente a aceite genérico; formato de compra500 g y densidad siguen abiertos |
| D-06 | Alubias canned y tablas comerciales legibles no garantizan base por 100 g escurridos | Elegir producto no sustituye obtener evidencia explícita del denominador/drenaje |
| D-08 | Avena:370 frente 379 kcal; hidratos59 frente 67.7 por diferencia y fibra10.1 en referencia | Comparabilidad de carbohidratos y factores energéticos; sin restar fibra automáticamente ni fijar tolerancia universal |

D-02 (variantes), D-03 (descripciones), D-05 (café) y D-07 (condimentos/alternativas) conservan su estado y recomendación anteriores. No se añaden decisiones aceptadas ni nuevos tipos/unidades/campos de catálogo. F-017 requiere D-06; F-018 necesita además evidencia del fabricante, por lo que una decisión no basta para marcarlo comparable.
