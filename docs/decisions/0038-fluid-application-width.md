# ADR-0038: Ancho fluido compartido en toda la aplicación

- **Fecha:** 2026-10-15
- **Actualización:** 2026-10-22, variante compacta compartida independiente de la altura
- **Estado:** Aceptada e implementada localmente
- **Alcance:** contenedor de la aplicación personal y sus secciones
- **Relación:** amplía a todas las páginas el ancho disponible de Inicio en ADR-0036.

## Contexto

Inicio eliminaba el límite de 1700 px del contenedor mientras el resto de las páginas lo conservaba. Al navegar desde el dashboard, la aplicación se estrechaba en pantallas grandes. En algunos anchos de tablet también cambiaba el tamaño de la barra lateral.

## Decisión

1. Aplicar `width: 100%` sin ancho máximo al contenedor común de la aplicación. Todas las secciones comparten el espacio restante después de la barra lateral.
2. Compartir los márgenes laterales mediante una variable CSS adaptable al ancho de pantalla. La escala amplia que ya utilizaba Inicio se aplica también a las demás secciones.
3. Usar los mismos anchos y estilos de barra lateral en todas las pestañas para cada intervalo responsive. La variante de solo iconos de Mi perfil pasa a ser común: de 851–1180 px de ancho, independientemente de la altura, todas las secciones emplean una barra de 76 px con nombres accesibles y título al pasar el ratón. En los demás tamaños de escritorio se mantiene la navegación con textos. Así, reducir la altura no ensancha el lateral ni resta de golpe espacio a la vista. Espaciado, tipografía, iconos, marca y tarjeta inferior dependen del tamaño de pantalla, sin excepciones por vista. La barra permite desplazarse si sus opciones no caben en una ventana baja. Se conserva la navegación superior e inferior de móvil.
4. Eliminar el límite adicional de 1050 px de Proponer receta y Revisar propuestas para que sus tarjetas aprovechen el mismo ancho útil.
5. Conservar los límites de lectura de los párrafos y el tamaño de los diálogos. Inicio y Mi perfil tienen sus variantes de dashboard; las otras secciones conservan su flujo vertical.
6. La unificación del menú no modifica las reglas de tamaño, tipografía ni distribución de las tarjetas de contenido. Se retiran las reglas de navegación exclusivas de Inicio y Mi perfil y se reúnen en variantes compartidas por viewport.

## Revisión

Se revisaron las reglas del contenedor, los márgenes, los intervalos responsive y las restricciones de ancho de las vistas. La unificación del menú se comprobó por HTTP con el shell y renderizadores del proyecto y estado personal sintético. En las nueve secciones disponibles se compararon ancho y alto del lateral, padding, separación, tipografía, iconos, marca, textos y pie a 2520 × 1250, 1366 × 768, 1024 × 768 y 1180 × 820 px: las medidas y estilos coincidieron entre pestañas y no hubo desbordamiento horizontal. El propietario confirma que la versión actual funciona en PC y móvil; no se ha repetido esta comparación específica de nueve secciones ni se ha auditado el rol admin. No cambia la lógica de cuenta, los catálogos ni la sincronización; se conservaron las reglas de tamaño de las tarjetas y los cambios previos del recetario.

La revisión del 22 de octubre elimina la condición de 768 px de alto de la variante compacta, conservando las reglas comunes y los iconos originales. Está revisada en código; no se han ejecutado pruebas ni comprobaciones visuales en navegador para este ajuste.
