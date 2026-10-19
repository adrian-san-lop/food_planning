# Decisión 0018: priorizar el menú y simplificar compra y despensa

- **Fecha:** 13 de octubre de 2026
- **Actualización:** 19 de octubre de 2026, icono compartido de Despensa; se conservan los ajustes de recetas y Compra del 16 de octubre
- **Estado:** Aceptada e implementada localmente
- **Alcance:** presentación de Inicio, Recetario, fichas de recetas, Compra y Despensa

## Decisiones

1. Retirar las fotografías de platos, sus atribuciones y las claves de imagen del catálogo. Mantener las imágenes de marca.
2. En Inicio, mostrar primero un banner de marca compacto, seguido de los KPI y el menú del día. El menú y sus platos deben quedar en el primer bloque funcional; los avisos y la navegación del ciclo quedan después.
3. Las barras nutricionales de Inicio suman únicamente comidas registradas. Las sesiones aumentan el objetivo energético de su fecha, pero no se cuentan como consumo; el objetivo de proteína mantiene el cálculo del perfil.
4. Mostrar el logotipo completo en la cabecera de escritorio y móvil, con tamaño acotado y sin el título duplicado. En móvil, ocultar el estado de sincronización correcta y mantener visibles los errores y el reintento asociado.
5. Ocultar el selector semanal en Compra y Despensa.
6. Presentar las categorías de Compra y Despensa como secciones plegables, cerradas al entrar. La búsqueda de Compra y Despensa puede abrir los grupos con resultados.
7. En Compra, conservar los botones de cantidad más y menos y retirar los controles nativos del campo numérico. Al marcar un artículo, ocultar sus controles y detalles y dejar su nombre con la casilla para poder desmarcarlo.
8. Mostrar **Copiar lista** y **Ver despensa** antes del selector **Compra para**. En escritorio, Despensa presenta los alimentos en tres columnas amplias, dos en pantallas medianas y una en móvil.

9. Alinear a la derecha el número de alimentos/artículos en los encabezados de categoría de Compra y Despensa. En PC, mostrar los artículos de cada categoría de Compra en dos columnas y pasar a tres desde 1700 px de ancho; en ventanas de 851–1023 px y menos de 768 px de alto, usar una columna para compensar la barra lateral con nombres. Mantener una sola columna en móvil.
10. Ajustar la ficha de receta a su contenido y centrarla, con un máximo del 86 % del alto visible y 820 px. Las cuatro cifras nutricionales comparten una fila, con una única nota de estimación por ración. Retirar el texto introductorio genérico cuando el catálogo no tenga descripción. Ingredientes y preparación permanecen completos, en dos columnas de escritorio y una en móvil. El consejo y el contexto de cantidades se consultan en un desplegable. El contenido central tiene scroll cuando hace falta; cabecera, X centrada y pie con acción de registro permanecen fuera de ese desplazamiento. El catálogo sin una comida asociada ofrece cerrar la receta; las comidas futuras mantienen el registro deshabilitado.
11. En el listado móvil del recetario, conservar dos columnas, categoría, nombre completo y datos de cada receta. Agrupar reloj y tiempo sin saltos internos y situar debajo las cifras de calorías y proteínas, manteniendo juntas cifras y unidades. Las tarjetas de cada fila estiran el espacio del título para alinear los metadatos. En anchos mayores, los grupos comparten fila cuando caben. No cambian catálogo, cálculos, búsqueda, filtros ni apertura de la ficha.
12. En Compra de escritorio, separar cada ingrediente en tres bloques: casilla/nombre/existencias, controles de cantidad y formato de envase, y desplegable para editar el contenido. El nombre utiliza 18–23 px y se muestra completo; faltante, existencias y formato utilizan 14–16 px, manteniendo juntas las cifras y unidades. Los controles más, menos y cantidad miden 44 px de alto. Las tarjetas de una fila alinean los controles aunque el nombre ocupe varias líneas. Mantener Roboto, la paleta actual y las categorías plegables. Al marcar, conservar solo nombre y casilla en una tarjeta compacta. La redistribución se aplica desde 851 px y no cambia el listado móvil.
13. Si se edita el contenido por envase, mostrar ese tamaño en la etiqueta de la tarjeta inmediatamente y al volver a renderizar. El formato comercial inicial se conserva mientras no se haya cambiado. No se modifican las reglas de faltantes, redondeo, cantidades compradas, separación de ciclos o actualización de existencias al finalizar.
14. Identificar Despensa con una caja abierta con alimentos, dibujada como SVG propio en cuadrícula de 24 × 24, sin relleno, con trazo de 1,8 y extremos redondeados. El color se hereda del contexto mediante `currentColor`. La navegación de escritorio y móvil, los accesos y etiquetas de la guía rápida, el estado vacío y la tarjeta de Despensa de la landing reutilizan `assets/icons/pantry.svg`. Se sustituye la hoja o bolsa anterior solo cuando representa Despensa; los demás iconos y los botones que ya son solo texto mantienen su presentación.

## Consecuencias

- El banner compacto y los KPI orientan al usuario antes del menú del día; los avisos y la navegación del ciclo quedan debajo. Las cantidades nutricionales reflejan consumos registrados.
- La sesión de actividad solo modifica el objetivo de energía del día. No incrementa la comida consumida ni modifica el objetivo de proteína.
- El catálogo de recetas deja de incluir metadatos de fotografía, y su esquema valida ese contrato actualizado.
- La versión común de ambos catálogos pasa a `0.6.0` para identificar el contrato sin metadatos de fotografía.
- No cambian los datos personales, la persistencia ni la sincronización con Supabase.
- El cambio de icono del 19 de octubre conserva geometría de navegación, tamaños de tarjetas y controles; comparte un único SVG entre la landing y la app. Se ha revisado el código y las referencias al recurso; no se han ejecutado pruebas ni comprobaciones visuales en navegador para este cambio.
- Los contadores se sitúan junto al control de despliegue, en el extremo derecho del encabezado. La cuadrícula de Compra solo se activa en pantallas de escritorio suficientemente anchas; en móvil conserva la lista vertical.
- El rediseño de la ficha del 16 de octubre conserva cantidades, disponibilidad, registro y reversos existentes. Registrar desde la ficha mantiene la posición de lectura y el foco del botón. Su revisión visual en navegador y en dispositivos físicos queda pendiente; las comprobaciones de sintaxis no acreditan ese comportamiento.
- El ajuste posterior del listado se revisó por HTTP con el shell, CSS, renderizador y 112 recetas reales del proyecto, usando estado personal sintético local. No se detectaron desbordamientos en 320, 360, 390, 430, 768 y 1366 px de ancho; se comprobó la apertura y el cierre de una receta. La revisión en dispositivos físicos y en la publicación sigue pendiente.
- Las tarjetas de ingredientes conservan los mismos enlaces de eventos y datos de carrito; las etiquetas accesibles identifican el producto asociado a cada control. La revisión visual local de Compra a 1920 × 1080 y 1366 × 768 mostró tres y dos columnas respectivamente, nombres completos y controles alineados, sin desbordamiento horizontal de las tarjetas. Utiliza datos ficticios por HTTP y no confirma operaciones de una cuenta real ni la publicación. No se han añadido ni ejecutado suites de pruebas para este rediseño.
