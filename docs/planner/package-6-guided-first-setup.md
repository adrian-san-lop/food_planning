# Paquete 6: configuración inicial guiada

- Fecha: 23/10/2026.
- Estado: **Implementado y probado localmente** en `chore/guided-first-setup`, desde `dev` limpio y coincidente con `origin/dev` en `6c1d9ec62dc1`. El paquete 5 ya estaba incorporado. Sin commit, push, publicación ni ejecución de SQL alojado.
- Alcance: [plan integrado](implementation-plan.md), paquete 6; [ADR-0047](../decisions/0047-guided-first-use-and-personalized-planning.md).

## Qué verá una cuenta nueva

Después de Auth se muestra una pantalla de configuración con marca, progreso, estado de sincronización y Cerrar sesión. La navegación habitual aparece al confirmar el primer plan.

| Paso | Qué pide | Acción |
| --- | --- | --- |
| 1. Sobre ti | Opción de ecuación o gasto en reposo manual, edad, altura y peso, inicialmente vacíos. | Continuar valida los campos; el valor manual solo es obligatorio en ese modo. |
| 2. Tu objetivo y tu día a día | Uno de cuatro objetivos y uno de seis niveles de movimiento, con sus descripciones. Recuperación ósea y ajuste de raciones conservan sus reglas. | Confirmar perfil y continuar valida y confirma los datos, sin crear un menú. |
| 3. Tus preferencias | Máximos opcionales y separados para comida y cena entre semana, inicialmente sin límite. Explica Favorita y No proponer en las fichas. | Continuar o Configurar más adelante; no requiere marcar recetas ni anotar despensa. |
| 4. Tu primer menú | Fecha de inicio, hoy por defecto; permite una fecha posterior. | Preparar mi menú o Continuar revisión abre el editor semanal. **Empezar mi plan** confirma explícitamente el ciclo. |

Anterior conserva los datos válidos. Se utilizan las validaciones del perfil y los límites vigentes, sin completar campos personales con valores de ejemplo. Los valores fuera de rango quedan visibles para corregirlos y no se envían a Supabase; otros campos válidos sí pueden guardarse. La validación de datos al confirmar no depende solo de los atributos HTML.

Los cambios válidos en campos y preferencias usan el guardado automático existente. Omitir preferencias no borra las que ya se hayan elegido. No se añade un botón de sincronización ni se declara una escritura remota aceptada antes de su confirmación: `localStorage` sigue siendo la copia de trabajo y el estado compacto indica pendiente, error o guardado confirmado.

## Primer menú y reanudación

El primer ciclo utiliza `createMenuPlanner`, igual que la renovación: perfil válido confirmado, preferencias, raciones prácticas y stock opcional. No se instala la plantilla fija para una cuenta nueva. El editor conserva fichas, alternativas, alcance de tres semanas o una comida y bloqueos del paquete 5; no permite registrar consumos desde la revisión.

Elegir o cambiar fecha no activa el ciclo. Preparar/revisar guarda un borrador completo; cerrar la ventana no lo confirma. Si se cambia explícitamente la fecha para preparar otra propuesta se conservan los bloqueos y se evalúan las condiciones para esas fechas. Los resultados con huecos siguen siendo temporales y no reemplazan el último borrador completo; Empezar mi plan queda deshabilitado.

Al confirmar se instala una única instancia activa con las 105 comidas generadas, la fecha elegida, versión del catálogo y marcas de generación/confirmación. La transición es síncrona y se protege frente a doble pulsación; los reintentos de sincronización reutilizan el identificador del mismo ciclo y sus comidas. Si dos dispositivos confirman a la vez, la conciliación existente adopta el ciclo de la revisión remota aceptada. La ventana de primera revisión se cierra si la cuenta ya ha terminado la configuración desde otro dispositivo.

El primer ciclo con fecha futura queda confirmado para esa fecha y mantiene la restricción de registro de comidas futuras. No se anticipan sesiones ni se crean movimientos de inventario al generar o confirmar. Despensa, compra e historial se conservan.

La reanudación se deriva de hechos validados:

- Datos básicos incompletos → Sobre ti; datos básicos completos sin perfil confirmado → objetivo/movimiento.
- Perfil confirmado sin plan → preferencias o menú, según si ya se revisaron u omitieron.
- Borrador completo → Continuar revisión, conservando recetas y bloqueos.
- Plan confirmado, incluso terminado o archivado → aplicación habitual; el fin del ciclo abre renovación y no repite la configuración.

Recargar recupera la copia de trabajo pendiente; otro dispositivo recupera el último progreso que haya confirmado Supabase. El paquete 7 comprueba esta recuperación y la actualización automática en dos sesiones de navegador con orígenes independientes contra Supabase real; dispositivos físicos y publicación siguen pendientes. Los números de paso no se guardan como autorización para saltarse validaciones.

## Compatibilidad y Supabase

- **Cuentas existentes:** mantienen modo `legacy`, perfil, menús, snapshots y datos. Un perfil antiguo pendiente de revisión continúa en la aplicación y debe confirmarse antes de generar nuevas propuestas. La plantilla fija queda como compatibilidad; no se convierte en el primer plan de las cuentas nuevas.
- Una copia local con datos reales previa a la primera inicialización se conserva por el mecanismo existente; una copia vacía con valores genéricos no basta para importar un perfil de ejemplo.
- **Capacidad de planificación ausente:** las cuentas antiguas siguen usando su esquema compatible. Una cuenta nueva muestra la configuración con aviso y reintento, pero no escribe un perfil inventado ni envía campos que el servidor ignoraría. Errores de conexión/permisos no se confunden con ausencia de tablas.
- Un reinicio completo ya confirmado de una cuenta guiada vuelve al recorrido vacío, mediante el RPC de reinicio existente. No se ejecutó ningún reinicio en una cuenta real en estas pruebas.
- **No hay SQL nuevo ni cambio de versión del estado v12.** Se reutilizan `profile_setup_drafts`, `menu_preferences`, `recipe_preferences` y los RPC del paquete 4. El propietario confirmó su migración con Success y siete diagnósticos en true el 23/10/2026; no hay que repetirla.
- Se mantienen RLS, `auth.uid()`, validación del perfil/confirmación del plan en servidor, transacciones, idempotencia, PT409 y conciliación. No se almacena el estado completo como JSON ni se añade cola offline.

## Responsabilidades del código

| Archivo | Responsabilidad |
| --- | --- |
| `js/domain/onboarding.js` | Progreso por hechos, confirmación estricta de perfil y transición inmutable del primer plan. |
| `js/ui/onboarding-view.js` | Formularios, progreso, instrucciones, errores y opciones de los cuatro pasos. |
| `js/ui/onboarding-controller.js` | Captura válida, navegación, reanudación y conexión con el guardado y planificador inyectados. |
| `js/ui/planner-review.js` | Revisión compartida; título y acción de primer plan sin duplicar el editor. |
| `js/main.js` | Activación para cuentas nuevas, selección de superficie, apertura del editor y conexión con Auth/sincronización existentes. |
| `menuki.html` / `assets/css/app.css` | Shell dedicado, estado de cuenta compartido y distribución responsive con desplazamiento natural. |

## Validación y límites

- **175 pruebas Node correctas**, incluidas las regresiones previas. Los casos nuevos comprueban borradores parciales, gasto manual, omisión, reanudación, capacidades, primer menú con fecha explícita usando el adaptador real, transición única, serialización con IDs estables y conciliación de confirmaciones simultáneas simuladas.
- Prueba por HTTP con shell, módulos, catálogos, normalizador local y eventos reales, en el navegador integrado y con cuentas sintéticas. Solo se sustituyó el arranque de Auth en un servidor temporal local, sin llamadas a Supabase ni datos personales del propietario.
- Comprobados datos vacíos y validación; recarga después de datos básicos, omisión de preferencias y borrador; fichas de recetas; confirmación y entrada en Inicio; nueva recarga sin repetir configuración; gasto manual obligatorio; límites de un minuto con huecos y confirmación deshabilitada; cuenta antigua y capacidad ausente.
- Revisión visual en marcos de escritorio 1366 × 768, tablet 1024 × 768 y móvil 390 × 844 / 360 × 640; contenido largo y acciones accesibles por desplazamiento. No acredita dispositivos físicos ni Firefox/Edge.
- La validación posterior del [paquete 7](package-7-integration.md) añade 14 comprobaciones Auth/PostgREST reales con dos cuentas y el recorrido en dos orígenes de navegador. Quedan publicación autorizada y dispositivos físicos. Las 175 pruebas y los recorridos anteriores describen el cierre local del paquete 6, no esa prueba alojada.
