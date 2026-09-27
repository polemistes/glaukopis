/** A question put to the user, answered by a promise. */

export interface Question {
  title: string;
  message?: string;
  confirm?: string;
  /** Empty for a message that leaves nothing to choose. */
  cancel?: string;
  danger?: boolean;
  /** A third choice, between cancel and confirm. */
  alternative?: string;
}

export type Answer = 'confirm' | 'alternative' | 'cancel';

class Confirmations {
  current = $state<(Question & { resolve: (answer: Answer) => void }) | null>(null);

  ask(question: Question): Promise<Answer> {
    this.current?.resolve('cancel');
    return new Promise((resolve) => {
      this.current = { ...question, resolve };
    });
  }

  answer(answer: Answer) {
    const q = this.current;
    this.current = null;
    q?.resolve(answer);
  }
}

export const confirmations = new Confirmations();

/** Resolves to true when the user confirms. */
export async function confirm(question: Question): Promise<boolean> {
  return (await confirmations.ask(question)) === 'confirm';
}

export function ask(question: Question): Promise<Answer> {
  return confirmations.ask(question);
}
