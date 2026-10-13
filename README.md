# Menuki — Mi Plan Saludable

Aplicación web de planificación nutricional con datos personales aislados por cuenta. Permite consultar un menú de tres semanas, preparar recetas, registrar comidas y sesiones de actividad, controlar la despensa y llevar el seguimiento del peso. Las cuentas autenticadas también pueden proponer recetas para un buzón compartido que revisa el administrador.

## Estado actual

- `index.html` es la entrada de GitHub Pages y redirige a `menuki.html` en la raíz.
- El usuario inicia sesión con Supabase Auth; los datos personales se sincronizan en tablas relacionales y `localStorage` mantiene una copia de trabajo del navegador.
- Inicio muestra un banner compacto, los KPI, el objetivo nutricional del día y solo el menú de hoy. Menú es una página separada con navegación por semana y por día.
- En la primera visita, Guía indica por dónde empezar. Las cifras genéricas del perfil se marcan como ejemplos hasta que el usuario las revise y guarde.
- Al abrir la cuenta en otro dispositivo, Menuki actualiza los datos automáticamente. Los cambios independientes se combinan; si ambos dispositivos cambian el mismo valor, prevalece la última revisión guardada en Supabase.
- La página carga alimentos y recetas desde los catálogos JSON versionados del repositorio.
- Las cuentas autenticadas pueden enviar propuestas simples de receta. El administrador puede descargar el buzón como un paquete JSON versión 1 para adjuntarlo a un chat de Codex con acceso al repositorio y preparar cambios revisables en `foods.json` y `recipes.json`.
- **Revisar propuestas** y la descarga JSON solo aparecen para cuentas admin. El archivo sigue el esquema documentado, incluye IDs estables y la versión del catálogo, y omite la identidad de quien propuso la receta. Después de publicar los cambios del catálogo, el administrador puede eliminar el buzón con una acción confirmada.
- El menú fijo actual sigue activo. La app puede preparar y guardar una propuesta editable para el siguiente ciclo de tres semanas.
- El estado actual es v8. La app importa copias v5 a v8; la migración adapta los consumos históricos a gramos de receta y conserva despensa y movimientos en las unidades de inventario correspondientes.
- Las antiguas marcas de fuerza se conservan como datos heredados, pero ya no afectan al cálculo. No se importan datos v1-v4.
- Las compras, consumos, reversos y correcciones nuevas se anotan como movimientos con identificador único. Si una receta supera el saldo anotado, se registra completa y se muestra el faltante.
- Los cambios se sincronizan automáticamente con Supabase mientras hay conexión. La app comprueba cambios remotos mientras está abierta y al volver a ella. Si falla la sincronización, muestra el estado y permite reintentar.
- En móvil, Inicio, Menú, Compra y Actividad están en la barra inferior; Perfil, Despensa, Recetas y Guía se encuentran bajo **Más**. La compra incluye búsqueda y un resumen fijo para revisar el progreso y finalizarla.
- Compra muestra el establecimiento principal como **Supermercado**; Frutería conserva su sección propia.
- Los valores de perfil que usa una instalación nueva son ejemplos genéricos, no datos personales. Las comidas futuras aparecen como planificadas y solo se pueden registrar cuando llega su fecha.
- Registra cada sesión una vez realizada. Su gasto neto estimado ajusta principalmente los hidratos y solo las comidas pendientes de esa fecha; no cambia días futuros ni cantidades ya registradas.
- Supabase tiene trece tablas existentes para el estado por cuenta, con RLS y funciones transaccionales. El propietario confirma que aplicó `20261013160000_recipe_proposal_inbox.sql`, que añade una lista privada de administradores y tres tablas relacionales para propuestas, ingredientes y pasos. La corrección `20261013120000_menuki_sync_conflict_http_409.sql` sigue pendiente. La descarga JSON está implementada en la rama de tarea y llegará a Pages tras integrarse en `dev`.
- Auth administra las credenciales; `public.profiles` conserva los parámetros nutricionales y la confirmación de revisión. El rol de administrador se asigna a una cuenta ya registrada desde SQL Editor y no se decide por una contraseña incluida en el HTML.

### Sincronización entre dispositivos

Al iniciar sesión en otro dispositivo, Menuki carga los datos de tu cuenta desde Supabase. La primera vez que una cuenta sin inicializar entra en una instalación con datos locales, importa esa copia una sola vez. Después, los cambios se sincronizan automáticamente y la app consulta la revisión remota cada 15 segundos mientras está visible, además de actualizar al recuperar el foco o la conexión. `localStorage` es la copia de trabajo del navegador. Los cambios independientes se combinan sin pedir una elección; si dos dispositivos modifican el mismo valor, prevalece la revisión que Supabase aceptó más recientemente. Si falla la sincronización, puedes reintentarlo.

El historial de sesiones está al principio de **Actividad y peso**. En móvil, **Actividad** está en la barra inferior. Cada fila incluye **Eliminar sesión**, y puedes ampliar el historial para ver registros anteriores. Reiniciar todos los datos y restaurar archivos JSON v5 a v8 siguen siendo acciones deliberadas con confirmación; no intervienen al cambiar de dispositivo. Los formatos anteriores no se convierten.

## Flujo de trabajo con Git

El trabajo nuevo parte de una rama `dev` limpia y se realiza en una rama de tarea dentro de este mismo checkout. No se crean worktrees. Si hay cambios pendientes —también archivos sin seguimiento—, consérvalos y decide cómo resolverlos antes de empezar otra tarea; no los guardes, descartes ni muevas automáticamente.

1. Comprueba `git status --short --branch` y la rama activa.
2. Cuando el estado remoto importe, actualiza las referencias con `git fetch origin`.
3. Cambia a `dev` con `git switch dev` y, si está por detrás, actualízala solo mediante avance rápido: `git pull --ff-only origin dev`. Si `dev` local y `origin/dev` han divergido, detente y revisa la diferencia; no uses reset ni rebase automático.
4. Crea una rama para la tarea con el script, que comprueba que el árbol está limpio y que `dev` coincide con `origin/dev` cuando esa referencia existe:

   ```powershell
   .\scripts\new-branch.ps1 -Name "docs/descripcion"
   ```

   Usa el prefijo `docs/`, `fix/` o `chore/` según el trabajo. El script no consulta la red; el `fetch` se hace por separado.
5. Revisa el alcance y los cambios. Para crear un commit, autorízalo explícitamente y selecciona rutas concretas:

   ```powershell
   .\scripts\commit.ps1 -Message "docs: actualizar guia" -Path README.md, AGENTS.md
   ```

   `-All` incluye todos los cambios. Úsalo solo si has revisado y aprobado todo ese contenido. Sin `-Yes`, el script pide confirmación interactiva; `-Yes` la omite y solo debe pasarse cuando ya se haya autorizado ese commit.
6. Publica la rama solo cuando se haya autorizado expresamente:

   ```powershell
   .\scripts\push-origin.ps1 -Yes
   ```

   La rama de tarea se propone a `dev` mediante un pull request. La promoción de `dev` a `main` se realiza en otro pull request. Los envíos directos a `main` o `dev` requieren autorización expresa y `-AllowProtectedBranch`. GitHub Pages publica actualmente desde `dev`.

Los scripts de commit y publicación mantienen su confirmación interactiva si se omite `-Yes`. No fuerzan el envío ni crean pull requests automáticamente.

## Publicar en GitHub Pages

1. En GitHub, abre **Settings → Pages**.
2. En **Build and deployment**, elige **Deploy from a branch**.
3. Selecciona la rama `dev` y la carpeta `/(root)`, y guarda.
4. Espera a que termine la publicación y abre la dirección que muestra GitHub en esa misma sección.

La raíz contiene `index.html`, que es la entrada del sitio, y `menuki.html`, que contiene la aplicación. La redirección es relativa y funciona también cuando GitHub Pages publica el repositorio bajo una subruta. GitHub indica que el archivo de entrada debe estar en la raíz de la carpeta publicada. La página publicada es accesible por Internet, aunque el repositorio sea privado, así que no se deben incluir copias de seguridad ni datos personales en el repositorio. [Crear un sitio de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) · [Elegir la fuente de publicación](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Inventario y unidades

| Dónde se mide | Unidad y alcance |
| --- | --- |
| Recetas | `g` para ingredientes sólidos, incluidas frutas y verduras enteras; `ud` para huevos; `ml` para líquidos. |
| Despensa y compras | `ud` para huevos y frutas/verduras enteras; `g` para sólidos que se compran al peso o en paquetes por peso; `ml` para líquidos. |
| Conversión | El catálogo incluye un peso comestible aproximado por pieza para convertir gramos de receta en unidades de inventario y compra. |

Se aceptan fracciones de unidad en inventario, como `0,5 ud`. El peso por pieza es aproximado; puedes ajustarlo en el catálogo. La leche se compra en tetrabriks de 1 L y el café molido se pesa en gramos.

## Catálogos de alimentos y recetas

Los catálogos JSON conservan los datos genéricos que ya usa la aplicación y se han ampliado por separado:

- [`data/foods.json`](data/foods.json): alimentos, unidad de receta, unidad de inventario/compra, valores nutricionales aproximados, peso comestible por pieza cuando aplica y formato orientativo de compra. Su contrato está descrito en [`foods.schema.json`](data/foods.schema.json).
- [`data/recipes.json`](data/recipes.json): recetas, ingredientes enlazados por el identificador estable del alimento, cantidades base en la unidad de receta, pasos, tiempo y notas. La app adapta las cantidades según el perfil y las sesiones reales del día. Su contrato está descrito en [`recipes.schema.json`](data/recipes.schema.json).

Son datos genéricos del recetario; no incluyen perfil, peso, despensa ni otros datos de uso personal. La app los carga desde la misma web y comprueba unidades, referencias de ingredientes y tipos de comida antes de abrirse. Si falla la carga o la estructura no es válida, muestra un error y permite reintentar; no guarda cambios con un catálogo incompleto.

Estos JSON son la fuente canónica de alimentos y recetas. La app deriva de ellos los modelos en memoria; no mantiene otra lista editable de esos datos en JavaScript. Para los datos personales, Supabase es la fuente remota y `localStorage` solo conserva la copia de trabajo del navegador.

Los catálogos están en la versión `0.7.0`: 85 alimentos, 111 recetas y 531 referencias de ingredientes. Esta actualización incorpora cuatro recetas revisadas desde la primera exportación del buzón y dos alimentos nuevos: ajo y alitas de pollo con hueso. La ficha nutricional de las alitas estima los valores por peso comprado combinando USDA FoodData Central con el rendimiento comestible de USDA Food Buying Guide. La versión `0.6.0` retiró las claves de fotografía de las recetas; la interfaz presenta los platos sin fotografías y conserva las imágenes de marca. La versión `0.5.0` añadió marcadores cualitativos para fuentes de calcio, vitamina D y vitamina C. Con **Recuperación ósea** activa, las nuevas propuestas favorecen recetas con esos alimentos y muestran su presencia en los 21 días; no se calculan micronutrientes ni se promete acelerar la consolidación. El ciclo actual no cambia automáticamente. La versión `0.4.0` cambió la medida de receta para 17 frutas y verduras enteras: ahora se expresan en gramos y su compra/despensa sigue en unidades. Las cantidades nutricionales por pieza se expresan por 100 g usando el peso comestible aproximado del catálogo. La versión `0.2.0` partió de 63 alimentos y 84 recetas que entonces estaban embebidos en el HTML, añadió 20 alimentos y 23 recetas y enlazó cada receta por el ID estable de sus ingredientes. Esas incorporaciones usaron referencias genéricas de [USDA FoodData Central](https://fdc.nal.usda.gov/); algunas cifras heredadas no tienen una fuente detallada por alimento. Todos los valores y formatos de compra son aproximados y deben cotejarse con las etiquetas y envases reales. La versión del catálogo es independiente de la versión del estado personal v8.

### Registro de actividad

En **Actividad y peso**, registra una sesión después de hacerla con fecha, actividad e intensidad orientativa y duración. El historial aparece al principio de la página y permite eliminar sesiones anotadas por error. La app estima su energía neta con `(MET − 1) × peso (kg) × horas`; el nivel de movimiento del perfil representa la actividad diaria habitual sin ejercicio. La estimación solo se aplica a esa fecha; no se predicen entrenamientos futuros. Las comidas que ya registraste conservan sus cantidades; el objetivo restante se reparte entre las comidas aún pendientes, principalmente aumentando hidratos. Es una aproximación basada en valores MET, no una medición clínica.

En **Menú 3 semanas**, **Preparar propuesta** crea 105 espacios para el siguiente ciclo. Puedes cambiar una receta por otra del mismo tipo, bloquear comidas y volver a generar las que dejes desbloqueadas. La despensa influye en el orden de selección, pero no excluye recetas por falta de stock. La app guarda la propuesta en el navegador y la activa al llegar su fecha de inicio. No se aplican todavía preferencias de gustos ni exclusiones personales.

Para abrir la aplicación desde una copia local, sírvela por HTTP; `fetch` no puede leer los catálogos al abrir el HTML como `file://`. En GitHub Pages, la entrada raíz `index.html` y las rutas relativas hacen la carga automáticamente.

## Cómo entender el modelo de datos

Las “referencias” son los enlaces entre registros. Una compra contiene líneas de productos comprados; una comida completada genera movimientos de consumo. La despensa se calcula sumando sus movimientos.

```text
Tu usuario
├── perfil
├── ciclos del menú
│   └── comidas planificadas y comidas registradas
├── compras
│   └── productos comprados
└── movimientos de despensa
    ├── entrada por compra: cantidad positiva
    ├── consumo por comida: cantidad negativa
    ├── ajuste manual: diferencia positiva o negativa
    └── reverso: movimiento que compensa una acción anterior
```

Ejemplo: si hay `2 ud` de brócoli y registras una receta que usa `250 g`, con un peso comestible estimado de `400 g/ud`, la app muestra `250 g` en la receta y descuenta aproximadamente `0,63 ud` del inventario. Si el saldo no alcanza, registra el consumo completo y muestra el déficit en unidades. Al desmarcar la comida, añade un movimiento inverso en la misma unidad de inventario; no borra el historial ni vuelve a descontar por un reintento.

El dibujo del modelo distingue las trece tablas del estado por cuenta y las cuatro tablas del buzón compartido, creadas por la migración novena que el propietario confirma aplicada. Los snapshots personales de ingredientes conservan las cantidades en unidad de receta sin caducidad temporal. El admin puede descargar las propuestas en un JSON versionado para trabajar en los catálogos; el paquete no contiene la identidad del remitente y sigue el esquema de `docs/schemas/recipe-proposal-export.schema.json`. Tras publicar los catálogos, la purga confirmada elimina las propuestas y sus hijos; PostgreSQL puede reutilizar ese espacio sin que el tamaño mostrado baje inmediatamente. La sincronización del estado personal recibe un JSON de transporte y distribuye sus datos en tablas; PostgreSQL no guarda el estado completo en una columna JSON. RLS limita el buzón a administradores. La prueba de aislamiento y los recorridos publicados siguen pendientes. [Documentación oficial de RLS](https://supabase.com/docs/guides/database/row-level-security) · [Claves de API](https://supabase.com/docs/guides/getting-started/api-keys) · [Autenticación con JavaScript](https://supabase.com/docs/reference/javascript/auth).

## Archivos principales

- `menuki.html`: shell HTML de la aplicación.
- `assets/css/app.css`: estilos extraídos del HTML y organizados por secciones; las reglas responsive quedan al final y las plantillas JavaScript no usan atributos `style`.
- `js/main.js`: entrada ES del cliente; compone la interfaz y los módulos del dominio y de persistencia.
- `js/domain/`, `js/data/`, `js/persistence/` y `js/ui/`: módulos de fechas, unidades, catálogos, propuestas de recetas, acceso a datos y codificación segura de HTML.
- `package.json` y `tests/`: comprobaciones de dominio, catálogos y codificación HTML.
- `index.html`: entrada que redirige a la aplicación.
- `data/foods.json` y `data/recipes.json`: catálogos genéricos que carga la aplicación.
- `data/foods.schema.json` y `data/recipes.schema.json`: contratos estructurales de los catálogos.
- `context/context.md`: resumen breve en inglés para retomar el trabajo.
- `AGENTS.md`: instrucciones en inglés para agentes de código.
- `.codex/git-branch/`, `.codex/git-commit/` y `.codex/git-push/`: skills del flujo Git del repositorio.
- `scripts/new-branch.ps1`, `scripts/commit.ps1` y `scripts/push-origin.ps1`: automatizan la creación de ramas, commits y publicación con comprobaciones de seguridad.
- `docs/product/requirements.md`: alcance y flujos del producto.
- `docs/architecture.md`: estado actual y arquitectura prevista.
- `docs/front-end-audit.md`: auditoría de arquitectura y propuestas de evolución.
- `docs/supabase_db_model.md`: diagrama, columnas, claves, relaciones y RLS del esquema de Supabase.
- `docs/planner/specification.md`: catálogos, reglas aceptadas y propuestas del planificador.
- `docs/roadmap.md`: etapas candidatas y criterios de aceptación que deben conservarse.
- `docs/decisions/`: registro de decisiones con su estado.
- `docs/open-questions.md`: propuestas y cuestiones que aún requieren decisión.
- `supabase/`: migraciones SQL del esquema personal y de la sincronización relacional, además de comprobaciones estructurales de RLS/permisos.

## Comprobaciones automatizadas

Con Node.js 20 o posterior, ejecuta `npm test`. La suite usa el ejecutor integrado de Node y no necesita instalar paquetes ni compilar la aplicación. Comprueba fechas civiles de Madrid en los cambios de horario, conversiones de unidades, contrato de los catálogos y codificación de textos, atributos y URL. No sustituye la validación de Auth/sincronización en navegador ni la prueba RLS con dos cuentas.
