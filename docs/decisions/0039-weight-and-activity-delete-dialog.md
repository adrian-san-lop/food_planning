# ADR-0039: Confirmación propia para borrar pesos y sesiones

- **Fecha:** 2026-10-15
- **Estado:** Aceptada e implementada localmente; validación en navegador pendiente
- **Alcance:** borrado de pesos y sesiones de actividad en PC y móvil

## Contexto

El propietario indica que, después de tres borrados de peso, al pulsar Eliminar deja de aparecer la confirmación; también ocurre con las sesiones. Los dos flujos usaban `window.confirm()`. El cliente no establece un límite de tres eliminaciones.

El síntoma es compatible con la supresión de los avisos del navegador: cuando estos se ignoran, `confirm()` devuelve `false` y el borrado se cancela. Esta posibilidad está documentada en [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/confirm); la causa concreta en el dispositivo del propietario no se ha reproducido. Chromium recomienda usar un [diálogo HTML para recoger la respuesta](https://developer.chrome.com/blog/dialogs-policy?hl=en).

## Decisión

1. Compartir un diálogo HTML de Menuki para ambos tipos de borrado. Mostrar el registro concreto con su fecha en formato europeo, su peso o los detalles de la sesión y las acciones Cancelar y Eliminar.
2. Usar el mismo flujo al borrar sesiones desde el historial y desde el formulario de registrar actividad. Abrir la confirmación encima del formulario cuando este siga abierto.
3. Dar el foco inicial a Cancelar. Cancelar y Escape cierran el diálogo sin borrar; al cerrarlo se devuelve el foco a un control disponible del historial o formulario.
4. Antes de aplicar el borrado, comprobar que la cuenta y el registro coinciden con los mostrados al abrir la confirmación. Si una actualización cambia el registro, pedir revisarlo. Consumir la acción una sola vez para evitar un doble borrado por pulsaciones repetidas.
5. Conservar los marcadores `deletedWeightDates` y `deletedActivitySessionIds`, el guardado existente y el recálculo de objetivos. Una eliminación de actividad mantiene las cantidades de las comidas ya registradas. No se cambia el esquema ni el RPC de Supabase.

## Revisión y límites

- Revisados los manejadores de ambos borrados, la persistencia y los puntos de entrada desde historial y formulario.
- La comprobación local de sintaxis y diferencias no equivale a probar eliminaciones consecutivas en navegador ni la sincronización con una cuenta real.
- Queda pendiente comprobar confirmación, cancelación, Escape, borrados consecutivos y la confirmación superpuesta al formulario de actividad en PC y móvil.
