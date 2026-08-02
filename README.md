# Misión Nébula: Rescate en el planeta desconocido

Juego pedagógico digital para fortalecer creatividad, colaboración, argumentación y resolución de problemas abiertos en niñas y niños de 10 a 12 años.

**Autor y creador: Danilo Olarte González.**

Proyecto desarrollado para la Maestría en Educación de la Corporación Universitaria Iberoamericana, curso Electiva Creatividad e Innovación Educativa, Actividad 1 “Jugando enseño a crear”.

## Propósito pedagógico

La nave Asteria ha aterrizado en Nébula-X con cinco sistemas dañados. Para recuperar cinco Núcleos de Ingenio, las tripulaciones deben producir posibilidades, combinar recursos limitados, elaborar una solución, dibujarla, argumentarla, adaptarla a una condición inesperada y evaluarla de manera reflexiva.

La experiencia trabaja explícitamente:

- fluidez y generación de posibilidades;
- flexibilidad ante cambios;
- originalidad en la combinación de recursos;
- elaboración de funciones y pasos;
- resolución creativa de problemas;
- argumentación;
- colaboración mediante roles rotativos.

No es un cuestionario ni califica semánticamente las respuestas. La creatividad es indispensable para completar cada misión.

## Captura

> Espacio para añadir la captura definitiva de la portada después de publicar el proyecto.

## Características principales

- Expedición completa de cinco misiones y partida rápida de tres.
- Modos individual, colaborativo de 2 a 4 participantes y por equipos.
- Cinco zonas con identidad, sistema de nave y dificultad progresiva.
- Más de 30 problemas, 40 recursos, 20 restricciones y 20 giros inesperados.
- Constructor guiado con validación de campos y mínimo de recursos.
- Lienzo Canvas compatible con mouse y pantalla táctil, con grosor, deshacer, limpiar y descarga PNG.
- Rúbrica de 1 a 5 con justificación para valoraciones altas.
- Energía Creativa descrita como valoración pedagógica, no como medición científica.
- Roles automáticos y rotativos: Explorador, Inventor, Constructor y Comunicador.
- Mapa progresivo, insignias y Núcleos de Ingenio.
- Persistencia y continuación mediante `localStorage`.
- Informe final imprimible y descargable en HTML o texto.
- Documento académico independiente e imprimible.
- Guía para docentes integrada y en Markdown.
- Sonidos sintetizados localmente con Web Audio API.
- Alto contraste, texto grande, reducción de movimiento y navegación por teclado.
- Diseño responsivo sin imágenes ni librerías externas.

## Tecnologías

- HTML5 semántico
- CSS3 responsivo
- JavaScript ES6 con módulos nativos
- Canvas 2D
- Web Audio API
- `localStorage`
- SVG local únicamente para el icono del sitio

No existe backend, compilación, analítica, publicidad, API key ni dependencia de terceros.

## Estructura

```text
IBERO-Games/
├── index.html
├── informe-actividad-1.html
├── README.md
├── sw.js
├── css/
│   ├── styles.css
│   ├── accessibility.css
│   └── print.css
├── js/
│   ├── app.js
│   ├── game.js
│   ├── data.js
│   ├── storage.js
│   ├── canvas.js
│   ├── evaluation.js
│   ├── report.js
│   └── accessibility.js
├── assets/
│   ├── icons/favicon.svg
│   ├── illustrations/
│   └── audio/
└── docs/
    ├── guia-docente.md
    ├── reglas-del-juego.md
    └── evidencias.md
```

Las carpetas de ilustraciones y audio están reservadas para recursos locales futuros. La versión actual crea ilustraciones con CSS y sonidos con Web Audio API, por lo que no requiere archivos multimedia.

## Ejecutar localmente

Los módulos JavaScript necesitan un servidor HTTP sencillo; no se recomienda abrir `index.html` directamente con `file://`.

Con Python:

```bash
python -m http.server 8000
```

Después, abrir `http://localhost:8000/`.

Con Node.js, si se dispone de `npx`:

```bash
npx serve .
```

No se necesita instalar dependencias del proyecto.

Después de la primera carga desde `localhost` o GitHub Pages, un Service Worker conserva los archivos esenciales para permitir la apertura sin conexión. El registro no se ejecuta al usar `file://`.

## Publicar en GitHub Pages

1. Subir todos los archivos a la rama principal `main` del repositorio `SoyDeva/IBERO-Games`.
2. Abrir el repositorio en GitHub.
3. Entrar en **Settings**.
4. En el menú lateral, abrir **Pages**.
5. En **Build and deployment**, seleccionar **Deploy from a branch**.
6. En **Branch**, seleccionar `main` y la carpeta `/(root)`.
7. Pulsar **Save**.
8. Esperar a que GitHub muestre el despliegue como publicado.

URL esperada:

`https://soydeva.github.io/IBERO-Games/`

Todas las rutas son relativas y funcionan dentro del subdirectorio `IBERO-Games`.

## Cómo jugar

1. Elegir nueva expedición, modalidad y duración.
2. Escribir nombres o apodos, sin datos personales.
3. Completar el tutorial y revisar los roles.
4. Entrar a la zona disponible del mapa.
5. Leer problema, recursos y restricción.
6. Elaborar la primera solución y el boceto.
7. Adaptar la propuesta al giro inesperado.
8. Completar la rúbrica con conversación y evidencias.
9. Recuperar el núcleo y avanzar.
10. Imprimir o descargar el informe final.

## Reglas

- Usar la cantidad mínima de recursos indicada.
- Explicar la función de cada recurso elegido.
- Cumplir restricción y giro inesperado.
- Argumentar por qué la solución puede funcionar.
- Cuidar el planeta y sus formas de vida.
- Escuchar aportes antes de decidir.
- No convertir la rapidez o la energía en el único criterio de éxito.

Consulta [docs/reglas-del-juego.md](docs/reglas-del-juego.md) para la versión completa.

## Uso pedagógico

La persona docente facilita la lluvia de ideas, ayuda a distribuir la palabra y formula preguntas sin imponer una solución. La rúbrica se utiliza para reflexionar y revisar. Una valoración baja nunca bloquea la experiencia: permite volver al constructor para mejorar.

Consulta [docs/guia-docente.md](docs/guia-docente.md) o la sección “Guía docente” dentro del juego.

## Accesibilidad

- HTML semántico y etiquetas asociadas.
- Foco visible y navegación por teclado.
- Región `aria-live` para avisos relevantes.
- Mensajes de error descriptivos.
- Controles grandes y compatibles con pantalla táctil.
- Opciones de texto grande, alto contraste y movimiento reducido.
- Respeto de `prefers-reduced-motion` y colores forzados.
- El significado no depende solo del color.
- Sonido opcional y sin reproducción automática.

## Privacidad y seguridad

- No se envían formularios ni datos a internet.
- No existen autenticación, analítica, publicidad o rastreo.
- Los nombres, soluciones, dibujos y avances se guardan solo en `localStorage`.
- Los textos de usuario se escapan antes de incluirlos en resultados o informes.
- No se insertan textos de usuario sin procesamiento.
- Se puede borrar la partida desde el mapa, con confirmación previa.

## Pruebas realizadas

- [x] Validación sintáctica de todos los módulos JavaScript.
- [x] Comprobación de cantidades mínimas de datos pedagógicos.
- [x] Verificación automática de rutas y archivos locales.
- [x] Simulación programática de partidas individual, colaborativa y por equipos.
- [x] Simulación de cinco misiones y partida rápida, con rotación de roles y progresión.
- [x] Pruebas de cálculo de energía, promedios y finalización.
- [x] Pruebas de persistencia, ajustes y reinicio con almacenamiento local simulado.
- [x] Prueba de generación del informe y escape de textos introducidos.
- [x] Auditoría estática de etiquetas, controles, identificadores y dependencias externas.
- [x] Revisión de validación de campos, mínimo de recursos y tres ideas obligatorias.
- [x] Revisión del Canvas con eventos de puntero, deshacer, limpiar y descarga.
- [x] Revisión de navegación por teclado, foco visible y opciones de accesibilidad.
- [x] Revisión de reglas responsivas para móvil, tableta y escritorio.
- [x] Funcionamiento con rutas relativas para GitHub Pages.

La automatización visual del navegador integrado se interrumpió por una incidencia del entorno de pruebas. Se recomienda realizar una ronda visual final en los navegadores de los dispositivos que se usarán en el aula después de activar GitHub Pages.

## Documentos incluidos

- [`informe-actividad-1.html`](informe-actividad-1.html): documento académico editable e imprimible.
- [`docs/guia-docente.md`](docs/guia-docente.md): mediación pedagógica.
- [`docs/reglas-del-juego.md`](docs/reglas-del-juego.md): reglas y flujo detallado.
- [`docs/evidencias.md`](docs/evidencias.md): guía para reunir capturas y evidencias.

## Estado del proyecto

Versión funcional completa, preparada para GitHub Pages. No requiere proceso de compilación.

## Créditos

**Diseñado y desarrollado por Danilo Olarte González.**

Concepto, narrativa, contenido, interfaz, ilustraciones CSS y código creados para esta actividad académica. No se utilizan recursos protegidos de videojuegos, películas o franquicias.
