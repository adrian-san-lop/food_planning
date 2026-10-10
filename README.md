# Mi Plan Saludable

Aplicación web personal para consultar un menú de tres semanas, preparar recetas, registrar comidas, controlar la despensa y llevar el seguimiento del peso.

## Estado actual

- `index.html` es la entrada de GitHub Pages y redirige al HTML de la aplicación.
- La app conserva las recetas y el diseño existentes; sus datos se guardan en `localStorage` del navegador.
- El estado de datos actual es v6. Se convierte una copia v5 existente al abrir la app, incluyendo la conversión de piezas frescas que antes se guardaban en gramos.
- Las importaciones admitidas son v5 y v6. No se importan datos v1-v4.
- Las compras, consumos, reversos y correcciones nuevas se anotan como movimientos con identificador único. Si una receta supera el saldo anotado, se registra completa y se muestra el faltante.
- Hay un recordatorio semanal dentro de la página para descargar una copia JSON. No envía notificaciones del sistema.
- Los valores de perfil que usa una instalación nueva son ejemplos genéricos, no datos personales.
- La página se puede servir desde GitHub Pages, pero aún no hay base de datos, inicio de sesión ni sincronización entre dispositivos. El alojamiento web no convierte `localStorage` en almacenamiento en la nube.

### Pasar los datos v5 a la página nueva

El navegador no comparte automáticamente el almacenamiento del HTML local con la dirección `https://…github.io`. En la versión v5, descarga una copia JSON con **Exportar copia**; luego abre la página de GitHub Pages y usa **Importar copia JSON**. La importación admitida comienza en v5; los formatos anteriores no se convierten.

## Publicar en GitHub Pages

1. En GitHub, abre **Settings → Pages**.
2. En **Build and deployment**, elige **Deploy from a branch**.
3. Selecciona la rama `main` y la carpeta `/(root)`, y guarda.
4. Espera a que termine la publicación y abre la dirección que muestra GitHub en esa misma sección.

La raíz contiene `index.html`, que es la entrada del sitio; su redirección es relativa y funciona también cuando GitHub Pages publica el repositorio bajo una subruta. GitHub indica que el archivo de entrada debe estar en la raíz de la carpeta publicada. La página publicada es accesible por Internet, aunque el repositorio sea privado, así que no se deben incluir copias de seguridad ni datos personales en el repositorio. [Crear un sitio de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site) · [Elegir la fuente de publicación](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Inventario y unidades

| Unidad | Alimentos |
| --- | --- |
| `ud` | Huevos y frutas/verduras enteras: plátano, manzana, kiwi, mandarina, naranja, pera, fruta de temporada, aguacate, tomate, pimiento, calabacín, cebolla, zanahoria, brócoli, pepino, patata y boniato. |
| `g` | Carnes, pescado, cereales, legumbres, frutos secos, aceite, café molido, bayas, hojas verdes, champiñones, espárragos, guisantes, judías verdes, calabaza, berenjena, coliflor, lombarda, puerro, apio y productos cortados, congelados o envasados. |
| `ml` | Leche y líquidos. La leche se propone en tetrabriks de 1 L. |

Se aceptan fracciones de unidad, como `0,5 ud`. Los pesos comestibles por pieza son aproximados; la lista de compra los usa para convertir recetas en paquetes orientativos y permite editar el contenido del paquete.

## Catálogos de alimentos y recetas

Los catálogos JSON conservan los datos genéricos que ya usa la aplicación y se han ampliado por separado:

- [`data/foods.json`](data/foods.json): alimentos, unidades, valores nutricionales aproximados, peso comestible por pieza cuando aplica y formato orientativo de compra.
- [`data/recipes.json`](data/recipes.json): recetas para una ración, ingredientes enlazados por el identificador estable del alimento, cantidades alternativas para días de fuerza cuando existen, pasos, tiempo y notas.

Son datos genéricos del recetario; no incluyen perfil, peso, despensa ni otros datos de uso personal. La app todavía **no carga estos ficheros**: sigue usando los catálogos incluidos en el HTML. La separación en JSON es la base para una integración posterior y no cambia el funcionamiento actual.

Los catálogos están ahora en la versión `0.2.0`: 83 alimentos, 107 recetas y 512 referencias de ingredientes. Esta ampliación conserva los 63 alimentos y 84 recetas del HTML, añade 20 alimentos y 23 recetas, y enlaza cada receta por el ID estable de sus ingredientes. Las nuevas estimaciones nutricionales usan referencias genéricas de [USDA FoodData Central](https://fdc.nal.usda.gov/); cada alimento incluye su referencia, pero los valores y formatos de compra siguen siendo aproximados y deben ajustarse a las etiquetas y envases reales. La versión del catálogo es independiente de la versión del estado personal guardado en el navegador.

El objetivo acordado es que, una vez integrada la planificación, cada ciclo de tres semanas se proponga desde estos catálogos y sus reglas; la propuesta se podrá revisar y ajustar. La integración del planificador se realiza una vez. Después, la generación de una propuesta se repite en cada ciclo.

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

Ejemplo: si hay `2 ud` de plátano y registras una receta que usa `2,5 ud`, la app anota el consumo completo. El saldo queda en `−0,5 ud` y la interfaz muestra ese faltante. Si después desmarcas la comida, añade un movimiento inverso; no borra el historial ni vuelve a descontar por un reintento.

Este dibujo explica el modelo previsto para sincronizar datos en una base remota. La versión actual conserva el estado en un objeto del navegador, no en tablas relacionales. La conexión remota, autenticación y reglas de acceso aún están pendientes. Si se añade Supabase, sus tablas expuestas deberán protegerse con autenticación y Row Level Security (RLS), incluso siendo una app de una sola persona. [Documentación oficial de RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) · [Claves de API](https://supabase.com/docs/guides/getting-started/api-keys) · [Autenticación con JavaScript](https://supabase.com/docs/reference/javascript/auth).

## Datos y copias de seguridad

Los datos actuales permanecen en el almacenamiento del navegador y no aparecen automáticamente en otro navegador o dispositivo. Descarga el archivo JSON cuando aparezca el recordatorio semanal y guárdalo en una ubicación privada. El archivo incluye datos personales del perfil y del seguimiento. **No lo subas a GitHub ni lo compartas.** Puedes restaurarlo con **Importar copia JSON**.

## Archivos principales

- `plan_alimentacion_dinamico_3_semanas.html`: aplicación completa en un único archivo.
- `index.html`: entrada que redirige a la aplicación.
- `data/foods.json` y `data/recipes.json`: catálogos genéricos iniciales; el HTML todavía no los carga.
- `context.md`: resumen breve en inglés para retomar el trabajo.
- `AGENTS.md`: instrucciones en inglés para agentes de código.
- `docs/product/requirements.md`: alcance y flujos del producto.
- `docs/architecture.md`: estado actual y arquitectura prevista.
- `docs/planner/specification.md`: catálogos, reglas aceptadas y propuestas del planificador.
- `docs/roadmap.md`: etapas candidatas y criterios de aceptación que deben conservarse.
- `docs/decisions/`: registro de decisiones con su estado.
- `docs/open-questions.md`: propuestas y cuestiones que aún requieren decisión.
