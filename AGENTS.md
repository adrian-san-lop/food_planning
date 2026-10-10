# AGENTS.md

Estas instrucciones se aplican a todo el repositorio.

## Fuente de verdad y alcance

- Antes de cambiar nada, lee `README.md`, este archivo, `context.md` y `plan_alimentacion_dinamico_3_semanas.html`.
- Por ahora trabaja sobre `main`, como ha indicado el usuario. Revisa el estado del repositorio antes de editar y conserva cualquier cambio ajeno.
- El HTML existente es la fuente de verdad funcional. Conserva sus recetas y la experiencia actual salvo que el usuario pida cambios concretos.
- La interfaz y la documentación se escriben en español.

## Decisiones de producto

- Es una app personal para una sola persona y se usa con conexión. No añadas una cola offline ni afirmes que existe sincronización remota sin comprobar una integración real.
- GitHub Pages sirve el frontend estático. El estado sigue en `localStorage` hasta que se conecten una base de datos y autenticación.
- No envíes notificaciones push o en segundo plano. El recordatorio de copia semanal es un aviso dentro de la página al abrirla.
- `v5` es el primer formato admitido; no implementes migración ni importación desde `v1-v4`. El estado vigente es v6 y su migración de entrada es v5.
- Si una comida supera el saldo anotado, registra todo el consumo y muestra el faltante. El saldo puede ser negativo. Desmarcar la comida debe añadir un reverso idempotente.

## Inventario

- Usa unidades `ud` para huevos y piezas enteras de fruta/verdura: plátano, manzana, kiwi, mandarina, naranja, pera, fruta de temporada, aguacate, tomate, pimiento, calabacín, cebolla, zanahoria, brócoli, pepino, patata y boniato. Permite cantidades fraccionarias.
- Mantén gramos para ingredientes pesados, envasados, cortados, congelados o que normalmente se compran por peso; usa mililitros para líquidos.
- La leche se compra en tetrabrik de 1 L. El café molido se controla en gramos y se incluye en los desayunos.
- Los tamaños por pieza son aproximados y deben poder ajustarse en la compra. Al cambiar unidades, conserva los datos v5 y no reapliques sus compras/comidas históricas sobre el saldo importado.
- Las compras, los consumos, los ajustes y sus reversos usan identificadores de operación únicos para evitar duplicados.

## Privacidad y despliegue

- No añadas exportaciones JSON, datos personales, tokens ni claves secretas al repositorio.
- Una web publicada con GitHub Pages es accesible por Internet. No describas `localStorage` como sincronización o copia en la nube.
- Si se integra Supabase, usa solo configuración pública apropiada para el cliente y protege cada tabla de usuario con RLS. Nunca incluyas claves `service_role` o secretos en el HTML.
- Mantén `index.html` como entrada raíz de GitHub Pages. Su destino debe seguir siendo relativo a la carpeta publicada.
- Actualiza `README.md` y `context.md` cuando cambien decisiones funcionales o la arquitectura. Distingue lo implementado de lo previsto.
