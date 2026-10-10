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
- Los ficheros actuales (`catalogVersion` `0.1.0`) son borradores iniciales extraídos del HTML: 63 alimentos y 84 recetas.
- El HTML aún no carga los JSON. Esta decisión de almacenamiento está aceptada; la integración de lectura no.
- Cada ciclo debe registrar la versión usada y preservar snapshots de consumo para no reescribir el historial al cambiar recetas.

## Pendiente

Validar la calidad/fuente de los valores nutricionales, formalizar esquema y decidir el proceso para revisar cambios del catálogo.
