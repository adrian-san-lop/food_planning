# Decisión 0019: Inicio diario y navegación del menú

- **Fecha:** 13 de octubre de 2026
- **Estado:** Aceptada e implementada localmente
- **Alcance:** separación de Inicio y Menú, navegación del ciclo y etiqueta de Compra
- **Relación:** concreta y reemplaza parcialmente el punto 2 de ADR-0018; la ubicación de la guía de primera visita de ADR-0011 pasa de Inicio a Guía.

## Decisiones

1. Mantener las secciones de la aplicación como páginas independientes dentro de la navegación existente.
2. Limitar Inicio al resumen del día, en este orden: banner, KPI, objetivo nutricional de hoy y menú de hoy. Inicio no muestra selector de días, navegación semanal, compra próxima ni otros paneles del ciclo.
3. Colocar en Menú la navegación por las tres semanas y el calendario de siete días que antes aparecía en Inicio. Al elegir un día, Menú muestra el detalle de esa fecha. Entrar desde Inicio abre la fecha de hoy cuando pertenece al ciclo activo.
4. Mostrar la navegación semanal de la cabecera únicamente en Menú. La navegación por días y semanas nunca cambia la fecha ni el contenido del resumen de Inicio.
5. Mantener la orientación inicial de cinco pasos en Guía para conservar Inicio como resumen diario.
6. En Compra, mostrar el establecimiento principal como **Supermercado**. El identificador interno de tienda y los datos de catálogo no cambian.
7. En PC, dejar el logotipo de la barra lateral como única marca de cabecera y ocultar el logotipo repetido del área principal. Dar más presencia al banner de Inicio en escritorio; conservar su escala compacta en móvil.
8. Cuando la fecha actual quede fuera del ciclo, mostrar su fecha de inicio o fin en un aviso destacado. Separar visualmente el objetivo nutricional de hoy del bloque del menú.

## Consecuencias

- Las vistas de Inicio y Menú tienen responsabilidades claras: resumen diario frente a navegación y detalle del ciclo.
- Las comidas que se registren desde Inicio o Menú conservan la semana y fecha correctas, aunque se haya navegado por el ciclo.
- La primera visita sigue indicando que se debe revisar el perfil, ahora desde Guía y el formulario de Perfil.
- Compra usa una etiqueta genérica para el establecimiento principal sin modificar la persistencia ni las referencias del catálogo.
- En escritorio, el banner ocupa más espacio y el logo no se repite junto al contenido. El aviso de fecha explica cuándo empieza o terminó el ciclo; el objetivo y el menú tienen una separación visible.
