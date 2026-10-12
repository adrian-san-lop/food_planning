# Decisión 0013: modularizar el cliente y fijar la fecha civil de Menuki

- **Fecha:** 12 de octubre de 2026
- **Estado:** Aceptada e implementada en una primera etapa
- **Alcance:** arquitectura del cliente web; no requiere cambios en Supabase

## Contexto

La interfaz, las reglas del dominio y el acceso a datos estaban concentrados en `menuki.html` y compartían un ámbito JavaScript global. Además, las fechas se resolvían con la zona horaria del navegador, aunque las reglas del producto usan el calendario de `Europe/Madrid`.

## Decisiones

1. Mantener GitHub Pages, HTML, CSS y JavaScript nativos. `menuki.html` será el shell de la interfaz y cargará `assets/css/app.css` y `js/main.js` como módulo ES. No introducir todavía framework ni paso de compilación.
2. Extraer responsabilidades de manera incremental. En esta etapa, los módulos separan fecha civil, validación/carga de catálogos, conversiones de unidades, copia local y transporte de lecturas/RPC de Supabase. Las vistas, la orquestación de dominio restante y parte del flujo de autenticación/sincronización siguen en `js/main.js`.
3. Representar fechas civiles como `YYYY-MM-DD` y como objetos `Date` portadores a medianoche UTC solo para hacer aritmética de calendario. Resolver el día actual y presentar instantes con `Europe/Madrid`; mantener los timestamps como instantes ISO.
4. Conservar sin cambios los catálogos, el estado v8, las importaciones v5-v8, el comportamiento del planificador, las reglas de inventario y los contratos de sincronización con Supabase.

## Consecuencias y validación pendiente

- El cálculo de días y semanas ya no depende de la zona configurada en el dispositivo; sumar días civiles tampoco suma 24 horas a un instante local y, por ello, no desplaza la fecha al cruzar el horario de verano.
- El código cliente puede servirse como archivos estáticos desde GitHub Pages con rutas relativas.
- Esta etapa no completa la separación de todos los módulos. Extraer planificador, nutrición, normalización de estado, vistas, eventos y orquestación de sincronización requiere etapas posteriores y revisión de regresiones.
- Antes de publicar, validar en navegador la carga de módulos y estilos. En la publicación, revisar comidas y sesiones en el cambio de día de Madrid, la activación del siguiente ciclo, sincronización, conflictos y los recorridos móvil/escritorio.
- La elección de Vite/TypeScript y el pin de la versión secundaria/parche de Supabase JS siguen abiertos; no son requisitos de esta etapa.
