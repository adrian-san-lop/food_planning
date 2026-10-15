# Decisión 0022: exportación admin de propuestas para revisión con Codex

- **Fecha:** 13 de octubre de 2026
- **Estado:** Aceptada; implementada en `dev`; validación de navegador publicada pendiente
- **Alcance:** transferir propuestas sin enriquecer desde el buzón de Supabase a un chat de Codex con acceso al repositorio

## Contexto

Las personas envían ideas breves de recetas al buzón compartido de Supabase. El navegador no debe modificar los catálogos públicos ni tener una clave de escritura de GitHub. El administrador necesita una forma directa de llevar esas ideas a Codex para convertirlas, con revisión, en registros completos de `data/foods.json` y `data/recipes.json`.

## Decisiones

1. Solo las cuentas autorizadas en `menuki_admins` pueden leer y descargar el buzón. El control aparece en la vista de administración; la descarga vuelve a consultar Supabase para incluir el contenido más reciente.
2. Descargar un JSON de transferencia versionado como `menuki.recipe-proposal-export`, versión 1, conforme a `docs/schemas/recipe-proposal-export.schema.json`.
3. Incluir `exportedAt`, `catalogVersion`, el total calculado y, para cada propuesta, su ID estable, tipo, nombre, fecha de envío, ingredientes y pasos ordenados. Excluir el correo e ID de cuenta del remitente y cualquier dato de perfil o estado personal.
4. No cambiar ni marcar propuestas como procesadas al descargar. El archivo es una copia de trabajo para análisis; la limpieza global se mantiene como una acción administrativa separada que requiere publicar primero los cambios de catálogo y confirmar el recuento actual.
5. Codex procesa el paquete en un chat con acceso al repositorio: revisa el esquema del paquete, los JSON y sus esquemas actuales; detecta coincidencias; verifica alimentos y referencias nutricionales; prepara los cambios de alimentos antes que las recetas; preserva IDs y unidades estables; y presenta un diff revisable. El chat no publica ni limpia el buzón automáticamente.

## Consecuencias

- El navegador solo descarga datos que Supabase ya autoriza al rol admin; no escribe en GitHub ni necesita secretos adicionales.
- El JSON exportado no contiene datos identificativos del autor y se valida en el cliente antes de descargar.
- La aplicación de la novena migración y la asignación admin se consideran realizadas según confirmación del propietario. RLS con dos cuentas, descarga publicada y procesamiento del paquete requieren validación real.
- La propuesta original permanece en Supabase hasta que el catálogo enriquecido haya sido publicado y el admin confirme la purga.

## Referencias

- [Esquema JSON del paquete](../schemas/recipe-proposal-export.schema.json)
- [Requisitos del producto](../product/requirements.md)
- [Arquitectura](../architecture.md)
- [Decisión del buzón de propuestas](0021-recipe-proposal-inbox.md)
- [Cliente del buzón](../../js/persistence/recipe-proposals.js)
