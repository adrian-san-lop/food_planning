# Decisión 0014: fuentes canónicas de datos de Menuki

- **Fecha:** 12 de octubre de 2026
- **Estado:** Aceptada e implementada para los catálogos
- **Alcance:** catálogos genéricos y estado personal de la aplicación

Actualización aceptada (25/10/2026): [ADR-0051](0051-server-authoritative-account-state.md) amplía este registro. El contrato 2 usa lectura única, acciones acotadas, snapshots reproducibles de plan y base completa en memoria de sesión. La copia personal persistida corresponde al contrato anterior y a la transición; la conciliación concurrente sigue siendo automática. Activación alojada pendiente según [instrucciones](../backend/account-contract.md).

## Contexto

Los alimentos, recetas, formatos de compra y pesos comestibles aparecían tanto en los catálogos JSON como en literales de `main.js`. El cliente ya cargaba y validaba los JSON antes de abrir la aplicación autenticada, y después reemplazaba los literales. `localStorage` conserva una copia de trabajo de los datos personales mientras Supabase ya almacena esos datos en tablas relacionales.

## Decisiones

1. `data/foods.json` y `data/recipes.json` son las fuentes canónicas de los catálogos genéricos, incluidos los datos nutricionales, unidades, pesos por pieza, compra e ingredientes de recetas. La aplicación puede construir en memoria las vistas de datos que necesite, pero debe derivarlas de esos JSON.
2. Las tablas relacionales de Supabase son la fuente canónica remota de los datos personales de una cuenta: perfil, ciclos y comidas, actividad, peso, despensa, compras y preparación. Mantener RLS, `auth.uid()` y la sincronización transaccional existente; la conciliación automática de revisiones está definida en ADR-0017.
3. `localStorage` es la copia de trabajo del navegador para esos datos personales. Puede conservar cambios locales pendientes de sincronización, pero no es una segunda fuente común ni sustituye a Supabase entre dispositivos.
4. El menú fijo inicial permanece como plantilla de la aplicación que referencia IDs estables de recetas. No debe contener otra definición de alimentos o recetas; el ciclo personal resultante se guarda con el estado remoto.

## Consecuencias

- Se retiran de `main.js` los literales estáticos duplicados de `FOOD`, `RECIPES`, compra y `UNIT_GRAMS`. Los modelos e índices en memoria, incluido `CATALOG`, se derivan de los JSON; los pesos por pieza proceden de `foods.json`.
- La adaptación de JSON al modelo de ejecución de la app sigue siendo válida porque se genera al cargar los catálogos y no constituye otro origen editable.
- La app ya requería catálogos válidos para abrir la sesión autenticada; no se crea un fallback a datos incrustados.
- Los cambios mantienen las versiones de catálogo, esquemas JSON, estado personal v8 y migraciones automáticas de estados locales v5-v8. No requieren cambios en el esquema de Supabase.
- Validar la carga autenticada, el menú fijo, la compra y las conversiones de unidades en navegador antes de publicar la rama.
