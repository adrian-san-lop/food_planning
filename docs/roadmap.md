# Hoja de ruta propuesta

Esta secuencia sirve para ordenar el trabajo; no implica que las etapas estén implementadas ni que cada detalle técnico esté aprobado. Avanzar de forma incremental y mantener visible el estado real.

## Estado actual

- La app se publica como sitio estático. Los datos personales se mantienen por cuenta y `localStorage` conserva una copia de trabajo; el buzón compartido de propuestas se guarda aparte en tablas relacionales de Supabase.
- El estado local actual es v10; las instalaciones existentes migran estados locales v5-v10. Las sesiones realizadas se guardan con fecha y no hay restauración personal desde archivo.
- Los catálogos JSON están en versión 0.9.1 (90 alimentos, 112 recetas y 543 referencias de ingredientes), tienen JSON Schema y se cargan desde los módulos de la app. La primera exportación de propuestas añadió dos alimentos y cuatro recetas revisadas; la actualización 0.8.0 incorpora Ensalada templada de gulas y cinco alimentos nuevos. Las recetas de fruta entera usan unidades; el pan de molde usa hasta dos rebanadas enteras por comida y se convierte a gramos para despensa/compra; las verduras cocinadas siguen en gramos de receta. Recuperación ósea usa etiquetas cualitativas de alimentos para favorecer fuentes de calcio, vitamina D y vitamina C en propuestas futuras. Las recetas no usan fotografías de platos.
- La app genera, permite revisar y guardar un menú para el siguiente ciclo; el menú fijo actual permanece como ciclo inicial.
- El esquema remoto tiene catorce tablas personales con RLS; el propietario confirma que la migración de faltantes devolvió `success` en Supabase SQL Editor el 17/10/2026. No se ha verificado independientemente el esquema remoto. La corrección HTTP 409 está aplicada y resuelta según confirmación del administrador comunicada el 17/10/2026. El propietario informa que las migraciones del buzón y mantenimiento admin y la asignación del rol están aplicadas, y que el borrado individual funciona. La exportación JSON está implementada en el repositorio; queda validar el recorrido completo publicado con una cuenta admin y otra normal. Los snapshots tienen retención indefinida y no se purgan automáticamente; revisar el crecimiento global y por tabla al añadir usuarios y alrededor de 350 MB.
- Las sesiones reales ajustan las comidas pendientes de su misma fecha; días futuros mantienen el objetivo base y las comidas registradas conservan sus cantidades.

## Etapas candidatas

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
- Aplicar las reglas aceptadas con heurísticas iniciales; añadir preferencias personales solo después de decidir su modelo.
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
- Al completar una receta que supera el stock, se descuenta solo lo disponible y el faltante queda separado; al desmarcar, se devuelve solo lo descontado.
- Cambiar perfil recalcula porciones futuras, no las comidas completadas.
- Registrar múltiples sesiones reales por fecha; su estimación neta solo modifica porciones pendientes de esa fecha, principalmente hidratos. No se cambian comidas completadas ni fechas futuras.
- El estado local no se presenta como sincronizado; los datos remotos no se declaran guardados hasta confirmación del servidor.
- Ningún dato personal aparece en los catálogos públicos.
