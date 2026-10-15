# ADR-0025: Guía rápida para empezar en Menuki

- **Fecha:** 13 de octubre de 2026
- **Estado:** Aceptada e implementada
- **Alcance:** primera orientación dentro de Inicio y acceso a ayuda breve desde Guía

## Decisión

1. Inicio ofrece **Revisar perfil** mientras el perfil no se haya confirmado y muestra siempre **Ver guía rápida** en el banner.
2. La guía breve es un diálogo opcional de tres pasos:
   - Perfil y fecha del plan. Con ciclo activo enlaza al editor de fecha existente en **Menú 3 semanas**. Sin ciclo, explica el selector global de fecha que ya aparece arriba en todas las páginas.
   - Menú de hoy y navegación de **Menú 3 semanas**. Explica que las comidas se registran después de tomarlas y muestra los cinco tipos de comida.
   - Compra, despensa y seguimiento. Aclara que una sesión se registra después de realizarse y solo afecta al objetivo de ese día; el peso es opcional.
3. Se puede abrir la misma guía desde Inicio y desde **Guía**. Guía conserva su contenido extenso y las indicaciones existentes para revisar por primera vez el perfil.
4. El diálogo se puede cerrar en cualquier paso y volver a abrir. No obliga a completar el recorrido y no guarda un estado de onboarding.
5. No se añade una pantalla de fecha ni un flujo de perfil nuevo. Se reutilizan la confirmación actual del perfil, el editor de ciclo y el aviso global de ciclo pendiente.

## Consecuencias

- Una persona nueva encuentra en Inicio una acción clara para revisar sus datos y otra para entender las funciones principales.
- La ayuda sigue disponible a demanda, sin introducir preferencias, campos persistidos, cambios de estado ni migraciones.
- Los cambios de dispositivos no dependen de que la persona haya completado o cerrado la guía.
