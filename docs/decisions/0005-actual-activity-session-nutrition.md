# ADR-0005 — Ajuste nutricional por sesiones de actividad realizadas

- Estado: Aceptada e implementada localmente
- Fecha: 2026-10-10
- Alcance: registro de actividad, cálculo diario y adaptación de porciones

## Contexto

No siempre se sabe de antemano si se hará ejercicio. Un calendario de entrenamientos previstos dependería de predicciones y podría modificar comidas de días en los que finalmente no se entrena. El perfil ya incluye un nivel de movimiento habitual que debe representar la actividad cotidiana sin contar de nuevo el ejercicio.

## Decisión

- Registrar una sesión después de realizarla, indicando fecha, categoría de actividad/esfuerzo y duración. Se permiten varias sesiones en una fecha.
- Calcular energía neta aproximada con `(MET − 1) × peso_kg × duración_horas`. Restar un MET evita volver a contar el gasto de reposo incluido en el objetivo diario base. Sumar las sesiones de esa fecha; sin sesiones, usar el objetivo base.
- Aplicar el cambio solo a las comidas pendientes de la fecha registrada. Las comidas completadas conservan las cantidades y el consumo ya guardados. El cálculo trata esas cantidades como fijas y adapta el objetivo restante entre las comidas pendientes.
- Mantener estables las metas diarias de proteína y grasa ante una sesión. Cubrir principalmente la energía extra con porciones de hidratos, dentro de los límites de adaptación existentes.
- No prever entrenamientos futuros ni cambiar otros días. El historial tampoco modifica automáticamente el perfil o el menú futuro. Más adelante se podrá decidir si se ofrece un resumen para que la persona revise su actividad habitual; esa propuesta sigue abierta.
- Usar cantidades base genéricas en `recipes.json`; retirar las alternativas `amountOnStrengthDay`. La sesión real, no una marca genérica de “día de fuerza”, gobierna el cálculo.
- Mantener las sesiones en estado local v7 y exportación JSON. La tabla remota `activity_sessions` se añadió mediante una migración aditiva aplicada el 11 de octubre de 2026; el HTML aún no escribe ni lee sesiones en Supabase.

## Valores MET orientativos incluidos

Las opciones parten de categorías del [2024 Adult Compendium of Physical Activities](https://pacompendium.com/adult-compendium/) y su [herramienta de consulta](https://pacompendium.com/compendium-calculator/).

| Actividad / esfuerzo | MET |
| --- | ---: |
| Fuerza, rutina habitual | 3,5 |
| Fuerza, sesión vigorosa | 6,0 |
| Carrera, aproximadamente 8 km/h | 8,5 |
| Carrera, aproximadamente 10 km/h | 9,3 |
| Fútbol recreativo / competitivo | 7,0 / 9,5 |
| Surf general / remo intenso | 3,0 / 6,8 |
| Patinaje en línea recreativo / entrenamiento moderado | 7,5 / 9,8 |
| Ciclismo suave / moderado / vigoroso | 4,3 / 7,0 / 9,0 |
| Otra actividad, referencia moderada | 3,5 |

Son referencias poblacionales aproximadas, no mediciones individuales ni valores clínicos. El compendio se dirige a adultos de 19–59 años; fuera de ese rango la estimación queda menos respaldada. La duración y el esfuerzo reales también pueden diferir de la categoría escogida.

## Consecuencias

- Al guardar o quitar una sesión, se recalculan el objetivo estimado, las cantidades de comidas pendientes de esa fecha y la compra derivada. Las comidas ya registradas no cambian.
- Los días sin una sesión registrada conservan el objetivo base; la generación de un menú para el siguiente ciclo no supone días de actividad.
- El formato de estado local pasa a v7. Se admiten importaciones v5, v6 y v7; no se añaden migraciones desde v1–v4. Las marcas históricas de fuerza se conservan como legado y se ignoran.
- El catálogo de recetas pasa a 0.3.0 para reflejar la retirada de alternativas específicas de días de fuerza.

## Pendiente

Decidir si, tras acumular varias semanas, se mostrará un resumen manual de actividad habitual. La sincronización remota y la prueba de aislamiento entre usuarios siguen pendientes.
