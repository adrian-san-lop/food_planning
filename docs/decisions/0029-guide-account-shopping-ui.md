# ADR-0029: guía, cuenta y accesos de Compra y Despensa

- **Fecha:** 14 de octubre de 2026
- **Estado:** Aceptada e implementada
- **Alcance:** guía de uso, datos de cuenta, navegación móvil, Compra y Despensa
- **Relación:** mantiene la guía rápida de ADR-0025 y actualiza la navegación móvil de ADR-0028. Retira la restauración personal JSON que ADR-0017 había mantenido como acción deliberada.

## Decisión

1. Mantener **Ver guía rápida** y ordenar la guía completa como un recorrido para empezar: perfil y fecha del plan, menú, registro de comidas, compra y despensa, actividad y recetas. La explicación detallada de Compra y Despensa aparece al principio.
2. En la sección de cuenta, explicar con lenguaje sencillo que el correo identifica la cuenta y que la contraseña está protegida, Menuki no puede verla y se puede solicitar un enlace para cambiarla desde el acceso.
3. Retirar de toda la aplicación la restauración de datos personales desde archivo JSON, incluido su botón, selector de archivos y confirmación. Se mantienen las migraciones v5-v8 que permiten leer datos locales de instalaciones existentes y la carga inicial de datos locales al entrar en una cuenta sin estado remoto. El reinicio total confirmado continúa disponible. La descarga JSON admin de propuestas sigue separada y sin cambios.
4. Mantener el menú de cuenta solo en móvil y quitar el borde del botón que lo abre. La navegación de escritorio permanece igual.
5. Usar iconos diferentes para **Recetas** (libro), **Proponer receta** (lápiz con más) y **Revisar propuestas** (portapapeles con marca).
6. En Compra, mostrar **Copiar lista**, **Ver despensa** y **Guía** arriba, con el mismo formato y sin iconos. En escritorio, añadir a su lado **Finalizar compra**, también sin iconos. En móvil, mantener Finalizar compra fijo encima de la navegación inferior, reservando espacio en el contenido. En Despensa, mostrar **Ver compra** y **Guía** en el mismo estilo. Centrar los números de los tres KPI de Compra.
7. Actualización del 15 de octubre de 2026: mostrar el selector **Ciclo actual / Próximo ciclo** solo si el siguiente menú está guardado y confirmado y faltan de uno a tres días para su inicio. Cada lista usa sus propias recetas, fechas, selecciones y extras. El próximo ciclo calcula una despensa prevista, sin modificar la real. La guía explica este flujo y la renovación mediante el planificador interno.

## Consecuencias

- La guía explica el flujo en el orden en que la persona usa Menuki y ofrece accesos directos a cada sección.
- Compra y Despensa permiten consultar la explicación sin buscarla al final de la página.
- La restauración personal desde JSON deja de ser una opción de recuperación. Los datos sincronizados y la adaptación de estados locales existentes siguen funcionando; el reinicio completo continúa como una acción separada con confirmación.
- No se modifica el esquema ni las migraciones de Supabase.
