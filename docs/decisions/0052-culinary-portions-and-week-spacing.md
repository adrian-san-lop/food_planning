# ADR-0052 — Raciones con estructura culinaria y espaciado semanal

- Fecha: 02/11/2026.
- Estado: implementada y probada localmente dentro del encargo de completar las tareas pendientes; sin publicación.
- Amplía ADR-0046, ADR-0047 y ADR-0048. Conserva ADR-0051 y su contrato de cuenta.

## Decisión

1. Permitir `keepBaseAmount: true` en un ingrediente de receta para conservar su cantidad base durante el escalado. Es una política culinaria específica, no una recomendación nutricional universal. No altera cantidades cuando el ajuste automático está desactivado ni puede reemplazar una cantidad completada.
2. Aplicarla únicamente al pan de los tres sándwiches de pavo, a la tortilla de fajitas y wrap y a la avena que liga las tortitas de atún con el huevo fijo. El pan de acompañamiento sigue ajustándose. No introducir límites genéricos para toda salsa, bol o receta vegetal sin evidencia.
3. Valorar suavemente la semejanza entre comida y cena por el solapamiento de sus ingredientes principales, excluyendo aceite y condimentos comunes. El coeficiente 0,6 es un parámetro de selección, no un umbral de adecuación nutricional ni una prohibición. No clasificar por origen, utensilios o nombre del plato.
4. Después de seleccionar la semana, intentar espaciar las preparaciones principales intercambiando días completos compatibles. Conservar exactamente el repertorio, sus frecuencias y el conjunto de ingredientes. No mover días con algún bloqueo en cualquiera de las tres semanas. Verificar de nuevo la elegibilidad en el día de destino, incluidos tiempos entre semana.
5. Conservar la semana base repetida, las preferencias, las exclusiones y la renovación gradual. Admitir repeticiones inevitables y diferencias nutricionales; no forzar novedad ni ampliar raciones para cerrar una cifra exacta.

## Persistencia y límites

Los planes confirmados siguen leyéndose con sus cantidades guardadas. La política de ingrediente viaja en el JSON existente `food_snapshot.portion_policy: "base"` de su fila relacional; se reconstruye al leerla. No añade tablas, columnas, RPC o migraciones. La versión nueva de cálculo es `2026-11-02.1`; las fechas reutilizadas conservan su versión anterior. Se mantienen cantidades pasadas y completadas y los objetivos de proteína y grasa. La actividad real sigue afectando solo a su fecha.

Catálogos 0.11.0, esquema de recetas 1 con el atributo opcional y validación estricta. Permanecen 90 alimentos, 111 recetas y 537 referencias, con los mismos IDs, cantidades base, unidades y tablas nutricionales. No se modifican fuentes ni se declaran nuevas verificaciones nutricionales.

El 02/11/2026 el propietario confirma: «Sí, mantener los 180 g» de cebolla cruda de la ensalada de gulas. Se cierra la decisión como revisada sin cambio; no se modifica el catálogo ni se afirma una prueba de sabor independiente del agente.

## Evidencia

Ver [resultado y límites](../audits/planner-quality-review.md) y [comparación reproducible](../audits/planner-quality-review.json). Se evalúan 10.656 días sintéticos de escalado y 64 ciclos generados. La selección mejora el espaciado en esta muestra, sin garantizar un óptimo ni una compra menor. No se ha cocinado, publicado o escrito en Supabase.
