# ADR-0036: Detalle semanal y resumen del plan en Inicio

- **Fecha:** 15 de octubre de 2026
- **Actualización:** 26 de octubre de 2026, plan en la columna derecha, dashboard a toda altura y favoritas junto a las calorías
- **Estado:** Aceptada e implementada localmente
- **Alcance:** Inicio en escritorio, tablet y móvil
- **Relación:** amplía ADR-0035 y sustituye su distribución móvil; mantiene la navegación diaria de ADR-0019.

El estilo visual mantiene Roboto, superficies blancas, fondo neutro y verde esmeralda según [ADR-0016](0016-css-sections-and-template-presentation.md). La distribución vigente y los datos de este panel se definen aquí; la revisión visual local del 26 de octubre se detalla más abajo.

## Contexto

El propietario ha aprobado cuatro KPI con detalle diario de comidas. El 26 de octubre pide retirar «Tu día, organizado», trasladar Tu plan actual a ese espacio y aprovechar todo el ancho y alto como dashboard. La información y las acciones deben conservarse con tipografía y separaciones proporcionadas a la pantalla.

## Decisión

1. Compartir cuatro KPI entre escritorio y móvil: comidas de lunes a domingo sobre 35, sesiones ya realizadas esta semana con su duración, días distintos con comidas registradas sobre 7 e ingredientes por reponer. Siete barras dentro del primer KPI muestran entre cero y cinco comidas por fecha; se destaca hoy y se distinguen los días futuros. No se suman claves inválidas ni comidas de fechas futuras. La racha móvil anterior se sustituye por estos KPI.
2. Mostrar bajo el título la posición del ciclo y sus fechas. Si el inicio es futuro, indicar «Comienza el…»; si terminó, mostrarlo explícitamente. La fecha civil y la aritmética siguen usando `Europe/Madrid` mediante los módulos existentes. `js/domain/dashboard.js` contiene únicamente los cálculos de semana y ciclo, sin DOM, almacenamiento ni Supabase.
3. El Menú de hoy completo ocupa las columnas de los KPI 1–2 y abarca toda la altura del contenido inferior. A la derecha, alineado con los KPI 3–4, Objetivo nutricional de hoy ocupa la parte superior y Tu plan actual la inferior. Nutrición conserva el círculo y las barras, cuenta solo comidas registradas y mantiene los objetivos actuales, incluido el ajuste energético de actividad ya realizada hoy.
4. Destacar la primera comida pendiente de hoy. El nombre del plato abre su receta; no se muestra un botón adicional «Ver receta» ni su flecha. El destacado avanza al registrar la comida; desaparece si se han completado las cinco. No implica una hora de ingesta ni modifica la fecha seleccionada en Menú. Actualización del 16 de octubre: Menú reutiliza la plantilla nutricional de Inicio para su Resumen del día seleccionado, con las reglas de presentación de ADR-0019 y sin cambiar este dashboard.
5. Tu plan actual, derivado del perfil, muestra objetivo, ajuste automático de raciones y recuperación ósea solo cuando está activa. Se presenta como lista vertical bajo nutrición, con acceso al perfil y aviso si aún contiene los datos de ejemplo. Se retira su anterior franja a todo el ancho. La recuperación sigue siendo un ajuste cualitativo para nuevas propuestas, sin inventar cantidades de micronutrientes ni resultados clínicos.
6. Usar tres filas en el dashboard: cabecera, KPI y menú/nutrición/plan. En la tercera fila, el menú abarca las dos alturas de la columna derecha. Inicio aprovecha el ancho y alto disponibles sin los anteriores límites de 1700 y 876 px. Fuentes, gráficos, círculo, iconos y espacios se adaptan conjuntamente. Las comidas distribuyen el alto restante respetando el espacio que necesita su contenido. Los bordes de las columnas coinciden con los KPI; el objetivo es mostrar todo el panel sin scroll en escritorio, portátil y tablet apaisada habituales.
7. Con poca altura, compactar separaciones y filas de comidas; en la variante de 640–699 px se ocultan las notas secundarias del plan, conservando sus etiquetas y valores. Los nombres largos pueden abreviarse visualmente en escritorio; el nombre completo sigue accesible en el botón y en su receta. Las acciones de registrar comidas y actividad se conservan.
8. En móvil, usar dos columnas de KPI y apilar menú, nutrición y plan con scroll natural, sin alturas forzadas. La barra superior y la navegación inferior siguen disponibles. El modo de panel requiere al menos 1181 × 640 px, 1000 × 700 px o 851 × 768 px. Las ventanas menores pasan a flujo natural. Si falta un ciclo, el aviso y el selector de fecha conservan prioridad y la página puede crecer.
9. Retirar «Tu día, organizado» y su cálculo de receta más rápida. En Inicio y Menú, una estrella compartida inmediatamente a la izquierda del número de calorías permite añadir o quitar favoritas. Conserva nombre accesible, estado pulsado, área táctil de 44 px y foco al actualizar; las apariciones de la misma receta reflejan el cambio. Usa las preferencias y confirmación del servidor existentes. No registra comidas, cambia raciones ni conserva posiciones del planificador. Las recetas retiradas se pueden consultar, con la preferencia deshabilitada.

## Límites

- Actualización del 15 de octubre de 2026: si termina el ciclo sin otro menú confirmado disponible, Inicio sustituye el dashboard por un bloqueo con acceso al planificador y muestra el diálogo de renovación. Menú aplica el mismo bloqueo; el resto de las secciones sigue disponible. El bloqueo termina al disponer de otro menú confirmado; si su fecha ya llegó, se activa antes de volver a mostrar el panel.

- La actualización no modifica el formato de estado, los catálogos, la sincronización ni los cálculos nutricionales.
- Las métricas semanales se derivan de los registros del estado actual, igual que en ADR-0035; no incorporan un agregado nuevo de ciclos archivados.
- La revisión visual local usa un estado ficticio y las plantillas y catálogos reales, sin sesión ni escrituras en Supabase. No sustituye la revisión de la versión publicada ni el uso en dispositivos físicos.

## Revisión local: 26 de octubre de 2026

Se renderizó la aplicación real por HTTP en Firefox con los catálogos y módulos actuales y datos sintéticos en memoria, sin autenticación ni escrituras personales. Se revisaron Inicio y la colocación de la estrella en Menú.

| Tamaño | Resultado observado |
| --- | --- |
| 2560 × 1440 y 1920 × 1080 | Cabecera, KPI y contenido ocupan el alto disponible; menú a la izquierda y nutrición/plan a la derecha, sin desbordamiento de página. |
| 1366 × 768 y 1280 × 720 | Cinco comidas visibles, textos compactados y plan alineado con el final del menú, sin desbordamiento de página ni de tarjetas. |
| 1194 × 834, 1024 × 768 y 1133 × 744 | Distribución de tablet apaisada con lateral compacto según anchura y controles contenidos. El destacado de la primera comida no se solapa con la siguiente fila. |
| 1366 × 640 | Variante de altura reducida sin desbordamiento de página; conserva comidas y acciones con notas secundarias del plan ocultas. |
| 390 × 844 | KPI en dos columnas y menú, nutrición y plan apilados con scroll natural, sin desbordamiento horizontal. |

La estrella precede al número de calorías y queda separada del registro de comida. Esta revisión visual no verifica el guardado autenticado, dispositivos físicos ni la versión publicada. No se añadieron ni ejecutaron pruebas automatizadas para este cambio.

## Revisión histórica: 15 de octubre de 2026

Los resultados siguientes corresponden a la distribución anterior con dos tarjetas de igual altura. Se conservan como evidencia histórica; no describen la distribución vigente del 26 de octubre.

Se inspeccionó el diseño en navegador con tamaños de escritorio, portátil, tablet y móvil:

| Tamaño | Resultado observado |
| --- | --- |
| 2515 × 1273 y 2560 × 1440 | Inicio ocupa el ancho disponible, escala sus fuentes y gráficos y sitúa el resumen al final del alto útil, sin scroll. |
| 1920 × 1080 y 1440 × 900 | Cuatro filas de dashboard dentro de la pantalla, sin desbordamiento. |
| 1600 × 1000, 1920 × 1000 y 2048 × 1152 | Densidad intermedia: las cinco comidas se mantienen dentro de la tarjeta, sin solaparse con el resumen. |
| 1366 × 768 y 1280 × 720 | Cinco comidas y resumen del plan dentro de la pantalla, sin scroll ni desbordamiento de las tarjetas. |
| 1024 × 768 y 900 × 700 | Distribución en paralelo y variante compacta según altura, sin scroll de página ni de tarjetas. |
| 768 × 1024 | Panel de tablet vertical completo por encima de la navegación inferior. |
| 390 × 844 y 320 × 568 | Cuatro KPI en dos columnas y tarjetas apiladas con scroll natural, sin desbordamiento horizontal. |

También se revisaron un perfil pendiente de confirmar con un objetivo largo y raciones desactivadas, la ausencia de recuperación ósea cuando está desactivada y la visibilidad del selector cuando no hay ciclo. La consola de la revisión local no mostró errores ni avisos. No se añadieron ni ejecutaron pruebas automatizadas en esta ampliación.

### Corrección tras la captura del propietario

La primera revisión comprobó la ausencia de scroll, pero no detectó que los límites fijos dejaban el dashboard pequeño y centrado, con espacio sin aprovechar en pantallas grandes. Se retiraron ambos límites únicamente en Inicio y se revisó también la ocupación del ancho y del alto, a 2515 × 1273 px y con un estado ficticio sin comidas ni sesiones y con las dos opciones del resumen que aparecen en la captura. Se retiró además el acceso redundante «Ver receta» de la fila destacada. La revisión posterior incluye también un estado con comidas y actividad registradas, recuperación activa y perfil pendiente. Se ajustó la densidad de las ventanas anchas de altura intermedia y el espaciado de la barra lateral con diez opciones de administrador para evitar desbordamientos.
