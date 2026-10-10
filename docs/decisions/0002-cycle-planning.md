# ADR-0002 — Proponer un menú en cada ciclo de tres semanas

- Estado: Aceptada (principios); detalle algorítmico pendiente
- Fecha: 2026-10-10
- Alcance: planificador

## Contexto

El HTML actual contiene 84 recetas y un menú fijo de 105 espacios cada tres semanas. No hace falta crear un volumen enorme de recetas ni inventar una receta nueva en cada renovación; la app puede volver a escoger de una biblioteca mantenida.

## Decisión

Cuando se implemente el planificador, preparar una propuesta para las siguientes tres semanas desde los catálogos. Se permiten repeticiones, pero la propuesta debe procurar incluir recetas que no aparecieron en el menú reciente y favorecer variedad.

Se aceptan estos principios:

1. Mantener el cálculo nutricional/raciones existente como referencia y aceptar pequeñas desviaciones.
2. Favorecer el uso del stock sin bloquear platos por falta de existencias.
3. Buscar variedad y evitar repeticiones cercanas; permitir repetir si el catálogo o las restricciones lo requieren.
4. Permitir revisar, cambiar y bloquear comidas antes de confirmar.

La instalación del mecanismo de generación será única; el usuario preparará/revisará una propuesta en cada renovación del ciclo. Esto describe el objetivo, no una función ya implementada.

## Consecuencias

- El menú confirmado debe guardar referencias de receta y versión de catálogo.
- Las comidas bloqueadas por el usuario se mantienen al regenerar el resto.
- Conviene ampliar la biblioteca según las opciones que falten tras aplicar preferencias, no por una meta arbitraria de tamaño.

## Pendiente

Definir “receta nueva” (nueva en ese menú o nueva en el catálogo), número mínimo de novedades, distancia para considerar repetición cercana, puntuaciones y cuándo la app pide confirmación.
