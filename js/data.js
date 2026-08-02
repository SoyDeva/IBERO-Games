export const ZONES = [
  { id: 'crystal', name: 'Desierto de Cristal', system: 'Comunicación', icon: '◇', color: '#f6c453', description: 'Dunas luminosas y cristales que transforman la luz.', prompt: 'Escucha el eco de cada idea antes de elegir.' },
  { id: 'forest', name: 'Bosque Bioluminiscente', system: 'Energía', icon: '✦', color: '#46e6a7', description: 'Plantas que brillan y criaturas que cooperan en silencio.', prompt: 'Combina recursos vivos sin alterar su equilibrio.' },
  { id: 'canyon', name: 'Cañón Magnético', system: 'Navegación', icon: '⊙', color: '#ff7bb0', description: 'Rocas flotantes cambian de dirección con cada impulso.', prompt: 'Cambia de perspectiva cuando el camino parezca cerrado.' },
  { id: 'islands', name: 'Archipiélago Flotante', system: 'Soporte vital', icon: '☁', color: '#79c8ff', description: 'Islas suspendidas entre corrientes de aire y agua.', prompt: 'Construye soluciones detalladas, ligeras y reutilizables.' },
  { id: 'core', name: 'Núcleo de Nébula', system: 'Propulsión', icon: '⬡', color: '#b99cff', description: 'El corazón del planeta responde a las ideas responsables.', prompt: 'Integra lo aprendido y ayuda a toda forma de vida.' }
];

export const PROBLEMS = [
  'La nave perdió contacto con su base.',
  'Un puente natural se derrumbó y separó a la tripulación.',
  'El agua encontrada contiene partículas desconocidas y no es segura.',
  'Una criatura quedó atrapada y no puede ser tocada.',
  'Una tormenta bloquea la energía solar de la nave.',
  'El robot explorador perdió una rueda.',
  'La gravedad cambió repentinamente.',
  'Un camino está cubierto por cristales extremadamente frágiles.',
  'El sistema de oxígeno tiene una fuga pequeña pero constante.',
  'Una pieza de la nave cayó en una formación elevada.',
  'Se necesita transportar energía sin utilizar cables.',
  'Una especie del planeta necesita cruzar un terreno peligroso.',
  'El mapa de navegación quedó incompleto.',
  'La tripulación necesita comunicarse sin emitir sonidos.',
  'La temperatura dentro de la nave está aumentando.',
  'Una lluvia luminosa desorienta los instrumentos.',
  'El campamento debe trasladarse sin dejar huellas.',
  'Una semilla bioluminiscente necesita llegar a una zona oscura.',
  'El viento arrastra las herramientas más livianas.',
  'La entrada de una cueva se abre solo con vibraciones suaves.',
  'Dos islas flotantes se están alejando lentamente.',
  'El recolector de agua dejó de funcionar.',
  'La antena solo puede orientarse desde un lugar inaccesible.',
  'Un campo magnético desordena los objetos metálicos.',
  'La nave debe mantenerse fresca durante una larga espera.',
  'Una nube espesa impide ver señales a distancia.',
  'Las provisiones deben cruzar un río sin mojarse.',
  'El módulo médico necesita luz constante sin electricidad.',
  'Las pisadas de la tripulación asustan a pequeñas criaturas.',
  'Una roca importante debe moverse sin dañar el suelo.',
  'El sistema de orientación confunde arriba y abajo.',
  'Un mensaje debe atravesar una zona de mucho ruido.',
  'La compuerta de carga quedó atascada.',
  'Se debe medir el tiempo sin relojes ni dispositivos digitales.',
  'Un refugio temporal debe resistir cambios bruscos de temperatura.',
  'La tripulación necesita señalar un camino visible de día y de noche.'
];

export const RESOURCES = [
  'Espejo', 'Cuerda', 'Botella', 'Rueda', 'Resorte', 'Tela', 'Imán', 'Caja',
  'Tubo', 'Papel', 'Cartón', 'Piedra', 'Rama', 'Arena', 'Panel solar',
  'Recipiente', 'Globo', 'Lupa', 'Polea', 'Pinza', 'Banda elástica',
  'Linterna', 'Lámina metálica', 'Fibras vegetales', 'Agua',
  'Ventilador manual', 'Paracaídas', 'Engranaje', 'Malla', 'Brújula',
  'Corcho', 'Arcilla', 'Concha vacía', 'Prisma', 'Vela de tela', 'Embudo',
  'Campana', 'Tiza mineral', 'Esponja', 'Palanca', 'Reloj de arena',
  'Semilla luminosa', 'Disco reflectante', 'Canaleta', 'Canasta', 'Clip',
  'Cinta de papel', 'Pajilla vegetal'
];

export const RESTRICTIONS = [
  'No se puede utilizar electricidad.',
  'Deben utilizarse todos los objetos disponibles.',
  'La solución no puede tocar el suelo.',
  'No se puede producir ruido.',
  'Debe protegerse a todos los seres vivos.',
  'Solo se dispone de cinco minutos para ponerla en marcha.',
  'No se puede utilizar pegamento.',
  'Una persona del equipo no puede hablar durante la explicación.',
  'La solución debe ser reutilizable.',
  'No se pueden desechar materiales.',
  'Debe funcionar únicamente con energía natural.',
  'Solo se pueden realizar tres movimientos para activarla.',
  'Debe poder transportarse fácilmente.',
  'Debe servir para dos propósitos diferentes.',
  'No puede pesar demasiado.',
  'Debe poder repararse sin herramientas adicionales.',
  'Ningún recurso puede cortarse.',
  'La solución debe funcionar tanto de día como de noche.',
  'Debe permitir que otra tripulación la use después.',
  'No puede bloquear caminos ni fuentes de agua.',
  'Debe montarse y desmontarse sin dejar marcas.',
  'Cada participante debe aportar una parte de la idea.',
  'Solo puede usarse un objeto metálico.',
  'La explicación final debe incluir un posible riesgo.'
];

export const TWISTS = [
  'Uno de los objetos seleccionados se rompió y debe reemplazarse por otra función.',
  'La gravedad se redujo a la mitad.',
  'Apareció una tormenta de polvo brillante.',
  'La solución debe ayudar también a una criatura cercana.',
  'Se perdió uno de los materiales disponibles.',
  'El tiempo disponible se redujo a la mitad.',
  'La temperatura descendió de repente.',
  'El camino inicial quedó bloqueado.',
  'La solución ahora debe ser portátil.',
  'Un participante debe explicar la solución sin hablar.',
  'La propuesta debe consumir menos recursos.',
  'Aparece una segunda tripulación que también necesita ayuda.',
  'La solución no puede dejar ningún residuo.',
  'El objeto principal duplicó su tamaño.',
  'La misión debe completarse de noche.',
  'Un viento intenso cambia de dirección cada minuto.',
  'El agua disponible comenzó a congelarse.',
  'Los objetos metálicos ahora se atraen entre sí.',
  'La solución debe poder desarmarse en tres partes.',
  'Una criatura curiosa acompaña al equipo sin poder ser tocada.',
  'La señal debe llegar al doble de distancia.',
  'La mitad del equipo debe cambiar de rol inmediatamente.',
  'La solución debe incorporar una señal de seguridad.',
  'Una zona del terreno se volvió demasiado frágil para pisarla.'
];

export const ROLES = [
  { name: 'Explorador', description: 'Lee el reto y dice: “Necesitamos resolver…”' },
  { name: 'Inventor', description: 'Pide una idea a cada persona y propone combinaciones.' },
  { name: 'Constructor', description: 'Ordena el plan: primero, después y al final.' },
  { name: 'Comunicador', description: 'Pregunta por qué funcionará y explica la idea del equipo.' }
];

export const BADGES = [
  { name: 'Generador de ideas', icon: '✺', dimension: 'fluidez' },
  { name: 'Pensador flexible', icon: '↝', dimension: 'adaptation' },
  { name: 'Inventor original', icon: '✦', dimension: 'originality' },
  { name: 'Constructor de soluciones', icon: '⚙', dimension: 'elaboration' },
  { name: 'Guardián de Nébula', icon: '♧', dimension: 'care' },
  { name: 'Comunicador estelar', icon: '◌', dimension: 'clarity' },
  { name: 'Equipo colaborativo', icon: '◎', dimension: 'collaboration' }
];

export const RUBRIC = [
  { id: 'originality', label: 'Originalidad', help: ['La solución es muy común o está incompleta.', 'Presenta una pequeña modificación.', 'Combina algunas ideas conocidas.', 'Presenta una combinación poco habitual.', 'Propone una solución novedosa, detallada y coherente.'] },
  { id: 'utility', label: 'Utilidad', help: ['Aún no responde al problema.', 'Responde solo a una parte.', 'Podría funcionar con algunos ajustes.', 'Responde bien y considera dificultades.', 'Es útil, viable y anticipa riesgos.'] },
  { id: 'resources', label: 'Uso creativo de recursos', help: ['Los recursos casi no tienen función.', 'Se usan de manera habitual.', 'Un recurso tiene un uso diferente.', 'Varios recursos se combinan creativamente.', 'Todos cumplen funciones ingeniosas y claras.'] },
  { id: 'clarity', label: 'Claridad de la explicación', help: ['Faltan datos importantes.', 'La idea se comprende con dificultad.', 'La explicación comunica lo principal.', 'Los pasos y razones son claros.', 'Cualquier equipo podría comprenderla y probarla.'] },
  { id: 'adaptation', label: 'Adaptación al giro', help: ['El giro no fue considerado.', 'Se menciona sin cambiar la idea.', 'Hay un cambio básico.', 'La solución se adapta de forma coherente.', 'El giro mejora la idea y abre otra posibilidad.'] },
  { id: 'care', label: 'Cuidado del planeta', help: ['Podría causar daño.', 'Reconoce el cuidado sin acciones concretas.', 'Evita un daño evidente.', 'Protege recursos y seres vivos.', 'Además de proteger, deja una mejora reutilizable.'] },
  { id: 'collaboration', label: 'Colaboración', help: ['Participó una sola voz.', 'Hubo pocos aportes compartidos.', 'Cada participante aportó algo.', 'Las ideas se combinaron y escucharon.', 'El equipo construyó, revisó y decidió en conjunto.'], groupOnly: true }
];

export const RECOMMENDATIONS = {
  originality: 'Prueben invertir una función o unir dos recursos que normalmente no se relacionan.',
  utility: 'Revisen paso a paso qué ocurriría al probar la solución y anticipen un riesgo.',
  resources: 'Den a cada recurso una función concreta y exploren al menos un uso inesperado.',
  clarity: 'Expliquen la idea como si otro equipo tuviera que construirla sin hacer preguntas.',
  adaptation: 'Comparen la idea antes y después del giro y hagan visible qué cambió y por qué.',
  care: 'Piensen qué queda en el planeta después de usar la solución y cómo reducir su impacto.',
  collaboration: 'Escuchen una propuesta de cada integrante antes de combinar y elegir.'
};

export const POWER_OPTIONS = [
  { id: 'join', icon: '🔗', label: 'Unir', phrase: 'unir las partes' },
  { id: 'protect', icon: '🛡️', label: 'Proteger', phrase: 'proteger lo importante' },
  { id: 'move', icon: '➡️', label: 'Mover', phrase: 'mover algo con cuidado' },
  { id: 'float', icon: '☁️', label: 'Flotar', phrase: 'mantener algo flotando' },
  { id: 'signal', icon: '✨', label: 'Señalar', phrase: 'enviar una señal visible' },
  { id: 'filter', icon: '💧', label: 'Filtrar', phrase: 'separar lo seguro de lo peligroso' },
  { id: 'hold', icon: '✋', label: 'Sostener', phrase: 'sostener una parte sin dañarla' },
  { id: 'transform', icon: '🔄', label: 'Transformar', phrase: 'cambiar una fuerza o material' },
  { id: 'guide', icon: '🧭', label: 'Guiar', phrase: 'mostrar una dirección segura' },
  { id: 'cool', icon: '❄️', label: 'Enfriar', phrase: 'reducir la temperatura' }
];

export const BLUEPRINTS = [
  { id: 'bridge', icon: '🌉', name: 'Puente transformable', description: 'Conecta dos lugares y puede cambiar de forma.' },
  { id: 'carrier', icon: '🛷', name: 'Transportador cuidadoso', description: 'Mueve objetos o seres vivos sin lastimarlos.' },
  { id: 'shield', icon: '🫧', name: 'Escudo protector', description: 'Cubre algo importante y deja pasar lo necesario.' },
  { id: 'signal', icon: '📡', name: 'Mensajero silencioso', description: 'Envía señales usando luz, movimiento o formas.' },
  { id: 'helper', icon: '🤖', name: 'Ayudante adaptable', description: 'Realiza una tarea y se ajusta cuando algo cambia.' },
  { id: 'station', icon: '🏕️', name: 'Estación reutilizable', description: 'Crea un lugar seguro que puede usarse varias veces.' },
  { id: 'collector', icon: '🌀', name: 'Recolector inteligente', description: 'Reúne agua, luz, aire o energía sin desperdiciar.' },
  { id: 'pathfinder', icon: '🔭', name: 'Explorador de caminos', description: 'Encuentra rutas, riesgos o señales que no se ven fácilmente.' }
];

export const REASON_OPTIONS = [
  { id: 'simple', icon: '👌', label: 'Es fácil de usar', phrase: 'es fácil de usar y explicar' },
  { id: 'strong', icon: '💪', label: 'Resiste el reto', phrase: 'puede resistir las condiciones de la misión' },
  { id: 'repair', icon: '🔧', label: 'Se puede reparar', phrase: 'puede repararse si una parte falla' },
  { id: 'portable', icon: '🎒', label: 'Se puede transportar', phrase: 'puede llevarse a otro lugar' },
  { id: 'rule', icon: '✅', label: 'Cumple la regla', phrase: 'cumple la regla especial de la misión' },
  { id: 'double', icon: '✌️', label: 'Sirve para dos cosas', phrase: 'cumple más de una función' },
  { id: 'test', icon: '🧪', label: 'Se puede probar', phrase: 'permite hacer una prueba segura antes de usarlo' },
  { id: 'team', icon: '🤝', label: 'El equipo puede construirlo', phrase: 'combina aportes de todo el equipo' }
];

export const CARE_OPTIONS = [
  { id: 'reuse', icon: '♻️', label: 'Reutiliza todo', phrase: 'reutiliza sus materiales y no deja residuos' },
  { id: 'life', icon: '🌱', label: 'Protege seres vivos', phrase: 'mantiene a salvo a los seres vivos' },
  { id: 'trace', icon: '👣', label: 'No deja huellas', phrase: 'puede retirarse sin dejar huellas' },
  { id: 'natural', icon: '☀️', label: 'Usa energía natural', phrase: 'funciona con energía natural' },
  { id: 'water', icon: '💦', label: 'Cuida el agua', phrase: 'evita contaminar o desperdiciar agua' },
  { id: 'share', icon: '🫶', label: 'Puede compartirse', phrase: 'puede ser usado por otras criaturas o tripulaciones' }
];

export const ADAPTATION_OPTIONS = [
  { id: 'replace', icon: '🔁', label: 'Cambiar una pieza', phrase: 'reemplazar una pieza por otra que pueda cumplir su función' },
  { id: 'resize', icon: '↔️', label: 'Cambiar el tamaño', phrase: 'cambiar el tamaño para adaptarse a la nueva condición' },
  { id: 'portable', icon: '🎒', label: 'Hacerlo portátil', phrase: 'dividirlo en partes fáciles de transportar' },
  { id: 'energy', icon: '🌬️', label: 'Cambiar la energía', phrase: 'usar una fuente de energía natural diferente' },
  { id: 'protect', icon: '🛡️', label: 'Añadir protección', phrase: 'agregar una capa de protección sin dañar el entorno' },
  { id: 'double', icon: '🧩', label: 'Dar doble uso', phrase: 'dar una segunda función a uno de sus objetos' }
];

export const EVIDENCE_OPTIONS = [
  { id: 'mixed', icon: '🧩', label: 'Combinamos objetos de una forma nueva' },
  { id: 'changed', icon: '🔄', label: 'Cambiamos la idea después de la sorpresa' },
  { id: 'explained', icon: '💬', label: 'Podemos explicar cómo funciona' },
  { id: 'tested', icon: '🧪', label: 'Pensamos cómo probarla' },
  { id: 'cared', icon: '🌱', label: 'Pensamos en el planeta y sus criaturas' },
  { id: 'listened', icon: '🤝', label: 'Usamos ideas de varias personas' }
];

export const NAME_PARTS = {
  first: ['Nebula', 'Astro', 'Eco', 'Lumi', 'Órbita', 'Cosmo', 'Nova', 'Cristal'],
  second: ['puente', 'escudo', 'móvil', 'guía', 'nido', 'rayo', 'explorador', 'guardián']
};

export const TUTORIAL_STEPS = [
  ['1. Entiende', 'Descubre qué problema debes resolver, qué objetos tienes y cuál es la regla especial.'],
  ['2. Imagina', 'Explora tres planos diferentes. Luego elige uno y mezcla sus objetos.'],
  ['3. Construye', 'Dale un superpoder a cada objeto y activa las mejores razones.'],
  ['4. Cambia', 'Aparecerá una sorpresa. Modifica una parte para que la idea vuelva a funcionar.'],
  ['5. Evalúa', 'Pulsa del 1 al 5 para conversar sobre la idea. No es una nota ni hay una respuesta perfecta.']
];
