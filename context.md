# CONTEXT.md - Mi Plan Saludable

> Contexto funcional y técnico para Codex en VS Code. Leer este documento antes de analizar o modificar el repositorio.
> Estado de referencia: 10 de octubre de 2026. Idioma de la aplicación y documentación: español.
> Objetivo inmediato: convertir una app HTML local de nutrición en una app web persistente, privada y sincronizada sin perder sus funcionalidades.

## 1. Propósito del proyecto

**Mi Plan Saludable** es una aplicación web personal, responsive e interactiva para organizar la alimentación, cocinar recetas sencillas, registrar entrenamientos y peso, gestionar la compra en supermercado y controlar una despensa dinámica.

El usuario quiere utilizarla durante meses o años, desde móvil y ordenador. La prioridad de esta nueva etapa **no es crear nuevas recetas ni rediseñar la interfaz**, sino lograr que sus datos se conserven, se sincronicen y puedan recuperarse si cambia de dispositivo o borra el almacenamiento del navegador.

### Principios no negociables

1. **Gratuita en uso personal dentro de las cuotas disponibles, y con código fuente abierto.** Avisar de posibles límites de los planes gratuitos; nunca suponer persistencia garantizada de por vida.
2. **Conservar las funcionalidades y el diseño existentes.** Paleta agradable de verde salvia, crema y terracota; funcionamiento sencillo en móvil.
3. **Mínimo esfuerzo de registro.** El usuario compra bandejas, botes, envases y unidades, no gramos exactos; el cálculo detallado debe ser interno.
4. **Datos privados y recuperables.** Nada de historiales de peso, lesiones, comidas, autenticación o compras reales en un repositorio público.
5. **Sin dependencia de un equipo encendido en casa** ni de SQL Server localhost.
6. **Implementación incremental con pruebas.** Evitar reescribir toda la app de una vez o romper la lógica nutricional y de inventario.
7. **No presentar estimaciones nutricionales como medidas clínicas.** Mantener controles razonables y permitir revisiones del plan.

## 2. Fuente de verdad existente (leer el código primero)

La última versión funcional compartida se llama:

`plan_alimentacion_dinamico_3_semanas.html`

Es un único archivo HTML con CSS y JavaScript vanilla incrustados. Si no está incluido en el repositorio, **solicitar incorporarlo como punto de partida**. No reconstruirlo desde esta descripción ni inventar funciones ausentes. Si ya existe una estructura más reciente, inspeccionarla y priorizar el código real.

Elementos identificados en el HTML de referencia:

- `FOOD`: catálogo de ingredientes, unidad canónica y valores nutricionales aproximados por 100 g/ml o unidad.
- `RECIPES` y `REC`: recetas, cantidades, instrucciones y fotografías orientativas.
- `WEEK_1`, `WEEK_2`, `WEEK_3`, `MENUS`: programación de tres semanas.
- `CATALOG`: clasificación Mercadona/frutería y formatos comerciales estimados.
- `defaultProfile`, `nutritionProfile`, `nutritionTarget`, `planPortions`: perfil, gasto estimado, objetivos y adaptación de raciones.
- `plannedDays`, `plannedNeeds`, `shoppingModel`, `commercialPack`, `cartChoice`, `finishCart`: cálculo de necesidades y compra.
- `recipeUsage`, `toggleMeal`: registro de comidas y consumo de despensa.
- `cleanState`, `load`, `save`, `saveExport`: estado local, migración básica y copia JSON.
- `changeCycleStart`, `calendarReminder`: ciclos de planificación y recordatorio de renovación.

### Estado local actual y problema principal

La versión inspeccionada usa `localStorage` y mantiene un objeto `state` de versión `v:5` con esta forma conceptual:

```json
{
  "v": 5,
  "start": "2026-10-13",
  "profile": {},
  "cart": {},
  "cartExtras": [],
  "done": {},
  "strength": {},
  "stock": {},
  "purchases": [],
  "weights": [],
  "prep": {},
  "archives": []
}
```

Claves históricas encontradas en el HTML:

- `mi_plan_saludable_v3_13oct` (la usa también la versión actual, aunque el estado sea v:5).
- `mi_plan_saludable_v2`.
- `mi_plan_saludable_v1`.

**No confiar en que el navegador pueda leer automáticamente el almacenamiento asociado a otro archivo `file://` o a un origen distinto.** La migración segura tiene que admitir exportar JSON desde la versión antigua e importarlo en la nueva. No borrar ni sobrescribir la copia original por defecto.

El modelo actual guarda `stock` como un saldo mutable y registra compras y comidas en estructuras separadas. Para soportar sincronización y evitar descuentos duplicados, evolucionarlo hacia movimientos de inventario trazables y operaciones idempotentes.

## 3. Funcionalidades actuales que hay que preservar

### 3.1. Menú rotatorio de 3 semanas

- 21 días, con 5 ingestas cada día: desayuno, media mañana, comida, media tarde y cena; 105 ingestas por ciclo.
- Semana 1 conserva el menú inicial; semanas 2 y 3 aportan variedad.
- Recetas con ingredientes, cantidades y elaboración clara; cocina habitual de 20-30 minutos, horno, microondas, airfryer y batidora.
- Fotografías ilustrativas con fallback si no hay conexión; comprobar atribución/licencias de cualquier recurso que se publique.
- Preferencias: desayunos frecuentes con yogur; **sin queso en los desayunos**, pero el queso puede estar presente en otras comidas. No hay restricciones alimentarias generales definidas.
- Compra principal en Mercadona y otra compra en frutería/verdulería.

### 3.2. Fechas del ciclo inicial

El **primer ciclo** comienza el **martes 13 de octubre de 2026** y finaliza el **lunes 2 de noviembre de 2026 (`2026-11-02`)**, ambos incluidos:

| Semana | Período |
| --- | --- |
| 1 | 13-19 octubre 2026 |
| 2 | 20-26 octubre 2026 |
| 3 | 27 octubre-2 noviembre 2026 |

- Antes del 13/10, indicar `Proximo inicio / Semana 1`; no mostrar falsamente semana 3.
- Durante el ciclo, mostrar la semana y el día correctos.
- Avisar **3 días antes del fin**, a partir del 30/10/2026, de que debe prepararse otro menú; permitir configurar 2 o 3 días de antelacion.
- Conservar descarga de un recordatorio `.ics`. Un aviso dentro del HTML **no es una notificacion push si la app esta cerrada**; no prometer lo contrario.
- Al acabar el ciclo, mantener el historial; no reiniciar compras, stock ni seguimiento por cambiar de ciclo.
- Los ciclos futuros deben poder empezar en otras fechas y almacenar otra versión del menú; nunca programar toda la lógica alrededor de octubre de 2026.
- Usar fechas de calendario locales `Europe/Madrid`. Probar cambios de horario (incluido el 25/10/2026). No sumar simplemente milisegundos para avanzar días civiles.

### 3.3. Perfil y nutrición dinámica

Campos soportados o propuestos:

- Sexo usado por la fórmula (hombre/mujer) o metabolismo introducido manualmente.
- Edad o fecha de nacimiento, altura, peso y registros históricos de peso.
- Movimiento cotidiano o nivel de actividad; entrenamientos de fuerza variables y posible bonus energético.
- Objetivo: mantenimiento, recomposicion, pérdida de grasa o ganancia muscular.
- Contexto de recuperación/lesión que evite objetivos energeticos agresivos.
- Opciones de adaptar raciones y utilizar tendencia de peso; cambios controlados y reversibles.

La implementación actual utiliza Mifflin-St Jeor como referencia de metabolismo en reposo, multiplicadores de actividad y objetivos de macros basados en el peso. Son **estimaciones**, no mediciones individuales. Mantener la fórmula verificable y las restricciones conservadoras, explicadas en la interfaz.

- Las raciones de **comidas pendientes** pueden recalcularse segun el perfil y los días de fuerza.
- Las raciones y macros de una **comida ya realizada se congelan** en su registro; no reescribir el historial al modificar peso, objetivo o sexo de la fórmula.
- No cambiar silenciosamente las recetas ni eliminar grupos de alimentos. Adaptar cantidades con límites razonables.
- No registrar mediciones de salud personales en código fuente ni datos de demostracion públicos.

### 3.4. Compra realista y despensa inteligente

Flujo UX obligatorio:

1. Elegir horizonte de compra: 3, 7, 14 días, semana visible, ciclo pendiente y, si aporta valor, `proxima semana`.
2. Calcular necesidades de las comidas **todavia no realizadas** del período elegido.
3. Restar existencias de despensa; convertir el deficit a envases, bandejas, botes y piezas enteras/comerciales.
4. Mostrar por establecimiento (Mercadona/frutería) y sección (carniceria, lácteos, frutas, verduras, conservas, etc.).
5. Mientras se compra, marcar articulos y ajustar número de envases o tamaño real del envase.
6. Permitir productos adicionales no previstos en el menú.
7. **Solo al pulsar `Finalizar compra`**, incorporar los articulos confirmados a la despensa y registrar el justificante de compra.
8. Los no marcados no se suman al inventario; no volver a registrar una compra por un doble clic o reintento de sincronización.

Casos especificos:

- Si hacen falta 800 g de pollo y hay 300 g, faltan 500 g: sugerir una bandeja de 500 g, segun el formato configurado.
- Si hacen falta 420 g de arroz y ya hay 650 g, no incluir arroz en la lista.
- Si se confirma un pack de 1 kg de arroz, entrar 1 kg de inventario, no solo los gramos planificados.
- Compra para 7 y 14 días debe usar **ventanas distintas**; no presentar igual cantidad por errores de índice de semana. Solo podrán coincidir cuando el ciclo remanente sea realmente menor o igual que ambas ventanas, explicandolo al usuario.
- Si se completa una receta, descontar sus ingredientes **una sola vez**; si se desmarca, revertir de forma controlada. Diferenciar cantidades consumidas de cantidades realmente disponibles en el inventario.
- Se deben poder registrar consumos fuera del menú, pérdidas/caducidades y correcciones manuales.
- Mantener unidades canonicas (`g`, `ml`, `ud`) y conversiones por formato comercial. Las piezas de fruta/verdura tienen pesos aproximados, no exactos: mostrar que son estimaciones editables.
- Considerar perecederos: desaconsejar comprar 14 días de fresco sin congelacion o reposicion.

### 3.5. Seguimiento y experiencia de uso

- Marcar comidas hechas desde el menú o su receta.
- Marcar cualquier día como entrenamiento de fuerza (no forzar lunes/miercoles/viernes).
- Registrar peso con fecha y visualizar tendencia; no confundir oscilaciones de agua con cambios de grasa.
- Mantener lista de tareas de preparación semanal, recetario, filtros, fotografías y ayudas.
- Estados visuales de datos: `Sincronizado`, `Pendiente de sincronizar`, `Sin conexion`, `Error / requiere accion`.
- Permitir exportar e importar una copia JSON de los registros.
- Mantener accesibilidad básica (teclado, etiquetas, contraste, feedback accesible).

## 4. Arquitectura objetivo

```text
Movil / ordenador
      |
      v
GitHub Pages (HTML/CSS/JS, HTTPS, URL estable)
      |
      +--> IndexedDB (cache local + cola de cambios pendientes)
      |
      v
Supabase Auth + Data API
      |
      v
Supabase PostgreSQL (datos privados + RLS)
```

**Decisiones:**

- Hosting del frontend en **GitHub Pages**, idealmente desde un repo público solo con código no sensible.
- Backend gestionado inicialmente en **Supabase Free**, con PostgreSQL, Supabase Auth y políticas Row Level Security.
- Cliente web con `@supabase/supabase-js`; usar clave **publishable** pública en frontend, nunca `service_role` ni clave secreta.
- Persistencia offline con **IndexedDB** para copia de trabajo y cola de operaciones; se sincroniza al reabrir la app o recuperar conexión. `localStorage` podría quedar para preferencias triviales, no como almacenamiento principal.
- Si hace falta una operación atómica compleja (por ejemplo, completar comida y descontar ingredientes), valorar una **función Postgres/RPC transaccional** con autenticación comprobada y sin eludir indebidamente RLS.
- Mantener exportacion/importacion JSON independiente del proveedor para facilitar restauraciones o una migración futura a PostgreSQL autogestionado.
- No requerir framework pesado. Preferir JS modular y sencillo, con tooling/build solo si se justifica por mantenibilidad, tests o despliegue.
- **No** utilizar GitHub como base de datos y **no** publicar historiales personales en commits, Issues o Actions.

### Restricciones operativas del plan gratuito

Supabase Free puede pausar proyectos por baja actividad durante una semana. Las copias de respaldo gestionadas disponibles en planes superiores no deben suponerse incluidas en Free. Por tanto:

- Mostrar claramente que `nube sincronizada` no significa `copia de seguridad permanente`.
- Facilitar copia JSON descargable y restauracion probada. Considerar recordatorios regulares de exportacion y, en una fase posterior, una estrategia de respaldo externo que **no exponga datos personales**.
- Ante proyecto pausado, mala conexión, expiracion de sesión o error de API, no perder ni sobrescribir la cola local; mostrar estado y pasos de recuperación.
- No buscar trucos de tráfico artificial para eludir limitaciones del plan.

## 5. Modelo de datos propuesto (diseño inicial, validar antes de migrar)

Distinguir **catálogos/versiones** de **datos personales y eventos**.

| Entidad | Función |
| --- | --- |
| `profiles` | `user_id`, preferencias, variables de nutrición, configuración y versión |
| `plan_cycles` | Ciclos de 21 días, fechas, estado y versión del menú |
| `plan_meals` | Día/slot/receta planificada y snapshot o referencia de porciones |
| `meal_logs` | Comida efectuada, fecha, receta, porciones congeladas, macros, id de operación |
| `weight_logs` | Peso, fecha, usuario y marca temporal |
| `training_logs` | Fuerza, descanso u otra actividad por fecha |
| `purchases` | Cabecera de compra confirmada (tienda, fecha, idempotency key) |
| `purchase_items` | Productos reales, número de paquetes, tamaño, cantidad canónica |
| `inventory_movements` | Libro de movimientos: entradas positivas, consumos y correcciones |
| `user_settings` | Preferencias auxiliares, avisos, unidades o versiones de ajustes |

Se pueden guardar catálogos estáticos (`FOOD`, `RECIPES`, formatos comerciales) como JSON versionado en el propio repositorio **si resulta más simple**. No crear una tabla por cada concepto sin justificarla. Guardar la versión del catálogo/receta usada para reproducir la historia aunque cambie el menú.

### Reglas de integridad

- Entidades privadas con `user_id UUID NOT NULL`; indices y RLS por propietario para `SELECT`, `INSERT`, `UPDATE` y `DELETE` cuando proceda.
- UUIDs para entidades y operaciones. Claves unicas para evitar que una comida se complete dos veces por fecha/slot/ciclo o que una misma compra se aplique dos veces.
- Inventario preferiblemente **derivado de la suma de movimientos**; no considerar `stock` y `movimientos` dos fuentes de verdad simultaneas.
- Movimientos inmutables o compensados mediante nuevos eventos. Deshacer comida = reverso idempotente; no reejecutar acciones de stock sin comprobar estado.
- El consumo real de ingredientes debe preservar el snapshot de porciones completadas, incluso si el perfil cambia días después.
- Si la despensa registra menos de lo consumido, no inventar stock negativo silenciosamente: advertir/describir discrepancia o registrar consumo no cubierto segun una regla única, documentada y comprobada.
- Separar borrador de carrito de compra confirmada.
- Toda operación sin conexión debe tener identificador persistente para deduplicar reintentos.
- Importacion histórica debe evitar mezclar datos de otro usuario, duplicar operaciones o sobrescribir sin previsualizacion.
- Fechas: registrar `date` local para plan/comidas/peso; `timestamptz` para momento de creacion y sincronización.

## 6. Sincronización y conflictos

Diseñar el flujo **offline-first** sin prometer sincronización al estar cerrada la web.

1. Acción de usuario -> guardar inmediatamente en IndexedDB con `operation_id` UUID y estado `pending`.
2. Actualizar interfaz optimistamente, diferenciando estado local y remoto.
3. Con sesión y conexión disponibles -> enviar a Supabase.
4. Confirmacion del servidor -> marcar `synced` y reconciliar datos; si falla, conservar pendiente para reintento.
5. Al abrir app u obtener foco/conexión -> recuperar cambios remotos y reintentar cola local.

**Conflictos:** compras y movimientos no deben fusionarse por `last write wins` porque se perderian consumos. Utilizar eventos idempotentes y operaciones transaccionales. Para ajustes de perfil y preferencias puede ser suficiente una estrategia de versión/actualización con aviso de conflicto. Documentar comportamiento con dos dispositivos y con dos pestañas del mismo navegador.

## 7. Migración desde la app HTML local

**Peligro principal: pérdida de seguimiento existente.** Antes de cualquier importacion o conversion automatica:

1. Mantener funcional el HTML previo y su boton `Exportar JSON`.
2. Definir esquema y versión de exportacion nuevos; conservar compatibilidad de lectura con JSON legacy `v1-v5` si el contenido lo permite.
3. Validar JSON contra un esquema: ids de ingredientes conocidos, cantidades finitas, unidades, fechas correctas, límite de tamaño y estado de ciclo.
4. Mostrar previsualizacion: perfiles, número de comidas, pesos, compras, stock y rangos de fecha encontrados.
5. Dar opción explicita entre importar en cuenta vacia o fusionar controladamente. No realizar sobrescritura silenciosa.
6. Crear operaciones/IDs deterministas o un `import_batch_id` para **no duplicar movimientos al importar el mismo JSON dos veces**.
7. Tratar saldos `stock` legacy como **saldo inicial migrado**; no volver a aplicar compras y comidas históricas encima si esos movimientos ya están reflejados en el saldo.
8. Conservar datos históricos y posibles archivos de ciclos erroneos como archivo consultable cuando corresponda, sin convertirlos automáticamente en el ciclo correcto.
9. Probar restauracion y exportacion después de migrar.

No prometer importacion automatica entre origenes distintos (`file://`, `https://usuario.github.io`); la alternativa garantizable para el usuario es el archivo JSON exportado.

## 8. Seguridad y privacidad

- Supabase Auth con inicio de sesión privado (por ejemplo email con OTP/enlace o método equivalente disponible); no inventar contraseñas compartidas ni incrustar credenciales.
- Activar RLS en **todas** las tablas con datos de usuario; verificar aislamiento con al menos dos cuentas de prueba.
- En navegador solo clave publishable y URL del proyecto; jamas `service_role`, secretos, cadenas SQL de administrador ni tokens persistentes en el repositorio.
- Configurar correctamente origen del sitio y redirecciones permitidas del sistema Auth de Supabase.
- Proteger el tratamiento de campos dinamicos frente a HTML inyectado; sanitizar o construir nodos de forma segura.
- No versionar `.env` con secretos, exportaciones privadas, volcados de BD, bases de datos locales ni datos médicos/nutricionales personales.
- Un sitio de GitHub Pages es **publicamente accesible**: privatizar datos en Supabase + RLS, no asumir privacidad del frontend.
- La autenticación no sustituye las copias de seguridad ni RLS.

## 9. Etapas de implementación (una fase a la vez)

### Fase 0 - Auditoría de la base actual

- Inspeccionar HTML y estructura real del repositorio; listar funciones, estado, dependencias, acoplamientos y errores existentes.
- Extraer/priorizar pruebas de cálculos nutricionales, fechas, carrito y stock antes de refactorizar.
- Proponer la estructura mínima de carpetas para GitHub Pages. Preparar README de instalacion local.
- **Entregable:** diagnostico, riesgos, propuesta de migración, backlog y criterios verificables.

### Fase 1 - Publicacion estable sin pérdida de funciones

- Mantener pagina estática funcionando desde HTTPS bajo URL fija de GitHub Pages.
- Extraer módulos JS/CSS si ayuda sin cambiar la UX.
- Confirmar compatibilidad móvil/ordenador; fotos con fallback; exportacion JSON y uso del plan.
- Documentar despliegue, configuración de la ruta base y publicacion. No poner datos privados en el repositorio.

### Fase 2 - Auth, SQL y seguridad

- Definir migraciones SQL versionadas, indices, integridad, RLS y pruebas de seguridad.
- Crear integracion `supabase-js` usando configuración pública; Auth y sesión.
- Formular mecanismo de importacion desde JSON.
- **No dar por terminada la fase sin comprobar aislamiento entre usuarios.**

### Fase 3 - Persistencia y migración

- Implementar repositorios o adaptadores de datos (local/remote), IndexedDB y cola.
- Sincronizar perfil, ciclos, entrenamientos, pesos, comidas y preparación.
- Importacion reversible y sin duplicados; backups probados.
- Estados visibles de sincronización y errores recuperables.

### Fase 4 - Compras e inventario transaccional

- Modelo de movimientos y saldos; compra por envases/comercios.
- Completar/deshacer comidas sin duplicar consumos; compras idempotentes.
- Ajustes manuales, consumos externos y descuentos con historial.
- Probar 3/7/14 días, cambio de semana, cambio de perfil y dos dispositivos.

### Fase 5 - Robustez y documentación final

- Pruebas unitarias/integracion/E2E realistas y test de restauracion JSON.
- Accesibilidad, responsive, tiempos de carga, errores offline y sesión expirada.
- Documentar alta de nuevo usuario, despliegue, restauracion y límites del plan gratuito.

No adelantar funciones nuevas (IA, lector de tickets, escaneo de código de barras, notificaciones push o menús generados automáticamente) hasta que la persistencia y compra esten estabilizadas.

## 10. Pruebas de aceptacion mínimas

### Calendario

- Fecha actual antes de 13/10/2026 -> semana 1 futura.
- 13/10 -> primer día; 20/10 -> semana 2; 27/10 -> semana 3.
- 30/10 -> aviso de renovacion; 02/11 -> ultimo día; 03/11 -> ciclo finalizado sin borrar historial.
- Cambio horario europeo de octubre no desplaza comidas a otro día.

### Nutrición e historial

- Cambiar peso, estatura, sexo de la fórmula, actividad u objetivo -> recalcula **solo** porciones pendientes; ya completadas mantienen cantidades/macros registrados.
- Días de fuerza elegidos libremente sin cambiar los demas.
- Regla de lesión/recuperación evita recortes energeticos agresivos.

### Compra y despensa

- 7 días y 14 días desde inicio del ciclo incluyen, respectivamente, 35 y 70 ingestas pendientes, sin estado ya completado; no devolucion identica de cantidades si difieren necesidades reales.
- Stock suficiente para un producto -> no recomendar compra.
- Productos solo marcados en carrito -> inventario intacto hasta finalizar compra.
- Finalizar -> entra cantidad real confirmada, extras incluidos.
- Reintentar la misma operación -> no duplica stock.
- Completar y deshacer comida -> movimiento y reverso correctos, una sola vez.
- Consumos externos/ajustes alteran la siguiente compra.
- Dos dispositivos -> un inventario coherente tras sincronización; offline conserva cambios sin sobrescribirlos accidentalmente.

### Persistencia y privacidad

- Recargar pagina, reiniciar navegador, acceder desde otro equipo -> datos remotos conservados tras login.
- Borrar datos locales -> recuperación desde nube si existe y desde JSON exportado si no existe.
- Error de red/servidor o proyecto pausado -> cambios pendientes localmente y aviso visible; no indicar falsamente `sincronizado`.
- Cuenta A no puede consultar, insertar, editar ni borrar registros de cuenta B.
- Importar dos veces el mismo backup -> no duplica compras ni movimientos.

## 11. Forma de trabajar de Codex

1. Leer `README.md`, `AGENTS.md` si existe, este `context.md` y el código de la app antes de modificar.
2. No dar por implementado algo descrito aquí sin comprobarlo en el repositorio.
3. Proponer primero la arquitectura mínima, migraciones y plan concreto por fases; identificar decisiones pendientes y limitaciones del Free plan.
4. Aplicar cambios pequenos y trazables, preferentemente con tests por cada regla de negocio critica.
5. No romper datos previos: comprobar la compatibilidad con el JSON legado y el funcionamiento actual.
6. No instalar dependencias innecesarias ni incorporar servicios de pago.
7. Si se necesita que el usuario configure Supabase/GitHub, proporcionar instrucciones reproducibles y **no solicitar secretos para incluirlos en commits**.
8. Verificar ejecución, tests y despliegue local antes de declarar una fase completa. Diferenciar resultados comprobados de tareas pendientes.
9. Documentar cambios relevantes en README y agregar instrucciones de recuperación/exportacion.

### Primera tarea recomendada a Codex

> Audita el repositorio tomando `context.md` y el HTML existente como referencia. Quiero migrar Mi Plan Saludable desde `localStorage` a GitHub Pages + Supabase PostgreSQL con autenticación, RLS, soporte offline e importacion de backups JSON. **No reescribas la aplicación ni cambies las recetas todavia.** Primero identifica los componentes, estado y dependencias reales, los riesgos de migración, propone un modelo de datos mínimo, tests de aceptacion y un plan incremental para las fases 0-2. Después implementa únicamente la primera fase acordada de forma verificable.

## 12. Referencias oficiales para verificar al implementar

Verificar cualquier detalle cambiante contra las fuentes oficiales antes de codificar:

- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- Seguridad y HTTPS en GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
- Supabase JavaScript: https://supabase.com/docs/reference/javascript/auth
- Claves publishable vs secret: https://supabase.com/docs/guides/getting-started/api-keys
- Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Pausa de proyectos Free: https://supabase.com/docs/guides/platform/free-project-pausing
- Precios y límites: https://supabase.com/pricing

**Criterio final de éxito:** conservar la facilidad de uso del HTML original, pero conseguir una app privada y persistente donde las comidas, las compras, la despensa y el peso puedan recuperarse, sincronizarse y auditarse sin duplicados ni pérdidas silenciosas.
