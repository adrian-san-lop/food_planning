# Preguntas abiertas

Esta lista contiene puntos que aún no se deben tratar como requisitos aceptados. Al decidir uno, actualizar el documento correspondiente y añadir o actualizar un registro en `docs/decisions/`.

## Catálogo y recetas

- ¿Qué fuente nutricional se usará para revisar estimaciones: etiquetas de productos concretos, tablas públicas u otra fuente?
- ¿Qué campos obligatorios tendrá el esquema validado de alimentos y recetas? Hoy los JSON no tienen JSON Schema.
- ¿Qué define una receta “nueva” al renovar el ciclo: que no apareciera en el ciclo anterior o que se haya añadido recientemente al catálogo?
- ¿Cuántas recetas nuevas por ciclo se esperan, si hay un mínimo?
- ¿Se pretende evitar cualquier repetición en una semana o basta con evitar repeticiones cercanas? No hay distancias ni límites numéricos acordados.
- ¿Qué etiquetas adicionales ayudan a filtrar recetas (estilo, proteína principal, técnicas, tiempo, coste)? Añadir solo las que se usarán.

## Gustos, restricciones y varias personas

- ¿Qué escala de gustos se quiere usar y dónde se recogen las valoraciones?
- ¿Cómo distinguir “no me gusta” de “no consumir nunca” y de alergia/intolerancia? La propuesta de filtrado estricto no está aceptada como especificación médica.
- ¿La primera versión debe considerar solo a una persona? Es el alcance actual; el modo compartido es una posibilidad futura.
- Si se comparte un menú, ¿debe ser aceptable para todos o se permiten comidas distintas? ¿Cómo combinar preferencias y raciones?
- ¿Qué debe hacer el planificador cuando las restricciones dejan muy pocas recetas: pedir ampliar preferencias, sugerir nuevas recetas o ambas?

## Planificador

- ¿La generación se inicia al abrir la app al final del ciclo, con un botón o mediante otro flujo? No se han solicitado avisos en segundo plano.
- ¿Qué tolerancias nutricionales y de variedad se consideran “pequeñas” o “cercanas”?
- ¿Qué información debe mostrar para explicar una elección (nutrición, stock, preferencia, variedad)?
- ¿Cómo se conserva una comida bloqueada si se cambia el perfil o la versión del catálogo?

## Persistencia e integración

- El HTML sigue usando `localStorage`; Supabase aún no está conectado y no se ha ejecutado SQL. ¿Qué fase de persistencia se prioriza frente a la integración del planificador?
- ¿Qué tablas, claves y políticas RLS se aprobarán para los datos personales?
- ¿Cómo se hará una copia externa segura si la base de datos remota queda pausada o inaccesible?
- ¿Qué navegadores y dispositivos se validarán antes de declarar lista la sincronización?
