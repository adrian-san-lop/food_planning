# Acceso, privacidad y cumplimiento legal

- **Estado (17/10/2026):** base de páginas y navegación implementada localmente como borrador. Los textos definitivos, el canal de derechos, los consentimientos que correspondan y la validación de producción siguen pendientes. No se declara cumplimiento legal por disponer de estas páginas.
- **Idioma del producto:** español.
- **Alcance:** landing pública, acceso y registro de Menuki, información legal visible y documentación interna sobre tratamientos.

Este documento recoge las necesidades indicadas por el propietario y las organiza para una fase posterior. No sustituye una revisión jurídica. Antes de publicar avisos legales o pedir consentimientos hay que comprobar el funcionamiento real de la aplicación, completar los datos del responsable y validar la aplicabilidad de cada obligación.

## Acuerdos e implementación del 17/10/2026

- El propietario indica que el proyecto tendrá carácter comercial o monetización. Los precios, contratación, público destinatario y política de edad no están definidos; no se implementan cobros ni nuevas restricciones de edad en esta fase.
- Autoriza expresamente mantener en blanco la identidad, NIF, domicilio y contacto durante el desarrollo. Se presentan campos vacíos no editables, acompañados de una advertencia visible de borrador; no se inventan nombres, direcciones ni correos. Esta excepción permite preparar la estructura, no aprobar los avisos definitivos.
- Supabase es el proveedor **actual**, aunque el propietario lo considera temporal. No hay región, sustituto, garantías ni política de conservación definitiva confirmados. Una futura migración no cambia la descripción del funcionamiento presente.
- Fuente única de contenido: `privacidad.html`, `cookies.html`, `aviso-legal.html` y `condiciones.html`. Comparten `assets/css/legal.css`, Roboto local e identidad de Menuki. Siguen siendo legibles de forma independiente sin Auth, catálogos, JavaScript ni servicios externos. `noindex, nofollow` evita solicitar indexación de estos borradores; no constituye una restricción de acceso.
- Presentación revisada por el propietario el 17/10/2026: la landing y el acceso abren los documentos en un popup nativo, sin navegar ni abrir otra pestaña. `js/ui/legal-dialog.js` recupera únicamente las cuatro páginas locales permitidas y reutiliza su contenido principal; no duplica textos. La cabecera con título y Cerrar queda fija, el texto tiene scroll interior, y se puede cambiar de documento o seguir un enlace a una sección dentro del popup. Escape, Cerrar o pulsar el fondo lo cierran y devuelven el foco al enlace de origen. Los enlaces a fuentes oficiales externas sí abren otra pestaña, conservando el popup.
- El footer de la landing enlaza los cuatro borradores; el formulario compartido enlaza privacidad y condiciones antes de enviar, y el footer independiente de registro enlaza los cuatro. Si el formulario está en el iframe, pide el popup al padre mediante un mensaje con solo documento/ancla; la landing comprueba origen, ventana y que Auth esté abierto, y lo muestra fuera del iframe para evitar recortes. La ventana de acceso permanece abierta, con sus campos y posición. Al completar el acceso se cierra cualquier popup legal y no se muestran enlaces ni avisos añadidos en la app autenticada; se retira el acceso anterior de Mi perfil. Sin JavaScript o sin soporte de diálogo, los enlaces conservan la navegación a las páginas locales como alternativa.
- La información del formulario no es una casilla de consentimiento, aceptación de contrato ni prueba de lectura. No se añade consentimiento genérico ni se presenta el alta como aceptación de documentos incompletos.
- No se incorpora un banner ni un panel de categorías ficticias: el código revisado no contiene analítica o publicidad; queda pendiente verificar cookies y tráfico del entorno publicado y clasificar la persistencia técnica. Si esa revisión identifica tecnologías no exentas, habrá que bloquearlas antes de obtener la elección correspondiente.
- El consentimiento para datos de salud no se implementa en esta fase: deben validarse alcance y bases jurídicas, el texto informado, la prueba remota de otorgamiento y retirada, y el comportamiento tras retirarlo. La preferencia de recuperación no equivale a consentimiento.
- Los requisitos originales se mantienen abajo. Inventario, matriz de tratamientos, procedimiento propuesto y condiciones para cerrar la fase figuran en las secciones 10–13. No se han ejecutado pruebas, desplegado cambios, aplicado migraciones ni revisado la configuración privada del proveedor durante esta implementación.

## 1. Acceso desde la landing

### Requisitos funcionales

- Desde **Iniciar sesión** y **Registrarse**, la persona debe encontrar una forma visible de volver a la landing de Menuki.
- El regreso debe funcionar tanto en PC como en móvil y en una publicación de GitHub Pages alojada bajo una subruta. Usar rutas relativas compatibles con esa publicación.
- La navegación entre landing, inicio de sesión y registro debe conservar la intención de la acción: volver a la portada no debe enviar accidentalmente a otra sección autenticada.
- El formulario de registro debe incluir un footer con la identidad de Menuki y enlaces visibles a la landing y a la información legal que se publique. Si el formulario de acceso comparte la misma pantalla, se recomienda reutilizar el mismo footer.
- Añadir en la landing y en el footer del flujo de acceso un enlace llamado, por ejemplo, **Privacidad y protección de datos**. El enlace debe llevar a la política propia de Menuki, no a una página genérica que explique el RGPD.

El flujo actual comparte una sola pantalla para entrar y registrarse. El enlace de regreso y el footer informativo están añadidos en el checkout; el footer se muestra al seleccionar **Crear cuenta** en la página independiente. El formulario, incluido el modal, abre los borradores en un popup sin perder los campos; su aprobación definitiva requiere los datos de la sección 8. La retirada de accesos de la app autenticada no elimina la información pública ni constituye consentimiento o renuncia a derechos; antes de la versión definitiva se validará su accesibilidad legal permanente según la prestación real.

### Criterios de aceptación

- Una persona puede abrir **Iniciar sesión**, iniciar sesión o elegir registro y volver a la landing mediante un control visible, sin depender del botón Atrás del navegador.
- Los enlaces funcionan desde la raíz y desde la ruta de publicación de GitHub Pages.
- El footer y los enlaces son legibles, utilizables con teclado y adaptables a pantallas pequeñas.

## 2. Política de privacidad y protección de datos

Publicar una página propia, accesible desde la landing y el flujo de registro, con información clara, comprensible y por capas cuando convenga. Como mínimo, preparar y validar:

- Identidad y datos de contacto del responsable del tratamiento y, solo si corresponde, de su representante y de su delegado de protección de datos.
- Finalidades concretas y base jurídica correspondiente a cada tratamiento. No asumir que todo tratamiento necesita consentimiento: el RGPD contempla bases distintas, como la ejecución de un contrato o medidas precontractuales.
- Datos tratados y, cuando proceda, categorías de datos; campos obligatorios u opcionales y consecuencias de no facilitarlos.
- Plazos o criterios de conservación.
- Encargados, destinatarios y categorías de destinatarios; transferencias internacionales y garantías cuando correspondan.
- Derechos aplicables, cómo ejercerlos, posibilidad de retirar un consentimiento cuando el tratamiento se base en él y derecho a reclamar ante la AEPD.
- Información sobre decisiones automatizadas o elaboración de perfiles si en el futuro se incorporan.

La información debe describir el servicio y sus flujos reales. Antes de redactarla se revisarán, entre otros, el alta y acceso con Supabase Auth, los datos de perfil, peso, comidas, actividad y sincronización; los servicios de alojamiento y los recursos externos cargados por las páginas. No publicar nombres de proveedores, ubicaciones, plazos o garantías que no se hayan comprobado.

## 3. Consentimiento

- Determinar primero qué tratamientos usan realmente el consentimiento como base jurídica. No utilizar una casilla genérica de “acepto la política de privacidad” como sustituto de informar ni pedir consentimiento para tratamientos que tengan otra base adecuada.
- Cuando el consentimiento sea la base elegida, solicitar una acción afirmativa, específica, informada y demostrable. Las casillas deben aparecer desmarcadas de inicio y las finalidades opcionales deben poder aceptarse por separado.
- Si en el futuro hay comunicaciones promocionales o boletines, mantener su autorización opcional separada del alta y del uso esencial de Menuki.
- Explicar cómo retirar el consentimiento con una facilidad comparable a la de otorgarlo.

## 4. Cookies y tecnologías similares

Antes de diseñar un banner, hacer un inventario de cookies y de otras tecnologías que almacenen información o accedan al dispositivo. Incluir landing, login, registro y aplicación; revisar recursos de terceros, analítica, píxeles, `localStorage` y tecnologías equivalentes. Distinguir las cookies de la persistencia local de la aplicación y determinar qué regla aplica a cada mecanismo.

- Publicar una política de cookies solo con tecnologías y finalidades verificadas, indicando cuáles son propias o de terceros, su finalidad y duración cuando proceda.
- Si se usan cookies o tecnologías no exentas que requieren consentimiento, informar antes de activarlas y ofrecer controles para aceptar, rechazar y configurar. Aceptar y rechazar deben ser fáciles de localizar y comparables en nivel y visibilidad; la configuración permitirá elegir por finalidad cuando corresponda.
- Permitir revisar y cambiar la elección después desde un enlace o control permanente.
- Si solo se usan mecanismos técnicos exentos, no presentar un banner de consentimiento innecesario; confirmar primero la exención a partir del uso concreto.
- No condicionar el registro o la navegación a aceptar tecnologías opcionales cuando no corresponda.

La Guía de cookies de la AEPD de mayo de 2024 incluye cookies y tecnologías similares y describe el consentimiento previo, la opción de rechazo y la configuración; la implementación concreta depende del inventario y del uso de cada tecnología.

## 5. Aviso legal y condiciones de uso

- Determinar si Menuki y su prestación concreta están sujetos a la LSSI-CE y qué información debe mostrarse.
- Preparar un aviso legal con la identidad del prestador, domicilio o dirección aplicable, correo y un medio de contacto directo y efectivo; añadir datos registrales, autorizaciones, identificadores o información adicional cuando sean exigibles para el caso concreto.
- Preparar condiciones de uso si el funcionamiento del servicio las requiere. Separar su aceptación, si se solicita, de consentimientos de privacidad o cookies.
- No inventar ni publicar datos fiscales, registrales, de contacto o titularidad. Obtenerlos del responsable antes de aprobar esta página como aviso definitivo. La estructura con campos vacíos es la excepción de desarrollo autorizada el 17/10/2026.

El artículo 10 de la LSSI-CE establece información general accesible de forma permanente, fácil, directa y gratuita para los prestadores a los que resulta aplicable. La composición exacta del aviso requiere conocer quién presta el servicio y en qué condiciones.

## 6. Ejercicio de derechos y contacto

La política debe explicar un canal efectivo para que las personas puedan dirigirse al responsable. Se documentará cómo recibir, verificar, tramitar y responder solicitudes de:

- Acceso y rectificación.
- Supresión.
- Limitación del tratamiento.
- Portabilidad, cuando se den sus condiciones.
- Oposición, cuando se den sus condiciones.
- Retirada del consentimiento, cuando corresponda.
- Reclamación ante la Agencia Española de Protección de Datos.

La página puede usar lenguaje cotidiano, pero debe conservar los nombres y alcance correctos de los derechos. No presentar el listado “ARCO-POL” como si todos los derechos fueran aplicables de idéntica manera a cualquier tratamiento.

## 7. Seguridad y gestión interna

- Comprobar HTTPS en todos los entornos publicados y evitar exponer contraseñas, claves privadas, tokens o datos personales en el cliente, repositorio, analítica o registros innecesarios.
- Revisar RLS y permisos de Supabase, control de acceso por cuenta, flujo de autenticación, dependencias externas, retención y eliminación, copias del proveedor y gestión de incidentes.
- Documentar las medidas técnicas y organizativas que existan realmente. No usar expresiones absolutas como “datos totalmente seguros” ni prometer medidas que no se hayan verificado.
- Evaluar si Menuki debe mantener un Registro de Actividades de Tratamiento (RAT) conforme al artículo 30 del RGPD y, si aplica, prepararlo como documento interno. La excepción para organizaciones de menos de 250 personas tiene condiciones; no debe darse por aplicable sin evaluar el riesgo, la regularidad y las categorías de datos.
- Evaluar con asesoramiento adecuado la naturaleza de los datos de perfil, peso y actividad que trata la aplicación y si puede aplicar alguna consideración especial del RGPD. Este documento no concluye que sean o no categorías especiales.

## 8. Datos pendientes antes de redactar los textos definitivos

- Nombre legal del titular o responsable, forma jurídica si existe, NIF u otro identificador que resulte aplicable, domicilio y correo de contacto.
- Si existe representante, delegado de protección de datos, inscripción registral o autorización aplicable.
- Relación comprobada de datos y finalidades de cada flujo: landing, registro, autenticación, perfil, nutrición, peso, actividad, sincronización y propuestas de recetas.
- Base jurídica por finalidad y plazos o criterios de conservación, incluida la eliminación de cuenta y los datos que puedan tener que conservarse por obligación legal.
- Proveedores y funciones: alojamiento web, Supabase/Auth y cualquier CDN, fuente, analítica u otro recurso externo; ubicaciones, subencargados, acuerdos y transferencias aplicables.
- Inventario real de cookies, almacenamiento y solicitudes de red en una sesión nueva y otra autenticada, para PC y móvil.
- Aplicabilidad del aviso legal LSSI-CE, el consentimiento por finalidad y el RAT según titular, actividad y tratamientos efectivos.
- Persona responsable de atender solicitudes de derechos y canal de contacto.

## 9. Secuencia sugerida para la fase de implementación

1. Auditar el flujo real de datos y tecnologías, y recopilar los datos del responsable.
2. Validar bases jurídicas, conservación, proveedores, transferencias, cookies y necesidad del RAT.
3. Redactar y revisar los textos de privacidad, cookies, aviso legal y condiciones que procedan.
4. Mejorar navegación de landing y Auth; publicar el footer y los enlaces de forma responsive.
5. Implementar solo los controles de consentimiento que requiera el inventario, sin activar previamente tecnologías sujetas a consentimiento.
6. Revisar accesibilidad, rutas de GitHub Pages, preferencias de cookies, registro, inicio de sesión y revisión legal antes de publicar.

## 10. Inventario técnico revisado en código

La revisión es estática: no acredita cookies recibidas por red, duración efectiva de la sesión, comportamiento de una cuenta real ni configuración del entorno publicado.

| Mecanismo o servicio | Datos y finalidad comprobables | Duración y comprobaciones pendientes |
| --- | --- | --- |
| Landing y páginas legales | Archivos estáticos, recursos locales; la landing carga el iframe de acceso al solicitarlo. Sin escritura propia de cookies ni almacenamiento en su código. | Revisar respuestas HTTP y cookies del alojamiento en una sesión nueva. |
| Supabase Auth | Correo, contraseña gestionada por Auth y sesión persistente; `persistSession`, `autoRefreshToken` y `detectSessionInUrl` activos. Familia de claves local `sb-…-auth-token`, según la biblioteca. | Configuración de expiración, revocación, recuperación de contraseña, correo transaccional y cookies de respuestas pendientes de revisar. |
| Copia local por cuenta | `mi_plan_saludable_v3_13oct:user:…`, estado v10 con perfil, menús, registros e inventario; posible marca auxiliar `:edited_at`. | Sin caducidad automática; cerrar sesión conserva la copia. El borrado de datos del navegador no elimina la cuenta remota. |
| Conciliación local | `mi_plan_saludable_v3_13oct:sync:user:…`, revisión, identificadores, fechas y estado base personal de conciliación. | Sin caducidad automática; no es solo metadata anónima. |
| Copia previa a cuentas | `mi_plan_saludable_v3_13oct` y posible `:edited_at`; transición al espacio por cuenta. | La clave principal se retira al trasladarla; la marca auxiliar antigua puede permanecer. |
| Supabase relacional | Estado personal en tablas con `user_id`; buzón compartido vinculado al remitente y administradores con permisos específicos. | No hay purga temporal general; región, DPA, subencargados, transferencias, backups y su borrado pendientes. |
| jsDelivr | Carga de `@supabase/supabase-js@2.117.3` en `menuki.html`; solicitudes de conexión al CDN. | Revisar registros, respuesta HTTP, cookies y transferencias del proveedor. No se presume exento por ser una biblioteca. |
| GitHub Pages | Archivos públicos. GitHub documenta registro de IP de visitantes por seguridad. | Revisar condiciones, conservación y configuración de la publicación. No confundir con analítica instalada en Menuki. |

Evidencia: `index.html`, `js/landing.js`, `menuki.html`, `js/main.js` (`startApp`, `selectUserLocalState`, `readCloudMeta`, `writeCloudMeta` y cierre de sesión), `js/persistence/local-state.js` y migraciones de `supabase/migrations/`. El código no incluye herramientas de publicidad o analítica de visitas. Esta ausencia estática no concluye la auditoría de terceros ni la exención de todos los mecanismos.

## 11. Matriz preparatoria de tratamientos / RAT

**Borrador de trabajo, no RAT final aprobado.** Responsable, contacto, eventual representante/DPD, destinatarios completos, medidas organizativas, plazos y garantías deben completarse. El RAT y los expedientes reales se custodiarán fuera del repositorio público, sin datos personales de solicitudes ni evidencias de consentimiento en Git.

| Tratamiento / finalidad | Personas y categorías de datos | Destinatarios o servicios actuales | Base y conservación pendientes |
| --- | --- | --- | --- |
| Cuenta, acceso y recuperación | Titulares de cuenta; correo, credencial gestionada por Auth, identificador y sesión. | Supabase Auth; concretar correo transaccional y subencargados. | Evaluar art. 6.1.b para el servicio solicitado y bases aplicables a seguridad. Política de baja y registros técnicos por definir. |
| Planificación y seguimiento | Titulares; parámetros de perfil, objetivos, menús, consumos, peso y actividad con fechas. | Supabase; copia de trabajo en el dispositivo. | Validar art. 6 y si concurren datos de salud del art. 9. No hay plazo automático general aprobado. |
| Recuperación ósea | Titulares que activan la preferencia; indicador de recuperación y preferencias derivadas en propuestas y ciclos. | Supabase; copia de trabajo local. | Evaluar habilitación del art. 9, incluida la opción de consentimiento explícito. Definir retirada y tratamiento de preferencias/historial ya existente. |
| Compra e inventario | Titulares; cantidades, existencias, movimientos y compras. | Supabase; copia de trabajo local. | Evaluar base para prestar el servicio; fijar conservación y separación de historiales. |
| Buzón compartido de recetas | Remitentes; ID de cuenta, nombre/tipo de receta y textos libres de ingredientes/pasos. | Supabase, administradores; paquete admin sin identidad del remitente. | Determinar base, permisos de aportación, revisión y conservación. El borrado del buzón no elimina recetas ya incorporadas al catálogo genérico. |
| Alojamiento y entrega de recursos | Visitantes y usuarios; IP y otros datos técnicos según proveedor. | GitHub Pages; jsDelivr al cargar el acceso/app. | Concretar función de cada proveedor, base, garantías y duración; revisión de producción pendiente. |
| Atención de derechos y seguridad | Solicitantes y personas afectadas; contacto, solicitud y evidencias proporcionadas. | Canal y personas autorizadas aún sin designar. | Diseñar cumplimiento de obligaciones legales, acceso restringido, minimización y conservación del expediente. No existe todavía ese canal operativo. |

No se ha adoptado una base jurídica definitiva en esta matriz. Deben evaluarse regularidad y riesgos para RAT, y necesidad de evaluación de impacto y DPD atendiendo a escala, finalidad y categorías; no asumir que el tamaño pequeño elimina esas obligaciones.

## 12. Procedimientos internos propuestos

Estos pasos no constituyen un servicio ya operativo. Deben asignarse responsables y canal antes de ofrecerlos como tal:

1. **Recepción de derechos:** habilitar un correo real y accesible; registrar fecha, derecho y alcance en un expediente restringido, fuera de Git. Verificar identidad de forma proporcionada; la ausencia de confirmación de email en Auth obliga a no confiar exclusivamente en una dirección declarada. No pedir documentos por defecto ni revelar datos a otra cuenta.
2. **Tramitación:** responder dentro de los plazos del art. 12 RGPD y documentar ampliaciones o motivos cuando procedan. Identificar datos de Auth, tablas personales, propuestas, copias locales y backups del proveedor antes de responder. La rectificación del perfil no sustituye atender una solicitud completa.
3. **Acceso y portabilidad:** determinar el alcance de cada derecho y entregar por un canal seguro cuando corresponda. Se mantiene la decisión de no añadir exportación/importación del estado personal a la interfaz habitual; esa decisión no elimina los derechos aplicables ni justifica rechazar su atención individual.
4. **Supresión:** comprobar alcance y posibles obligaciones de conservación; ejecutar operaciones de cuenta únicamente por un canal administrativo autorizado. Las migraciones incluyen relaciones con `auth.users` y borrado en cascada, pero falta verificar el comportamiento completo y el borrado de sesiones/backups. No equiparar `reset_menuki_state`, borrado de registros, cierre de sesión o borrado local con eliminación de la cuenta.
5. **Consentimientos, si son la base elegida:** conservar versión del texto, finalidad, cuenta, fecha y acción afirmativa; registrar cambios y retirada en un soporte remoto protegido e independiente de los valores de perfil. Definir bloqueo o alternativa cuando falte o se retire; no usar casillas premarcadas ni una marca solo local como prueba suficiente. No implementado todavía.
6. **Incidentes:** designar responsables, canal y criterios; valorar riesgo, contener el incidente, preservar evidencias fuera del repositorio y aplicar los arts. 33–34 cuando correspondan. No se ha puesto en marcha un procedimiento operativo ni se han revisado logs o backups del proveedor.
7. **Cambio de proveedor:** inventariar datos y contratos, validar ubicación/transferencias, planificar acceso, migración, bajas y copias remanentes, y actualizar información y consentimientos cuando proceda antes de cambiar el tratamiento.

## 13. Pendientes antes de aprobar y publicar los avisos definitivos

- [ ] Completar y validar identidad, domicilio, contacto y datos registrales/fiscales aplicables.
- [ ] Definir público, edad y condiciones comerciales; completar la información precontractual antes de ofrecer pagos.
- [ ] Validar bases por finalidad y tratamiento de salud; implementar consentimiento explícito y retirada si corresponde.
- [ ] Habilitar y asignar el canal de derechos; verificar acceso, supresión y portabilidad individual.
- [ ] Definir y aplicar conservación, baja, revocación de sesiones y alcance de eliminación/backups.
- [ ] Confirmar región, acuerdos, subencargados y transferencias de los proveedores actuales o sustitutos.
- [ ] Auditar cookies y red en una sesión nueva y autenticada de producción, PC y móvil; clasificar cada mecanismo y, si procede, implementar bloqueo previo y preferencias revisables.
- [ ] Verificar HTTPS, aislamiento RLS, roles, seguridad, recuperación e incidentes en producción.
- [ ] Completar RAT y evaluar EIPD/DPD según el tratamiento real.
- [ ] Revisar jurídicamente los textos, comprobar navegación y lectura responsive, aprobar la versión y sustituir de forma expresa el estado de borrador. No basta con quitar el aviso ni `noindex`.

## Referencias oficiales

- [Reglamento (UE) 2016/679 (RGPD), BOE/DOUE](https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807): licitud y consentimiento (arts. 6 y 7), información (arts. 12–14), derechos (arts. 15–22), RAT (art. 30) y seguridad (art. 32).
- [Ley 34/2002 (LSSI-CE), BOE](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758): información general del prestador (art. 10) y almacenamiento/acceso a dispositivos (art. 22.2).
- [Ley Orgánica 3/2018 (LOPDGDD), BOE](https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673).
- [Guía sobre el uso de las cookies, AEPD, mayo de 2024](https://www.aepd.es/guias/guia-cookies.pdf).
- [Derecho de información, AEPD](https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-informacion).
- [Derechos reconocidos por el RGPD, AEPD](https://www.aepd.es/preguntas-frecuentes/1-tus-derechos/2-tus-derechos-de-proteccion-de-datos/FAQ-0105-que-derechos-reconoce-el-rgpd-a-los-afectados).
- [Modelos y formularios, incluida información y RAT, AEPD](https://www.aepd.es/derechos-y-deberes/modelos-y-formularios).
- [Persistencia de sesión, Supabase](https://supabase.com/docs/reference/javascript/auth).
- [GitHub Pages: alojamiento y registro de IP por seguridad](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).
- [Acuerdo de tratamiento, Supabase](https://supabase.com/legal/customer-resources/data-processing-addendum): documento público; su existencia no acredita la región ni la configuración del proyecto.
