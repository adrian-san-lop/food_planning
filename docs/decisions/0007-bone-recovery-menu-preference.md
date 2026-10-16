# ADR-0007 — Preferencia alimentaria para recuperación ósea

- Estado: Aceptada e implementada localmente
- Fecha: 2026-10-11
- Alcance: perfil, catálogos genéricos y propuestas de nuevos ciclos

## Contexto

El perfil ya tenía una opción de recuperación que moderaba los objetivos de energía. El propietario pidió que, ante una fractura de un dedo del pie, esa opción también favoreciera recetas con alimentos relevantes para una alimentación equilibrada durante la recuperación ósea.

La orientación del NHS para fracturas menciona una dieta equilibrada con proteína, calcio y vitamina D. NIH ODS explica que el calcio forma parte de la estructura ósea y que la vitamina D facilita su absorción; sus fuentes alimentarias incluyen lácteos, algunos vegetales y pescados con espinas para el calcio, y pescados grasos y huevos para la vitamina D. La vitamina D procede de pocos alimentos, así que la app no debe asumir que el menú la cubre ni recomendar suplementos sin valoración individual. La etiqueta de vitamina C solo añade variedad de frutas y verduras; no representa un objetivo específico de fractura. Las fuentes orientan una alimentación adecuada, pero no prueban que una selección de recetas acelere la consolidación de esta fractura.

Fuentes consultadas:

- [NHS — Broken leg: recuperación y dieta](https://www.nhs.uk/conditions/broken-leg/)
- [NHS — Food for healthy bones](https://www.nhs.uk/live-well/bone-health/food-for-strong-bones/)
- [NIH Office of Dietary Supplements — Calcium](https://ods.od.nih.gov/factsheets/calcium-HealthProfessional/)
- [NIH Office of Dietary Supplements — Vitamin D](https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/)
- [NIH Office of Dietary Supplements — Vitamin C](https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/)
- [Northern Care Alliance NHS — Advice following simple foot fracture](https://www.northerncarealliance.nhs.uk/patient-information/patient-leaflets/orthopaedic-surgery-discharge-advice-following-simple-foot-fracture?q=%2Fpatient-information%2Fpatient-leaflets%2Forthopaedic-surgery-discharge-advice-following-simple-foot-fracture)

## Decisión

- Mantener la casilla del perfil como **Recuperación ósea activa** y conservar su ajuste prudente de energía ya existente.
- Añadir al catálogo `recoveryTags` opcionales para marcar alimentos como fuentes cualitativas de calcio, vitamina D y vitamina C. No añadir cantidades de micronutrientes sin datos verificables por producto.
- Al generar o regenerar una propuesta con recuperación activa, aumentar la preferencia por recetas que contengan esos alimentos. La proteína sigue guiada por el objetivo de macronutrientes actual.
- Mostrar para cada micronutriente en cuántos días de la propuesta aparece un ingrediente etiquetado. La cifra indica presencia en recetas, no cantidades ingeridas ni cumplimiento de una recomendación diaria.
- No cambiar automáticamente el ciclo activo ni las comidas registradas. El usuario puede revisar, intercambiar, bloquear y regenerar la propuesta como hasta ahora.
- No recomendar suplementos, fijar objetivos de calcio/vitamina D/C ni afirmar que esta selección acelera la curación. Mantener las indicaciones del profesional sanitario como referencia clínica.

## Implementación

`foods.json` y `recipes.json` pasan a `catalogVersion` `0.5.0`. El esquema permite las etiquetas opcionales y el HTML las valida, puntúa las recetas al generar la propuesta, conserva en el borrador si Recuperación ósea estaba activa y presenta la cobertura cualitativa por día. Las propuestas ya guardadas sin esa marca pueden regenerarse para aplicar la nueva preferencia.

La revisión visual del 16 de octubre destaca la recuperación utilizada al generar como tarjeta del resumen. «Cómo se prepara este menú» conserva las cifras de presencia cualitativa y su explicación. Si el perfil cambió después de generar la propuesta, se muestra un aviso para aplicar ese cambio con «Cambiar platos»; la tarjeta no convierte el estado actual del perfil en una preferencia ya aplicada.
