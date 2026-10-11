# ADR-0011: Primera visita, conflictos de copias y registro de comidas

- **Estado:** Aceptada e implementada localmente
- **Fecha:** 11 de octubre de 2026
- **Contexto:** Auditoría UX/UI de Menuki, mejoras de prioridad alta

## Decisión

1. **Orientar a quien entra por primera vez.** Inicio muestra una secuencia breve de cinco pasos y recomienda empezar por el perfil. Los datos genéricos de ejemplo se identifican como tales. La app no los considera revisados hasta que el usuario guarda explícitamente el formulario.
2. **Guardar la revisión del perfil entre dispositivos.** El estado local usa `profileConfirmed`; `public.profiles.profile_confirmed` guarda la misma decisión. El campo empieza en `false`, también para perfiles existentes. Si una versión antigua del cliente sincroniza sin enviar el campo, la función conserva el valor remoto ya guardado.
3. **Explicar los conflictos entre copias.** Cuando el navegador y Supabase tienen cambios diferentes, la app muestra el estado de revisión del perfil, el menú activo, recuentos de comidas realizadas, movimientos de despensa, pesos, sesiones y artículos de compra, además de la última fecha disponible para cada copia. Explica que usar Supabase reemplaza los cambios locales sin subir; subir la copia local reemplaza el perfil, menú y compra remotos e integra movimientos, comidas, pesos y sesiones por identificador. El usuario elige explícitamente.
4. **Separar planificación de consumo.** Las comidas de una fecha futura aparecen como planificadas y no pueden registrarse como realizadas antes de ese día. La acción se habilita al llegar la fecha; una comida que ya figurase como registrada aún puede revertirse.

## Consecuencias

- Los perfiles existentes se deben revisar y guardar una vez después de aplicar la migración.
- La migración `20261011150000_profile_confirmation.sql` agrega una columna a `profiles` y actualiza `sync_menuki_state`; no agrega tablas ni modifica registros existentes.
- Estas mejoras están en la rama `docs/ux-audit-pc-mobile` y la migración se aplicó desde SQL Editor. Falta publicar el HTML en GitHub Pages y validar los recorridos con una cuenta nueva y con el conflicto de dos copias.
- La auditoría propone además cambios de prioridad media y baja; esta decisión no los aprueba ni implementa.
