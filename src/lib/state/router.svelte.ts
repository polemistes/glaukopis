/**
 * Where in the application the user is. Kept in the URL fragment so that
 * back and forward work, and so that a place can be opened directly.
 */

export type MapMode = 'diagram' | 'text' | 'timeline';

export type Route =
  | { view: 'projects' }
  /** The owl map: all the projects, as the map above them; at a folder, where one was entered. */
  | { view: 'owl'; at?: string }
  | { view: 'library'; collection?: string; entry?: string }
  | { view: 'pictures'; picture?: string }
  /** The files of the library, in the library's place: the folder in view, and the file selected. */
  | { view: 'files'; folder?: string; file?: string }
  /** A project, and the element in view within it (ADR 0037): the project itself where none is named. */
  | { view: 'project'; project: string; at?: string; mode?: MapMode }
  | { view: 'search' }
  | { view: 'settings'; section?: string };

/**
 * A part of the place as it is written, decoded; as it is, where it is no
 * encoding, as a link pasted in with a stray `%`: the place is read from the
 * address at start, and a part that could not be read must not keep the
 * application from starting.
 */
function decoded(part: string): string {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
}

export function parseRoute(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
  const parts = path.split('/').filter(Boolean).map(decoded);
  const params = new URLSearchParams(query);
  switch (parts[0]) {
    case 'library':
      return {
        view: 'library',
        collection: params.get('collection') ?? undefined,
        entry: params.get('entry') ?? undefined,
      };
    case 'pictures':
      return { view: 'pictures', picture: params.get('picture') ?? undefined };
    case 'files':
      return {
        view: 'files',
        folder: params.get('folder') ?? undefined,
        file: params.get('file') ?? undefined,
      };
    case 'project':
      if (!parts[1]) return { view: 'projects' };
      return {
        view: 'project',
        project: parts[1],
        at: parts[2],
        mode: (['text', 'diagram', 'timeline'] as const).find((m) => m === params.get('mode')),
      };
    case 'owl':
      return parts[1] ? { view: 'owl', at: parts[1] } : { view: 'owl' };
    case 'settings':
      return { view: 'settings', section: parts[1] };
    case 'search':
      return { view: 'search' };
    default:
      return { view: 'projects' };
  }
}

export function formatRoute(route: Route): string {
  const e = encodeURIComponent;
  switch (route.view) {
    case 'projects':
      return '#/';
    case 'owl':
      return '#/owl' + (route.at ? `/${e(route.at)}` : '');
    case 'library': {
      const params = new URLSearchParams();
      if (route.collection) params.set('collection', route.collection);
      if (route.entry) params.set('entry', route.entry);
      const q = params.toString();
      return '#/library' + (q ? `?${q}` : '');
    }
    case 'pictures':
      return '#/pictures' + (route.picture ? `?picture=${e(route.picture)}` : '');
    case 'files': {
      const params = new URLSearchParams();
      if (route.folder) params.set('folder', route.folder);
      if (route.file) params.set('file', route.file);
      const q = params.toString();
      return '#/files' + (q ? `?${q}` : '');
    }
    case 'project': {
      let s = `#/project/${e(route.project)}`;
      if (route.at) s += `/${e(route.at)}`;
      if (route.mode) s += `?mode=${route.mode}`;
      return s;
    }
    case 'settings':
      return '#/settings' + (route.section ? `/${e(route.section)}` : '');
    case 'search':
      return '#/search';
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
