# Arquitectura técnica

Misión Nébula utiliza módulos ES nativos y no requiere compilación. La reestructuración se realiza de forma incremental para conservar el comportamiento publicado durante cada cambio.

## Capas

### `js/config/`

Contiene valores de configuración sin lógica de negocio, por ejemplo la URL pública de Supabase, las claves de `localStorage`, la clave publicable, los tiempos límite de red y los catálogos visuales de fuselajes y estelas.

### `js/core/`

Contiene reglas y transformaciones puras que pueden ejecutarse y probarse sin DOM, Canvas, red ni almacenamiento del navegador.

Ejemplos actuales:

- normalización del código de temporada;
- construcción del resultado que se envía a la Liga;
- transformación de filas de Supabase al modelo de la interfaz;
- catálogo de errores comprensibles;
- valores predeterminados y normalización de accesibilidad;
- limpieza y normalización del perfil del piloto;
- normalización de créditos, fuselajes y estelas adquiridas;
- catálogo y normalización de logros;
- compras y equipamiento del Hangar Estelar sin mutar el estado anterior;
- catálogo, validación y transiciones del estado de rutas;
- escape uniforme de contenido dinámico antes de insertarlo en HTML;
- evaluación de respuestas, mensajes pedagógicos y tiempos de retroalimentación;
- catálogo de mejoras y sesión de compra única de la Estación Nova;
- pasos, pregunta y evaluación sin penalización del tutorial guiado;
- normalización de la bitácora de misión, cálculo de récord y estado de sincronización;
- estado inicial del vuelo, dificultad adaptativa, sectores, recarga, HUD y resumen final;
- avance continuo, agotamiento de combustible y rescates de práctica;
- movimiento y limpieza de obstáculos, proyectiles y explosiones;
- generación de oleadas, detección de impactos, colisiones y destrucciones;
- límites, perspectiva y redimensionamiento de la superficie de vuelo;
- normalización del progreso pedagógico, rachas, fortalezas y categorías de refuerzo;
- selección adaptativa moderada sin excluir preguntas del nivel.

### `js/services/`

Coordina recursos externos o estado de aplicación que no pertenece al DOM. Esta capa no conoce la estructura visual de las pantallas.

El adaptador `browser-storage.js` centraliza lectura, escritura, eliminación y tolerancia a almacenamiento bloqueado. Los servicios especializados administran partidas, ajustes, sesión del piloto, economía local y logros. `ranking-controller.js` concentra la caché, los estados de carga y error, la actualización del top mundial y la invalidación posterior al envío de una partida. `question-session.js` administra una baraja por nivel, selecciona la siguiente pregunta y conserva la pregunta activa para evaluarla. `learning-progress-store.js` persiste localmente aciertos, errores y rachas por categoría, con tolerancia a almacenamiento bloqueado. `flight-input-controller.js` interpreta teclado y puntero, enlaza los eventos del navegador y los traduce a operaciones públicas de `SpaceFlight`.

### `js/ui/`

Contiene renderizadores y enlaces de interacción. Recibe modelos ya preparados y no administra reglas de negocio, almacenamiento ni conexiones remotas.

- `navigation-bindings.js` enlaza de forma uniforme los botones `data-nav`, aplica el modo de vuelo y protege el acceso a una misión cuando falta el piloto.
- `static-screens.js` genera las pantallas de instrucciones, guía docente y créditos.
- `home-screen.js` representa perfil, récord, logros, cristales, nave activa y el resumen pedagógico.
- `learning-progress-panel.js` muestra métricas, fortalezas, temas de refuerzo y la recomendación para la siguiente práctica.
- `hangar-screen.js` representa fuselajes, estelas, saldo y acciones de compra o equipamiento.
- `ranking-screen.js` representa estados de carga, error, podio y tabla mundial.
- `quiz-panel.js` presenta preguntas y opciones, enlaza respuestas y marca visualmente aciertos y errores.
- `station-panel.js` genera las ofertas, refleja disponibilidad por saldo y administra la presentación de la Estación Nova.
- `pause-panel.js` sincroniza la tarjeta de pausa, el bloqueo visual del vuelo y las etiquetas accesibles del botón.
- `tutorial-panel.js` presenta la guía paso a paso, resalta controles y administra la pregunta de entrenamiento.
- `game-over-screen.js` genera la bitácora, enlaza sus acciones y actualiza el resultado de la Liga Galáctica.
- `flight-renderer.js` dibuja fondo, estrellas, ruta, portal, obstáculos, plasma, explosiones, celebraciones y nave a partir del estado actual del vuelo.

### Fachadas públicas

Los archivos históricos que ya importa la aplicación, como `js/galactic-league.js`, `js/storage.js` y `js/space-game.js`, se conservan como fachadas pequeñas. De esta manera, los consumidores no necesitan cambiar mientras la implementación interna se reorganiza.

### Aplicación y presentación

`js/app.js` conserva la coordinación de alto nivel. Ya delega identidad del piloto, persistencia económica, logros, decisiones del Hangar, estado remoto de la Liga, validación de rutas, enlace de navegación, renderizado de pantallas, barajas por nivel, evaluación de respuestas, presentación pedagógica, registro de desempeño por categoría, selección adaptativa moderada, Estación Nova, pausa, tutorial guiado y bitácora de cierre.

### Motor de vuelo

`js/space-game.js` conserva la fachada `SpaceFlight` y el ciclo de animación. Delega en `js/core/flight-state.js` la creación del estado, dificultad, sectores, recarga, HUD y resumen; en `js/core/flight-simulation.js` el avance continuo, combustible, rescates, oleadas, proyectiles, colisiones, destrucciones y limpieza de objetos; en `js/services/flight-input-controller.js` la entrada de teclado y puntero; en `js/core/flight-geometry.js` los límites, la proyección y el redimensionamiento; y en `js/ui/flight-renderer.js` todo el dibujo de Canvas. `destroy()` cancela la animación, desconecta el observador y desmonta el controlador de entrada.

## Reglas del refactor

1. No cambiar reglas pedagógicas ni mecánicas durante una extracción técnica.
2. Mantener fachadas compatibles para evitar cambios masivos.
3. Extraer primero funciones puras y cubrirlas con pruebas.
4. Ejecutar `npm run check` en cada rama y pull request.
5. Integrar cambios pequeños antes de iniciar la siguiente capa.

## Ruta de migración

1. Liga Galáctica: dominio, transporte y servicio. **Completado.**
2. Persistencia local de partidas y ajustes. **Completado.**
3. Perfil del piloto, economía y logros. **Completado.**
4. Reglas del Hangar Estelar. **Completado.**
5. Clasificación y estado remoto de la Liga. **Completado.**
6. Navegación y pantallas informativas. **Completado.**
7. Pantallas dinámicas de Inicio, Hangar y Liga. **Completado.**
8. Barajas, evaluación y presentación de preguntas. **Completado.**
9. Estación Nova y panel de pausa. **Completado.**
10. Tutorial y cierre de partida. **Completado.**
11. Motor de vuelo: estado y reglas derivadas. **Completado.**
12. Motor de vuelo: simulación, colisiones y oleadas. **Completado.**
13. Motor de vuelo: entrada de teclado, puntero y controles. **Completado.**
14. Motor de vuelo: renderizado y utilidades de Canvas. **Completado.**
15. Panel pedagógico y adaptación por categorías sobre la arquitectura modular. **Completado.**
16. Historial por sesiones, metas pedagógicas y herramientas para docentes.
