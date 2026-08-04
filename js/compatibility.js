/* Compatibilidad mínima para WebViews que aún no incluyen ResizeObserver. */
(() => {
  if (typeof globalThis.ResizeObserver === 'function') return;

  class ResizeObserverFallback {
    constructor(callback) {
      if (typeof callback !== 'function') throw new TypeError('ResizeObserver requiere un callback.');
      this.callback = callback;
      this.targets = new Set();
      this.scheduled = false;
      this.handleResize = () => this.schedule();
    }

    schedule() {
      if (this.scheduled || !this.targets.size) return;
      this.scheduled = true;
      globalThis.requestAnimationFrame?.(() => {
        this.scheduled = false;
        const entries = [...this.targets].map((target) => ({
          target,
          contentRect: target.getBoundingClientRect?.() || { width: 0, height: 0 }
        }));
        this.callback(entries, this);
      });
    }

    observe(target) {
      if (!target) return;
      const wasEmpty = this.targets.size === 0;
      this.targets.add(target);
      if (wasEmpty) globalThis.addEventListener?.('resize', this.handleResize, { passive: true });
      this.schedule();
    }

    unobserve(target) {
      this.targets.delete(target);
      if (!this.targets.size) globalThis.removeEventListener?.('resize', this.handleResize);
    }

    disconnect() {
      this.targets.clear();
      globalThis.removeEventListener?.('resize', this.handleResize);
    }
  }

  globalThis.ResizeObserver = ResizeObserverFallback;
})();
