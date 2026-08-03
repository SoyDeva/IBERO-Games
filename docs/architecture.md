# Arquitectura técnica

Misión Nébula utiliza módulos ES nativos y no requiere compilación. La reestructuración se realiza de forma incremental para conservar el comportamiento publicado durante cada cambio.

## Capas

### `js/config/`

Contiene valores de configuración sin lógica de negocio, por ejemplo la URL pública de Supabase, las claves de `localStorage`, la clave publicable y los tiempos límite de red.

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
- compras y equipamiento del Hangar Estelar sin mutar el estado anterior.

### `js/services/`

Coordina recursos externos. Esta capa conoce `fetch`, Supabase y `localStorage`, pero no conoce las pantallas del juego.

El adaptador `browser-storage.js` centraliza lectura, escritura, eliminación y tolerancia a almacenamiento bloqueado. Los servicios especializados administran partidas, ajustes, sesión del piloto, economía local y logros. `ranking-controller.js` concentra la caché, los estados de carga y error, la actualización del top mundial y la invalidación posterior al envío de una partida.

### Fachadas públicas

Los archivos históricos que ya importa la aplicación, como `js/galactic-league.js` y `js/storage.js`, se conservan como fachadas pequeñas. De esta manera, los consumidores no necesitan cambiar mientras la implementación interna se reorganiza.

### Aplicación y presentación

`js/app.js` continúa coordinando navegación, pantallas y eventos. Ya delega identidad del piloto, persistencia económica, logros, decisiones del Hangar y estado remoto de la Liga en módulos independientes. Las siguientes fases separarán navegación, renderizado y orquestación de la misión.

### Motor de vuelo

`js/space-game.js` conserva Canvas, física, entrada y ciclo de juego. Su división se realizará después de estabilizar la capa de aplicación, separando estado, simulación, entrada y renderizado.

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
6. Navegación y renderizado de pantallas.
7. Orquestación de la misión y preguntas.
8. Motor de vuelo: estado, simulación, entrada y renderizado.
9. Panel pedagógico y adaptación por categorías sobre la arquitectura modular.
