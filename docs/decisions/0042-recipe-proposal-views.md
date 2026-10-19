# ADR-0042: extraer las vistas de propuestas de recetas

- **Fecha:** 17 de octubre de 2026
- **Estado:** Implementada localmente; comprobación visual autenticada pendiente
- **Alcance:** organización de las vistas del cliente. No cambia el flujo de propuestas ni las RPC de Supabase.

## Contexto

`main.js` contenía las plantillas del formulario para proponer recetas y del buzón administrativo, además de sus acciones y llamadas remotas. Estas vistas forman una sección delimitada que puede renderizarse con estado y utilidades explícitas.

## Decisión

- Mover el formulario de propuesta, la vista administrativa y el formulario de edición a `js/ui/recipe-proposal-views.js`.
- Inyectar el estado actual mediante `getState`, junto con límites de campos, funciones de escape y formato de fecha.
- Desde el 19 de octubre, inyectar también el renderizador de iconos compartido para el dashboard comunitario «Datos arriba» aceptado en ADR-0021. Las vistas administrativas conservan su presentación; acciones, ayudas y conservación del foco siguen coordinándose desde `main.js`.
- Mantener captura/validación de formularios, navegación, carga, exportación y mutaciones del buzón en `main.js` y `js/persistence/recipe-proposals.js`.
- Probar el escape de los valores dinámicos, los límites visibles, la restricción visual admin y los estados de edición/carga.
- Mantener los módulos ES nativos y no introducir cambios de esquema, migraciones SQL, dependencias de producción ni compilación.

## Consecuencias

- Dos vistas coherentes salen de `main.js`; no se considera completa la extracción de UI.
- `main.js` sigue conteniendo la mayoría de vistas, todos los manejadores de eventos y la coordinación de Auth/sync.
- `npm test` ejecuta 34 pruebas locales; revisar el flujo autenticado en navegador y Supabase sigue pendiente.
- La cifra anterior describe la extracción inicial del 17 de octubre. No se han ejecutado pruebas para el cambio de presentación del 19 de octubre; su revisión visual en navegador y su envío autenticado están pendientes.
- La siguiente etapa de arquitectura puede separar otras vistas y, después, eventos por área. El coordinador cloud debe extraerse con pruebas de sus contratos y sin alterar conflictos HTTP 409, reintentos o conciliación.
