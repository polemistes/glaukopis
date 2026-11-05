# 0082 — The map spreads from the first element with several under it

Date: 2026-11-05. Status: proposed, awaiting the owner. From the owner's question of 2026-11-05 ("When laying out the tree in diagram view, the tree is always built from the end of the diagram bouble and outwards. No children build up or down, or backwards. This is a modus we want. But sometimes we want to build the tree more densely, and it could be an idea to use the space behind, and I think it should be possible to do that without making the tree difficult to read. What do you think?"), and the two screenshots of the owner's thesis that followed: the diagram as it is, and the same thesis arranged by hand around its book, of which the owner said "The second one here is a start, I guess." Amends 0077 (a closer map) in one rule of the layout; the behaviour of the diagram is otherwise as it was.

## Context

- **What the diagram does.** The element in view stands at the centre; its children are divided between its right and its left so that the two sides come out even in height; every branch grows away from the centre and keeps its side; the branches are packed by their outlines with ten pixels between (0077). A line always runs from the parent's outer edge to the child's inner edge, so that the parent of any element is the one nearer the centre: this is what makes the map readable without thought, and the owner wants it kept.
- **What the owner's first screenshot shows.** The project element has one child, the book, and the book has everything. The one child goes to the right, as a single branch does, and the whole thesis hangs to the right of it in one tall column while the left half of the canvas is empty: the map fits a pane of 1400 by 860 pixels at 49 %, with the boxes too small to read.
- **What the second shows.** The book in the middle with its parts around it: the introduction above, one part to the right, two parts up-left and down-left with their chapters growing left over and under the project element. Each branch keeps the direction it was given, and the whole fits the same pane at about 60 %, by the size of the boxes in the picture. The space the owner calls *behind* is the half of the canvas the one-child chain leaves empty.
- **What was measured**, with `diagram/layout.ts` as it is, on the owner's thesis as read from the first screenshot (84 elements) and on five shapes of tree, as the zoom at which the whole map fits a diagram pane of 1400 by 860 pixels:

  | Tree | To the sides, as now | The chain under the centre | Four directions |
  | --- | --- | --- | --- |
  | The owner's thesis, a project element over a book (84 elements) | 49 % | 71 % | 69 % |
  | A book of 3 parts, 4 chapters, 5 sections, under a project element (77) | 38 % | 55 % | 53 % |
  | The same book, the book itself in view (76) | 57 % | as now | 42 % |
  | One element with 20 leaves beside small branches (43) | 100 % | as now | 70 % |
  | Ten chapters of 1 to 15 sections (58) | 88 % | as now | 55 % |

  *The chain under the centre* is the rule decided below. *Four directions* is a layout in which the centre's two tallest branches stand above and below it, each spreading to both sides, and the rest to the sides as now: the closest a layout can come to the second screenshot by rule (see *Why not otherwise*). The height of a map is the number of its leaves times one row, on every shape: the packing of 0077 leaves no air between the rows (the map is 0 to 3 % taller than its leaves stacked), so that only what moves leaves beside each other, or fills an empty side, makes a map fit at a larger zoom.

## Decision

- **Where the element in view has one child, and that child has children of its own, the child stands under the element in view, and the map spreads from the child**: its children are divided between its two sides, as the centre's are, and every branch grows away from it as before. Where that child has one child again with children of its own, it stands under in turn: the chain of single elements is a column from the element in view downward, and the first element with several children, or with one that has nothing under it, is where the map spreads from. The line from an element to the one under it is a short vertical line, as the lines of the diagram are drawn between a box and one below it already.
- **A single child without children stands beside the element in view, as now**, so that the first element added to a new project does not stand under the project's name and then jump to its side when the second is added.
- **What the user put somewhere is as it was**: a single child dragged to a place is laid out from there, its branch growing away from its parent, and nothing stands under the centre. A single child folded away has nothing visible under it and stands beside the element in view.
- **The chain's elements and the children of the element the map spreads from are drawn as the first level** (bold, in the larger box), and what is under those as the levels below, so that the parts of a book look as they do when the book itself is in view. The element in view keeps its own look and its corner button, and the elements under it have theirs for entering.
- **Nothing else of the layout changes**: the sides are balanced, the branches packed, the keys move as before, the picture is drawn from the layout as before, and no setting is added. The rule holds for the element in view only: deeper down, a single child costs width and not height, and stands to the side as now.

## Choices made in writing this, which the owner has not been asked about

1. **The chain goes under the centre, not beside it.** The second screenshot has the book beside the project element, with two of the parts growing back over and under the project. By rule that needs the book's inner children to keep clear of the line from the project to the book, which attaches to the book's inner edge where those children attach too: the owner's picture manages it by hand because the book has no child on that side at its own height. A column under the centre has no such conflict, and the project's name stands over its book as a title does.
2. **A single leaf stays beside**, for the first element of a new project (above).
3. **A single child the user placed is laid out from there, one-sided**, as any placed element is; the chain is of what flows.
4. **28 pixels** between an element and the one under it.
5. **The look follows the element the map spreads from**: its children are the first level. The chain's own elements are drawn as the first level too.
6. **No setting.** The rule is right whenever it applies; a writer who wants the book beside the project drags it there.
7. **The four-direction layout is not built.** On the thesis it gives nothing over the chain; on every tree whose centre has several children it is worse, since bands above and below the centre add height instead of filling an empty side. See the table.

## Why not otherwise

- **Not branches growing backwards, towards the centre.** The one rule that lets a reader tell the parent from the child at a glance is that the parent is nearer the centre; once a line can run either way, every line has to be followed. Every mind-map program allows it at the root only, which this diagram does already, with its two sides.
- **Not a radial layout**, each branch in a slice of the directions around the centre: the boxes are horizontal text and cannot turn, so a branch sent upward stacks its boxes in a column beside its line with the lines of its siblings crossing them, and the rings near the centre are too short for the first level's boxes. Radial layouts are for dots, not for names.
- **Not several two-sided hubs above or below the centre.** A hub reached from the centre has children on both sides at its own height, a band as wide as both its subtrees; a second hub beyond it can be reached only through that band. The second screenshot avoids it by hand with one hub up-left and one down-left, each with one side nearly empty.
- **Not a spine**, a vertical line from the centre through a column of two-sided hubs: dense, but the segment between two hubs reads as one being under the other, which it is not.
- **Not leaves in two columns, yet.** A run of leaves under one element, laid out in two columns as a block, is the one change that lowers a map on every shape: measured by halving the runs, the book of 3 × 4 × 5 fits at 93 % where it fits at 57 %, the ten chapters at 100 % where they fit at 88 %, and the thesis at 96 % on a pane of 1920 by 1000 where the chain alone gives 82 % (at 1400 by 860 the thesis gains nothing, the map growing wider as it grows lower). It is a change to what a line means, since the second column's leaves can have no line of their own to the element, and to the keys, the dragging and the picture, and it is not what the owner asked about. It is here as the next step if the owner wants more, with its numbers.

## Consequences

- `diagram/layout.ts`: the chain found from the element in view, each of its elements placed under the one before with `CHAIN_GAP` between, the sides balanced about the element the chain ends at; `Placed.level` beside `depth`, the level the box is drawn as; tests of a chain of one and of two, of a single leaf, of a placed and a folded single child, of the levels, and the check that no line passes through a box on a tree with a chain.
- `diagram/DiagramNode.svelte` and `diagram/picture.ts`: the look by `level`, the buttons by `depth`.
- The guide's *The diagram*: a sentence on where a single element stands.
- The scripts of the diagram (`maps`, `keys`, `tree-keys`, `folding`, `placing`, `map-icons`, `diagram-picture`, `mindmaps`, `the-document`, `numbers`), run; where one assumed the place of a single child, the script's assumption is mended, not the rule.
