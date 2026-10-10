# Arquitectura

Estado de referencia: 10 de octubre de 2026. Se distingue explícitamente lo que existe en el repositorio de lo que está previsto.

## Arquitectura actual

```text
Navegador
  └── GitHub Pages / HTML estático
        ├── index.html (redirección relativa)
        ├── web/plan_alimentacion_dinamico_3_semanas.html
        │     ├── carga data/foods.json y data/recipes.json
        │     ├── conserva el menú fijo inicial y propone el siguiente ciclo
        │     └── estado personal y menús confirmados en localStorage
        └── data/*.json + esquemas JSON
```

- `index.html` está en la raíz de publicación de GitHub Pages y redirige de forma relativa al HTML principal dentro de `web/`.
- El HTML carga los catálogos JSON de la misma publicación, valida su estructura y correspondencia entre unidades e ingredientes, y los adapta al modelo interno de la app.
- El menú fijo de 105 espacios sigue siendo el primer ciclo. La propuesta siguiente puede revisarse, guardarse y activarse en su fecha.
- El estado personal y la propuesta se guardan en `localStorage`; no se envían a GitHub junto con el catálogo.
- La cuenta y el proyecto de Supabase se crearon según el propietario; no se ha ejecutado SQL ni se ha integrado autenticación o persistencia remota.
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
| Gustos/restricciones | No hay sistema general implementado | Preferencias por persona fuera del catálogo; modelo pendiente |

No colocar datos personales o copias de seguridad en GitHub. Aunque un repositorio sea privado, GitHub Pages publica el sitio. Si se integra Supabase, las tablas de usuario necesitarán autenticación y políticas RLS; la clave `service_role` y cualquier secreto nunca deben incluirse en el navegador.

## Modelo remoto propuesto, no implementado

El diseño conversado contempla tablas relacionales para perfiles, registros de peso, ciclos, comidas planificadas y realizadas, compras y movimientos de inventario. No se ha validado ni creado el esquema SQL. El catálogo genérico no requiere una tabla por alimento o receta.

Entidades consideradas para validar más adelante: `profiles`, `plan_cycles`, `plan_meals`, `meal_logs`, `weight_logs`, `training_logs`, `purchases`, `purchase_items`, `inventory_movements` y `user_settings`. No son tablas existentes ni un esquema SQL aprobado.

Cada ciclo futuro debería registrar la versión de catálogo usada. Las cantidades de comidas completadas deben conservarse como snapshot para que una modificación posterior de la receta no reescriba el historial. El inventario debería poder reconstruirse a partir de movimientos con IDs únicos; las correcciones y reversos se registran como eventos nuevos.

Si se conecta Supabase, cada tabla con datos personales debe exigir autenticación y RLS por propietario. Operaciones de inventario deben ser idempotentes y, cuando se actualicen varias filas, transaccionales. Registrar fechas de comidas/ciclos como fechas locales y marcas de operación con zona horaria.

## Migración y recuperación

- El navegador no comparte automáticamente `localStorage` entre `file://`, GitHub Pages y otros orígenes. La migración entre orígenes necesita exportación e importación explícitas.
- Aceptar v5 como primer archivo de estado importable y mantener v6; no importar v1-v4. Tratar el stock v5 como saldo de apertura y no sumar otra vez sobre él compras/comidas que ya estén reflejadas.
- La exportación/importación de datos personales es distinta de los catálogos de GitHub. No subir copias personales al repositorio.
- El recordatorio semanal ayuda a descargar una copia, pero ni GitHub Pages ni la sincronización remota sustituyen una copia de seguridad comprobada.

## Versiones y operación

- El estado personal actual es v6; v5 es el primer formato de importación admitido. No implementar migraciones desde v1-v4.
- Los catálogos tienen versión propia (`catalogVersion`, actualmente `0.2.0`), independiente de la versión del estado personal. Incluyen 83 alimentos y 107 recetas y se cargan desde JSON.
- La app requiere conexión y no tendrá cola offline. No afirmar que un cambio se guardó remotamente hasta que la integración real lo confirme.
- La vista de planificación permite proponer, editar, bloquear, regenerar y confirmar el menú del siguiente ciclo. El estado de la propuesta y el menú siguen siendo locales.
- El recordatorio semanal de copia es un aviso dentro de la página, no una notificación del sistema.
- El uso sin coste depende de los límites vigentes de GitHub Pages y del proveedor de base de datos; verificar límites oficiales antes de integrar o prometer capacidad.

## Referencias de implementación

- [Requisitos del producto](product/requirements.md)
- [Especificación del planificador](planner/specification.md)
- [Decisiones registradas](decisions/)
- [Preguntas abiertas](open-questions.md)
