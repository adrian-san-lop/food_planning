# Preguntas abiertas

Esta lista contiene puntos que aún no se deben tratar como requisitos aceptados. Al decidir uno, actualizar el documento correspondiente y añadir o actualizar un registro en `docs/decisions/`.

El esquema JSON, la carga de catálogos y el flujo inicial del planificador ya están implementados. Supabase se pospone; no hay autenticación ni sincronización entre dispositivos.

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

- ¿Qué tolerancias nutricionales y de variedad se consideran “pequeñas” o “cercanas”?
- ¿Cómo debería comportarse un menú bloqueado si cambia el perfil o una receta conserva el ID pero cambia de contenido en una nueva versión del catálogo?

## Persistencia e integración

- Supabase queda pospuesto hasta revisar una fase posterior. No se ha ejecutado SQL ni se ha integrado autenticación o persistencia remota.
- ¿Qué tablas, claves y políticas RLS se aprobarán para los datos personales?
- ¿Cómo se hará una copia externa segura si la base de datos remota queda pausada o inaccesible?
- ¿Qué navegadores y dispositivos se validarán antes de declarar lista la sincronización?
