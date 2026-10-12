# ADR-0009 — Acceso mediante correo y contraseña

- Estado: Aceptada; Supabase Auth y el formulario HTML están configurados; quedan publicación y pruebas de aislamiento
- Fecha: 2026-10-11
- Alcance: registro e inicio de sesión para sincronización personal y multiusuario futura

## Decisión

- Usar correo electrónico y contraseña para registrarse e iniciar sesión. No habrá nombre de usuario como identificador de acceso.
- Permitir el registro libre: cualquier persona podrá crear su propia cuenta mientras esta política siga activa.
- No exigir confirmación ni validación del correo electrónico al registrarse.
- Supabase Auth administrará la identidad y las credenciales en `auth.users`. No guardar contraseñas ni duplicar el correo en las tablas públicas de la aplicación.
- No añadir una tabla o columna de autenticación. La tabla existente `public.profiles` conserva los parámetros nutricionales y se relaciona con Auth mediante `user_id`; se crea cuando el usuario complete los datos requeridos del perfil.
- Mantener RLS por `auth.uid()` para que cada cuenta acceda solo a sus propios datos.

## Consecuencias

- La cuenta puede iniciar sesión en varios dispositivos con el mismo correo y contraseña; compartir datos requiere publicar y validar la sincronización descrita en ADR-0010.
- Sin verificar el correo, un error al escribirlo puede impedir recuperar la cuenta mediante ese correo. El usuario debe introducirlo correctamente y conservar acceso a él.
- El registro libre permite que otras personas creen cuentas propias si conocen la web. RLS debe mantener sus datos separados; se podrá cerrar el registro si la política cambia.
- La decisión no requiere duplicar credenciales en tablas públicas. Supabase Auth y los formularios HTML están configurados; Auth administra la cuenta y la contraseña.

## Referencias

- Modelo actual: `docs/supabase_db_model.md`.
- Estado de integración y prueba RLS: `supabase/README.md` y `docs/open-questions.md`.
