const SCRAPPO = window.SCRAPPO || (window.SCRAPPO = {});
const apis = new Map();

export const registry = {
  set(name, api) {
    if (!name) {
      return api;
    }
    apis.set(name, api);
    return api;
  },
  get(name) {
    return apis.get(name);
  },
  has(name) {
    return apis.has(name);
  },
  remove(name) {
    return apis.delete(name);
  },
  list() {
    return Array.from(apis.keys());
  }
};

SCRAPPO.registry = registry;
