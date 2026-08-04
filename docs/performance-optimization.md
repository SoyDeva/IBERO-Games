# Optimización adaptativa del vuelo

## Objetivo

Reducir el consumo de CPU, GPU y memoria temporal en celulares y computadores sin cambiar distancia, combustible, colisiones, dificultad, preguntas o puntuación.

## Perfiles automáticos

- `economy`: celulares pequeños, equipos con 4 GB o menos, cuatro núcleos o ahorro de datos. Canvas 1x, 46 estrellas, partículas al 38 % y dibujo visual cada dos fotogramas.
- `balanced`: tabletas, portátiles modestos y pantallas de densidad alta. Canvas hasta 1.35x, 72 estrellas y partículas al 68 %.
- `high`: computadores capaces. Conserva 60 FPS y todos los elementos, con densidad máxima de 1.75x para evitar trabajo de GPU que apenas mejora la imagen.

El monitor utiliza el promedio móvil del tiempo entre fotogramas. Puede degradar el perfil cuando el equipo no mantiene fluidez y recuperarlo después de un periodo estable, sin superar la capacidad detectada al iniciar.

## Reducciones de trabajo

- El Canvas no vuelve a ajustar dimensiones cuando el tamaño real no cambió.
- El HUD se actualiza entre 7 y 12 veces por segundo, y siempre de inmediato después de una acción importante.
- Las celebraciones tienen un límite global de 72 partículas.
- Núcleos, campo de impulso y sombras reducen detalle en perfiles bajos.
- Las pantallas pausadas dibujan con menor frecuencia.
- El contexto Canvas solicita baja latencia mediante `desynchronized` cuando el navegador lo admite.

## Compatibilidad

La simulación continúa ejecutándose con el mismo `delta` y las mismas funciones puras. La reducción de FPS afecta únicamente el dibujo, no la detección de colisiones ni el avance del juego.

La temporada pública permanece en `v23`. El nombre interno del caché cambia para distribuir el motor optimizado y precargar `flight-performance.js` en el modo sin conexión.
