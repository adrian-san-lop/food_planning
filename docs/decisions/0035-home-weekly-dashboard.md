# ADR-0035: Panel semanal de Inicio en escritorio

- **Fecha:** 15 de octubre de 2026
- **Estado:** Aceptada e implementada localmente
- **Alcance:** distribución de Inicio en PC y tablets apaisadas, con continuidad del diseño móvil
- **Relación:** actualiza la distribución de escritorio de ADR-0031; conserva la navegación diaria de ADR-0019 y los KPI móviles de ADR-0028.

La distribución y los KPI móviles de esta decisión se actualizan en [ADR-0036](0036-dashboard-weekly-detail-and-plan-summary.md). La revisión documentada abajo corresponde a la versión anterior del panel.

## Contexto

El resumen anterior dejaba mucho espacio sin contenido y mezclaba indicadores de todo el ciclo con información del día. Inicio debe servir como panel de control, con métricas semanales y una lectura rápida del objetivo nutricional y del menú previsto para hoy. La pantalla de PC y de tablet apaisada debe usar su alto disponible sin obligar a desplazarse cuando existe un ciclo activo.

## Decisión

1. En PC y tablet apaisada, Inicio elimina el banner de marca del panel y muestra una cabecera compacta con la fecha, el título «Tu semana, de un vistazo» y accesos a la guía rápida, el cambio de fecha y el menú completo. Si el perfil todavía no se ha confirmado, se conserva también el acceso para revisarlo.
2. Presentar cuatro KPI en la franja superior: comidas registradas esta semana sobre 35, sesiones realizadas esta semana con su duración acumulada, días de esta semana con al menos una comida registrada sobre 7, e ingredientes por reponer. Las barras de comidas y días activos representan sus respectivos avances.
3. Debajo, distribuir las dos tarjetas a ancho completo: nutrición ocupa las columnas de los dos primeros KPI y su borde derecho coincide con el del segundo; el menú empieza bajo el tercer KPI y ocupa también la cuarta columna. No se deja vacía la primera columna. El menú mantiene sus cinco comidas y las acciones existentes.
4. Con un ciclo activo, adaptar las tarjetas al alto disponible con un máximo de 600 px, sin estirar el contenido para llenar pantallas grandes. Las resoluciones habituales de portátil, tablet apaisada y escritorio deben caber sin desplazamiento vertical. En ventanas de hasta 1000 px de ancho o menos de 640 px de alto, usar dos columnas de KPI y apilar las tarjetas para mantener la legibilidad. Cuando falta un ciclo, el aviso de configuración conserva prioridad y la página puede crecer para no ocultarlo ni recortar el selector.
5. Mantener en móvil el banner compacto con sus accesos a guía y fecha, los KPI semanales de comidas y racha, la nutrición de hoy y el menú debajo del primer bloque. Acortar el banner omitiendo su subtítulo y ajustar su espaciado. Se mantienen la navegación móvil y las acciones actuales de las comidas.

## Consecuencias

- Los KPI de escritorio ya no presentan el objetivo base ni los registros de las tres semanas completas; resumen el progreso desde el lunes de la semana actual.
- «Días activos» cuenta fechas distintas con comidas registradas hasta hoy, sin sumar varias ingestas del mismo día ni incluir fechas futuras.
- La nutrición continúa contando solo comidas registradas y aplica al objetivo energético la actividad realizada ese día.
- El panel de escritorio adapta tamaños y espaciado a la altura y anchura disponibles; el menú completo de tres semanas y su navegación permanecen en Menú. La barra lateral compacta su espaciado en ventanas de poca altura.
- La revisión visual local usa datos ficticios y las plantillas reales de la app, sin abrir una sesión ni escribir en Supabase. La validación del despliegue autenticado permanece pendiente.

## Validación local

Revisión en navegador del 15 de octubre de 2026, con las plantillas y catálogos reales y un estado ficticio aislado de Supabase:

| Pantalla | Resultado |
| --- | --- |
| 2560 × 1440 | Cuatro KPI y dos tarjetas de igual ancho, con alto limitado y sin scroll de página. |
| 1440 × 900 y 1366 × 768 | Panel completo sin scroll; las cinco comidas y sus controles quedan dentro de la tarjeta. |
| 1024 × 768 | Dos tarjetas en paralelo, con el tipo de comida sobre el plato para aprovechar el ancho disponible. Sin scroll de página. |
| 900 × 700 | KPI en dos columnas y tarjetas apiladas en flujo natural, sin desbordamiento horizontal. |
| 390 × 844 | Resumen móvil compacto y menú accesible al desplazarse; sin desbordamiento horizontal. |

Se comprobaron los accesos al menú completo, a la guía rápida y al editor de fecha, y la visibilidad del aviso y selector cuando no hay ciclo activo. La consola de esta revisión no mostró errores. Las nueve pruebas existentes de `npm test` pasan; no se añadieron pruebas que duplicasen reglas CSS.
