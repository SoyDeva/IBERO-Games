import { GENERATED_QUESTIONS } from './data/generated-question-bank.js';

function question(level, category, icon, text, options, answer, fact) {
  return { id: 'n' + level + '-' + text, level, category, icon, text, options, answer, fact };
}

const CURATED_QUESTIONS = [
  // Nivel 1 · reconocimiento y conocimientos básicos
  question(1, 'Espacio', '🪐', '¿Cuál es el planeta más grande del Sistema Solar?', ['Marte', 'Júpiter', 'Mercurio'], 1, 'Júpiter es el planeta más grande.'),
  question(1, 'Espacio', '🌙', '¿Cómo se llama el satélite natural de la Tierra?', ['La Luna', 'El Sol', 'Venus'], 0, 'La Luna es el satélite natural de la Tierra.'),
  question(1, 'Espacio', '🔴', '¿Qué planeta es conocido como el planeta rojo?', ['Saturno', 'Marte', 'Neptuno'], 1, 'Marte parece rojo por el hierro de su suelo.'),
  question(1, 'Ciencias', '🌱', '¿Qué necesitan las plantas para hacer la fotosíntesis?', ['Luz solar', 'Plástico', 'Arena seca'], 0, 'Las plantas usan luz solar, agua y dióxido de carbono.'),
  question(1, 'Ciencias', '🧊', '¿A qué temperatura se congela el agua?', ['0 °C', '50 °C', '100 °C'], 0, 'El agua pura se congela cerca de 0 °C.'),
  question(1, 'Ciencias', '❤️', '¿Qué órgano bombea la sangre por el cuerpo?', ['Pulmón', 'Estómago', 'Corazón'], 2, 'El corazón impulsa la sangre por el cuerpo.'),
  question(1, 'Ciencias', '🐋', '¿Cuál de estos animales es un mamífero?', ['Ballena', 'Tiburón', 'Pulpo'], 0, 'La ballena respira aire y alimenta a sus crías con leche.'),
  question(1, 'Ciencias', '💨', '¿Qué gas necesitamos para respirar?', ['Oxígeno', 'Helio', 'Hidrógeno'], 0, 'Nuestro cuerpo necesita oxígeno para vivir.'),
  question(1, 'Naturaleza', '🌊', '¿Cuál es el océano más grande?', ['Pacífico', 'Ártico', 'Índico'], 0, 'El océano Pacífico es el más grande del planeta.'),
  question(1, 'Naturaleza', '🐝', '¿Qué hacen las abejas al visitar las flores?', ['Las congelan', 'Ayudan a polinizarlas', 'Cambian su color'], 1, 'Las abejas transportan polen entre flores.'),
  question(1, 'Geografía', '🇨🇴', '¿Cuál es la capital de Colombia?', ['Cali', 'Bogotá', 'Cartagena'], 1, 'Bogotá es la capital de Colombia.'),
  question(1, 'Geografía', '🗺️', '¿En qué continente está Colombia?', ['América', 'Europa', 'Asia'], 0, 'Colombia está en América del Sur.'),
  question(1, 'Matemáticas', '✖️', '¿Cuánto es 9 × 7?', ['56', '63', '72'], 1, 'Nueve grupos de siete suman 63.'),
  question(1, 'Matemáticas', '➗', '¿Cuál es la mitad de 48?', ['24', '28', '18'], 0, '48 dividido entre 2 es 24.'),
  question(1, 'Lenguaje', '📚', '¿Cuál palabra significa casi lo mismo que “rápido”?', ['Veloz', 'Pesado', 'Lejano'], 0, '“Veloz” es un sinónimo de “rápido”.'),
  question(1, 'Lenguaje', '🔤', '¿Cuál palabra está escrita correctamente?', ['Árvol', 'Árbol', 'Harbol'], 1, '“Árbol” se escribe con b y lleva tilde.'),
  question(1, 'Naturaleza', '♻️', '¿Cuál acción ayuda más a reducir residuos?', ['Reutilizar objetos', 'Botarlos al río', 'Usarlos una vez'], 0, 'Reutilizar alarga la vida de los objetos y reduce basura.'),
  question(1, 'Geometría', '🔺', '¿Cuántos lados tiene un triángulo?', ['Tres', 'Cuatro', 'Cinco'], 0, 'Todo triángulo tiene tres lados.'),
  question(1, 'Arte', '🎨', '¿Cuáles son los colores primarios tradicionales?', ['Rojo, amarillo y azul', 'Verde, rosa y café', 'Negro, blanco y gris'], 0, 'En pintura tradicional son rojo, amarillo y azul.'),
  question(1, 'Tiempo', '🌍', 'Aproximadamente, ¿cuánto tarda la Tierra en dar una vuelta al Sol?', ['Un día', 'Un mes', 'Un año'], 2, 'La Tierra tarda aproximadamente 365 días.'),

  // Nivel 2 · aplicación directa
  question(2, 'Geografía', '🏔️', '¿Qué cordillera atraviesa Colombia?', ['Los Andes', 'Los Alpes', 'El Himalaya'], 0, 'La cordillera de los Andes atraviesa Colombia.'),
  question(2, 'Matemáticas', '🍕', '¿Cuánto es tres cuartos de 20?', ['10', '12', '15'], 2, 'Un cuarto de 20 es 5; tres cuartos son 15.'),
  question(2, 'Geometría', '📐', 'Un cuadrado tiene lados de 5 cm. ¿Cuál es su perímetro?', ['10 cm', '20 cm', '25 cm'], 1, 'El perímetro suma sus cuatro lados: 20 cm.'),
  question(2, 'Ciencias', '♨️', 'Al nivel del mar, ¿a qué temperatura hierve el agua?', ['50 °C', '100 °C', '150 °C'], 1, 'Al nivel del mar el agua hierve cerca de 100 °C.'),
  question(2, 'Naturaleza', '🐘', '¿Cuál es el animal terrestre más grande?', ['Elefante africano', 'Jirafa', 'Rinoceronte'], 0, 'El elefante africano es el animal terrestre más grande.'),
  question(2, 'Ciencias', '🐸', '¿A qué grupo pertenece una rana?', ['Anfibios', 'Mamíferos', 'Aves'], 0, 'Las ranas son anfibios.'),
  question(2, 'Ciencias', '☁️', '¿Cómo se llama el paso de vapor a líquido?', ['Evaporación', 'Condensación', 'Fusión'], 1, 'El paso de gas a líquido se llama condensación.'),
  question(2, 'Cuerpo humano', '🦴', '¿Cuántos huesos tiene normalmente un adulto?', ['106', '206', '306'], 1, 'El esqueleto adulto suele tener 206 huesos.'),
  question(2, 'Literatura', '📖', '¿Quién escribió Don Quijote de la Mancha?', ['Miguel de Cervantes', 'Julio Verne', 'Pablo Neruda'], 0, 'Miguel de Cervantes escribió Don Quijote de la Mancha.'),
  question(2, 'Lenguaje', '↔️', '¿Cuál es el antónimo de “generoso”?', ['Amable', 'Egoísta', 'Alegre'], 1, '“Egoísta” expresa una idea opuesta a “generoso”.'),
  question(2, 'Lenguaje', '🎵', '¿Qué tipo de palabra es “música” según su acento?', ['Aguda', 'Grave', 'Esdrújula'], 2, '“Música” es esdrújula porque se acentúa en la antepenúltima sílaba.'),
  question(2, 'Matemáticas', '➗', '¿Cuánto es 144 ÷ 12?', ['10', '12', '14'], 1, '144 dividido entre 12 es 12.'),
  question(2, 'Matemáticas', '🟰', '¿Qué fracción equivale a un medio?', ['2/3', '3/6', '4/5'], 1, '3/6 se simplifica a 1/2.'),
  question(2, 'Geometría', '▭', '¿Cuál es el área de un rectángulo de 8 por 4?', ['12', '24', '32'], 2, 'El área es base por altura: 8 × 4 = 32.'),
  question(2, 'Espacio', '💍', '¿Qué planeta es famoso por sus grandes anillos?', ['Saturno', 'Venus', 'Marte'], 0, 'Saturno posee un sistema de anillos muy visible.'),
  question(2, 'Espacio', '☀️', '¿Cuál es la estrella más cercana a la Tierra?', ['Sirio', 'El Sol', 'Polaris'], 1, 'El Sol es nuestra estrella más cercana.'),
  question(2, 'Geografía', '🇵🇪', '¿Cuál es la capital de Perú?', ['Quito', 'Lima', 'La Paz'], 1, 'Lima es la capital de Perú.'),
  question(2, 'Geografía', '🏞️', '¿Qué río atraviesa Egipto?', ['Nilo', 'Amazonas', 'Danubio'], 0, 'El río Nilo atraviesa Egipto.'),
  question(2, 'Historia', '🏛️', '¿Qué pueblo construyó Machu Picchu?', ['Inca', 'Romano', 'Vikingo'], 0, 'Machu Picchu fue construido por la civilización inca.'),
  question(2, 'Tecnología', '🔐', '¿Cuál contraseña es más segura?', ['12345', 'maria', 'Luna!48Bosque'], 2, 'Una contraseña larga y variada suele ser más segura.'),

  // Nivel 3 · relaciones y cálculo intermedio
  question(3, 'Espacio', '4️⃣', '¿Cuál es el cuarto planeta desde el Sol?', ['Tierra', 'Marte', 'Júpiter'], 1, 'Marte es el cuarto planeta desde el Sol.'),
  question(3, 'Espacio', '🌗', '¿Qué movimiento de la Tierra produce el día y la noche?', ['Rotación', 'Traslación', 'Precesión'], 0, 'La rotación hace que distintas zonas reciban luz solar.'),
  question(3, 'Ciencias', '🌿', '¿Qué gas absorben las plantas durante la fotosíntesis?', ['Oxígeno', 'Dióxido de carbono', 'Helio'], 1, 'Las plantas absorben dióxido de carbono.'),
  question(3, 'Cuerpo humano', '🫘', '¿Qué órganos filtran la sangre y producen orina?', ['Riñones', 'Pulmones', 'Oídos'], 0, 'Los riñones filtran desechos de la sangre.'),
  question(3, 'Naturaleza', '🌾', '¿Quiénes son productores en una cadena alimentaria?', ['Las plantas', 'Los depredadores', 'Los hongos'], 0, 'Las plantas producen su alimento mediante fotosíntesis.'),
  question(3, 'Ciencias', '💧', '¿Cómo se llama el paso de agua líquida a vapor?', ['Sublimación', 'Evaporación', 'Solidificación'], 1, 'El paso de líquido a gas se llama evaporación.'),
  question(3, 'Matemáticas', '🔢', '¿Cuál es el número primo más pequeño?', ['0', '1', '2'], 2, 'El 2 es el menor número con exactamente dos divisores.'),
  question(3, 'Matemáticas', '%', '¿Cuánto es el 15 % de 200?', ['15', '30', '45'], 1, 'El 10 % es 20 y el 5 % es 10; en total 30.'),
  question(3, 'Geometría', '📏', '¿Cuántos grados mide un ángulo llano?', ['90°', '180°', '360°'], 1, 'Un ángulo llano mide 180 grados.'),
  question(3, 'Matemáticas', '²', '¿Cuánto es 2 elevado a la quinta potencia?', ['10', '25', '32'], 2, '2 × 2 × 2 × 2 × 2 = 32.'),
  question(3, 'Matemáticas', '📊', '¿Cuál es el promedio de 6, 8 y 10?', ['8', '9', '24'], 0, 'La suma es 24 y 24 dividido entre 3 es 8.'),
  question(3, 'Lenguaje', '🔊', '¿Qué palabra contiene un hiato?', ['Ciudad', 'País', 'Tierra'], 1, 'En “país”, las vocales se separan en sílabas: pa-ís.'),
  question(3, 'Lenguaje', '📝', 'En “La nave cruza el portal”, ¿cuál es el sujeto?', ['La nave', 'Cruza', 'El portal'], 0, '“La nave” es quien realiza la acción.'),
  question(3, 'Literatura', '🦋', '¿Quién escribió Cien años de soledad?', ['Gabriel García Márquez', 'Jorge Luis Borges', 'Mario Vargas Llosa'], 0, 'Gabriel García Márquez escribió Cien años de soledad.'),
  question(3, 'Geografía', '🇦🇷', '¿Cuál es la capital de Argentina?', ['Santiago', 'Buenos Aires', 'Montevideo'], 1, 'Buenos Aires es la capital de Argentina.'),
  question(3, 'Geografía', '🇯🇵', '¿Cuál es la capital de Japón?', ['Pekín', 'Seúl', 'Tokio'], 2, 'Tokio es la capital de Japón.'),
  question(3, 'Geografía', '🏜️', '¿Cuál es el desierto cálido más grande?', ['Sahara', 'Gobi', 'Atacama'], 0, 'El Sahara es el desierto cálido más grande.'),
  question(3, 'Historia', '📅', '¿En qué siglo ocurrió el año 1810?', ['Siglo XVIII', 'Siglo XIX', 'Siglo XX'], 1, 'Los años de 1801 a 1900 pertenecen al siglo XIX.'),
  question(3, 'Ciudadanía', '⚖️', '¿Cuántas ramas tiene el poder público en Colombia?', ['Dos', 'Tres', 'Cinco'], 1, 'Son las ramas legislativa, ejecutiva y judicial.'),
  question(3, 'Tecnología', '⌨️', '¿Cuál de estos es un dispositivo de entrada?', ['Teclado', 'Monitor', 'Parlante'], 0, 'El teclado permite introducir datos al computador.'),

  // Nivel 4 · razonamiento y ciencias
  question(4, 'Matemáticas', '🚗', 'Si recorres 120 km en 2 horas, ¿cuál es la velocidad media?', ['40 km/h', '60 km/h', '240 km/h'], 1, 'Velocidad es distancia dividida entre tiempo: 60 km/h.'),
  question(4, 'Geometría', '🧊', '¿Cuál es el volumen de un cubo de lado 3?', ['9', '18', '27'], 2, 'El volumen es 3 × 3 × 3 = 27.'),
  question(4, 'Matemáticas', '⚖️', 'Una razón es 2:3 y el total es 25. ¿Cuál es la parte menor?', ['5', '10', '15'], 1, 'Hay 5 partes; cada una vale 5 y la parte menor vale 10.'),
  question(4, 'Probabilidad', '🎲', 'Al lanzar un dado, ¿cuál es la probabilidad de obtener un número par?', ['1/6', '1/2', '2/3'], 1, 'Tres de seis resultados son pares: 2, 4 y 6.'),
  question(4, 'Matemáticas', '🌡️', 'La temperatura sube de −3 °C a 5 °C. ¿Cuánto aumentó?', ['2 °C', '8 °C', '−8 °C'], 1, 'De −3 a 0 hay 3 grados y de 0 a 5 hay 5: aumentó 8.'),
  question(4, 'Energía', '☀️', '¿Cuál es una fuente de energía renovable?', ['Carbón', 'Petróleo', 'Solar'], 2, 'La energía solar se renueva naturalmente.'),
  question(4, 'Ambiente', '🛡️', '¿Qué radiación ayuda a bloquear la capa de ozono?', ['Ultravioleta', 'Sonora', 'Sísmica'], 0, 'La capa de ozono absorbe gran parte de la radiación ultravioleta.'),
  question(4, 'Biología', '🔋', '¿Qué orgánulo celular produce gran parte de la energía?', ['Mitocondria', 'Núcleo', 'Ribosoma'], 0, 'Las mitocondrias producen energía utilizable para la célula.'),
  question(4, 'Ciencias', '⛰️', 'En una montaña alta, el agua suele hervir…', ['A menor temperatura', 'A mayor temperatura', 'Exactamente igual'], 0, 'La menor presión atmosférica reduce la temperatura de ebullición.'),
  question(4, 'Química', '🥇', '¿Cuál es el símbolo químico del oro?', ['Ag', 'Au', 'O'], 1, 'El símbolo del oro es Au.'),
  question(4, 'Química', '🧪', 'Una sustancia con pH menor que 7 es…', ['Ácida', 'Neutra', 'Básica'], 0, 'Un pH inferior a 7 indica acidez.'),
  question(4, 'Geología', '🌋', '¿Qué movimiento puede producir terremotos?', ['Placas tectónicas', 'Nubes', 'Mareas de aire'], 0, 'El movimiento de placas libera energía en la corteza.'),
  question(4, 'Geografía', '🌐', '¿Qué línea divide la Tierra en hemisferio norte y sur?', ['Ecuador', 'Greenwich', 'Trópico de Cáncer'], 0, 'La línea del ecuador divide norte y sur.'),
  question(4, 'Geografía', '🧭', '¿Qué meridiano corresponde a 0° de longitud?', ['Greenwich', 'Ecuador', 'Capricornio'], 0, 'Greenwich es el meridiano de referencia de 0°.'),
  question(4, 'Geografía', '🌊', '¿A cuáles océanos tiene costa Colombia?', ['Atlántico y Pacífico', 'Índico y Pacífico', 'Ártico y Atlántico'], 0, 'Colombia tiene costas sobre el Caribe atlántico y el Pacífico.'),
  question(4, 'Lenguaje', '✨', '¿Cuál oración contiene una metáfora?', ['Tus ojos son estrellas', 'Tus ojos ven estrellas', 'Hay estrellas en el cielo'], 0, 'La metáfora identifica imaginariamente los ojos con estrellas.'),
  question(4, 'Lenguaje', '🏃', '¿Qué clase de palabra es “rápidamente”?', ['Sustantivo', 'Adverbio', 'Adjetivo'], 1, '“Rápidamente” modifica la manera en que ocurre una acción.'),
  question(4, 'Lenguaje', '💬', '¿Cuál oración está en pasado?', ['La nave despegará', 'La nave despega', 'La nave despegó'], 2, '“Despegó” expresa una acción ya ocurrida.'),
  question(4, 'Historia', 'Ⅹ', '¿Qué número representa XL en números romanos?', ['40', '60', '90'], 0, 'XL significa 50 menos 10: 40.'),
  question(4, 'Tiempo', '📆', '¿Cuántos días tiene un año bisiesto?', ['364', '365', '366'], 2, 'Un año bisiesto tiene 366 días.'),

  // Nivel 5 · desafío avanzado para 10–12 años
  question(5, 'Geometría', '📐', 'Un triángulo rectángulo tiene catetos 3 y 4. ¿Cuánto mide la hipotenusa?', ['5', '6', '7'], 0, 'Por el teorema de Pitágoras, 3² + 4² = 5².'),
  question(5, 'Geometría', '🔺', '¿Cuál es el área de un triángulo con base 10 y altura 6?', ['30', '60', '80'], 0, 'El área es base por altura dividida entre 2: 30.'),
  question(5, 'Matemáticas', '🏷️', 'Un objeto de 80 tiene 25 % de descuento. ¿Cuánto cuesta?', ['55', '60', '65'], 1, 'El 25 % de 80 es 20; 80 − 20 = 60.'),
  question(5, 'Ciencias', '⚗️', '¿Cómo se calcula la densidad?', ['Masa ÷ volumen', 'Volumen ÷ masa', 'Masa × tiempo'], 0, 'La densidad relaciona la masa con el volumen.'),
  question(5, 'Física', '🍎', '¿Qué fuerza atrae los objetos hacia la Tierra?', ['Magnetismo', 'Gravedad', 'Fricción'], 1, 'La gravedad atrae los cuerpos con masa.'),
  question(5, 'Espacio', '💡', 'Aproximadamente, ¿a qué velocidad viaja la luz?', ['300 km/s', '30 000 km/s', '300 000 km/s'], 2, 'La luz viaja cerca de 300 000 kilómetros por segundo en el vacío.'),
  question(5, 'Biología', '🧬', '¿Qué información contiene principalmente el ADN?', ['Información genética', 'Aire', 'Calor corporal'], 0, 'El ADN contiene instrucciones genéticas de los seres vivos.'),
  question(5, 'Biología', '🍃', '¿Qué pigmento verde capta luz en las plantas?', ['Hemoglobina', 'Clorofila', 'Melanina'], 1, 'La clorofila absorbe energía luminosa para la fotosíntesis.'),
  question(5, 'Ambiente', '🌡️', '¿Cuál de estos es un gas de efecto invernadero?', ['Dióxido de carbono', 'Oxígeno', 'Argón'], 0, 'El dióxido de carbono contribuye al efecto invernadero.'),
  question(5, 'Espacio', '🍂', '¿Cuál es la causa principal de las estaciones?', ['La inclinación del eje terrestre', 'La distancia diaria al Sol', 'Las fases de la Luna'], 0, 'La inclinación del eje cambia la luz recibida durante el año.'),
  question(5, 'Geografía', '🗺️', '¿Qué indican principalmente los meridianos?', ['Longitud', 'Altitud', 'Temperatura'], 0, 'Los meridianos permiten medir la longitud este u oeste.'),
  question(5, 'Geografía', '📏', 'En un mapa, 1 cm representa 5 km. ¿Cuánto representan 4 cm?', ['9 km', '20 km', '25 km'], 1, 'Cuatro veces 5 kilómetros son 20 kilómetros.'),
  question(5, 'Ciudadanía', '📜', '¿En qué año se promulgó la actual Constitución de Colombia?', ['1886', '1991', '2005'], 1, 'La Constitución Política vigente fue promulgada en 1991.'),
  question(5, 'Historia', '🇨🇴', '¿Qué fecha se conmemora como Independencia de Colombia?', ['20 de julio de 1810', '7 de agosto de 1819', '12 de octubre de 1492'], 0, 'El 20 de julio de 1810 se conmemora el inicio del proceso de independencia.'),
  question(5, 'Literatura', '🏅', '¿En qué área recibió el Nobel Gabriel García Márquez?', ['Literatura', 'Física', 'Paz'], 0, 'Gabriel García Márquez recibió el Nobel de Literatura en 1982.'),
  question(5, 'Lenguaje', '🌠', 'En “Ojalá llegue la nave”, ¿en qué modo está “llegue”?', ['Indicativo', 'Subjuntivo', 'Imperativo'], 1, '“Llegue” expresa un deseo y está en modo subjuntivo.'),
  question(5, 'Lenguaje', '🔤', '¿Qué tipo de palabra es “difícil” según su acento?', ['Aguda', 'Grave o llana', 'Esdrújula'], 1, '“Difícil” es llana y lleva tilde porque termina en consonante distinta de n o s.'),
  question(5, 'Razonamiento', '🔗', 'Libro es a leer como música es a…', ['Escuchar', 'Pintar', 'Medir'], 0, 'Los libros se leen y la música se escucha.'),
  question(5, 'Tecnología', '0️⃣', '¿Qué número decimal representa 101 en sistema binario?', ['4', '5', '6'], 1, '101 en binario equivale a 4 + 0 + 1 = 5.'),
  question(5, 'Tecnología', '🧩', '¿Qué es un algoritmo?', ['Una secuencia ordenada de pasos', 'Una pieza física del computador', 'Un tipo de pantalla'], 0, 'Un algoritmo organiza pasos para resolver una tarea o problema.')
];

export const QUESTIONS = Object.freeze([
  ...CURATED_QUESTIONS,
  ...GENERATED_QUESTIONS
]);

export function shuffledQuestions(level = null, random = Math.random) {
  const deck = QUESTIONS.filter((item) => level === null || item.level === level);
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [deck[index], deck[target]] = [deck[target], deck[index]];
  }
  return deck;
}

export function levelForPortal(portalNumber) {
  return Math.min(5, Math.max(1, Math.ceil(portalNumber / 2)));
}

export function shuffledQuestionOptions(item, random = Math.random) {
  const correctOption = item.options[item.answer];
  const options = [...item.options];
  for (let index = options.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [options[index], options[target]] = [options[target], options[index]];
  }
  return { ...item, options, answer: options.indexOf(correctOption) };
}
