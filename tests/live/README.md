# Integración optativa con Supabase real

Esta batería crea **dos cuentas Auth nuevas** y modifica solo su estado. No utiliza un inicio de sesión personal, claves administrativas ni secretos del servidor. Requiere autorización del propietario antes de ejecutarla. `npm test` no la invoca.

Desde la raíz, con Node 20 o posterior y acceso a la red:

```powershell
$env:MENUKI_LIVE_TEST_PROJECT = 'vkcedxvnmbmrmwvanznx'
node tests/live/planning-persistence.mjs
Remove-Item Env:MENUKI_LIVE_TEST_PROJECT
```

Sin esa variable se realiza únicamente la comprobación previa de configuración y registro, sin crear cuentas ni escribir en Supabase. La batería comprueba el proyecto exacto y que no se envíen correos de confirmación. Usa el transporte real de la aplicación con un adaptador HTTP mínimo. No altera el esquema ni ejecuta migraciones.

Al finalizar se reinicia exclusivamente el estado de las cuentas etiquetadas para esa ejecución. No elimina usuarios Auth: genera un `cleanup-auth.sql` que el propietario puede revisar y ejecutar en SQL Editor. Antes de borrar, el SQL exige IDs, prefijo de correo y etiqueta de la misma ejecución y excluye cuentas admin.

El directorio temporal que se indica al terminar contiene `session.json` con **contraseñas y tokens** para poder reanudar la misma pareja si falla una comprobación. No subirlo, servirlo por HTTP ni copiarlo al repositorio. `prepareLiveRun({resumeDirectory})`, `runLiveChecks(run)` y `clearTestState(run)` permiten repetir con la pareja existente sin crear más cuentas; conservan la verificación de identidad/etiqueta. Una repetición requiere estado de prueba vacío y ninguna pestaña de la aplicación escribiendo sobre esas cuentas. No ejecutar otra vez la entrada de creación para reintentar la misma prueba.

Conservar solo los resultados sanitizados y el SQL acotado de limpieza; retirar el archivo privado de sesión al finalizar. La evidencia del 23/10/2026 está en [el registro del paquete 7](../../docs/planner/package-7-integration.md). El archivo de [limpieza de esa ejecución](cleanup/20261023-package7-test-accounts.sql) solo sirve para sus dos cuentas concretas.
