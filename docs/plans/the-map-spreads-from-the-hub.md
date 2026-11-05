# Build plan: the map spreads from the first element with several under it

The working plan for `docs/adr/0082-the-map-spreads-from-the-hub.md`. Read the record first, in full: it says what and why; this says how, in which files, with which interfaces, and how it is verified. Where they disagree, the record wins; say so in your report. Read `CLAUDE.md` (the map of the code, the checks, how the code is written) and `docs/plans/the-shape-of-a-text-and-its-org-form.md`, section "How to work", which holds here too: plain words; never a record number when writing for the owner; verify before you commit; edit then format; e2e with `timeout`, processes ended by PID only; commit when a stage is whole, never push; report the counts. Commit at the end of every stage: work that is not committed is lost when the session is.

Read before you begin: `docs/adr/0077-a-closer-map.md` (how the branches are packed; the look of the levels), `src/lib/project/diagram/layout.ts` in full (`layout`: `visibleChildren`, `flowing`, `stack`, `settle`, `branch`, the block "Around the element in view" with `balance`, `place`; `Placed`; `hierarchyLine`, which already draws a line between a box and one below it; `neighbour`), `layout.test.ts` (`make`, `overlaps`, `crossings`, the trees of every shape at the end), `contour.ts` (its head comment), `DiagramNode.svelte` (the class of the node at about 139, `class:root`, the corner buttons at about 265–300, the styles `.node.depth-1` and `.node.depth-2`), `picture.ts` (grep `depth`: wherever the look of a box follows its depth), `MapDiagram.svelte` (the layouts at about 197 and 220; the side of a drop at about 595), `keys.ts` (about 113–130: Alt with the arrows, `outwards` by `placed.side`), `docs/guide.md` *The diagram* (the paragraph beginning "The element in view stands at the centre of the map"), and the first comment of each of `e2e/maps.mjs`, `keys.mjs`, `tree-keys.mjs`, `folding.mjs`, `placing.mjs`, `map-icons.mjs`, `diagram-picture.mjs`, `mindmaps.mjs`, `the-document.mjs`, `numbers.mjs`.

## Vocabulary

- *The element in view*: `tree.root` in the layout, `at` elsewhere; it stands at the origin.
- *The chain*: the elements under the element in view, each the single visible flowing child of the one before and each with visible children of its own; a column downward from the origin. Empty where the element in view has several children, none, one that is placed, folded or without children.
- *The hub*: the last element of the chain, or the element in view where the chain is empty; what the sides are balanced about and the branches grow away from.
- *Depth*: how many steps from the element in view, as today; the buttons go by it.
- *Level*: how deep a box is drawn: 0 the element in view; 1 the chain's elements and the hub's children; 2 and more below.

## Stage 1 — the layout

Files: `src/lib/project/diagram/layout.ts`, `layout.test.ts`, `DiagramNode.svelte`, `picture.ts`, `docs/guide.md`.

1. `layout.ts`: `export const CHAIN_GAP = 28;` with its comment ("Between the element in view and the single element that stands under it"). `Placed.level: number` with its comment. In `layout()`, after `flowing` and before the branches:

   ```ts
   // The chain: from the element in view down through single children that
   // have children of their own, each standing under the one before. The
   // last, the hub, is what the map spreads from (record 0082).
   const chain: string[] = [];
   let hub = tree.root;
   for (;;) {
     const kids = flowing(hub);
     if (kids.length !== 1 || visibleChildren(hub).length !== 1 || !visibleChildren(kids[0]).length) break;
     chain.push(kids[0]);
     hub = kids[0];
   }
   let above = tree.root;
   for (const id of chain) {
     rel.set(id, { x: 0, y: size(above).h / 2 + CHAIN_GAP + size(id).h / 2 });
     above = id;
   }
   ```

   The condition reads: the element has exactly one visible child, that child flows (is not placed), and that child has visible children (so a leaf, and a folded element, end the chain before themselves). The block "Around the element in view" then works on `hub` where it works on `root`: `visibleChildren(hub)`, `size(hub)`, the `occupied` of its placed children, `settle(hs, …)`. `place` needs no change for the chain: a chain element has `rel` with `x: 0`, and `to === 'right' ? x + r.x : x - r.x` leaves it in the column; its side is inherited, `'right'`. Add `level` where `placed.set` is: `depth === 0 ? 0 : chainSet.has(id) ? 1 : depth - chain.length`, with `chainSet = new Set(chain)`. Check it on paper: the hub's children have depth `chain.length + 1`, level 1; the hub, in the chain, level 1; with no chain, level is depth.

   Keep the head comment of the file true: add the chain to it in two sentences.

2. `layout.test.ts`, new cases in `describe('the layout of a map')`:
   - *a single child with children of its own stands under the element in view, and its children go to both sides*: `r → a → {b, c}`; `a` at `x: 0`, `y: 20 + 28 + 20`; `b` right of `a` at `a.y`, `c` left; `level` of `a`, `b`, `c` is 1; `depth` of `a` is 1, of `b` 2.
   - *a chain of two*: `r → a → b → {c, d}`; `b` under `a`; `c` and `d` beside `b`; levels 1, 1, 1, 1; `e` under `c` level 2.
   - *a single leaf stays beside*: `r → a`; `a` right of `r` as the first test has it.
   - *a placed single child is laid out from its place, one-sided*: `a` with `pos: { x: -200, y: 0 }` and children; `a` at `(-200, 0)`, its children to its left; `r` with nothing under it.
   - *a folded single child stands beside*: `a` collapsed with children; `a` right of `r`, `hidden` as before.
   - *the hub's placed children count on their side*: as the existing test of placed children does, with a chain of one before the hub.
   - *nothing crosses on a tree with a chain*: the `crossings` and `overlaps` checks on the large tree of the existing test with a project element put over it.
   - `neighbour(l, 'r', 'down')` is `a` in the first case, and `'up'` from `a` is `r`.
   - `hierarchyLine(r, a)` is vertical: from `r`'s bottom to `a`'s top.

3. `DiagramNode.svelte`: `class="node depth-{Math.min(placed.level, 2)} {placed.side}"`; `class:root={placed.depth === 0}` and the corner buttons stay by `depth`. `picture.ts`: where the look of a box is chosen by `depth`, choose it by `level`; the buttons and the comments are not drawn there anyway. Grep `depth` in both and in `MapDiagram.svelte` for any other use that means the look (the font sizes of the picture, `fonts.ts`); leave the uses that mean the steps.

4. `docs/guide.md`, *The diagram*, after "…and an element stands midway between its first child and its last. From the second level down the boxes are smaller.": "Where the element in view has one thing under it with things of its own, that stands under it, and the map spreads from there: a project that is one book is laid out about the book, with the project's name over it."

Verify: `pnpm format`, `pnpm check`, `pnpm test`. Then `pnpm e2e:build` and, one at a time, `timeout 300 node e2e/<name>.mjs > <log> 2>&1` for `maps`, `keys`, `tree-keys`, `folding`, `placing`, `map-icons`, `diagram-picture`, `mindmaps`, `the-document`, `numbers`. Look at the screenshots. Where a script fails because it took the single child's place for granted (an arrow key pressed towards where it stood, a click at a place), mend the script's assumption and say which; where it fails for another reason, stop and report. A screenshot of a project with one book in view, as the owner's thesis is, goes in the report: `e2e/maps.mjs` or a new short script `e2e/chain.mjs` that makes a project, one element under it with three under that, and checks the one stands under the project and the three to both sides, with a screenshot. Commit.

## Stage 2 — the record

Add *As built* to the record: the counts, what was mended in the scripts, the zoom at which the test project fits, and anything the build found the record wrong about. Update the records index (`docs/adr/README.md`): 0082 holds; 0077 holds in part (its layout gains the chain). Commit.
