/**
 * Grid tables (ADR 0041, "Formulas, figures, tables"), as Org's table
 * package (table.el) and Pandoc read them: a table whose cells hold more
 * than one line, or more than one paragraph, or that span rows or columns.
 *
 *     +------------+-----------+
 *     | Heading    | Heading   |
 *     +============+===========+
 *     | A cell of  | spans two |
 *     | two lines  | rows      |
 *     +------------+           |
 *     | another    |           |
 *     +------------+-----------+
 *
 * The rule of `=` is under the heading rows. Widths are counted in signs,
 * a letter outside the basic plane being one, so that what is written is
 * read back by the same count.
 */

/** A cell as the grid has it: where it begins, how far it reaches, and its lines. */
export interface GridCell {
  row: number;
  col: number;
  rowspan: number;
  colspan: number;
  lines: string[];
  /** Whether it stands above the rule of `=`. */
  header: boolean;
}

const width = (s: string) => Array.from(s).length;

/**
 * The lines of a grid table. `rows` are the cells that begin in each row,
 * left to right, as a table holds them; `headerRows` how many rows stand
 * above the rule of `=`.
 */
export function writeGrid(
  rows: { lines: string[]; rowspan: number; colspan: number }[][],
  headerRows: number,
): string[] {
  // Where each cell stands: the first column free in its row.
  const taken: boolean[][] = [];
  const cells: GridCell[] = [];
  rows.forEach((row, r) => {
    let c = 0;
    for (const cell of row) {
      while (taken[r]?.[c]) c++;
      const rowspan = Math.max(1, Math.min(cell.rowspan, rows.length - r));
      const colspan = Math.max(1, cell.colspan);
      for (let y = r; y < r + rowspan; y++)
        for (let x = c; x < c + colspan; x++) (taken[y] ??= [])[x] = true;
      cells.push({ row: r, col: c, rowspan, colspan, lines: cell.lines, header: r < headerRows });
      c += colspan;
    }
  });
  const ncols = Math.max(1, ...taken.map((row) => row?.length ?? 0));
  const nrows = rows.length;

  // The widths of the columns and the heights of the rows, spanning cells last.
  const widths = Array.from({ length: ncols }, () => 3);
  const heights = Array.from({ length: nrows }, () => 1);
  const need = (cell: GridCell) => Math.max(1, ...cell.lines.map(width)) + 2;
  for (const cell of [...cells].sort((a, b) => a.colspan - b.colspan)) {
    const have =
      widths.slice(cell.col, cell.col + cell.colspan).reduce((a, b) => a + b, 0) + cell.colspan - 1;
    if (need(cell) > have) widths[cell.col + cell.colspan - 1] += need(cell) - have;
  }
  for (const cell of [...cells].sort((a, b) => a.rowspan - b.rowspan)) {
    const have =
      heights.slice(cell.row, cell.row + cell.rowspan).reduce((a, b) => a + b, 0) +
      cell.rowspan -
      1;
    const lines = Math.max(1, cell.lines.length);
    if (lines > have) heights[cell.row + cell.rowspan - 1] += lines - have;
  }
  const xs = [0];
  for (const w of widths) xs.push(xs[xs.length - 1] + w + 1);
  const ys = [0];
  for (const h of heights) ys.push(ys[ys.length - 1] + h + 1);

  const canvas = Array.from({ length: ys[nrows] + 1 }, () =>
    Array.from({ length: xs[ncols] + 1 }, () => ' '),
  );
  const ruleAt = headerRows > 0 && headerRows <= nrows ? ys[headerRows] : -1;
  for (const cell of cells) {
    const x0 = xs[cell.col];
    const x1 = xs[cell.col + cell.colspan];
    const y0 = ys[cell.row];
    const y1 = ys[cell.row + cell.rowspan];
    for (let x = x0 + 1; x < x1; x++) {
      canvas[y0][x] = y0 === ruleAt ? '=' : '-';
      canvas[y1][x] = y1 === ruleAt ? '=' : '-';
    }
    for (let y = y0 + 1; y < y1; y++) {
      canvas[y][x0] = '|';
      canvas[y][x1] = '|';
    }
  }
  for (const cell of cells) {
    const x0 = xs[cell.col];
    const x1 = xs[cell.col + cell.colspan];
    const y0 = ys[cell.row];
    const y1 = ys[cell.row + cell.rowspan];
    for (const [y, x] of [
      [y0, x0],
      [y0, x1],
      [y1, x0],
      [y1, x1],
    ])
      canvas[y][x] = '+';
    // The cell's inside is its own, rules of the rows it spans and all.
    for (let y = y0 + 1; y < y1; y++) for (let x = x0 + 1; x < x1; x++) canvas[y][x] = ' ';
    cell.lines.forEach((line, k) => {
      Array.from(line).forEach((c, n) => {
        canvas[y0 + 1 + k][x0 + 2 + n] = c;
      });
    });
  }
  return canvas.map((row) => row.join('').trimEnd());
}

/**
 * The cells of a grid table from its lines; nothing where the lines are no
 * grid table. Each cell's lines lose the space after the rule on their left
 * and the spaces at their end; blank lines at the end of a cell go.
 */
export function readGrid(lines: string[]): GridCell[] | null {
  const rows = lines.map((l) => Array.from(l.trimEnd()));
  const at = (y: number, x: number) => rows[y]?.[x] ?? '';
  if (at(0, 0) !== '+') return null;
  const done = new Set<string>();
  const corners: [number, number][] = [[0, 0]];
  const found: { y0: number; x0: number; y1: number; x1: number }[] = [];

  /** The cell whose corner at the top left is at `y0, x0`: the smallest rectangle that closes. */
  const scan = (y0: number, x0: number) => {
    for (let x1 = x0 + 1; x1 < rows[y0].length; x1++) {
      const c = at(y0, x1);
      if (c !== '-' && c !== '=' && c !== '+') return null;
      if (c !== '+') continue;
      for (let y1 = y0 + 1; y1 < rows.length; y1++) {
        const d = at(y1, x1);
        if (d !== '|' && d !== '+') break;
        if (d !== '+') continue;
        // The bottom and the left side must close.
        let ok = true;
        for (let x = x1 - 1; x > x0 && ok; x--) ok = '-=+'.includes(at(y1, x)) && at(y1, x) !== '';
        for (let y = y1 - 1; y > y0 && ok; y--) ok = '|+'.includes(at(y, x0)) && at(y, x0) !== '';
        if (ok && at(y1, x0) === '+') return { y0, x0, y1, x1 };
      }
    }
    return null;
  };

  while (corners.length) {
    const [y0, x0] = corners.shift()!;
    const key = `${y0},${x0}`;
    if (done.has(key)) continue;
    done.add(key);
    if (y0 >= rows.length - 1) continue;
    const cell = scan(y0, x0);
    if (!cell) continue;
    found.push(cell);
    corners.push([cell.y0, cell.x1], [cell.y1, cell.x0]);
  }
  if (!found.length) return null;

  const xs = [...new Set(found.flatMap((c) => [c.x0, c.x1]))].sort((a, b) => a - b);
  const ys = [...new Set(found.flatMap((c) => [c.y0, c.y1]))].sort((a, b) => a - b);
  // The rule of `=`: the first line of borders that has one.
  const ruleY = ys.find((y) => rows[y].includes('='));
  const out: GridCell[] = found.map((c) => {
    const inner: string[] = [];
    for (let y = c.y0 + 1; y < c.y1; y++) {
      let line = rows[y]
        .slice(c.x0 + 1, c.x1)
        .join('')
        .trimEnd();
      if (line.startsWith(' ')) line = line.slice(1);
      inner.push(line);
    }
    while (inner.length && !inner[inner.length - 1]) inner.pop();
    return {
      row: ys.indexOf(c.y0),
      col: xs.indexOf(c.x0),
      rowspan: ys.indexOf(c.y1) - ys.indexOf(c.y0),
      colspan: xs.indexOf(c.x1) - xs.indexOf(c.x0),
      lines: inner,
      header: ruleY !== undefined && c.y1 <= ruleY,
    };
  });
  return out.sort((a, b) => a.row - b.row || a.col - b.col);
}
