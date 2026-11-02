# ADR-0044: niveles y factores de movimiento habitual

- Estado: Aceptada; implementada localmente. La migración de perfiles está preparada y pendiente de ejecución en Supabase.
- Fecha: 2026-10-18
- Alcance: cálculo del gasto energético base, perfil personal e integración con Supabase.

## Contexto

El perfil ofrecía cuatro categorías poco concretas y factores `1,20`, `1,30`, `1,40` y `1,52`. La persona usuaria propone seis factores nuevos y pide que la interfaz explique las rutinas que representan. Los valores de hombre y mujer incluidos como ejemplo no son la base de cálculo elegida para Menuki.

## Decisión

- Mantener la estimación de gasto en reposo redondeada de Mifflin–St Jeor (`10 × peso + 6,25 × altura − 5 × edad + 5` para hombre y `−161` para mujer). Conservar el campo de entrada manual.
- Multiplicar el gasto en reposo por uno de estos factores para estimar mantenimiento: muy sedentario `1,10`, sedentario `1,20`, ligera `1,37`, moderada `1,55`, intensa `1,72` y muy intensa `1,90`. El objetivo seleccionado se aplica después y la base diaria mantiene el mínimo existente de `1,10 × gasto en reposo`.
- Describir los niveles mediante trabajo, desplazamientos y tareas habituales, desde un día casi enteramente sentado hasta una jornada física muy exigente. Mostrar una frase breve del nivel elegido junto al selector. «Comparar niveles» abre un diálogo con las seis descripciones y permite elegir una; la elección solo actualiza el formulario y su vista previa hasta guardar el perfil. Cerrar el diálogo sin elegir conserva el nivel y devuelve el foco al botón. La ayuda extensa no ocupa espacio dentro de la cuadrícula de ajustes.
- Excluir del nivel habitual las sesiones de ejercicio registradas en Menuki. ADR-0005 sigue gobernando su cálculo: cada sesión se añade solo a su fecha y ajusta comidas pendientes.
- Tratar los factores como multiplicadores orientativos propios de la aplicación. No presentarlos como equivalentes directos de categorías PAL clínicas; las categorías del informe FAO/OMS/UNU utilizan intervalos distintos.
- Migrar los valores existentes al factor nuevo más cercano: `very_low` → `sedentary`, `low` y `medium` → `light`, `high` → `moderate`. Actualizar el valor predeterminado remoto a `sedentary` y restringir Supabase a los seis IDs nuevos.

## Consecuencias

- La vista previa del perfil, los objetivos diarios y el ajuste de raciones usan el factor seleccionado.
- Los perfiles locales antiguos se normalizan con el mismo mapeo; la migración SQL actualiza los perfiles ya guardados en Supabase.
- En un proyecto nuevo se aplica `supabase/migrations/20261018140000_activity_movement_factors.sql` antes de guardar los nuevos niveles. El [paquete 7](../planner/package-7-integration.md) comprobó el 23/10/2026 que el proyecto configurado guarda y recupera los seis IDs mediante RPC; ya no es un requisito pendiente en él. Esta prueba funcional no inspecciona el historial de SQL Editor ni la transformación de perfiles anteriores.
- Los ejemplos numéricos de la tabla proporcionada no se usan en Menuki; los valores de reposo se siguen calculando con Mifflin–St Jeor.

## Fuentes

- [Mifflin et al., 1990: ecuación predictiva del gasto energético en reposo](https://pubmed.ncbi.nlm.nih.gov/2305711/).
- [FAO/OMS/UNU: Human energy requirements, clasificación de estilos de vida por PAL](https://www.fao.org/4/y5686e/y5686e07.htm).
