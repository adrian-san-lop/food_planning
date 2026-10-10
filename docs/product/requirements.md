# Requisitos del producto

Estado de referencia: 10 de octubre de 2026. Este documento reúne el alcance acordado; lo que aún sea una propuesta aparece señalado como tal.

## Propósito y usuarios

Mi Plan Saludable ayuda a organizar comidas de tres semanas, consultar recetas, preparar compras, controlar existencias, registrar entrenamientos y seguir el peso. La versión actual es personal, para una sola persona y requiere conexión. El propietario quiere mantener el coste de uso en cero dentro de los límites de los servicios gratuitos.

La posibilidad de que otras personas tengan gustos distintos se está considerando para el diseño futuro. **No significa que el alcance actual ya sea multiusuario o que se haya aprobado un modo de menú compartido.**

## Alcance funcional

### Implementado en el HTML actual

- Un menú fijo de tres semanas con cinco espacios diarios: desayuno, media mañana, comida, media tarde y cena (105 espacios por ciclo).
- Recetas, instrucciones, fotografías orientativas y adaptación de cantidades según el perfil y los días de fuerza.
- Lista de compra, formatos comerciales orientativos, inventario, consumos y ajustes.
- Seguimiento de entrenamientos y peso.
- Estado del usuario en `localStorage`; exportación/importación JSON y aviso semanal de copia dentro de la página.
- Inventario negativo permitido cuando se registra una comida que supera las existencias; se muestra el faltante y desmarcar la comida revierte el consumo.

### Perfil y nutrición

El HTML contempla sexo o metabolismo basal manual, edad, altura, peso, actividad, objetivo, entrenamientos de fuerza y un indicador de recuperación/lesión. Usa Mifflin-St Jeor como estimación del metabolismo en reposo, objetivos aproximados de energía/macros y adaptación de raciones. No son mediciones clínicas.

Las comidas pendientes pueden recalcular porciones al cambiar el perfil. Las comidas ya realizadas conservan sus cantidades registradas; no se debe reescribir su historial. El desayuno suele incluir yogur y no debe incluir queso según la preferencia vigente. No hay otras restricciones alimentarias generales definidas.

### Compra y despensa

- La compra puede calcularse para 3, 7 o 14 días, la semana visible o el ciclo pendiente; solo considera comidas futuras no realizadas.
- Restar existencias, mostrar faltantes y traducirlos a envases orientativos. Mostrar por establecimiento y sección (compra principal en Mercadona y frescos en frutería).
- Marcar un artículo no lo añade al inventario. Solo confirmar/finalizar la compra incorpora el contenido realmente comprado. Los artículos no confirmados no se registran.
- Permitir extras, correcciones manuales, desperdicios y consumos fuera del menú.
- 7 y 14 días deben representar ventanas distintas. Pueden coincidir cuando el ciclo restante sea menor o igual que ambas ventanas, indicándolo.
- Evitar recomendar 14 días de productos frescos sin explicar que requieren congelación o reposición.

### Ciclo actual y calendario

El HTML tiene como ciclo inicial fijo del 13 de octubre al 2 de noviembre de 2026 (tres semanas). Esta fecha es un dato de la versión actual, no una regla para ciclos futuros. Los ciclos futuros deben guardar fechas y menú propios, mantener historial y no reiniciar la despensa ni los pesos.

El aviso de renovación actual aparece dentro de la página cerca del final del ciclo; no es push. El producto acordado no envía avisos en segundo plano. Los días civiles deben calcularse en `Europe/Madrid`, sin depender de sumar intervalos fijos de milisegundos.

### Cocina y seguimiento

- Platos principales normalmente sencillos, en torno a 20–30 minutos; se dispone de horno, microondas, freidora de aire y batidora. Snacks/desayunos pueden requerir menos tiempo.
- Marcar comidas realizadas desde menú o recetario; cada consumo se aplica una sola vez. Desmarcar genera el reverso correspondiente.
- Marcar días de fuerza libremente, registrar peso con fecha y consultar tendencia sin interpretar fluctuaciones puntuales como cambios de grasa.
- Mantener la app responsive y accesible; las fotos son orientativas y deben conservar atribución/licencia al modificarse.

### Objetivo acordado, aún no implementado

- Mantener una biblioteca común y versionada de alimentos y recetas en `data/foods.json` y `data/recipes.json`.
- Al renovar un ciclo de tres semanas, formar una propuesta nueva usando las recetas compatibles de esa biblioteca. Las recetas pueden repetirse, pero la propuesta debe procurar incluir algunas que no aparecieran en el menú reciente.
- Permitir revisar la propuesta y cambiar o bloquear comidas antes de confirmar el ciclo.

La app todavía tiene menús fijos en el HTML y **no carga** los JSON. La renovación dinámica y sus controles de usuario no deben describirse como disponibles.

## Reglas funcionales aceptadas para el futuro planificador

1. Conservar el cálculo nutricional y de raciones existente como referencia y optimizar hacia los objetivos; no descartar una receta por una desviación pequeña.
2. Favorecer recetas que aprovechen el stock, sin bloquear por existencias insuficientes. La lista de compra mostrará el faltante.
3. Buscar variedad y evitar repeticiones cercanas; permitir repetir cuando la biblioteca o las restricciones lo requieran.
4. Presentar una propuesta que se pueda revisar, intercambiar y bloquear frente a una regeneración.

Estos principios están aceptados. Las puntuaciones, umbrales y cantidades mínimas de novedad siguen abiertas; véase [preguntas abiertas](../open-questions.md).

## Preferencias alimentarias y personalización

- Preferencias por persona deben mantenerse separadas de los catálogos compartidos.
- **Propuesta pendiente:** distinguir gustos (favorito, indiferente, evitar) de restricciones firmes (por ejemplo, alergia o intolerancia). No se ha aprobado aún el vocabulario ni la lógica de combinación.
- **Propuesta futura:** si se comparte un menú entre varias personas, considerar las restricciones de cada integrante y calcular las cantidades para el total de comensales. Aún no se ha decidido si se necesita un menú común o uno por persona.
- No introducir restricciones alimentarias médicas por defecto. El perfil actual no define restricciones generales.

## Unidades y compras

- Usar `ud` para huevos y frutas/verduras enteras: plátano, manzana, kiwi, mandarina, naranja, pera, fruta de temporada, aguacate, tomate, pimiento, calabacín, cebolla, zanahoria, brócoli, pepino, patata y boniato. Se permiten fracciones; los pesos comestibles por pieza son aproximados.
- Usar `g` para ingredientes pesados, envasados, cortados, congelados o vendidos por peso; usar `ml` para líquidos. En el catálogo 0.2.0, berenjena, coliflor, lombarda, puerro y apio se registran en gramos.
- La leche se compra en tetrabriks de 1 L. El café molido se controla en gramos y figura en los desayunos.
- Al finalizar la compra, registrar el contenido real confirmado, no solo la cantidad planificada. Permitir ajustar el tamaño estimado del envase.

## Privacidad y continuidad

- Los catálogos son datos genéricos; no deben contener perfiles, pesos, preferencias personales, despensa, comidas completadas ni copias de seguridad.
- GitHub Pages es alojamiento estático y de acceso público. `localStorage` no sincroniza entre dispositivos.
- No añadir colas offline, avisos en segundo plano ni notificaciones push. El aviso semanal de copia solo aparece dentro de la página.
- La arquitectura remota y autenticada está pendiente; las decisiones técnicas actuales están en [arquitectura](../architecture.md).
