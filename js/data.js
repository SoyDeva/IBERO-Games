export const ZONES = [
  { id: 'crystal', name: 'Desierto de Cristal', system: 'Comunicación', icon: '◇', color: '#f6c453', description: 'Dunas luminosas y cristales que transforman la luz.', prompt: 'Escucha el eco de cada idea antes de elegir.' },
  { id: 'forest', name: 'Bosque Bioluminiscente', system: 'Energía', icon: '✦', color: '#46e6a7', description: 'Plantas que brillan y criaturas que cooperan en silencio.', prompt: 'Combina recursos vivos sin alterar su equilibrio.' },
  { id: 'canyon', name: 'Cañón Magnético', system: 'Navegación', icon: '⊙', color: '#ff7bb0', description: 'Rocas flotantes cambian de dirección con cada impulso.', prompt: 'Cambia de perspectiva cuando el camino parezca cerrado.' },
  { id: 'islands', name: 'Archipiélago Flotante', system: 'Soporte vital', icon: '☁', color: '#79c8ff', description: 'Islas suspendidas entre corrientes de aire y agua.', prompt: 'Construye soluciones detalladas, ligeras y reutilizables.' },
  { id: 'core', name: 'Núcleo de Nébula', system: 'Propulsión', icon: '⬡', color: '#b99cff', description: 'El corazón del planeta responde a las ideas responsables.', prompt: 'Integra lo aprendido y ayuda a toda forma de vida.' }
];

export const PROBLEMS = [
  'Envía una señal a la nave.',
  'Ayuda a cruzar el río.',
  'Limpia el agua para beber.',
  'Libera a una criatura atrapada.',
  'Consigue energía para la nave.',
  'Ayuda al robot sin rueda.',
  'Crea un camino entre dos rocas.',
  'Tapa una fuga de aire.',
  'Alcanza una pieza que está muy alta.',
  'Guía al equipo por la niebla.',
  'Protege el campamento del calor.',
  'Lleva una semilla hasta la oscuridad.',
  'Evita que el viento se lleve las herramientas.',
  'Une dos islas flotantes.',
  'Recolecta agua para el viaje.',
  'Mueve una roca sin dañar el suelo.',
  'Abre una compuerta atascada.',
  'Marca un camino de día y de noche.'
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
  'La solución no puede tocar el suelo.',
  'Debe funcionar en silencio.',
  'Debe cuidar a todos los seres vivos.',
  'La solución debe ser reutilizable.',
  'Debe usar energía natural.',
  'Debe ser fácil de llevar.',
  'No puede dejar basura.'
];

export const TWISTS = [
  '¡Una pieza se rompió!',
  '¡Ahora todo flota!',
  '¡Llegó una tormenta brillante!',
  '¡Una criatura también necesita ayuda!',
  '¡El camino quedó bloqueado!',
  '¡Hace mucho frío!',
  '¡El invento debe poder llevarse!',
  '¡El viento sopla muy fuerte!',
  '¡Ahora es de noche!',
  '¡El suelo se volvió frágil!'
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

export const RESOURCE_ICONS = {
  'Espejo': '🪞', 'Cuerda': '🪢', 'Botella': '🧴', 'Rueda': '🛞', 'Resorte': '〰️', 'Tela': '🧣',
  'Imán': '🧲', 'Caja': '📦', 'Tubo': '🧪', 'Papel': '📄', 'Cartón': '🟫', 'Piedra': '🪨',
  'Rama': '🌿', 'Arena': '🏖️', 'Panel solar': '☀️', 'Recipiente': '🥣', 'Globo': '🎈', 'Lupa': '🔍',
  'Polea': '⚙️', 'Pinza': '🗜️', 'Banda elástica': '➰', 'Linterna': '🔦', 'Lámina metálica': '🥈',
  'Fibras vegetales': '🌾', 'Agua': '💧', 'Ventilador manual': '🪭', 'Paracaídas': '🪂',
  'Engranaje': '⚙️', 'Malla': '🥅', 'Brújula': '🧭', 'Corcho': '🟤', 'Arcilla': '🏺',
  'Concha vacía': '🐚', 'Prisma': '🔷', 'Vela de tela': '⛵', 'Embudo': '🔻', 'Campana': '🔔',
  'Tiza mineral': '🖍️', 'Esponja': '🧽', 'Palanca': '🦾', 'Reloj de arena': '⏳',
  'Semilla luminosa': '🌟', 'Disco reflectante': '💿', 'Canaleta': '〰️', 'Canasta': '🧺',
  'Clip': '📎', 'Cinta de papel': '🎗️', 'Pajilla vegetal': '🌱'
};

export const TUTORIAL_STEPS = [
  ['1. Mira', 'Descubre un reto corto.'],
  ['2. Mezcla', 'Toca dos objetos, un poder y un ecoescudo.'],
  ['3. Salva', 'Elige una reparación y celebra.']
];
