# Decisión 0018: priorizar el menú y simplificar compra y despensa

- **Fecha:** 13 de octubre de 2026
- **Estado:** Aceptada e implementada localmente
- **Alcance:** presentación de Inicio, Recetario, Compra y Despensa

## Decisiones

1. Retirar las fotografías de platos, sus atribuciones y las claves de imagen del catálogo. Mantener las imágenes de marca.
2. Mostrar el menú del día al principio de Inicio. Los avisos, indicadores generales y navegación del ciclo quedan debajo.
3. Las barras nutricionales de Inicio suman únicamente comidas registradas. Las sesiones aumentan el objetivo energético de su fecha, pero no se cuentan como consumo; el objetivo de proteína mantiene el cálculo del perfil.
4. En móvil, mostrar el logo completo en la cabecera y ocultar el estado de sincronización correcta. Mantener visibles los errores y el reintento asociado.
5. Ocultar el selector semanal en Compra y Despensa.
6. Presentar las categorías de Compra y Despensa como secciones plegables, cerradas al entrar. La búsqueda de Compra y Despensa puede abrir los grupos con resultados.
7. En Compra, conservar los botones de cantidad más y menos y retirar los controles nativos del campo numérico. Al marcar un artículo, ocultar sus controles y detalles y dejar su nombre con la casilla para poder desmarcarlo.
8. Mostrar **Copiar lista** y **Ver despensa** antes del selector **Compra para**. En escritorio, Despensa presenta los alimentos en tres columnas amplias, dos en pantallas medianas y una en móvil.

## Consecuencias

- El menú se ve antes del contenido de resumen en Inicio y las cantidades nutricionales reflejan consumos registrados.
- La sesión de actividad solo modifica el objetivo de energía del día. No incrementa la comida consumida ni modifica el objetivo de proteína.
- El catálogo de recetas deja de incluir metadatos de fotografía, y su esquema valida ese contrato actualizado.
- La versión común de ambos catálogos pasa a `0.6.0` para identificar el contrato sin metadatos de fotografía.
- No cambian los datos personales, la persistencia ni la sincronización con Supabase.
