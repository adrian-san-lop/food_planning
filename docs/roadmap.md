# Hoja de ruta propuesta

Esta secuencia distingue la próxima entrega aceptada de otras etapas candidatas. Una decisión aprobada no implica que esté implementada. Avanzar de forma incremental y mantener visible el estado real.

## Estado actual

- La app se publica como sitio estático. Los datos personales se mantienen por cuenta y `localStorage` conserva una copia de trabajo; el buzón compartido de propuestas se guarda aparte en tablas relacionales de Supabase.
- El estado local actual es v12; las instalaciones existentes conservan las migraciones v5-v11 y añaden los campos de planificación v12. Las sesiones realizadas se guardan con fecha y no hay restauración personal desde archivo.
- Los catálogos JSON están en versión 0.10.0 (90 alimentos, 112 recetas y 543 referencias de ingredientes), tienen JSON Schema y se cargan desde los módulos de la app. La versión 0.10.0 añade límites y redondeos por alimento, sin modificar nutrición ni cantidades base. La revisión 0.9.3 aplica huevo L y descripciones de tres familias de ingredientes; ADR-0045 fija genéricos y las medidas en crudo/escurrido/con hueso. La revisión 0.9.2 corrige cinco alimentos con referencias USDA identificadas y mejora 18 recetas; las decisiones pendientes y el impacto están en `docs/audits/catalog-quality/results/summary.md`. La primera exportación de propuestas añadió dos alimentos y cuatro recetas revisadas; la actualización 0.8.0 incorpora Ensalada templada de gulas y cinco alimentos nuevos. Las recetas de fruta entera usan unidades; el pan de molde usa hasta dos rebanadas enteras por comida y se convierte a gramos para despensa/compra; las verduras cocinadas siguen en gramos de receta. Recuperación ósea usa etiquetas cualitativas de alimentos para favorecer fuentes de calcio, vitamina D y vitamina C en propuestas futuras. Las recetas no usan fotografías de platos.
- La app genera, permite revisar y guardar un menú para el siguiente ciclo; el menú fijo actual permanece como ciclo inicial.
- El esquema remoto tiene diecisiete tablas personales con RLS según las confirmaciones del propietario, incluidas las tres del paquete 4 aplicado y comprobado estructuralmente el 23/10/2026; el propietario confirma que las migraciones de inventario no negativo y de movimiento con cantidad cero se aplicaron el 17/10/2026. El 22/10/2026 confirmó que `20261018120000_retire_meal_shortfalls.sql` está aplicada y comprobó en SQL Editor que la tabla histórica quedó vacía, el disparador descarta escrituras antiguas y `authenticated` no tiene permisos directos de inserción, actualización o borrado. La tabla se conserva por compatibilidad. La corrección HTTP 409 está aplicada y resuelta según confirmación del administrador comunicada el 17/10/2026. El propietario informa que las migraciones del buzón y mantenimiento admin y la asignación del rol están aplicadas, y que el borrado individual funciona. La exportación JSON está implementada en el repositorio; queda validar el recorrido completo publicado con una cuenta admin y otra normal. Los snapshots tienen retención indefinida y no se purgan automáticamente; revisar el crecimiento global y por tabla al añadir usuarios y alrededor de 350 MB.
- Las sesiones reales ajustan las comidas pendientes de su misma fecha; días futuros mantienen el objetivo base y las comidas registradas conservan sus cantidades.

## Próxima entrega aprobada: configuración inicial y planificación personal

Aceptada el 22/10/2026 y **en desarrollo por paquetes**, según [ADR-0047](decisions/0047-guided-first-use-and-personalized-planning.md). El [paquete 1](planner/package-1-foundations.md) prepara los modelos de perfil, configuración y preferencias y ya está incorporado a `dev`. El [paquete 2](planner/package-2-practical-portions.md) aplica raciones prácticas y ya está incorporado a `dev`. El [paquete 3](planner/package-3-common-generator.md) está implementado localmente: renovación con motor común, preferencias y tiempos en dominio, tres candidatos y previsión de despensa. El [paquete 4](planner/package-4-persistence.md) prepara persistencia, compatibilidad y SQL, probado localmente; el propietario confirma la aplicación en Supabase el 23/10/2026 con Success y las siete comprobaciones estructurales en true. Las nuevas pantallas todavía no se activan. El [plan integrado](planner/implementation-plan.md) detalla la secuencia de siete paquetes y sus criterios; el siguiente es preferencias e interfaz de revisión semanal (paquete 5). Queda por completar:

1. Incorporar el recorrido inicial: Sobre ti → Tu objetivo y tu día a día → Tus preferencias (omitible) → Tu primer menú. Guardar el progreso por cuenta; no crear un plan con datos personales de ejemplo.
2. Conectar el primer acceso al motor común ya disponible y presentar preferencias, límites, diferencias y alternativas en la revisión; la renovación ya utiliza el motor y las raciones prácticas.
3. Validar funcionalmente con sesiones reales los borradores y preferencias; la migración del paquete 4 ya está aplicada y comprobada estructuralmente según confirmación del propietario el 23/10/2026. Mapeo y conciliación están implementados y probados localmente.
4. Actualizar perfil, fichas y revisión semanal; por defecto editar la semana base para las tres semanas, con opción individual y conservación de bloqueos.
5. Validar dominio, escritorio/móvil, SQL, RLS y recorrido real entre dispositivos. Comprobar la migración remota antes de activar el cliente dependiente y publicar solo con autorización.

Despensa completa, valoración del catálogo, pesos de seguimiento y ejercicio no son requisitos de inicio. La optimización por envases, precios, caducidades, sobras y cocina por lotes queda para etapas posteriores; alergias, exclusiones de ingredientes y varias personas siguen fuera de esta entrega.

## Etapas candidatas y antecedentes

### A. Cerrar el diseño de catálogos y planificación — primera versión completada

- Formalizar los esquemas de `foods.json` y `recipes.json` y validar IDs, unidades y referencias. Los valores nutricionales heredados y genéricos siguen siendo aproximados; su revisión frente a etiquetas concretas permanece pendiente.
- Registrar las reglas aceptadas y anotar las preguntas de gustos, restricciones y umbrales que siguen abiertas.
- Ampliar recetas con alternativas útiles según preferencias reales; evitar añadir volumen sin propósito.

### B. Conectar los catálogos — completado

- Cargar JSON desde la ubicación publicada en GitHub Pages.
- Mostrar un error con opción de reintento si falta un fichero o falla una comprobación.
- Mantener el menú actual o un mecanismo de transición hasta que la generación dinámica esté lista.

### C. Implementar la propuesta de ciclo — primera versión completada

- Generar 21 días y cinco espacios diarios a partir de recetas compatibles.
- Aplicar las reglas aceptadas con heurísticas iniciales. El paquete 3 aplica las preferencias de ADR-0047 al motor común; su persistencia está preparada en el paquete 4 (SQL y siete comprobaciones estructurales confirmados por el propietario el 23/10/2026) y sus controles siguen pendientes en el paquete 5.
- Permitir revisar, cambiar y bloquear platos; preservar bloqueos al regenerar; guardar versión de catálogo y cantidades consumidas.

### D. Persistencia remota y Auth — implementación realizada; validación pendiente

- Esquema inicial, RLS, `activity_sessions` y `meal_completion_ingredients`: aplicados. La migración de snapshots se verificó estructuralmente; la validación de aislamiento con dos cuentas sigue pendiente.
- Retención de snapshots: indefinida, sin purga automática. Revisar tamaño total y por tabla al incorporar usuarios; decidir cualquier cambio de retención solo tras analizar el uso real.
- Método de Auth aceptado en ADR-0009: correo + contraseña, registro libre y sin confirmación del correo. Auth y el cliente HTML están configurados; la migración transaccional/idempotente de sincronización está aplicada.
- Prueba de aislamiento con dos usuarios: pendiente; debe cubrir lectura, inserción y referencias cruzadas con cuentas reales.
- Verificar la versión del cliente publicado y la primera importación v8 desde el navegador con datos hacia una cuenta sin inicializar. La sincronización ya está implementada; falta documentar el recorrido integral en producción.
- Comprobar en PC/móvil la conciliación automática de cambios independientes y simultáneos, los errores de conexión, el borrado de sesiones y el reinicio total confirmado antes de declarar validada la sincronización.

### E. Compra, inventario y robustez

- Mantener una fuente de verdad clara para saldos y movimientos.
- Revisar compras por envase, ajustes, consumos externos y reversos idempotentes.
- Revisar accesibilidad, móvil, fechas locales, continuidad de datos y experiencia de recuperación.

### F. Buzón compartido de propuestas de recetas — migración aplicada según el propietario; publicación y validación pendientes

- El formulario para cuentas autenticadas recoge solo tipo, nombre, ingredientes simples y pasos; Supabase aplica los límites y guarda los datos de forma relacional e idempotente.
- La sección admin se habilita por un rol privado de Supabase. La asignación inicial se hace desde SQL Editor; no hay contraseña administrativa en el HTML.
- La revisión nutricional y la edición de `foods.json`/`recipes.json` se hacen manualmente con ayuda de IA fuera de la app. La publicación sigue el flujo Git normal.
- El propietario informa que ya aplicó las migraciones novena y décima y que el borrado individual funciona. La corrección HTTP 409 está confirmada por el administrador. Sigue pendiente aplicar o confirmar la correctiva `20261013180000_recipe_proposal_purge_where_clause.sql`; validar envío, RLS, edición/borrado individual, descarga JSON y purga global con cuentas admin y normal.
- El botón admin descarga un paquete `menuki.recipe-proposal-export` versión 1 según `docs/schemas/recipe-proposal-export.schema.json`. El chat de Codex que procese el archivo debe tener acceso al repositorio; el navegador no escribe en GitHub.
- El botón elimina todas las propuestas solo después de publicar los catálogos; el RPC confirma el recuento y elimina los registros hijos en cascada.

## Criterios de aceptación a conservar

- Un ciclo contiene 105 espacios y la compra calcula solo comidas pendientes para la ventana elegida.
- La despensa suficiente elimina un artículo de la compra; una compra confirmada añade la cantidad real del envase.
- Al completar una receta que supera el stock, se conserva el uso completo de la receta y se descuenta solo lo disponible, sin guardar un faltante; al desmarcar, se devuelve solo lo descontado.
- Cambiar perfil recalcula porciones futuras, no las comidas completadas.
- Registrar múltiples sesiones reales por fecha; su estimación neta solo modifica porciones pendientes de esa fecha, principalmente hidratos. No se cambian comidas completadas ni fechas futuras.
- El estado local no se presenta como sincronizado; los datos remotos no se declaran guardados hasta confirmación del servidor.
- Ningún dato personal aparece en los catálogos públicos.
