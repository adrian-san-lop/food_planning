# ADR-0002 — Proponer un menú en cada ciclo de tres semanas

- Estado: Aceptada (principios); detalle algorítmico pendiente
- Fecha: 2026-10-10
- Alcance: planificador

## Contexto

Al registrar esta decisión, el HTML contenía 84 recetas y un menú fijo de 105 espacios. Actualmente la biblioteca se carga desde los catálogos JSON; sus cifras vigentes se mantienen en la especificación del planificador. No hace falta crear un volumen enorme de recetas ni inventar una receta nueva en cada renovación; la app puede volver a escoger de una biblioteca mantenida.

## Decisión

Preparar una propuesta para las siguientes tres semanas desde los catálogos. Se permiten repeticiones, pero la propuesta debe procurar incluir recetas que no aparecieron en el menú activo y favorecer variedad. La primera versión lo implementa como una preferencia, sin un mínimo garantizado.

Se aceptan estos principios:

1. Mantener el cálculo nutricional/raciones existente como referencia y aceptar pequeñas desviaciones.
2. Favorecer el uso del stock sin bloquear platos por falta de existencias.
3. Buscar variedad y evitar repeticiones cercanas; permitir repetir si el catálogo o las restricciones lo requieren.
4. Permitir revisar, cambiar y bloquear comidas antes de confirmar.

La instalación del mecanismo de generación es única; el usuario prepara y revisa la propuesta en cada renovación del ciclo desde el planificador de Menuki. La propuesta confirmada se sincroniza con Supabase y se activa al llegar su fecha. No se ofrece copiar un encargo para generar el menú fuera de la app.

Actualización aceptada el 15 de octubre de 2026: si termina el ciclo sin otro menú confirmado disponible, Inicio y Menú quedan bloqueados y un diálogo permite generar el siguiente o continuar el borrador. Las demás secciones siguen disponibles. Compra permite elegir el próximo ciclo solo si está guardado y confirmado y faltan de uno a tres días para su inicio; sus listas no se mezclan con las del actual. Véase el flujo actualizado en [la especificación](../planner/specification.md#renovación-y-compra-anticipada).

## Consecuencias

- El menú confirmado guarda referencias de receta y versión de catálogo.
- Las comidas bloqueadas por el usuario se mantienen al regenerar el resto.
- Conviene ampliar la biblioteca según las opciones que falten tras aplicar preferencias, no por una meta arbitraria de tamaño.

## Pendiente

Siguen pendientes el número mínimo de recetas no usadas, la distancia exacta para considerar una repetición cercana, los umbrales/puntuaciones de producto y cualquier filtro de preferencias. La versión inicial usa ponderaciones heurísticas y revisión explícita.
