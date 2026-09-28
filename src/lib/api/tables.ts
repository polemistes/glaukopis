/** Tables that are brought in from files. Mirrors `commands/tables.rs`. */

import { call } from './backend';

/** A sheet of a file, or the one table a file of text holds. */
export interface Sheet {
  /** What the sheet is called. Of a file of text, what the file is called, without its ending. */
  name: string;
  /** The values, row by row, as they are shown. Every row is as long as the longest. */
  rows: string[][];
  /** Why the sheet cannot become a table, when it cannot: it has no rows then. */
  problem?: string;
}

/**
 * Reads the tables of a file. Of one that was dropped it is not sure that
 * it holds a table: text (`.txt`) is then a table only where tabs part its
 * values.
 */
export const tableRead = (path: string, dropped = false) =>
  call<Sheet[]>('table_read', { path, dropped });
