# Requisitos del producto

Estado de referencia: 16 de octubre de 2026. Este documento reúne el alcance acordado; lo que aún sea una propuesta aparece señalado como tal.

## Propósito y usuarios

Menuki (Mi Plan Saludable) ayuda a organizar comidas de tres semanas, consultar recetas, preparar compras, controlar existencias, registrar sesiones de actividad ya realizadas y seguir el peso. Los datos personales permanecen aislados por cuenta y la app requiere conexión. Las cuentas autenticadas también pueden enviar ideas a un buzón compartido de recetas; esto no crea un menú compartido ni mezcla perfiles. El propietario quiere mantener el coste de uso en cero dentro de los límites de los servicios gratuitos.

La posibilidad de combinar los gustos de varias personas en un menú común sigue pendiente. El buzón de recetas compartido sí está aceptado; los perfiles, menús, despensa y registros siguen aislados por cuenta.

## Alcance funcional

### Implementado en el HTML actual

- La aplicación personal y el acceso emplean Roboto en títulos, cifras, textos y controles. La fuente WOFF2 se sirve desde el mismo proyecto con su licencia; no se carga desde Google Fonts al usar la app. El estilo utiliza tarjetas blancas, fondo gris neutro, texto oscuro, acciones y selección en verde esmeralda y una paleta semántica común. Los indicadores de proteínas, hidratos y grasas usan violeta, azul y ámbar con etiquetas textuales; un consumo cero mantiene la barra vacía. Las tarjetas tienen bordes discretos y sombras suaves, sin degradados decorativos. Se conserva la distribución responsive acordada.
- En escritorio, portátil y tablet apaisada, todas las pestañas comparten el mismo menú lateral para un mismo tamaño de pantalla. De 851–1180 px de ancho y desde 768 px de alto se utiliza la variante de solo iconos de Mi perfil; en el resto se muestran nombres e iconos. La densidad se adapta a la altura y las opciones conservan nombres accesibles. Este ajuste no cambia las reglas de tamaño de las tarjetas ni la navegación móvil.
- La entrada pública de GitHub Pages es una landing en español que explica el menú de tres semanas, recetas, compra, despensa y seguimiento. La cabecera fija ofrece Iniciar sesión y Registrarse tanto en escritorio como en móvil; el registro reutiliza Supabase Auth desde `menuki.html?auth=signup`. La demo de menú y compra es interactiva y el movimiento decorativo respeta `prefers-reduced-motion`.
- Un ciclo de tres semanas con cinco espacios diarios: desayuno, media mañana, comida, media tarde y cena (105 espacios). El primer ciclo mantiene el menú fijo existente; los siguientes pueden generarse desde el catálogo.
- Inicio es un dashboard con cuatro KPI semanales y, debajo, dos columnas alineadas con ellos: Menú de hoy completo en las columnas de los KPI 1–2; Objetivo nutricional de hoy arriba y «Tu día, organizado» debajo en las columnas de los KPI 3–4. «Tu plan actual» cierra el panel a todo el ancho, mostrando recuperación ósea solo cuando está activa. El diseño adapta tamaños y densidad al ancho y alto para caber sin scroll en escritorio y tablets habituales; las ventanas demasiado bajas o estrechas usan flujo natural. En móvil se apilan KPI, menú, nutrición, resumen del día y plan actual. Inicio no ofrece navegación semanal ni por día.
- «Tu día, organizado» resume los platos previstos para comida y cena y muestra la receta más rápida de las cinco de hoy, con su tiempo del catálogo y una frase breve de acompañamiento. No inventa tiempos, instrucciones de preparación ni beneficios nutricionales. Sin menú para hoy, explica por qué no hay resumen y no utiliza recetas de otra fecha.
- Menú es una página separada: permite elegir una de las tres semanas y un día con el calendario de siete días; muestra el detalle de la fecha seleccionada.
- En Inicio, la persona puede revisar el perfil mientras sus datos sigan pendientes de confirmación y abrir una guía rápida de tres pasos. Guía conserva el recorrido completo y permite reabrir la guía breve. Esta ayuda es opcional y no crea un estado de onboarding; los valores de ejemplo no se consideran revisados hasta guardar el perfil explícitamente.
- La app comprueba periódicamente la revisión de Supabase mientras está visible y al volver al primer plano o recuperar la conexión. Combina cambios independientes usando la última revisión remota como base; cuando dos dispositivos cambian el mismo valor, prevalece el valor de la revisión que Supabase aceptó más recientemente. No pide elegir una copia.
- Recetas, instrucciones y adaptación de cantidades según el perfil y las sesiones de actividad ya realizadas. La ficha se centra y ajusta al contenido, con un límite del alto visible. Presenta cuatro valores nutricionales en una sola fila y un único texto «Valores nutricionales estimados por ración». Conserva ingredientes, cantidades, existencias y pasos completos; muestra una descripción solo cuando existe en el catálogo. Consejo y explicación de las cantidades quedan en un desplegable. En recetas largas se desplaza solo el contenido central, manteniendo la X y la acción de registro accesibles. En escritorio los ingredientes y pasos usan dos columnas; en móvil una. La aplicación no muestra fotografías de platos.
- El listado del recetario mantiene dos columnas en móvil y conserva categoría, nombre, tiempo, calorías y proteínas. Tiempo e icono forman un grupo indivisible; los datos nutricionales ocupan la siguiente línea y cada cifra permanece junto a su unidad. Las tarjetas de la misma fila alinean los metadatos y admiten títulos largos completos. Se mantienen búsqueda, filtros y apertura de la ficha.
- Lista de compra, formatos comerciales orientativos, inventario, consumos y ajustes.
- Registro posterior de sesiones realizadas con fecha, actividad/esfuerzo y duración; historial accesible desde **Actividad** en la barra inferior del móvil y desde **Actividad y peso** en escritorio. Cada sesión se puede eliminar de forma individual; el historial muestra 12 filas inicialmente y permite cargar más.
- Estado de trabajo en localStorage y sincronización automática autenticada con Supabase. Las instalaciones existentes conservan la migración de estados locales v5-v8; no hay restauración personal JSON desde la interfaz ni recordatorio periódico de copia.
- En móvil, la navegación inferior prioriza Inicio, Menú, Compra y Actividad; Perfil, Despensa, Recetas y Guía están bajo **Más**. El logo permanece en una barra superior fija con fondo diferenciado; el correo y el cierre de sesión están en Perfil. La compra permite buscar productos y mantiene a mano el progreso y la acción para finalizar.
- Inventario negativo permitido cuando se registra una comida que supera las existencias; se muestra el faltante y desmarcar la comida revierte el consumo.
- Catálogos genéricos de alimentos y recetas cargados desde JSON con validación de referencias y unidades.
- Generación de una propuesta para el siguiente ciclo de 105 comidas, edición por tipo de comida, bloqueo, regeneración selectiva y guardado con fecha y versión del catálogo. En la revisión, «Cambiar platos» y «Guardar» se sitúan a la derecha del título y permanecen visibles al desplazar la lista; se retira el botón inferior Cerrar y se mantiene la X. «Cambiar platos» muestra «Renueva únicamente los desbloqueados» al pasar el ratón o recibir foco de teclado. Fecha, 21 días, 105 comidas y variedad se resumen de forma compacta; a la derecha aparecen el objetivo y las raciones actuales y, cuando se utilizó al generar, la recuperación ósea destacada. Las explicaciones y la cobertura cualitativa se consultan en «Cómo se prepara este menú». El aviso de cambios posteriores en recuperación sigue visible. Editar platos conserva posición de lectura y foco, sin alterar las reglas de generación o confirmación.
- Activación del siguiente menú al llegar su fecha; el ciclo anterior se archiva junto con su menú y registros.

### Propuestas de recetas — revisión admin individual y exportación JSON

El propietario informa que aplicó las migraciones del buzón y de mantenimiento admin. La edición y el borrado individual funcionan. La limpieza global requiere aplicar `20261013180000_recipe_proposal_purge_where_clause.sql`: Supabase rechaza el borrado masivo si no tiene cláusula `WHERE`. Después debe validarse la limpieza en la web publicada y el aislamiento con una cuenta normal.

- Cualquier cuenta autenticada puede enviar una propuesta con tipo (desayuno, comida, snack o cena), nombre de hasta 120 caracteres, hasta 30 ingredientes de texto libre (160 caracteres cada uno) y hasta 30 pasos ordenados (500 caracteres cada uno). El formulario empieza con un ingrediente y un paso.
- No se piden cantidades, raciones, kcal ni nutrientes. Los datos son una idea inicial; la propuesta no se convierte automáticamente en una receta del catálogo.
- Un rol de administrador asignado de forma privada en Supabase puede revisar todas las propuestas. El rol se comprueba en la base de datos y no se deriva de una contraseña o correo escrito en el HTML.
- Solo el administrador puede descargar el buzón en el formato `menuki.recipe-proposal-export`, versión 1. El paquete sigue `docs/schemas/recipe-proposal-export.schema.json`, registra `exportedAt`, `catalogVersion` y el número de propuestas, y conserva por propuesta el ID estable, tipo, nombre, fecha, ingredientes y pasos. No incluye correo ni ID de cuenta remitente ni cambia Supabase.
- Antes de exportar, el administrador puede editar tipo, nombre, ingredientes y pasos de una propuesta, guardando los cambios en Supabase. Puede eliminar una propuesta individual junto con sus ingredientes y pasos, sin afectar a las demás. La descarga siempre refleja el estado guardado en ese momento.
- La edición y el borrado individual usan RPCs transaccionales que verifican en Supabase que la cuenta pertenece a `menuki_admins`; la visibilidad de los botones en el navegador no es una medida de autorización. No se conceden escrituras directas a las tablas del buzón. Si una propuesta cambió desde la última lectura, la operación se rechaza y el admin actualiza el buzón antes de reintentar.
- El administrador utiliza IA fuera de la app para concretar una ración para una persona, cantidades y composición nutricional. Verifica y añade primero los alimentos nuevos a `data/foods.json`, después completa `data/recipes.json` y publica los cambios con el flujo Git del repositorio. La web no escribe en GitHub ni aloja una clave de escritura.
- El formulario usa “Snack”; al crear la receta de catálogo, el administrador la asigna a `media` o `tarde`, que son los tipos equivalentes disponibles en el catálogo actual.
- Tras incorporar y publicar todas las recetas del buzón, el administrador puede confirmar el borrado global de las propuestas. El borrado incluye sus ingredientes y pasos, no modifica cuentas ni datos personales y se rechaza si el número de propuestas cambió desde la confirmación.
- PostgreSQL puede reutilizar el espacio de las filas eliminadas; el indicador de tamaño total puede tardar en reflejar cambios y no se garantiza que baje inmediatamente.

### Perfil y nutrición

El HTML contempla sexo o metabolismo basal manual, edad, altura, peso, actividad habitual sin ejercicio, objetivo e indicador de recuperación ósea. Usa Mifflin-St Jeor como estimación del metabolismo en reposo, objetivos aproximados de energía/macros y adaptación de raciones. No son mediciones clínicas. Con Recuperación ósea activa, las propuestas nuevas favorecen alimentos marcados como fuentes de calcio, vitamina D y vitamina C; no se calculan cantidades de micronutrientes ni se prescriben suplementos.

El perfil empieza con valores genéricos de ejemplo. Hasta que la persona lo revise y lo guarde, Guía y el propio perfil lo indican; la confirmación se conserva en `profiles.profile_confirmed` y se sincroniza entre dispositivos. Los perfiles existentes también requieren una revisión explícita después de aplicar esta mejora.

La vista de Perfil adapta el dashboard al ancho y al alto disponibles. Escritorio amplio y alto sitúa datos personales y actividad/ajustes arriba, objetivos debajo y el resultado nutricional en una columna lateral. Portátiles apilan las tres tarjetas junto a esa columna. Tablets apaisadas usan una barra lateral de iconos y el resumen superior; las tarjetas del formulario se distribuyen en columnas cuando la altura es limitada. El panel cabe sin desplazamiento en los tamaños de escritorio y tablet revisados desde 768 px de alto; ventanas más bajas y pantallas estrechas mantienen flujo vertical para evitar solapamientos o reducir el texto. En móvil, los KPI Peso, Energía y Mantenimiento se separan en subtarjetas de igual altura, sin sus notas descriptivas, y los objetivos ocupan una fila cada uno. Las ayudas contextuales se abren con hover/foco o toque y se cierran al salir, pulsar fuera o usar Escape. El botón «Cómo calcula Menuki» abre la explicación general en un diálogo nativo. «Guardar cambios» no lleva icono. Cambiar campos solo actualiza la vista previa; los cambios del menú, la compra y el perfil guardado siguen aplicándose al enviar el formulario. La restauración de valores iniciales y la confirmación de revisión conservan su comportamiento.

Las comidas pendientes pueden recalcular porciones al cambiar el perfil o al registrar/quitar una sesión en esa fecha. Las comidas ya realizadas conservan sus cantidades registradas; el cálculo las trata como fijas y distribuye el objetivo restante entre comidas pendientes. En Inicio, las barras nutricionales suman solo las comidas registradas como realizadas. Una sesión aumenta el objetivo de energía de su fecha y no cuenta como alimento; el objetivo de proteína mantiene el cálculo actual del perfil. El desayuno suele incluir yogur y no debe incluir queso según la preferencia vigente. No hay otras restricciones alimentarias generales definidas.

### Compra y despensa

- La compra se calcula para 3, 7 o 14 días, o el resto del ciclo seleccionado; solo considera comidas de hoy o futuras no realizadas y nunca mezcla dos ciclos. Para un ciclo que todavía no ha comenzado, cuenta desde su primer día.
- Mostrar únicamente **Ciclo actual** salvo que el próximo menú esté guardado y confirmado y falten entre uno y tres días para su inicio. Solo cuando se cumplan ambas condiciones, ofrecer los botones **Ciclo actual / Próximo ciclo** para cambiar la lista completa. Un borrador no habilita la compra anticipada.
- Para la compra del próximo ciclo, calcular una despensa prevista descontando de las existencias reales las comidas pendientes del ciclo actual anteriores a ese inicio. Presentar esa cantidad como previsión; no crear movimientos ni alterar el saldo real. Mantener separados los artículos marcados y los extras de cada ciclo.
- Restar existencias, mostrar faltantes y traducirlos a envases orientativos. Mostrar por establecimiento y sección (Supermercado y Frutería).
- Marcar un artículo no lo añade al inventario. Solo confirmar/finalizar la compra incorpora el contenido realmente comprado. Los artículos no confirmados no se registran.
- En escritorio, colocar **Finalizar compra** arriba junto a Guía. En móvil, fijarlo sobre la navegación inferior y reservar espacio para no tapar contenido. Mostrar el texto sin iconos. Finalizar incorpora solo lo seleccionado en la lista mostrada y conserva las selecciones del otro ciclo.
- Permitir extras, correcciones manuales, desperdicios y consumos fuera del menú.
- 7 y 14 días deben representar ventanas distintas. Pueden coincidir cuando el ciclo restante sea menor o igual que ambas ventanas, indicándolo.
- Evitar recomendar 14 días de productos frescos sin explicar que requieren congelación o reposición.

### Ciclo actual y calendario

El HTML tiene como ciclo inicial fijo del 13 de octubre al 2 de noviembre de 2026 (tres semanas). Esta fecha es un dato de la versión actual, no una regla para ciclos futuros. Los ciclos futuros deben guardar fechas y menú propios, mantener historial y no reiniciar la despensa ni los pesos.

La renovación usa el planificador interno: generar, revisar y confirmar el siguiente menú antes del cambio de ciclo. Al llegar la fecha, el menú confirmado se activa y el anterior se archiva. Si el ciclo termina sin otro menú confirmado disponible, bloquear el contenido de **Inicio y Menú** y mostrar un diálogo para generar el siguiente o continuar el borrador; las demás secciones siguen accesibles. Cerrar el aviso permite navegar, pero no desbloquea esas dos páginas. La app ya no ofrece copiar un encargo para generar el menú fuera de Menuki.

El aviso de renovación se muestra al abrir la aplicación; no es push. El producto acordado no envía avisos en segundo plano. Los días civiles y el límite de tres días antes del próximo inicio se calculan en `Europe/Madrid`, sin sumar intervalos fijos de milisegundos.

### Cocina y seguimiento

- Platos principales normalmente sencillos, en torno a 20–30 minutos; se dispone de horno, microondas, freidora de aire y batidora. Snacks/desayunos pueden requerir menos tiempo.
- Marcar comidas realizadas desde menú o recetario solo cuando llegue su fecha; las futuras aparecen como planificadas y no descuentan despensa. Cada consumo se aplica una sola vez y desmarcar genera el reverso correspondiente.
- Registrar las sesiones después de realizarlas; se permiten varias por día. La estimación neta `(MET − 1) × peso_kg × horas` se suma al objetivo base solo para esa fecha. Sin sesión registrada, se conserva el objetivo base.
- La meta de proteína y grasa se mantiene estable ante la sesión; la energía extra se cubre principalmente con cantidades de hidratos. No se crean previsiones ni se alteran días futuros.
- Registrar peso con fecha y consultar su tendencia sin interpretar fluctuaciones puntuales como cambios de grasa.
- Mantener la app responsive y accesible. El menú semanal se consulta en la página Menú; Compra y Despensa agrupan sus productos en secciones plegables.

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
- No añadir colas offline, avisos en segundo plano ni notificaciones push. La sincronización se inicia automáticamente al guardar cambios y al detectar una revisión remota nueva; la interfaz solo ofrece reintento cuando falla. El reinicio total conserva su confirmación explícita y usa el RPC de reemplazo; no participa en la conciliación habitual entre dispositivos. La restauración personal desde JSON ya no está disponible.
- El inicio de sesión y la sincronización relacional están implementados en el HTML y el esquema. La publicación del HTML actualizado, la prueba RLS con dos cuentas y la verificación PC/móvil siguen pendientes; véase [arquitectura](../architecture.md).
