# Decisión 0016: organizar CSS y retirar estilos inline de las plantillas

- **Fecha:** 13 de octubre de 2026
- **Actualización:** 21 de octubre de 2026, resumen compacto de Mi perfil con minitarjetas; se conserva el estilo claro y Roboto del 16 de octubre
- **Estado:** Aceptada e implementada; la decisión sobre la imagen del hero quedó sustituida por ADR-0018
- **Alcance:** hoja de estilos y marcado generado por las plantillas del cliente

## Contexto

La primera etapa reunió en `assets/css/app.css` los estilos que estaban en varios bloques del HTML. Aun así, las plantillas de `js/main.js` mezclaban clases con atributos `style`, y las reglas responsive aparecían intercaladas con los estilos de cada mejora. Esto complicaba localizar los estilos de una vista y preparar una futura política CSP estricta.

## Decisiones

1. Mantener una única hoja CSS nativa. Separar visualmente sus secciones de base, shell, controles compartidos y vistas; agrupar las reglas responsive al final.
2. Retirar los atributos `style` de las plantillas de `js/main.js` y expresar reglas estáticas mediante clases CSS reutilizables.
3. Representar los porcentajes de avance con elementos `<progress>` y mantener las etiquetas accesibles en sus botones contenedores.
4. Renderizar la imagen del hero como `<img>` y validar su URL con la lista de orígenes HTTPS permitidos que ya usa el cliente.
5. Mantener intactos el dominio, los datos, la navegación responsive y la hoja `assets/css/app.css` como recurso único del shell.
6. La actualización visual aprobada el 16 de octubre utiliza Roboto en la aplicación y los formularios de acceso. Se incluye el archivo variable latino de [Fontsource Roboto 5.2.9](https://www.jsdelivr.com/package/npm/@fontsource-variable/roboto?version=5.2.9), con pesos 100–900 y `font-display: swap`. `menuki.html` precarga el mismo WOFF2 que referencia la hoja CSS; el navegador lo recibe del propio sitio. La licencia original SIL OFL se conserva en `assets/fonts/Roboto-OFL.txt`.
7. Concentrar la paleta en un solo `:root`: superficies blancas, fondo gris neutro, texto oscuro, verde esmeralda para acciones y selección, bordes claros y roles separados para aviso, error y macronutrientes. Sustituir colores sueltos por esas variables y retirar el segundo bloque que sobrescribía el fondo.
8. Sustituir los encabezados Georgia por Roboto con mayor peso; conservar el contenido y la geometría responsive. Usar tarjetas de radio 16 px y diálogos de 18 px, sombras discretas y fondos planos. Las barras vacías siguen neutras; proteínas, hidratos y grasas comparten sus respectivos colores violeta, azul y ámbar en escritorio y móvil.
9. En Inicio, el acceso a menú completo recibe el énfasis principal y Cambiar fecha usa un botón con borde. El resumen práctico del día tiene reglas de texto específicas para que el estilo genérico de párrafos no reduzca su tamaño. La gráfica de peso utiliza la misma paleta mediante variables CSS, sin cambiar sus datos.
10. La revisión de Mi perfil del 21 de octubre sustituye las dos tarjetas estiradas por un resumen único ajustado al contenido. Objetivo diario queda arriba, con el objetivo elegido y la recuperación activa; las calorías aumentan de tamaño y los macros usan tres minitarjetas con iconos de huevo, cereal y aceite en sus colores establecidos. Datos del cálculo (Peso, En reposo y Mantenimiento) se integra debajo, separado por una línea. El resumen se alinea arriba a la derecha del formulario; según el ancho útil pasa a una cabecera horizontal y, en espacios más estrechos, al flujo apilado. Datos personales centra sus campos en ambas direcciones; los objetivos usan iconos contenidos y una o dos columnas según el espacio de la tarjeta. Conservar el menú lateral compartido y sus iconos originales. Adaptar separaciones y tamaños de forma fluida al ancho y al alto, sin estirar la tarjeta de resumen. En móvil, los tres datos del cálculo se alinean en subtarjetas sin notas y cada objetivo ocupa una fila. Mostrar solo una frase del nivel de movimiento elegido y trasladar las seis descripciones al diálogo «Comparar niveles», que también permite seleccionar una rutina. Las ayudas de hover/foco o toque y «Cómo calcula Menuki» conservan el detalle adicional. «Guardar cambios» no lleva icono. La edición y la selección dentro del diálogo solo modifican la vista previa hasta guardar; los cálculos, la aplicación de cambios, la confirmación del perfil y la restauración de valores no cambian.

## Consecuencias

- El CSS tiene reglas legibles por secciones, con los breakpoints después de los estilos base y de vista.
- Las plantillas JavaScript ya no escriben atributos `style`; los valores variables de las barras se expresan con `value` y `max` de `<progress>`.
- No se añaden dependencias ni un paso de compilación.
- La revisión visual publicada en GitHub Pages y en un dispositivo físico sigue pendiente.
- Mi perfil adapta la distribución sin escalar el documento completo ni ocultar controles. Desde 851 px de ventana usa el alto visible como mínimo, con tamaños y separaciones fluidos. Las consultas al contenedor reorganizan el contenido al disponer de 830 px útiles o menos y lo apilan por debajo de 640 px. La tarjeta de objetivo cambia a dos columnas de opciones cuando su interior alcanza 310 px. En ventanas bajas se compacta el resumen y las descripciones secundarias de objetivos se consultan al pasar el ratón. El contenido mantiene mínimos legibles y puede desplazar la página si el espacio es insuficiente, también al introducir metabolismo manual, mostrar la revisión inicial o configurar un ciclo. La barra de acciones ocupa su propia fila, sin tapar el formulario. Sus ayudas admiten ratón, teclado o toque. «Comparar niveles» usa un diálogo nativo, admite cierre por botón, fondo y Escape y restaura el foco al origen.
- ADR-0018 retiró posteriormente las fotografías de platos y sus referencias del catálogo; se mantienen las imágenes de marca.
- Comprobación histórica del 16 de octubre: la distribución anterior se revisó por HTTP con el shell, CSS, plantillas y eventos reales y datos sintéticos locales. Cubrió escritorio, portátil, tablet y móvil, incluidos metabolismo manual, recuperación activa y perfil sin confirmar; pasaron las nueve pruebas existentes sin añadir otras. Estos resultados no validan la revisión del 18 de octubre.
- La revisión del 21 de octubre está implementada localmente con revisión del código. No se han ejecutado pruebas ni comprobaciones visuales en navegador para esta revisión. La publicación, los dispositivos físicos y la sincronización autenticada siguen pendientes.
