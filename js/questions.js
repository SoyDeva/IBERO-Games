export const QUESTIONS = [
  { category: 'Espacio', icon: '🪐', text: '¿Cuál es el planeta más grande del Sistema Solar?', options: ['Marte', 'Júpiter', 'Mercurio'], answer: 1, fact: 'Júpiter es el planeta más grande.' },
  { category: 'Espacio', icon: '🌙', text: '¿Cómo se llama el satélite natural de la Tierra?', options: ['La Luna', 'El Sol', 'Venus'], answer: 0, fact: 'La Luna es el satélite natural de la Tierra.' },
  { category: 'Espacio', icon: '🔴', text: '¿Qué planeta es conocido como el planeta rojo?', options: ['Saturno', 'Marte', 'Neptuno'], answer: 1, fact: 'Marte parece rojo por el hierro de su suelo.' },
  { category: 'Ciencias', icon: '🌱', text: '¿Qué necesitan las plantas para hacer la fotosíntesis?', options: ['Luz solar', 'Plástico', 'Arena seca'], answer: 0, fact: 'Las plantas usan luz solar, agua y dióxido de carbono.' },
  { category: 'Ciencias', icon: '🧊', text: '¿A qué temperatura se congela el agua?', options: ['0 °C', '50 °C', '100 °C'], answer: 0, fact: 'El agua pura se congela cerca de 0 °C.' },
  { category: 'Ciencias', icon: '❤️', text: '¿Qué órgano bombea la sangre por el cuerpo?', options: ['Pulmón', 'Estómago', 'Corazón'], answer: 2, fact: 'El corazón impulsa la sangre por el cuerpo.' },
  { category: 'Ciencias', icon: '🐋', text: '¿Cuál de estos animales es un mamífero?', options: ['Ballena', 'Tiburón', 'Pulpo'], answer: 0, fact: 'La ballena respira aire y alimenta a sus crías con leche.' },
  { category: 'Ciencias', icon: '💨', text: '¿Qué gas necesitamos para respirar?', options: ['Oxígeno', 'Helio', 'Hidrógeno'], answer: 0, fact: 'Nuestro cuerpo necesita oxígeno para vivir.' },
  { category: 'Naturaleza', icon: '🌊', text: '¿Cuál es el océano más grande?', options: ['Pacífico', 'Ártico', 'Índico'], answer: 0, fact: 'El océano Pacífico es el más grande del planeta.' },
  { category: 'Naturaleza', icon: '🐝', text: '¿Qué hacen las abejas al visitar las flores?', options: ['Las congelan', 'Ayudan a polinizarlas', 'Cambian su color'], answer: 1, fact: 'Las abejas transportan polen entre flores.' },
  { category: 'Naturaleza', icon: '♻️', text: '¿Cuál acción ayuda más a reducir residuos?', options: ['Reutilizar objetos', 'Botarlos al río', 'Usarlos una vez'], answer: 0, fact: 'Reutilizar alarga la vida de los objetos y reduce basura.' },
  { category: 'Geografía', icon: '🇨🇴', text: '¿Cuál es la capital de Colombia?', options: ['Cali', 'Bogotá', 'Cartagena'], answer: 1, fact: 'Bogotá es la capital de Colombia.' },
  { category: 'Geografía', icon: '🗺️', text: '¿En qué continente está Colombia?', options: ['América', 'Europa', 'Asia'], answer: 0, fact: 'Colombia está en América del Sur.' },
  { category: 'Geografía', icon: '🏔️', text: '¿Cómo se llama la cadena montañosa que pasa por Colombia?', options: ['Andes', 'Alpes', 'Himalaya'], answer: 0, fact: 'La cordillera de los Andes atraviesa Colombia.' },
  { category: 'Matemáticas', icon: '✖️', text: '¿Cuánto es 9 × 7?', options: ['56', '63', '72'], answer: 1, fact: 'Nueve grupos de siete suman 63.' },
  { category: 'Matemáticas', icon: '➗', text: '¿Cuál es la mitad de 48?', options: ['24', '28', '18'], answer: 0, fact: '48 dividido entre 2 es 24.' },
  { category: 'Matemáticas', icon: '🍕', text: '¿Cuánto es tres cuartos de 20?', options: ['10', '12', '15'], answer: 2, fact: 'Un cuarto de 20 es 5; tres cuartos son 15.' },
  { category: 'Matemáticas', icon: '📐', text: 'Un cuadrado tiene lados de 5 cm. ¿Cuál es su perímetro?', options: ['10 cm', '20 cm', '25 cm'], answer: 1, fact: 'El perímetro suma sus cuatro lados: 5 + 5 + 5 + 5.' },
  { category: 'Lenguaje', icon: '📚', text: '¿Cuál palabra significa casi lo mismo que “rápido”?', options: ['Veloz', 'Pesado', 'Lejano'], answer: 0, fact: '“Veloz” es un sinónimo de “rápido”.' },
  { category: 'Lenguaje', icon: '🔤', text: '¿Cuál palabra está escrita correctamente?', options: ['Árvol', 'Árbol', 'Harbol'], answer: 1, fact: '“Árbol” se escribe con b y lleva tilde.' },
  { category: 'Lenguaje', icon: '❓', text: '¿Qué signos rodean una pregunta en español?', options: ['¿ ?', '¡ !', '( )'], answer: 0, fact: 'En español usamos signo de apertura y de cierre: ¿ ?' },
  { category: 'Historia', icon: '📜', text: '¿Qué pueblo construyó Machu Picchu?', options: ['Inca', 'Romano', 'Vikingo'], answer: 0, fact: 'Machu Picchu fue construido por la civilización inca.' },
  { category: 'Tecnología', icon: '🔐', text: '¿Cuál contraseña es más segura?', options: ['12345', 'maria', 'Luna!48Bosque'], answer: 2, fact: 'Una contraseña larga y variada suele ser más segura.' },
  { category: 'Convivencia', icon: '🤝', text: 'Si un compañero piensa diferente, ¿qué ayuda al equipo?', options: ['Escucharlo', 'Ignorarlo', 'Gritarle'], answer: 0, fact: 'Escuchar permite comparar ideas y tomar mejores decisiones.' }
];

export function shuffledQuestions(random = Math.random) {
  const deck = [...QUESTIONS];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [deck[index], deck[target]] = [deck[target], deck[index]];
  }
  return deck;
}
