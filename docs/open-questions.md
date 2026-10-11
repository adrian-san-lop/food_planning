# Preguntas abiertas

Esta lista contiene puntos que aún no se deben tratar como requisitos aceptados. Al decidir uno, actualizar el documento correspondiente y añadir o actualizar un registro en `docs/decisions/`.

El esquema JSON, la carga de catálogos, la propuesta del planificador y el registro local de sesiones realizadas están implementados. El HTML todavía no tiene autenticación ni sincronización. Las tablas remotas de sesiones y snapshots de comidas están aplicadas; la retención de snapshots es indefinida y el tamaño se vigilará al añadir usuarios.

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

- La integración del HTML con Supabase, Auth y sincronización queda pendiente. `activity_sessions` y `meal_completion_ingredients` ya están aplicadas.
- La política de Auth ya está decidida en [ADR-0008](decisions/0008-email-password-auth.md): correo + contraseña, registro libre y sin confirmación de correo. Falta configurarla en Supabase e implementarla en el HTML.
- Pendiente implementar y ejecutar una prueba de aislamiento RLS con dos cuentas autenticadas y comprobar lecturas, altas y referencias entre filas de propietarios distintos.
- Pendiente diseñar operaciones transaccionales e idempotentes para completar/revertir comidas y guardar sus snapshots junto con los movimientos.
- Pendiente diseñar la importación inicial del estado local v8 y la persistencia remota desde varios dispositivos.
- Revisar mensualmente el tamaño total y por tabla cuando se active la sincronización multiusuario y después de importaciones grandes. Al acercarse a 350 MB del límite Free, analizar tendencias; no hay purga automática de snapshots.
- ¿Cómo se hará una copia externa segura si la base de datos remota queda pausada o inaccesible?
- ¿Qué navegadores y dispositivos se validarán antes de declarar lista la sincronización?
