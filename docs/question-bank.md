# Banco de preguntas de Misión Nébula

## Distribución

El juego contiene 1000 preguntas:

- Nivel 1: 200 preguntas de reconocimiento, operaciones básicas, vocabulario y ciencias.
- Nivel 2: 200 preguntas de aplicación directa, fracciones, geometría, lenguaje y cambios de estado.
- Nivel 3: 200 preguntas de cálculo intermedio, estadística, lenguaje y biología.
- Nivel 4: 200 preguntas de razonamiento aplicado, álgebra, probabilidad, ciencias y lenguaje figurado.
- Nivel 5: 200 preguntas de desafío avanzado, proporciones, estadística, geometría, ciencias y tecnología.

Las 100 preguntas originales se conservan como contenido curado. Otras 900 se construyen de forma determinista desde plantillas educativas y datos locales, sin solicitudes de red.

## Selección durante el juego

Cada nivel mantiene su propia baraja aleatoria. Una pregunta se retira de la baraja después de utilizarse y no vuelve a aparecer hasta que se agotan las 200 preguntas de ese nivel y se crea una baraja nueva.

El selector adaptativo puede priorizar categorías que requieren refuerzo, pero siempre selecciona dentro del nivel correspondiente.

## Reglas de integridad

Cada pregunta debe tener:

- un identificador único;
- un nivel entre 1 y 5;
- una categoría y un icono;
- tres opciones diferentes;
- una sola respuesta correcta;
- una explicación pedagógica breve.

Las pruebas automatizadas verifican el total, la distribución, la unicidad y la mezcla de las barajas.