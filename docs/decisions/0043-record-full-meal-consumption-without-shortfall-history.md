# ADR-0043: registrar el consumo completo sin guardar faltantes históricos

- Estado: Aceptada e implementada. El propietario reaplicó la migración de limpieza el 23/10/2026 con Success, y el paquete 7 comprobó cero filas tras nuevos consumos reales.
- Fecha: 2026-10-18
- Alcance: registro de comidas, despensa, compras, reversos y sincronización.
- Sustituye la parte de ADR-0040 que guardaba los faltantes por separado.

## Contexto

Menuki es un seguimiento de menú de uso personal y sencillo. Marcar una receta como realizada indica que se comió; mantener una segunda cifra por cada ingrediente que supuestamente faltaba en la despensa añade mantenimiento sin ayudar a decidir qué comprar. La despensa puede estar incompleta porque se olvidó registrar una compra o existencia.

## Decisión

- Al completar una comida, conservar las cantidades completas de la receta como snapshot de consumo.
- Descontar solo lo que figure disponible en la despensa, con saldo mínimo cero. No calcular, mostrar ni guardar la diferencia entre el consumo completo y el saldo anotado.
- Mantener movimientos por la salida realmente descontada, incluido el marcador idempotente de cantidad cero cuando no había saldo. Al desmarcar, restaurar solo la salida original; el reverso sigue siendo idempotente.
- La compra se basa en existencias actuales y comidas futuras aún pendientes del período seleccionado. El sistema no crea una necesidad adicional por el consumo pasado.
- La versión local pasa a v11 y elimina la propiedad histórica `shortfall` al normalizar estados v5-v11. La migración v8 aún interpreta temporalmente su dato antiguo para corregir cuánto se descontó y asegurar reversos correctos.
- El cliente deja de consultar y enviar `meal_completion_shortfalls`. La migración `20261018120000_retire_meal_shortfalls.sql` elimina sus filas históricas, conserva la tabla vacía para compatibilidad con definiciones antiguas del RPC y bloquea nuevas inserciones/actualizaciones. Los valores heredados de `inventory_movements.shortfall_quantity` se mantienen solo para calcular reversiones históricas correctas; el cliente envía cero en los movimientos nuevos y no los muestra.

## Consecuencias

- Despensa muestra saldos, compras anotadas y consumo acumulado, sin cifras históricas de faltantes.
- La vista de receta informa del stock actual, sin comparar el stock con una comida ya completada. La lista de Compra puede seguir mostrando cuánto falta para cubrir comidas futuras.
- Si un saldo estaba mal anotado, registrar la comida no exige corregirlo: el saldo llega a cero y el consumo completo permanece en el registro de la comida. Los ajustes manuales posteriores reflejan compras o correcciones reales.
- La limpieza de Supabase es una migración de datos global y debe ejecutarse por el propietario. El propietario comunicó la aplicación y comprobaciones estructurales el 22/10/2026. La primera prueba alojada del paquete 7 detectó dos filas nuevas de la cuenta de prueba; tras reaplicar el propietario la migración con Success el 23/10/2026, consumos desde interfaz y RPC dejaron cero filas. Véase [el registro de integración](../planner/package-7-integration.md). No se infiere qué cambio remoto causó la discrepancia inicial.

## Decisión sustituida

ADR-0040 sigue describiendo el cambio anterior que evitó saldos negativos, pero sus reglas de conservar y mostrar faltantes quedan sustituidas por esta decisión.
