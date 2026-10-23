# Plan integrado: primera visita y generación personal de menús

- Fecha: 22/10/2026.
- Estado (23/10/2026): **Aceptado; paquetes 1–4 incorporados a `dev` y paquete 5 implementado y probado localmente.** El propietario confirma que aplicó la migración del 4 en Supabase el 23/10/2026, con Success y las siete comprobaciones estructurales en true. El [paquete 5](package-5-preferences-and-weekly-review.md) incorpora preferencias visibles y revisión semanal sin SQL nuevo. Siguen pendientes el recorrido guiado (6), la validación funcional con sesiones reales y la publicación autorizada (7). Este plan distingue el resultado previsto de lo ya disponible.
- Decisión: [ADR-0047](../decisions/0047-guided-first-use-and-personalized-planning.md).
- Comportamiento actualmente implementado: [especificación](specification.md), [ADR-0046](../decisions/0046-familiar-weekly-menu.md) y [arquitectura](../architecture.md).

## Resultado esperado

Una persona crea su cuenta, completa los datos imprescindibles, puede omitir preferencias y obtiene un primer menú revisable. En los ciclos siguientes Menuki conserva una rutina familiar, incorpora novedades gradualmente y respeta las preferencias explícitas. El uso cotidiano no exige pesar todo ni mantener una despensa exhaustiva.

Se mantiene el contrato de 21 días y cinco comidas diarias: 105 posiciones. Una semana base se repite tres veces y admite excepciones manuales. Los objetivos nutricionales siguen siendo estimaciones y la despensa una ayuda basada en lo que se ha anotado.

## Punto de partida comprobado en el código

- `js/main.js` coordina Auth, primer arranque y revisión. `emptyState()` incluye valores de ejemplo y el arranque de una cuenta sin inicializar puede sincronizarlos junto al menú fijo.
- Ya existe `profiles.profile_confirmed`, pero la guía de ADR-0025 es opcional y no guarda progreso de configuración.
- Desde el paquete 3, `js/domain/menu-planner.js` coordina la generación común y compara tres candidatos; `menu-generator.js` conserva familiaridad y bloqueos. La renovación recibe una despensa prevista a la fecha de inicio, calculada desde el saldo actual y las comidas pendientes anteriores.
- `js/domain/nutrition.js` calcula objetivos y adapta cantidades. El paquete 5 extrae la revisión a `js/ui/planner-review.js`: muestra una semana cada vez y permite cambiar tres semanas o una posición, respetando los demás bloqueos.
- Supabase guarda el estado personal en tablas relacionales mediante `sync_menuki_state` y `sync_revision`; `localStorage` es la copia de trabajo. Estado local vigente: v12; se conservan las migraciones v5-v11 y se añaden los campos nuevos.

## 1. Recorrido de primera visita

La configuración será una vista dedicada después de Auth, con marca, progreso **Paso N de 4**, Anterior y Continuar. En móvil mantendrá campos y acciones accesibles con desplazamiento natural. Los datos personales usarán campos vacíos y ayudas de formato, no valores de ejemplo preseleccionados como si fueran reales.

| Paso | Contenido | Condición para continuar |
| --- | --- | --- |
| 1. Sobre ti | Edad, altura, peso y opción de cálculo del gasto en reposo, conservando la alternativa manual. | Validar los campos necesarios según el modo elegido. Guardar borrador al avanzar. |
| 2. Tu objetivo y tu día a día | Cuatro objetivos y seis niveles de movimiento con sus descripciones. Ayuda de recuperación ósea según la función vigente. | Elección consciente y confirmación del perfil válido. Las sesiones de ejercicio se registrarán después de ocurrir. |
| 3. Tus preferencias | Máximos opcionales de tiempo para comida y cena entre semana. Explicar cómo marcar Favorita y No proponer después. | Se puede elegir **Configurar más adelante**. No exigir recorrer el catálogo. |
| 4. Tu primer menú | Fecha de inicio, hoy por defecto; semana propuesta, ficha de receta y sustituciones. | **Empezar mi plan** confirma el ciclo para la fecha elegida. Una propuesta sin confirmar sigue siendo borrador. |

La despensa no forma parte de los requisitos de inicio. Al terminar se explica brevemente que puede completarse cuando se quiera. La guía existente queda como ayuda opcional; no habrá otro recorrido obligatorio de botones después de la configuración.

### Reanudación y cuentas existentes

- Cuenta con perfil incompleto: retomar los pasos pendientes, preservando lo ya escrito y confirmado remotamente.
- Perfil confirmado sin primer plan: continuar con preferencias o revisión del menú, sin repetir los datos básicos.
- Perfil y primer plan confirmados: abrir Inicio, también al cambiar de navegador o dispositivo.
- Ciclo terminado: renovar el menú; no volver a registrar el perfil.
- Cuentas existentes: conservar datos y menús. Si el perfil aún no fue revisado, pedir su confirmación antes de nuevas propuestas personales, sin descartar el plan previo ni su historial.

Un número de paso puede orientar la interfaz, pero no sustituye la validación del perfil ni el estado confirmado del ciclo. `profile_confirmed`, inicialización de sincronización y configuración inicial no son el mismo concepto.

## 2. Preferencias y generación común

- Usar una entrada común al generador con fecha de inicio explícita, perfil confirmado, preferencias, ciclo anterior opcional, bloqueos y previsión de stock. No instalar automáticamente el menú fijo para una cuenta nueva.
- Normal será la preferencia implícita. Favorita aumenta la prioridad sin obligar a aparecer. No proponer excluye únicamente la selección automática; la persona puede escogerla y bloquearla manualmente. No inferir gustos por comidas registradas.
- Los límites de tiempo de comida y cena entre semana son opcionales. Se basan en el tiempo del catálogo; no inventar tiempos ni presentar un tiempo desconocido como cumplimiento del límite.
- Las elecciones manuales bloqueadas se conservan. Si una elección manual rebasa un límite de tiempo o está marcada No proponer, explicar la excepción; no cambiarla al regenerar.
- Si las condiciones dejan una posición sin alternativas automáticas, mantener la propuesta revisable e indicar el problema. No confirmar un ciclo incompleto ni relajar condiciones silenciosamente.
- Conservar el repertorio orientativo 3/2/4/2/4 y las 2–3 nuevas preparaciones por ciclo previo válido, o menos si no encajan. No cambiar en esta entrega la definición de familia por conjunto de ingredientes de ADR-0046.
- Cambiar preferencias no reemplaza automáticamente ciclos activos, confirmados ni borradores. La revisión debe indicar cuándo hace falta regenerar para aplicar ajustes nuevos.

## 3. Raciones, evaluación semanal y despensa

- Mantener las fórmulas actuales de reposo, factores de movimiento, objetivos y macronutrientes. La sesión realizada se añade solo a su fecha y las cantidades completadas permanecen fijas.
- Definir límites de ración y pasos de redondeo por alimento o ingrediente de receta donde sean necesarios, conservando IDs, unidades y todos los ingredientes cuantificados. Las nuevas reglas genéricas deben quedar validadas en los catálogos y sus esquemas.
- Conservar fruta por piezas con medias piezas permitidas, pan de molde en rebanadas enteras y máximo dos por comida, conversiones a despensa, huevos en unidades y líquidos en mililitros.
- Comparar varias semanas candidatas usando las cantidades reales que produciría el servicio nutricional. Evaluar ajuste del día, distribución práctica de comidas, repetición y tiempo de preparación. Los parámetros concretos se justificarán con casos de prueba; no se aprueba un porcentaje nutricional nuevo en este plan.
- No deformar una receta para alcanzar exactamente las kcal. Mostrar la diferencia estimada respecto al objetivo cuando sea relevante y ofrecer alternativas si no se logra una propuesta adecuada con los límites existentes.
- Para un ciclo futuro, calcular existencias previstas a su inicio sobre una copia del saldo y las comidas pendientes anteriores. Esta previsión orienta la selección y no crea movimientos ni requiere prever ejercicio.
- Generar y registrar comidas también con despensa vacía o incompleta. Completar significa que se pudo preparar: conservar el consumo entero, descontar solo lo anotado hasta cero y no guardar faltantes.
- La compra propone cantidades para comidas pendientes según el stock registrado; el usuario puede desmarcar lo que ya tenga sin anotarlo previamente en Despensa. No reponer automáticamente supuestas carencias de comidas pasadas.

## 4. Interfaz del planificador y del recetario

- En Mi perfil, añadir acceso compacto **Preferencias del menú** a un diálogo; conservar la distribución responsive del perfil.
- En las fichas, permitir Favorita y No proponer, con posibilidad de volver a Normal. Mantener Ver receta desde la propuesta y el retorno con foco y desplazamiento conservados.
- Mostrar una semana a la vez y permitir consultar las otras dos. El almacenamiento sigue conteniendo 105 posiciones independientes.
- En la edición de la semana base, aplicar el cambio a las tres semanas por defecto y ofrecer **Solo esta comida**. Conservar bloqueos previos de otras posiciones y mostrar las excepciones. Las posiciones cambiadas explícitamente quedan bloqueadas.
- Ofrecer unas pocas alternativas compatibles y acceso al catálogo completo del tipo, mostrando qué elecciones son manuales. El número y presentación concretos se ajustarán durante la revisión de interfaz.
- Explicar la propuesta en términos cotidianos —platos habituales, tiempo, ingredientes compartidos— sin exponer puntuaciones internas ni prometer compra exacta o ajuste nutricional perfecto.

## 5. Persistencia y separación del código

### Supabase y copia de trabajo

Crear cuenta Auth no debe exigir una fila de perfil completa ni crear un ciclo de ejemplo. Los campos incompletos se guardarán como borrador privado con columnas tipadas. La forma final del borrador se concretará antes de preparar SQL; no se relajarán las validaciones del perfil confirmado para aceptar datos inventados.

Guardar preferencias por receta y ajustes personales en tablas relacionales vinculadas a `auth.uid()`. No escribir preferencias en los catálogos ni almacenar el estado personal completo como JSON. Ampliar `sync_menuki_state` para borradores, preferencias y confirmación inicial manteniendo transacciones, idempotencia y control de revisión.

Adaptar conjuntamente inicialización, lecturas, mapeo, normalización y conciliación: actualmente esperan un perfil completo. Las omisiones de un cliente antiguo no deben borrar preferencias nuevas. El backend validará el perfil antes de aceptar un primer plan confirmado en el flujo nuevo. Guardar, desmarcar y borrar preferencias deberán conciliarse entre dispositivos.

Conservar las migraciones locales v5-v11. Si cambia el contrato persistido, añadir la siguiente versión y su migración, sin reintroducir v1-v4 ni restauración JSON. Guardar borrador local ante fallos no equivale a guardado remoto; el estado y el reintento deben ser claros. No añadir cola offline.

### Responsabilidades

| Capa | Trabajo previsto |
| --- | --- |
| Dominio | Evolucionar `menu-generator.js` y las reglas de ración; separar validación de preferencias y estado de configuración en módulos sin DOM, almacenamiento ni Supabase. |
| Catálogos | Validar únicamente los metadatos genéricos utilizados por las reglas, conservando IDs y bases nutricionales. |
| Vistas | Extraer la revisión del planificador de `main.js` y añadir la vista guiada, siguiendo las vistas con estado inyectado existentes. |
| Persistencia | Extender mapeo relacional, normalización, transporte y conciliación, además del SQL transaccional y RLS. |
| Entrada | Mantener `menuki.html` como shell y reducir la orquestación nueva en `main.js`; reutilizar componentes y fichas actuales. |

## 6. Orden de ejecución de la primera entrega

El acuerdo queda registrado en este plan y ADR-0047. El desarrollo se divide en siete paquetes revisables:

1. **Estados y compatibilidad — implementado localmente:** separar perfil válido confirmado de borrador incompleto; definir preferencias, progreso y transición de cuentas existentes. Extraer la normalización del perfil conservando el comportamiento vigente. Los modelos nuevos no activan todavía otro arranque ni cambian el contrato persistido v11. Véase [resultado y comprobaciones](package-1-foundations.md).
2. **Raciones prácticas — implementado localmente:** límites y pasos por alimento en catálogo 0.10.0, validación y evaluación común de cantidades/totales/diferencias. Nutrición, compra y despensa usan las mismas cantidades. Se conservan fórmulas, bases y consumos ya registrados. Véase [resultado y comprobaciones](package-2-practical-portions.md).
3. **Generador común — incorporado a dev:** entrada con perfil confirmado y fecha explícita, preferencias, tiempos, comparación de tres candidatos y previsión de despensa. La renovación ya lo usa; el primer menú queda preparado para el nuevo recorrido. Se conservan familiaridad, raciones y bloqueos; persistencia e interfaz se incorporan en los paquetes 4 y 5. Véase [resultado y comprobaciones](package-3-common-generator.md).
4. **Persistencia Supabase y compatibilidad — implementado y probado localmente; SQL aplicado según el propietario:** migración aditiva aplicada, RPC completos, mapeo, estado v12, conciliación, capacidades e inicialización compatibles. Se valida perfil y confirmación del plan en el servidor. El propietario confirma ejecución del SQL con Success y los siete diagnósticos en true el 23/10/2026; quedan las pruebas funcionales alojadas, sin inspección remota independiente del agente; véase [resultado del paquete 4](package-4-persistence.md).
5. **Preferencias y revisión semanal — implementado y probado localmente:** revisión extraída de `main.js`, preferencias en perfil y fichas, alternativas consultables y cambios a tres semanas o una comida conservando bloqueos. Incluye 162 pruebas Node y recorridos sintéticos por HTTP con revisión visual de escritorio, tablet y móvil; sin SQL nuevo ni publicación. Véase [resultado y límites](package-5-preferences-and-weekly-review.md).
6. **Configuración inicial guiada — siguiente paquete:** conectar los cuatro pasos, el guardado y reanudación y el primer menú revisable, utilizando los modelos, motor y persistencia anteriores. Conservar el acceso y los datos de las cuentas existentes.
7. **Integración real y publicación:** la migración del paquete 4 y sus siete comprobaciones estructurales están confirmadas por el propietario el 23/10/2026; verificar las capacidades que necesite el cliente y cualquier migración adicional antes de activarlo; probar cuentas, RLS y dispositivos; publicar cuando el propietario lo autorice. No considerar aplicada una migración porque su archivo esté en Git.

La activación debe contemplar clientes anteriores y capacidades del esquema. Un componente pendiente no debe provocar una caída de toda la cuenta como ocurrió con dependencias de tablas nuevas; limitar el mensaje y el bloqueo al flujo que necesite esa capacidad.

## 7. Criterios de aceptación

- Cuenta nueva: no guardar perfil personal de ejemplo ni confirmar menú antes de validar el perfil. No basta con ocultar botones en el front.
- Cuatro pasos con validación, Anterior, preferencias omitibles y reanudación tras recarga y en otro dispositivo desde el último progreso remoto confirmado.
- Despensa, pesos de seguimiento y sesiones no son requisitos de inicio. No exigir marcar favoritos para generar.
- Un solo ciclo ante reintentos o doble pulsación de Empezar mi plan; fecha elegida, 105 comidas compatibles y restricciones de registro futuro conservadas.
- Mismo motor para primer ciclo y renovación; cambios de menú explícitos; no alterar consumos registrados.
- Preferencias y tiempo respetados en selecciones automáticas; mensaje útil si no hay candidatos; cambios manuales y bloqueos conservados como excepciones explícitas.
- Semana base repetida; cambio por defecto en tres semanas sin pisar bloqueos; Solo esta comida afecta una posición; regeneración conserva todos los bloqueos.
- Raciones con unidades y límites vigentes; objetivos aproximados sin cantidades forzadas; ejercicio limitado a su fecha y comidas pendientes.
- Inventario nunca negativo, compra sin faltantes históricos y sin movimientos al generar o prever; caso de despensa vacía incluido.
- Pruebas de los cuatro objetivos y distintos perfiles, límites de tiempo, preferencias escasas, muchos bloqueos, errores de conexión y compatibilidad de estados antiguos.
- RLS y escritura vinculada a la sesión comprobadas con dos cuentas; preferencias, progreso y primer plan recuperables entre dispositivos. Separar pruebas locales, confirmación de SQL, validación remota y publicación en el registro de resultados.

## Fuera de esta primera entrega

Aprovechar formatos de compra para elegir combinaciones será una evolución posterior. Precios, caducidades, sobras y cocina por lotes requieren decisiones y datos adicionales. También quedan fuera alergias, exclusiones de ingredientes, sustitución automática de ingredientes y menús de varias personas. La app no necesita aprender gustos a partir del historial para aplicar las preferencias explícitas aceptadas.
