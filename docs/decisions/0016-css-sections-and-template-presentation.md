# Decisión 0016: organizar CSS y retirar estilos inline de las plantillas

- **Fecha:** 13 de octubre de 2026
- **Actualización:** 16 de octubre de 2026, estilo claro y tipografía Roboto
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
10. El 16 de octubre, organizar Mi perfil como un dashboard adaptable al ancho y al alto. En escritorio amplio y alto, datos personales y actividad/ajustes comparten la fila superior, los objetivos quedan debajo y el resultado ocupa la columna derecha. En portátiles, las tarjetas se apilan junto al resultado. Tablets apaisadas usan navegación lateral de iconos y resumen superior; distribuyen el formulario en tres columnas cuando tienen menos altura. Móvil y ventanas bajas mantienen flujo vertical. En móvil, los KPI Peso, Energía y Mantenimiento se separan en subtarjetas sin notas y cada objetivo ocupa una fila. Mantener las explicaciones en ayudas de hover/foco o toque y en un diálogo abierto con «Cómo calcula Menuki». «Guardar cambios» no lleva icono. La edición previa al guardado solo modifica la vista previa; los cálculos, la aplicación de cambios, la confirmación del perfil y la restauración de valores no cambian.

## Consecuencias

- El CSS tiene reglas legibles por secciones, con los breakpoints después de los estilos base y de vista.
- Las plantillas JavaScript ya no escriben atributos `style`; los valores variables de las barras se expresan con `value` y `max` de `<progress>`.
- No se añaden dependencias ni un paso de compilación.
- La revisión visual publicada en GitHub Pages y en un dispositivo físico sigue pendiente.
- Mi perfil adapta la distribución sin escalar el documento completo ni ocultar controles. La variante de panel se activa desde 768 px de alto; ventanas bajas y móvil conservan el desplazamiento. Sus ayudas admiten ratón, teclado o toque. La distribución se revisó por HTTP con el shell, CSS, plantillas y eventos reales, usando datos sintéticos locales en lugar de una sesión de Supabase.
- ADR-0018 retiró posteriormente las fotografías de platos y sus referencias del catálogo; se mantienen las imágenes de marca.
- La actualización está implementada localmente. Se revisaron escritorio, portátil, tablet y móvil, incluidos metabolismo manual, recuperación activa y perfil sin confirmar. Las nueve pruebas existentes pasan; no se añadieron pruebas nuevas. La publicación, los dispositivos físicos y la sincronización autenticada no forman parte de esta comprobación local.
