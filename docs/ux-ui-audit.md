# Auditoría UX/UI y diagnóstico del acceso

**Fecha:** 11 de octubre de 2026  
**Alcance:** inspección manual de la aplicación publicada y comparación de los archivos de ejecución de las ramas `dev` y `main`. Esta auditoría no cambia el comportamiento de la aplicación.

## Resumen

La versión inspeccionada abre directamente el plan, sin pedir iniciar sesión. La comparación del repositorio explica por qué: el archivo actual `menuki.html` de `dev` no contiene la pantalla de acceso ni autenticación Supabase. En cambio, `main` conserva el HTML anterior, que sí contiene ambas.

Por tanto, el acceso no parece haberse eliminado del historial: quedó en la línea de `main` y no llegó al archivo renombrado de `dev`. Las ramas también tienen entradas distintas (`index.html` redirige a nombres de HTML diferentes). La fuente configurada actualmente en **Settings → Pages** no se pudo verificar desde el repositorio, así que no se puede afirmar qué rama está publicando GitHub Pages.

La conclusión operativa es que ahora hay dos versiones distintas: una con el trabajo posterior de autenticación y sincronización en `main`, y otra con el HTML renombrado y sin ese trabajo en `dev`. Antes de continuar los cambios de UX/UI, conviene reconciliar ambos historiales y decidir cuál será el archivo de ejecución que se publica.

## Evidencia sobre el inicio de sesión

| Evidencia | Hallazgo |
| --- | --- |
| `origin/dev`, commit `1a92aa2` | Contiene `menuki.html` y un `index.html` que redirige a `./menuki.html`. La búsqueda del HTML no encuentra el formulario ni las llamadas de autenticación (`supabase.auth`, `getSession`, inicio de sesión). |
| `origin/main`, commit `0bf612e` | Contiene `plan_alimentacion_dinamico_3_semanas.html`, no `menuki.html`. El HTML incluye formulario de inicio/registro y lógica de Supabase Auth. Su `index.html` redirige al nombre antiguo. |
| Historial de `main` | El formulario se incorporó en `6b117cb` (`feat/login-page`); después, `3ac62e4` añadió la integración de estado con Supabase. Esos commits no aparecen en la línea de `dev` que termina en `1a92aa2`. |
| Página revisada | La URL abierta fue `https://adrian-san-lop.github.io/food_planning/menuki.html`. Se abrió directamente la aplicación, sin acceso. Su apartado de privacidad indicaba almacenamiento en el navegador, coherente con la versión local de `dev`. No se introdujeron las credenciales de prueba porque no había formulario. |
| README en el momento de la auditoría | Indicaba publicar `main` desde la raíz, pero esa instrucción no coincidía con la configuración que el propietario había seleccionado en GitHub. |

### Aclaración posterior sobre la publicación

Después de la auditoría, el propietario confirmó que configuró GitHub Pages para publicar desde `dev`. Esto explica el comportamiento observado: en ese momento `dev` tenía `menuki.html` sin el login que sí estaba en `main`.

Durante la integración en curso, Git trasladó el HTML de `main` a `menuki.html` sin conflicto de contenido; la copia de trabajo ahora incluye Supabase Auth y la sincronización. El cambio todavía debe llegar a `dev` y publicarse allí para que el login aparezca en la web. Esta auditoría documenta el estado observado antes de esa publicación.

## Observaciones de uso

La inspección permitió recorrer Inicio, Perfil, Menú, Recetas, Compra, Despensa, Peso y Guía; abrir una receta y el formulario de actividad; buscar recetas y revisar la lista de compra y los filtros de despensa. No se registró ninguna comida, sesión, peso, compra ni propuesta de menú. Los cambios exploratorios en los campos se restituyeron antes de guardar. La prueba se hizo en la página abierta y en una ventana de escritorio; no equivale a una validación en un teléfono físico.

### Hallazgos y mejoras sugeridas

1. **Explicar el estado de los datos desde el primer uso.** La aplicación observada no pidió acceso y describe el almacenamiento local. El perfil inicial muestra valores genéricos, pero no resulta evidente en pantalla que sean ejemplos. Conviene identificar claramente el modo actual de almacenamiento y etiquetar el perfil de ejemplo durante el alta inicial.
2. **Evitar registrar comidas futuras.** En el menú se podían usar los controles de registro para días posteriores. La acción puede descontar inventario antes de haber comido. La interfaz debería diferenciar comida planificada de comida realizada y evitar o confirmar explícitamente el registro anticipado.
3. **Aclarar las cifras nutricionales.** Una receta aparecía con 460 kcal y 33 g de proteína en el catálogo, mientras que en el menú se mostraba con 447 kcal y 28 g. La adaptación de la ración puede explicar la diferencia, pero la vista no deja suficientemente claro qué valor corresponde a la receta base y cuál a la ración personalizada.
4. **Simplificar la compra.** La semana revisada generaba 48 productos pendientes. La lista era larga y no se apreciaba una búsqueda; la diferencia entre marcar un producto y finalizar la compra requiere una explicación más visible, porque marcarlo no actualiza por sí solo la despensa.
5. **Reducir la carga de navegación móvil.** La navegación presenta ocho destinos a la vez. En la vista disponible las etiquetas se veían pequeñas; falta probar en varios anchos de teléfono antes de decidir si agrupar destinos secundarios.
6. **Dar menos protagonismo al recordatorio de copia.** El aviso semanal de copia aparecía con mucho peso visual y repetido en distintas secciones. Puede ser más discreto sin ocultar cómo hacer una copia cuando el usuario la necesite.
7. **Hacer explícito el comportamiento de las propuestas.** Abrir el planificador crea y guarda un borrador; cerrar el diálogo no ofrece una acción clara para descartarlo. Conviene explicar que el borrador se conserva y ofrecer una salida deliberada para descartarlo.
8. **Usar un nombre neutral para el esfuerzo.** El formulario de actividad parte de “Fuerza · rutina habitual”, aunque existen actividades como carrera, surf o fútbol. Un valor inicial neutral evitaría orientar al usuario hacia una actividad concreta.
9. **Acortar la guía de uso.** La guía reúne instrucciones de usuario y detalles técnicos de formatos y migraciones. Para el uso cotidiano sería más fácil encontrar tareas frecuentes si se priorizaran instrucciones breves y se separaran los detalles de mantenimiento.

### Aspectos que ya ayudan

- Las secciones principales se distinguen bien y mantienen el idioma y el estilo visual de Menuki.
- Las tarjetas del menú muestran tipo de comida, tiempo y resumen nutricional.
- El detalle de una receta reúne ingredientes, cantidades, faltantes de despensa e instrucciones.
- La despensa ofrece búsqueda y filtros de stock/déficit.
- La lista de compra diferencia los productos de la despensa y ofrece una acción para finalizar la compra.

## Orden propuesto para continuar

1. Confirmar la fuente de GitHub Pages y cuál es la versión que debe considerarse válida.
2. Comparar los cambios de autenticación y persistencia de `main` con el HTML de `dev`, conservando el cambio de nombre a `menuki.html` y evitando reemplazar trabajo posterior por una versión antigua.
3. Tras unificar el archivo que se publica, repetir la prueba de acceso con la cuenta de prueba y verificar el estado de persistencia antes de cambiar la UX/UI.
4. Priorizar primero las mejoras que afectan a la confianza y a la acción: claridad sobre almacenamiento/perfil de ejemplo, registro de comidas futuras, lista de compra y valores nutricionales.
5. Probar navegación y legibilidad en móvil real antes de reorganizar destinos.

Este orden es una recomendación derivada de la auditoría, no una modificación funcional ni una decisión de producto aprobada.
