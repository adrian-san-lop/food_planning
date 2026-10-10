# ADR-0004 — Carga de catálogos JSON y propuesta local del ciclo

- Estado: Aceptada para la primera versión
- Fecha: 2026-10-10
- Alcance: aplicación estática, catálogos y planificador

## Contexto

Los catálogos JSON contienen alimentos, formatos de compra y recetas relacionadas por IDs estables. El menú HTML existente es el ciclo inicial aprobado y el estado personal todavía se conserva en `localStorage`. Supabase se pospone.

## Decisión

- La app carga `data/foods.json` y `data/recipes.json` por HTTP(S), valida sus versiones, unidades, referencias y tipos, y muestra un error recuperable si no puede abrirlos.
- Los contratos estructurales viven en `data/foods.schema.json` y `data/recipes.schema.json`. Los datos nutricionales y formatos de compra siguen siendo aproximados y se mantienen separados del estado personal.
- El menú fijo actual permanece como primer ciclo. Un botón permite generar una propuesta de 105 comidas para el siguiente ciclo.
- El planificador conserva la lógica actual de porciones y usa ponderaciones iniciales para nutrición, variedad, repetición, recetas ausentes del menú activo y cobertura de existencias. Tener poco stock nunca excluye una receta.
- La persona puede cambiar una receta por otra del mismo tipo, bloquearla o desbloquearla y regenerar las comidas no bloqueadas. Un cambio manual queda bloqueado inicialmente.
- La propuesta confirmada guarda fechas, recetas, bloqueos y `catalogVersion` en el estado local. Se activa al llegar a la fecha guardada y archiva el ciclo anterior. El registro de una comida mantiene el snapshot de cantidades consumidas que ya usa el inventario.
- No se añaden filtros de gustos o alergias, cuentas, sincronización ni persistencia remota.

## Consecuencias

- La app debe abrirse desde GitHub Pages o un servidor HTTP(S); la carga JSON no funciona desde `file://`.
- La propuesta no se sincroniza entre navegadores ni dispositivos y forma parte de la copia de seguridad local.
- Las ponderaciones actuales son detalles iniciales de implementación. No establecen un mínimo de recetas nuevas ni tolerancias nutricionales de producto.

## Pendiente

Validar el plan con el uso real y decidir más adelante si hacen falta filtros personales, métricas adicionales o Supabase.
