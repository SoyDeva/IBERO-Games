import { readFileSync, writeFileSync } from 'node:fs';

const file = 'js/space-game.js';
let source = readFileSync(file, 'utf8');

function replaceOnce(label, pattern, replacement) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`No se pudo aplicar: ${label}`);
  source = next;
}

replaceOnce(
  'importar reglas puras del vuelo',
  'const LANES = [-1, 0, 1];',
  "import { ammoMilestone, createFlightState, flightDifficulty, flightHud, flightSector, flightSectorIndex, flightSummary } from './core/flight-state.js?v=23';\n\nconst LANES = [-1, 0, 1];"
);

replaceOnce(
  'retirar sectores duplicados',
  /const SECTORS = \[[\s\S]*?\n\];\n\nfunction clamp/,
  'function clamp'
);

replaceOnce(
  'delegar estado inicial',
  /    this\.mode = 'idle';[\s\S]*?    this\.stationSlowdown = 0;/,
  `    this.width = 960;
    this.height = 600;
    Object.assign(this, createFlightState());`
);

replaceOnce(
  'delegar reinicio de sesión',
  /  start\(options = \{\}\) \{[\s\S]*?\n  \}\n\n  pause\(\) \{/,
  `  start(options = {}) {
    const practice = Boolean(options.practice);
    const tutorial = Boolean(options.tutorial);
    const shipSkin = SHIP_SKINS[options.skin] ? options.skin : 'nebula';
    const shipTrail = SHIP_TRAILS[options.trail] ? options.trail : 'pulse';
    Object.assign(this, createFlightState({ mode: 'running', practice, tutorial, shipSkin, shipTrail }));
    this.emitHud();
    if (tutorial) this.callbacks.onTutorialStep?.({ step: 'left' });
  }

  pause() {`
);

replaceOnce(
  'delegar recarga por hitos',
  /  rechargeAmmoAtMilestone\(\) \{[\s\S]*?\n  \}\n\n  applyStationPurchase/,
  `  rechargeAmmoAtMilestone() {
    const milestone = ammoMilestone(this.checkpoints, this.ammo);
    if (!milestone.recharged) return false;
    this.ammo = milestone.ammo;
    this.callbacks.onAmmoRecharge?.({ ammo: milestone.ammo, restored: milestone.restored, level: milestone.level });
    return true;
  }

  applyStationPurchase`
);

replaceOnce(
  'delegar resumen final',
  /  getSummary\(\) \{[\s\S]*?\n  \}\n\n  frame\(time\) \{/,
  `  getSummary() {
    return flightSummary(this);
  }

  frame(time) {`
);

replaceOnce(
  'delegar dificultad y sectores',
  /  getDifficulty\(\) \{[\s\S]*?\n  \}\n\n  getSectorIndex\(\) \{[\s\S]*?\n  \}\n\n  getSector\(\) \{[\s\S]*?\n  \}\n\n  updateProjectiles/,
  `  getDifficulty() {
    return flightDifficulty(this);
  }

  getSectorIndex() {
    return flightSectorIndex(this.checkpoints);
  }

  getSector() {
    return flightSector(this.checkpoints);
  }

  updateProjectiles`
);

replaceOnce(
  'delegar estado del HUD',
  /  emitHud\(\) \{[\s\S]*?\n  \}\n\n  createCelebration/,
  `  emitHud() {
    this.callbacks.onHud?.(flightHud(this));
  }

  createCelebration`
);

for (const forbidden of [
  'const SECTORS = [',
  "this.mode = 'idle';",
  'const introEase = this.checkpoints',
  'distance: Math.round(this.distance)',
  'levelsUntilAmmo: 5 - (this.checkpoints % 5)'
]) {
  if (source.includes(forbidden)) throw new Error(`Persistió lógica duplicada del estado de vuelo: ${forbidden}`);
}

writeFileSync(file, source);
console.log('space-game.js delega estado, dificultad, sectores, HUD, recarga y resumen.');
