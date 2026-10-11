# ADR-0008 — Acceso mediante correo y contraseña

- Estado: Aceptada; configuración de Supabase Auth e integración del HTML pendientes
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

- La cuenta puede iniciar sesión en varios dispositivos con el mismo correo y contraseña una vez implementada la integración.
- Sin verificar el correo, un error al escribirlo puede impedir recuperar la cuenta mediante ese correo. El usuario debe introducirlo correctamente y conservar acceso a él.
- El registro libre permite que otras personas creen cuentas propias si conocen la web. RLS debe mantener sus datos separados; se podrá cerrar el registro si la política cambia.
- La decisión no requiere migración de tablas. Quedan pendientes configurar Supabase Auth y conectar los formularios de registro e inicio de sesión del HTML.

## Referencias

- Modelo actual: `docs/supabase_db_model.md`.
- Estado de integración y prueba RLS: `supabase/README.md` y `docs/open-questions.md`.
