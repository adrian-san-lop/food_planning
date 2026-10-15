# ADR-0036: Detalle semanal y resumen del plan en Inicio

- **Fecha:** 15 de octubre de 2026
- **Estado:** Aceptada e implementada localmente
- **Alcance:** Inicio en escritorio, tablet y móvil
- **Relación:** amplía ADR-0035 y sustituye su distribución móvil; mantiene la navegación diaria de ADR-0019.

## Contexto

El propietario ha aprobado el boceto de cuatro KPI con detalle diario de comidas y ha pedido reducir el tamaño de las tarjetas inferiores. El espacio disponible debe mostrar también los objetivos y ajustes personales, evitando estirar las filas para llenar pantallas grandes.

## Decisión

1. Compartir cuatro KPI entre escritorio y móvil: comidas de lunes a domingo sobre 35, sesiones ya realizadas esta semana con su duración, días distintos con comidas registradas sobre 7 e ingredientes por reponer. Siete barras dentro del primer KPI muestran entre cero y cinco comidas por fecha; se destaca hoy y se distinguen los días futuros. No se suman claves inválidas ni comidas de fechas futuras. La racha móvil anterior se sustituye por estos KPI.
2. Mostrar bajo el título la posición del ciclo y sus fechas. Si el inicio es futuro, indicar «Comienza el…»; si terminó, mostrarlo explícitamente. La fecha civil y la aritmética siguen usando `Europe/Madrid` mediante los módulos existentes. `js/domain/dashboard.js` contiene únicamente los cálculos de semana y ciclo, sin DOM, almacenamiento ni Supabase.
3. Mantener nutrición y menú en dos tarjetas de igual ancho: la primera ocupa las columnas de los KPI 1–2 y la segunda las de los KPI 3–4. La nutrición cuenta solo comidas registradas y conserva los objetivos actuales, incluido el ajuste energético de actividad ya realizada hoy.
4. Destacar la primera comida pendiente de hoy. El nombre del plato abre su receta; no se muestra un botón adicional «Ver receta» ni su flecha. El destacado avanza al registrar la comida; desaparece si se han completado las cinco. No implica una hora de ingesta ni modifica la fecha seleccionada en Menú. La página Menú conserva su presentación habitual.
5. Añadir debajo «Tu plan actual», derivado del perfil: objetivo, ajuste automático de raciones y recuperación ósea solo cuando está activa. Mantener un acceso al perfil y advertir si aún contiene los datos de ejemplo. La recuperación se presenta como un ajuste cualitativo para nuevas propuestas, sin inventar cantidades de micronutrientes ni resultados clínicos.
6. Usar cuatro filas en el dashboard: cabecera, KPI, nutrición/menú y resumen del plan. Inicio aprovecha el ancho y el alto disponibles sin los anteriores límites de 1700 y 876 px. En pantallas grandes también crecen las fuentes, los gráficos, los iconos y los controles; el resumen inferior cierra el panel dentro de la pantalla. Los KPI y las tarjetas comparten los bordes de columna. Las pantallas habituales de escritorio, portátil y tablet muestran todo el panel sin scroll de página ni de tarjetas.
7. Con poca altura, presentar el resumen del plan en una franja horizontal y simplificar las filas de comidas. Los nombres largos se abrevian visualmente en escritorio; el nombre completo sigue accesible en el botón y en su receta. Las acciones de registrar comidas y actividad se conservan.
8. En móvil, usar dos columnas de KPI y apilar nutrición, menú y resumen del plan con scroll natural, sin banner adicional ni alturas forzadas. La barra superior y la navegación inferior siguen disponibles. Las ventanas demasiado bajas o estrechas también pasan a flujo natural para no recortar contenido. El modo de panel requiere al menos 851 × 700 px, o 700 px de ancho y 900 px de alto para tablet vertical. Si falta un ciclo, el aviso y el selector de fecha conservan prioridad y la página puede crecer.

## Límites

- La actualización no modifica el formato de estado, los catálogos, la sincronización ni los cálculos nutricionales.
- Las métricas semanales se derivan de los registros del estado actual, igual que en ADR-0035; no incorporan un agregado nuevo de ciclos archivados.
- La revisión visual local usa un estado ficticio y las plantillas y catálogos reales, sin sesión ni escrituras en Supabase. No sustituye la revisión de la versión publicada ni el uso en dispositivos físicos.

## Revisión local

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
