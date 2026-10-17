# ADR-0041: separar reglas de dominio y conversiones de persistencia del cliente

- **Fecha:** 17 de octubre de 2026
- **Estado:** Aceptada e implementada localmente; validación de flujos autenticados en navegador pendiente
- **Alcance:** organización del JavaScript del cliente. No cambia el producto ni el esquema o las RPC de Supabase.

## Contexto

La aplicación ya utilizaba módulos ES, pero `main.js` aún contenía la migración del estado local, las conversiones entre el modelo de pantalla y las tablas relacionales, los cálculos nutricionales y la aplicación de movimientos de despensa. Estas responsabilidades mezclaban contratos de persistencia y reglas de dominio con vistas, eventos y arranque.

## Decisión

- Mantener HTML, CSS y módulos ES nativos, GitHub Pages y Supabase; no introducir un framework, un servidor propio ni un paso de compilación.
- Separar la normalización del estado local v5-v10 en `js/persistence/state-normalization.js`. `js/persistence/local-state.js` conserva la lectura y escritura de `localStorage`.
- Separar el mapeo bidireccional del estado de Menuki y el snapshot relacional en `js/persistence/cloud-state-mapper.js`. `js/persistence/supabase-transport.js` sigue siendo la frontera para lecturas y RPC.
- Separar objetivos nutricionales, macros y cantidades de receta en `js/domain/nutrition.js`.
- Separar la aplicación idempotente de movimientos y la actualización del saldo en `js/domain/inventory-ledger.js`.
- Mantener `main.js` como entrada y composición durante esta etapa. Las vistas, los eventos y la coordinación de Auth y sincronización quedan para extracciones posteriores, cada una con pruebas de regresión antes de moverla.
- Preservar el formato local v10, las conversiones admitidas desde v5, el contrato del snapshot relacional, `sync_menuki_state`, `reset_menuki_state`, RLS, `sync_revision`, los identificadores idempotentes y el comportamiento visible.
- Probar de forma directa las migraciones locales, el mapeo relacional, la nutrición, los movimientos de inventario, la conciliación y el transporte.

## Consecuencias

- Las migraciones de estado local y las migraciones SQL de Supabase siguen siendo mecanismos distintos. Esta decisión no modifica ninguna migración SQL ni requiere ejecutar SQL en Supabase.
- Los nuevos módulos reciben dependencias explícitas para poder probar sus contratos con Node, sin DOM, cuenta de Supabase ni datos personales.
- `main.js` continúa siendo grande porque conserva las vistas, los manejadores de eventos, Auth y la coordinación de sync; la separación de interfaz sigue pendiente.
- `npm test` ejecuta 30 casos. La prueba de carga local confirma que la pantalla de acceso puede abrirse sin errores de consola; Auth, sincronización remota, RLS y pruebas entre dispositivos no se consideran verificadas en vivo.
