const VALID_ROUTES = new Set(['quiz', 'study', 'progress', 'settings']);

export function getRoute() {
  const route = location.hash.replace('#', '') || 'quiz';
  return VALID_ROUTES.has(route) ? route : 'quiz';
}

export function startRouter(onRouteChange) {
  const notify = () => onRouteChange(getRoute());
  window.addEventListener('hashchange', notify);
  notify();
}
