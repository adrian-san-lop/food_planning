# ADR-0050 — La carga de la cuenta no depende de la integridad del menú

- Estado: aislamiento de lectura conservado; política de escritura sustituida por ADR-0051
- Fecha: 2026-10-25
- Alcance: lectura de estado Supabase en dispositivos nuevos y existentes

## Contexto

Supabase es la fuente canónica de datos personales. El cliente ya descarga las tablas de perfil, ciclos, comidas, inventario y seguimiento con una revisión estable; después, un único ciclo inválido podía hacer fallar el mapeo completo y ocultar todos los datos de la cuenta. La falta de una receta en el catálogo o de una posición del menú no debe impedir el acceso desde móvil o escritorio ni pedir una revisión manual.

## Decisión

1. La reconstrucción de cada ciclo se valida por separado. Un ciclo activo, programado o borrador con menos de 105 posiciones, una receta ausente, una fecha o posición inválida, o tipos incompatibles se excluye de las funciones que requieren un menú válido; no aborta la hidratación de perfil, despensa, actividad, peso, preferencias ni movimientos.
2. El cliente no sustituye IDs, rellena posiciones ni usa la plantilla fija como si fuera el ciclo remoto. Si el ciclo activo no puede mostrarse, Inicio, Menú y Compra indican que el cálculo del plan no está disponible. Perfil, despensa, seguimiento y compra imprevista siguen accesibles. La interfaz no solicita revisar ni reimportar los datos.
3. Actualización aceptada del 25/10/2026: [ADR-0051](0051-server-authoritative-account-state.md) sustituye el archivado por omisión. Las filas de un ciclo ilegible se conservan y no se interpretan como una orden de archivado; las acciones nuevas son acotadas. La evolución completa requiere la migración del contrato 2.
4. Los errores de Auth, transporte, perfil realmente ausente o lectura inconsistente siguen siendo errores de sincronización y conservan la acción de reintento. Esta decisión aísla problemas de menú; no convierte fallos de conexión en lecturas correctas.

## Consecuencias

- La cuenta sincroniza sus datos utilizables aunque una referencia de menú esté obsoleta o falte. No se producen compras con ingredientes inventados ni se muestra una lista vacía como si estuviera completa.
- Si el ciclo no puede mostrarse, el aviso ofrece actualizar la aplicación. No se pide reemplazarlo ni revisarlo para sincronizar la cuenta y no se archiva automáticamente por no entenderlo.
- Un ciclo histórico no interpretable puede seguir almacenado en Supabase y no se mostrará como menú válido en esta versión.

## Verificación

Las pruebas de mapeo cubren IDs ausentes, ciclos incompletos, fechas inválidas y ciclos archivados; validan que perfil e inventario siguen cargando y que el cliente no fabrica un reemplazo. Pruebas adicionales cubren persistencia local del aviso, acceso al app shell de una cuenta guiada y el estado no calculable de Compra. Verificación de ejecución y navegador indicada en el cambio que implementa esta decisión.
