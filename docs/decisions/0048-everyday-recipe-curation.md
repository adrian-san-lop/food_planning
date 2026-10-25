# ADR-0048 — Calidad culinaria y eliminación de recetas en desarrollo

- Estado: Aceptada, con criterio revisado expresamente por el propietario; implementada localmente, sin publicar.
- Fecha: 2026-10-23.
- Alcance: selección culinaria y revisión completa de las 111 recetas base, primero comidas/cenas y después desayunos/tentempiés.

## Criterio acordado

Valorar coherencia culinaria, cantidades razonables, instrucciones claras, adecuación al momento de comida y sencillez de preparación. No utilizar utensilios ni su compra como criterio. No excluir automáticamente por origen, formato o presencia de tofu, tempeh o tahini. Una receta menos tradicional puede ser una alternativa válida. Fajitas de pollo, tostas de sardinas y wrap de pavo quedan confirmados expresamente por el propietario.

Considerar también la semana como conjunto: familiaridad, repetición y aprovechamiento de ingredientes. Se conserva el generador existente, que ya utiliza una semana base repetida, renovación gradual e ingredientes compartidos. No se añade una clasificación cultural ni una nueva puntuación sin validación.

## Resultado de la reconsideración

Revisadas individualmente las once eliminaciones anteriores, recuperar diez fichas. Mantener eliminado hamburguesa_pavo, el ejemplo concreto descartado por el propietario: filetes de pavo y ensalada como relleno de dos rebanadas de pan de molde con patatas. El formato sándwich por sí solo no se convierte en una prohibición universal.

El catálogo final tiene 111 recetas y 537 referencias. Siete fichas recuperadas reciben aclaraciones de nombre, pasos o consejos; ninguna cambia ingredientes, cantidades, unidades, tiempo o nutrición. El manifiesto [de cambios culinarios](../audits/recipe-culinary-changes.json) conserva los campos anteriores y posteriores. El [inventario](../audits/recipe-culinary-quality.md) recoge las once decisiones justificadas y las 112 fichas revisadas.

La selección inicial de 14 retiradas y la posterior de once eliminaciones quedan sustituidas por esta reconsideración autorizada. No recuperar recetas por defecto: las diez recuperaciones se justifican individualmente por su composición y elaboración.

## Aplicación en desarrollo

El propietario acepta invalidar menús de prueba existentes. Eliminar físicamente las fichas descartadas; no introducir registros ocultos, aliases, estados de retirada ni migraciones solo para conservar esos menús. Los planes o bloqueos que apunten al ID eliminado pueden requerir regeneración o sustitución manual. No se modifican cuentas ni datos personales.

Actualización (2026-10-25): [ADR-0051](0051-server-authoritative-account-state.md) conserva versiones de recetas dentro de planes ya guardados. `hamburguesa_pavo` sigue fuera de las 111 recetas y de la generación nueva; `data/recipe-history.json` permite leer exclusivamente un plan antiguo que la referencia y carece de snapshot. Esta excepción histórica sustituye la decisión previa de dejar inválidos esos planes de desarrollo. La omisión de un ciclo ilegible no lo archiva ni obliga al usuario a revisarlo. La activación del contrato remoto requiere su migración nueva.

La plantilla fija conserva las recetas confirmadas y tortitas_atun; solo reemplaza hamburguesa_pavo por pollo_boniato_ensalada para mantener referencias válidas. No se afirma equivalencia nutricional entre esas comidas. No se modifica el generador, el esquema de recetas ni el estado v12.

## Límites de evidencia

Los 90 registros de alimentos permanecen intactos; foods.json solo cambia metadatos de versión y estado. Catálogos 0.10.1. Se mantienen todos los condimentos cuantificados y las fórmulas nutricionales. Recuperar una receta no valida sus fuentes nutricionales ni acredita haberla cocinado: los pendientes de la auditoría nutricional siguen abiertos.

Conservar los informes previos de 112 recetas como evidencia histórica, sin reescribir sus nombres o cifras. Las comprobaciones actuales comparan por ID las cifras de las 111 fichas conservadas; la autorización de cambios editoriales se comprueba por separado. Las 16 recetas con huevo siguen presentes. No tocar Supabase, publicar ni crear commits sin autorización.

## Ampliación aceptada: recetas base antes de su escalado

El propietario autoriza mejorar las recetas base antes de revisar las porciones ajustadas o la semana completa. Se revisan las 111 fichas por coherencia culinaria, proporciones base, nombre fiel e instrucciones útiles. Se excluye el criterio de utensilios y no se descarta por origen o formato.

La fase baseRecipeReview del manifiesto mantiene por separado la evidencia anterior: 111 decisiones y 52 nuevas correcciones editoriales (33 comidas/cenas y 19 desayunos/tentempiés). Las instrucciones aclaran cortes, orden de elaboración, punto de las verduras, montaje y uso completo de aceite y salsa medidos. Se corrigen nombres incompatibles con la elaboración y consejos heredados de días fijos o preferencias personales. No se cambian restricciones del producto ni se introducen ingredientes nuevos.

No hay evidencia suficiente para cambiar cantidades. Se mantienen IDs, ingredientes, raciones, unidades, tipos, tiempos y valores nutricionales. El cálculo antes/después de las 111 fichas da cero diferencias en las cuatro magnitudes. La intensidad y volumen de los 180 g de cebolla cruda en la ensalada de gulas se dejan pendientes de prueba culinaria o decisión del propietario, sin reducirlos por intuición.

Esta fase no modifica el generador ni garantiza que todas las raciones escaladas tengan la misma calidad culinaria. Esa comprobación corresponde a la fase posterior. La revisión de texto y sus tests tampoco acreditan haber cocinado o probado los platos. Validación final en el inventario: 194 pruebas y ambos esquemas JSON.
