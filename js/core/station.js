export const STATION_OFFERS = Object.freeze({
  repair: Object.freeze({
    icon: '🛡️',
    name: 'Reparación total',
    description: 'Restaura los escudos y suma 20% de combustible.',
    price: 20
  }),
  plasma: Object.freeze({
    icon: '⚡',
    name: 'Superplasma',
    description: 'Carga 5 disparos para el siguiente tramo.',
    price: 25
  }),
  stabilizer: Object.freeze({
    icon: '🧭',
    name: 'Estabilizador',
    description: 'Hace más lento y tranquilo el próximo tramo.',
    price: 30
  })
});

export function createStationSession(offers = STATION_OFFERS) {
  let purchasedId = null;

  function reset() {
    purchasedId = null;
  }

  function inspect(id, credits = 0) {
    const offer = offers[id];
    if (!offer) return { status: 'invalid', offer: null, missing: 0 };
    if (purchasedId) return { status: 'completed', offer, missing: 0 };

    const balance = Math.max(0, Number(credits) || 0);
    if (balance < offer.price) {
      return { status: 'insufficient', offer, missing: offer.price - balance };
    }
    return { status: 'available', offer, missing: 0 };
  }

  function confirm(id) {
    if (!offers[id] || purchasedId) return false;
    purchasedId = id;
    return true;
  }

  function hasPurchased() {
    return Boolean(purchasedId);
  }

  function getPurchasedId() {
    return purchasedId;
  }

  return Object.freeze({ reset, inspect, confirm, hasPurchased, getPurchasedId });
}
