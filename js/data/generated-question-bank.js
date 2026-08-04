const generated = [];

function rotateOptions(correct, distractors, seed) {
  const correctText = String(correct);
  const candidates = [correctText, ...distractors.map(String)];
  const unique = [...new Set(candidates)];
  if (unique.length < 3) throw new Error('Cada pregunta necesita tres opciones distintas.');
  const options = unique.slice(0, 3);
  const shift = Math.abs(seed) % options.length;
  const rotated = [...options.slice(shift), ...options.slice(0, shift)];
  return { options: rotated, answer: rotated.indexOf(correctText) };
}

function addQuestion(level, family, index, category, icon, text, correct, distractors, fact) {
  const { options, answer } = rotateOptions(correct, distractors, level * 1000 + index * 17 + family.length);
  generated.push({
    id: `g${level}-${family}-${String(index + 1).padStart(2, '0')}`,
    level,
    category,
    icon,
    text,
    options,
    answer,
    fact
  });
}

function addChoice(level, family, index, category, icon, text, correct, distractors, fact) {
  addQuestion(level, family, index, category, icon, text, correct, distractors, fact);
}

function family(level, name, factory) {
  for (let index = 0; index < 20; index += 1) factory(index, name);
}

// Nivel 1 · reconocimiento, cálculo básico y vocabulario.
family(1, 'suma', (i, f) => {
  const a = 7 + i * 3;
  const b = 2 + (i * 5) % 18;
  const result = a + b;
  addQuestion(1, f, i, 'Matemáticas', '➕', `¿Cuánto es ${a} + ${b}?`, result, [result + 3, Math.max(0, result - 2)], `${a} más ${b} es ${result}.`);
});
family(1, 'resta', (i, f) => {
  const a = 35 + i * 4;
  const b = 3 + (i * 7) % 24;
  const result = a - b;
  addQuestion(1, f, i, 'Matemáticas', '➖', `¿Cuánto es ${a} − ${b}?`, result, [result + 4, Math.max(0, result - 3)], `${a} menos ${b} es ${result}.`);
});
family(1, 'multiplicacion', (i, f) => {
  const a = 2 + (i % 9);
  const b = 2 + Math.floor(i / 9) * 3 + (i % 3);
  const result = a * b;
  addQuestion(1, f, i, 'Matemáticas', '✖️', `¿Cuánto es ${a} × ${b}?`, result, [result + a, Math.max(1, result - b)], `${a} grupos de ${b} forman ${result}.`);
});
family(1, 'division', (i, f) => {
  const divisor = 2 + (i % 9);
  const quotient = 2 + Math.floor(i / 9) * 3 + (i % 3);
  const dividend = divisor * quotient;
  addQuestion(1, f, i, 'Matemáticas', '➗', `¿Cuánto es ${dividend} ÷ ${divisor}?`, quotient, [quotient + 2, Math.max(1, quotient - 1)], `${dividend} repartido en ${divisor} grupos da ${quotient}.`);
});
family(1, 'doble-mitad', (i, f) => {
  const value = 12 + i * 2;
  const asksDouble = i % 2 === 0;
  const result = asksDouble ? value * 2 : value / 2;
  const text = asksDouble ? `¿Cuál es el doble de ${value}?` : `¿Cuál es la mitad de ${value}?`;
  addQuestion(1, f, i, 'Matemáticas', '🔢', text, result, [result + 2, Math.max(1, result - 2)], asksDouble ? `El doble de ${value} es ${result}.` : `${value} dividido entre 2 es ${result}.`);
});
family(1, 'secuencia', (i, f) => {
  const start = 3 + i * 2;
  const step = 2 + (i % 5);
  const result = start + step * 3;
  addQuestion(1, f, i, 'Razonamiento', '🔁', `Completa la secuencia: ${start}, ${start + step}, ${start + step * 2}, …`, result, [result + step, result - 1], `La secuencia aumenta de ${step} en ${step}; sigue ${result}.`);
});
family(1, 'tiempo', (i, f) => {
  const hours = 1 + (i % 10);
  const extra = Math.floor(i / 10) * 30;
  const minutes = hours * 60 + extra;
  addQuestion(1, f, i, 'Tiempo', '⏰', `¿Cuántos minutos hay en ${hours} hora${hours === 1 ? '' : 's'}${extra ? ' y 30 minutos' : ''}?`, minutes, [minutes + 30, Math.max(30, minutes - 60)], `${hours} hora${hours === 1 ? '' : 's'} equivalen a ${hours * 60} minutos${extra ? `; al sumar 30 son ${minutes}` : ''}.`);
});

const level1Words = [
  ['luz', 'luces'], ['pez', 'peces'], ['árbol', 'árboles'], ['flor', 'flores'], ['avión', 'aviones'],
  ['reloj', 'relojes'], ['papel', 'papeles'], ['animal', 'animales'], ['canción', 'canciones'], ['pared', 'paredes'],
  ['nube', 'nubes'], ['estrella', 'estrellas'], ['planeta', 'planetas'], ['cohete', 'cohetes'], ['motor', 'motores'],
  ['jardín', 'jardines'], ['lápiz', 'lápices'], ['voz', 'voces'], ['capitán', 'capitanes'], ['portal', 'portales']
];
family(1, 'plural', (i, f) => {
  const [singular, plural] = level1Words[i];
  addChoice(1, f, i, 'Lenguaje', '🔤', `¿Cuál es el plural correcto de “${singular}”?`, plural, [singular, `${singular}x`], `El plural correcto de “${singular}” es “${plural}”.`);
});
const level1Animals = [
  ['ballena', 'Mamífero'], ['águila', 'Ave'], ['rana', 'Anfibio'], ['tiburón', 'Pez'], ['mariposa', 'Insecto'],
  ['delfín', 'Mamífero'], ['pingüino', 'Ave'], ['salamandra', 'Anfibio'], ['atún', 'Pez'], ['abeja', 'Insecto'],
  ['murciélago', 'Mamífero'], ['colibrí', 'Ave'], ['sapo', 'Anfibio'], ['salmón', 'Pez'], ['hormiga', 'Insecto'],
  ['elefante', 'Mamífero'], ['búho', 'Ave'], ['ajolote', 'Anfibio'], ['caballito de mar', 'Pez'], ['escarabajo', 'Insecto']
];
family(1, 'animales', (i, f) => {
  const [animal, group] = level1Animals[i];
  const alternatives = ['Mamífero', 'Ave', 'Anfibio', 'Pez', 'Insecto'].filter((item) => item !== group);
  addChoice(1, f, i, 'Ciencias', '🐾', `¿A qué grupo pertenece el ${animal}?`, group, [alternatives[i % alternatives.length], alternatives[(i + 2) % alternatives.length]], `El ${animal} pertenece al grupo de los ${group.toLowerCase()}s.`);
});

// Nivel 2 · aplicación directa.
family(2, 'suma-grande', (i, f) => {
  const a = 125 + i * 17;
  const b = 84 + (i * 23) % 190;
  const result = a + b;
  addQuestion(2, f, i, 'Matemáticas', '➕', `¿Cuánto es ${a} + ${b}?`, result, [result + 10, result - 9], `${a} + ${b} = ${result}.`);
});
family(2, 'resta-grande', (i, f) => {
  const a = 420 + i * 21;
  const b = 75 + (i * 19) % 210;
  const result = a - b;
  addQuestion(2, f, i, 'Matemáticas', '➖', `¿Cuánto es ${a} − ${b}?`, result, [result + 20, result - 11], `${a} − ${b} = ${result}.`);
});
family(2, 'producto', (i, f) => {
  const a = 12 + i;
  const b = 3 + (i % 7);
  const result = a * b;
  addQuestion(2, f, i, 'Matemáticas', '✖️', `¿Cuánto es ${a} × ${b}?`, result, [result + b, result - a], `${a} multiplicado por ${b} es ${result}.`);
});
family(2, 'division-exacta', (i, f) => {
  const divisor = 3 + (i % 8);
  const quotient = 12 + i;
  const dividend = divisor * quotient;
  addQuestion(2, f, i, 'Matemáticas', '➗', `¿Cuánto es ${dividend} ÷ ${divisor}?`, quotient, [quotient + 3, quotient - 2], `${dividend} ÷ ${divisor} = ${quotient}.`);
});
family(2, 'fraccion-cantidad', (i, f) => {
  const denominators = [2, 3, 4, 5];
  const denominator = denominators[i % denominators.length];
  const numerator = 1 + (i % (denominator - 1));
  const unit = 6 + Math.floor(i / 4) * 2;
  const total = denominator * unit;
  const result = numerator * unit;
  addQuestion(2, f, i, 'Fracciones', '🍕', `¿Cuánto es ${numerator}/${denominator} de ${total}?`, result, [result + unit, Math.max(1, result - unit)], `Una parte vale ${unit}; ${numerator} partes valen ${result}.`);
});
family(2, 'perimetro', (i, f) => {
  const width = 3 + (i % 8);
  const height = 5 + Math.floor(i / 4);
  const result = 2 * (width + height);
  addQuestion(2, f, i, 'Geometría', '📐', `Un rectángulo mide ${width} cm por ${height} cm. ¿Cuál es su perímetro?`, `${result} cm`, [`${width * height} cm`, `${width + height} cm`], `El perímetro es 2 × (${width} + ${height}) = ${result} cm.`);
});
family(2, 'area', (i, f) => {
  const width = 4 + (i % 7);
  const height = 3 + Math.floor(i / 5);
  const result = width * height;
  addQuestion(2, f, i, 'Geometría', '▭', `¿Cuál es el área de un rectángulo de ${width} cm por ${height} cm?`, `${result} cm²`, [`${result + width} cm²`, `${width + height} cm²`], `Área = base × altura: ${width} × ${height} = ${result} cm².`);
});
const level2Words = [
  ['correr', 'Verbo'], ['azul', 'Adjetivo'], ['nave', 'Sustantivo'], ['pensar', 'Verbo'], ['brillante', 'Adjetivo'],
  ['planeta', 'Sustantivo'], ['aprender', 'Verbo'], ['enorme', 'Adjetivo'], ['escuela', 'Sustantivo'], ['explorar', 'Verbo'],
  ['amable', 'Adjetivo'], ['motor', 'Sustantivo'], ['resolver', 'Verbo'], ['rápido', 'Adjetivo'], ['cristal', 'Sustantivo'],
  ['imaginar', 'Verbo'], ['curioso', 'Adjetivo'], ['galaxia', 'Sustantivo'], ['compartir', 'Verbo'], ['seguro', 'Adjetivo']
];
family(2, 'clase-palabra', (i, f) => {
  const [word, type] = level2Words[i];
  addChoice(2, f, i, 'Lenguaje', '📝', `¿Qué clase de palabra es “${word}”?`, type, ['Sustantivo', 'Verbo', 'Adjetivo'].filter((item) => item !== type), `“${word}” funciona como ${type.toLowerCase()}.`);
});
const level2Changes = [
  ['El hielo se convierte en agua.', 'Fusión'], ['El agua forma vapor al calentarse.', 'Evaporación'], ['El vapor forma gotas en una tapa fría.', 'Condensación'], ['El agua se convierte en hielo.', 'Solidificación'],
  ['Una paleta se derrite al sol.', 'Fusión'], ['La ropa mojada se seca.', 'Evaporación'], ['Se empaña un espejo después de una ducha.', 'Condensación'], ['Se congela jugo en un molde.', 'Solidificación'],
  ['La nieve se derrite.', 'Fusión'], ['Un charco desaparece con el calor.', 'Evaporación'], ['Se forman gotas por fuera de un vaso frío.', 'Condensación'], ['El agua de una cubeta se congela.', 'Solidificación'],
  ['La mantequilla se derrite en una sartén.', 'Fusión'], ['El agua de mar pasa al aire.', 'Evaporación'], ['El vapor de una olla se vuelve gotas.', 'Condensación'], ['La lava se enfría y se endurece.', 'Solidificación'],
  ['El chocolate sólido se derrite.', 'Fusión'], ['Un perfume líquido pasa poco a poco al aire.', 'Evaporación'], ['Las nubes forman gotas a partir de vapor.', 'Condensación'], ['La cera líquida se endurece al enfriarse.', 'Solidificación']
];
family(2, 'cambios-estado', (i, f) => {
  const [scenario, change] = level2Changes[i];
  addChoice(2, f, i, 'Ciencias', '💧', `${scenario} ¿Qué cambio de estado ocurre?`, change, ['Fusión', 'Evaporación', 'Condensación', 'Solidificación'].filter((item) => item !== change).slice(i % 2, i % 2 + 2), `El proceso descrito es ${change.toLowerCase()}.`);
});

// Nivel 3 · relaciones y cálculo intermedio.
family(3, 'porcentaje', (i, f) => {
  const rates = [10, 20, 25, 50];
  const rate = rates[i % rates.length];
  const baseUnit = 4 + Math.floor(i / 4) * 4;
  const total = rate === 25 ? baseUnit * 4 : rate === 20 ? baseUnit * 5 : rate === 10 ? baseUnit * 10 : baseUnit * 2;
  const result = total * rate / 100;
  addQuestion(3, f, i, 'Matemáticas', '%', `¿Cuánto es el ${rate} % de ${total}?`, result, [result + baseUnit, Math.max(1, result - baseUnit)], `${rate} % de ${total} es ${result}.`);
});
family(3, 'promedio', (i, f) => {
  const middle = 8 + i;
  const gap = 2 + (i % 4);
  const values = [middle - gap, middle, middle + gap];
  addQuestion(3, f, i, 'Estadística', '📊', `¿Cuál es el promedio de ${values.join(', ')}?`, middle, [middle + gap, middle - 1], `La suma es ${middle * 3}; al dividir entre 3 se obtiene ${middle}.`);
});
family(3, 'potencias', (i, f) => {
  const base = 2 + (i % 10);
  const exponent = 2 + Math.floor(i / 10);
  const result = base ** exponent;
  addQuestion(3, f, i, 'Matemáticas', '²', `¿Cuánto es ${base} elevado a ${exponent}?`, result, [Math.max(1, result - base), result + base], `${base} elevado a ${exponent} es ${result}.`);
});
family(3, 'decimales', (i, f) => {
  const a = (12 + i * 3) / 10;
  const b = (5 + (i * 7) % 20) / 10;
  const result = Number((a + b).toFixed(1));
  addQuestion(3, f, i, 'Matemáticas', '🔟', `¿Cuánto es ${a.toFixed(1)} + ${b.toFixed(1)}?`, result.toFixed(1), [(result + 1).toFixed(1), Math.max(0, result - .5).toFixed(1)], `Al sumar las décimas se obtiene ${result.toFixed(1)}.`);
});
family(3, 'fracciones-equivalentes', (i, f) => {
  const numerator = 1 + (i % 5);
  const denominator = numerator + 2 + (i % 4);
  const factor = 2 + Math.floor(i / 10);
  const correct = `${numerator * factor}/${denominator * factor}`;
  addChoice(3, f, i, 'Fracciones', '🟰', `¿Qué fracción es equivalente a ${numerator}/${denominator}?`, correct, [`${numerator + factor}/${denominator + factor}`, `${numerator}/${denominator * factor}`], `Multiplicar numerador y denominador por ${factor} produce ${correct}.`);
});
family(3, 'angulos', (i, f) => {
  const angle = 15 + i * 3;
  const result = 90 - angle;
  addQuestion(3, f, i, 'Geometría', '📐', `Un ángulo mide ${angle}°. ¿Cuánto mide su complemento?`, `${result}°`, [`${180 - angle}°`, `${angle + 10}°`], `Los ángulos complementarios suman 90°: 90 − ${angle} = ${result}.`);
});
family(3, 'velocidad', (i, f) => {
  const time = 2 + (i % 4);
  const speed = 30 + i * 3;
  const distance = time * speed;
  addQuestion(3, f, i, 'Matemáticas', '🚗', `Una nave recorre ${distance} km en ${time} horas. ¿Cuál es su velocidad media?`, `${speed} km/h`, [`${distance + time} km/h`, `${speed + time * 5} km/h`], `Velocidad = distancia ÷ tiempo: ${distance} ÷ ${time} = ${speed} km/h.`);
});
const level3Sentences = [
  ['La científica observa las estrellas.', 'La científica'], ['Los pilotos revisan el motor.', 'Los pilotos'], ['Mi hermano dibuja un planeta.', 'Mi hermano'], ['La lluvia limpia las calles.', 'La lluvia'],
  ['El telescopio muestra la Luna.', 'El telescopio'], ['Las abejas visitan las flores.', 'Las abejas'], ['Nuestro equipo resolvió el reto.', 'Nuestro equipo'], ['El río atraviesa el valle.', 'El río'],
  ['La maestra explica la misión.', 'La maestra'], ['Dos cometas cruzaron el cielo.', 'Dos cometas'], ['La computadora guarda los datos.', 'La computadora'], ['Los árboles producen oxígeno.', 'Los árboles'],
  ['Una estrella ilumina la noche.', 'Una estrella'], ['El viento mueve las nubes.', 'El viento'], ['Mis amigos construyen un robot.', 'Mis amigos'], ['La nave azul llegó al portal.', 'La nave azul'],
  ['El planeta gira lentamente.', 'El planeta'], ['Las estudiantes leen la bitácora.', 'Las estudiantes'], ['Un meteorito dejó un cráter.', 'Un meteorito'], ['La energía solar alimenta la estación.', 'La energía solar']
];
family(3, 'sujeto', (i, f) => {
  const [sentence, subject] = level3Sentences[i];
  const words = sentence.replace('.', '').split(' ');
  addChoice(3, f, i, 'Lenguaje', '📝', `En “${sentence}”, ¿cuál es el sujeto?`, subject, [words.slice(-2).join(' '), words[Math.floor(words.length / 2)]], `El sujeto es “${subject}” porque realiza o protagoniza la acción.`);
});
const level3Science = [
  ['corazón', 'Bombear sangre'], ['pulmones', 'Intercambiar oxígeno y dióxido de carbono'], ['riñones', 'Filtrar la sangre'], ['estómago', 'Iniciar parte de la digestión'],
  ['cerebro', 'Coordinar el sistema nervioso'], ['intestino delgado', 'Absorber gran parte de los nutrientes'], ['hígado', 'Procesar sustancias y producir bilis'], ['piel', 'Proteger el cuerpo'],
  ['raíces', 'Absorber agua y minerales'], ['hojas', 'Realizar gran parte de la fotosíntesis'], ['flores', 'Participar en la reproducción de muchas plantas'], ['tallo', 'Sostener y transportar sustancias'],
  ['productores', 'Fabricar su propio alimento'], ['consumidores', 'Obtener energía al alimentarse de otros seres'], ['descomponedores', 'Reciclar materia orgánica'], ['polinizadores', 'Transportar polen entre flores'],
  ['glóbulos rojos', 'Transportar oxígeno'], ['glóbulos blancos', 'Defender el organismo'], ['plaquetas', 'Ayudar a coagular la sangre'], ['neuronas', 'Transmitir señales nerviosas']
];
family(3, 'funciones-biologicas', (i, f) => {
  const [part, fn] = level3Science[i];
  const other1 = level3Science[(i + 5) % level3Science.length][1];
  const other2 = level3Science[(i + 11) % level3Science.length][1];
  addChoice(3, f, i, 'Ciencias', '🧬', `¿Cuál es una función principal de ${part}?`, fn, [other1, other2], `${part} se relaciona principalmente con: ${fn.toLowerCase()}.`);
});

// Nivel 4 · razonamiento aplicado.
family(4, 'operacion-mixta', (i, f) => {
  const a = 18 + i * 2;
  const b = 3 + (i % 6);
  const c = 4 + (i % 5);
  const result = a + b * c;
  addQuestion(4, f, i, 'Matemáticas', '🧮', `¿Cuánto es ${a} + ${b} × ${c}?`, result, [(a + b) * c, result - b], `Primero se multiplica ${b} × ${c}; luego se suma ${a}. El resultado es ${result}.`);
});
family(4, 'ecuacion', (i, f) => {
  const solution = 5 + i;
  const add = 3 + (i % 9);
  const total = solution + add;
  addQuestion(4, f, i, 'Álgebra', '❓', `Si x + ${add} = ${total}, ¿cuánto vale x?`, solution, [solution + add, solution - 2], `Se resta ${add} a ambos lados: x = ${solution}.`);
});
family(4, 'razon', (i, f) => {
  const left = 2 + (i % 4);
  const right = left + 1 + (i % 3);
  const unit = 4 + Math.floor(i / 4);
  const total = (left + right) * unit;
  const result = left * unit;
  addQuestion(4, f, i, 'Matemáticas', '⚖️', `Una cantidad se reparte en razón ${left}:${right} y el total es ${total}. ¿Cuánto recibe la parte menor?`, result, [right * unit, unit], `Hay ${left + right} partes; cada una vale ${unit}. La parte menor recibe ${result}.`);
});
family(4, 'probabilidad', (i, f) => {
  const favorable = 1 + (i % 5);
  const total = favorable + 2 + Math.floor(i / 5);
  const correct = `${favorable}/${total}`;
  addChoice(4, f, i, 'Probabilidad', '🎲', `En una bolsa hay ${total} fichas iguales y ${favorable} son azules. ¿Cuál es la probabilidad de sacar una azul?`, correct, [`0/${total}`, `${favorable + 1}/${total}`], `Hay ${favorable} resultados favorables entre ${total} posibles: ${correct}.`);
});
family(4, 'area-triangulo', (i, f) => {
  const base = 6 + i;
  const height = 4 + (i % 7) * 2;
  const result = base * height / 2;
  addQuestion(4, f, i, 'Geometría', '🔺', `¿Cuál es el área de un triángulo de base ${base} cm y altura ${height} cm?`, `${result} cm²`, [`${base * height} cm²`, `${base + height} cm²`], `Área = base × altura ÷ 2: ${base} × ${height} ÷ 2 = ${result} cm².`);
});
family(4, 'volumen', (i, f) => {
  const length = 3 + (i % 6);
  const width = 2 + Math.floor(i / 7);
  const height = 4 + (i % 5);
  const result = length * width * height;
  addQuestion(4, f, i, 'Geometría', '🧊', `Una caja mide ${length} × ${width} × ${height} cm. ¿Cuál es su volumen?`, `${result} cm³`, [`${length + width + height} cm³`, `${2 * (length * width + width * height + length * height)} cm³`], `Volumen = largo × ancho × alto = ${result} cm³.`);
});
family(4, 'temperatura', (i, f) => {
  const start = -12 + i;
  const change = 5 + (i % 9);
  const end = start + change;
  addQuestion(4, f, i, 'Ciencias', '🌡️', `La temperatura pasa de ${start} °C a ${end} °C. ¿Cuántos grados aumentó?`, `${change} °C`, [`${change + 3} °C`, `${change - 2} °C`], `El aumento es ${end} − (${start}) = ${change} °C.`);
});
const level4Figures = [
  ['Tus ojos son dos luceros.', 'Metáfora'], ['Corre como el viento.', 'Comparación'], ['La nave está en el hangar.', 'Lenguaje literal'], ['El tiempo es oro.', 'Metáfora'],
  ['Brilla como una estrella.', 'Comparación'], ['El libro tiene cien páginas.', 'Lenguaje literal'], ['La ciudad es un hormiguero.', 'Metáfora'], ['Fuerte como una roca.', 'Comparación'],
  ['El agua hierve a alta temperatura.', 'Lenguaje literal'], ['Sus palabras fueron música.', 'Metáfora'], ['Rápido como un relámpago.', 'Comparación'], ['El planeta tiene un satélite.', 'Lenguaje literal'],
  ['La luna es una lámpara nocturna.', 'Metáfora'], ['Dulce como la miel.', 'Comparación'], ['La clase comienza a las ocho.', 'Lenguaje literal'], ['El bosque es el pulmón del planeta.', 'Metáfora'],
  ['Frío como el hielo.', 'Comparación'], ['La Tierra gira alrededor del Sol.', 'Lenguaje literal'], ['Su sonrisa iluminó el salón.', 'Metáfora'], ['Ligero como una pluma.', 'Comparación']
];
family(4, 'lenguaje-figurado', (i, f) => {
  const [sentence, kind] = level4Figures[i];
  addChoice(4, f, i, 'Lenguaje', '✨', `¿Qué recurso aparece en “${sentence}”?`, kind, ['Metáfora', 'Comparación', 'Lenguaje literal'].filter((item) => item !== kind), `La expresión corresponde a ${kind.toLowerCase()}.`);
});
const level4Science = [
  ['La fuerza que se opone al deslizamiento entre superficies', 'Fricción'], ['La energía asociada al movimiento', 'Energía cinética'], ['La energía almacenada por la altura', 'Energía potencial'], ['El cambio de velocidad por unidad de tiempo', 'Aceleración'],
  ['La transferencia de calor por contacto directo', 'Conducción'], ['La transferencia de calor mediante el movimiento de fluidos', 'Convección'], ['La transferencia de energía mediante ondas electromagnéticas', 'Radiación'], ['La tendencia de un cuerpo a mantener su estado de movimiento', 'Inercia'],
  ['Una sustancia con pH menor que 7', 'Ácido'], ['Una sustancia con pH igual a 7', 'Neutra'], ['Una sustancia con pH mayor que 7', 'Base'], ['La unidad básica de un elemento químico', 'Átomo'],
  ['Una unión de dos o más átomos', 'Molécula'], ['Una mezcla en la que no se distinguen sus componentes', 'Homogénea'], ['Una mezcla en la que se distinguen componentes', 'Heterogénea'], ['El movimiento de placas que libera energía', 'Terremoto'],
  ['Roca fundida dentro de la Tierra', 'Magma'], ['Roca fundida que sale a la superficie', 'Lava'], ['Desgaste y transporte de suelo o roca', 'Erosión'], ['Proceso por el que sedimentos se depositan', 'Sedimentación']
];
family(4, 'conceptos-ciencia', (i, f) => {
  const [definition, concept] = level4Science[i];
  addChoice(4, f, i, 'Ciencias', '🔬', `¿Qué concepto corresponde a esta definición: “${definition}”?`, concept, [level4Science[(i + 4) % 20][1], level4Science[(i + 9) % 20][1]], `${definition}: ${concept}.`);
});

// Nivel 5 · desafío avanzado para 10–12 años.
family(5, 'ecuacion-dos-pasos', (i, f) => {
  const solution = 3 + i;
  const multiplier = 2 + (i % 5);
  const add = 4 + (i % 7);
  const total = solution * multiplier + add;
  addQuestion(5, f, i, 'Álgebra', '🧩', `Si ${multiplier}x + ${add} = ${total}, ¿cuánto vale x?`, solution, [solution + multiplier, solution - 1], `Se resta ${add} y se divide entre ${multiplier}; x = ${solution}.`);
});
family(5, 'proporcion', (i, f) => {
  const a = 2 + (i % 6);
  const b = 3 + Math.floor(i / 5);
  const factor = 2 + (i % 4);
  const c = a * factor;
  const result = b * factor;
  addQuestion(5, f, i, 'Matemáticas', '⚖️', `Si ${a}/${b} = ${c}/x, ¿cuánto vale x?`, result, [result + factor, result - b], `Como ${a} se multiplicó por ${factor}, ${b} también: x = ${result}.`);
});
family(5, 'descuento', (i, f) => {
  const rates = [10, 20, 25, 30];
  const rate = rates[i % rates.length];
  const unit = 10 + Math.floor(i / 4) * 10;
  const price = rate === 25 ? unit * 4 : rate === 20 ? unit * 5 : rate === 10 ? unit * 10 : unit * 10;
  const discount = price * rate / 100;
  const result = price - discount;
  addQuestion(5, f, i, 'Matemáticas', '🏷️', `Un objeto cuesta ${price} y tiene ${rate} % de descuento. ¿Cuál es el precio final?`, result, [discount, result + discount / 2], `El descuento es ${discount}; ${price} − ${discount} = ${result}.`);
});
family(5, 'mediana', (i, f) => {
  const middle = 10 + i;
  const values = [middle + 7, middle - 4, middle, middle + 2, middle - 1];
  addQuestion(5, f, i, 'Estadística', '📊', `¿Cuál es la mediana de ${values.join(', ')}?`, middle, [middle + 2, middle - 1], `Al ordenar los cinco valores, el central es ${middle}.`);
});
const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
family(5, 'pitagoras', (i, f) => {
  const [a0, b0, c0] = triples[i % triples.length];
  const factor = 1 + Math.floor(i / 4);
  const a = a0 * factor;
  const b = b0 * factor;
  const c = c0 * factor;
  addQuestion(5, f, i, 'Geometría', '📐', `Un triángulo rectángulo tiene catetos ${a} y ${b}. ¿Cuánto mide la hipotenusa?`, c, [c + factor, b], `${a}² + ${b}² = ${c}²; la hipotenusa mide ${c}.`);
});
family(5, 'binario', (i, f) => {
  const decimal = 5 + i;
  const binary = decimal.toString(2);
  addQuestion(5, f, i, 'Tecnología', '0️⃣', `¿Qué número decimal representa ${binary} en sistema binario?`, decimal, [decimal + 1, decimal - 2], `${binary} en binario equivale a ${decimal} en decimal.`);
});
family(5, 'patron', (i, f) => {
  const start = 2 + i;
  const multiplier = 2 + (i % 3);
  const values = [start, start * multiplier, start * multiplier ** 2];
  const result = start * multiplier ** 3;
  addQuestion(5, f, i, 'Razonamiento', '🔗', `Completa el patrón: ${values.join(', ')}, …`, result, [result + multiplier, values[2] + multiplier], `Cada término se multiplica por ${multiplier}; el siguiente es ${result}.`);
});
const level5Accent = [
  ['canción', 'Aguda'], ['árbol', 'Grave o llana'], ['música', 'Esdrújula'], ['reloj', 'Aguda'], ['fácil', 'Grave o llana'],
  ['teléfono', 'Esdrújula'], ['compás', 'Aguda'], ['lápiz', 'Grave o llana'], ['pájaro', 'Esdrújula'], ['motor', 'Aguda'],
  ['difícil', 'Grave o llana'], ['científico', 'Esdrújula'], ['pared', 'Aguda'], ['nube', 'Grave o llana'], ['matemática', 'Esdrújula'],
  ['capitán', 'Aguda'], ['joven', 'Grave o llana'], ['brújula', 'Esdrújula'], ['portal', 'Aguda'], ['planeta', 'Grave o llana']
];
family(5, 'acentuacion', (i, f) => {
  const [word, type] = level5Accent[i];
  addChoice(5, f, i, 'Lenguaje', '🔤', `¿Qué tipo de palabra es “${word}” según la sílaba tónica?`, type, ['Aguda', 'Grave o llana', 'Esdrújula'].filter((item) => item !== type), `“${word}” es una palabra ${type.toLowerCase()}.`);
});
const level5Concepts = [
  ['Unidad hereditaria que ocupa una región del ADN', 'Gen'], ['Orgánulo que contiene gran parte del ADN celular', 'Núcleo'], ['Proceso de división que produce dos células semejantes', 'Mitosis'], ['Proceso por el que las plantas transforman energía luminosa', 'Fotosíntesis'],
  ['Fuerza de atracción entre masas', 'Gravedad'], ['Rapidez de cambio de la velocidad', 'Aceleración'], ['Cantidad de materia de un cuerpo', 'Masa'], ['Masa dividida entre volumen', 'Densidad'],
  ['Estrella del Sistema Solar', 'Sol'], ['Galaxia donde está el Sistema Solar', 'Vía Láctea'], ['Movimiento de un planeta alrededor de una estrella', 'Traslación'], ['Giro de un cuerpo sobre su eje', 'Rotación'],
  ['Secuencia ordenada de pasos para resolver un problema', 'Algoritmo'], ['Conjunto de dispositivos físicos de un computador', 'Hardware'], ['Programas y aplicaciones de un sistema', 'Software'], ['Red mundial de redes conectadas', 'Internet'],
  ['Protocolo que protege una conexión web', 'HTTPS'], ['Dato secreto usado para acceder a una cuenta', 'Contraseña'], ['Copia adicional para recuperar información', 'Respaldo'], ['Programa dañino diseñado para afectar sistemas', 'Malware']
];
family(5, 'conceptos-avanzados', (i, f) => {
  const [definition, concept] = level5Concepts[i];
  addChoice(5, f, i, i < 12 ? 'Ciencias' : 'Tecnología', i < 12 ? '🧬' : '💻', `¿Qué concepto corresponde a “${definition}”?`, concept, [level5Concepts[(i + 6) % 20][1], level5Concepts[(i + 13) % 20][1]], `${definition}: ${concept}.`);
});

if (generated.length !== 900) {
  throw new Error(`El banco generado debe contener 900 preguntas y contiene ${generated.length}.`);
}

export const GENERATED_QUESTIONS = Object.freeze(generated.map((item) => Object.freeze({
  ...item,
  options: Object.freeze([...item.options])
})));
