import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';
import type { Reference } from '$lib/api/library';
import type { FileSettlement, FoundWork, ProjectInfo } from '$lib/api/projects';
import { writeBody } from '$lib/project/model/blocks';
import { Project } from '$lib/project/model/project.svelte';
import { citedIds } from '$lib/project/model/rewrite-refs';
import { PROJECT, type RefRecord } from '$lib/project/model/types';

const api = vi.hoisted(() => ({
  projectFileRead: vi.fn(),
  projectFileReferences: vi.fn(),
  projectFileSettle: vi.fn(),
  projectFileWrite: vi.fn(),
  projectLoad: vi.fn(),
  projectSaveState: vi.fn(),
  projectDescribe: vi.fn(),
  libraryGetMany: vi.fn(),
  projects: {
    list: [] as ProjectInfo[],
    create: vi.fn(),
    put: vi.fn(),
    remove: vi.fn(),
    closed: vi.fn(),
  },
  library: { reload: vi.fn() },
}));

vi.mock('$lib/api/projects', async (original) => ({
  ...(await original<typeof import('$lib/api/projects')>()),
  projectFileRead: api.projectFileRead,
  projectFileReferences: api.projectFileReferences,
  projectFileSettle: api.projectFileSettle,
  projectFileWrite: api.projectFileWrite,
  projectLoad: api.projectLoad,
  projectSaveState: api.projectSaveState,
  projectDescribe: api.projectDescribe,
}));
vi.mock('$lib/api/library', async (original) => ({
  ...(await original<typeof import('$lib/api/library')>()),
  libraryGetMany: api.libraryGetMany,
}));
vi.mock('$lib/state/projects.svelte', () => ({ projects: api.projects }));
vi.mock('$lib/state/library.svelte', () => ({ library: api.library }));

import { fileName, freeName, given, makeFromFile, writeProjectFile } from './project-file';

const info = (id: string, name: string): ProjectInfo => ({
  id,
  name,
  description: '',
  created: '2026-01-01T00:00:00Z',
  modified: '2026-01-01T00:00:00Z',
  maps: [],
  words: 0,
  references: 0,
});

const record = (id: string, title: string): RefRecord => ({
  id,
  key: id,
  type: 'book',
  fields: { title },
  names: {},
  modified: '2026-01-01T00:00:00Z',
  authors: '',
  year: '',
  title,
  container: '',
});

const reference = (id: string, title: string): Reference => ({
  id,
  key: id,
  type: 'book',
  fields: { title },
  names: {},
  attachments: [],
  added: '2026-01-01T00:00:00Z',
  modified: '2026-01-02T00:00:00Z',
  summary: {
    id,
    key: id,
    type: 'book',
    authors: '',
    authorsSort: '',
    year: '',
    yearNumber: null,
    title,
    container: '',
    publisher: '',
    attachments: 0,
    hasNote: false,
    added: '',
    modified: '',
    search: '',
  },
  files: [],
  collections: [],
});

/** A project that cites r1 and r2 and shows a picture, as one written elsewhere. */
function state(): Uint8Array {
  const p = new Project(null);
  p.begin('Wrath');
  p.transact(() =>
    writeBody(p.fragment(PROJECT, 'body')!, [
      {
        kind: 'paragraph',
        content: [
          { kind: 'text', text: 'As ', marks: {} },
          { kind: 'citation', items: [{ id: 'r1' }, { id: 'r2' }], mode: 'normal' },
        ],
      },
      {
        kind: 'figure',
        id: 'f1',
        file: 'b'.repeat(64),
        extension: 'png',
        name: 'shield.png',
        caption: [],
        alt: '',
        width: 50,
        numbered: true,
      },
    ]),
  );
  p.putReference(record('r1', 'One, as the file has it'));
  p.putReference(record('r2', 'Two, as the file has it'));
  return Y.encodeStateAsUpdate(p.doc);
}

describe('names', () => {
  it('a project made of a file is given a name no project has', () => {
    expect(freeName('Wrath', ['Other'])).toBe('Wrath');
    expect(freeName(' Wrath ', ['wrath', 'Wrath (2)'])).toBe('Wrath (3)');
  });

  it('a file is named after its project, as every system allows', () => {
    expect(fileName('Wrath: on Achilles / book 1')).toBe('Wrath on Achilles book 1.glaukopis');
    expect(fileName('...')).toBe('project.glaukopis');
  });

  it('what is chosen where nothing is said', () => {
    const library = { key: 'k', type: 'book', authors: '', year: '', title: '', container: '' };
    expect(given({ kind: 'same' })).toBeNull();
    expect(given({ kind: 'new' })).toBeNull();
    expect(given({ kind: 'differs', library })).toBe('library');
    const alike = {
      kind: 'alike' as const,
      id: 'x',
      library,
      reasons: [],
      merged: false,
      gains: [],
    };
    expect(given({ ...alike, certainty: 'certain' })).toBe('cite');
    expect(given({ ...alike, certainty: 'probable' })).toBe('another');
  });
});

describe('a project file', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.projects.list = [info('a', 'Wrath')];
    api.projects.closed.mockResolvedValue(undefined);
  });

  it('is written with the works as the library has them, and the pictures of the figures', async () => {
    api.projectLoad.mockResolvedValue({ info: info('p', 'Wrath'), state: state(), updates: [] });
    // r2 the library has under another id, merged: the project's own record of it goes.
    api.libraryGetMany.mockResolvedValue([
      reference('r1', 'One, as the library has it'),
      reference('kept', 'Two'),
    ]);
    const flush = vi.fn().mockResolvedValue(undefined);
    await writeProjectFile(
      { ...info('p', 'Wrath'), description: 'On wrath' },
      '/x/Wrath.glaukopis',
      flush,
    );
    expect(flush).toHaveBeenCalled();
    expect(api.libraryGetMany).toHaveBeenCalledWith(['r1', 'r2']);
    const [path, writing, bytes] = api.projectFileWrite.mock.calls[0];
    expect(path).toBe('/x/Wrath.glaukopis');
    expect(writing.name).toBe('Wrath');
    expect(writing.description).toBe('On wrath');
    expect(writing.pictures).toEqual(['b'.repeat(64)]);
    const titles = Object.fromEntries(writing.records.map((r: RefRecord) => [r.id, r.title]));
    expect(titles).toEqual({ r1: 'One, as the library has it', r2: 'Two, as the file has it' });
    // The document written holds the records as they were written.
    const written = new Project(null);
    written.load(bytes, []);
    expect(written.refs.get('r1')!.title).toBe('One, as the library has it');
  });

  it('is made a new project, its citations written anew where the library has its works otherwise', async () => {
    api.projectFileRead.mockResolvedValue({
      manifest: { format: 1, name: 'Wrath', description: ' On wrath ', written: '', app: '' },
      pictures: 1,
      state: state(),
    });
    const lite = { key: 'k', type: 'book', authors: '', year: '', title: 'One', container: '' };
    const found: FoundWork[] = [
      {
        id: 'r1',
        file: lite,
        finding: {
          kind: 'alike',
          id: 'lib-1',
          library: lite,
          certainty: 'certain',
          reasons: ['doi'],
          merged: false,
          gains: [],
        },
      },
      { id: 'r2', file: lite, finding: { kind: 'new' } },
    ];
    api.projectFileReferences.mockResolvedValue(found);
    const settlement: FileSettlement = {
      settled: [
        { from: 'r1', to: 'lib-1', reference: reference('lib-1', 'One, as the library has it') },
        { from: 'r2', to: 'r2', reference: reference('r2', 'Two') },
      ],
      added: ['r2'],
      changed: [],
      problems: [],
    };
    api.projectFileSettle.mockResolvedValue(settlement);
    api.projects.create.mockResolvedValue(info('new', 'Wrath (2)'));
    api.projectSaveState.mockResolvedValue(info('new', 'Wrath (2)'));
    api.projectDescribe.mockResolvedValue({ ...info('new', 'Wrath (2)'), description: 'On wrath' });

    const ask = vi.fn().mockResolvedValue({ r1: 'cite' });
    const made = await makeFromFile('/x/Wrath.glaukopis', ask);

    expect(ask).toHaveBeenCalledWith('Wrath (2)', found);
    expect(api.projectFileReferences.mock.calls[0][0].map((r: RefRecord) => r.id)).toEqual([
      'r1',
      'r2',
    ]);
    expect(api.projectFileSettle.mock.calls[0][1]).toEqual({ r1: 'cite' });
    expect(api.projects.create).toHaveBeenCalledWith('Wrath (2)');
    const [id, bytes, summary] = api.projectSaveState.mock.calls[0];
    expect(id).toBe('new');
    expect(summary.name).toBe('Wrath (2)');
    expect(summary.cited.sort()).toEqual(['lib-1', 'r2']);
    const saved = new Project(null);
    saved.load(bytes, []);
    expect([...citedIds(saved)].sort()).toEqual(['lib-1', 'r2']);
    expect(saved.refs.get('lib-1')!.title).toBe('One, as the library has it');
    expect(saved.refs.has('r1')).toBe(false);
    expect(saved.tree().sequence).toEqual([PROJECT]);
    expect(saved.name).toBe('Wrath (2)');
    expect(api.projectDescribe).toHaveBeenCalledWith('new', 'On wrath');
    expect(api.library.reload).toHaveBeenCalled();
    expect(made).toMatchObject({ added: 1, pictures: 1, problems: [] });
    expect(made!.info.description).toBe('On wrath');
    expect(api.projects.put).toHaveBeenCalledWith(made!.info);
  });

  it('makes nothing where what was asked is not answered, and asks nothing where nothing is to be chosen', async () => {
    api.projectFileRead.mockResolvedValue({
      manifest: { format: 1, name: 'Notes', description: '', written: '', app: '' },
      pictures: 0,
      state: state(),
    });
    const lite = { key: 'k', type: 'book', authors: '', year: '', title: '', container: '' };
    api.projectFileReferences.mockResolvedValue([
      { id: 'r1', file: lite, finding: { kind: 'differs', library: lite } },
      { id: 'r2', file: lite, finding: { kind: 'same' } },
    ]);
    expect(await makeFromFile('/x/Notes.glaukopis', vi.fn().mockResolvedValue(null))).toBeNull();
    expect(api.projectFileSettle).not.toHaveBeenCalled();
    expect(api.projects.create).not.toHaveBeenCalled();

    api.projectFileReferences.mockResolvedValue([
      { id: 'r1', file: lite, finding: { kind: 'same' } },
      { id: 'r2', file: lite, finding: { kind: 'new' } },
    ]);
    api.projectFileSettle.mockResolvedValue({
      settled: [
        { from: 'r1', to: 'r1', reference: null },
        { from: 'r2', to: 'r2', reference: null },
      ],
      added: [],
      changed: [],
      problems: [],
    });
    api.projects.create.mockResolvedValue(info('n', 'Notes'));
    api.projectSaveState.mockRejectedValue(new Error('the disk is full'));
    api.projects.remove.mockResolvedValue(undefined);
    const ask = vi.fn();
    await expect(makeFromFile('/x/Notes.glaukopis', ask)).rejects.toThrow('the disk is full');
    expect(ask).not.toHaveBeenCalled();
    // What was made of it is not left behind.
    expect(api.projects.remove).toHaveBeenCalledWith('n');
  });
});
