# Requisitos del producto

Estado de referencia: 13 de octubre de 2026. Este documento reúne el alcance acordado; lo que aún sea una propuesta aparece señalado como tal.

## Propósito y usuarios

Menuki (Mi Plan Saludable) ayuda a organizar comidas de tres semanas, consultar recetas, preparar compras, controlar existencias, registrar sesiones de actividad ya realizadas y seguir el peso. La versión actual es personal, para una sola persona y requiere conexión. El propietario quiere mantener el coste de uso en cero dentro de los límites de los servicios gratuitos.

La posibilidad de que otras personas tengan gustos distintos se está considerando para el diseño futuro. **No significa que el alcance actual ya sea multiusuario o que se haya aprobado un modo de menú compartido.**

## Alcance funcional

### Implementado en el HTML actual

- Un ciclo de tres semanas con cinco espacios diarios: desayuno, media mañana, comida, media tarde y cena (105 espacios). El primer ciclo mantiene el menú fijo existente; los siguientes pueden generarse desde el catálogo.
- Inicio muestra un resumen del día en este orden: banner, KPI, objetivo nutricional de hoy y menú de hoy. No incluye navegación semanal ni otras secciones.
- Menú es una página separada: permite elegir una de las tres semanas y un día con el calendario de siete días; muestra el detalle de la fecha seleccionada.
- En una primera visita, Guía explica los pasos básicos y dirige al perfil. Los valores de ejemplo no se consideran revisados hasta que la persona guarda el perfil explícitamente.
- La app comprueba periódicamente la revisión de Supabase mientras está visible y al volver al primer plano o recuperar la conexión. Combina cambios independientes usando la última revisión remota como base; cuando dos dispositivos cambian el mismo valor, prevalece el valor de la revisión que Supabase aceptó más recientemente. No pide elegir una copia.
- Recetas, instrucciones y adaptación de cantidades según el perfil y las sesiones de actividad ya realizadas. La aplicación no muestra fotografías de platos.
- Lista de compra, formatos comerciales orientativos, inventario, consumos y ajustes.
- Registro posterior de sesiones realizadas con fecha, actividad/esfuerzo y duración; historial accesible desde **Actividad** en la barra inferior del móvil y desde **Actividad y peso** en escritorio. Cada sesión se puede eliminar de forma individual; el historial muestra 12 filas inicialmente y permite cargar más.
- Estado de trabajo en `localStorage` y sincronización automática autenticada con Supabase. Se pueden restaurar archivos JSON v5-v8; no hay recordatorio periódico de copia.
- En móvil, la navegación inferior prioriza Inicio, Menú, Compra y Actividad; Perfil, Despensa, Recetas y Guía están bajo **Más**. La compra permite buscar productos y mantiene a mano el progreso y la acción para finalizar.
- Inventario negativo permitido cuando se registra una comida que supera las existencias; se muestra el faltante y desmarcar la comida revierte el consumo.
- Catálogos genéricos de alimentos y recetas cargados desde JSON con validación de referencias y unidades.
- Generación de una propuesta para el siguiente ciclo de 105 comidas, edición por tipo de comida, bloqueo, regeneración selectiva y guardado local con fecha y versión del catálogo.
- Activación del siguiente menú al llegar su fecha; el ciclo anterior se archiva junto con su menú y registros.

### Perfil y nutrición

El HTML contempla sexo o metabolismo basal manual, edad, altura, peso, actividad habitual sin ejercicio, objetivo e indicador de recuperación ósea. Usa Mifflin-St Jeor como estimación del metabolismo en reposo, objetivos aproximados de energía/macros y adaptación de raciones. No son mediciones clínicas. Con Recuperación ósea activa, las propuestas nuevas favorecen alimentos marcados como fuentes de calcio, vitamina D y vitamina C; no se calculan cantidades de micronutrientes ni se prescriben suplementos.

El perfil empieza con valores genéricos de ejemplo. Hasta que la persona lo revise y lo guarde, Guía y el propio perfil lo indican; la confirmación se conserva en `profiles.profile_confirmed` y se sincroniza entre dispositivos. Los perfiles existentes también requieren una revisión explícita después de aplicar esta mejora.

Las comidas pendientes pueden recalcular porciones al cambiar el perfil o al registrar/quitar una sesión en esa fecha. Las comidas ya realizadas conservan sus cantidades registradas; el cálculo las trata como fijas y distribuye el objetivo restante entre comidas pendientes. En Inicio, las barras nutricionales suman solo las comidas registradas como realizadas. Una sesión aumenta el objetivo de energía de su fecha y no cuenta como alimento; el objetivo de proteína mantiene el cálculo actual del perfil. El desayuno suele incluir yogur y no debe incluir queso según la preferencia vigente. No hay otras restricciones alimentarias generales definidas.

### Compra y despensa

- La compra puede calcularse para 3, 7 o 14 días, la semana visible o el ciclo pendiente; solo considera comidas futuras no realizadas.
- Restar existencias, mostrar faltantes y traducirlos a envases orientativos. Mostrar por establecimiento y sección (Supermercado y Frutería).
- Marcar un artículo no lo añade al inventario. Solo confirmar/finalizar la compra incorpora el contenido realmente comprado. Los artículos no confirmados no se registran.
- Permitir extras, correcciones manuales, desperdicios y consumos fuera del menú.
- 7 y 14 días deben representar ventanas distintas. Pueden coincidir cuando el ciclo restante sea menor o igual que ambas ventanas, indicándolo.
- Evitar recomendar 14 días de productos frescos sin explicar que requieren congelación o reposición.

### Ciclo actual y calendario

El HTML tiene como ciclo inicial fijo del 13 de octubre al 2 de noviembre de 2026 (tres semanas). Esta fecha es un dato de la versión actual, no una regla para ciclos futuros. Los ciclos futuros deben guardar fechas y menú propios, mantener historial y no reiniciar la despensa ni los pesos.

El aviso de renovación actual aparece dentro de la página cerca del final del ciclo; no es push. El producto acordado no envía avisos en segundo plano. Los días civiles deben calcularse en `Europe/Madrid`, sin depender de sumar intervalos fijos de milisegundos.

### Cocina y seguimiento

- Platos principales normalmente sencillos, en torno a 20–30 minutos; se dispone de horno, microondas, freidora de aire y batidora. Snacks/desayunos pueden requerir menos tiempo.
- Marcar comidas realizadas desde menú o recetario solo cuando llegue su fecha; las futuras aparecen como planificadas y no descuentan despensa. Cada consumo se aplica una sola vez y desmarcar genera el reverso correspondiente.
- Registrar las sesiones después de realizarlas; se permiten varias por día. La estimación neta `(MET − 1) × peso_kg × horas` se suma al objetivo base solo para esa fecha. Sin sesión registrada, se conserva el objetivo base.
- La meta de proteína y grasa se mantiene estable ante la sesión; la energía extra se cubre principalmente con cantidades de hidratos. No se crean previsiones ni se alteran días futuros.
- Registrar peso con fecha y consultar su tendencia sin interpretar fluctuaciones puntuales como cambios de grasa.
- Mantener la app responsive y accesible. El menú de Inicio prioriza los platos del día; Compra y Despensa agrupan sus productos en secciones plegables.

### Catálogos y siguiente ciclo

- Mantener una biblioteca común y versionada de alimentos y recetas en `data/foods.json` y `data/recipes.json`; sus esquemas están en los ficheros `*.schema.json`.
- Al preparar un ciclo, formar una propuesta de 105 comidas compatibles. Se permiten repeticiones y se favorecen recetas que no aparecían en el menú actual, sin un mínimo numérico.
- Revisar y cambiar recetas dentro del mismo tipo de comida; los cambios manuales quedan bloqueados hasta que se desbloqueen. Regenerar conserva las comidas bloqueadas.
- Guardar la propuesta con su versión de catálogo en Supabase y activarla en la fecha guardada.
- Con Recuperación ósea activa, dar preferencia cualitativa a recetas con fuentes catalogadas de calcio y vitamina D y con frutas/verduras que aporten vitamina C; presentar presencia por día como referencia, no como objetivo nutricional cuantificado. El ciclo actual no se sustituye al cambiar el perfil.

El ciclo inicial conserva el menú fijo existente. Las preferencias por gustos, las alergias y las exclusiones personales no se filtran todavía porque su modelo no está aprobado.

Los valores MET de actividad son aproximaciones basadas en categorías del [2024 Adult Compendium](https://pacompendium.com/adult-compendium/), no mediciones individuales. No se ha aprobado el aprendizaje automático de una rutina futura a partir del historial; la posibilidad de mostrar un resumen para revisión manual sigue abierta.

## Reglas funcionales aceptadas para el futuro planificador

1. Conservar el cálculo nutricional y de raciones existente como referencia y optimizar hacia los objetivos; no descartar una receta por una desviación pequeña.
2. Favorecer recetas que aprovechen el stock, sin bloquear por existencias insuficientes. La lista de compra mostrará el faltante.
3. Buscar variedad y evitar repeticiones cercanas; permitir repetir cuando la biblioteca o las restricciones lo requieran.
4. Presentar una propuesta que se pueda revisar, intercambiar y bloquear frente a una regeneración.

Estos principios están aceptados. Las puntuaciones, umbrales y cantidades mínimas de novedad siguen abiertas; véase [preguntas abiertas](../open-questions.md).

## Preferencias alimentarias y personalización

- Preferencias por persona deben mantenerse separadas de los catálogos compartidos.
- **Propuesta pendiente:** distinguir gustos (favorito, indiferente, evitar) de restricciones firmes (por ejemplo, alergia o intolerancia). No se ha aprobado aún el vocabulario ni la lógica de combinación.
- **Propuesta futura:** si se comparte un menú entre varias personas, considerar las restricciones de cada integrante y calcular las cantidades para el total de comensales. Aún no se ha decidido si se necesita un menú común o uno por persona.
- No introducir restricciones alimentarias médicas por defecto. El perfil actual no define restricciones generales.

## Unidades y compras

- Separar la medida de receta de la unidad de inventario y compra. Todas las frutas y verduras enteras listadas abajo se pesan en gramos en recetas y se cuentan en `ud` en la despensa y la compra; sus pesos comestibles por pieza son aproximados y permiten convertir entre ambas medidas.
- Usar `ud` en recetas e inventario para huevos; `g` para alimentos sólidos pesados, incluidos frutas y verduras; y `ml` para líquidos. Se permiten fracciones de `ud` en el inventario de piezas enteras.
- Frutas y verduras enteras con compra/inventario por unidad: plátano, manzana, kiwi, mandarina, naranja, pera, fruta de temporada, aguacate, tomate, pimiento, calabacín, cebolla, zanahoria, brócoli, pepino, patata y boniato. Las verduras troceadas, congeladas o vendidas al peso se controlan en gramos.
- La leche se compra en tetrabriks de 1 L. El café molido se controla en gramos y figura en los desayunos.
- Al finalizar la compra, registrar el contenido real confirmado, no solo la cantidad planificada. Permitir ajustar el tamaño estimado del envase.

## Privacidad y continuidad

- Los catálogos son datos genéricos; no deben contener perfiles, pesos, preferencias personales, despensa, comidas completadas ni copias de seguridad.
- GitHub Pages es alojamiento estático y de acceso público. Los datos personales no se guardan en el repositorio; Supabase los separa por `auth.uid()` y RLS. `localStorage` es una copia de trabajo, no la sincronización entre dispositivos.
- No añadir colas offline, avisos en segundo plano ni notificaciones push. La sincronización se inicia automáticamente al guardar cambios y al detectar una revisión remota nueva; la interfaz solo ofrece reintento cuando falla. Reinicio total y restauración JSON conservan su confirmación explícita y usan el RPC de reemplazo; no participan en la conciliación habitual entre dispositivos.
- El inicio de sesión y la sincronización relacional están implementados en el HTML y el esquema. La publicación del HTML actualizado, la prueba RLS con dos cuentas y la verificación PC/móvil siguen pendientes; véase [arquitectura](../architecture.md).
