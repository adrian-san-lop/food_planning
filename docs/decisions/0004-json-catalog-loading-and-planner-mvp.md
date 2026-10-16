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

## Evolución posterior

La decisión de aplazar Supabase describía el primer MVP y quedó reemplazada para la persistencia personal por [ADR-0010](0010-supabase-relational-state-sync.md). Los catálogos JSON siguen siendo públicos y locales al repositorio; el perfil y los registros personales ahora se sincronizan en tablas relacionales.

El 15 de octubre de 2026 se concreta la renovación: el planificador interno sustituye el encargo externo; Inicio y Menú se bloquean al terminar un ciclo sin otro confirmado disponible. La compra anticipada requiere un próximo menú confirmado y un inicio a tres días o menos, con listas separadas y previsión de despensa. El flujo vigente se detalla en [la especificación del planificador](../planner/specification.md#renovación-y-compra-anticipada).

El 16 de octubre de 2026 se simplifica la revisión: «Cambiar platos» y «Guardar» quedan junto al título, visibles al desplazar las semanas; se retira Cerrar del pie y permanece la X. «Cambiar platos» explica en hover/foco «Renueva únicamente los desbloqueados». Fecha, duración, variedad, objetivo, raciones y recuperación se presentan mediante grupos breves y tarjetas; el detalle de generación y la cobertura cualitativa pasan a «Cómo se prepara este menú». Se conserva el aviso si el perfil de recuperación cambió, así como scroll y foco al editar. Esta decisión es de presentación: no modifica el generador, los bloqueos, la confirmación ni la persistencia descrita en ADR-0010. El diseño se adapta también a anchos de tablet y móvil.

La revisión local por HTTP utilizó los catálogos y eventos reales con estado personal sintético. Se comprobaron 105 selectores, bloqueo automático al sustituir, conservación de un plato bloqueado al regenerar, posición y foco al editar al final de la tercera semana, ayuda de teclado, aviso de recuperación modificada y confirmación con Guardar. El contenido no desbordó horizontalmente en 1920 × 1080, 1366 × 768, 1024 × 768, 390 × 844 y 320 × 740 px. La sincronización autenticada y la publicación quedan fuera de esta comprobación local.
