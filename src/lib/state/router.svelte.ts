/**
 * Where in the application the user is. Kept in the URL fragment so that
 * back and forward work, and so that a place can be opened directly.
 */

export type MapMode = 'diagram' | 'text';

export type Route =
  | { view: 'projects' }
  | { view: 'library'; collection?: string; entry?: string }
  | { view: 'project'; project: string; map?: string; mode?: MapMode }
  | { view: 'settings'; section?: string };

export function parseRoute(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const params = new URLSearchParams(query);
  switch (parts[0]) {
    case 'library':
      return {
        view: 'library',
        collection: params.get('collection') ?? undefined,
        entry: params.get('entry') ?? undefined,
      };
    case 'project':
      if (!parts[1]) return { view: 'projects' };
      return {
        view: 'project',
        project: parts[1],
        map: parts[2],
        mode:
          params.get('mode') === 'text'
            ? 'text'
            : params.get('mode') === 'diagram'
              ? 'diagram'
              : undefined,
      };
    case 'settings':
      return { view: 'settings', section: parts[1] };
    default:
      return { view: 'projects' };
  }
}

export function formatRoute(route: Route): string {
  const e = encodeURIComponent;
  switch (route.view) {
    case 'projects':
      return '#/';
    case 'library': {
      const params = new URLSearchParams();
      if (route.collection) params.set('collection', route.collection);
      if (route.entry) params.set('entry', route.entry);
      const q = params.toString();
      return '#/library' + (q ? `?${q}` : '');
    }
    case 'project': {
      let s = `#/project/${e(route.project)}`;
      if (route.map) s += `/${e(route.map)}`;
      if (route.mode) s += `?mode=${route.mode}`;
      return s;
    }
    case 'settings':
      return '#/settings' + (route.section ? `/${e(route.section)}` : '');
  }
}

class Router {
  route = $state<Route>(parseRoute(typeof location === 'undefined' ? '' : location.hash));

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', () => {
        this.route = parseRoute(location.hash);
      });
    }
  }

  go(route: Route) {
    const hash = formatRoute(route);
    if (location.hash === hash) return;
    location.hash = hash;
  }

  /** Changes the place without adding a step to the history. */
  replace(route: Route) {
    const hash = formatRoute(route);
    if (location.hash === hash) return;
    history.replaceState(null, '', hash);
    this.route = route;
  }
}

export const router = new Router();
