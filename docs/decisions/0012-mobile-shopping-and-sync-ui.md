# Decisión 0012: simplificar sincronización y uso móvil

- **Fecha:** 11 de octubre de 2026
- **Estado:** Aceptada
- **Alcance:** interfaz de Menuki; no requiere cambios en Supabase

## Contexto

La sincronización normal con Supabase ya se inicia automáticamente después de guardar cambios. La descarga periódica de archivos y el control manual de sincronización añaden opciones de mantenimiento al uso diario. En móvil, la compra puede contener una lista larga y la barra inferior intenta mostrar ocho destinos a la vez.

## Decisiones

1. Retirar de la interfaz la descarga de datos personales y el recordatorio semanal asociado. La conservación inicial de la restauración JSON fue sustituida por ADR-0029: la interfaz ya no importa ni restaura archivos personales; mantiene la migración automática de estados locales v5-v8.
2. Ocultar la sincronización manual durante el uso normal. Mantener un estado compacto y mostrar **Reintentar** solo después de un error. La elección explícita ante copias divergentes de la decisión original fue sustituida por ADR-0017.
3. En Compra, añadir búsqueda por nombre de producto y, en móvil, mantener visibles el recuento de productos marcados/pendientes y **Finalizar compra**. Marcar artículos no modifica la despensa; finalizar añade solo los marcados.
4. Eliminar la indicación repetida «Guardar al salir del campo» de las filas de Despensa. Los cambios de existencias mantienen su guardado actual.
5. En la navegación móvil, la decisión original dejó Inicio, Menú, Compra y Despensa en la barra inferior. ADR-0017 trasladó después Actividad a esa barra; ADR-0028 fija la navegación vigente: Inicio, Menú, Compra y Más abajo, y Perfil, Guía, Actividad y peso y Cerrar sesión en el menú superior de cuenta. Más agrupa Despensa, Recetas y las propuestas según permisos. La navegación lateral de escritorio se mantiene.

## Consecuencias y validación

- La sincronización automática y la copia de trabajo local se mantienen. La política de conflictos y el destino principal de navegación móvil evolucionaron según ADR-0017.
- La estructura de tablas y las migraciones de Supabase no cambian.
- Probar la compra y la navegación en un teléfono físico, incluidas las áreas seguras; comprobar que **Reintentar** aparece solo ante un error. La vista adaptable del navegador no sustituye esa prueba.
