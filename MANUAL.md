# Manual de Uso — Help Desk EduLabs

> Guía pensada para cualquier persona del equipo de EduLabs. No necesitas
> conocimientos técnicos para usar el sistema.
>
> 📷 *Sugerencia: acompaña cada sección con una captura de pantalla del sistema
> ya desplegado para ilustrar los pasos.*

---

## 1. ¿Para qué sirve y quién lo usa?

El **Help Desk EduLabs** es la herramienta interna para gestionar el soporte
técnico de la empresa. Reemplaza los correos y mensajes sueltos por un solo lugar
ordenado.

Lo usan dos tipos de personas:

- **Usuarios** — cualquier colaborador que tiene un problema técnico y necesita
  ayuda (ej. "no me funciona el correo", "el proyector no enciende").
- **Agentes** — el equipo de soporte que atiende y resuelve esos problemas.

El sistema tiene tres partes:

| Módulo            | ¿Para qué sirve?                                                        |
| ----------------- | ----------------------------------------------------------------------- |
| **Tickets**       | Registrar y dar seguimiento a cada solicitud de soporte.                |
| **Asistente IA**  | Ayuda automática: clasifica tickets y sugiere respuestas.               |
| **Chat en vivo**  | Atención inmediata en tiempo real, con un agente o con la IA.           |

---

## 2. Acceso al sistema

1. Abre el enlace de la aplicación en tu navegador.
2. Verás una pantalla de bienvenida que te pregunta **cómo vas a ingresar**:
   - Elige **Usuario** si vienes a pedir ayuda.
   - Elige **Agente** si vienes a atender solicitudes.
3. Escribe **tu nombre** y pulsa **Entrar al sistema**.

> **¿Hay usuario y contraseña de prueba?**
> No. Este prototipo **no pide contraseñas**: solo eliges un rol y escribes tu
> nombre. Esto facilita probar el sistema. Para cambiar de rol en cualquier
> momento, usa el botón **Cambiar** de la barra superior.

> 📷 *(Captura: pantalla de selección de rol)*

Una vez dentro verás el **panel principal** con accesos a *Gestión de Tickets* y
*Chat en vivo*.

---

## 3. Cómo crear, consultar y actualizar un ticket

### 3.1 Crear un ticket

1. En el menú superior pulsa **Tickets**.
2. Pulsa el botón **+ Nuevo ticket**.
3. Completa el formulario:
   - **Título**: un resumen corto del problema.
   - **Descripción**: explica con detalle qué pasa, desde cuándo y qué intentaste.
   - **Categoría** y **Prioridad**: puedes elegirlas tú o dejar que la IA las
     sugiera (ver sección 4).
   - **Nombre del solicitante**: viene con tu nombre, pero puedes cambiarlo.
   - **Persona asignada**: opcional, el agente que se encargará.
4. Pulsa **Crear ticket**. El sistema te lleva al detalle del ticket.

> 📷 *(Captura: formulario de nuevo ticket)*

### 3.2 Consultar tickets

- En **Tickets** ves la lista completa con su título, prioridad y estado.
- Arriba tienes un **resumen** (total, abiertos, prioridad alta).
- Usa los **filtros** para ver solo los tickets de un **estado** o una **categoría**.
- Cambia el **orden**: por *más recientes* o por *prioridad* (los de prioridad Alta
  primero — útil para los agentes).
- Pulsa cualquier ticket para ver su **detalle completo**.

> 📷 *(Captura: listado de tickets con filtros)*

### 3.3 Actualizar el estado de un ticket

En el detalle del ticket, un ticket avanza por estos estados, en orden:

**Abierto → En Progreso → Resuelto → Cerrado**

1. Pulsa el botón del siguiente estado (ej. *"Marcar como En Progreso"*).
2. El cambio se guarda al instante y aparece en el **Historial de cambios de
   estado**, con la fecha y el estado anterior/nuevo. Esto es automático: no tienes
   que registrar nada a mano.

> 📷 *(Captura: detalle del ticket con botones de estado e historial)*

### 3.4 Eliminar un ticket

- Solo se puede eliminar un ticket cuando está en estado **Cerrado**.
- En ese caso aparece el botón **Eliminar ticket** en el detalle. El sistema te
  pedirá confirmación.

---

## 4. Cómo usar el asistente de IA

El asistente de IA aparece en dos momentos:

### 4.1 Al crear un ticket (te ayuda a ti, el usuario)

1. Mientras llenas el formulario de nuevo ticket, escribe al menos el título o la
   descripción.
2. Pulsa **Analizar con IA**. El asistente te sugiere:
   - La **categoría** más adecuada.
   - El **nivel de prioridad** (Baja, Media, Alta).
   - Una **redacción más clara** del título o la descripción, si hace falta.
3. Cada sugerencia tiene un botón (**aplicar** / **usar**) para tomarla con un clic.

> 📷 *(Captura: sugerencias de la IA en el formulario)*

### 4.2 Al atender un ticket (te ayuda a ti, el agente)

En el detalle de un ticket, si entraste como **Agente**, verás el panel
**🤖 Asistente de IA para el agente**:

- **Analizar ticket con IA**: detecta el **sentimiento** del mensaje (frustrado,
  neutral o urgente) para que sepas con qué tono responder, y propone una
  **respuesta inicial** que puedes copiar.
- **Preguntar al asistente**: escribe cualquier duda sobre el ticket (ej. *"¿qué
  pasos debería seguir para este caso?"*) y el asistente te responde ahí mismo.

> 📷 *(Captura: panel del asistente de IA en el ticket)*

> **Nota:** cada respuesta indica si fue *"Generada por IA"* o en *"Modo simulado"*
> (cuando no hay conexión con el modelo de IA, el sistema responde con una ayuda
> básica para no quedarse sin respuesta).

---

## 5. Cómo usar el chat en vivo

El chat en vivo es para atención **inmediata**, en tiempo real.

### 5.1 Cómo lo inicia el usuario

1. Entra como **Usuario** y pulsa **Chat en vivo** en el menú.
2. Escribe (opcional) sobre qué necesitas ayuda y pulsa **Iniciar chat**.
3. Se abre la sala de conversación. Durante unos segundos el sistema **busca un
   agente disponible**.
   - Si un agente se conecta, conversas con él en tiempo real.
   - Si no hay agentes, el **asistente de IA** te atiende automáticamente. También
     puedes pulsar **"Hablar con la IA ahora"** para no esperar.
4. Escribe tus mensajes en la caja inferior. Las respuestas llegan solas, sin
   recargar la página.
5. Cuando termines, pulsa **Cerrar**. La conversación queda guardada.

> 📷 *(Captura: sala de chat del usuario)*

### 5.2 Cómo atiende el agente

1. Entra como **Agente** y pulsa **Chat en vivo**.
2. Verás las conversaciones agrupadas:
   - **Por atender**: están esperando o las está atendiendo la IA. Puedes unirte.
   - **Activas con agente**: ya tienen un agente.
   - **Cerradas**: el registro de conversaciones finalizadas.
3. Abre una conversación y pulsa **Atender** para unirte. El usuario verá que un
   agente entró.
4. Responde en tiempo real. Mientras atiendes, la **IA te asiste en segundo plano**:
   cada vez que el usuario escribe, te muestra una **sugerencia de respuesta** que
   puedes usar con el botón *"Usar esta sugerencia"* o ignorar.
5. Al terminar, pulsa **Cerrar**. Queda el registro completo del intercambio.

> 📷 *(Captura: sala de chat del agente con la sugerencia de la IA)*

---

## 6. Preguntas frecuentes y problemas comunes

**No veo la barra de menú superior.**
Aún no has elegido un rol. Vuelve a la pantalla de inicio y entra como Usuario o
Agente.

**Quiero cambiar de rol (de Usuario a Agente o viceversa).**
Pulsa el botón **Cambiar** en la esquina superior derecha. Volverás a la pantalla
de selección de rol.

**No puedo eliminar un ticket.**
Solo se pueden eliminar tickets en estado **Cerrado**. Avanza el ticket por sus
estados hasta cerrarlo; ahí aparecerá el botón de eliminar.

**No me deja cambiar el estado del ticket.**
Los estados avanzan en un solo sentido: Abierto → En Progreso → Resuelto → Cerrado.
Un ticket cerrado ya no cambia de estado.

**El asistente de IA dice "Modo simulado".**
Significa que el sistema no se pudo conectar con el modelo de IA en ese momento, así
que respondió con una ayuda básica. El sistema sigue funcionando con normalidad.

**El chat no se actualiza.**
El chat funciona en tiempo real; si notas que no llegan mensajes, revisa tu conexión
a internet y recarga la página: el historial de la conversación se conserva.

**Inicié un chat pero nadie responde.**
Si ningún agente se une en unos segundos, el asistente de IA toma la conversación
automáticamente. También puedes pulsar *"Hablar con la IA ahora"*.

**Entré al enlace y tarda en cargar la primera vez.**
La primera carga de cada sección puede tardar un poco más mientras el servidor la
prepara. Las siguientes son inmediatas.
