# Hangar con ventajas de juego

## Objetivo

El Hangar combina una nave y un sistema de propulsión. Ambos aportan una ventaja de supervivencia visible y explicada antes de comprar o equipar.

No existen compras con dinero real. Ninguna ventaja responde preguntas, modifica respuestas correctas, multiplica la puntuación ni entrega posiciones automáticas en la Liga.

## Habilidades de nave

- **Nébula · Pulso estable:** obstáculos 2 % más lentos.
- **Solar · Sensores solares:** 5 % más de tiempo entre oleadas.
- **Aqua · Refrigeración polar:** 10 % menos consumo continuo de combustible.
- **Aurora · Reserva prismática:** una carga inicial de plasma adicional.
- **Guardiana · Blindaje esmeralda:** 45 % menos pérdida de combustible al chocar.
- **Eclipse · Camuflaje de vacío:** 10 % menos probabilidad de oleadas dobles.

## Sistemas de propulsión

Los cinco efectos visuales anteriores ahora incorporan una ventaja y se añaden tres sistemas nuevos:

- **Barrera Vectorial:** amortigua la pérdida de combustible por choque.
- **Navegador Nova:** separa oleadas y reduce formaciones dobles.
- **Núcleo Quásar:** aporta combustible y plasma al lanzamiento.

Solo un sistema puede estar activo. Al equipar otro, el anterior permanece comprado pero deja de aplicar su ventaja.

## Límites de equilibrio

`flight-loadout.js` normaliza y limita los efectos combinados. Los topes impiden acumulaciones extremas aunque el catálogo se amplíe en el futuro.

Las ventajas se aplican únicamente a:

- combustible inicial y consumo continuo;
- plasma inicial;
- pérdida de combustible por choque;
- velocidad o frecuencia de obstáculos;
- probabilidad de oleadas dobles.

No se cambian preguntas, recompensas, puntuación, controles, colisiones ni datos remotos.
