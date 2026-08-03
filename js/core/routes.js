export const ROUTES = Object.freeze([
  'home',
  'flight',
  'shop',
  'ranking',
  'instructions',
  'teacher',
  'credits'
]);

const ROUTE_SET = new Set(ROUTES);

export function normalizeRoute(value) {
  return ROUTE_SET.has(value) ? value : 'home';
}

export function createRouteState(initialRoute = 'home') {
  let current = normalizeRoute(initialRoute);

  return Object.freeze({
    get() {
      return current;
    },
    set(nextRoute) {
      const previous = current;
      current = normalizeRoute(nextRoute);
      return Object.freeze({
        previous,
        current,
        changed: previous !== current
      });
    }
  });
}
