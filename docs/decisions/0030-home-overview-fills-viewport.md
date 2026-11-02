# ADR-0030: Inicio como resumen de pantalla completa

- **Fecha:** 14 de octubre de 2026
- **Estado:** Aceptada e implementada localmente
- **Alcance:** contenido y adaptación de Inicio en escritorio y móvil
- **Relación:** reemplaza el punto 2 de ADR-0019; sus puntos 1–2 quedan parcialmente reemplazados por ADR-0031. Mantiene los KPI móviles aceptados en ADR-0028.

Decisión de distribución sustituida: ADR-0031 recuperó Menú de hoy en Inicio; ADR-0035 y ADR-0036 fijan el dashboard vigente, con menú, nutrición y resumen del plan, cuatro KPI compartidos y flujo móvil natural. Los puntos y consecuencias siguientes describen la etapa histórica y no la interfaz actual.

## Contexto

La fecha del día y el encabezado «Menú de hoy» aparecían debajo de los KPI y del resumen nutricional en Inicio. En móviles y en pantallas de poca altura, ese encabezado quedaba cortado en el primer pantallazo y desplazaba el acceso al menú.

## Decisión

1. Inicio solo muestra el banner, sus KPI y el progreso nutricional del día, en ese orden.
2. No muestra la fecha, el encabezado «Menú de hoy», el resumen de comidas ni las tarjetas de platos. El menú se consulta en la página Menú.
3. El bloque de Inicio ocupa el área disponible entre la cabecera y la navegación inferior en móvil, y entre la cabecera y el borde inferior de la página en escritorio. Su espaciado y componentes se ajustan al ancho y al alto de pantalla.
4. El resumen nutricional sigue calculándose con las comidas registradas de hoy cuando esa fecha pertenece al ciclo activo; la actividad solo ajusta el objetivo energético según las reglas existentes.

## Consecuencias

- Inicio presenta un resumen completo sin que el encabezado del menú aparezca cortado al final de la pantalla.
- Menú es el único destino para ver la fecha seleccionada y los platos del ciclo.
- El comportamiento debe revisarse en pantallas móviles y de escritorio con diferentes alturas antes de publicar.
