# ADR-0026: Cuenta en Perfil y barra de marca móvil

- **Fecha:** 13 de octubre de 2026
- **Estado:** Aceptada e implementada; navegación móvil actualizada por ADR-0028
- **Alcance:** ubicación de los controles de cuenta y cabecera en pantallas estrechas

## Decisión

1. Mostrar el correo de la cuenta dentro de **Mi perfil**, junto a la información del perfil. En escritorio, **Cerrar sesión** también permanece en Perfil; en móvil se ofrece desde el desplegable superior según ADR-0028.
2. En el encabezado superior mantener el estado de sincronización y el reintento cuando haya un error. En móvil, el desplegable contiene accesos a Perfil, Guía, Actividad y **Cerrar sesión**, sin mostrar el correo.
3. En móvil y tablet, mantener el logo de Menuki visible en una barra superior fija, con fondo verde salvia diferenciado y sombra suave. La barra permanece en el flujo del documento para que el contenido empiece debajo y no quede cubierto.
4. En escritorio, conservar el logo de la barra lateral y mantener oculta la marca repetida de la cabecera principal.

## Consecuencias

- El correo se consulta en Mi perfil; la sesión se cierra desde Perfil en escritorio y desde la barra superior en móvil.
- Al recorrer las páginas en móvil, el logo y el acceso a la navegación superior siguen visibles.
- La navegación inferior y la sincronización automática mantienen sus funciones actuales.
