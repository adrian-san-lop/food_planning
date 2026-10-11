# Auditoría UX/UI de Menuki

- **Fecha:** 11 de octubre de 2026
- **Aplicación revisada:** [Menuki en GitHub Pages](https://adrian-san-lop.github.io/food_planning/menuki.html)
- **Alcance:** recorrido de primera visita y tareas habituales en escritorio y en vista móvil adaptable. Las observaciones describen la versión publicada durante la auditoría; el estado de implementación posterior se indica a continuación.

## Resumen

La app ofrece las secciones necesarias para consultar el menú, gestionar la despensa, preparar la compra y revisar el perfil. El problema principal es que, al iniciar sesión, no guía al usuario por un primer recorrido ni le indica si debe completar el perfil. La pantalla de inicio invita a explorar el menú, mientras muestra datos de perfil ya rellenados cuyo estado no se explica.

La primera visita también presenta una decisión sobre datos locales y Supabase, además de avisos y controles de copia. Todo ello compite con la pregunta más inmediata de un usuario nuevo: «¿Qué tengo que hacer para que el menú se adapte a mí y cómo empiezo?».

La experiencia cambia con el tamaño de pantalla: en escritorio las secciones se encuentran en una barra lateral; en móvil pasan a una barra inferior con ocho opciones. La compra y la despensa siguen siendo recorridos largos en móvil.

## Estado de las mejoras de prioridad alta

Las tres propuestas de prioridad alta están implementadas en el HTML de la rama `docs/ux-audit-pc-mobile`; la migración que guarda la confirmación del perfil también se aplicó en Supabase. Aún no se han publicado en GitHub Pages ni validado con un usuario nuevo y dos copias divergentes.

- **Primera visita y perfil:** Inicio guía por cinco pasos y dirige a revisar los valores genéricos. El perfil queda marcado como revisado al guardarlo; esa marca se sincroniza con Supabase.
- **Conflicto de copias:** un panel resume perfil, menú, comidas realizadas, movimientos de despensa, pesos, sesiones, compra y fechas de actualización, y explica qué se reemplaza o integra antes de elegir entre la copia local y Supabase.
- **Planificación y registro:** las comidas futuras aparecen como planificadas y el control para registrarlas está deshabilitado hasta la fecha correspondiente.

Las observaciones siguientes describen lo que se encontró antes de estas mejoras. Las propuestas de prioridad media y baja continúan pendientes.

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
- La despensa incluye búsqueda y filtros por menús, stock y déficit.
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

Estos puntos quedan registrados como propuestas de la siguiente iteración. No se han implementado en esta auditoría.

- **Eliminar la exportación y las referencias a exportar copias de la interfaz.** El botón de exportación y los avisos repetidos de descarga compiten con el uso diario. Revisar también las menciones de exportación en la guía.
- **Retirar el botón de sincronización manual si la sincronización automática cubre el uso normal.** El botón actual no se limita a la primera carga: también permite pedir una sincronización manual, mientras la app programa sincronizaciones automáticas tras los cambios. Si se retira, la interfaz debería explicar con claridad si los cambios están guardados y mostrar una acción para reintentar cuando falle. La decisión inicial entre copia local y Supabase es un caso distinto y debe conservar instrucciones claras.
- **Quitar «Guardar al salir del campo» de cada producto de la despensa.** La acción debe sentirse directa; cualquier confirmación de guardado puede ser discreta y aparecer solo tras un cambio.

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

Priorizar una sola acción relevante, por ejemplo **Revisar mi perfil** si aún no está confirmado, o **Ver el menú de hoy** cuando ya lo esté. Dejar los detalles de sincronización y mantenimiento en un estado compacto o en Ajustes.

### 3. Aclarar la elección cuando hay dos copias

Si aparecen **Usar versión de Supabase** y **Subir esta copia**, explicar antes de elegir:

- qué datos hay en cada copia y cuándo se actualizaron;
- qué datos se conservarán y cuáles podrían reemplazarse;
- cuál es la opción recomendada para esta cuenta.

Así la decisión se puede tomar con confianza sin que el usuario tenga que conocer cómo está implementada la sincronización.

### 4. Hacer más manejable la compra en móvil

Mantener visible un resumen breve —artículos marcados y pendientes— y facilitar el acceso a **Finalizar compra** durante el recorrido. Añadir búsqueda o filtros útiles si la lista completa resulta difícil de manejar. Explicar junto al control que marcar un artículo no actualiza la despensa hasta finalizar.

### 5. Simplificar la navegación móvil

Dar prioridad a Inicio, Menú, Compra y Despensa. Evaluar si Perfil, Peso, Recetas y Guía pueden agruparse bajo **Más**, con una etiqueta legible y un orden estable. Confirmar la decisión en teléfonos reales y con sus áreas seguras antes de cambiar la navegación.

### 6. Separar planificación y registro

Marcar con claridad qué comidas son futuras y cuáles ya se pueden registrar. El registro debería corresponder a una comida completada y avisar del efecto sobre la despensa antes de descontar ingredientes.

## Prioridad recomendada

| Prioridad | Mejora | Motivo | Estado |
| --- | --- | --- | --- |
| Alta | Guiar la primera visita y pedir que se revise el perfil | Sin ello, los objetivos pueden parecer personalizados aunque no se hayan confirmado los datos. | Publicada. |
| Alta | Aclarar qué hace cada opción al resolver un conflicto entre copias | El usuario puede temer perder información o seleccionar la copia equivocada. | Publicada. |
| Alta | Diferenciar el menú planificado de una comida registrada | Evita descontar despensa antes del consumo. | Implementada en rama; Publicada. |
| Media | Eliminar los avisos y controles de copia/sincronización según la propuesta del propietario | Reduce ruido en Inicio y en móvil. | Pendiente. |
| Media | Mejorar el recorrido de compra con lista larga en móvil | La compra es una tarea frecuente y se realiza mientras se consulta la pantalla. | Pendiente. |
| Media | Eliminar el texto repetido de guardado en despensa | Libera espacio sin añadir información útil. | Pendiente. |
| Baja | Revisar el número y tamaño de destinos de navegación en móvil | Puede mejorar la lectura, pero debe validarse en dispositivos reales. | Pendiente. |

## Qué falta validar

- Hacer un recorrido desde una cuenta realmente nueva y verificar que la guía dirige al perfil, desaparece después de confirmarlo y la marca se conserva tras iniciar sesión en otro dispositivo.
- Preparar dos copias divergentes y verificar los resúmenes, las consecuencias descritas y el resultado de cada opción.
- Confirmar que una comida futura no se puede registrar desde Inicio, el menú semanal ni el detalle de receta y que el control se habilita cuando llega la fecha.
- Probar compra, navegación y áreas seguras en un teléfono físico.
- Verificar qué mensajes aparecen cuando la sincronización automática funciona y cuando falla.

La auditoría original describe observaciones de la interfaz publicada el 11 de octubre de 2026. Las tres propuestas altas ya se implementaron localmente; las demás propuestas siguen sin implementarse.
