# Arquitectura

Estado de referencia: 11 de octubre de 2026. Se distingue explícitamente lo que existe en el repositorio de lo que está previsto.

## Arquitectura actual

```text
Navegador
  └── GitHub Pages / HTML estático
        ├── index.html (redirección relativa)
        ├── menuki.html
        │     ├── carga data/foods.json y data/recipes.json
        │     ├── conserva el menú fijo inicial y propone el siguiente ciclo
        │     ├── registra sesiones realizadas y adapta las comidas pendientes de esa fecha
        │     └── estado personal y menús confirmados en localStorage (formato v8)
        └── data/*.json + esquemas JSON
```

- `index.html` está en la raíz de publicación de GitHub Pages y redirige de forma relativa al HTML principal, también en la raíz.
- El HTML carga los catálogos JSON de la misma publicación, valida su estructura y correspondencia entre unidades e ingredientes, y los adapta al modelo interno de la app.
- El menú fijo de 105 espacios sigue siendo el primer ciclo. La propuesta siguiente puede revisarse, guardarse y activarse en su fecha.
- El estado personal y la propuesta se guardan en `localStorage`; no se envían a GitHub junto con el catálogo.
- Los alimentos separan medida de receta (`recipeUnit`) y medida de inventario (`unit`). Frutas y verduras enteras se pesan en gramos en recetas y se cuentan por piezas en despensa y compra; una conversión por peso comestible aproximado conecta ambas.
- Las sesiones se registran después de realizarse. Su energía neta estimada se aplica solo a la fecha de la sesión y a comidas aún pendientes; no cambia días futuros ni cantidades ya registradas.
- El proyecto Supabase contiene once tablas iniciales y políticas RLS por propietario. La migración aditiva `activity_sessions` está preparada en `supabase/migrations/`, pero está pendiente de aplicar. El HTML no está conectado, no hay cuenta de Auth configurada y no se guardan datos de la aplicación en remoto.
- No existe sincronización entre dispositivos. El uso requiere conexión para visitar la página, pero los datos guardados en `localStorage` permanecen en ese navegador.

## Arquitectura objetivo

```text
Móvil / ordenador
       │
       ▼
GitHub Pages (HTML, JavaScript y catálogos genéricos JSON)
       │
       ├── lectura de foods.json y recipes.json para proponer ciclos
       │
       └── cuando se implemente ──► Supabase Auth + API
                                      └── PostgreSQL privado + RLS
```

Los catálogos comunes se versionan junto al código. El estado personal (perfil, preferencias, peso, planificación, compras y despensa) se mantiene fuera de esos JSON. El estado actual sigue en `localStorage`; la persistencia privada remota y el inicio de sesión siguen pendientes.

## Separación de datos

| Datos | Ubicación actual | Destino previsto |
| --- | --- | --- |
| Alimentos, nutrición aproximada y formato de compra | `data/foods.json`, cargado por la app y descrito por `foods.schema.json` | Catálogo JSON público, versionado |
| Recetas e ingredientes | `data/recipes.json`, cargado por la app y descrito por `recipes.schema.json` | Catálogo JSON público, con referencias por ID estable |
| Menú de tres semanas | `WEEK_1`–`WEEK_3` fijos como ciclo inicial; la propuesta y el menú confirmado siguiente quedan en `localStorage` | Nuevos ciclos generados desde el catálogo, con revisión previa y versión anotada |
| Perfil, peso, comidas, compras, inventario y menús personales | Objeto de estado en `localStorage` | Tablas privadas de Supabase si se completa esa integración |
| Sesiones de actividad realizadas | `activitySessions` dentro del estado local v8; incluida en la copia JSON | Tabla personal `activity_sessions` definida en una migración pendiente |
| Gustos/restricciones | No hay sistema general implementado | Preferencias por persona fuera del catálogo; modelo pendiente |

No colocar datos personales o copias de seguridad en GitHub. Aunque un repositorio sea privado, GitHub Pages publica el sitio. Si se integra Supabase, las tablas de usuario necesitarán autenticación y políticas RLS; la clave `service_role` y cualquier secreto nunca deben incluirse en el navegador.

## Esquema remoto inicial aplicado; migración de actividad y conexión del HTML pendientes

El proyecto tiene tablas relacionales para perfiles, ciclos, comidas planificadas y realizadas, movimientos de inventario, peso, entrenamientos, preparación y listas de compra. El esquema se define en `supabase/migrations/`; la comprobación estructural y de permisos está en `supabase/tests/`. El catálogo genérico no requiere una tabla por alimento o receta.

Las once tablas aplicadas son `profiles`, `plan_cycles`, `planned_meals`, `meal_completions`, `inventory_movements`, `weight_logs`, `training_logs`, `prep_tasks`, `shopping_sessions`, `shopping_session_items` y `user_settings`. `activity_sessions` está definida en una tercera migración aditiva todavía no aplicada; acepta varias sesiones por fecha. `training_logs` y `profiles.training_bonus_kcal` quedan como columnas/tabla heredadas y no se usarán para el nuevo cálculo. Las migraciones iniciales se aplicaron desde SQL Editor; Supabase todavía no registra automáticamente el historial de esos archivos.

Cada ciclo futuro debería registrar la versión de catálogo usada. Las cantidades de comidas completadas deben conservarse como snapshot para que una modificación posterior de la receta no reescriba el historial. El inventario debería poder reconstruirse a partir de movimientos con IDs únicos; las correcciones y reversos se registran como eventos nuevos.

Las tablas requieren Auth y aplican RLS por `auth.uid()`. El HTML aún no crea sesiones ni consulta estas tablas. Operaciones de inventario idempotentes y transaccionales, importación inicial del estado v8, configuración de Auth y pruebas entre dispositivos siguen pendientes. Registrar fechas de comidas, ciclos y sesiones como fechas locales y marcas de operación con zona horaria.

## Migración y recuperación

- El navegador no comparte automáticamente `localStorage` entre `file://`, GitHub Pages y otros orígenes. La migración entre orígenes necesita exportación e importación explícitas.
- Aceptar v5 como primer archivo importable y v8 como estado actual; admitir v5-v8, sin importar v1-v4. Tratar el stock v5 como saldo de apertura y no sumar otra vez sobre él compras/comidas que ya estén reflejadas. Al actualizar v5, convertir las cantidades antiguas en gramos a unidades de inventario; al actualizar v6/v7, conservar movimientos y stock, y convertir los snapshots históricos de consumo a unidades de receta.
- La exportación/importación de datos personales es distinta de los catálogos de GitHub. No subir copias personales al repositorio.
- El recordatorio semanal ayuda a descargar una copia, pero ni GitHub Pages ni la sincronización remota sustituyen una copia de seguridad comprobada.

## Versiones y operación

- El estado personal actual es v8; v5 es el primer formato de importación admitido. Se aceptan v5-v8; no implementar migraciones desde v1-v4.
- Los catálogos tienen versión propia (`catalogVersion`, actualmente `0.5.0`), independiente de la versión del estado personal. Incluyen 83 alimentos y 107 recetas y se cargan desde JSON. `food.unit` expresa inventario/compra y `food.recipeUnit` la unidad de receta. `recoveryTags` son marcadores cualitativos para selección de menú, no valores medidos de micronutrientes.
- La app requiere conexión y no tendrá cola offline. No afirmar que un cambio se guardó remotamente hasta que la integración real lo confirme.
- La vista de planificación permite proponer, editar, bloquear, regenerar y confirmar el menú del siguiente ciclo. El estado de la propuesta y el menú siguen siendo locales.
- El historial de actividad describe sesiones ya realizadas; no es un calendario de previsiones ni un mecanismo de aprendizaje automático del perfil.
- El recordatorio semanal de copia es un aviso dentro de la página, no una notificación del sistema.
- El uso sin coste depende de los límites vigentes de GitHub Pages y del proveedor de base de datos; verificar límites oficiales antes de integrar o prometer capacidad.

## Referencias de implementación

- [Requisitos del producto](product/requirements.md)
- [Especificación del planificador](planner/specification.md)
- [Decisiones registradas](decisions/)
- [Decisión de ajuste por actividad realizada](decisions/0005-actual-activity-session-nutrition.md)
- [Decisión de separar las unidades de receta e inventario](decisions/0006-recipe-and-inventory-units.md)
- [Preguntas abiertas](open-questions.md)
