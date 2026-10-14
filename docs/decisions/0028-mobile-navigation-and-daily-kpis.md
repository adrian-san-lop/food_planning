# ADR-0028: navegación móvil y KPI diarios

- **Fecha:** 14 de octubre de 2026
- **Estado:** Aceptada e implementada localmente
- **Alcance:** navegación y resumen de Inicio en pantallas móviles
- **Relación:** actualiza la ubicación de accesos móviles definida por ADR-0012 y ADR-0026.

## Contexto

En móvil, varios accesos poco frecuentes compartían la barra inferior con las tareas diarias. Inicio también mostraba cuatro KPI generales y un resumen nutricional que no destacaba visualmente cómo avanzaba el consumo del día.

## Decisión

1. Mantener una barra superior fija con el logo y añadir un botón de cuenta en el extremo derecho. Su menú ofrece **Perfil**, **Aprende a usar Menuki**, **Actividad y peso** y **Cerrar sesión**. El correo sigue en Perfil.
2. La navegación inferior muestra **Inicio**, **Menú**, **Compra** y **Más**. El menú Más conserva **Despensa**, **Recetas**, **Proponer receta** y, solo para administradores, **Revisar propuestas**. Perfil, Guía y Actividad no se repiten allí.
3. Solo en móvil, sustituir los KPI generales de Inicio por **Comidas esta semana** y **Racha actual**. El contador semanal suma comidas completadas desde el lunes hasta hoy y avanza sobre un máximo de 35 (cinco ingestas por siete días). La racha cuenta días consecutivos con al menos una comida completada; si hoy aún no hay ninguna, continúa desde ayer.
4. Solo en móvil, presentar **Tu nutrición hoy** como progreso de calorías y barras para proteína, hidratos y grasas. Los valores consumidos proceden exclusivamente de comidas completadas. La actividad realizada puede aumentar el objetivo energético de ese día, pero nunca el consumo mostrado; el objetivo de proteína permanece estable.
5. Mantener sin cambios la navegación de escritorio y sus KPI actuales.

## Consecuencias

- La barra inferior tiene menos destinos y los accesos secundarios quedan agrupados en dos lugares claros.
- El progreso de Inicio cambia cuando se registra o desmarca una comida. Las sesiones de actividad solo afectan al objetivo energético según ADR-0005.
- Los KPI móviles describen el avance de esta semana y una racha de días, mientras el escritorio conserva sus métricas generales.
- La comprobación en teléfonos físicos y la publicación quedan pendientes.
