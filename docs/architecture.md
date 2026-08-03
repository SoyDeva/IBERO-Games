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
- selección adaptativa moderada sin excluir preguntas del nivel;
- historial normalizado de sesiones y metas pedagógicas derivadas del desempeño;
- configuración de metas, límites de retención y comparación longitudinal por bloques;
- construcción de exportaciones JSON y CSV sin conexiones de red;
- registro versionado de perfiles pedagógicos locales, con identidad derivada del apodo y sin almacenar tokens;
- resumen comparativo descriptivo de perfiles, con identificación del perfil activo;
- eliminación controlada por identificador, protegiendo el perfil activo;
- creación y verificación de respaldos JSON individuales y consolidados mediante suma de integridad;
- análisis sin escritura de respaldos consolidados, selección de perfiles y resolución explícita de coincidencias;
- aplicación atómica de perfiles nuevos o reemplazados, respetando el límite defensivo de la colección;
- puntos de recuperación versionados con caducidad, integridad y huella del estado posterior;
- reversión segura únicamente cuando no existen cambios pedagógicos posteriores;
- medición UTF-8 del almacenamiento accesible y clasificación de salud local;
- detección de colección ilegible, perfiles reparables, residuos obsoletos y bloqueos de lectura o escritura;
- vista previa conservadora de perfiles recuperables, exclusión de entradas irreconocibles y verificación de que la fuente no cambió antes de reparar.

### `js/services/`

Coordina recursos externos o estado de aplicación que no pertenece al DOM. Esta capa no conoce la estructura visual de las pantallas.

El adaptador `browser-storage.js` centraliza lectura, escritura, eliminación y tolerancia a almacenamiento bloqueado. Los servicios especializados administran partidas, ajustes, sesión del piloto, economía local y logros. `ranking-controller.js` concentra la caché, los estados de carga y error, la actualización del top mundial y la invalidación posterior al envío de una partida. `question-session.js` administra una baraja por nivel, selecciona la siguiente pregunta y conserva la pregunta activa para evaluarla. `storage-diagnostics-store.js` enumera las claves accesibles, comprueba escritura con una clave temporal, incorpora la vista previa de reparación y permite eliminar únicamente residuos recalculados como obsoletos. `learning-repair-store.js` conserva el contenido original sin transformarlo, exige su descarga preventiva, vuelve a comparar la huella de la fuente y escribe únicamente una colección reparable ya normalizada. `learning-progress-store.js` persiste localmente aciertos, errores, rachas, sesiones, metas y preferencias dentro de perfiles separados por piloto. Migra el documento pedagógico anterior al primer piloto activo, permite respaldar o restaurar el perfil actual, crear un respaldo consolidado, previsualizar una restauración consolidada sin escribir, aplicar solamente la selección confirmada y eliminar perfiles inactivos con protección explícita del perfil activo. Antes de una eliminación, importación o restauración consolidada exige guardar un punto de recuperación; también valida y aplica la reversión del último cambio destructivo. Los respaldos e importaciones deben superar además el diagnóstico preventivo de almacenamiento. `flight-input-controller.js` interpreta teclado y puntero, enlaza los eventos del navegador y los traduce a operaciones públicas de `SpaceFlight`.

### `js/ui/`

Contiene renderizadores y enlaces de interacción. Recibe modelos ya preparados y no administra reglas de negocio, almacenamiento ni conexiones remotas.

- `navigation-bindings.js` enlaza de forma uniforme los botones `data-nav`, aplica el modo de vuelo y protege el acceso a una misión cuando falta el piloto.
- `static-screens.js` genera las pantallas de instrucciones, guía docente y créditos.
- `home-screen.js` representa perfil, récord, logros, cristales, nave activa y el resumen pedagógico.
- `learning-progress-panel.js` muestra el perfil activo, métricas, fortalezas, temas de refuerzo, metas, última sesión y tendencia opcional.
- `teacher-learning-report.js` genera una lectura local por categorías y sesiones, identifica el perfil activo y presenta la comparación descriptiva, administración, diagnóstico y entradas de respaldo o restauración.
- `learning-device-restore-panel.js` presenta perfiles nuevos y coincidentes, compara métricas locales con el respaldo y recoge decisiones explícitas de añadir, conservar, reemplazar o excluir.
- `learning-recovery-panel.js` muestra el último punto válido, explica su vigencia y ofrece deshacer o descartarlo.
- `storage-diagnostics-panel.js` presenta uso estimado, capacidad de lectura y escritura, perfiles reparables, problemas, limpieza segura y la entrada a la reparación asistida.
- `learning-repair-panel.js` muestra la vista previa de perfiles recuperables, exclusiones y la obligación de descargar el original antes de guardar.
- `learning-repair-controller.js` crea la descarga local exacta, habilita la confirmación y aplica la reparación mediante la huella previsualizada.
- `learning-tools-controller.js` enlaza metas, seguimiento longitudinal, impresión, exportaciones, respaldos, eliminación confirmada, restauración consolidada, reversión inmediata, limpieza de residuos y reparación asistida. Ninguna de estas acciones usa red.
- `hangar-screen.js` representa fuselajes, estelas, saldo y acciones de compra o equipamiento.
- `ranking-screen.js` representa estados de carga, error, podio y tabla mundial.
- `quiz-panel.js` presenta preguntas y opciones, enlaza respuestas y marca visualmente aciertos y errores.
- `station-panel.js` genera las ofertas, refleja disponibilidad por saldo y administra la presentación de la Estación Nova.
- `pause-panel.js` sincroniza la tarjeta de pausa, el bloqueo visual del vuelo y las etiquetas accesibles del botón.
- `tutorial-panel.js` presenta la guía paso a paso, resalta controles y administra la pregunta de entrenamiento.
- `game-over-screen.js` genera la bitácora, enlaza sus acciones y actualiza el resultado de la Liga Galáctica.
- `flight-renderer.js` dibuja fondo, estrellas, ruta, portal, obstáculos, plasma, explosiones, celebraciones y nave a partir del estado actual del vuelo.

### Perfiles, respaldo, recuperación, diagnóstico y reparación pedagógica

El progreso ya no utiliza un único documento compartido. `nebula-learning-profiles-v1` guarda una colección local con un máximo defensivo de perfiles normalizados. Cada perfil contiene únicamente apodo visible, fecha de actualización y progreso pedagógico; no contiene contraseña, token de la Liga ni configuración de Supabase.

Durante la primera lectura, el antiguo `nebula-learning-progress-v1` se mueve a un perfil temporal. Cuando se identifica el primer piloto, ese perfil se adopta una sola vez. Los pilotos posteriores comienzan con progreso independiente.

Los respaldos individuales utilizan el esquema `mision-nebula-learning-backup-v1`. El respaldo consolidado utiliza `mision-nebula-learning-device-backup-v1` y contiene todos los perfiles pedagógicos ya guardados en el dispositivo. Ambos formatos incluyen una suma FNV-1a para detectar truncamientos o cambios accidentales, presentada como control de integridad y no como firma digital ni prueba de autoría.

La importación individual valida esquema, suma e identidad del piloto antes de reemplazar solamente el perfil activo. La restauración consolidada verifica nuevamente el archivo, construye una vista previa sin modificar `localStorage` y exige una decisión por perfil. Las coincidencias se conservan por defecto; reemplazarlas requiere selección explícita. Los perfiles no marcados se excluyen y toda la selección se valida antes de una única escritura de la colección resultante.

La eliminación local acepta únicamente identificadores existentes, exige confirmación visual y rechaza el perfil activo; para borrarlo es necesario cambiar primero de piloto.

`nebula-learning-recovery-v1` conserva como máximo un punto de recuperación. Se crea antes de una eliminación, importación individual o restauración consolidada, y la operación se aborta si el navegador no puede guardarlo. El punto almacena la colección anterior, una huella del estado posterior, caduca a las 24 horas y deja de ser válido al registrarse cualquier cambio pedagógico adicional. Deshacer restaura la colección previa mediante una escritura única y elimina el punto después del éxito.

El diagnóstico local mide claves y valores como bytes UTF-8, prueba escritura mediante una clave temporal que se retira inmediatamente y clasifica el resultado como correcto, advertencia o crítico. Una colección pedagógica ilegible o un bloqueo de lectura o escritura impiden crear respaldos e iniciar importaciones. La limpieza vuelve a calcular el diagnóstico y solo elimina progreso heredado ya absorbido, puntos de recuperación inválidos o cachés antiguas de clasificación; nunca recibe claves arbitrarias desde la interfaz ni elimina perfiles válidos.

La reparación asistida analiza como máximo 5 MB y nunca escribe durante la vista previa. Solo considera recuperable una entrada que contenga un apodo identificable y un objeto de progreso; vuelve a derivar el identificador desde el apodo, limita la colección a 50 perfiles y resuelve coincidencias conservando la actualización más reciente. Un JSON ilegible, una estructura desconocida o claves reservadas no se reparan automáticamente. Antes de guardar se exige descargar byte por byte el contenido original, confirmar la operación y verificar que su huella no haya cambiado desde la vista previa. La versión normalizada se escribe una sola vez; las entradas excluidas permanecen disponibles en el archivo original descargado.

### Fachadas públicas

Los archivos históricos que ya importa la aplicación, como `js/galactic-league.js`, `js/storage.js` y `js/space-game.js`, se conservan como fachadas pequeñas. De esta manera, los consumidores no necesitan cambiar mientras la implementación interna se reorganiza.

### Aplicación y presentación

`js/app.js` conserva la coordinación de alto nivel. Ya delega identidad del piloto, persistencia económica, logros, decisiones del Hangar, estado remoto de la Liga, validación de rutas, enlace de navegación, renderizado de pantallas, barajas por nivel, evaluación de respuestas, presentación pedagógica, registro de desempeño por categoría, selección adaptativa moderada, inicio y cierre de sesiones pedagógicas, configuración, perfiles y respaldo local del progreso, Estación Nova, pausa, tutorial guiado y bitácora de cierre.

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
16. Historial por sesiones, metas pedagógicas y herramientas para docentes. **Completado.**
17. Metas configurables, exportación voluntaria y seguimiento longitudinal opcional. **Completado.**
18. Perfiles pedagógicos por piloto, respaldo verificable e importación local. **Completado.**
19. Administración de perfiles locales, comparación descriptiva y respaldo consolidado. **Completado.**
20. Restauración consolidada con vista previa, selección y resolución de coincidencias. **Completado.**
21. Puntos de recuperación y reversión del último cambio destructivo. **Completado.**
22. Diagnóstico preventivo, medición y limpieza segura del almacenamiento local. **Completado.**
23. Reparación asistida con vista previa, descarga exacta del original y confirmación antes de guardar. **Completado.**
