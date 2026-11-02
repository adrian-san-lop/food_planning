# ADR-0001 — Catálogos genéricos en JSON versionado

- Estado: Aceptada
- Fecha: 2026-10-10
- Alcance: catálogo y arquitectura

## Contexto

El planificador necesita una biblioteca reutilizable y ampliable de alimentos y recetas. Los datos de esa biblioteca son genéricos; no son el perfil ni la actividad privada de una persona. Una tabla remota para cada alimento o receta no aporta valor a esta biblioteca pequeña y versionada.

## Decisión

Mantener los catálogos genéricos en `data/foods.json` y `data/recipes.json`, versionados en GitHub. Usar IDs estables para enlazar ingredientes de recetas con alimentos. Separar la versión de catálogo de la versión del estado personal. Los datos personales permanecen fuera de estos ficheros.

## Consecuencias

- Los JSON se pueden revisar y cambiar con el historial de Git.
- El catálogo no depende de una cuenta de Supabase.
- La web publicada es pública; no incluir información personal en ella.
- El snapshot inicial al registrar esta decisión (`catalogVersion` `0.1.0`) contenía 63 alimentos y 84 recetas extraídos del HTML. La ampliación posterior a 0.2.0 conserva esos registros y añade 20 alimentos y 23 recetas; la cifra inicial se mantiene aquí como contexto histórico.
- En la fecha de este registro el HTML aún no cargaba los JSON. La integración de lectura se incorporó después; véase ADR-0004.
- Cada ciclo debe registrar la versión usada y preservar snapshots de consumo para no reescribir el historial al cambiar recetas.

## Pendiente

Revisar los valores nutricionales genéricos frente a etiquetas concretas. Los esquemas se formalizaron en la versión 0.2.0; el proceso vigente de revisión de propuestas y cambios de catálogo está definido en ADR-0021, ADR-0022 y ADR-0023.
