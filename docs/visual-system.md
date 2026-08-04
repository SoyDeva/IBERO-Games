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

`css/hangar-polish.css` aplica el cuarto paquete visual al Hangar Estelar:

- cabecera de hangar con mayor profundidad, identidad espacial y saldo visible;
- tarjetas de nave con vista previa ampliada y jerarquía de nombre, descripción y acción;
- estados diferenciados para bloquear, desbloquear, equipar y mantener un diseño en uso;
- estelas de motor presentadas como colección compacta y comparable;
- etiquetas visuales `EQUIPADA` y `EN USO` derivadas del estado que ya entrega la interfaz;
- navegación final más clara para volar, consultar la Liga o volver;
- adaptación a escritorio, tableta, móvil y reducción de movimiento.

La capa no modifica precios, saldos, identificadores del catálogo ni eventos de compra o equipamiento. Los estados visuales proceden de clases y atributos ya generados por `hangar-screen.js`.

`css/ranking-polish.css` aplica el quinto paquete visual a la Liga Galáctica:

- cabecera de temporada con núcleo orbital y estado de conexión visible;
- podio con jerarquía diferenciada para oro, plata y bronce;
- identificación clara del piloto actual tanto en el podio como en la clasificación;
- filas comparables para distancia, portales y aciertos;
- estados específicos para conexión, tabla vacía y pérdida de señal;
- acción principal para mejorar la posición y accesos secundarios a actualización, Hangar e Inicio;
- adaptación a escritorio, tableta, móvil y reducción de movimiento.

La capa usa exclusivamente las clases, posiciones y textos que genera `ranking-screen.js`. No ordena resultados, no cambia puntuaciones y no realiza consultas a Supabase.

`js/ui/flight-renderer.js` incorpora el sexto paquete visual directamente al Canvas existente:

- dos capas de nebulosa, resplandor del horizonte y cuerpo celeste distante;
- estrellas y bandas laterales que refuerzan la sensación de velocidad;
- ruta con bordes energéticos y marcas de profundidad más visibles;
- portal con aura, núcleo, anillos contrarrotatorios y partículas orbitales;
- halos preventivos derivados de la profundidad ya calculada para cada obstáculo;
- planetas, meteoritos, estrellas y naves rivales con materiales y detalles más ricos;
- Asteria con fuselaje iluminado, cabina reflectante, motores visibles y estela multicapa;
- viñeta final para concentrar la atención en el carril y la nave.

Todos los movimientos visuales se derivan de `elapsed`, `depth`, `checkpoints` y del catálogo cosmético existente. El renderizador no cambia combustible, distancia, escudo, posiciones, colisiones, oleadas ni resultados; tampoco añade temporizadores, almacenamiento o solicitudes de red.

## Reglas

1. No cambiar selectores de navegación ni atributos `data-*` por una mejora visual.
2. Mantener botones táctiles con al menos 44 px de altura.
3. Reservar el brillo intenso para la acción principal, elementos activos y recompensas.
4. Evitar dependencias de fuentes, imágenes o scripts remotos.
5. Respetar `prefers-reduced-motion` y la hoja `accessibility.css` en la interfaz HTML.
6. Mantener los efectos de Canvas derivados del reloj y estado ya existentes, sin crear un segundo ciclo de animación.
7. Aplicar las mejoras por paquetes pequeños y verificables.
