# Decisión 0019: Inicio diario y navegación del menú

- **Fecha:** 13 de octubre de 2026
- **Actualización:** 16 de octubre de 2026, dashboard del ciclo y resumen del día seleccionado
- **Estado:** Aceptada e implementada localmente
- **Alcance:** separación de Inicio y Menú, navegación del ciclo, fecha de inicio visible y etiqueta de Compra
- **Relación:** concreta y reemplaza parcialmente el punto 2 de ADR-0018; la ubicación de la guía de primera visita de ADR-0011 pasa de Inicio a Guía.

## Decisiones

1. Mantener las secciones de la aplicación como páginas independientes dentro de la navegación existente.
2. Limitar Inicio al resumen del día. La distribución inicial banner/KPI/nutrición/menú fue sustituida por ADR-0035 y ADR-0036: el dashboard vigente incluye cuatro KPI, Menú de hoy, nutrición, resumen del día y plan actual. Inicio no muestra selector de días, navegación semanal, compra próxima ni otros paneles del ciclo.
3. Colocar en Menú la navegación por las tres semanas y el calendario de siete días que antes aparecía en Inicio. Al elegir un día, Menú muestra el detalle de esa fecha. Entrar desde Inicio abre la fecha de hoy cuando pertenece al ciclo activo.
4. Mostrar la navegación por semanas y días únicamente en Menú. La navegación nunca cambia la fecha ni el contenido del resumen de Inicio.
5. La orientación inicial pasó a Guía. ADR-0025 y ADR-0029 fijan el recorrido completo en Guía y la guía rápida opcional de tres pasos accesible desde Inicio y Guía.
6. En Compra, mostrar el establecimiento principal como **Supermercado**. El identificador interno de tienda y los datos de catálogo no cambian.
7. En PC, dejar el logotipo de la barra lateral como única marca de cabecera y ocultar el logotipo repetido del área principal. El banner de Inicio de esta etapa fue sustituido por la cabecera compacta del dashboard (ADR-0035 y ADR-0036).
8. Cuando el ciclo todavía no ha empezado, mostrar su fecha de inicio en un aviso destacado. Actualización del 15 de octubre de 2026: si termina sin otro menú confirmado disponible, bloquear Inicio y Menú y mostrar un diálogo para generar el siguiente o continuar el borrador; mantener accesibles las demás páginas. La renovación usa el planificador interno. Separar visualmente el objetivo nutricional de hoy del bloque del menú.
9. En Menú, mostrar las fechas y la posición del ciclo junto al título, sin la tarjeta permanente de inicio. «Cambiar fecha» abre un diálogo compacto según ADR-0037. Debajo del botón se sitúa «Cómo se calculan las cantidades», que abre una ayuda y no descuadra las tarjetas inferiores.
10. Desde Inicio o Guía, el acceso a cambiar fecha lleva a Menú y abre ese mismo diálogo. En Inicio y Menú, identificar cada tipo de comida con un icono propio además de su nombre.
11. Sustituir los títulos descriptivos de las semanas por número de semana, estado, fechas y progreso sobre 35 comidas. Los siete botones de día muestran abreviatura, número grande y barra de progreso; el recuento queda en el nombre accesible, sin «Hoy», «0/5» ni «Base» visibles.
12. En escritorio y tablet apaisada, las cinco comidas de la fecha seleccionada ocupan la izquierda. Las calorías y el control de registro, de 44 px, quedan juntos. Actualización del 26 de octubre: la estrella compartida para añadir o quitar favoritas precede inmediatamente al número de calorías, separada del registro, igual que en Inicio. A la derecha se apilan Próximo ciclo y Resumen del día, alineados con la tarjeta del menú. El resumen comparte la plantilla del círculo de calorías y barras de macros de Inicio; utiliza únicamente los snapshots de comidas completadas y el objetivo con actividad de esa fecha. Consultar un día futuro no permite registrar comidas ni actividad antes de tiempo.
13. Próximo ciclo muestra fechas y el estado real: Sin preparar → Preparar próximo menú; Borrador → Continuar revisión; Confirmado → Revisar menú guardado. Durante los últimos tres días se destaca la necesidad de prepararlo en esa misma tarjeta. No se duplica el aviso inferior en Menú. La generación, confirmación, activación y el bloqueo de un ciclo terminado conservan su lógica.
14. Retirar los banners permanentes de actividad y cantidades. La ayuda de actividad se consulta junto a Registrar actividad; el detalle de cantidades se abre desde la cabecera. Toda la vista adapta espacios, rellenos, tipografía, iconos y gráficos combinando ancho y alto útiles de la ventana. La cabecera y los selectores ocupan su espacio necesario y las tarjetas inferiores reciben el alto restante, sin el antiguo máximo de 520–720 px calculado por anchura. Los nombres de recetas escalan entre 16 y 24 px, los títulos hasta 46 px y los controles mantienen al menos 44 px. La escala se limita por la dimensión más restrictiva para que una ventana ancha y baja no reciba tamaños propios de un monitor alto.
15. El modo ajustado al alto requiere al menos 1181 × 640 px, 1000 × 700 px o 851 × 768 px de ventana. La variante compacta reduce separaciones y rellenos para portátiles de poca altura; la tarjeta del próximo ciclo admite el alto mínimo de su contenido. Con poca altura o ancho, usar flujo natural, sin ocultar contenido para forzar el encaje. En móvil, apilar menú, nutrición y próximo ciclo conservando la presentación existente.

## Consecuencias

- Las vistas de Inicio y Menú tienen responsabilidades claras: resumen diario frente a navegación y detalle del ciclo.
- Las comidas que se registren desde Inicio o Menú conservan la semana y fecha correctas, aunque se haya navegado por el ciclo.
- La primera visita sigue indicando que se debe revisar el perfil, ahora desde Guía y el formulario de Perfil.
- Compra usa una etiqueta genérica para el establecimiento principal sin modificar la persistencia ni las referencias del catálogo.
- En escritorio, la cabecera compacta sustituye al banner y el logo no se repite junto al contenido. El aviso de fecha explica cuándo empieza o terminó el ciclo; el objetivo y el menú tienen una separación visible.
- Las fechas del ciclo quedan a la vista al entrar en Menú, y el acceso de Inicio lleva directamente al diálogo para editarlas. Los iconos ayudan a reconocer desayuno, media mañana, comida, media tarde y cena en las tarjetas y el detalle del menú.
- No cambia el formato de estado ni se añaden totales persistidos: nutrición y progreso se derivan de las fechas seleccionadas y sus registros. Inicio conserva su fecha y presentación.

## Revisión visual local del 16 de octubre de 2026

Se ha observado la distribución con el shell, estilos, módulos y catálogos reales, servidos por HTTP con datos ficticios y sin sesión de Supabase. A 1920 × 1080, 1366 × 768, 1280 × 720 y 1024 × 768, las cinco comidas y las dos tarjetas laterales quedan dentro de la pantalla; sus bordes superiores e inferiores están alineados. En móvil de 390 × 844 se utiliza desplazamiento natural. La revisión visual no confirma la publicación ni la sincronización con una cuenta real; no se han añadido ni ejecutado suites de pruebas.

### Ajuste posterior del ancho y alto útiles

La escala fluida se ha observado en 2560 × 1440, 1920 × 1080, 1366 × 650 y 1024 × 768. La página cabe en esas ventanas, las cinco comidas permanecen visibles y las tarjetas inferiores comparten sus bordes superior e inferior. El panel termina junto al margen inferior de la ventana, sin el hueco que dejaba el límite anterior. En 2560 × 1440 los nombres de recetas alcanzan 24 px y el título 46 px; en el portátil compacto permanecen en 16 y 28 px, con controles de al menos 44 px. Esta revisión corresponde a la vista HTTP local con datos de ejemplo; no se han ejecutado suites de pruebas ni operaciones en una cuenta real.
