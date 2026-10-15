# ADR-0037: Editor de inicio del ciclo con fecha europea

- **Fecha:** 2026-10-15
- **Estado:** Aceptada e implementada localmente
- **Alcance:** editor «Cambiar fecha» de Menú 3 semanas
- **Relación:** concreta la presentación del editor de ADR-0019; conserva el comportamiento de ADR-0027.

## Decisión

1. Mostrar la fecha editable siempre como **DD/MM/AAAA**, independientemente del idioma del navegador. Un campo de texto con teclado numérico añade las barras al escribir. La conversión rechaza fechas inexistentes antes de llamar al flujo de cambio del ciclo.
2. Mantener un botón de calendario cuando el navegador admite `showPicker()`. La selección nativa actualiza el mismo campo europeo; si esa API no está disponible, se conserva la escritura manual.
3. Situar la etiqueta sobre el campo y alinear Cancelar y Guardar fecha con él. En tablet, agrupar los controles debajo del título. En móvil, usar el ancho disponible para el campo y colocar ambos botones debajo.
4. Mostrar la fecha de finalización del ciclo antes de guardar y mantener visible la explicación de los registros que se archivan y los datos que se conservan.
5. Conservar el borrador mientras el editor está abierto y permitir guardar con Enter. La persistencia sigue usando `YYYY-MM-DD` y la aritmética civil existente; no cambian la sincronización, la confirmación de archivo ni la reutilización de ciclos.

## Revisión local

- Inspección en navegador a 1733 × 900, 1024 × 768, 390 × 844 y 320 × 740 píxeles con las plantillas reales y datos ficticios.
- El campo y los botones quedan alineados en escritorio; en móvil los controles caben dentro de la tarjeta.
- Se observó el aviso para `31/02/2026`, la apertura del calendario y el guardado con Enter de `16102026` como 16 de octubre de 2026.
- La revisión usa una vista HTTP local sin sesión ni escrituras en Supabase. No confirma la publicación ni el comportamiento en dispositivos físicos.
