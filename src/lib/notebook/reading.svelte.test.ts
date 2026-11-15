import { beforeEach, describe, expect, it, vi } from 'vitest';

const HASH = 'a'.repeat(64);
const OTHER = 'b'.repeat(64);
const DRAWING = 'c'.repeat(64);

const api = vi.hoisted(() => ({
  ocrPicture: vi.fn(),
  ocrTry: vi.fn(),
  ocrStop: vi.fn(() => Promise.resolve()),
  notebookFile: vi.fn(),
  tools: { tesseract: '5.5.0', ocrLanguages: ['eng', 'nor'] } as {
    tesseract: string | null;
    ocrLanguages: string[];
  } | null,
}));
vi.mock('$lib/api/ocr', async (original) => ({
  ...(await original<typeof import('$lib/api/ocr')>()),
  ocrPicture: api.ocrPicture,
  ocrTry: api.ocrTry,
  ocrStop: api.ocrStop,
}));
vi.mock('$lib/api/notebook', async (original) => ({
  ...(await original<typeof import('$lib/api/notebook')>()),
  notebookFile: api.notebookFile,
}));
vi.mock('$lib/ocr/reader.svelte', () => ({
  reader: {
    load: () => Promise.resolve(api.tools),
    first: () => (api.tools?.ocrLanguages.length ? [api.tools.ocrLanguages[0]] : []),
  },
}));
vi.mock('$lib/ui/toast.svelte', () => ({ notifyError: vi.fn(), notifyOk: vi.fn() }));

const { imageReading, imagesOf, textOfTried } = await import('./reading.svelte');
const { Notebook } = await import('./model/notebook.svelte');
const { notifyError, notifyOk } = await import('$lib/ui/toast.svelte');

/** What the reading of a picture by its hash gives: paragraphs of words. */
const imported = (...paragraphs: string[]) => ({
  title: 'sign',
  sections: [
    {
      blocks: paragraphs.map((words) => ({
        kind: 'paragraph',
        content: [{ kind: 'text', text: words, marks: {} }],
      })),
    },
  ],
});

const backendError = (kind: string) => ({ kind, message: kind });

function withImages() {
  const nb = new Notebook();
  const one = nb.addNote();
  nb.addFigure(one, { hash: HASH, name: 'sign.png', extension: 'png' });
  const two = nb.addNote();
  nb.addFigure(two, { hash: OTHER, name: 'board.jpg', extension: 'jpg' });
  nb.addFigure(two, { hash: HASH, name: 'sign.png', extension: 'png' });
  nb.addFigure(two, { hash: DRAWING, name: 'plan.svg', extension: 'svg' });
  return { nb, one, two };
}

beforeEach(() => {
  vi.clearAllMocks();
  api.tools = { tesseract: '5.5.0', ocrLanguages: ['eng', 'nor'] };
});

describe('the images of notes', () => {
  it('are those a reading can read, each once, in the order they stand', () => {
    const { nb, one, two } = withImages();
    expect(imagesOf([nb.note(one)!, nb.note(two)!])).toEqual([
      { hash: HASH, name: 'sign.png' },
      { hash: OTHER, name: 'board.jpg' },
    ]);
  });
});

describe('reading the text of images', () => {
  it('reads each image in the languages chosen, and keeps what was read for finding', async () => {
    const { nb, one, two } = withImages();
    api.ocrPicture.mockImplementation((hash: string) =>
      Promise.resolve(hash === HASH ? imported('To the', 'Pnyx') : imported('Agora')),
    );
    const images = imagesOf([nb.note(one)!, nb.note(two)!]);
    expect(await imageReading.read(nb, images)).toBe(2);
    expect(api.ocrPicture).toHaveBeenCalledTimes(2);
    expect(api.ocrPicture.mock.calls[0][1]).toEqual(
      expect.objectContaining({ languages: ['eng'], text: 'keep', shape: false }),
    );
    expect(nb.files.get(HASH)!.text).toBe('To the\nPnyx');
    expect(
      nb
        .find('pnyx')
        .map((n) => n.id)
        .sort(),
    ).toEqual([one, two].sort());
    expect(nb.find('agora').map((n) => n.id)).toEqual([two]);
    expect(notifyOk).toHaveBeenCalled();
    expect(imageReading.busy).toBe(false);
  });

  it('reads an image the library does not list by its place in the store', async () => {
    const { nb, one } = withImages();
    api.ocrPicture.mockRejectedValue(backendError('not-found'));
    api.notebookFile.mockResolvedValue({ hash: HASH, path: `files/${HASH}.png` });
    api.ocrTry.mockResolvedValue({
      paragraphs: [
        [
          { text: 'To', line: true },
          { text: 'the', line: false },
          { text: 'Pnyx', line: true },
        ],
      ],
    });
    expect(await imageReading.read(nb, imagesOf([nb.note(one)!]))).toBe(1);
    expect(api.ocrTry).toHaveBeenCalledWith(
      `files/${HASH}.png`,
      true,
      1,
      expect.objectContaining({ languages: ['eng'] }),
      expect.any(String),
    );
    expect(nb.files.get(HASH)!.text).toBe('To the\nPnyx');
  });

  it('says that Tesseract is not installed, and reads nothing', async () => {
    const { nb, one } = withImages();
    api.tools = { tesseract: null, ocrLanguages: [] };
    expect(await imageReading.read(nb, imagesOf([nb.note(one)!]))).toBe(0);
    expect(notifyError).toHaveBeenCalledWith(
      expect.stringContaining('Tesseract, which reads text in images, is not installed'),
    );
    expect(api.ocrPicture).not.toHaveBeenCalled();
    expect(nb.files.get(HASH)!.text).toBeUndefined();
  });

  it('says that Tesseract has no language, and reads nothing', async () => {
    const { nb, one } = withImages();
    api.tools = { tesseract: '5.5.0', ocrLanguages: [] };
    expect(await imageReading.read(nb, imagesOf([nb.note(one)!]))).toBe(0);
    expect(notifyError).toHaveBeenCalledWith(
      expect.stringContaining('Tesseract has no data for any language'),
    );
    expect(api.ocrPicture).not.toHaveBeenCalled();
  });

  it('stops: the image being read is let go, and those after it are not read', async () => {
    const { nb, one, two } = withImages();
    let release: (value: unknown) => void = () => {};
    api.ocrPicture.mockImplementationOnce(() => new Promise((r) => (release = r)));
    const reading = imageReading.read(nb, imagesOf([nb.note(one)!, nb.note(two)!]));
    await vi.waitFor(() => expect(imageReading.now).not.toBeNull());
    expect(imageReading.now).toEqual({ name: 'sign.png', done: 0, count: 2 });
    imageReading.stop();
    expect(api.ocrStop).toHaveBeenCalled();
    release(imported('Late'));
    expect(await reading).toBe(0);
    expect(api.ocrPicture).toHaveBeenCalledTimes(1);
    expect(nb.files.get(HASH)!.text).toBeUndefined();
    expect(imageReading.busy).toBe(false);
  });

  it('says what could not be read, and goes on with the rest', async () => {
    const { nb, one, two } = withImages();
    api.ocrPicture
      .mockRejectedValueOnce(backendError('failed'))
      .mockResolvedValueOnce(imported('Agora'));
    expect(await imageReading.read(nb, imagesOf([nb.note(one)!, nb.note(two)!]))).toBe(1);
    expect(notifyError).toHaveBeenCalledWith(
      'The text of sign.png could not be read',
      expect.anything(),
    );
    expect(nb.files.get(OTHER)!.text).toBe('Agora');
  });

  it('reads nothing by itself', () => {
    withImages();
    expect(api.ocrPicture).not.toHaveBeenCalled();
    expect(api.ocrTry).not.toHaveBeenCalled();
  });
});

describe('the words of a picture tried', () => {
  it('are its lines as Tesseract found them', () => {
    expect(
      textOfTried({
        paragraphs: [
          [
            { text: 'One', line: true },
            { text: 'two', line: false },
          ],
          [{ text: 'Three', line: true }],
        ],
      } as never),
    ).toBe('One two\nThree');
  });
});
