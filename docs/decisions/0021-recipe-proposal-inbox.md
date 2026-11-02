# Decisión 0021: buzón compartido de propuestas de recetas

- **Fecha:** 13 de octubre de 2026
- **Actualización:** 19 de octubre de 2026, formulario de propuestas en modo dashboard con «Datos arriba»
- **Estado:** Aceptada; migración aplicada y admin asignado según el propietario; publicación y validación pendientes
- **Alcance:** envío de ideas de recetas, revisión administrativa y limpieza posterior al alta manual en los catálogos

## Contexto

`data/foods.json` y `data/recipes.json` son los catálogos genéricos versionados que consume Menuki. Las personas que usan la app pueden proponer ideas, pero no deben publicar directamente datos sin cantidades o revisión nutricional. El administrador usará IA como apoyo para convertir cada idea en una receta detallada y actualizará los JSON mediante el flujo Git del repositorio.

## Decisiones

1. Toda cuenta autenticada puede enviar una propuesta formada por tipo (`desayuno`, `comida`, `snack`, `cena`), nombre, ingredientes de texto libre y pasos ordenados. El nombre admite hasta 120 caracteres; cada propuesta admite hasta 30 ingredientes de 160 caracteres y 30 pasos de 500 caracteres.
2. El formulario empieza con un ingrediente y un paso y permite añadir más. No exige cantidades, raciones, kcal, nutrientes, fotografías ni otros datos de catálogo. La propuesta no se presenta como receta publicada.
3. Guardar la cabecera, los ingredientes y los pasos en tres tablas relacionadas; no almacenar el envío como una columna JSON. La cabecera conserva `submitter_id`, `client_id`, tipo, nombre y fecha. La clave `(submitter_id, client_id)` hace idempotentes los reintentos del cliente.
4. El envío usa `submit_recipe_proposal`, una RPC transaccional separada de `sync_menuki_state`. Las propuestas son contenido compartido, no parte del estado personal de una cuenta.
5. Usar `menuki_admins` para asignar roles y `is_menuki_admin()` para comprobarlos. El propietario concede el rol desde SQL Editor después de que exista la cuenta de Auth. El navegador no puede asignar roles y no contiene una contraseña administrativa.
6. La cuenta normal puede enviar una propuesta, pero no leer el buzón, consultar propuestas ajenas, modificar filas o borrar registros. El administrador lee mediante RLS y corrige o descarta propuestas individuales únicamente mediante las RPC admin-only definidas en [ADR-0023](0023-admin-recipe-proposal-review-actions.md).
7. La IA se usa fuera de la app. El administrador concreta una receta para una persona, revisa las fuentes y cantidades, añade primero los alimentos nuevos a `foods.json` y después incorpora la receta a `recipes.json`. La app obtiene kcal y nutrientes del catálogo; el formulario no genera esos valores.
8. El tipo `snack` del formulario se asigna a `media` o `tarde` al preparar la receta, porque esos son los tipos existentes del catálogo.
9. Cuando todas las propuestas se hayan incorporado y publicado, el administrador puede eliminar todo el buzón con `clear_recipe_proposals`. El botón muestra el total y pide confirmación; el RPC valida el recuento esperado y bloquea altas concurrentes. Si el buzón cambió, la limpieza falla y exige actualizarlo y confirmar de nuevo.
10. La purga elimina solo las propuestas, ingredientes y pasos. No toca credenciales, roles ni datos personales. PostgreSQL puede reutilizar el espacio eliminado sin reducir inmediatamente el tamaño total informado.
11. Presentar el formulario comunitario con el diseño «Datos arriba»: tipo y nombre en una tarjeta superior, Ingredientes y Preparación en dos tarjetas paralelas y envío en un pie propio. Las cuatro opciones de tipo son radios nativos con apariencia de botones. En escritorio, portátil y tablet apaisada, la altura disponible se reparte entre cabecera, metadatos, listas y acciones; solo las listas se desplazan cuando crecen. Mantener móvil y ventanas pequeñas en flujo vertical y conservar la navegación lateral compartida. Las ayudas de campos se consultan con ratón, teclado o toque; «¿Qué ocurre después de enviarla?» abre una explicación breve en un diálogo nativo con cierre por botón, fondo o Escape y retorno del foco. Mostrar el recuento de filas y los caracteres al editar, sin repetir textos de límites bajo cada entrada. Añadir y quitar conserva los borradores y la posición de las listas y enfoca el campo correspondiente. La actualización se limita al formulario comunitario: no cambia la revisión administrativa ni la persistencia.

## Consecuencias

- La entrada del catálogo requiere juicio administrativo; una propuesta no altera los menús ni el catálogo activo.
- La interfaz no accede a GitHub ni mantiene una clave de escritura. Los cambios de catálogo pasan por edición, revisión y publicación del repositorio.
- La migración `20261013160000_recipe_proposal_inbox.sql` añade `menuki_admins`, `recipe_proposals`, `recipe_proposal_ingredients` y `recipe_proposal_steps`. Los contenidos se aíslan mediante RLS y permisos mínimos.
- El propietario informa que ejecutó la migración y la asignación inicial del rol. La publicación y la validación de RLS con cuentas normal y admin siguen pendientes.
- El dashboard del 19 de octubre está implementado localmente en la vista, el shell y sus eventos. Conserva las validaciones y el envío existente mediante `submit_recipe_proposal`, sin añadir tablas, migraciones, dependencias ni estados de borrador remotos. Se ha revisado el código; no se han añadido ni ejecutado pruebas ni se ha comprobado este rediseño en navegador. Publicación y validación autenticada permanecen pendientes.

## Referencias

- Migración: `supabase/migrations/20261013160000_recipe_proposal_inbox.sql`.
- Cliente del buzón: `js/persistence/recipe-proposals.js`.
- Modelo de datos: `docs/supabase_db_model.md`.
- Guía de configuración: `supabase/README.md`.
- Requisitos del producto: `docs/product/requirements.md`.
