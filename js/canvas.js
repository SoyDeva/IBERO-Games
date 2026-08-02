/** Controla un lienzo accesible a eventos de puntero para mouse, lápiz y tacto. */
export class SketchCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.strokes = [];
    this.baseImage = null;
    this.currentStroke = null;
    this.width = 4;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement);
    this.bind();
    this.resize();
  }

  resize() {
    const saved = this.canvas.toDataURL();
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(300, this.canvas.parentElement.clientWidth);
    this.canvas.width = width * ratio;
    this.canvas.height = 320 * ratio;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = '320px';
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.redraw();
    if (!this.strokes.length && saved && saved.length > 100) this.load(saved);
  }

  bind() {
    this.canvas.addEventListener('pointerdown', (event) => this.start(event));
    this.canvas.addEventListener('pointermove', (event) => this.move(event));
    this.canvas.addEventListener('pointerup', () => this.end());
    this.canvas.addEventListener('pointercancel', () => this.end());
    this.canvas.addEventListener('pointerleave', () => this.end());
  }

  point(event) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  start(event) {
    event.preventDefault();
    this.canvas.setPointerCapture?.(event.pointerId);
    this.currentStroke = { width: this.width, points: [this.point(event)] };
    this.strokes.push(this.currentStroke);
  }

  move(event) {
    if (!this.currentStroke) return;
    event.preventDefault();
    this.currentStroke.points.push(this.point(event));
    this.redraw();
  }

  end() { this.currentStroke = null; }

  redraw() {
    this.context.save();
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.restore();
    if (this.baseImage) this.context.drawImage(this.baseImage, 0, 0, this.canvas.clientWidth, 320);
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';
    this.context.strokeStyle = '#261c5b';
    this.strokes.forEach((stroke) => {
      if (!stroke.points.length) return;
      this.context.beginPath();
      this.context.lineWidth = stroke.width;
      this.context.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.slice(1).forEach((point) => this.context.lineTo(point.x, point.y));
      if (stroke.points.length === 1) this.context.lineTo(stroke.points[0].x + 0.1, stroke.points[0].y + 0.1);
      this.context.stroke();
    });
  }

  undo() { this.strokes.pop(); this.redraw(); }
  clear() { this.strokes = []; this.baseImage = null; this.redraw(); }
  setWidth(width) { this.width = Number(width); }
  toDataURL() { return this.strokes.length ? this.canvas.toDataURL('image/png') : ''; }

  load(dataUrl) {
    if (!dataUrl) return;
    const image = new Image();
    image.onload = () => {
      this.baseImage = image;
      this.redraw();
    };
    image.src = dataUrl;
  }

  download(filename = 'boceto-nebula.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }

  destroy() { this.resizeObserver.disconnect(); }
}
