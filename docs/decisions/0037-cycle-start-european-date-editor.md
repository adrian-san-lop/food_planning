# ADR-0037: Editor de inicio del ciclo con fecha europea

- **Fecha:** 2026-10-15
- **Actualización:** 2026-10-16, edición en un diálogo compacto
- **Estado:** Aceptada e implementada localmente
- **Alcance:** editor «Cambiar fecha» de Menú 3 semanas
- **Relación:** concreta la presentación del editor de ADR-0019; conserva el comportamiento de ADR-0027.

## Decisión

1. Mostrar la fecha editable siempre como **DD/MM/AAAA**, independientemente del idioma del navegador. Un campo de texto con teclado numérico añade las barras al escribir. La conversión rechaza fechas inexistentes antes de llamar al flujo de cambio del ciclo.
2. Mantener un botón de calendario cuando el navegador admite `showPicker()`. La selección nativa actualiza el mismo campo europeo; si esa API no está disponible, se conserva la escritura manual.
3. «Cambiar fecha», en la cabecera de Menú, abre un diálogo centrado, con altura ajustada al contenido y desplazamiento si no cabe en una ventana pequeña. Eliminar el panel permanente de inicio. Mantener etiqueta sobre el campo y Cancelar/Guardar fecha debajo; la X y Escape permiten salir sin aplicar cambios.
4. Mostrar la fecha de finalización antes de guardar y, si hay comidas registradas, una advertencia breve sobre su archivo. «Qué cambia al guardar» reúne los datos que se conservan y el reverso de consumos al recuperar una fecha archivada. Se mantiene la confirmación previa al archivo existente.
5. Conservar el borrador mientras el diálogo está abierto y permitir guardar con Enter. Cerrar restaura el foco al botón de origen o al nuevo botón de cabecera si se ha vuelto a renderizar. La persistencia sigue usando `YYYY-MM-DD` y la aritmética civil existente; no cambian la sincronización ni la reutilización de ciclos. Los accesos desde Inicio y Guía abren el mismo diálogo en Menú.

## Revisión local anterior: editor integrado del 15 de octubre

- Inspección en navegador a 1733 × 900, 1024 × 768, 390 × 844 y 320 × 740 píxeles con las plantillas reales y datos ficticios.
- El campo y los botones quedan alineados en escritorio; en móvil los controles caben dentro de la tarjeta.
- Se observó el aviso para `31/02/2026`, la apertura del calendario y el guardado con Enter de `16102026` como 16 de octubre de 2026.
- La revisión usa una vista HTTP local sin sesión ni escrituras en Supabase. No confirma la publicación ni el comportamiento en dispositivos físicos.

## Revisión visual del diálogo del 16 de octubre

El diálogo se ha observado centrado en una vista HTTP local de 1366 × 768, con fecha europea, final del ciclo, detalles y acciones dentro de una tarjeta de altura ajustada al contenido. La revisión utiliza datos de ejemplo y no confirma un cambio de ciclo en una cuenta real. No se han ejecutado suites de pruebas para este ajuste.
