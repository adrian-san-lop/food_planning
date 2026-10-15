# Decisión 0023: edición y borrado individual de propuestas

- **Fecha:** 13 de octubre de 2026
- **Estado:** Aceptada; cliente y migración de acciones individuales aplicados según el propietario; purga global corregida en migración undécima, pendiente de aplicar y validar
- **Alcance:** corregir errores y descartar propuestas individuales antes de preparar la exportación para el catálogo

## Contexto

El buzón puede contener varias propuestas a la vez. El admin necesita corregir erratas o ajustar el texto de una propuesta antes de exportar el lote, y descartar solo las que no sean útiles. Vaciar el buzón entero no sirve para esa revisión selectiva.

## Decisiones

1. En cada tarjeta del buzón admin habrá acciones **Editar** y **Eliminar**. La edición permite cambiar tipo, nombre, ingredientes y pasos; conserva el ID y la fecha original de envío.
2. Guardar las correcciones en las tablas relacionales de Supabase. La siguiente exportación obtiene de nuevo el buzón y refleja lo guardado; las propuestas eliminadas ya no aparecen.
3. El borrado individual requiere confirmación, elimina solo la propuesta elegida y sus ingredientes y pasos en cascada, y no requiere que el catálogo se haya publicado. La limpieza global sigue disponible aparte y se usa después de publicar todos los cambios.
4. No conceder `INSERT`, `UPDATE` o `DELETE` directos en las tablas del buzón. Usar `update_recipe_proposal` y `delete_recipe_proposal`, RPC transaccionales que comprueban `is_menuki_admin()` dentro de Supabase.
5. Las operaciones envían una instantánea de los campos que el admin revisó. Supabase bloquea la fila y compara esa instantánea con el contenido actual; si otra sesión la modificó o eliminó, se rechaza la operación y la interfaz actualiza el buzón antes de continuar.
6. Mantener los límites existentes: tipo permitido, nombre hasta 120 caracteres, hasta 30 ingredientes de 160 caracteres y hasta 30 pasos de 500 caracteres. Debe quedar al menos un ingrediente y un paso.

## Consecuencias

- La visibilidad de la página admin es solo una decisión de interfaz; la autorización efectiva está en las RPC del servidor.
- Los cambios afectan al buzón compartido, no a perfiles, menús personales ni a los catálogos JSON.
- El propietario informa que ya aplicó `20261013170000_recipe_proposal_admin_maintenance.sql`; la edición y el borrado individual funcionan. La limpieza global falló con `21000: DELETE requires a WHERE clause`; `20261013180000_recipe_proposal_purge_where_clause.sql` redefine esa RPC con `WHERE id IS NOT NULL`, conserva la confirmación de recuento y debe aplicarse en SQL Editor.
- El propietario confirmó que la edición y el borrado individual funcionan. Tras aplicar la migración correctiva, validar la purga global y comprobar con una cuenta normal que las RPC admin rechazan la llamada.

## Referencias

- Migración: `supabase/migrations/20261013170000_recipe_proposal_admin_maintenance.sql`.
- Cliente: `js/persistence/recipe-proposals.js`.
- [Requisitos del producto](../product/requirements.md).
- [Modelo de datos](../supabase_db_model.md).
- [Decisión de buzón](0021-recipe-proposal-inbox.md).
- [Decisión de exportación](0022-admin-recipe-proposal-export.md).
