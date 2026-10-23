# ADR-0047 — Configuración inicial guiada y planificación personal

- Estado: Aceptada; implementación por paquetes en curso.
- Fecha: 2026-10-22
- Alcance: primera visita, perfil, preferencias, generación y revisión de menús, persistencia personal.
- Desarrollo y aceptación: [plan integrado](../planner/implementation-plan.md).

## Contexto

Menuki debe permitir empezar con pocos datos y reducir decisiones cotidianas. La guía actual es opcional y la primera sincronización puede guardar un perfil de ejemplo y un ciclo fijo antes de que la persona revise sus datos. El generador posterior favorece familiaridad, pero todavía no recoge preferencias personales ni límites de tiempo.

El propietario acepta las cinco decisiones de evolución del planificador y el recorrido inicial de cuatro pasos. Esta decisión registra el acuerdo; el estado de implementación se detalla al final y no acredita por sí misma migraciones, publicación ni validación remota.

## Decisión

1. Utilizar el mismo generador para el primer ciclo y los siguientes. Para confirmar el primer plan se requieren perfil válido confirmado y fecha de inicio; los datos personales de ejemplo no se consideran un perfil registrado.
2. Ofrecer una pantalla de configuración inicial con cuatro pasos: **Sobre ti**, **Tu objetivo y tu día a día**, **Tus preferencias** y **Tu primer menú**. Los dos primeros recogen el perfil necesario; las preferencias se pueden omitir. El último permite elegir fecha, revisar recetas y confirmar el plan. El progreso se guarda por cuenta y se puede retomar desde otro dispositivo.
3. Guardar preferencias explícitas por receta: normal, favorita y **No proponer**. Favorita favorece la selección; No proponer excluye de la selección automática, pero permite una elección manual consciente. Registrar una comida no cuenta como valoración. Las preferencias no sustituyen silenciosamente menús ya confirmados.
4. Permitir máximos de tiempo opcionales y separados para comida y cena entre semana. Si no quedan alternativas automáticas compatibles, explicar qué condición impide completar la propuesta y permitir revisarla; no relajarla en silencio ni bloquear toda la aplicación.
5. Revisar una semana cada vez. En la edición de la semana base, cambiar un plato se aplica por defecto a las tres semanas, con opción **Solo esta comida**. Los bloqueos previos de otras posiciones se conservan; las excepciones quedan visibles. Regenerar mantiene todos los bloqueos.
6. Priorizar raciones prácticas y aproximarse al objetivo de kcal y macronutrientes. No forzar cantidades para cerrar una cifra exacta. No se acepta aquí una tolerancia numérica nueva ni una garantía clínica; los límites y la evaluación deberán revisarse y probarse durante la implementación.
7. Tratar la despensa como información opcional e incompleta. No exigir rellenarla durante la primera visita ni impedir generar o registrar comidas por falta de stock. Conservar consumo completo, descuento limitado al saldo disponible, reversos idempotentes y ausencia de faltantes históricos. Compra sigue siendo una propuesta basada en las existencias anotadas y en comidas pendientes.

## Consecuencias

- Se conserva la base de ADR-0046: 21 días, cinco comidas, semana familiar repetida, repertorio reducido y renovación gradual de 2–3 preparaciones cuando encajen. La nueva edición de la semana base sustituirá su regla de cambio exclusivamente individual cuando se implemente.
- La configuración obligatoria sustituirá el arranque de cuentas nuevas descrito en ADR-0011 y ADR-0025. La guía informativa seguirá disponible a demanda. Cerrar la guía no equivale a completar la configuración.
- Crear cuenta, confirmar perfil y confirmar primer plan son estados distintos. La existencia de una sesión Auth, datos locales o `state_initialized_at` no demuestra que el perfil esté completo.
- Los borradores incompletos y las preferencias son datos personales privados con RLS. Se amplía la sincronización transaccional e idempotente mediante `sync_menuki_state`; no se guarda el estado completo como una columna JSON.
- Los usuarios existentes conservan sus menús, snapshots e historial. Un ciclo terminado activa la renovación, no repite la configuración inicial. Los perfiles antiguos pendientes de revisión requieren una transición explícita sin borrar ciclos.
- Se mantienen las fórmulas de objetivos actuales, la actividad real limitada a su fecha, los IDs del catálogo y las reglas de unidades. La previsión de stock para generar un ciclo futuro no escribe movimientos.
- Quedan fuera de esta entrega alergias, exclusiones de ingredientes, varias personas, precios, caducidades, sobras y cocina por lotes. Las preferencias de receta no se presentarán como un filtro de alergias.

## Avance de implementación y pendientes

El 22/10/2026 se implementó y probó localmente el [paquete 1](../planner/package-1-foundations.md): perfil extraído con compatibilidad, borradores y progreso de configuración, y preferencias con cambios parciales explícitos. Los nuevos modelos todavía no activan el recorrido ni preferencias en la aplicación. El estado sigue en v11, sin SQL ni publicación.

El [paquete 2](../planner/package-2-practical-portions.md) incorpora límites y redondeos por alimento al catálogo 0.10.0 y a las raciones pendientes, conservando fórmulas, cantidades base y comidas registradas. Incluye evaluación con diferencias respecto al objetivo, pruebas locales y comprobación sintética por HTTP; no añade SQL ni publicación.

El 23/10/2026 se implementó y probó localmente el [paquete 3](../planner/package-3-common-generator.md): entrada común, preferencias y tiempos en dominio, tres candidatos y previsión de despensa. La renovación lo utiliza; el nuevo primer acceso y las pantallas/guardado de preferencias aún no se activan. Se exige perfil confirmado en el cliente, con validación del servidor pendiente del paquete 4. No añade SQL ni cambia el contrato persistido v11.

El 23/10/2026 el [paquete 4](../planner/package-4-persistence.md) prepara estado v12, borradores y preferencias relacionales, conciliación, capacidades y definiciones completas de RPC con validación del servidor. Se ha probado en PostgreSQL local. El propietario confirma el 23/10/2026 que ejecutó la migración en Supabase con Success y los siete diagnósticos estructurales en true. Esta es su confirmación, no una inspección remota independiente; la validación funcional con sesiones reales sigue pendiente. La renovación recibe preferencias guardadas, pero los controles siguen pendientes.

Quedan los paquetes 5-7 del [plan integrado](../planner/implementation-plan.md). El siguiente añade controles de preferencias y revisión semanal; el recorrido guiado se activa en el 6 y la integración alojada/publicación se verifica en el 7. No quedan decisiones de producto bloqueantes para continuar dentro del alcance aceptado.
