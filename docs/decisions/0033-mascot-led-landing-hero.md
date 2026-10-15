# ADR-0033: Hero de landing con la mascota como guía

- **Fecha:** 14 de octubre de 2026
- **Estado:** Aceptada e implementada
- **Alcance:** hero y cabecera de `index.html` en escritorio y tablet

## Contexto

El propietario eligió una referencia cálida con el texto a la izquierda, la mascota en el centro y el menú completo junto a una columna de compra y nutrición. La decisión 5 de ADR-0032, que limitaba el hero a gráficos HTML/CSS sin fotografía, queda sustituida por esta decisión para el hero. También se actualizan la altura de escritorio y el tratamiento de la cabecera. Las tarjetas de recetas de la aplicación siguen sin fotografías.

## Decisiones

1. Mantener la tipografía de Menuki y el subtítulo actual. Presentar «¿Qué comemos hoy?» en verde oscuro y «Ya está resuelto.» en terracota, con saltos explícitos en escritorio.
2. Mantener los destinos de las acciones. En escritorio y tablet, el registro usa un botón verde con flecha y «Ver cómo funciona» un botón con borde verde e icono de reproducción a la izquierda. Su distribución sigue la referencia y conserva la fuente actual.
3. Añadir debajo tres ventajas con iconos de hoja, carrito y corazón: recetas rápidas, compra automática y alimentación más equilibrada.
4. Distribuir la demostración mediante una cuadrícula: mascota grande, menú íntegro y una columna de compra/nutrición. La mascota queda en primer plano sobre el borde del menú sin tapar su contenido. Se eliminan los solapamientos entre tarjetas, el relleno artificial del menú y los anillos decorativos de la versión anterior.
5. Usar una sola fotografía coherente, `assets/images/landing/menuki-hero-scene.jpg`, con el plato integrado en la encimera, abajo a la derecha. El fondo queda claro detrás del texto; su anclaje a la derecha conserva el margen del plato al cambiar el ancho. Es decorativo y no representa una receta del catálogo.
6. En pantallas de más de 640 px, superponer la cabecera fija sobre el fondo: transparente y sin desenfoque al principio; recuperar su color actual, borde, desenfoque y sombra mediante la clase existente `is-scrolled`. Los enlaces de secciones quedan junto a la marca y los de cuenta, a la derecha.
7. En tablet, colocar el texto antes de la demostración cuando falta ancho. Por debajo de 900 px, compra y nutrición pasan a una fila inferior. La fotografía ocupa la zona inferior y se funde con el fondo claro. En móvil se conserva el hero compacto, sin fotografía ni mascota en el hero; mantiene la nota y el botón con flecha hacia abajo.
8. Conservar la aparición adicional de la mascota en la llamada final a la acción.

## Consecuencias

- En escritorio y tablet, el hero ocupa como mínimo toda la altura actual de la pantalla mediante `100dvh`, con alternativas `100svh` y `100vh`; puede crecer si el contenido necesita más espacio. La cabecera fija se superpone al hero. En móvil se mantiene el mínimo de alto visible bajo la cabecera.
- Las tarjetas siguen siendo una demostración interactiva sin datos personales; la app autenticada no cambia.
- La fotografía es un recurso relativo apto para GitHub Pages. Sustituye a la cocina y al recorte del plato que se habían preparado por separado.
- La imagen se generó con la herramienta integrada `imagegen` a partir de la referencia del propietario. Solo se convirtió a JPEG (calidad 94, sin redimensionar) para su publicación.
- ADR-0032 sigue definiendo el resto de la landing y el acceso a Auth.

## Prompts de imagen

La primera generación reconstruyó únicamente la cocina de la referencia, sin texto, mascota ni interfaz. La edición final conservó la escena y redujo el conjunto del plato para separarlo del lateral.

<details>
<summary>Prompt de generación inicial</summary>

```text
Use case: background-extraction / photorealistic-natural.
Asset type: production website hero background, wide 2.25:1 landscape, 2560x1140 or nearest wide landscape. Use the attached reference image as the exact art-direction guide, but recreate ONLY the kitchen background of its TOP hero, not the bottom feature section.
Primary request: extract/reconstruct a coherent photographic background with identical warm cream/ivory sunlit kitchen, softly blurred green plants and wooden accents in the rear on the right, pale stone countertop stretching across the lower third, and a beautiful shallow ceramic bowl of creamy pasta with spinach and mushrooms in the lower-right foreground on a wooden serving board. The bowl should be fully inside the horizontal frame, with its center around 79% of width, its left edge around 67%, its right edge around 92%, and lower edge around 97%; it must feel photographed in the same scene, with natural contact shadows and perspective, never pasted or cut out. Have nearby subtle herb leaves and cream linen only as shown in reference. Left 35-40% should be almost white warm ivory with a smooth natural photographic fade, ample very calm empty space for dark green headline and buttons; gradually reveal kitchen toward the right. Middle 40-65% remains empty countertop with soft background, to stand a mascot and product UI on later in HTML. Preserve the soft depth, warm daylight and 3D sense of the reference.
REMOVE EVERY foreground UI element: no mascot, no cartoon characters, no text or lettering of any kind, no logo, no navigation, no buttons, no app cards, no illustrations, no floating translucent rings, no bottom feature cards. No hard collage boundaries or rectangular cutouts. Keep left blank and bright without blurring food. The result is ONLY a full-bleed photographic backdrop ready to use unchanged behind our HTML hero.
```

</details>

<details>
<summary>Prompt de edición final</summary>

```text
Use case: precise-object-edit. Asset type: website photographic hero background. Edit the provided kitchen photograph only. Keep the entire kitchen, plants, warm daylight, perspective, pale ivory fade on the left, and empty middle countertop exactly unchanged. Make ONE targeted composition change: scale the whole foreground food still-life (pasta bowl, wooden serving board, linen, loose herb leaves and garlic) to about 75% of its current size, and reposition it so that the ceramic bowl is centered at 78% of image width, its rightmost rim is at 90% of image width (a clearly visible 10% empty horizontal margin to its right), and its bottom is about 94% of image height. Maintain natural contact shadows and the same camera perspective. Reconstruct the uncovered countertop seamlessly. The ceramic bowl must be fully inside the frame, not cut by either side; the lower edge of the serving board/linen can meet the bottom of frame. The backdrop needs plenty of empty counter in the middle to stand a mascot and HTML UI in front. Retain the original image aspect ratio and photograph quality. No text, characters, logos, UI, border, gradients drawn on top, or collage seams.
```

</details>

