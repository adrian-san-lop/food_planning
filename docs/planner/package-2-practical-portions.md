# Paquete 2: raciones prácticas

- Fecha: 22/10/2026.
- Estado: **Implementado y probado localmente** en `chore/practical-portions`, desde `dev` limpio y actualizado. Sin commit, publicación ni cambios en Supabase en este paquete.
- Alcance: segundo paquete del [plan integrado](implementation-plan.md), según [ADR-0047](../decisions/0047-guided-first-use-and-personalized-planning.md).

## Comportamiento

El ajuste automático conserva los platos y sus ingredientes, pero limita las cantidades por alimento y las redondea a pasos prácticos. Se mantienen las fórmulas de reposo, movimiento, objetivos y macronutrientes y los márgenes relativos anteriores de ajuste: proteína 0,60–1,65; grasa 0,65–1,55; hidratos 0,52–1,90. Ahora también se respetan límites absolutos por alimento y comida. No se amplían para alcanzar exactamente las kcal.

Ejemplos del escalado, antes de considerar el resto del día:

| Cantidad base y factor calculado | Resultado con la regla |
| --- | --- |
| 250 g de yogur alto en proteínas × 1,65 | 300 g, su máximo. |
| 70 g de arroz seco × 1,90 | 120 g, su máximo. |
| 20 g de nueces × 1,55 | 30 g, su máximo. |
| 2 rebanadas × 1,90 | 2 rebanadas enteras. |

Estos números son límites del producto para conservar raciones manejables; no son recomendaciones médicas ni nuevos objetivos nutricionales. Los pasos de redondeo pueden dejar una diferencia respecto al objetivo, también en perfiles habituales.

Las nuevas reglas se usan en las cantidades pendientes del menú actual, en la revisión de propuestas y en la compra derivada. No cambian los IDs de los platos elegidos. Al desactivar Raciones automáticas se utilizan exactamente las cantidades base. Las comidas registradas conservan sus cantidades, incluso si contienen fracciones o porciones antiguas que el cálculo nuevo ya no propondría.

## Catálogo 0.10.0

Ambos JSON pasan a `catalogVersion: 0.10.0`; `schemaVersion` sigue en 1. Se conservan los 90 alimentos, las 112 recetas y las 543 referencias, todos los IDs, unidades, pesos por pieza, fuentes y valores nutricionales, cantidades base, pasos y tiempos. Los resultados nutricionales base de la auditoría anterior siguen siendo aplicables.

`foods.json` añade 52 políticas opcionales `portion`: 44 ajustables y ocho fijas para fruta entera y huevos. Los otros 38 alimentos conservan la cantidad de la receta, sin inferirles un grupo por su nombre ni escalar condimentos para completar kcal.

```json
"portion": { "group": "protein", "min": 50, "max": 300, "step": 25 }
```

`group` admite `protein`, `carb`, `fat` y `fixed`. `min`, `max` y `step` se expresan en la unidad de receta, por persona y comida, nunca en envases ni en unidades de despensa. La política es obligatoria para alimentos de receta en `ud`, de modo que no se puedan omitir sus reglas de piezas y rebanadas. La fuente de los valores concretos es [foods.json](../../data/foods.json), no una lista duplicada en JavaScript.

| Alimentos | Rango | Paso |
| --- | --- | --- |
| Yogur alto en proteínas | 50–300 g | 25 g |
| Yogur griego | 100–250 g | 25 g |
| Queso fresco / cottage | 40–150 / 50–200 g | 10 / 25 g |
| Pollo, pavo fresco, cerdo, ternera y pavo picado | 75–250 g | 25 g |
| Pavo loncheado | 30–120 g | 10 g |
| Merluza, bacalao, trucha y gambas | 100–250 g | 25 g |
| Salmón | 100–225 g | 25 g |
| Atún / sardinas / caballa escurridos | 50–180 / 50–150 / 60–180 g | 10 g |
| Gulas / tofu / tempeh / edamame | 75–200 / 75–250 / 50–175 / 50–200 g | 25 g |
| Soja texturizada seca | 25–75 g | 5 g |
| Granola / avena | 15–60 / 10–80 g | 5 g |
| Arroz, pasta y fideos secos | 30–120 g | 10 g |
| Quinoa y cuscús secos | 30–100 g | 10 g |
| Tortilla integral de trigo | 35–70 g | 35 g |
| Patata y boniato | 80–350 g | 10 g |
| Pasas / maíz escurrido | 5–25 / 20–100 g | 5 / 10 g |
| Aceite de oliva | 2–15 g | 1 g |
| Nueces, almendras y crema de cacahuete | 5–30 g | 5 g |
| Aguacate | 20–100 g | 10 g |
| Chía / pipas de calabaza / tahini | 5–15 / 5–20 / 5–25 g | 5 g |
| Pan de molde | 1–2 rebanadas | 1 rebanada |
| Fruta entera | Cantidad base, 0,5–2 piezas admitidas | Medias piezas admitidas; sin escalado. |
| Huevos | Cantidad base, 1–3 unidades admitidas | Unidades enteras; sin escalado. |

Los rangos se comprueban contra la cantidad base por ración. Las cantidades base en gramos pueden no coincidir con el paso: se conservan en el recetario y con el ajuste desactivado; el redondeo se aplica al escalar. La fruta conserva medias piezas, los huevos unidades enteras y el pan un máximo de dos rebanadas enteras. Las verduras troceadas siguen en gramos; café, leche y condimentos mantienen sus cantidades.

## Código y validación

- `js/domain/recipe-portions.js` valida y aplica límites y pasos, sin acceso al perfil, DOM, persistencia ni stock. Conserva `scaleBreadSlices` para que un módulo nutricional anterior todavía en caché pueda importar esa función.
- `js/domain/nutrition.js` recibe los metadatos del catálogo. Sustituye las listas de IDs por el grupo de `portion`; un ingrediente sin política conserva su cantidad. Agrupa ingredientes repetidos antes de ajustar para aplicar el límite al total por alimento en una comida.
- `js/data/catalogs.js` y `foods.schema.json` validan la nueva estructura. El validador de ejecución comprueba además el orden y alineación de límites/paso, las reglas de piezas y las cantidades por `baseServings`, sumando referencias repetidas. Un catálogo incompatible se rechaza en lugar de corregirlo silenciosamente.
- `evaluateRecipePortions` devuelve cantidades, totales, objetivo y diferencia firmada (`total − objetivo`) para kcal, proteína, hidratos y grasa. El planificador usa esa evaluación común. No se añade una tolerancia numérica ni se declara adecuado un menú solo por no lanzar un error. La presentación semanal de diferencias y alternativas corresponde a los paquetes posteriores.
- Las ayudas actuales de Perfil y Menú explican los límites, las cantidades prácticas y el carácter aproximado de las kcal.

No hay cambios de tablas, RPC, contrato de sincronización ni estado personal v11. La carga remota y los módulos nuevos de configuración y preferencias mantienen el alcance del paquete 1. La nutrición, la ficha de receta y la compra utilizan la misma cantidad calculada; las conversiones existentes a despensa permanecen: pan a 25 g/rebanada y verdura por su peso aproximado por pieza.

## Comprobaciones realizadas

- **105 pruebas correctas**, frente a las 94 del inicio. Se conservan las pruebas de nutrición, generación/familiaridad, snapshots, inventario, conciliación y estados v5-v11.
- Las 112 recetas pasan por 48 combinaciones (cuatro objetivos × seis niveles × dos perfiles sintéticos), en días de cinco comidas: 5376 evaluaciones, sin cantidades inválidas, pérdida de ingredientes ni incumplimiento de límites/redondeos. Los ingredientes fijos conservan sus cantidades.
- Casos de actividad añadida, objetivos extremos e imposibles, ajuste desactivado, ingredientes repetidos y snapshots históricos fuera de los límites nuevos. Las metas de proteína/grasa permanecen estables; la energía de sesión ajusta los hidratos pendientes dentro de los límites.
- Ejecución de los handlers reales de `main.js` en pruebas locales: necesidades de compra, registro y reverso de una comida con despensa parcial o vacía. Se conservan consumo completo, saldo no negativo, exclusión de comidas completadas de la compra y reversos idempotentes.
- Ambos catálogos validados también contra JSON Schema Draft 2020-12. Los informes nutricionales anteriores siguen coincidiendo, sin recalcular ni alterar evidencias históricas.
- Navegador por HTTP local: módulos y catálogos reales 0.10.0, las 112 recetas y cuatro objetivos (448 días evaluados) con datos sintéticos. Sin iniciar Auth ni escribir en Supabase; página, pestaña y servidor de prueba retirados al finalizar. No equivale a validar el recorrido autenticado publicado.

El siguiente paquete es el **generador común** para primer ciclo y renovaciones, con preferencias, tiempos, evaluación semanal y previsión de despensa, preservando familiaridad y bloqueos.
