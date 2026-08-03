export function bindNavigation(root, options = {}) {
  if (!root?.querySelectorAll || typeof options.navigate !== 'function') return 0;

  const buttons = [...root.querySelectorAll('[data-nav]')];
  buttons.forEach((button) => {
    button.addEventListener('click', (event) => {
      if (options.preventDefault) event.preventDefault();

      const target = button.dataset?.nav;
      const navigate = () => {
        if (button.dataset?.mode) options.setMode?.(button.dataset.mode);
        options.navigate(target);
      };

      if (options.guardFlight && target === 'flight') {
        options.requireFlightAccess?.(navigate);
      } else {
        navigate();
      }
    });
  });

  return buttons.length;
}
