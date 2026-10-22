# ADR-0045: catálogo genérico y convenciones sencillas de medida

- Estado: Aceptada; cierre de la iteración nutricional confirmado el 2026-10-19. Límites de compatibilidad descritos abajo.
- Fecha: 2026-10-19.
- Alcance: alimentos genéricos, interpretación de cantidades, recetas y auditoría. No modifica el planificador ni datos personales.

## Decisiones del propietario

- El catálogo representa alimentos genéricos disponibles habitualmente en supermercados. No se piden marcas ni productos de compra personales para continuar. Las bases públicas identificables son la referencia preferente; etiquetas de supermercado pueden servir de ejemplos, sin convertir una marca en el genérico ni declarar identidad por semejanza numérica.
- Las cantidades se interpretan en crudo, antes de cocinar; las conservas se pesan escurridas y las alitas con hueso. Los alimentos que ya se compran cocidos o preparados conservan esa forma explícita (legumbres en conserva, edamame cocido, remolacha cocida, fiambres y lácteos). No convertirlos a sólidos secos. Esta aclaración mantiene una operación sencilla para el usuario.
- El huevo es de tamaño L y se cuenta por unidades. Se adopta una estimación estándar de 60 g comestibles por unidad para calcular su referencia genérica cruda; no es una medición exacta de cada huevo. No se cambian los pesos por pieza existentes ni se exige pesar el huevo.
- Café: conservar la convención y las cantidades actuales. No abrir un trabajo adicional sobre café seco frente a infusión.
- Reposos: no añadir tiempos ni campos nuevos; conservar los tiempos actuales, sin afirmar que incluyen todos los reposos.
- Condimentos/especias: en la instrucción final de cierre, el propietario confirma contabilizar todos los ingredientes cuantificados, incluidos aceite, cayena, salsa de soja y vinagre. Los condimentos opcionales sin cantidad definida permanecen fuera. Esta confirmación sustituye la preferencia anterior de exclusión; no queda pendiente implementarla.
- Dos fichas con los mismos ingredientes representan la misma preparación aunque cambien cantidades o espacio de comida. Cuando cambian ingredientes, la descripción debe explicar la diferencia. Se completa la descripción de las ocho fichas coincidentes en tres familias; en el cierre se explicitan las cantidades de cada ración para distinguir las variantes. Se mantienen IDs, cantidades y referencias existentes.

## Aplicación local

- Catálogo 0.9.3: huevo L con 85,8 kcal, 7,54 g de proteína, 0,43 g de hidratos y 5,71 g de grasa por unidad. Se calcula desde FDC 171287 por 100 g, multiplicando por 0,6 y redondeando a dos decimales.
- Se documentan las tres familias de recetas con conjuntos de ingredientes idénticos; las ocho fichas conservan cantidades distintas. No se eliminan IDs ni se fusionan referencias de menús/históricos. La presentación de una sola ficha por preparación requeriría trabajo posterior de compatibilidad, fuera del alcance de correcciones de datos.
- Café, tiempos, unidades y cantidades permanecen intactos. Las reglas de genéricos y medida permiten continuar sin solicitar marcas; no convierten todas las cifras actuales en datos certificados.

## Límites de compatibilidad revisados

El cargador y el servicio de nutrición suman todos los ingredientes cuantificados; el cierre comprueba expresamente aceite, cayena, salsa de soja y vinagre. No se cambia esa lógica ni se ponen tablas reales a cero.

Los históricos conservan IDs, cantidades de ingredientes y movimientos, pero sus totales nutricionales se recalculan con el catálogo vigente (`dayCalc` / `completedDayCalc`). Corregir una tabla puede cambiar los totales mostrados de comidas registradas. No se han migrado ni reescrito datos históricos. Congelar macros históricos requeriría snapshots nutricionales y un trabajo funcional separado, no autorizado en esta iteración.

## Fuentes

- [Instituto de Estudios del Huevo, Manejo del huevo y los ovoproductos en la cocina](https://www.institutohuevo.com/wp-content/uploads/2021/10/Manejo-del-huevo-y-los-ovoproductos-en-la-cocina.pdf), p. 16 impresa, p. 16 del PDF: estimación de 60 g de porción comestible para clase L. Consultado el 19/10/2026.
- [Reglamento delegado UE 2023/2465](https://eur-lex.europa.eu/legal-content/ES/ALL/?uri=CELEX%3A32023R2465), artículo 5: L clasifica el huevo con cáscara, de 63 a menos de 73 g. No es el peso comestible ni equivale automáticamente al large USDA.
- USDA FoodData Central, SR Legacy FDC 171287 / NDB 01123, archivo oficial y cuatro nutrientes conservados en `../audits/catalog-quality/results/source-data/usda-records.json`.

## Decisiones de auditoría

D-01 y D-05 quedan resueltas para este alcance; D-02/D-03 tienen criterio de variantes aceptado y aplicación documental. D-04 queda parcialmente resuelta (sin nuevos tiempos/reposos), D-06 fija crudo/escurrido/hueso/L pero no valida todas las conversiones y rendimientos, y D-07 queda resuelta en el cierre: todos los ingredientes cuantificados se contabilizan. D-08 se revisa sin introducir tolerancias universales; no bloquea el cierre de las correcciones comprobadas.
