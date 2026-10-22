# ADR-0006 — Separar las unidades de receta e inventario

- Estado: Aceptada, revisada el 2026-10-17 e implementada localmente
- Fecha: 2026-10-11
- Alcance: catálogo de alimentos, recetas, nutrición, despensa, compras y migración de estados locales

## Contexto

Contar una pieza entera es útil al comprar y registrar existencias, pero no permite pesar con precisión el ingrediente usado por una receta. Por ejemplo, una receta debería pedir `250 g` de brócoli aunque la despensa se controle en piezas.

## Decisión

- Definir `food.unit` como unidad de inventario, movimientos y contenido de compra.
- Definir `food.recipeUnit` como unidad usada en las cantidades de ingredientes de recetas.
- Expresar en `ud` las raciones de plátano, manzana, kiwi, mandarina, naranja, pera y fruta de temporada, tanto en la receta como en despensa/compra. Admitir medias piezas cuando la preparación lo indique.
- Mantener en gramos de receta las verduras, el aguacate y otros sólidos que se usan troceados o en cantidades parciales; despensa/compra puede seguir contándolos por `ud` con su peso comestible aproximado.
- Medir el pan integral de molde en rebanadas enteras (`ud`) en recetas, con un máximo de dos rebanadas por comida, y mantener despensa/compra en gramos. Usar un peso orientativo de 25 g por rebanada para convertir cantidades y estimar nutrición.
- Mantener huevos en `ud` tanto en receta como en inventario y líquidos en `ml`; los demás sólidos se pesan en `g`.
- Aplicar la unidad de receta a nutrición y cantidades de receta; convertir consumo, necesidades de compra y faltantes a la unidad de inventario cuando difiera. Los saldos, compras y movimientos siguen expresados en la unidad de inventario.
- Permitir editar el contenido real del envase de compra. Las conversiones basadas en el peso por pieza son estimaciones genéricas.

## Consecuencias

- En la revisión del 17/10/2026, `catalogVersion` `0.9.0` cambió siete frutas a unidades de pieza en receta y pan de molde a rebanadas en receta; la revisión `0.9.1` deja todas las porciones de pan en rebanadas enteras, con un máximo de dos por comida. Despensa y paquetes de pan siguen en gramos. Las recetas de frutas se ajustan a una pieza, media manzana o una/dos mandarinas según sus pasos.
- El peso por pieza o rebanada aproxima la nutrición cuando la receta usa `ud`. El catálogo conserva la base nutricional por 100 g y deriva el valor por unidad usando ese peso medio.
- El estado local pasa a v10. Las instalaciones v5-v9 convierten consumos históricos de los alimentos afectados a la unidad de receta vigente, sin alterar movimientos de despensa en sus unidades históricas. Las instantáneas relacionales remotas se convierten al leerlas usando el `recipe_unit` guardado; la siguiente sincronización las escribe en unidades actuales.
- El cliente valida cada ingrediente frente a `recipeUnit`, muestra la unidad de receta con «rebanada(s)» para el pan y conserva `unit` para despensa, compras y movimientos. Las raciones automáticas ajustan el pan en piezas enteras hasta dos rebanadas por comida. El planificador convierte cantidades al comparar y proyectar existencias.
- El formato local pasa a v8. Se mantienen las migraciones automáticas de estados locales v5-v7 a v8: v5 convierte existencias/compra antiguas de gramos a unidades; v6/v7 conservan sus movimientos y saldos de inventario y convierten los snapshots históricos de consumo a gramos de receta. Los faltantes y las reversiones permanecen en unidades de inventario, evitando volver a aplicar los movimientos.
- El contrato del catálogo y la documentación deben mantener explícita esta separación; los IDs de alimentos no cambian.

## Límites

El peso comestible de frutas y el peso de cada rebanada varían entre productos. Las unidades simplifican el seguimiento cotidiano, pero las estimaciones de nutrición e inventario son aproximadas y no sustituyen el pesaje cuando se necesita precisión.
