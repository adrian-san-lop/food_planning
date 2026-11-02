# Paquete 1: estados, preferencias y compatibilidad

- Fecha: 22/10/2026.
- Estado: **Implementado y probado localmente** en `chore/planner-foundations`; incorporado por el propietario a `dev` antes del paquete 2 (base `a3dd893`). Este registro no acredita una nueva validación de la web publicada. No requirió cambios en Supabase.
- Alcance: primer paquete del [plan integrado](implementation-plan.md), según [ADR-0047](../decisions/0047-guided-first-use-and-personalized-planning.md).

## Resultado y límites

Se separa la lógica del perfil de `main.js` y se preparan modelos de dominio para la configuración inicial y las preferencias. Los módulos no acceden al DOM, al almacenamiento ni a Supabase.

Al cerrar este paquete, la extracción del perfil ya se usaba con la normalización anterior; configuración y preferencias aún no intervenían en arranque, selección ni sincronización. Posteriormente, el 3 conecta las preferencias al motor, el [4](package-4-persistence.md) incorpora persistencia (migración y siete diagnósticos confirmados por el propietario el 23/10/2026) y el [5](package-5-preferences-and-weekly-review.md) implementa controles y revisión semanal. El [paquete 6](package-6-guided-first-setup.md) conecta configuración y primer menú. El [paquete 7](package-7-integration.md) completa la validación funcional alojada de esta entrega; las cuentas existentes conservan sus menús.

No se cambia el estado persistido v11 ni se añade SQL. Las migraciones locales v5-v11 siguen vigentes. Al cerrar este paquete la lectura remota requería el perfil completo de una cuenta inicializada; aceptar borradores incompletos en Supabase corresponde al paquete 4. Este paquete no activa el nuevo registro guiado.

## Perfil: compatibilidad y borrador separado

`js/domain/profile.js` reúne las dos responsabilidades con entradas distintas:

- `defaultProfile` y `sanitizeProfile` conservan los valores de compatibilidad, límites, traducción de niveles de actividad antiguos y tratamiento de booleanos usados por el cliente actual. La normalización de datos existentes sigue limitando valores fuera de rango.
- `createProfileDraft` crea campos personales vacíos (`null`), sin asignar edad, peso, altura, objetivo ni movimiento de ejemplo. Solo los ajustes booleanos tienen valores iniciales. Convierte entradas numéricas de formulario y conserva los números fuera de rango para que se puedan corregir.
- `validateProfileDraft` exige tipos, elecciones y rangos válidos antes de confirmar. No rellena ni limita silenciosamente los datos. El gasto en reposo manual es obligatorio en modo manual; si se informa en otro modo, también debe ser válido. Distingue los datos de Sobre ti de los de objetivo y movimiento.

La confirmación es un hecho separado: tener un objeto válido no significa que la persona lo haya confirmado. Los valores antiguos de compatibilidad no deben utilizarse para rellenar el nuevo recorrido.

## Estado de configuración

`js/domain/onboarding.js` define un borrador de contrato v1, independiente de la versión del estado local:

```js
{
  v: 1,
  profile: { /* campos tipados; los personales pueden ser null */ },
  preferencesReviewed: false,
  startDate: null // fecha civil YYYY-MM-DD cuando se elija
}
```

`validateSetupDraft` admite datos parciales, pero rechaza campos desconocidos, versiones no soportadas y valores inválidos. `getSetupProgress` deriva el siguiente destino a partir de la cuenta, el perfil, su confirmación, el borrador y la existencia de un plan confirmado:

| Estado | Significado | Destino del flujo guiado |
| --- | --- | --- |
| `account_required` | No hay sesión autenticada. | Acceso. |
| `profile_missing` | No hay perfil ni datos personales en el borrador. | Sobre ti. |
| `profile_incomplete` | El perfil es parcial, inválido o aún no está confirmado. | Sobre ti u objetivo, según lo pendiente. |
| `plan_pending` | Perfil válido confirmado, sin primer plan confirmado. | Preferencias o revisión del menú. |
| `ready` | Perfil y plan confirmados. | Aplicación. |

Una fecha guardada, la inicialización de sincronización o un indicador de tutorial no equivalen a confirmar perfil o plan. Un plan anterior confirmado sigue acreditando el primer uso aunque haya terminado; renovar el ciclo es otra responsabilidad.

El modo explícito `legacy` conserva el acceso a la aplicación y reconoce los planes anteriores. Un perfil antiguo sin revisar solicita confirmación antes de nuevas propuestas, sin borrar su menú. Esta regla está preparada en el modelo, todavía sin activar en el cliente actual.

Los indicadores de cuenta y confirmación deberán obtenerse del estado autenticado y validarse en el backend al integrar el paquete 4. Este modelo local orienta el flujo; no sustituye la validación del servidor ni constituye una barrera de seguridad.

## Preferencias

`js/domain/planning-preferences.js` define:

```js
{
  recipePreferences: { /* recipeId: normal | favorite | do_not_propose */ },
  weekdayTimeLimits: { comida: null, cena: null }
}
```

Una receta sin entrada tiene preferencia normal. `normal` explícito permite retirar una favorita o exclusión sin confundir la retirada con un campo omitido. Los identificadores siguen el formato del catálogo; comprobar que cada ID existe corresponde a su integración con el catálogo.

Los tiempos son opcionales e independientes. `null` significa sin límite; un límite informado es un número entero de 1 a 1440 minutos. Este máximo es un límite técnico de un día, no una recomendación de cocina ni un tiempo seleccionado por defecto.

`applyPlanningPreferencesPatch` devuelve una copia validada y conserva los campos omitidos. Una omisión de un cliente anterior no debe convertirse en borrado; `normal` y `null` son retiradas expresas. Valores o secciones inválidos producen un error en lugar de perder preferencias. La conciliación entre dispositivos y la persistencia de estas operaciones quedan para el paquete 4.

El [paquete 3](package-3-common-generator.md) aplica favoritas, No proponer y tiempos en el motor. No proponer afecta a la selección automática; la elección manual y sus bloqueos conservan las excepciones aceptadas. El 4 incorpora persistencia, con migración y siete comprobaciones correctas según el propietario el 23/10/2026; el 5 incorpora los controles, probados localmente.

## Comprobaciones

- Suite local: **94 pruebas correctas**, frente a las 75 previas. Incluye borradores parciales, confirmaciones, cuentas existentes, preferencias omitidas y retiradas explícitas, además de las comprobaciones anteriores de nutrición, inventario, catálogo y sincronización.
- Comparación del normalizador de perfil extraído contra la función anterior en `origin/dev`: **361 entradas, ninguna diferencia**.
- Estados v5-v11: conservación de datos reales, confirmación y ausencia de ciclo mediante el servicio extraído.
- Lectura remota: se conserva el error ante un perfil ausente en una cuenta inicializada, sin inventar uno para ocultar datos inconsistentes.
- Sintaxis del módulo de entrada comprobada. No se acredita aquí validación de navegador, Auth, RLS, escrituras remotas ni publicación.

Continuación: el [paquete 2](package-2-practical-portions.md) desarrolla raciones prácticas; el [3](package-3-common-generator.md), el generador común; el [4](package-4-persistence.md), la persistencia (SQL confirmado por el propietario); y el [5](package-5-preferences-and-weekly-review.md), preferencias visibles y revisión semanal. El [paquete 6](package-6-guided-first-setup.md) implementa la configuración guiada; el [7](package-7-integration.md) completa la integración alojada y la aceptación de la entrega.
