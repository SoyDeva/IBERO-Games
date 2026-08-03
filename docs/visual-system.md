# Sistema visual · Nébula brillante

## Objetivo

Dar a Misión Nébula una apariencia espacial más luminosa, coherente y profesional sin modificar reglas del juego, contenido pedagógico ni servicios remotos.

## Paleta base

- espacio profundo: `#0b071b`;
- noche nebular: `#15102e`;
- azul cósmico: `#5267ff`;
- cian estelar: `#56e7ff`;
- magenta aurora: `#d86cff`;
- oro solar: `#ffc857`;
- éxito: `#5ce5a2`;
- peligro amable: `#ff7285`.

La proporción recomendada es 70 % de fondos oscuros, 20 % de azul o cian y 10 % de acentos magenta, oro o estados.

## Tipografía

La interfaz usa una pila local y del sistema para no depender de descargas externas:

- títulos: `Trebuchet MS`, `Segoe UI`, sistema;
- texto e interfaz: `Nunito Sans`, `Segoe UI`, sistema.

`Nunito Sans` funciona como preferencia cuando está disponible; el diseño conserva legibilidad con las alternativas instaladas.

## Componentes

`css/nebula-bright.css` se carga después de las hojas funcionales y antes de accesibilidad. Actúa como una capa visual reversible que redefine:

- colores y superficies;
- encabezado y marca;
- botones y estados de foco;
- paneles translúcidos;
- composición de Inicio;
- planeta, órbitas y nave decorativa;
- adaptación para móvil;
- reducción de movimiento.

`css/flight-polish.css` aplica el segundo paquete visual exclusivamente al vuelo y las preguntas:

- HUD compacto con color funcional por métrica;
- combustible con lectura numérica y barra luminosa;
- escenario, insignia de sector y controles con mayor profundidad;
- pregunta central con jerarquía y opciones táctiles amplias;
- estados visibles `correct` y `wrong`, además del texto pedagógico existente;
- adaptación a una columna en móvil;
- animaciones desactivadas mediante `prefers-reduced-motion`.

Esta capa usa selectores y estados que ya genera la aplicación. No añade temporizadores, reglas, eventos ni solicitudes remotas.

`css/mission-results.css` aplica el tercer paquete visual a la bitácora final:

- cierre de misión con composición central y profundidad espacial;
- métricas diferenciadas para distancia, respuestas, racha, destruidos y portales;
- protagonismo visual para récord y cristales ganados;
- estados de sincronización, posición y error de la Liga;
- bloques destacados para aprendizaje y logros desbloqueados;
- jerarquía clara para volver a intentar, consultar la Liga, visitar el Hangar o practicar;
- distribución adaptable a tableta y móvil;
- animaciones compatibles con `prefers-reduced-motion`.

La bitácora conserva exactamente los valores, textos, identificadores y eventos que entrega `game-over-screen.js`. La hoja no calcula resultados ni altera recompensas.

## Reglas

1. No cambiar selectores de navegación ni atributos `data-*` por una mejora visual.
2. Mantener botones táctiles con al menos 44 px de altura.
3. Reservar el brillo intenso para la acción principal, elementos activos y recompensas.
4. Evitar dependencias de fuentes, imágenes o scripts remotos.
5. Respetar `prefers-reduced-motion` y la hoja `accessibility.css`.
6. Aplicar las siguientes mejoras por paquetes pequeños: Inicio, HUD y preguntas, cierre de misión, Hangar y Liga.
