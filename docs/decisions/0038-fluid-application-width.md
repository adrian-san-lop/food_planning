# ADR-0038: Ancho fluido compartido en toda la aplicación

- **Fecha:** 2026-10-15
- **Estado:** Aceptada e implementada localmente
- **Alcance:** contenedor de la aplicación personal y sus secciones
- **Relación:** amplía a todas las páginas el ancho disponible de Inicio en ADR-0036.

## Contexto

Inicio eliminaba el límite de 1700 px del contenedor mientras el resto de las páginas lo conservaba. Al navegar desde el dashboard, la aplicación se estrechaba en pantallas grandes. En algunos anchos de tablet también cambiaba el tamaño de la barra lateral.

## Decisión

1. Aplicar `width: 100%` sin ancho máximo al contenedor común de la aplicación. Todas las secciones comparten el espacio restante después de la barra lateral.
2. Compartir los márgenes laterales mediante una variable CSS adaptable al ancho de pantalla. La escala amplia que ya utilizaba Inicio se aplica también a las demás secciones.
3. Usar los mismos anchos de barra lateral en cada intervalo responsive, salvo la variante aprobada el 16 de octubre para Mi perfil: en tablet apaisada de 851–1180 px de ancho y desde 768 px de alto, una barra de iconos de 76 px deja espacio a los campos y conserva nombres accesibles. Mantener la navegación superior e inferior que ya corresponde a las pantallas pequeñas.
4. Eliminar el límite adicional de 1050 px de Proponer receta y Revisar propuestas para que sus tarjetas aprovechen el mismo ancho útil.
5. Conservar los límites de lectura de los párrafos y el tamaño de los diálogos. Inicio y Mi perfil tienen sus variantes de dashboard; las otras secciones conservan su flujo vertical.

## Revisión

Se revisaron las reglas del contenedor, los márgenes, los intervalos responsive y las restricciones de ancho de las vistas. La distribución posterior de Mi perfil se comprobó en navegador por HTTP con datos sintéticos; la revisión del resto de las vistas y de dispositivos físicos conserva su alcance pendiente. No cambia la lógica de cuenta, los catálogos ni la sincronización.
