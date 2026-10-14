# ADR-0031: Resumen de Inicio y menú diario debajo del primer pantallazo

- **Fecha:** 14 de octubre de 2026
- **Estado:** Aceptada e implementada localmente
- **Alcance:** resumen, menú de hoy y cabecera del día en Inicio y Menú
- **Relación:** reemplaza parcialmente ADR-0030; conserva el orden diario de ADR-0019 y los indicadores móviles definidos en ADR-0028.

## Contexto

Inicio debe enseñar con claridad el progreso diario sin que el encabezado del menú quede cortado al final del primer pantallazo. Ocultar el menú por completo elimina un acceso importante a las comidas del día. En Menú, la cabecera del día debe ser fácil de leer y no mezclar la fecha con información secundaria.

## Decisión

1. El primer pantallazo de Inicio prioriza, en este orden, el banner, los KPI y el resumen nutricional de hoy. El tamaño, el espaciado y la altura del resumen se adaptan al ancho y al alto disponibles.
2. «Menú de hoy» y las cinco comidas se mantienen en Inicio debajo del resumen y aparecen al desplazarse. El detalle siempre usa la fecha actual y conserva las acciones para abrir recetas, registrar comidas y añadir actividad. Inicio no añade navegación por semanas ni por días.
3. En la tarjeta del día, la primera línea muestra el número de fecha, el nombre del día y «Registrar actividad». Debajo aparece el estado de actividad. Cuando no hay sesiones, el texto es «Sin sesiones»; se elimina «objetivo base».
4. La misma tarjeta y jerarquía se usan en Inicio y en Menú para que la fecha, el estado y las comidas tengan una presentación coherente. La navegación del ciclo permanece en Menú.

## Consecuencias

- El encabezado «Menú de hoy» no aparece parcialmente en el primer pantallazo, pero sigue accesible en Inicio al desplazarse.
- En móvil, los KPI de comidas semanales y racha se muestran en tarjetas apiladas, a ancho completo, con tipografía e iconos legibles. El resumen nutricional conserva el anillo calórico y las barras de macronutrientes.
- La lista de comidas ocupa todo el ancho disponible y mantiene el estado y las acciones existentes.
- Hay que revisar en navegador alturas cortas y anchos móviles antes de publicar.
