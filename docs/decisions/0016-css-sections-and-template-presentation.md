# Decisión 0016: organizar CSS y retirar estilos inline de las plantillas

- **Fecha:** 13 de octubre de 2026
- **Estado:** Aceptada e implementada
- **Alcance:** hoja de estilos y marcado generado por las plantillas del cliente

## Contexto

La primera etapa reunió en `assets/css/app.css` los estilos que estaban en varios bloques del HTML. Aun así, las plantillas de `js/main.js` mezclaban clases con atributos `style`, y las reglas responsive aparecían intercaladas con los estilos de cada mejora. Esto complicaba localizar los estilos de una vista y preparar una futura política CSP estricta.

## Decisiones

1. Mantener una única hoja CSS nativa. Separar visualmente sus secciones de base, shell, controles compartidos y vistas; agrupar las reglas responsive al final.
2. Retirar los atributos `style` de las plantillas de `js/main.js` y expresar reglas estáticas mediante clases CSS reutilizables.
3. Representar los porcentajes de avance con elementos `<progress>` y mantener las etiquetas accesibles en sus botones contenedores.
4. Renderizar la imagen del hero como `<img>` y validar su URL con la lista de orígenes HTTPS permitidos que ya usa el cliente.
5. Mantener intactos el dominio, los datos, la navegación responsive y la hoja `assets/css/app.css` como recurso único del shell.

## Consecuencias

- El CSS tiene reglas legibles por secciones, con los breakpoints después de los estilos base y de vista.
- Las plantillas JavaScript ya no escriben atributos `style`; los valores variables de las barras se expresan con `value` y `max` de `<progress>`.
- No se añaden dependencias ni un paso de compilación.
- La revisión visual publicada en GitHub Pages y en un dispositivo físico sigue pendiente.
