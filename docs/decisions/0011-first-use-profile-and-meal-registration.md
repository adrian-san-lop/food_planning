# ADR-0011: Primera visita, conflictos de copias y registro de comidas

- **Estado:** Aceptada e implementada localmente
- **Fecha:** 11 de octubre de 2026
- **Contexto:** Auditoría UX/UI de Menuki, mejoras de prioridad alta

## Decisión

1. **Orientar a quien entra por primera vez.** Inicio muestra una secuencia breve de cinco pasos y recomienda empezar por el perfil. Los datos genéricos de ejemplo se identifican como tales. La app no los considera revisados hasta que el usuario guarda explícitamente el formulario.
2. **Guardar la revisión del perfil entre dispositivos.** El estado local usa `profileConfirmed`; `public.profiles.profile_confirmed` guarda la misma decisión. El campo empieza en `false`, también para perfiles existentes. Si una versión antigua del cliente sincroniza sin enviar el campo, la función conserva el valor remoto ya guardado.
3. **Política inicial de conflictos entre copias (sustituida por ADR-0017).** La versión inicial mostraba un resumen de ambas copias y pedía elegir. La decisión vigente es reconciliar automáticamente los cambios entre dispositivos, como se describe en ADR-0017.
4. **Separar planificación de consumo.** Las comidas de una fecha futura aparecen como planificadas y no pueden registrarse como realizadas antes de ese día. La acción se habilita al llegar la fecha; una comida que ya figurase como registrada aún puede revertirse.

## Consecuencias

- Los perfiles existentes se deben revisar y guardar una vez después de aplicar la migración.
- La migración `20261011150000_profile_confirmation.sql` agrega una columna a `profiles` y actualiza `sync_menuki_state`; no agrega tablas ni modifica registros existentes.
- La guía de primera visita, la confirmación del perfil y el bloqueo de registro anticipado siguen vigentes. La resolución mediante elección de copias descrita originalmente aquí fue sustituida por ADR-0017.
- La ubicación inicial de la guía en Inicio descrita en la decisión 1 se trasladó a Guía según ADR-0019.
- La auditoría propone además cambios de prioridad media y baja; esta decisión no los aprueba ni implementa.
