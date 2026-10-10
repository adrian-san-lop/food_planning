# Hoja de ruta propuesta

Esta secuencia sirve para ordenar el trabajo; no implica que las etapas estén implementadas ni que cada detalle técnico esté aprobado. Avanzar de forma incremental y mantener visible el estado real.

## Estado actual

- La app sigue siendo un HTML funcional con menú fijo y estado en `localStorage`.
- Existe la estructura documental y hay borradores de catálogos JSON, todavía no consumidos por la app.
- No se ha ejecutado SQL ni se ha conectado autenticación o persistencia Supabase.

## Etapas candidatas

### A. Cerrar el diseño de catálogos y planificación

- Revisar campos y unidades de `foods.json` y `recipes.json`; validar IDs, referencias y nutrición.
- Registrar decisiones y resolver las preguntas que cambian el comportamiento del planificador.
- Ampliar recetas con alternativas útiles según preferencias reales; evitar añadir volumen sin propósito.

### B. Conectar los catálogos

- Cargar JSON desde la ubicación publicada en GitHub Pages.
- Mostrar un error recuperable si falta un fichero o su estructura no es válida.
- Mantener el menú actual o un mecanismo de transición hasta que la generación dinámica esté lista.

### C. Implementar la propuesta de ciclo

- Generar 21 días y cinco espacios diarios a partir de recetas compatibles.
- Aplicar las reglas aceptadas; añadir preferencias personales solo después de decidir su modelo.
- Permitir revisar, cambiar y bloquear platos; guardar versión de catálogo y conservar snapshots de consumo.

### D. Persistencia remota, si se mantiene como prioridad

- Validar esquema relacional, autenticación, políticas RLS y límites gratuitos vigentes.
- Integrar Supabase con configuración publicable y migrar desde un backup v5/v6 sin duplicar movimientos.
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
- Días de fuerza son configurables sin imponer días fijos de la semana.
- El estado local no se presenta como sincronizado; los datos remotos no se declaran guardados hasta confirmación del servidor.
- Ningún dato personal aparece en los catálogos públicos.
