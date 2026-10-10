# ADR-0003 — Preferencias alimentarias por persona

- Estado: Propuesta, no aceptada
- Fecha: 2026-10-10
- Alcance: planificador y futura expansión

## Contexto

Personas distintas pueden tener gustos distintos. Un catálogo común no debería cambiarse para reflejar el gusto particular de un usuario.

## Propuesta

Guardar las preferencias junto al perfil privado de cada persona, separadas de `foods.json` y `recipes.json`. Distinguir preferencias graduadas (por ejemplo, gusta/indiferente/evitar) de restricciones firmes (por ejemplo, alergia o intolerancia). El planificador filtra restricciones firmes y usa gustos como preferencias al ordenar candidatos. Si una receta no encaja, ofrecer otra receta del mismo espacio; permitir sustituciones de ingrediente solo cuando estén definidas y validadas.

La primera versión sigue siendo de una sola persona. Un menú compartido para varios comensales requeriría definir cómo combinar restricciones y gustos, y cómo sumar porciones.

## Consecuencias si se acepta

- La biblioteca pública sigue siendo genérica.
- Se necesitará un modelo privado para preferencias y, si se requiere, feedback después de probar recetas.
- El algoritmo debe explicar cuándo no hay suficientes recetas elegibles; no debe saltarse restricciones de forma silenciosa.

## Pendiente

El propietario todavía no ha aceptado el modelo de preferencias, el vocabulario de opciones, el tratamiento de alergias ni el alcance multi-persona.
