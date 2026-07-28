## Mejoras de UI/UX realizadas

Esta implementación se ha centrado en mejorar el flujo principal de estudio tanto en escritorio como en dispositivos móviles.

### Diseño responsive

- Se añadió un diseño de una sola columna para dispositivos móviles.
- En escritorio se mantiene una estructura de dos columnas:
  - Sidebar fijo.
  - Área principal flexible.
- El sidebar se convierte en un menú lateral superpuesto en móvil.

### Experiencia del chat

- Se rediseñó el chat para mejorar la jerarquía visual entre los mensajes del usuario y del tutor.
- Se añadió un textarea que aumenta su altura automáticamente hasta un límite máximo.
- El botón de envío se integró dentro del campo de escritura.
- Se añadió soporte para:
  - `Enter` para enviar el mensaje.
  - `Shift + Enter` para crear una nueva línea.
- Se añadió un indicador de carga mientras el tutor genera una respuesta.
- Se implementó scroll automático al recibir nuevos mensajes.
- La zona de mensajes tiene scroll independiente, manteniendo siempre visible el campo de escritura.
- El botón para limpiar la conversación solo aparece cuando existen mensajes.
- Se ocultaron las llamadas y resultados internos de las herramientas para no mostrar información técnica innecesaria al usuario.
- Se añadió una animación suave al aparecer nuevos mensajes.

### Navegación entre chat y artifacts

- Se modificó la estructura para evitar que el chat y el workspace de artifacts aparezcan comprimidos al mismo tiempo.
- El área principal muestra de forma condicional:
  - El chat del tutor.
  - Una nota, quiz o test seleccionado.
- Se añadió un botón para volver al chat desde un artifact.
- Se mejoró el diseño visual de los quizzes.
- Se adaptó el color de los controles de selección a la paleta principal de la aplicación.

### Sistema visual

- Se creó una interfaz clara con un fondo lavanda suave.
- Las respuestas del tutor utilizan un fondo blanco para facilitar la lectura.
- Los mensajes del usuario utilizan un fondo morado claro para diferenciarlos.
- Se redujo la intensidad de los bordes y las sombras.
- Se unificó el color principal de botones, iconos y estados activos.
- Se mejoraron los espaciados, la alineación y el ancho máximo del contenido.

## Qué haría con más tiempo

-En cuanto al diseño, consolidaría un sistema visual común para toda la aplicación, definiendo colores, espaciados, tipografías, bordes, sombras y estados de los componentes.
-Realizaría pruebas en dispositivos móviles reales y una revisión de accesibilidad, prestando especial atención al contraste, la navegación por teclado, los estados de foco y las preferencias de movimiento reducido.
