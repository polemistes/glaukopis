import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeWorker } from './fake-worker';
import { wasEnded, WorkerClient, WorkerError, type Answerer } from './worker-client';

type Question = { op: 'echo'; value: number } | { op: 'later'; value: number } | { op: 'refuse' } | { op: 'stall' };
type Told = { add: number } | { break: true };

/** What the fake worker does: it adds what it is told, and answers as asked. */
type Counter = Answerer<Question, Told> & { total: number; later: (() => void)[] };

function counter(): Counter {
  const later: (() => void)[] = [];
  return {
    total: 0,
    later,
    answer(q) {
      if (q.op === 'echo') return q.value + this.total;
      if (q.op === 'refuse') throw new Error('cannot do that');
      if (q.op === 'stall') return new Promise(() => {});
      return new Promise((resolve) => later.push(() => resolve(q.value)));
    },
    tell(m) {
      if ('break' in m) throw new Error('what it holds is broken');
      this.total += m.add;
    },
  };
}

function setup(options: { here?: boolean; timeout?: number } = {}) {
  const made: FakeWorker<Counter>[] = [];
  const faults: WorkerError[] = [];
  const client = new WorkerClient<Question, Told>({
    name: 'the counter',
    make: () => {
      const w = new FakeWorker(counter());
      made.push(w);
      return w as unknown as Worker;
    },
    here: options.here ? counter : undefined,
    timeout: options.timeout ?? 1000,
    onFault: (e) => faults.push(e),
  });
  return { client, made, faults };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

describe('the client of a worker', () => {
  let error: ReturnType<typeof vi.spyOn>;
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    error = vi.spyOn(console, 'error').mockImplementation(() => {});
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    error.mockRestore();
    warn.mockRestore();
    vi.useRealTimers();
  });

  it('answers each question by its number, in whatever order the answers come', async () => {
    const { client, made } = setup();
    client.tell({ add: 10 });
    const first = client.ask<number>({ op: 'later', value: 1 });
    const second = client.ask<number>({ op: 'echo', value: 2 });
    expect(await second).toBe(12);
    made[0].answerer.later[0]();
    expect(await first).toBe(1);
    expect(made).toHaveLength(1);
    expect(client.waiting).toBe(0);
  });

  it('fails a question the worker cannot answer, and goes on', async () => {
    const { client, made, faults } = setup();
    await expect(client.ask({ op: 'refuse' })).rejects.toMatchObject({
      failure: 'failed',
      message: 'cannot do that',
    });
    expect(await client.ask({ op: 'echo', value: 3 })).toBe(3);
    expect(made).toHaveLength(1);
    expect(faults).toEqual([]);
  });

  it('a worker that dies fails every question waiting, and the next goes to another', async () => {
    const { client, made, faults } = setup();
    expect(await client.ask({ op: 'echo', value: 0 })).toBe(0);
    const one = client.ask({ op: 'stall' });
    const two = client.ask({ op: 'later', value: 2 });
    await settle();
    const generation = client.generation;
    made[0].die('out of memory');
    await expect(one).rejects.toMatchObject({ failure: 'fault' });
    await expect(two).rejects.toThrow('the counter failed: out of memory (worker.ts:7)');
    expect(made[0].terminated).toBe(true);
    expect(faults).toHaveLength(1);
    expect(client.generation).toBeGreaterThan(generation);
    expect(error).toHaveBeenCalled();
    // Begun anew: what was told the dead one is lost, and the new one answers.
    client.tell({ add: 5 });
    expect(await client.ask({ op: 'echo', value: 1 })).toBe(6);
    expect(made).toHaveLength(2);
  });

  it('a worker that stalls fails what waits on it when the time is up, and is ended', async () => {
    vi.useFakeTimers();
    const { client, made, faults } = setup({ timeout: 5000 });
    const stalled = client.ask({ op: 'stall' });
    const behind = client.ask({ op: 'echo', value: 1 });
    const failures = Promise.allSettled([stalled, behind]);
    await vi.advanceTimersByTimeAsync(4999);
    expect(client.waiting).toBe(1);
    await vi.advanceTimersByTimeAsync(2);
    const [a, b] = await failures;
    // The question behind it was answered; the one that stalled was not.
    expect(b).toEqual({ status: 'fulfilled', value: 1 });
    expect(a).toMatchObject({ status: 'rejected', reason: { failure: 'timeout' } });
    expect((a as PromiseRejectedResult).reason.message).toBe('the counter did not answer in 5 s');
    expect(made[0].terminated).toBe(true);
    expect(faults.map((f) => f.failure)).toEqual(['timeout']);
    const after = client.ask<number>({ op: 'echo', value: 4 });
    await vi.advanceTimersByTimeAsync(1);
    expect(await after).toBe(4);
    expect(made).toHaveLength(2);
  });

  it('a question may be given a time of its own', async () => {
    vi.useFakeTimers();
    const { client } = setup({ timeout: 60_000 });
    const stalled = client.ask({ op: 'stall' }, { timeout: 100 });
    const failed = expect(stalled).rejects.toMatchObject({ failure: 'timeout' });
    await vi.advanceTimersByTimeAsync(101);
    await failed;
  });

  it('a worker that cannot be begun leaves the work to the window, for good', async () => {
    const { client, made, faults } = setup({ here: true });
    const asked = client.ask({ op: 'echo', value: 1 });
    // As a module that throws when it is loaded: an error before any answer.
    made[0].die('SyntaxError: unexpected token');
    await expect(asked).rejects.toMatchObject({ failure: 'fault' });
    expect(faults).toHaveLength(1);
    client.tell({ add: 2 });
    expect(await client.ask({ op: 'echo', value: 1 })).toBe(3);
    expect(made).toHaveLength(1);
    await expect(client.ask({ op: 'refuse' })).rejects.toMatchObject({ failure: 'failed' });
  });

  it('a worker that has begun and dies is begun anew, not given up', async () => {
    const { client, made } = setup({ here: true });
    const asked = client.ask({ op: 'stall' });
    await settle();
    // As one that runs out of memory over the first thing it is asked.
    made[0].die('out of memory');
    await expect(asked).rejects.toMatchObject({ failure: 'fault' });
    expect(await client.ask({ op: 'echo', value: 1 })).toBe(1);
    expect(made).toHaveLength(2);
  });

  it('a worker that cannot take what it is told fails what waits on it', async () => {
    const { client, faults } = setup();
    const waiting = client.ask({ op: 'stall' });
    client.tell({ break: true });
    await expect(waiting).rejects.toThrow('the counter failed: what it holds is broken');
    expect(faults).toHaveLength(1);
  });

  it('a message that cannot be read is a fault', async () => {
    const { client, made } = setup();
    const waiting = client.ask({ op: 'stall' });
    made[0].onmessageerror?.({} as MessageEvent);
    await expect(waiting).rejects.toMatchObject({ failure: 'fault' });
  });

  it('a question that cannot be sent fails alone', async () => {
    const { client, faults } = setup();
    const unsendable = { op: 'echo', value: () => 1 } as unknown as Question;
    const failed = client.ask(unsendable);
    await expect(failed).rejects.toMatchObject({ failure: 'unsent' });
    expect(await client.ask({ op: 'echo', value: 2 })).toBe(2);
    expect(faults).toEqual([]);
  });

  it('ended on purpose, it fails only what was asked of it, and answers what is asked after', async () => {
    const { client, made, faults } = setup();
    const before = client.ask({ op: 'later', value: 1 });
    await settle();
    client.end('begun anew');
    const caught = (await before.catch((e: unknown) => e)) as WorkerError;
    expect(wasEnded(caught)).toBe(true);
    expect(caught.message).toBe('begun anew');
    // The old worker's late answer reaches no one.
    made[0].answerer.later[0]?.();
    expect(await client.ask({ op: 'echo', value: 7 })).toBe(7);
    expect(made).toHaveLength(2);
    expect(made[0].terminated).toBe(true);
    expect(faults).toEqual([]);
    expect(error).not.toHaveBeenCalled();
  });

  it('closed, it ends its worker and answers nothing more', async () => {
    const { client, made } = setup();
    await client.ask({ op: 'echo', value: 1 });
    client.close();
    expect(made[0].terminated).toBe(true);
    await expect(client.ask({ op: 'echo', value: 1 })).rejects.toMatchObject({ failure: 'closed' });
    expect(made).toHaveLength(1);
  });

  it('where there is no worker, the window answers as the worker would', async () => {
    const client = new WorkerClient<Question, Told>({
      name: 'the counter',
      make: () => null,
      here: counter,
      timeout: 1000,
    });
    client.tell({ add: 1 });
    expect(await client.ask({ op: 'echo', value: 1 })).toBe(2);
    await expect(client.ask({ op: 'refuse' })).rejects.toBeInstanceOf(WorkerError);
    // What the window cannot take is a fault too, and the next beginning is fresh.
    const waiting = client.ask({ op: 'stall' });
    client.tell({ break: true });
    await expect(waiting).rejects.toMatchObject({ failure: 'fault' });
    expect(await client.ask({ op: 'echo', value: 1 })).toBe(1);
  });

  it('with neither a worker nor the window, a question fails at once', async () => {
    const client = new WorkerClient<Question, Told>({
      name: 'the counter',
      make: () => {
        throw new Error('no workers here');
      },
      timeout: 1000,
    });
    await expect(client.ask({ op: 'echo', value: 1 })).rejects.toMatchObject({ failure: 'fault' });
  });
});
