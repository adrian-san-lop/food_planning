# ADR-0026: Cuenta en Perfil y barra de marca móvil

- **Fecha:** 13 de octubre de 2026
- **Estado:** Aceptada e implementada
- **Alcance:** ubicación de los controles de cuenta y cabecera en pantallas estrechas

## Decisión

1. Mostrar el correo de la cuenta y **Cerrar sesión** dentro de **Mi perfil**, junto a la información del perfil.
2. En el encabezado superior mantener el estado de sincronización y el reintento cuando haya un error. No mostrar allí el correo ni la acción de cierre de sesión.
3. En móvil y tablet, mantener el logo de Menuki visible en una barra superior fija, con fondo verde salvia diferenciado y sombra suave. La barra permanece en el flujo del documento para que el contenido empiece debajo y no quede cubierto.
4. En escritorio, conservar el logo de la barra lateral y mantener oculta la marca repetida de la cabecera principal.

## Consecuencias

- La cuenta y la sesión se encuentran desde Mi perfil.
- Al recorrer las páginas en móvil, el logo y el acceso a la navegación superior siguen visibles.
- La navegación inferior y la sincronización automática mantienen sus funciones actuales.
