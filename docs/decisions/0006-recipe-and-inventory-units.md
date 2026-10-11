# ADR-0006 — Separar las unidades de receta e inventario

- Estado: Aceptada e implementada localmente
- Fecha: 2026-10-11
- Alcance: catálogo de alimentos, recetas, nutrición, despensa, compras e importación de estados

## Contexto

Contar una pieza entera es útil al comprar y registrar existencias, pero no permite pesar con precisión el ingrediente usado por una receta. Por ejemplo, una receta debería pedir `250 g` de brócoli aunque la despensa se controle en piezas.

## Decisión

- Definir `food.unit` como unidad de inventario, movimientos y contenido de compra.
- Definir `food.recipeUnit` como unidad usada en las cantidades de ingredientes de recetas.
- Expresar en gramos todas las frutas y verduras sólidas, incluso las que se compran enteras. Para los 17 alimentos enteros incluidos, conservar `ud` en inventario/compra y convertir gramos usando `approximateEdibleWeight_g_per_unit`.
- Mantener huevos en `ud` tanto en receta como en inventario. Mantener líquidos en `ml`; los demás alimentos sólidos se pesan en `g`.
- Aplicar la unidad de receta a nutrición y cantidades de receta; convertir consumo, necesidades de compra y faltantes a la unidad de inventario. Los saldos, compras y movimientos siguen expresados en la unidad de inventario.
- Permitir editar el contenido real del envase de compra. Las conversiones basadas en el peso por pieza son estimaciones genéricas.

## Consecuencias

- `foods.json` y `recipes.json` pasan a `catalogVersion` `0.4.0`. Las 17 frutas/verduras enteras se expresan en gramos en recetas, con nutrición por 100 g derivada de los valores previos por pieza y del peso comestible aproximado. Las cantidades de recetas se convierten a gramos y se redondean a incrementos prácticos de medio gramo.
- El HTML valida cada ingrediente frente a `recipeUnit`, muestra gramos en las recetas y conserva `unit` para la despensa, compras y movimientos. El planificador convierte las cantidades al comparar y proyectar existencias.
- El formato local pasa a v8. Se siguen admitiendo importaciones v5-v7: v5 convierte existencias/compra antiguas de gramos a unidades; v6/v7 conservan sus movimientos y saldos de inventario y convierten los snapshots históricos de consumo a gramos de receta. Los faltantes y las reversiones permanecen en unidades de inventario, evitando volver a aplicar los movimientos.
- El contrato del catálogo y la documentación deben mantener explícita esta separación; los IDs de alimentos no cambian.

## Límites

El peso comestible por pieza varía por tamaño y por merma. La conversión facilita la planificación y el control aproximado, pero no sustituye el pesaje del alimento usado en la receta.
