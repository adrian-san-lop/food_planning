# ADR-0032: Landing pública responsive de Menuki

- **Fecha:** 14 de octubre de 2026
- **Estado:** Aceptada e implementada localmente
- **Alcance:** entrada pública de GitHub Pages, presentación del producto y acceso a Auth

## Contexto

La raíz de GitHub Pages redirigía directamente a la aplicación autenticada. Una persona nueva no tenía una página que explicara qué ofrece Menuki antes de llegar al formulario de acceso. El propietario aprobó un mockup con una identidad cálida en verde y crema, cabecera fija y vistas para escritorio y móvil.

## Decisión

1. `index.html` será la landing pública; `menuki.html` conservará la aplicación autenticada y el formulario de acceso.
2. La cabecera permanece arriba al desplazarse y presenta el logo/nombre Menuki, **Mi Área** y **Registrarse** en ambos tamaños. Los enlaces Mi Área y Registrarse apuntan a la app; Registrarse usa `?auth=signup` para preseleccionar el modo de registro existente.
3. La portada explica el menú de tres semanas, recetas, compra, despensa y seguimiento. Incluye una demostración local interactiva del selector de días y de productos de compra; no modifica datos personales ni conecta esta demo con Supabase.
4. Las animaciones de entrada y flotación son decorativas. Las secciones principales siguen disponibles sin JavaScript y las animaciones se desactivan cuando `prefers-reduced-motion` está activo. La página usa HTML semántico, controles accesibles, CSS y JavaScript nativos, sin añadir dependencias externas.
5. La ilustración de producto se compone de componentes HTML/CSS y gráficos SVG; no se usan fotos genéricas de platos.
6. Las pantallas de acceso y registro incluyen un enlace visible de regreso a la landing. El modo de registro añade un footer con una descripción breve de Menuki y enlaces a la portada y a la sección «Cómo funciona». La política de privacidad propia se enlazará cuando sus datos y contenido se hayan verificado; no se publica un texto legal provisional.
7. El hero ocupa al menos el espacio visible restante tras la cabecera fija en cada tamaño de pantalla, para que «Sencillo desde el primer día» empiece al desplazarse. Su CTA «Ver cómo funciona» usa el estilo secundario de botón, con una flecha hacia abajo que anticipa la navegación a esa sección.
8. En escritorio amplio, el hero aprovecha más ancho y aumenta el titular, los controles y la demostración visual. En tabletas y móviles se mantienen las reglas adaptables existentes.

## Consecuencias

- La aplicación sigue disponible en `menuki.html` y no cambia su fuente de datos ni su flujo de autenticación.
- La página raíz usa rutas relativas para trabajar en GitHub Pages tanto en el dominio raíz como bajo la ruta del repositorio.
- La landing mantiene su CSS y JavaScript separados del shell y los estilos de la aplicación.
- El acceso y el registro pueden regresar a la presentación pública; el footer da contexto a las personas que crean una cuenta.
- La vista adaptable y los enlaces de registro deben comprobarse en navegador antes de publicar.
