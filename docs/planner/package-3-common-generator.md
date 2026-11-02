# Paquete 3: generador común

- Fecha: 23/10/2026.
- Estado: **Incorporado a dev** junto con el paquete 4, según el propietario y la comprobación de `dev`/`origin/dev` antes del 5 (`a3b6af28c0ea`). Se desarrolló y probó localmente en `chore/common-menu-generator` desde `dev` limpio (`609ca36`); este paquete no añadió SQL. Los resultados de pruebas siguientes corresponden a su cierre.
- Alcance: tercer paquete del [plan integrado](implementation-plan.md), según [ADR-0047](../decisions/0047-guided-first-use-and-personalized-planning.md).

## Qué se activa y qué queda preparado

La renovación del menú ya utiliza la entrada común `createMenuPlanner`: exige un perfil válido confirmado, compara tres propuestas completas y considera las existencias previstas al comenzar el ciclo. Conserva la fecha elegida al regenerar, los bloqueos y el formato de 105 posiciones.

La misma entrada permite generar un primer ciclo sin historial. Al cerrar el paquete 3 estaba probada en dominio y por HTTP, sin activar el primer arranque. El [paquete 6](package-6-guided-first-setup.md) conecta posteriormente configuración y primer menú generado con la persistencia del 4 y sus capacidades; las cuentas nuevas no reciben plantilla fija.

Las preferencias y tiempos se aplican en el motor cuando se suministran. Al cerrar el paquete 3 no se podían editar ni guardar por cuenta; el [paquete 4](package-4-persistence.md) añade persistencia y el [5](package-5-preferences-and-weekly-review.md) incorpora controles y revisión semanal, probados localmente. La revisión del 5 permite cambios a tres semanas o una comida conservando bloqueos; sustituye la presentación anterior de las tres semanas completas con cambios exclusivamente individuales.

## Entrada y responsabilidades

- `js/domain/menu-planner.js`: entrada común, validación, restricciones, inspección del resultado y comparación de candidatos. Recibe recetas, nutrición, conversiones y preferencias cualitativas de recuperación por inyección; no conoce DOM, almacenamiento ni Supabase.
- `js/domain/menu-generator.js`: selección de familias, repertorio familiar y semana repetida. Admite una función de elegibilidad por día y conserva todos los bloqueos. Mantiene el azar inyectable y los ajustes anteriores de familiaridad.
- `js/domain/planning-stock.js`: proyección de despensa sobre una copia, con fechas civiles y consumos pendientes. No crea movimientos ni cambia snapshots.
- `js/main.js`: adapta la cuenta actual a la petición, conserva las acciones y el formato persistido del plan y limita los errores de generación al planificador. Los resultados de análisis no se añaden al estado sincronizado.

Petición de dominio:

```js
{
  start: '2026-11-13', // inicio elegido del ciclo propuesto
  asOf: '2026-10-23',  // fecha de referencia del saldo real
  profile, profileConfirmed: true,
  preferences,        // opcionales; contrato del paquete 1
  previousMenus,      // opcional; sin historial también genera
  draft, stock,       // opcionales; bloqueos y saldo registrado
  currentCycle,       // opcional: start, menus y done por fecha#slot
  activityKcalToday,  // opcional: solo energía real de asOf
  previewWeight, rng  // opcionales; sin mutar perfil ni guardar semilla
}
```

La ausencia de historial válido no instala una plantilla en este motor ni exige despensa. El perfil se valida sin rellenar valores de ejemplo y su confirmación es explícita. Una preferencia inválida o una fecha incorrecta produce un error; no se ignoran para generar con condiciones diferentes. La inspección detecta también fechas discordantes y posiciones incompletas.

La confirmación recibida es un dato del adaptador, **no un control de seguridad del servidor**. El [paquete 4](package-4-persistence.md) incorpora su validación transaccional en SQL, aplicado con los siete diagnósticos correctos según el propietario el 23/10/2026. El [paquete 7](package-7-integration.md) completa la validación funcional con sesiones reales. La aplicación consulta el indicador del perfil y pide revisarlo antes de nuevas propuestas o confirmaciones; los ciclos existentes siguen disponibles.

## Preferencias, tiempos y bloqueos

- Normal mantiene elegibilidad; Favorita aumenta prioridad sin garantizar aparición. No proponer excluye exclusivamente la selección automática del ID indicado. No se infieren gustos del historial ni se extiende una exclusión a otras recetas de la familia.
- Los límites de comida y cena se aplican de lunes a viernes según la fecha de inicio real, aunque el ciclo empiece otro día. Se repiten los mismos días de la semana en cada copia. Un tiempo desconocido no cumple un límite activo; no se sustituye por cero.
- Un bloqueo manual compatible con el tipo se conserva aunque esté excluido o rebase un tiempo. Se informa como excepción. Una elección excluida bloqueada en la primera semana no se propaga automáticamente a las posiciones desbloqueadas de las otras dos.
- Un bloqueo cuyo ID ya no existe o cuyo tipo es incompatible se mantiene para revisar y se señala como inválido; no se sustituye silenciosamente.
- Si no hay candidatos, el resultado contiene posiciones `null`, bloqueos conservados y motivos (`not_proposed`, `time_limit`, `unknown_time` o falta de recetas del tipo). Devuelve `complete: false`; no se evalúa ni se puede confirmar como ciclo completo. Los consumidores futuros de la revisión deben representar esas posiciones antes de conectar preferencias a la interfaz.
- Preferencias que apuntan a IDs ausentes se conservan y se notifican; no se trasladan a otra receta ni borran el resto de preferencias.

El repertorio orientativo 3/2/4/2/4 y la renovación opcional de dos o tres familias siguen siendo preferencias suaves. Si las exclusiones, tiempos o bloqueos obligan a más cambios, prevalecen estas condiciones y el análisis señala `expanded_renewal`. No se reutiliza una receta excluida para satisfacer artificialmente la continuidad. Cuando las alternativas previas siguen siendo compatibles, se conserva la mayoría y se limita la novedad voluntaria.

## Comparación de semanas

Se construyen tres candidatos con una semana base repetida tres veces y todas sus excepciones manuales. Se evalúan sus 21 días con el servicio nutricional del paquete 2, utilizando las cantidades reales, sus límites y sus redondeos. Las comidas completadas del ciclo actual no se modifican.

La selección compara:

- Desviación diaria de kcal y macros respecto al objetivo base; conserva la ponderación nutricional anterior.
- Distribución de comidas: penaliza tentempiés más energéticos que la menor de las dos comidas principales. No fija porcentajes nuevos por comida ni un umbral de adecuación nutricional.
- Repeticiones consecutivas de familias de comida/cena, tiempos de preparación conocidos y tiempos desconocidos diferenciados, ingredientes compartidos y cobertura del saldo previsto.
- Favoritas y las preferencias cualitativas de recuperación ya existentes, sin presentar etiquetas como ingestas de micronutrientes.

El análisis devuelve el candidato elegido, puntuaciones y métricas, totales/objetivo/diferencias por fecha, resúmenes semanales y contadores de preparaciones. La diferencia es `total − objetivo`. `complete: true` acredita las 105 posiciones compatibles; **no** significa que se hayan alcanzado las kcal ni que el menú cumpla una tolerancia clínica.

Los pesos de búsqueda son ajustes revisables de implementación: nutrición × 8; distribución × 2; repetición × 0,2; preparación × 0,15; diversidad de ingredientes normalizada × 0,1; cobertura de stock y preferencias restan × 0,15. No son porcentajes nutricionales. Los límites de ración nunca se relajan para mejorar una puntuación. El paquete 5 presenta diferencias y alternativas en la nueva revisión local.

## Previsión de despensa

Para una fecha futura, se consideran únicamente comidas pendientes del ciclo actual desde `asOf` hasta el día anterior al nuevo inicio, dentro de los 21 días del ciclo actual. Las anteriores a `asOf` y las completadas se excluyen; no se descuenta otra vez lo ya registrado. Los snapshots completados del mismo día se pasan como cantidades fijas al ajustar las comidas aún pendientes.

La proyección utiliza las conversiones de receta a inventario existentes y nunca baja de cero. Puede incorporar la actividad **ya registrada** en `asOf`; los días posteriores y el nuevo ciclo se calculan sin sesiones previstas. Si el inicio es hoy o anterior, no se descuenta consumo futuro de un saldo que ya representa el presente. Sin ciclo actual o con despensa vacía se puede generar igualmente.

No se crean compras, consumos, faltantes ni movimientos de previsión. Esta copia orienta selección y comparación; no garantiza una compra exacta ni presupone que la despensa esté completa.

## Compatibilidad y comprobaciones

Al cerrar este paquete el estado permanecía en v11 (el paquete 4 introduce v12), con migraciones locales v5-v11. Los catálogos permanecen en 0.10.0 sin cambios de alimentos, recetas, cantidades, unidades ni nutrición. Las propuestas siguen guardando exclusivamente el contrato anterior: fecha, menús, bloqueos, versión de catálogo, foco de recuperación y marcas de generación/confirmación. Los análisis son temporales y no crean columnas ni una copia JSON del estado en Supabase.

- **127 pruebas correctas**, frente a las 105 iniciales. Incluyen la entrada común sin historial y en renovación, tres candidatos, azar reproducible, favoritas, exclusiones, límites con inicios distintos de lunes, tiempos desconocidos, imposibilidad, bloqueos contradictorios y renovación obligada.
- Cuatro objetivos con catálogo real, raciones prácticas, límites de tiempo, continuidad y conversiones; se conservan las pruebas anteriores de inventario, compra, reversos, snapshots y persistencia.
- Proyección comprobada con fechas límite, comidas completadas, actividad real de referencia, cero actividad futura, despensa vacía/parcial y datos inválidos. La selección recibe el saldo proyectado, no el que ya se necesitará antes del inicio.
- Adaptador y handlers reales de `main.js`: fechas conservadas, contrato de plan sin análisis añadidos, rechazo de perfil sin confirmar y tratamiento localizado de errores sin guardar una propuesta rota.
- Navegador por HTTP: ocho ciclos sintéticos con catálogo real —primer ciclo y renovación para cada objetivo—, 105 comidas por ciclo, tres candidatos y una elección manual excluida conservada sin propagación automática. Sin Auth, almacenamiento personal ni escrituras remotas. Página, pestaña y servidor temporales retirados al finalizar.

No se acredita validación de Supabase, RLS, navegación autenticada publicada ni dispositivos físicos. El siguiente paquete es **persistencia Supabase y compatibilidad**: borradores, preferencias, conciliación, inicialización y validación transaccional del primer plan.
