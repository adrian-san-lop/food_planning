# ADR-0034: Validación de los formularios de acceso

- **Fecha:** 15 de octubre de 2026
- **Estado:** Aceptada e implementada localmente
- **Alcance:** formularios de inicio de sesión, registro y recuperación de contraseña

## Contexto

Los formularios aceptaban contraseñas sin límites visibles, no permitían comprobar lo escrito y el registro no verificaba una segunda vez la contraseña. También faltaba una validación clara del formato del correo.

## Decisión

1. Validar el correo con el formato habitual: una parte local y un dominio con etiquetas válidas, al menos un punto y límites de longitud. El campo se recorta antes del envío.
2. Exigir una contraseña de 6 a 20 caracteres, con al menos un dígito y al menos uno de estos símbolos: `¡!._-@*`. Solo se permiten letras, dígitos y esos símbolos.
3. Aplicar la política de contraseña a inicio de sesión y recuperación además del registro. La misma política es coherente con la decisión del propietario de retirar las cuentas actuales posteriormente.
4. Solicitar una segunda contraseña durante el registro y mostrar en vivo si coincide con la primera; impedir el envío si está vacía o no coincide.
5. Añadir un control accesible de mostrar/ocultar en cada campo de contraseña.

La validación en la interfaz mejora la entrada de datos, pero no sustituye las reglas que Supabase Auth pueda imponer en el servidor.

## Consecuencias

- El usuario recibe errores concretos antes de enviar el formulario y puede comprobar lo que ha escrito.
- La regla se comparte entre el formulario independiente y el diálogo de acceso de la landing.
- Al iniciar sesión, las cuentas con contraseñas que incumplan la política deberán actualizarse para volver a entrar.

## Referencias

- Decisión base de autenticación: `docs/decisions/0009-email-password-auth.md`.
- Formulario y validación: `menuki.html` y `js/main.js`.
- Estilos del formulario: `assets/css/app.css`.
