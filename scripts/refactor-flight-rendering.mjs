import { readFileSync, writeFileSync } from 'node:fs';

const rendererPath = 'js/ui/flight-renderer.js';
let source = readFileSync(rendererPath, 'utf8');

function replaceOnce(label, pattern, replacement) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`No se pudo aplicar: ${label}`);
  source = next;
}

replaceOnce(
  'importar proyección compartida',
  "import { clamp, easeIn } from '../core/flight-geometry.js?v=23';",
  "import { clamp, easeIn, projectFlightPoint } from '../core/flight-geometry.js?v=23';"
);

replaceOnce(
  'delegar proyección de perspectiva',
  /project\(lane, depth\) \{\n    const horizon = this\.height \* \.235;\n    const progress = easeIn\(depth\);\n    return \{\n      x: this\.width \/ 2 \+ lane \* \(this\.width \* \(\.035 \+ progress \* \.255\)\),\n      y: horizon \+ progress \* \(this\.height \* \.69\),\n      scale: \.1 \+ progress \* 1\.22\n    \};\n  \}/,
  `project(lane, depth) {
    return projectFlightPoint({
      width: this.width,
      height: this.height,
      lane,
      depth
    });
  }`
);

if (!source.includes('projectFlightPoint({') || source.includes('const horizon = this.height * .235;')) {
  throw new Error('La proyección no quedó centralizada.');
}

writeFileSync(rendererPath, source);
console.log('El renderizador usa la proyección compartida de Canvas.');
