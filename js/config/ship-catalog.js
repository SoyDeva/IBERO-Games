export const SHIP_SKINS = Object.freeze({
  nebula: {
    name: 'Nébula', icon: '🚀', price: 0,
    body: '#e9efff', wing: '#8d73ff', glass: '#54def2', flame: '#5ee8ef', glow: '#5ee8ef',
    description: 'El uniforme clásico de la Asteria.',
    perk: { icon: '🧭', name: 'Pulso estable', description: 'Los obstáculos avanzan 2% más despacio.' },
    effect: { obstacleSpeedMultiplier: .98 }
  },
  solar: {
    name: 'Solar', icon: '☀️', price: 75,
    body: '#fff2bd', wing: '#ff8b45', glass: '#ffd95e', flame: '#ff6d7d', glow: '#f7cb62',
    description: 'Brilla como una pequeña estrella.',
    perk: { icon: '📡', name: 'Sensores solares', description: 'Las oleadas tardan 5% más en aparecer.' },
    effect: { spawnIntervalMultiplier: 1.05 }
  },
  aqua: {
    name: 'Aqua', icon: '🌊', price: 105,
    body: '#dffff7', wing: '#20bfa9', glass: '#79f4ff', flame: '#57e0a0', glow: '#5ee8ef',
    description: 'Tecnología del Cinturón Helado.',
    perk: { icon: '❄️', name: 'Refrigeración polar', description: 'Consume 10% menos combustible durante el vuelo.' },
    effect: { fuelDrainMultiplier: .9 }
  },
  aurora: {
    name: 'Aurora', icon: '🌈', price: 150,
    body: '#ffe8f5', wing: '#ff6fb2', glass: '#bda5ff', flame: '#f7cb62', glow: '#ff7bac',
    description: 'Una nave legendaria llena de color.',
    perk: { icon: '⚡', name: 'Reserva prismática', description: 'Comienza cada vuelo con una carga de plasma adicional.' },
    effect: { startingAmmoBonus: 1 }
  },
  guardian: {
    name: 'Guardiana', icon: '🛡️', price: 190,
    body: '#e4fff3', wing: '#34c77b', glass: '#f7cb62', flame: '#73ffd1', glow: '#57e0a0',
    description: 'La protectora esmeralda de los portales.',
    perk: { icon: '💚', name: 'Blindaje esmeralda', description: 'Los choques consumen 45% menos combustible.' },
    effect: { collisionFuelLossMultiplier: .55 }
  },
  eclipse: {
    name: 'Eclipse', icon: '🌑', price: 240,
    body: '#d9d2ff', wing: '#50378e', glass: '#ff7bac', flame: '#b181ff', glow: '#b181ff',
    description: 'Tecnología secreta nacida en el vacío.',
    perk: { icon: '👁️', name: 'Camuflaje de vacío', description: 'Reduce 10% la posibilidad de oleadas dobles.' },
    effect: { pairChanceModifier: -.1 }
  }
});

export const SHIP_TRAILS = Object.freeze({
  pulse: {
    name: 'Pulso Nébula', icon: '💫', price: 0,
    primary: '#5ee8ef', secondary: '#8d73ff',
    description: 'La estela clásica de energía azul.',
    perk: { icon: '🔧', name: 'Sincronía básica', description: 'Las oleadas dejan 2% más de tiempo para reaccionar.' },
    effect: { spawnIntervalMultiplier: 1.02 }
  },
  comet: {
    name: 'Cometa Dorado', icon: '☄️', price: 45,
    primary: '#fff2a8', secondary: '#ff8b45',
    description: 'Chispas doradas que cruzan el cosmos.',
    perk: { icon: '⛽', name: 'Reserva térmica', description: 'Comienza cada vuelo con 12% extra de combustible.' },
    effect: { startingFuelBonus: 12 }
  },
  ion: {
    name: 'Tormenta Iónica', icon: '⚡', price: 70,
    primary: '#d896ff', secondary: '#5ee8ef',
    description: 'Un rastro eléctrico violeta y turquesa.',
    perk: { icon: '💥', name: 'Condensador iónico', description: 'Comienza cada vuelo con una carga de plasma adicional.' },
    effect: { startingAmmoBonus: 1 }
  },
  nature: {
    name: 'Aurora Viva', icon: '🌿', price: 95,
    primary: '#73ffd1', secondary: '#f7cb62',
    description: 'Partículas verdes inspiradas en la vida.',
    perk: { icon: '♻️', name: 'Reciclaje vital', description: 'Reduce 8% el consumo continuo de combustible.' },
    effect: { fuelDrainMultiplier: .92 }
  },
  rainbow: {
    name: 'Prisma Estelar', icon: '🌈', price: 130,
    primary: '#ff7bac', secondary: '#f7cb62',
    description: 'Una estela especial que cambia de color.',
    perk: { icon: '🧭', name: 'Navegación prismática', description: 'Los obstáculos avanzan 4% más despacio.' },
    effect: { obstacleSpeedMultiplier: .96 }
  },
  vector: {
    name: 'Barrera Vectorial', icon: '🔷', price: 165,
    primary: '#84fff0', secondary: '#34c77b',
    description: 'Una estela defensiva con geometría de escudo.',
    perk: { icon: '🛡️', name: 'Amortiguador vectorial', description: 'Los choques consumen 30% menos combustible.' },
    effect: { collisionFuelLossMultiplier: .7 }
  },
  navigator: {
    name: 'Navegador Nova', icon: '🛰️', price: 185,
    primary: '#7bdcff', secondary: '#5267ff',
    description: 'Balizas azules que calculan rutas seguras.',
    perk: { icon: '📡', name: 'Predicción de oleadas', description: 'Aumenta 8% el intervalo y reduce 6% las oleadas dobles.' },
    effect: { spawnIntervalMultiplier: 1.08, pairChanceModifier: -.06 }
  },
  quasar: {
    name: 'Núcleo Quásar', icon: '🌟', price: 220,
    primary: '#fff4a8', secondary: '#d86cff',
    description: 'Propulsión experimental para misiones largas.',
    perk: { icon: '🚀', name: 'Sobrecarga de lanzamiento', description: 'Comienza con 8% extra de combustible y una carga adicional.' },
    effect: { startingFuelBonus: 8, startingAmmoBonus: 1 }
  }
});
