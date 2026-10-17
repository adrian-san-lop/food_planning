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
6. Al cerrar sesión desde la aplicación, limpiar su estado de cuenta y volver a la landing mediante `location.replace('./index.html')`, tanto desde Perfil como desde el menú móvil. El destino relativo conserva el prefijo de GitHub Pages y sustituye la entrada de la aplicación en el historial. Si `SIGNED_OUT` llega al iframe de acceso, conservar el formulario dentro del diálogo.
7. Actualización del 17/10/2026, revisada por el propietario: los enlaces a los borradores propios de privacidad y condiciones del formulario compartido abren un popup legal sobre la misma pantalla. En el iframe se envía solo el documento y ancla al padre, que valida origen, ventana emisora y diálogo de acceso abierto; el popup queda por encima de Auth y no dentro de su área recortada. Se conserva el formulario y al cerrar se restaura el foco. Al completar el acceso, los popups legales se cierran y no se añaden accesos ni avisos en la app autenticada. El footer completo sigue oculto en el modal; el registro independiente y la landing enlazan los cuatro borradores usando el mismo popup. Las páginas locales son la fuente única y alternativa sin JavaScript. La información no constituye consentimiento; contenido y pendientes figuran en `docs/requisitos-legales-y-acceso.md`.

## Consecuencias

- El acceso mantiene una sola implementación del formulario y de la lógica de Supabase Auth, con una presentación compacta que conserva los estilos de Menuki.
- Cerrar el diálogo antes de autenticar no cambia la sesión ni navega fuera de la landing.
- El flujo modal y sus destinos relativos deben comprobarse en escritorio y móvil antes de publicar.

## Referencias

- Decisión base de autenticación: `docs/decisions/0009-email-password-auth.md`.
- Landing pública: `index.html`, `assets/css/landing.css` y `js/landing.js`.
- Shell y autenticación: `menuki.html` y `js/main.js`.
