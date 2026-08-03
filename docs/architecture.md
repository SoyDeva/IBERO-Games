# Arquitectura técnica

Misión Nébula utiliza módulos ES nativos y no requiere compilación. La reestructuración se realiza de forma incremental para conservar el comportamiento publicado durante cada cambio.

## Capas

### `js/config/`

Contiene valores de configuración sin lógica de negocio, por ejemplo la URL pública de Supabase, la clave publicable y los tiempos límite de red.

### `js/core/`

Contiene reglas y transformaciones puras que pueden ejecutarse y probarse sin DOM, Canvas, red ni almacenamiento del navegador.

Ejemplos actuales:

- normalización del código de temporada;
- construcción del resultado que se envía a la Liga;
- transformación de filas de Supabase al modelo de la interfaz;
- catálogo de errores comprensibles.

### `js/services/`

Coordina recursos externos. Esta capa conoce `fetch`, Supabase y los nombres de las funciones RPC, pero no conoce las pantallas del juego.

### Fachadas públicas

Los archivos históricos que ya importa la aplicación, como `js/galactic-league.js`, se conservan como fachadas pequeñas. De esta manera, `app.js` no necesita cambiar mientras la implementación interna se reorganiza.

### Aplicación y presentación

`js/app.js` continúa coordinando navegación, pantallas y eventos. En las siguientes fases se separará en controladores de perfil, economía, logros, clasificación y misión.

### Motor de vuelo

`js/space-game.js` conserva Canvas, física, entrada y ciclo de juego. Su división se realizará después de estabilizar la capa de aplicación, separando estado, simulación, entrada y renderizado.

## Reglas del refactor

1. No cambiar reglas pedagógicas ni mecánicas durante una extracción técnica.
2. Mantener fachadas compatibles para evitar cambios masivos.
3. Extraer primero funciones puras y cubrirlas con pruebas.
4. Ejecutar `npm run check` en cada rama y pull request.
5. Integrar cambios pequeños antes de iniciar la siguiente capa.

## Ruta de migración

1. Liga Galáctica: dominio, transporte y servicio.
2. Perfil del piloto y persistencia local.
3. Economía, hangar y logros.
4. Navegación y renderizado de pantallas.
5. Orquestación de la misión y preguntas.
6. Motor de vuelo: estado, simulación, entrada y renderizado.
7. Panel pedagógico y adaptación por categorías sobre la arquitectura modular.
