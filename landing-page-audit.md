# Auditoría de landing — Menuki

**Revisado:** `index.html`, `assets/css/landing.css` y `js/landing.js`. Revisión estática del código; no se obtuvo una captura renderizada en este turno. Las observaciones responsive se derivan de las reglas para 390 px.
**Categoría:** aplicación personal de planificación de comidas.
**Benchmarks:** omitidos — Landingfolio MCP no está conectado. Para comparar con secciones reales, se puede obtener un token gratuito y seguir las instrucciones de Codex en [Landingfolio MCP](https://www.landingfolio.com/mcp).

**Recorrido y aspecto (según el código):** cabecera fija color crema con navegación y acciones de cuenta; hero con titular serif, CTA y demostración interactiva del menú, la compra y la nutrición; después, pasos, herramientas, bloque de cierre, FAQ, CTA verde oscuro y pie. La paleta verde/crema y la alternancia de fondos dan una dirección visual coherente; el layout pasa a una columna bajo 1050 px.

**Secciones:** hero · how-it-works · feature × 8 · recipe highlight · call-to-action · FAQ · call-to-action · footer.

## Crítico

Sin hallazgos críticos en la revisión estática.

## Importante

### 1. Los objetivos táctiles quedan por debajo de 44 px en móvil

**Dónde:** cabecera, enlaces «Mi Área» y «Registrarse» (`index.html:30–32`); selector de días y lista de compra de la demostración (`index.html:62–85`). Reglas en `assets/css/landing.css:192,194`.
**Incumple:** [landing-page.md](.codex/landing-page-audit/references/landing-page.md), regla *Mobile (390px)* sobre objetivos táctiles.
**Por qué importa:** el botón de registro del encabezado tiene un mínimo de 36 px; «Mi Área» usa texto de 12 px con 8 px de relleno vertical. Los botones del selector y de la compra se quedan en 32 px. Son controles visibles y algunos permanecen en la cabecera fija, pero resultan más difíciles de tocar con precisión.
**Corrección:** dar a los enlaces de cuenta y a los controles de la demostración un área interactiva mínima de 44 px, manteniendo el tamaño visual del texto y los iconos.

### 2. El texto secundario pierde contraste sobre los fondos claros

**Dónde:** etiquetas `.eyebrow` y textos `.hero-note`, `.section-heading > p:last-child` y `.feature-card p` (`assets/css/landing.css:1,34,48,123,144`).
**Incumple:** [color.md](.codex/landing-page-audit/references/color.md), regla de contraste del texto.
**Por qué importa:** `--landing-muted` (#77877b) da aproximadamente 3,46:1 sobre `--landing-bg` (#f5f5ee) y 3,76:1 sobre `--landing-paper` (#fffefa). El naranja de las etiquetas, `--landing-orange` (#bd7854), da 3,21:1 sobre el fondo crema. Se usa en texto normal de 11–16 px, por lo que las etiquetas y descripciones secundarias se distinguen peor que el titular y el texto principal.
**Corrección:** oscurecer los dos colores de texto y comprobarlos contra ambos fondos claros; conservar el naranja como acento en elementos no textuales si se quiere mantener la paleta.

### 3. La demostración del producto queda demasiado pequeña en móvil

**Dónde:** tarjetas `.planner-card`, `.shopping-card` y `.nutrition-card` (`index.html:56–93`; `assets/css/landing.css:192,194`).
**Incumple:** [images.md](.codex/landing-page-audit/references/images.md), regla de legibilidad del texto dentro de una visual de producto.
**Por qué importa:** a 390 px, las etiquetas de semana bajan a 8 px, algunos subtítulos y notas a 7–8 px, los nombres de comidas a 10 px y los productos a 9 px. La demostración ocupa buena parte del hero, pero esos detalles no permiten entender con claridad qué muestra.
**Corrección:** simplificar la demo móvil a una tarjeta principal con menos filas y tipografía mayor, o mostrar solo un recorte legible del plan y dejar compra y nutrición para secciones posteriores.

## Menor

### 4. El espaciado usa muchos valores puntuales

**Dónde:** separación de secciones en `.how-section`, `.features-section`, `.calm-section` y `.faq-section` (`assets/css/landing.css:118,135,147,155`), además de sus reglas móviles.
**Incumple:** [spacing.md](.codex/landing-page-audit/references/spacing.md) y [consistency.md](.codex/landing-page-audit/references/consistency.md), reglas sobre una escala de espaciado compartida.
**Por qué importa:** conviven valores como 91/96, 110, 92 y 104 px en escritorio, y 68/72/73/76 px en móvil. Aunque la separación entre secciones es clara, los valores cercanos pueden hacer que nuevas secciones o ajustes futuros se desvíen del ritmo actual.
**Corrección:** definir unos pocos tokens de espaciado para secciones, grupos y tarjetas, y asignarles los valores actuales que mejor encajen.

## Qué funciona

- El primer bloque identifica el producto y su propuesta —menú de tres semanas, recetas y compra— y presenta una acción principal junto a una demostración del producto (`index.html:38–50`).
- La acción principal y «Ver cómo funciona» tienen niveles visuales distintos; las llamadas a registro se repiten al avanzar por la página.
- La página alterna fondos y reserva el verde oscuro para el CTA final, y mantiene una familia serif para titulares y sans serif para el cuerpo.
- La demostración está marcada como ejemplo, y el JavaScript limita su interacción a cambiar comidas y marcar productos; no se conecta con datos personales (`index.html:50,76,81`; `js/landing.js`).

## Siguiente paso

¿Quieres que aplique los tres hallazgos importantes y deje el ajuste de espaciado como pulido opcional?
