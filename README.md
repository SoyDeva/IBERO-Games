# Misión Nébula: Pilota, responde y avanza

Juego pedagógico de pilotaje espacial 2.5D y conocimiento general para niñas y niños de 10 a 12 años.

**Diseñado y desarrollado por Danilo Olarte González.**

Proyecto de la Maestría en Educación de la Corporación Universitaria Iberoamericana, curso Electiva Creatividad e Innovación Educativa, Actividad 1 “Jugando enseño a crear”.

## La experiencia

La nave Asteria viaja automáticamente por una ruta galáctica. El jugador la mueve entre tres carriles para evitar planetas, meteoritos, estrellas ardientes y otras naves. Cada cierto tiempo aparece un portal de recarga que pausa el vuelo y presenta una pregunta de conocimiento general.

- Respuesta correcta: la nave recibe combustible y continúa.
- Respuesta incorrecta: la nave queda varada y termina el intento.
- Choque: se pierde un escudo y parte del combustible.
- Tres choques: la nave queda varada.
- Sin combustible: termina el intento.

El objetivo es viajar la mayor distancia posible y superar puestos de recarga.

## Características

- Escena Canvas con perspectiva 2.5D, profundidad y sensación de velocidad.
- Tres carriles y controles con teclado, botones táctiles o toque directo sobre la escena.
- Obstáculos diferenciados: planetas, meteoritos, estrellas ardientes y naves rivales.
- Tres escudos para que el aprendizaje inicial sea amable.
- Indicadores permanentes de combustible, escudos, distancia y siguiente portal.
- Portales aproximadamente cada 15–20 segundos.
- 24 preguntas de opción múltiple, sin escritura.
- Categorías: espacio, ciencias, naturaleza, geografía, matemáticas, lenguaje, historia, tecnología y convivencia.
- Explicación breve después de una respuesta incorrecta.
- Récord de distancia guardado únicamente en `localStorage`.
- Sonido opcional, alto contraste, texto grande y reducción de animaciones de interfaz.
- Diseño adaptable a computador, tableta y teléfono.
- Funcionamiento sin cuentas, publicidad, analítica ni servicios externos.
- Caché sin conexión mediante Service Worker.

## Cómo jugar

1. Pulsar **Despegar**.
2. Usar `←` y `→`, las teclas `A` y `D`, los botones grandes o tocar un lado de la escena.
3. Cambiar de carril para esquivar todos los objetos.
4. Entrar al portal brillante.
5. Elegir una de tres respuestas.
6. Acertar para recargar combustible y continuar.

## Reglas pedagógicas

- Las preguntas están dirigidas a estudiantes de 10 a 12 años.
- Cada pregunta tiene tres opciones y una respuesta definida.
- El vuelo se detiene por completo mientras se responde.
- El récord es una motivación personal y no una calificación.
- Después de un error se muestra el dato correcto antes de permitir un nuevo intento.
- Se recomienda realizar intentos de 5 a 10 minutos y conversar brevemente sobre las respuestas nuevas.

## Tecnologías

- HTML5 semántico
- CSS3 responsivo
- JavaScript ES6 con módulos nativos
- Canvas 2D
- Web Audio API
- `localStorage`
- Service Worker

No existe backend, proceso de compilación, dependencia externa ni clave de API.

## Estructura principal

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
│   ├── space-game.js
│   ├── questions.js
│   ├── accessibility.js
│   └── storage.js
└── assets/icons/favicon.svg
```

Los módulos anteriores de prototipos creativos permanecen temporalmente en el repositorio como historial técnico, pero no se cargan en la experiencia actual.

## Ejecutar localmente

Los módulos JavaScript necesitan un servidor HTTP:

```bash
python -m http.server 8000
```

Después, abrir `http://localhost:8000/`.

## Publicación

GitHub Pages publica la rama `main` desde la raíz del repositorio:

<https://soydeva.github.io/IBERO-Games/>

## Verificaciones

- [x] Sintaxis de todos los módulos JavaScript.
- [x] Integridad de 24 preguntas, opciones y respuestas.
- [x] Simulación del primer portal y pausa del vuelo.
- [x] Respuesta correcta: recarga y reanudación.
- [x] Respuesta incorrecta: nave varada.
- [x] Pérdida de escudos y combustible por colisión.
- [x] Carga local de portada, estilos, motor y preguntas.
- [x] Rutas relativas compatibles con GitHub Pages.
- [x] Controles accesibles por teclado y pantalla táctil.

## Autoría y privacidad

Concepto, interfaz, programación, figuras Canvas y contenido pedagógico originales. Los sonidos se sintetizan dentro del navegador. El proyecto no recopila datos personales; únicamente conserva el récord local de distancia.
