/** Mathematics as it is shown where it is written. Mirrors `commands/math.rs`. */

import { call } from './backend';

export interface Formula {
  tex: string;
  display: boolean;
}

export interface Rendered {
  mathml: string | null;
  problem: string | null;
}

export const mathRender = (formulas: Formula[]) => call<Rendered[]>('math_render', { formulas });
