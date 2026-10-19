# The templates that come with the application

A template says what a document of its kind consists of: the parts in their
order, the kinds of elements and of passages it puts in hand, the layout and
the citation style it brings, what it requires, and the files it makes (ADR
0038). One JSON file each, named by its id; the fields are those of
`src/lib/api/templates.ts`.

`plain.json` is the root: a title page, the text, the notes and the
bibliography, no kinds, no requirements, the document output with every
target. Every other template names the one it is based on in `basedOn`, and
what a file leaves out is as its base has it; the core fills the chain in on
reading. The files here are written whole all the same, so that each can be
read on its own.

The generic ones are written by hand: `paper`, `article`, `book`, `thesis`,
`report`, `novel`, `novel-manuscript`, `short-story`, `story-collection`,
`play`, `screenplay`, `poems`, `news-article`, `blog-post` and `letter`.
Those that leave `layout` and `style` out take the writer's usual ones from
the settings. `paper` stands with the articles. The chooser ("What are you
writing?") shows the plain document alone at its top, as what every document
begins as, then the generic ones by their groups; the journals, the
publishers and the style guides are its second step, narrowed to those based
on the kind of text chosen, and found by its search whatever is chosen. The
layouts of fiction, stage and poetry bring no reference style: a document of
those kinds that cites does so in the writer's usual style.

The templates of the journals, the publishers and the style guides are made
from the format files of those kinds in `../formats/` by

    node scripts/templates-from-formats.mjs

which bases each on `article`, `book` or `paper`, names its format as its
layout and its style, and carries the format's limits as its requirements,
with `anonymous` as the format's title block has it. Where the research
notes in `docs/research/` say a journal wants no acknowledgements at
submission, no notes, or its notes after the references, the script says so
in a table at its head. The limits left the format files when the script
first ran, on 2026-10-11; since then the requirements are kept as the
template has them, so the script can be run again at any time, and changes
only what would differ. Do not edit the generated files by hand: change the
format, the base template or the script, and run it again.

    node scripts/check-templates.mjs

checks every file here: that it reads, that it uses only the fields there
are, only the generated parts and the kinds of the catalogue, only the kinds
of passage of ADR 0029, and that its base, its layout and its style exist.
