# Núcleos Nébula y Modo Impulso

## Objetivo

Añadir tensión, recompensa inmediata y decisiones de movimiento al vuelo sin crear controles nuevos ni interferir con las preguntas.

## Núcleos Nébula

- Aparecen aproximadamente cada 10,5 a 17 segundos.
- Se colocan en un carril libre cuando es posible.
- Se recogen alineando la nave con el núcleo.
- Cada núcleo restaura 6 puntos de combustible y aporta 22 puntos a la barra de impulso.
- Cada tercer núcleo recogido entrega una carga de plasma.
- No aparecen durante el tutorial ni cerca de un portal.

## Barra de impulso

La barra se carga mediante acciones de habilidad:

- recoger un núcleo: 22 puntos;
- destruir un obstáculo: 18 puntos;
- responder correctamente: 28 puntos.

Al llegar a 100 puntos se activa automáticamente el Modo Nébula durante 6 segundos:

- entrega una carga de plasma;
- reduce el consumo de combustible al 45 %;
- acelera visualmente las estrellas y añade líneas de energía;
- muestra una señal clara dentro del Canvas.

Un choque cancela el impulso activo y resta 30 puntos de carga. En práctica, una respuesta incorrecta también cancela la ventaja.

## Límites

- No altera las respuestas ni el selector de preguntas.
- No añade una moneda, compra o control nuevo.
- No realiza solicitudes de red ni usa almacenamiento adicional.
- No aparece en el tutorial.
- La barra se resuelve dentro del estado de vuelo existente.
