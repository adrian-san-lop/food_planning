# Auditoría UX/UI de Menuki

- **Fecha de la auditoría histórica:** 11 de octubre de 2026
- **Actualización de estado documental:** 17 de octubre de 2026
- **Aplicación revisada:** [Menuki en GitHub Pages](https://adrian-san-lop.github.io/food_planning/menuki.html)
- **Alcance:** recorrido de primera visita y tareas habituales en escritorio y en vista móvil adaptable. Las observaciones describen la versión publicada durante la auditoría; el estado de implementación posterior se indica a continuación.

## Resumen de la versión auditada (histórico)

La app ofrece las secciones necesarias para consultar el menú, gestionar la despensa, preparar la compra y revisar el perfil. El problema principal es que, al iniciar sesión, no guía al usuario por un primer recorrido ni le indica si debe completar el perfil. La pantalla de inicio invita a explorar el menú, mientras muestra datos de perfil ya rellenados cuyo estado no se explica.

La primera visita también presenta una decisión sobre datos locales y Supabase, además de avisos y controles de copia. Todo ello compite con la pregunta más inmediata de un usuario nuevo: «¿Qué tengo que hacer para que el menú se adapte a mí y cómo empiezo?».

La experiencia cambia con el tamaño de pantalla: en escritorio las secciones se encuentran en una barra lateral; en móvil pasan a una barra inferior con ocho opciones. La compra y la despensa siguen siendo recorridos largos en móvil.

## Comportamiento vigente — actualización del 17 de octubre de 2026

La elección manual entre copias y la pantalla descritas en esta auditoría son observaciones históricas de la versión revisada y quedan sustituidas por [ADR-0017](decisions/0017-automatic-reconciliation-and-activity-history.md). El cliente consulta las revisiones remotas y combina cambios automáticamente. Según ADR-0028, la barra inferior móvil contiene Inicio, Menú, Compra y Más; Actividad y peso se abre desde el menú superior de cuenta. El historial aparece al inicio de esa vista y cada sesión muestra «Eliminar sesión», con confirmación mediante diálogo según ADR-0039. ADR-0036 sustituye los KPI móviles antiguos por cuatro indicadores semanales compartidos con escritorio. La restauración personal JSON fue retirada por ADR-0029. La corrección HTTP 409 está aplicada y resuelta según confirmación del administrador del 17/10/2026. Las comprobaciones completas entre dispositivos y en teléfono físico siguen pendientes de validación documentada.

## Estado de las mejoras de prioridad alta

La guía de primera visita, la confirmación del perfil y el bloqueo de registro anticipado están implementados. La publicación y la comprobación con usuario nuevo siguen pendientes.

- **Primera visita y perfil:** Inicio ofrece una guía rápida opcional de tres pasos y un acceso a revisar el perfil mientras no esté confirmado; Guía contiene el recorrido completo (ADR-0025 y ADR-0029). El perfil queda marcado como revisado al guardarlo; esa marca se sincroniza con Supabase.
- **Sincronización entre dispositivos:** el antiguo panel de elección de copias fue retirado. El cliente reconcilia cambios remotos y locales automáticamente, con la política descrita en ADR-0017.
- **Planificación y registro:** las comidas futuras aparecen como planificadas y el control para registrarlas está deshabilitado hasta la fecha correspondiente.

Las observaciones siguientes describen lo que se encontró antes de estas mejoras. Las mejoras posteriores están descritas en las decisiones vigentes y en README; las observaciones originales no son un diagnóstico nuevo de producción. La validación integral publicada y en teléfono físico sigue pendiente de documentación.

## Alcance y método

- Se inició sesión en la página publicada con la cuenta de prueba facilitada por el propietario.
- Se recorrieron las pantallas disponibles sin registrar comidas, peso, sesiones, compras ni cambios de perfil o despensa.
- Se revisó el escritorio a 1280 × 720 y la vista adaptable móvil a 390 × 844. La vista móvil se simuló en el navegador; no equivale a una prueba en un teléfono físico.
- Al entrar, la app avisó de que había datos locales sin copia en Supabase y ofreció **Usar versión de Supabase** o **Subir esta copia**. No se eligió ninguna opción, porque la primera puede reemplazar la copia local y la segunda puede subirla.
- La sesión y la navegación fueron las únicas acciones realizadas en la cuenta. No se verificó la sincronización después de resolver esa decisión inicial.

## Recorrido de primera visita observado

1. El usuario inicia sesión y entra en la aplicación, sin un paso de bienvenida o configuración inicial.
2. Aparece una decisión entre los datos de Supabase y los datos locales. Los botones indican qué copia se selecciona, pero no explican de forma visible qué contiene cada una ni qué se reemplazará.
3. La pantalla de inicio presenta el menú y una invitación a explorarlo. No prioriza revisar el perfil ni aclara que los datos ya visibles deban confirmarse.
4. En el perfil se muestran valores como edad, altura, peso y gasto en reposo. La pantalla no permite distinguir claramente si son datos confirmados por el usuario o valores iniciales.
5. La despensa puede rellenarse producto por producto. La compra presenta los artículos calculados para los próximos siete días y requiere pulsar **Finalizar compra** para actualizar el stock.
6. El usuario puede volver al menú y registrar las comidas. La aplicación no presenta estos pasos como una secuencia ni muestra un progreso de configuración.

**Resultado:** alguien que nunca ha usado Menuki puede explorar pantallas, pero debe deducir por su cuenta qué datos revisar primero y qué significa cada paso.

## Versión para PC

**Tamaño revisado:** 1280 × 720.

### Lo que funciona

- La barra lateral mantiene visibles las ocho áreas principales y permite cambiar de sección sin perder el contexto.
- La vista amplia separa bien los bloques de contenido y las tarjetas del menú muestran el tipo de comida y el resumen nutricional.
- La despensa incluye búsqueda y filtros por menús, stock y faltantes de comidas.
- En la compra se entiende que marcar artículos prepara la lista y que **Finalizar compra** actualiza la despensa.

### Fricciones encontradas

1. **No hay una acción principal para empezar.** La portada dirige a «Explorar mis 3 semanas»; revisar o completar el perfil queda como opción secundaria. No se indica si el perfil es opcional, incompleto o ya validado.
2. **Los datos de perfil parecen definitivos.** Se ven valores rellenados sin una marca visible que indique su procedencia o si el usuario los confirmó. Esto puede hacer que se confíe en objetivos calculados con datos que quizá no se han revisado.
3. **La portada mezcla tareas y mantenimiento.** El estado de la cuenta, las opciones de copia, el selector de semana y el recordatorio de copia aparecen junto al contenido del plan. La acción para entender o configurar la aplicación no destaca.
4. **La navegación no explica el orden recomendado.** Perfil, menú, compra y despensa están al mismo nivel; quien llega por primera vez no sabe por dónde comenzar.
5. **El detalle de la compra queda al final de una lista larga.** Con 48 productos pendientes en la cuenta revisada, conviene mantener el resumen y la acción para finalizar a mano mientras se recorre la lista.
6. **Se puede confundir un día planificado con una comida ya realizada.** El plan comenzaba el 13 de octubre y algunas acciones de registro aparecían disponibles para fechas futuras. Debe quedar claro cuándo se consumió la comida antes de descontar existencias.

## Versión para móvil

**Tamaño revisado:** 390 × 844, mediante vista adaptable del navegador.

### Lo que funciona

- La barra inferior permite cambiar de sección sin abrir un menú lateral.
- Las tarjetas se ajustan al ancho reducido y conservan nombres, cantidades y acciones principales.
- La compra separa los artículos por establecimiento y categoría, lo que ayuda a recorrerla en tienda.

### Fricciones encontradas

1. **Ocho destinos compiten en la barra inferior.** Las etiquetas son pequeñas y ocupan casi todo el ancho. Perfil, peso y guía tienen la misma presencia que Inicio, Menú y Compra.
2. **La primera pantalla exige mucho desplazamiento.** La cuenta, la decisión de datos, el aviso de copia y la presentación del plan ocupan espacio antes de llegar a la acción que orienta al usuario.
3. **La compra es un recorrido largo.** La lista tenía 48 productos pendientes y el botón para finalizar aparece después de los artículos. En un móvil usado mientras se compra, interesa poder consultar el progreso y finalizar sin volver al extremo de la página.
4. **Los títulos y textos se parten en muchas líneas.** En despensa y guía, los encabezados largos reducen el espacio disponible para las tareas y los campos.
5. **La despensa repite una indicación bajo cada campo.** El texto «Guardar al salir del campo» se repite en los productos; ocupa espacio y no ayuda a decidir qué cantidad introducir.
6. **La sincronización y las copias distraen del uso.** Los avisos y controles de cuenta ocupan una parte visible de la pantalla, incluso cuando la tarea es revisar el menú o la compra.

## Cambios que el propietario ya propone

El propietario aceptó aplicar estos cambios. Están implementados localmente en la rama `chore/ux-mobile-shopping`.

- **Eliminar la exportación y las referencias a exportar copias de la interfaz.** El botón de exportación y los avisos repetidos de descarga compiten con el uso diario. Revisar también las menciones de exportación en la guía.
- **Retirar el botón de sincronización manual si la sincronización automática cubre el uso normal.** El botón actual no se limita a la primera carga: también permite pedir una sincronización manual, mientras la app programa sincronizaciones automáticas tras los cambios. Si se retira, la interfaz debería explicar con claridad si los cambios están guardados y mostrar una acción para reintentar cuando falle. La decisión inicial entre copia local y Supabase es un caso distinto y debe conservar instrucciones claras.
- **Quitar «Guardar al salir del campo» de cada producto de la despensa.** La acción debe sentirse directa; cualquier confirmación de guardado puede ser discreta y aparecer solo tras un cambio.
- **Facilitar compras largas en móvil.** Añadir búsqueda por producto y mantener visibles el progreso de artículos marcados y el acceso a finalizar la compra.
- **Agrupar la navegación secundaria en móvil.** Mantener Inicio, Menú, Compra y Despensa en la barra inferior; colocar Recetas, Peso, Guía y Perfil bajo **Más**. La barra lateral de PC conserva los ocho destinos.

## Propuestas para mejorar el recorrido

### 1. Dar una bienvenida breve y un primer paso claro

Después del acceso, presentar una tarjeta de inicio con una secuencia sencilla:

1. **Revisa tu perfil** para ajustar los datos que afectan a los objetivos.
2. **Comprueba el menú** y entiende cómo cambiar una propuesta.
3. **Configura la despensa** o indica que prefieres hacerlo más tarde.
4. **Consulta la compra de la semana** y finalízala cuando hayas comprado.
5. **Registra las comidas** a medida que las completes.

Mostrar el paso actual y permitir saltar tareas que no sean necesarias todavía. El perfil no debería parecer completo por tener campos rellenados: distinguir los valores iniciales de los confirmados y explicar qué datos afectan a los cálculos.

### 2. Reducir la carga de Inicio

Priorizar una sola acción relevante, por ejemplo **Mi Perfil** si aún no está confirmado, o **Ver el menú de hoy** cuando ya lo esté. Dejar los detalles de sincronización y mantenimiento en un estado compacto o en Ajustes.

### 3. Elección entre copias — propuesta sustituida

Si aparecen **Usar versión de Supabase** y **Subir esta copia**, explicar antes de elegir:

- qué datos hay en cada copia y cuándo se actualizaron;
- qué datos se conservarán y cuáles podrían reemplazarse;
- cuál es la opción recomendada para esta cuenta.

Esta propuesta histórica fue sustituida por ADR-0017: el cambio normal de dispositivo se resuelve automáticamente y no presenta estas opciones.

### 4. Hacer más manejable la compra en móvil

La compra ahora ofrece búsqueda por producto, un resumen fijo de artículos marcados y pendientes y un botón **Finalizar compra** accesible durante el recorrido en móvil. Se explica que marcar un envase no actualiza la despensa; finalizar la compra añade los artículos marcados.

### 5. Simplificar la navegación móvil

La barra inferior mantiene Inicio, Menú, Compra y Actividad como destinos principales. Perfil, Despensa, Recetas y Guía aparecen bajo **Más**. La decisión está implementada localmente; queda comprobar el menú y las áreas seguras en teléfonos reales.

### 6. Separar planificación y registro

Marcar con claridad qué comidas son futuras y cuáles ya se pueden registrar. El registro debería corresponder a una comida completada y avisar del efecto sobre la despensa antes de descontar ingredientes.

## Prioridad recomendada

| Prioridad | Mejora | Motivo | Estado |
| --- | --- | --- | --- |
| Alta | Guiar la primera visita y pedir que se revise el perfil | Sin ello, los objetivos pueden parecer personalizados aunque no se hayan confirmado los datos. | Publicada. |
| Alta | Conciliar automáticamente los cambios al cambiar de dispositivo | Evita que el usuario tenga que escoger entre dos copias durante el uso normal. | Implementada localmente; publicación y validación pendientes. |
| Alta | Diferenciar el menú planificado de una comida registrada | Evita descontar despensa antes del consumo. | Implementada en rama; Publicada. |
| Media | Eliminar los avisos y controles de copia/sincronización según la propuesta del propietario | Reduce ruido en Inicio y en móvil. | Implementada en rama; publicación pendiente. |
| Media | Mejorar el recorrido de compra con lista larga en móvil | La compra es una tarea frecuente y se realiza mientras se consulta la pantalla. | Implementada en rama; prueba en teléfono pendiente. |
| Media | Eliminar el texto repetido de guardado en despensa | Libera espacio sin añadir información útil. | Implementada en rama; publicación pendiente. |
| Baja | Revisar el número y tamaño de destinos de navegación en móvil | Puede mejorar la lectura, pero debe validarse en dispositivos reales. | Implementada en rama; prueba en teléfono pendiente. |

## Qué falta validar

- Hacer un recorrido desde una cuenta realmente nueva y verificar que la guía dirige al perfil, desaparece después de confirmarlo y la marca se conserva tras iniciar sesión en otro dispositivo.
- Verificar en dos dispositivos que los cambios independientes se combinan, que el valor remoto prevalece cuando ambos cambian el mismo campo y que el borrado de una sesión llega al otro dispositivo.
- Confirmar que una comida futura no se puede registrar desde Inicio, el menú semanal ni el detalle de receta y que el control se habilita cuando llega la fecha.
- Probar en un teléfono físico la búsqueda, el contador, el botón fijo de compra, el menú **Más** y las áreas seguras.
- Verificar que la revisión remota se actualiza automáticamente, que **Reintentar** aparece solo tras un error y que el reinicio total sigue requiriendo confirmación. La restauración personal desde JSON se retiró de la interfaz.

La auditoría original describe observaciones de la interfaz publicada el 11 de octubre de 2026. Las mejoras indicadas y la actualización de conciliación e historial están en la copia local; quedan pendientes su publicación y las comprobaciones en dispositivos reales.
