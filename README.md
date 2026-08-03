# Misión Nébula: Pilota, responde y avanza

Juego pedagógico de pilotaje espacial 2.5D y conocimiento general para niñas y niños de 10 a 12 años.

**Diseñado y desarrollado por Danilo Olarte González.**

Proyecto de la Maestría en Educación de la Corporación Universitaria Iberoamericana, curso Electiva Creatividad e Innovación Educativa, Actividad 1 «Jugando enseño a crear».

## La experiencia

La nave Asteria avanza automáticamente por una ruta galáctica. El jugador la mueve entre tres carriles, esquiva obstáculos, utiliza cargas de plasma y atraviesa portales que presentan preguntas de conocimiento general.

- Una respuesta correcta recarga combustible y permite continuar.
- Una respuesta incorrecta termina la misión normal.
- Cada choque reduce escudos y combustible.
- El tutorial y el modo práctica permiten aprender sin penalizaciones severas.

El objetivo es recorrer la mayor distancia posible, superar portales y aparecer en la Liga Galáctica.

## Características principales

- Escena Canvas con perspectiva 2.5D, profundidad y sensación de velocidad.
- Tres carriles y controles por teclado, pantalla táctil o toque directo.
- 100 preguntas de opción múltiple organizadas en cinco niveles.
- Categorías de espacio, ciencias, naturaleza, geografía, matemáticas, lenguaje, historia, tecnología y convivencia.
- Tutorial interactivo y modo práctica.
- Dificultad adaptativa y cinco sectores galácticos.
- Cañón de plasma, estaciones de mejora y economía infantil sin dinero real.
- Hangar Estelar con seis fuselajes y cinco estelas.
- Música y efectos sintetizados en el navegador.
- Ajustes de accesibilidad, alto contraste, texto ampliado y reducción de movimiento.
- Diseño adaptable a computador, tableta y teléfono.
- Caché sin conexión mediante Service Worker.
- Liga Galáctica mundial respaldada por Supabase/PostgreSQL.

## Liga Galáctica

La clasificación mundial utiliza un apodo único y una contraseña obligatoria de 4 a 8 caracteres. La contraseña permite recuperar el apodo desde otro navegador o después de perder la sesión local.

El navegador solo utiliza la clave pública publicable de Supabase. Las tablas no aceptan acceso directo desde clientes; el registro, la consulta del top y el envío de resultados se realizan mediante funciones RPC controladas.

Cada versión publicada crea una temporada independiente. El cliente normaliza el identificador de versión al formato `v<versión>`, por ejemplo `v23`.

El servidor valida:

- sesión vigente;
- formato de temporada;
- coincidencia entre portales y respuestas correctas;
- distancia plausible para los portales alcanzados;
- cantidad plausible de objetos destruidos;
- fuselajes y estelas reconocidos;
- límites de frecuencia para registro, desbloqueo y envío de partidas.

Estas validaciones reducen resultados manipulados, aunque ningún juego ejecutado enteramente en el navegador puede ser completamente inmune a trampas.

## Cómo jugar

1. Registrar o desbloquear un apodo con contraseña.
2. Pulsar **Jugar misión**.
3. Usar `←`, `→`, `A`, `D`, los botones táctiles o tocar un lado de la escena.
4. Pulsar `ESPACIO` o **⚡ DISPARAR** para usar plasma.
5. Esquivar obstáculos y atravesar los portales.
6. Elegir una de tres respuestas.
7. Guardar cristales para personalizar la nave o comprar ayudas en estaciones.

## Reglas pedagógicas

- Las preguntas están dirigidas a estudiantes de 10 a 12 años.
- Cada dos portales aumenta el nivel cognitivo, hasta el nivel cinco.
- Cada pregunta tiene tres opciones y una respuesta definida.
- El vuelo se detiene mientras se responde.
- El récord es una motivación y no una calificación.
- Después de un error se muestra el dato correcto.
- Se recomiendan intentos de 5 a 10 minutos y una conversación breve sobre lo aprendido.

## Tecnologías

- HTML5 semántico
- CSS3 responsivo
- JavaScript ES6 con módulos nativos
- Canvas 2D
- Web Audio API
- `localStorage` para preferencias, sesión recordada y progreso cosmético
- Supabase/PostgreSQL para identidad de piloto y clasificación mundial
- Service Worker
- Node.js para pruebas y validación de sintaxis
- GitHub Actions para integración continua

No existe un servidor de aplicación tradicional ni un proceso de compilación del cliente. Supabase funciona como backend administrado y el repositorio incluye migraciones SQL reproducibles.

## Arquitectura modular

El código se está organizando gradualmente en capas de configuración, dominio puro, servicios externos y presentación. Las fachadas públicas existentes se conservan durante la migración para evitar cambios simultáneos en toda la aplicación.

La estrategia y la ruta de separación están documentadas en [`docs/architecture.md`](docs/architecture.md).

## Estructura principal

```text
IBERO-Games/
├── .github/workflows/quality.yml
├── docs/architecture.md
├── index.html
├── informe-actividad-1.html
├── package.json
├── README.md
├── sw.js
├── css/
│   ├── styles.css
│   ├── accessibility.css
│   └── print.css
├── js/
│   ├── config/
│   │   └── supabase.js
│   ├── core/
│   │   ├── galactic-errors.js
│   │   ├── galactic-score.js
│   │   └── galactic-season.js
│   ├── services/
│   │   ├── galactic-league-service.js
│   │   └── supabase-rpc.js
│   ├── app.js
│   ├── space-game.js
│   ├── questions.js
│   ├── accessibility.js
│   ├── galactic-league.js
│   └── storage.js
├── supabase/migrations/
├── tests/
└── assets/icons/favicon.svg
```

## Ejecutar localmente

Los módulos JavaScript necesitan un servidor HTTP:

```bash
python -m http.server 8000
```

Después, abrir `http://localhost:8000/`.

## Verificaciones automáticas

```bash
npm test
npm run check
```

`npm run check` ejecuta las pruebas del dominio y valida recursivamente la sintaxis de todos los módulos JavaScript. GitHub Actions ejecuta el mismo control en ramas y pull requests.

## Publicación

GitHub Pages publica la rama `main` desde la raíz del repositorio:

<https://soydeva.github.io/IBERO-Games/>

## Autoría y privacidad

El concepto, la interfaz, la programación, las figuras Canvas y el contenido pedagógico son originales. Los sonidos se sintetizan dentro del navegador. La Liga comparte únicamente el apodo elegido y el resultado del vuelo; no se debe utilizar el nombre real. Los récords locales, logros, preferencias y progreso cosmético permanecen en el navegador.
