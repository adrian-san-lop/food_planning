# ADR-0033: Acceso desde la landing en un diálogo

- **Fecha:** 15 de octubre de 2026
- **Estado:** Aceptada e implementada localmente
- **Alcance:** inicio de sesión y registro desde la landing pública

## Contexto

La landing llevaba a `menuki.html` al iniciar sesión o registrarse. Ese cambio de página hacía que el acceso pareciera desconectado de la presentación pública.

## Decisión

1. Las acciones de acceso y registro de `index.html` abren un diálogo modal sobre la landing. El diálogo incluye una X visible, se cierra con Escape y devuelve el foco al enlace que lo abrió.
2. El diálogo reutiliza el formulario existente de `menuki.html` dentro de un iframe del mismo origen. Se conservan las vistas de inicio de sesión, registro, recuperación y los mensajes actuales de Supabase Auth. El diálogo adapta su altura al formulario activo y oculta el footer informativo del registro; la página independiente mantiene ese footer.
3. El iframe comunica a la landing únicamente que Auth completó el acceso; no envía correo, credenciales ni datos personales por `postMessage`. La landing comprueba el origen y la ventana de origen, cierra el diálogo y abre `menuki.html` para continuar allí con la sesión persistida.
4. Si JavaScript o el elemento `<dialog>` no está disponible, los enlaces conservan su destino anterior como alternativa. `menuki.html` sigue ofreciendo el formulario independiente y su enlace para volver a la landing.
5. En escritorio, los formularios incluyen un enlace breve para cambiar directamente entre «Iniciar sesión» y «Crear cuenta». En móvil se omite el texto adicional bajo el formulario para conservar una ventana compacta. El footer y sus enlaces siguen disponibles solo cuando el formulario de registro se abre como página independiente.

## Consecuencias

- El acceso mantiene una sola implementación del formulario y de la lógica de Supabase Auth, con una presentación compacta que conserva los estilos de Menuki.
- Cerrar el diálogo antes de autenticar no cambia la sesión ni navega fuera de la landing.
- El flujo modal y sus destinos relativos deben comprobarse en escritorio y móvil antes de publicar.

## Referencias

- Decisión base de autenticación: `docs/decisions/0009-email-password-auth.md`.
- Landing pública: `index.html`, `assets/css/landing.css` y `js/landing.js`.
- Shell y autenticación: `menuki.html` y `js/main.js`.
