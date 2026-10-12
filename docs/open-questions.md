# Preguntas abiertas

Esta lista contiene puntos que aún no se deben tratar como requisitos aceptados. Al decidir uno, actualizar el documento correspondiente y añadir o actualizar un registro en `docs/decisions/`.

El esquema JSON, la carga de catálogos, la propuesta del planificador, Auth y el sincronizador relacional están implementados. Las siete migraciones están aplicadas en Supabase. Las mejoras UX de prioridad alta están en `dev`; las mejoras de prioridad media y baja de compra, navegación y guardado están implementadas en `chore/ux-mobile-shopping`, pendientes de publicación y validación en teléfono. Las tablas de sesiones y snapshots están aplicadas; su retención es indefinida y se vigilará el tamaño.

## Catálogo y recetas

- ¿Qué fuente nutricional se usará como referencia prioritaria para revisar todo el catálogo: etiquetas de productos concretos, tablas públicas u otra fuente? La ampliación 0.2.0 incorpora referencias genéricas de USDA FoodData Central, sin convertir esa selección inicial en una decisión global.
- En la implementación inicial, “no usada” significa que la receta no aparece en el menú activo; no significa que se haya añadido recientemente al catálogo.
- ¿Cuántas recetas no usadas en el menú activo se esperan por ciclo, si hay un mínimo? Hoy solo se favorecen, sin imponer un mínimo.
- ¿Se pretende evitar cualquier repetición en una semana o basta con evitar repeticiones cercanas? No hay distancias ni límites numéricos acordados.
- ¿Qué etiquetas adicionales ayudan a filtrar recetas (estilo, proteína principal, técnicas, tiempo, coste)? Añadir solo las que se usarán.

## Gustos, restricciones y varias personas

- ¿Qué escala de gustos se quiere usar y dónde se recogen las valoraciones?
- ¿Cómo distinguir “no me gusta” de “no consumir nunca” y de alergia/intolerancia? La propuesta de filtrado estricto no está aceptada como especificación médica.
- Si se comparte un menú, ¿debe ser aceptable para todos o se permiten comidas distintas? ¿Cómo combinar preferencias y raciones?
- ¿Qué debe hacer el planificador cuando las restricciones dejan muy pocas recetas: pedir ampliar preferencias, sugerir nuevas recetas o ambas?

## Planificador

- Tras varias semanas, ¿conviene mostrar un resumen de la actividad registrada para que la persona revise manualmente su nivel de movimiento habitual? No se ajustará el perfil ni se predecirán sesiones automáticamente.
- ¿Qué tolerancias nutricionales y de variedad se consideran “pequeñas” o “cercanas”?
- ¿Cómo debería comportarse un menú bloqueado si cambia el perfil o una receta conserva el ID pero cambia de contenido en una nueva versión del catálogo?

## Persistencia e integración

- Publicar el HTML actualizado para activar la guía de primera visita, la elección explicada ante conflictos y el bloqueo de registro anticipado; completar después la primera importación local v8 a Supabase.
- Ejecutar una prueba de aislamiento RLS con dos cuentas autenticadas; comprobar lecturas, altas y referencias entre filas de propietarios distintos.
- Verificar en GitHub Pages la sincronización entre PC y móvil, conflictos, errores de red, reversos y restauración desde una copia.
- Revisar mensualmente el tamaño total y por tabla tras activar la sincronización y después de importaciones grandes. Al acercarse a 350 MB del límite Free, analizar tendencias; no hay purga automática de snapshots.
- ¿Cómo se hará una copia externa segura si la base de datos remota queda pausada o inaccesible?
- ¿Qué navegadores y dispositivos se validarán antes de declarar lista la sincronización?

## Arquitectura front-end

El refactor incremental, las fuentes canónicas y el paquete de robustez vigente están definidos en [ADR-0013](decisions/0013-front-end-modules-and-madrid-dates.md), [ADR-0014](decisions/0014-canonical-data-sources.md) y [ADR-0015](decisions/0015-medium-priority-client-hardening.md). Sigue pendiente esta decisión de herramienta:

- ¿Vite o TypeScript resolverían una necesidad concreta en las siguientes etapas?

La [auditoría front-end y back-end](front-end-audit.md) explica los criterios para reconsiderarlas.
