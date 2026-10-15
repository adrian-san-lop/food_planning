# Requisitos futuros de acceso, privacidad y cumplimiento legal

- **Estado:** el regreso visible a la landing y el footer informativo del registro están implementados localmente. Las páginas y textos legales siguen pendientes y no están aprobados como contenido definitivo.
- **Idioma del producto:** español.
- **Alcance:** landing pública, acceso y registro de Menuki, información legal visible y documentación interna sobre tratamientos.

Este documento recoge las necesidades indicadas por el propietario y las organiza para una fase posterior. No sustituye una revisión jurídica. Antes de publicar avisos legales o pedir consentimientos hay que comprobar el funcionamiento real de la aplicación, completar los datos del responsable y validar la aplicabilidad de cada obligación.

## 1. Acceso desde la landing

### Requisitos funcionales

- Desde **Iniciar sesión** y **Registrarse**, la persona debe encontrar una forma visible de volver a la landing de Menuki.
- El regreso debe funcionar tanto en PC como en móvil y en una publicación de GitHub Pages alojada bajo una subruta. Usar rutas relativas compatibles con esa publicación.
- La navegación entre landing, inicio de sesión y registro debe conservar la intención de la acción: volver a la portada no debe enviar accidentalmente a otra sección autenticada.
- El formulario de registro debe incluir un footer con la identidad de Menuki y enlaces visibles a la landing y a la información legal que se publique. Si el formulario de acceso comparte la misma pantalla, se recomienda reutilizar el mismo footer.
- Añadir en la landing y en el footer del flujo de acceso un enlace llamado, por ejemplo, **Privacidad y protección de datos**. El enlace debe llevar a la política propia de Menuki, no a una página genérica que explique el RGPD.

El flujo actual comparte una sola pantalla para entrar y registrarse. El enlace de regreso y el footer informativo ya están añadidos en el checkout; el footer se muestra al seleccionar **Crear cuenta**. El enlace a la política propia queda pendiente de redactar y validar su contenido con los datos de la sección 8.

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
- No inventar ni publicar datos fiscales, registrales, de contacto o titularidad. Obtenerlos del responsable antes de implementar esta página.

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

## Referencias oficiales para la fase posterior

- [Reglamento (UE) 2016/679 (RGPD), BOE/DOUE](https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807): licitud y consentimiento (arts. 6 y 7), información (arts. 12–14), derechos (arts. 15–22), RAT (art. 30) y seguridad (art. 32).
- [Ley 34/2002 (LSSI-CE), BOE](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758): información general del prestador (art. 10) y almacenamiento/acceso a dispositivos (art. 22.2).
- [Guía sobre el uso de las cookies, AEPD, mayo de 2024](https://www.aepd.es/guias/guia-cookies.pdf).
- [Derecho de información, AEPD](https://www.aepd.es/derechos-y-deberes/conoce-tus-derechos/derecho-de-informacion).
- [Derechos reconocidos por el RGPD, AEPD](https://www.aepd.es/preguntas-frecuentes/1-tus-derechos/2-tus-derechos-de-proteccion-de-datos/FAQ-0105-que-derechos-reconoce-el-rgpd-a-los-afectados).
- [Modelos y formularios, incluida información y RAT, AEPD](https://www.aepd.es/derechos-y-deberes/modelos-y-formularios).
