# Decisión 0015: fijar el cliente y reforzar comprobaciones del front-end

- **Fecha:** 12 de octubre de 2026
- **Estado:** Aceptada e implementada
- **Alcance:** dependencia del cliente web, pruebas locales y renderizado de valores variables

## Contexto

La auditoría front-end identificó que Supabase JS se cargaba sin fijar el parche, no había una suite pequeña para lógica de cliente y el uso de plantillas con `innerHTML` dependía de escapar correctamente cada valor variable. La aplicación seguirá siendo estática y conservará GitHub Pages, Supabase, el estado v8 y los contratos actuales.

## Decisiones

1. Fijar el script CDN de `@supabase/supabase-js` a la versión exacta `2.117.3`, publicada como versión estable el 7 de octubre de 2026 ([registro de releases del proyecto](https://github.com/supabase/supabase-js/releases/tag/v2.117.3)). Mantener la clave publishable y las protecciones RLS existentes.
2. Añadir una suite local con el ejecutor integrado de Node.js, sin dependencias de npm en producción ni paso de compilación. Requerir Node.js 20 o posterior para ejecutar `npm test`.
3. Centralizar el escape de texto/atributos y la validación de URL HTTPS por origen permitido en `js/ui/html.js`. Escapar los valores variables de catálogos y estado personal antes de insertarlos en plantillas; validar los IDs de alimentos y recetas con el patrón ya descrito por los JSON Schema.
4. Mantener una revisión gradual de `innerHTML`. Estas pruebas no sustituyen la comprobación visual en navegador, Auth/sincronización publicados ni el aislamiento RLS con dos cuentas.

## Consecuencias y validación

- `menuki.html` carga la dependencia desde una URL de versión exacta. Al no haber compilación, no se requiere archivo de bloqueo npm para producción.
- `npm test` cubre fechas civiles en los cambios de horario, conversiones de inventario, contratos de catálogos, escape HTML/atributos y rechazo de URL no permitidas. No introduce un runtime adicional a la web publicada.
- Los catálogos JSON siguen siendo canónicos para los datos genéricos. Supabase relacional sigue siendo la fuente remota canónica de los datos personales; `localStorage` sigue siendo la copia de trabajo.
- El [paquete 7](../planner/package-7-integration.md) comprueba Auth/PostgREST y aislamiento personal con dos cuentas reales. El propietario confirma que la versión actual funciona en PC y móvil; no se volvió a ejecutar una auditoría exhaustiva de cada flujo descrito en este registro.
