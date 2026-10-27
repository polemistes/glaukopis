/**
 * Where in the application the user is. Kept in the URL fragment so that
 * back and forward work, and so that a place can be opened directly.
 */

export type MapMode = 'diagram' | 'text' | 'timeline';

export type Route =
  /** The start screen, while no project is open (ADR 0063). */
  | { view: 'home' }
  | { view: 'library'; collection?: string; entry?: string }
  /** The files of the library, in the library's place: the folder in view, and the file selected. */
  | { view: 'files'; folder?: string; file?: string }
  /** A project, and the element in view within it (ADR 0037): the project itself where none is named. */
  | { view: 'project'; project: string; at?: string; mode?: MapMode }
  /** A file of the library shown in a side of the window (ADR 0069), at a page. */
  | { view: 'file'; file: string; page?: number }
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
    // The images had a view of their own; they are files of the library now (ADR 0070).
    case 'pictures':
      return params.get('picture')
        ? { view: 'files', file: params.get('picture') ?? undefined }
        : { view: 'files' };
    case 'files':
      return {
        view: 'files',
        folder: params.get('folder') ?? undefined,
        file: params.get('file') ?? undefined,
      };
    case 'project':
      if (!parts[1]) return { view: 'home' };
      return {
        view: 'project',
        project: parts[1],
        at: parts[2],
        mode: (['text', 'diagram', 'timeline'] as const).find((m) => m === params.get('mode')),
      };
    case 'file': {
      if (!parts[1]) return { view: 'home' };
      const page = Number(params.get('page'));
      return {
        view: 'file',
        file: parts[1],
        page: Number.isInteger(page) && page > 0 ? page : undefined,
      };
    }
    case 'settings':
      return { view: 'settings', section: parts[1] };
    case 'search':
      return { view: 'search' };
    default:
      // The start screen, as `#/`; and the old places of the home, `#/owl` and
      // `#/projects`, and anything not known.
      return { view: 'home' };
  }
}

export function formatRoute(route: Route): string {
  const e = encodeURIComponent;
  switch (route.view) {
    case 'home':
      return '#/';
    case 'library': {
      const params = new URLSearchParams();
      if (route.collection) params.set('collection', route.collection);
      if (route.entry) params.set('entry', route.entry);
      const q = params.toString();
      return '#/library' + (q ? `?${q}` : '');
    }
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
    case 'file':
      return `#/file/${e(route.file)}` + (route.page ? `?page=${route.page}` : '');
    case 'settings':
      return '#/settings' + (route.section ? `/${e(route.section)}` : '');
    case 'search':
      return '#/search';
  }
}

class Router {
  route = $state<Route>(parseRoute(typeof location === 'undefined' ? '' : location.hash));
  /**
   * The project shown last while the application has run, at its element and
   * in its view, or the file shown last in a side of the window: where the
   * house in the rail goes back to. None once it is closed.
   */
  lastProject = $state<Extract<Route, { view: 'project' } | { view: 'file' }> | null>(null);

  constructor() {
    this.#follow(this.route);
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', () => {
        this.route = parseRoute(location.hash);
        this.#follow(this.route);
      });
    }
  }

  #follow(route: Route) {
    if (route.view === 'project' || route.view === 'file') this.lastProject = route;
  }

  /** The project shown last was closed: the house goes to the start screen. */
  forgetProject(id?: string) {
    const last = this.lastProject;
    if (!id || (last?.view === 'project' && last.project === id)) this.lastProject = null;
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
    this.#follow(route);
  }
}

export const router = new Router();
