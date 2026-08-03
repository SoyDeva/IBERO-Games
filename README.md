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

Para aprender sin frustración hay un tutorial jugable de 30 segundos y un modo práctica donde los errores muestran la explicación, reparan la nave y permiten continuar.

## Características

- Escena Canvas con perspectiva 2.5D, profundidad y sensación de velocidad.
- Área de vuelo ampliada hasta 1540 px de ancho y 76 % de la altura visible.
- Botón de pantalla completa que conserva tablero, escena y controles; incluye modo inmersivo móvil, viewport dinámico, zonas seguras para notch y reajuste al cambiar de orientación.
- Tres carriles y controles con teclado, botones táctiles o toque directo sobre la escena.
- Obstáculos diferenciados: planetas, meteoritos, estrellas ardientes y naves rivales.
- Tres escudos para que el aprendizaje inicial sea amable.
- Indicadores permanentes de combustible, escudos, distancia y siguiente portal.
- Portales aproximadamente cada 15–20 segundos.
- 100 preguntas de opción múltiple, sin escritura, organizadas en cinco niveles.
- Tutorial interactivo paso a paso para movimiento, disparo y preguntas.
- Modo práctica sin fin de partida por choques, combustible o respuestas incorrectas.
- Cañón de plasma con 3 cargas, activado con la barra espaciadora o el botón táctil; el arsenal se recarga por completo al superar cada 5 niveles.
- Categorías: espacio, ciencias, naturaleza, geografía, matemáticas, lenguaje, historia, tecnología y convivencia.
- Explicación breve después de una respuesta incorrecta.
- Récord de distancia guardado únicamente en `localStorage`.
- Música espacial sintetizada y efectos con controles de volumen independientes.
- Dificultad adaptativa: progresa con las respuestas y rachas, pero ofrece ayuda temporal después de los choques.
- Cinco sectores galácticos con ambiente, colores y progresión visual propios.
- Economía infantil sin dinero real: 12 cristales por acierto y 3 por objeto destruido en misión.
- Mercado Nova cada 10 niveles con reparación, superplasma o estabilización del siguiente tramo.
- Bazar Orbital exterior con cuatro estilos permanentes de nave que cambian su apariencia en Canvas.
- Pausa disponible durante el vuelo y con la tecla `P`.
- Cinco logros locales, celebraciones con partículas y bitácora educativa al final de cada intento.
- Paso cercano corregido: los objetos que se esquivan cruzan el primer plano y se desvanecen fuera de cámara.
- Explosiones visibles en lugar de desapariciones bruscas al chocar.
- Alto contraste, texto grande y reducción de animaciones de interfaz.
- Diseño adaptable a computador, tableta y teléfono.
- Funcionamiento sin cuentas, publicidad, analítica ni servicios externos.
- Caché sin conexión mediante Service Worker.

## Cómo jugar

1. Pulsar **Despegar**.
2. Usar `←` y `→`, las teclas `A` y `D`, los botones grandes o tocar un lado de la escena.
3. Pulsar `ESPACIO` o **⚡ DISPARAR** para usar una de las tres cargas de plasma; todas regresan al superar los niveles 5, 10, 15 y siguientes.
4. Pulsar **⛶ Pantalla completa** para ampliar el juego cuando se desee.
5. Pulsar **⏸ Pausa** o la tecla `P` cuando se necesite un descanso.
6. Esquivar los objetos y entrar al portal brillante.
7. Elegir una de tres respuestas: acertar recarga combustible; fallar termina el intento normal.
8. Evitar tres choques y no dejar que el combustible llegue a cero.
9. Guardar cristales para personalizar la Asteria o comprar una ayuda en las estaciones de los niveles 10, 20, 30 y siguientes.

## Reglas pedagógicas

- Las preguntas están dirigidas a estudiantes de 10 a 12 años y avanzan de reconocimiento básico a razonamiento aplicado.
- Cada dos portales aumenta el nivel cognitivo de las preguntas, hasta el nivel cinco.
- Cada respuesta correcta aumenta gradualmente el reto; los choques y la pérdida de escudos activan asistencia adaptativa.
- Las oleadas bloquean como máximo dos carriles: siempre queda una ruta posible.
- Cada pregunta tiene tres opciones y una respuesta definida.
- El vuelo se detiene por completo mientras se responde.
- El récord es una motivación personal y no una calificación.
- Los cristales son recompensas locales de juego: no se compran con dinero real ni se obtienen en práctica o tutorial.
- En cada estación solo se elige una mejora, para mantener una decisión sencilla y evitar sobrecargar al estudiante.
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
- [x] Integridad de 100 preguntas únicas: 20 por cada nivel.
- [x] Progresión de preguntas 1–1, 2–2, 3–3, 4–4 y 5–5 por portal.
- [x] Simulación del primer portal y pausa del vuelo.
- [x] Respuesta correcta: recarga y reanudación.
- [x] Respuesta incorrecta: nave varada.
- [x] Tutorial completo: izquierda, derecha, disparo y pregunta con reintento amable.
- [x] Modo práctica: recuperación de escudos, combustible y respuesta incorrecta sin terminar.
- [x] Dificultad adaptativa: la asistencia reduce velocidad y frecuencia tras dificultades.
- [x] Transición entre cinco sectores y actualización del ambiente visual.
- [x] Pausa, reanudación y reinicio sin perder los controles táctiles.
- [x] Mezclador independiente de música y efectos, con persistencia local.
- [x] Logros, celebraciones y bitácora educativa final.
- [x] Recarga completa de plasma exactamente al superar los niveles 5, 10, 15 y siguientes.
- [x] Contador de próxima recarga, racha visible y alerta visual de combustible crítico.
- [x] Avisos de nuevo sector preservados sin ser reemplazados por mensajes simultáneos.
- [x] Economía persistente, recompensas exclusivas de misión y protección contra saldos inválidos.
- [x] Estación en niveles múltiplos de 10, una compra por visita y continuación segura del vuelo.
- [x] Compra, equipamiento y renderizado de cuatro estilos de nave.
- [x] Pérdida de escudos y combustible por colisión.
- [x] Aumento de velocidad, frecuencia y oleadas dobles por nivel.
- [x] Verificación de que ninguna oleada bloquea los tres carriles.
- [x] Explosión de impacto y desvanecimiento de objetos en primer plano.
- [x] Música dinámica y liberación de sus temporizadores.
- [x] Carga local de portada, estilos, motor y preguntas.
- [x] Rutas relativas compatibles con GitHub Pages.
- [x] Controles accesibles por teclado y pantalla táctil.
- [x] Pantalla completa nativa, salida mediante el mismo botón y modo alternativo.

## Autoría y privacidad

Concepto, interfaz, programación, figuras Canvas y contenido pedagógico originales. Los sonidos se sintetizan dentro del navegador. El proyecto no recopila datos personales; únicamente conserva de forma local el récord, los logros, el tutorial completado y las preferencias de accesibilidad y volumen.
