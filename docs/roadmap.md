# Hoja de ruta propuesta

Esta secuencia sirve para ordenar el trabajo; no implica que las etapas estén implementadas ni que cada detalle técnico esté aprobado. Avanzar de forma incremental y mantener visible el estado real.

## Estado actual

- La app sigue siendo estática y personal; guarda el estado en `localStorage`.
- El estado local actual es v8; admite importaciones v5-v8. Las sesiones realizadas se guardan con fecha.
- Los catálogos JSON están en versión 0.5.0 (83 alimentos y 107 recetas), tienen JSON Schema y se cargan desde el HTML. Las recetas pesan frutas/verduras enteras en gramos; inventario y compras las cuentan por unidades. Recuperación ósea usa etiquetas cualitativas de alimentos para favorecer fuentes de calcio, vitamina D y vitamina C en propuestas futuras.
- La app genera, permite revisar y guardar un menú para el siguiente ciclo; el menú fijo actual permanece como ciclo inicial.
- El esquema relacional inicial de Supabase y sus políticas RLS están aplicados. La migración aditiva de sesiones está pendiente; el HTML sigue en `localStorage` y no hay integración de Auth/sincronización.
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

### D. Persistencia remota, si se mantiene como prioridad

- Esquema relacional inicial y políticas RLS: aplicados. Aplicar la migración aditiva `activity_sessions` antes de sincronizar sesiones.
- Configurar Auth, integrar Supabase en el HTML con clave publicable y migrar desde un backup v5-v8 sin duplicar movimientos.
- Comprobar PC/móvil, errores de conexión y restauración antes de afirmar que hay sincronización.

### E. Compra, inventario y robustez

- Mantener una fuente de verdad clara para saldos y movimientos.
- Revisar compras por envase, ajustes, consumos externos y reversos idempotentes.
- Revisar accesibilidad, móvil, fechas locales, exportación/importación y experiencia de recuperación.

## Criterios de aceptación a conservar

- Un ciclo contiene 105 espacios y la compra calcula solo comidas pendientes para la ventana elegida.
- La despensa suficiente elimina un artículo de la compra; una compra confirmada añade la cantidad real del envase.
- Un consumo superior al stock se registra completo, muestra déficit y se revierte una sola vez al desmarcar la comida.
- Cambiar perfil recalcula porciones futuras, no las comidas completadas.
- Registrar múltiples sesiones reales por fecha; su estimación neta solo modifica porciones pendientes de esa fecha, principalmente hidratos. No se cambian comidas completadas ni fechas futuras.
- El estado local no se presenta como sincronizado; los datos remotos no se declaran guardados hasta confirmación del servidor.
- Ningún dato personal aparece en los catálogos públicos.
