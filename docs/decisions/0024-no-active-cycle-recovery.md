# ADR-0024: Recuperación cuando la cuenta no tiene un ciclo activo

- **Fecha:** 13 de octubre de 2026
- **Estado:** Aceptada e implementada localmente
- **Alcance:** apertura y uso de una cuenta sincronizada sin un ciclo activo

## Decisión

1. La ausencia de una fila `active` en `plan_cycles` es un estado recuperable, no un error fatal de carga. Menuki debe cargar el perfil y los demás datos disponibles.
2. Mientras no haya ciclo activo, mostrar en todas las páginas un aviso destacado con un selector para elegir el día de inicio.
3. Al confirmar una fecha, activar un ciclo de 21 días con el menú programado para esa fecha, si existe; en caso contrario, usar el menú inicial fijo. Mantener perfil, despensa, compras, actividades, pesos y ciclos archivados.
4. Hasta activar el ciclo, dejar accesibles las demás páginas, ocultar la navegación y el registro de comidas del ciclo, y no calcular una compra planificada basada en un ciclo inexistente.
5. Permitir que la sincronización relacional guarde el resto de los datos aunque `cycles` esté vacío. La selección de fecha crea el siguiente ciclo activo mediante la sincronización normal; no requiere una migración de base de datos.

## Consecuencias

- La cuenta ya no queda atrapada en una pantalla de error por carecer de ciclo activo.
- El selector de fecha es persistente al navegar por las páginas y desaparece cuando el ciclo queda activo.
- Las ediciones de perfil, actividad e inventario pueden seguir sincronizándose antes de elegir la fecha.
- Si otra sesión activa un ciclo mientras esta página está abierta, la reconciliación remota elimina el aviso al recibir el cambio.
