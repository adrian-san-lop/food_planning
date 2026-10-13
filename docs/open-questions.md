# Preguntas abiertas

Esta lista contiene puntos que aún no se deben tratar como requisitos aceptados. Al decidir uno, actualizar el documento correspondiente y añadir o actualizar un registro en `docs/decisions/`.

El esquema JSON, la carga de catálogos, la propuesta del planificador, Auth y el sincronizador relacional están implementados. Las siete migraciones iniciales están aplicadas. El propietario informa que la novena (`20261013160000_recipe_proposal_inbox.sql`) y la asignación admin ya se ejecutaron en Supabase; la octava (`20261013120000_menuki_sync_conflict_http_409.sql`) sigue pendiente. La interfaz del buzón incluye exportación, edición y borrado individual; la nueva migración `20261013170000_recipe_proposal_admin_maintenance.sql` está en el repositorio local de `dev`, pero falta aplicarla y publicar. Después deben validarse los permisos con cuenta normal y admin. Las tablas de sesiones y snapshots están aplicadas; su retención es indefinida y se vigilará el tamaño.

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

- Publicar la app actualizada y comprobar la primera importación local v8 a Supabase, la conciliación de cambios independientes, el desempate de cambios simultáneos y la propagación del borrado de sesiones entre PC y móvil.
- Ejecutar una prueba de aislamiento RLS con dos cuentas autenticadas; comprobar lecturas, altas y referencias entre filas de propietarios distintos.
- Aplicar la octava migración pendiente desde SQL Editor. La novena y la asignación admin ya se ejecutaron según el propietario.
- Aplicar `20261013170000_recipe_proposal_admin_maintenance.sql` después de verificar la novena; publicar y validar con cuenta normal y admin el formulario, aislamiento del buzón, edición y borrado individual, descarga conforme al esquema JSON v1, protección contra operaciones obsoletas y limpieza global en cascada.
- Verificar en GitHub Pages la sincronización automática entre PC y móvil, errores de red, reversos, borrado de sesiones y restauración desde una copia confirmada.
- Revisar mensualmente el tamaño total y por tabla tras activar la sincronización y después de importaciones grandes. Al acercarse a 350 MB del límite Free, analizar tendencias; no hay purga automática de snapshots.
- ¿Cómo se hará una copia externa segura si la base de datos remota queda pausada o inaccesible?
- ¿Qué navegadores y dispositivos se validarán antes de declarar lista la sincronización?

## Arquitectura front-end

El refactor incremental, las fuentes canónicas y el paquete de robustez vigente están definidos en [ADR-0013](decisions/0013-front-end-modules-and-madrid-dates.md), [ADR-0014](decisions/0014-canonical-data-sources.md) y [ADR-0015](decisions/0015-medium-priority-client-hardening.md). Sigue pendiente esta decisión de herramienta:

- ¿Vite o TypeScript resolverían una necesidad concreta en las siguientes etapas?

La [auditoría front-end y back-end](front-end-audit.md) explica los criterios para reconsiderarlas.
